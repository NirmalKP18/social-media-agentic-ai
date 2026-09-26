import { Router } from 'express'
import { process, start, list, get } from '../controllers/pipeline.controller.js'
import { protect } from '../middleware/auth.middleware.js'

const router = Router()

router.use(protect)

router.post('/process/:postId', process)
router.post('/start/:postId', start)
router.get('/runs', list)
router.get('/runs/:id', get)

export default router
