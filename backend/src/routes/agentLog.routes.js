import { Router } from 'express'
import { list, listByPipelineRun } from '../controllers/agentLog.controller.js'
import { protect, requireAdmin } from '../middleware/auth.middleware.js'

const router = Router()

router.use(protect, requireAdmin)

router.get('/', list)
router.get('/pipeline/:runId', listByPipelineRun)

export default router