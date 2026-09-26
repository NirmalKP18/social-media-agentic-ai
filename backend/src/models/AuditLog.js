import mongoose from 'mongoose'

const auditLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  action: { type: String, required: true, trim: true },
  resource: { type: String, required: true, trim: true },
  resourceId: { type: mongoose.Schema.Types.ObjectId, default: null },
  status: { type: String, enum: ['success', 'failure'], default: 'success' },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true })

auditLogSchema.index({ user: 1, createdAt: -1 })

export default mongoose.model('AuditLog', auditLogSchema)
