import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema({
  accountID: { type: String, required: true, index: true },
  action: { type: String, required: true },
  targetId: { type: String, default: null }, // ID đối tượng bị tác động
  targetName: { type: String, default: 'Unknown' }, // Tên đối tượng
  payload: { type: Object, default: {} }, // Dữ liệu chi tiết
  status: { type: String, enum: ['SUCCESS', 'FAILURE'], default: 'SUCCESS' },
  errorMessage: { type: String },
  timestamp: { type: Date, default: Date.now }
});
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ action: 1, status: 1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;