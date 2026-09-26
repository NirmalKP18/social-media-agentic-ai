import { Router } from 'express'
import { getEvaluationMetrics, runBenchmarkTestSuite } from '../controllers/evaluation.controller.js'
import { protect } from '../middleware/auth.middleware.js'

const router = Router()

router.use(protect)

router.get('/', getEvaluationMetrics)
router.post('/run', runBenchmarkTestSuite)

export default router
