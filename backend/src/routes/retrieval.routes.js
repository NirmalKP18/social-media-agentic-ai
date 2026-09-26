import { Router } from 'express'
import { search, getList, getOne, remove } from '../controllers/retrieval.controller.js'
import { validateRetrievalSearch } from '../middleware/validate.middleware.js'
import { protect } from '../middleware/auth.middleware.js'

const router = Router()

router.use(protect)

router.post('/', validateRetrievalSearch, search)
router.get('/', getList)
router.get('/:id', getOne)
router.delete('/:id', remove)

export default router