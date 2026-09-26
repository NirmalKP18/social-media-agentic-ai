import { Router } from 'express'
import { getList, updateStatus } from '../controllers/alert.controller.js'
import { protect } from '../middleware/auth.middleware.js'
import { validateAlertStatus } from '../middleware/validate.middleware.js'

const router = Router()
router.use(protect)
router.get('/', getList)
router.patch('/:id', validateAlertStatus, updateStatus)
export default router
