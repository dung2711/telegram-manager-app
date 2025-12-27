import mongoose from "mongoose";

const rateLimitSchema = new mongoose.Schema({
  // Key duy nhất: "login:phoneNumber" hoặc "login:ip"
  key: { 
    type: String, 
    required: true, 
    unique: true 
  },
  
  // Số lần thử
  attempts: { 
    type: Number, 
    default: 1 
  },
  
  // Thời điểm reset
  resetAt: { 
    type: Date, 
    required: true
  }
  
}, { 
  timestamps: true 
});

// TTL index - tự động xóa records đã hết hạn
rateLimitSchema.index({ resetAt: 1 }, { expireAfterSeconds: 0 });

const RateLimit = mongoose.model('RateLimit', rateLimitSchema);

export default RateLimit;