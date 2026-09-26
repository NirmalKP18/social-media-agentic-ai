import { Router } from 'express'
import multer from 'multer'
import { getList, getStatistics, create, remove, rebuildIndex, upload } from '../controllers/knowledge.controller.js'
import { validateKnowledgeDocument } from '../middleware/validate.middleware.js'
import { protect, requireAdmin } from '../middleware/auth.middleware.js'
import { config } from '../config/env.js'
import { HttpError } from '../utils/httpError.js'

const router = Router()

router.use(protect, requireAdmin)

const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.uploads.maxUploadBytes, files: 1 },
})
const handleUpload = (req, res, next) => {
  uploadMiddleware.single('file')(req, res, (error) => {
    if (!error) return next()
    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      return next(new HttpError(`File is larger than the ${Math.round(config.uploads.maxUploadBytes / 1024 / 1024)} MB upload limit`, 413))
    }
    return next(new HttpError('Upload failed: ' + error.message, 400))
  })
}

router.get('/', getList)
router.get('/stats', getStatistics)
router.post('/', validateKnowledgeDocument, create)
router.post('/upload', handleUpload, upload)
router.post('/reindex', rebuildIndex)
router.delete('/:id', remove)

export default router
