import * as subscriptionService from '../services/subscription.service.js'

export const getPlans = async (req, res, next) => {
  try {
    const plans = await subscriptionService.getPublicPlans()
    res.json({ success: true, data: { plans } })
  } catch (err) {
    next(err)
  }
}
