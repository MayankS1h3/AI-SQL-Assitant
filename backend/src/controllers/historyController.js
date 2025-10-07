import QueryHistory from '../models/QueryHistory.js';

/**
 * @route   GET /api/history
 * @desc    Get user's query history with pagination
 * @access  Private
 */
export const getQueryHistory = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 50,
      connectionId = null,
      status = null
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      connectionId,
      status
    };

    const result = await QueryHistory.getUserHistory(req.user._id, options);

    res.status(200).json({
      success: true,
      data: {
        history: result.history,
        pagination: result.pagination
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/history/:id
 * @desc    Get a specific query from history
 * @access  Private
 */
export const getQueryById = async (req, res, next) => {
  try {
    const query = await QueryHistory.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!query) {
      return res.status(404).json({
        success: false,
        message: 'Query not found'
      });
    }

    res.status(200).json({
      success: true,
      data: query
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/history/:id
 * @desc    Delete a query from history
 * @access  Private
 */
export const deleteQueryFromHistory = async (req, res, next) => {
  try {
    const query = await QueryHistory.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!query) {
      return res.status(404).json({
        success: false,
        message: 'Query not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Query deleted from history'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/history
 * @desc    Clear all query history for user
 * @access  Private
 */
export const clearQueryHistory = async (req, res, next) => {
  try {
    const result = await QueryHistory.deleteMany({
      userId: req.user._id
    });

    res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount} queries from history`
    });
  } catch (error) {
    next(error);
  }
};
