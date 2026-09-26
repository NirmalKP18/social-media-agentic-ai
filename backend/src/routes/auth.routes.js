import { Router } from 'express'
import { register, login, me, updateOnboarding } from '../controllers/auth.controller.js'
import { validateRegister, validateLogin } from '../middleware/validate.middleware.js'
import { protect } from '../middleware/auth.middleware.js'

const router = Router()

router.post('/register', validateRegister, register)
router.post('/login', validateLogin, login)
router.get('/me', protect, me)
router.put('/onboarding', protect, updateOnboarding)

export default router