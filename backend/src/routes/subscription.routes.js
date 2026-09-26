import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware.js'
import * as subscriptionController from '../controllers/subscription.controller.js'

const router = Router()

router.use(authenticate)

router.get('/me', subscriptionController.getSubscription)
router.post('/checkout', subscriptionController.checkout)

export default router
