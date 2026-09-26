import { getSettings } from '../services/settings.service.js'
import { sendSuccess } from '../utils/apiResponse.js'

export const get = async (req, res) => {
  const settings = await getSettings()
  sendSuccess(res, { settings }, 'Application settings retrieved')
}