import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware.js'
import * as brandController from '../controllers/brand.controller.js'

const router = Router()

router.use(authenticate)

router.get('/', brandController.getBrands)
router.post('/', brandController.createBrand)
router.get('/:id', brandController.getBrandById)
router.put('/:id', brandController.updateBrand)
router.delete('/:id', brandController.deleteBrand)
router.post('/:id/run', brandController.runBrandPipeline)

export default router
