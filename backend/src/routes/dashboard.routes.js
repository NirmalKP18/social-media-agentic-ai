import { Router } from 'express'
import { getSummary } from '../controllers/dashboard.controller.js'
import { protect } from '../middleware/auth.middleware.js'

const router = Router()

router.use(protect)

router.get('/', getSummary)

export default router