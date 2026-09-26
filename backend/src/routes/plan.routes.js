import { Router } from 'express'
import * as planController from '../controllers/plan.controller.js'

const router = Router()

router.get('/', planController.getPlans)

export default router
