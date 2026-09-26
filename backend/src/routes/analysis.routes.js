import { Router } from 'express'
import { analyze, getForPost, getList, getOne, remove } from '../controllers/analysis.controller.js'
import { protect } from '../middleware/auth.middleware.js'

const router = Router()

router.use(protect)

router.get('/posts/:postId', getForPost)
router.post('/posts/:postId', analyze)
router.get('/', getList)
router.get('/:id', getOne)
router.delete('/:id', remove)

export default router