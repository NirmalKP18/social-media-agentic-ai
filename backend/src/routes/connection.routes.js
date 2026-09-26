import { Router } from 'express'
import { getList, test, importPosts } from '../controllers/connection.controller.js'
import { protect } from '../middleware/auth.middleware.js'

const router = Router()
router.use(protect)
router.get('/', getList)
router.post('/:platform/test', test)
router.post('/:platform/import', importPosts)
export default router
