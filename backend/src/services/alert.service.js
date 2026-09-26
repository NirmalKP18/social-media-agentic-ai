import mongoose from 'mongoose'
import Alert from '../models/Alert.js'
import { HttpError } from '../utils/httpError.js'
import { recordAudit } from './audit.service.js'

export const listAlerts = (userId, status) => Alert.find({ user: userId, ...(status ? { status } : {}) })
  .sort({ createdAt: -1 }).populate('post', 'platform author content createdAt')

export const updateAlertStatus = async (userId, alertId, status) => {
  if (!mongoose.isValidObjectId(alertId)) throw new HttpError('Alert not found', 404)
  const alert = await Alert.findOneAndUpdate({ _id: alertId, user: userId }, { status }, { returnDocument: 'after', runValidators: true })
    .populate('post', 'platform author content createdAt')
  if (!alert) throw new HttpError('Alert not found', 404)
  await recordAudit({ userId, action: `alert.${status}`, resource: 'alert', resourceId: alert._id })
  return alert
}
