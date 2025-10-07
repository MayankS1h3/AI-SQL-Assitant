import mongoose from 'mongoose';

const queryHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  connectionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Connection ID is required'],
    index: true
  },
  connectionNickname: {
    type: String,
    required: true
  },
  naturalLanguageQuery: {
    type: String,
    required: [true, 'Natural language query is required'],
    trim: true
  },
  generatedSql: {
    type: String,
    required: [true, 'Generated SQL is required']
  },
  status: {
    type: String,
    enum: ['success', 'error'],
    required: true,
    default: 'success'
  },
  errorMessage: {
    type: String
  },
  executionTime: {
    type: Number, // in milliseconds
    min: 0
  },
  rowCount: {
    type: Number,
    min: 0
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Compound index for efficient user query retrieval
queryHistorySchema.index({ userId: 1, createdAt: -1 });

// Static method to create a history entry
queryHistorySchema.statics.logQuery = async function(queryData) {
  try {
    const entry = new this(queryData);
    await entry.save();
    return entry;
  } catch (error) {
    console.error('Error logging query:', error);
    throw error;
  }
};

// Static method to get user's query history with pagination
queryHistorySchema.statics.getUserHistory = async function(userId, options = {}) {
  const {
    page = 1,
    limit = 50,
    connectionId = null,
    status = null
  } = options;

  const query = { userId };
  
  if (connectionId) {
    query.connectionId = connectionId;
  }
  
  if (status) {
    query.status = status;
  }

  const skip = (page - 1) * limit;

  const [history, total] = await Promise.all([
    this.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    this.countDocuments(query)
  ]);

  return {
    history,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

const QueryHistory = mongoose.model('QueryHistory', queryHistorySchema);

export default QueryHistory;
