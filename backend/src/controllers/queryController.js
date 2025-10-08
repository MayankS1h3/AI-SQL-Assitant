import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import QueryHistory from '../models/QueryHistory.js';
import { getDecryptedConnection } from './connectionController.js';
import { prepareSchema, generateAndExecuteQuery } from '../services/queryService.js';
import cache from '../utils/cache.js';

/**
 * @route   POST /api/query/prepare-schema
 * @desc    Fetch and cache database schema for a connection
 * @access  Private
 */
export const prepareSchemaForConnection = [
  body('connectionId')
    .notEmpty()
    .withMessage('Connection ID is required'),

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

      const { connectionId } = req.body;
      const user = await User.findById(req.user._id);

      // Get decrypted connection
      const connection = getDecryptedConnection(user, connectionId);

      // Generate cache key
      const cacheKey = `schema:${req.user._id.toString()}:${connectionId}`;

      // Prepare and cache schema
      await prepareSchema(connection, cache, cacheKey);

      res.status(200).json({
        success: true,
        message: 'Schema prepared and cached successfully',
        data: {
          connectionId,
          nickname: connection.nickname
        }
      });
    } catch (error) {
      next(error);
    }
  }
];

/**
 * @route   POST /api/query/generate-sql
 * @desc    Generate SQL from natural language and execute it
 * @access  Private
 */
export const generateAndRunQuery = [
  body('connectionId')
    .notEmpty()
    .withMessage('Connection ID is required'),
  body('naturalLanguageQuery')
    .trim()
    .notEmpty()
    .withMessage('Query cannot be empty')
    .isLength({ max: 500 })
    .withMessage('Query is too long (max 500 characters)'),

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

      const { connectionId, naturalLanguageQuery } = req.body;
      const user = await User.findById(req.user._id);

      // Get decrypted connection
      const connection = getDecryptedConnection(user, connectionId);

      // Generate cache key
      const cacheKey = `schema:${req.user._id.toString()}:${connectionId}`;

      // Get schema from cache or fetch it
      let schemaContext = cache.get(cacheKey);
      
      if (!schemaContext) {
        schemaContext = await prepareSchema(connection, cache, cacheKey);
      }

      // Generate and execute query
      const result = await generateAndExecuteQuery(
        naturalLanguageQuery,
        schemaContext,
        connection
      );

      // Log query to history
      const historyEntry = await QueryHistory.logQuery({
        userId: req.user._id,
        connectionId: connection._id,
        connectionNickname: connection.nickname,
        naturalLanguageQuery,
        generatedSql: result.generatedSQL || 'Failed to generate SQL',
        status: result.success ? 'success' : 'error',
        errorMessage: result.error || null,
        executionTime: result.executionTime,
        rowCount: result.rowCount || 0
      });

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: 'Query execution failed',
          error: result.error,
          data: {
            generatedSQL: result.generatedSQL,
            historyId: historyEntry._id
          }
        });
      }

      res.status(200).json({
        success: true,
        message: 'Query executed successfully',
        data: {
          generatedSQL: result.generatedSQL,
          results: result.results,
          rowCount: result.rowCount,
          executionTime: result.executionTime,
          historyId: historyEntry._id
        }
      });
    } catch (error) {
      next(error);
    }
  }
];

/**
 * @route   POST /api/query/execute-sql
 * @desc    Execute a pre-written SQL query (for advanced users)
 * @access  Private
 */
export const executeRawSQL = [
  body('connectionId')
    .notEmpty()
    .withMessage('Connection ID is required'),
  body('sql')
    .trim()
    .notEmpty()
    .withMessage('SQL query cannot be empty'),

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

      const { connectionId, sql } = req.body;
      const user = await User.findById(req.user._id);

      // Get decrypted connection
      const connection = getDecryptedConnection(user, connectionId);

      // Validate SQL safety
      const { validateSQLSafety } = await import('../services/aiService.js');
      if (!validateSQLSafety(sql)) {
        return res.status(400).json({
          success: false,
          message: 'SQL query contains unsafe operations. Only SELECT queries are allowed.'
        });
      }

      // Execute SQL
      const { executeSQLQuery } = await import('../utils/schemaFetcher.js');
      const key = connection.supabaseServiceRoleKey || connection.supabaseAnonKey;
      
      const startTime = Date.now();
      const result = await executeSQLQuery(connection.supabaseUrl, key, sql);
      const executionTime = Date.now() - startTime;

      // Log to history
      await QueryHistory.logQuery({
        userId: req.user._id,
        connectionId: connection._id,
        connectionNickname: connection.nickname,
        naturalLanguageQuery: '[Direct SQL Execution]',
        generatedSql: sql,
        status: 'success',
        executionTime,
        rowCount: result.rowCount || 0
      });

      res.status(200).json({
        success: true,
        message: 'Query executed successfully',
        data: {
          results: result.data,
          rowCount: result.rowCount,
          executionTime
        }
      });
    } catch (error) {
      next(error);
    }
  }
];
