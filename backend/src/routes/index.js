import { Router } from 'express'
import healthRouter from './health.routes.js'
import authRouter from './auth.routes.js'
import postRouter from './post.routes.js'
import analysisRouter from './analysis.routes.js'
import retrievalRouter from './retrieval.routes.js'
import insightRouter from './insight.routes.js'
import dashboardRouter from './dashboard.routes.js'
import alertRouter from './alert.routes.js'
import auditRouter from './audit.routes.js'
import workflowRouter from './workflow.routes.js'
import connectionRouter from './connection.routes.js'
import knowledgeRouter from './knowledge.routes.js'
import pipelineRouter from './pipeline.routes.js'
import agentLogRouter from './agentLog.routes.js'
import settingsRouter from './settings.routes.js'
import evaluationRouter from './evaluation.routes.js'
import adminRouter from './admin.routes.js'
import brandRouter from './brand.routes.js'
import subscriptionRouter from './subscription.routes.js'
import planRouter from './plan.routes.js'

const router = Router()

router.use('/health', healthRouter)
router.use('/auth', authRouter)
router.use('/plans', planRouter)
router.use('/subscription', subscriptionRouter)
router.use('/brands', brandRouter)
router.use('/posts', postRouter)
router.use('/analyses', analysisRouter)
router.use('/retrieval', retrievalRouter)
router.use('/insights', insightRouter)
router.use('/dashboard', dashboardRouter)
router.use('/alerts', alertRouter)
router.use('/audit-logs', auditRouter)
router.use('/workflow', workflowRouter)
router.use('/connections', connectionRouter)
router.use('/knowledge', knowledgeRouter)
router.use('/pipeline', pipelineRouter)
router.use('/agent-logs', agentLogRouter)
router.use('/settings', settingsRouter)
router.use('/evaluation', evaluationRouter)
router.use('/admin', adminRouter)

export default router
