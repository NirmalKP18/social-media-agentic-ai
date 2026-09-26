import { Router } from 'express'
import { create, getList, getOne, remove, exportReport, review } from '../controllers/insight.controller.js'
import { validateCreateInsight, validateInsightReview } from '../middleware/validate.middleware.js'
import { protect } from '../middleware/auth.middleware.js'

const router = Router()

router.use(protect)

router.post('/', validateCreateInsight, create)
router.get('/', getList)
router.get('/:id/export', exportReport)
router.patch('/:id/review', validateInsightReview, review)
router.get('/:id', getOne)
router.delete('/:id', remove)

export default router
