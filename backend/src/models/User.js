import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const connectionSchema = new mongoose.Schema({
  nickname: {
    type: String,
    required: [true, 'Connection nickname is required'],
    trim: true
  },
  supabaseUrl: {
    type: String,
    required: [true, 'Supabase URL is required'],
    trim: true,
    validate: {
      validator: function(v) {
        return /^https:\/\/.+\.supabase\.co$/.test(v);
      },
      message: 'Invalid Supabase URL format'
    }
  },
  supabaseAnonKey: {
    type: String,
    required: [true, 'Supabase Anon Key is required']
    // This will be encrypted before storage
  },
  supabaseServiceRoleKey: {
    type: String,
    // Optional: for more privileged operations
    // This will be encrypted before storage
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [50, 'Username cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Invalid email format'
    }
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
    // Will be hashed before storage
  },
  connections: [connectionSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash if password is modified
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get user without sensitive data
userSchema.methods.toSafeObject = function() {
  const user = this.toObject();
  delete user.password;
  
  // Remove sensitive keys from connections (keep encrypted but don't expose structure)
  if (user.connections) {
    user.connections = user.connections.map(conn => ({
      _id: conn._id,
      nickname: conn.nickname,
      supabaseUrl: conn.supabaseUrl,
      createdAt: conn.createdAt
    }));
  }
  
  return user;
};

const User = mongoose.model('User', userSchema);

export default User;
