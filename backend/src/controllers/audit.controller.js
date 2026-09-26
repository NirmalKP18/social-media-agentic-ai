import { listAuditLogs } from '../services/audit.service.js'
import { sendSuccess } from '../utils/apiResponse.js'

export const getList = async (req, res) => {
  const logs = await listAuditLogs(req.user.id)
  sendSuccess(res, { logs, count: logs.length }, 'Audit history retrieved')
}
