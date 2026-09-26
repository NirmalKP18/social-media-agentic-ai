import { Router } from 'express'
import { getList } from '../controllers/audit.controller.js'
import { protect } from '../middleware/auth.middleware.js'

const router = Router()
router.use(protect)
router.get('/', getList)
export default router
