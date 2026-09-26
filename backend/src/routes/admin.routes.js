import { Router } from 'express'
import { authenticate, authorize } from '../middleware/auth.middleware.js'
import * as adminController from '../controllers/admin.controller.js'

const router = Router()

// Protect all admin endpoints with authentication and admin role authorization
router.use(authenticate)
router.use(authorize('admin'))

router.get('/analytics', adminController.getAnalytics)

router.get('/users', adminController.getUsers)
router.get('/users/:id', adminController.getUserDetails)
router.put('/users/:id', adminController.updateUser)
router.post('/users/:id/adjust-usage', adminController.adjustUserUsage)
router.post('/users/:id/change-plan', adminController.changeUserPlan)
router.delete('/users/:id', adminController.deleteUser)

router.get('/payments', adminController.getPayments)
router.post('/payments', adminController.createPayment)

router.get('/plans', adminController.getPlans)
router.post('/plans', adminController.createPlan)
router.put('/plans/:id', adminController.updatePlan)

router.get('/pipeline-runs', adminController.getPipelineRuns)

export default router
