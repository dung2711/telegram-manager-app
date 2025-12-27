import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  
  // JWT tokens
  refreshToken: { 
    type: String, 
    required: true,
    unique: true
  },
  
  // Thông tin thiết bị 
  ipAddress: { 
    type: String 
  },
  
  userAgent: { 
    type: String 
  },
  
  // Expiry
  expiresAt: { 
    type: Date, 
    required: true
  },
  
  isActive: { 
    type: Boolean, 
    default: true,
    index: true
  }
  
}, { 
  timestamps: true 
});

// Index để query sessions của user
sessionSchema.index({ userId: 1, isActive: 1 });

// TTL index - MongoDB tự động xóa sessions đã hết hạn
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Session = mongoose.model('Session', sessionSchema);

export default Session;
