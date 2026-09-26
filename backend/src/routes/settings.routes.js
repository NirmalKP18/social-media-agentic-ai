import { Router } from 'express'
import { get } from '../controllers/settings.controller.js'
import { protect } from '../middleware/auth.middleware.js'

const router = Router()

router.use(protect)
router.get('/', get)

export default router