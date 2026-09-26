import { Router } from 'express'
import { create, createFromScreenshot, createFromFacebookLink, getList, getOne, update, remove } from '../controllers/post.controller.js'
import { validateCreatePost, validateScreenshotPost, validateFacebookLink, validateUpdatePost } from '../middleware/validate.middleware.js'
import { protect } from '../middleware/auth.middleware.js'

const router = Router()

router.use(protect)

router.post('/', validateCreatePost, create)
router.post('/screenshot', validateScreenshotPost, createFromScreenshot)
router.post('/facebook-link', validateFacebookLink, createFromFacebookLink)
router.get('/', getList)
router.get('/:id', getOne)
router.patch('/:id', validateUpdatePost, update)
router.delete('/:id', remove)

export default router
