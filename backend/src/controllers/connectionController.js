import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import { encrypt, decrypt } from '../utils/encryption.js';
import { testConnection } from '../utils/supabaseClient.js';
import cache from '../utils/cache.js';

/**
 * @route   POST /api/connections/add
 * @desc    Add a new database connection
 * @access  Private
 */
export const addConnection = [
  // Validation rules
  body('nickname')
    .trim()
    .notEmpty()
    .withMessage('Connection nickname is required'),
  body('supabaseUrl')
    .trim()
    .matches(/^https:\/\/.+\.supabase\.co$/)
    .withMessage('Invalid Supabase URL format'),
  body('supabaseAnonKey')
    .trim()
    .notEmpty()
    .withMessage('Supabase Anon Key is required'),
  body('supabaseServiceRoleKey')
    .optional()
    .trim(),

  // Controller logic
  async (req, res, next) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array().map(err => err.msg)
        });
      }

      const { nickname, supabaseUrl, supabaseAnonKey, supabaseServiceRoleKey } = req.body;

      // Test connection before saving
      const isValid = await testConnection(supabaseUrl, supabaseAnonKey);
      
      if (!isValid) {
        return res.status(400).json({
          success: false,
          message: 'Failed to connect to database. Please check your credentials.'
        });
      }

      // Encrypt sensitive keys
      const encryptedAnonKey = encrypt(supabaseAnonKey);
      const encryptedServiceRoleKey = supabaseServiceRoleKey 
        ? encrypt(supabaseServiceRoleKey) 
        : undefined;

      // Add connection to user's connections array
      const user = await User.findById(req.user._id);
      
      user.connections.push({
        nickname,
        supabaseUrl,
        supabaseAnonKey: encryptedAnonKey,
        supabaseServiceRoleKey: encryptedServiceRoleKey
      });

      await user.save();

      // Get the newly added connection (last in array)
      const newConnection = user.connections[user.connections.length - 1];

      res.status(201).json({
        success: true,
        message: 'Connection added successfully',
        data: {
          _id: newConnection._id,
          nickname: newConnection.nickname,
          supabaseUrl: newConnection.supabaseUrl,
          createdAt: newConnection.createdAt
        }
      });
    } catch (error) {
      next(error);
    }
  }
];

/**
 * @route   GET /api/connections
 * @desc    Get all user's database connections
 * @access  Private
 */
export const getConnections = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    const connections = user.connections.map(conn => ({
      _id: conn._id,
      nickname: conn.nickname,
      supabaseUrl: conn.supabaseUrl,
      createdAt: conn.createdAt
    }));

    res.status(200).json({
      success: true,
      data: {
        connections,
        count: connections.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/connections/:id
 * @desc    Get a specific connection
 * @access  Private
 */
export const getConnection = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const connection = user.connections.id(req.params.id);

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: 'Connection not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        _id: connection._id,
        nickname: connection.nickname,
        supabaseUrl: connection.supabaseUrl,
        createdAt: connection.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/connections/:id
 * @desc    Update a database connection
 * @access  Private
 */
export const updateConnection = [
  body('nickname')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Nickname cannot be empty'),

  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array().map(err => err.msg)
        });
      }

      const user = await User.findById(req.user._id);
      const connection = user.connections.id(req.params.id);

      if (!connection) {
        return res.status(404).json({
          success: false,
          message: 'Connection not found'
        });
      }

      // Only allow updating nickname for now
      if (req.body.nickname) {
        connection.nickname = req.body.nickname;
      }

      await user.save();

      // Clear cached schema for this connection
      const cacheKey = `schema:${req.user._id.toString()}:${req.params.id}`;
      cache.delete(cacheKey);

      res.status(200).json({
        success: true,
        message: 'Connection updated successfully',
        data: {
          _id: connection._id,
          nickname: connection.nickname,
          supabaseUrl: connection.supabaseUrl,
          createdAt: connection.createdAt
        }
      });
    } catch (error) {
      next(error);
    }
  }
];

/**
 * @route   DELETE /api/connections/:id
 * @desc    Delete a database connection
 * @access  Private
 */
export const deleteConnection = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const connection = user.connections.id(req.params.id);

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: 'Connection not found'
      });
    }

    // Remove connection using pull
    user.connections.pull(req.params.id);
    await user.save();

    // Clear cached schema for this connection
    const cacheKey = `schema:${req.user._id.toString()}:${req.params.id}`;
    cache.delete(cacheKey);

    res.status(200).json({
      success: true,
      message: 'Connection deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper function to get decrypted connection credentials
 * @param {Object} user - User document
 * @param {string} connectionId - Connection ID
 * @returns {Object} Decrypted connection credentials
 */
export const getDecryptedConnection = (user, connectionId) => {
  const connection = user.connections.id(connectionId);
  
  if (!connection) {
    throw new Error('Connection not found');
  }

  return {
    _id: connection._id,
    nickname: connection.nickname,
    supabaseUrl: connection.supabaseUrl,
    supabaseAnonKey: decrypt(connection.supabaseAnonKey),
    supabaseServiceRoleKey: connection.supabaseServiceRoleKey 
      ? decrypt(connection.supabaseServiceRoleKey) 
      : null,
    createdAt: connection.createdAt
  };
};
