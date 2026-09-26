import { listAlerts, updateAlertStatus } from '../services/alert.service.js'
import { sendSuccess } from '../utils/apiResponse.js'

export const getList = async (req, res) => {
  const alerts = await listAlerts(req.user.id, req.query.status)
  sendSuccess(res, { alerts, count: alerts.length }, 'Alerts retrieved')
}

export const updateStatus = async (req, res) => {
  const alert = await updateAlertStatus(req.user.id, req.params.id, req.body.status)
  sendSuccess(res, { alert }, 'Alert status updated')
}
