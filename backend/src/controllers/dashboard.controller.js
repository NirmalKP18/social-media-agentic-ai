import { getDashboardSummary } from '../services/dashboard.service.js'
import { sendSuccess } from '../utils/apiResponse.js'

export const getSummary = async (req, res) => {
  const dashboard = await getDashboardSummary(req.user.id)
  sendSuccess(res, { dashboard }, 'Dashboard retrieved')
}