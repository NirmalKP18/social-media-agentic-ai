import { Router } from 'express'
import { run, start, poll, getJobs, getJobById } from '../controllers/workflow.controller.js'
import { protect, requireAdmin } from '../middleware/auth.middleware.js'
import { validateRetrievalSearch } from '../middleware/validate.middleware.js'

const router = Router()
router.use(protect)
router.post('/run', validateRetrievalSearch, run)
router.post('/runs', validateRetrievalSearch, start)
router.get('/runs/:jobId', poll)
// The Python job store is process-wide (not per-owner), so job inspection is admin-only.
router.get('/jobs', requireAdmin, getJobs)
router.get('/jobs/:id', requireAdmin, getJobById)
export default router
