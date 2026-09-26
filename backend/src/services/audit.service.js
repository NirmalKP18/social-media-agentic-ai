import AuditLog from '../models/AuditLog.js'

export const recordAudit = async ({ userId, action, resource, resourceId = null, metadata = {} }) => {
  try {
    return await AuditLog.create({ user: userId, action, resource, resourceId, metadata })
  } catch {
    return null
  }
}

export const listAuditLogs = (userId) => AuditLog.find({ user: userId }).sort({ createdAt: -1 }).limit(100)
