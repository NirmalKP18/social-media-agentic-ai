import * as subscriptionService from '../services/subscription.service.js'

export const getSubscription = async (req, res, next) => {
  try {
    const sub = await subscriptionService.getUserSubscription(req.user.id)
    res.json({ success: true, data: sub })
  } catch (err) {
    next(err)
  }
}

export const checkout = async (req, res, next) => {
  try {
    const { planName, billingCycle, paymentMethod, transactionId } = req.body
    const result = await subscriptionService.processCheckout(req.user.id, {
      planName,
      billingCycle,
      paymentMethod,
      transactionId,
    })
    res.json({ success: true, data: result })
  } catch (err) {
    next(err)
  }
}
