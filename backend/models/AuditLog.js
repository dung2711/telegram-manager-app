import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema({
  accountID: { 
    type: String, 
    required: true, 
    index: true 
  },
  
  action: { 
    type: String, 
    required: true,
    index: true
  },
  
  targetId: { 
    type: String, 
    default: null 
  },
  
  targetName: {  
    type: String, 
    default: 'Unknown' 
  },
  
  payload: { 
    type: Object, 
    default: {} 
  },
  
  status: { 
    type: String, 
    enum: ['SUCCESS', 'FAILURE'], 
    default: 'SUCCESS',
    index: true
  },
  
  errorMessage: { 
    type: String,
    default: null
  },
  
  timestamp: { 
    type: Date, 
    default: Date.now,
    index: true
  }
});

// Compound indexes cho query thường dùng
auditLogSchema.index({ accountID: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, status: 1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;