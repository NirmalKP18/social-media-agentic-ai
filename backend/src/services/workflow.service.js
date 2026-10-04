import SocialPost from '../models/SocialPost.js'
import BrandProfile from '../models/BrandProfile.js'
import Analysis from '../models/Analysis.js'
import Alert from '../models/Alert.js'
import Retrieval from '../models/Retrieval.js'
import { analyzePost } from './analysis.service.js'
import { analyzeText } from './nlpService.js'
import { performSearch } from './retrieval.service.js'
import { generateInsight } from './insight.service.js'
import { recordAudit } from './audit.service.js'
import { runAgentWorkflow, serializePosts } from './pythonAgent.service.js'
import { startPipeline, getJob } from './pythonService.service.js'
import { logger } from '../utils/logger.js'
import { HttpError } from '../utils/httpError.js'

const PERSIST_FIELDS = '_id platform author content publishedAt engagement comments'
const HIGH_SEVERITY_SCORE = -0.6

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const getWorkflowPosts = async (userId, brandId = null) => {
  const filter = { user: userId }
  if (brandId) {
    const brand = await BrandProfile.findOne({ _id: brandId, user: userId }).lean()
    if (!brand) throw new HttpError('Brand profile not found', 404)

    const keywords = [brand.primaryKeyword, ...(brand.alternativeKeywords || [])]
      .map((keyword) => String(keyword || '').trim())
      .filter(Boolean)
    const keywordPatterns = keywords.map((keyword) => new RegExp(escapeRegex(keyword), 'i'))
    filter.$or = [
      { 'metadata.brandId': brand._id },
      { content: { $in: keywordPatterns } },
      { author: { $in: keywordPatterns } },
    ]
  }

  return SocialPost.find(filter).select(PERSIST_FIELDS).lean()
}

const summarizeConversation = (commentAnalyses) => {
  const counts = { positive: 0, negative: 0, neutral: 0, score: 0 }
  for (const item of commentAnalyses) {
    counts[item.sentiment.label] += 1
    counts.score += item.sentiment.score
  }
  return {
    totalComments: commentAnalyses.length,
    positive: counts.positive,
    negative: counts.negative,
    neutral: counts.neutral,
    averageScore: commentAnalyses.length ? Number((counts.score / commentAnalyses.length).toFixed(3)) : 0,
  }
}

const syncAlert = async (userId, post, analysis) => {
  if (analysis.sentiment?.label !== 'negative') {
    await Alert.deleteOne({ user: userId, post: post._id, type: 'negative_sentiment', status: 'open' })
    return
  }
  const isHigh = analysis.priority?.level === 'urgent' || analysis.sentiment.score <= HIGH_SEVERITY_SCORE
  await Alert.findOneAndUpdate(
    { user: userId, post: post._id, type: 'negative_sentiment' },
    {
      analysis: analysis._id,
      severity: isHigh ? 'high' : 'medium',
      message: `Negative sentiment detected in a ${post.platform} post by ${post.author}.`,
      status: 'open',
    },
    { upsert: true, runValidators: true, setDefaultsOnInsert: true },
  )
}

export const persistAgentAnalysis = async (userId, post, analysis) => {
  const commentAnalyses = (post.comments || []).map((comment) => ({
    author: comment.author,
    content: comment.content,
    ...analyzeText(comment.content),
  }))

  const document = await Analysis.findOneAndUpdate(
    { post: post._id },
    {
      user: userId,
      post: post._id,
      sentiment: analysis.sentiment,
      topics: analysis.topics || [],
      entities: analysis.entities || [],
      summary: analysis.summary || '',
      intent: analysis.intent || 'other',
      emotion: { label: analysis.emotion?.label || 'neutral', scores: analysis.emotion?.scores || {} },
      priority: {
        level: analysis.priority?.level || 'low',
        score: Math.max(0, Math.min(100, Number(analysis.priority?.score) || 0)),
        factors: analysis.priority?.factors || [],
      },
      namedEntities: (analysis.named_entities || [])
        .slice(0, 20)
        .map((entity) => ({ text: String(entity.text || '').slice(0, 200), type: String(entity.type || 'proper_noun').slice(0, 40) }))
        .filter((entity) => entity.text),
      commentAnalyses,
      conversation: summarizeConversation(commentAnalyses),
    },
    { upsert: true, returnDocument: 'after', runValidators: true, setDefaultsOnInsert: true },
  )

  await syncAlert(userId, post, document)
  return document
}

const runNodeFallback = async (userId, { query, limit }) => {
  const posts = await SocialPost.find({ user: userId }).select(PERSIST_FIELDS).lean()
  const analyses = []
  for (const post of posts) analyses.push(await analyzePost(userId, post._id))

  const retrieval = await performSearch(userId, { query, limit })
  if (retrieval.results.length === 0) throw new HttpError('No evidence matched the workflow query', 400)
  const insight = await generateInsight(userId, { retrievalId: retrieval._id })

  return {
    agents: {
      collection: { name: 'collection', status: 'completed', normalizedPosts: posts.length },
      nlp: { name: 'nlp', status: 'completed', analyses: analyses.length },
      retrieval: { name: 'retrieval', status: 'completed', evidence: retrieval.results.length },
      insight: { name: 'insight', status: 'completed', reviewStatus: insight.review.status, insightId: insight._id },
    },
    engine: 'node-fallback',
    agentRunAt: new Date().toISOString(),
    retrieval,
    insight,
  }
}

const persistAgentResult = async (userId, agentRun, query) => {
  const posts = await SocialPost.find({ user: userId }).select(PERSIST_FIELDS).lean()
  const postById = new Map(posts.map((post) => [String(post._id), post]))
  const analyses = []
  for (const analysis of agentRun.analyses || []) {
    const post = postById.get(String(analysis.post_id))
    if (!post) continue
    analyses.push(await persistAgentAnalysis(userId, post, analysis))
  }

  const postEvidence = (agentRun.evidence || []).filter((item) => item.kind === 'post' && item.post)
  if (postEvidence.length === 0) throw new HttpError('No evidence matched the workflow query', 400)

  const retrieval = await Retrieval.create({
    user: userId,
    query: String(query || 'agent run').trim().slice(0, 200),
    results: postEvidence
      .map((item) => ({
        post: postById.get(String(item.post.id))?._id,
        score: Math.max(0, Math.min(1, Number(item.score) || 0)),
      }))
      .filter((result) => result.post),
  })

  const insight = await generateInsight(
    userId,
    { retrievalId: retrieval._id },
    { agentInsight: agentRun.insight, job: agentRun.job },
  )

  await recordAudit({
    userId,
    action: 'workflow.complete',
    resource: 'workflow',
    metadata: {
      engine: 'python-agents',
      jobId: agentRun.job?.id,
      postsAnalyzed: analyses.length,
      retrievalId: String(retrieval._id),
      insightId: String(insight._id),
      knowledgeSources: insight.knowledgeSources?.length || 0,
    },
  })

  return { retrieval, insight, analyses }
}

const buildWorkflow = async (userId, agentRun, query) => {
  const { retrieval, insight } = await persistAgentResult(userId, agentRun, query)
  return {
    agents: {
      ...agentRun.agents,
      insight: { ...agentRun.agents?.insight, insightId: insight._id, reviewStatus: insight.review.status },
    },
    engine: 'python-agents',
    job: agentRun.job,
    agentRunAt: agentRun.runAt,
    retrieval,
    insight,
  }
}

export const runIntelligenceWorkflow = async (userId, { query, limit = 10, brandId = null }) => {
  const posts = await getWorkflowPosts(userId, brandId)
  if (posts.length === 0) {
    throw new HttpError(brandId ? 'No collected posts match the selected brand' : 'Collect at least one post before running the workflow', 400)
  }

  const agentRun = await runAgentWorkflow({ posts, query, limit })
  if (!agentRun) return runNodeFallback(userId, { query, limit })

  return buildWorkflow(userId, agentRun, query)
}

export const executeWorkflow = runIntelligenceWorkflow


export const startAgentRun = async (userId, { query, limit = 10, brandId = null }) => {
  const posts = await getWorkflowPosts(userId, brandId)
  if (posts.length === 0) {
    throw new HttpError(brandId ? 'No collected posts match the selected brand' : 'Collect at least one post before running the workflow', 400)
  }

  try {
    const started = await startPipeline({ query: query.trim(), limit, posts: serializePosts(posts) })
    jobOwners.set(started.job.id, String(userId))
    if (jobOwners.size > JOB_OWNER_LIMIT) {
      const oldest = jobOwners.keys().next().value
      jobOwners.delete(oldest)
    }
    return { mode: 'async', job: started.job }
  } catch (error) {
    logger.error(`Async agent start unavailable (${error.message}); running the synchronous pipeline`)
    const workflow = await runIntelligenceWorkflow(userId, { query, limit, brandId })
    return { mode: 'sync', workflow }
  }
}

const finalizedRuns = new Map()
const FINALIZED_RUN_LIMIT = 50
const jobOwners = new Map()
const JOB_OWNER_LIMIT = 100

export const pollAgentRun = async (userId, jobId) => {
  const owner = jobOwners.get(jobId)
  if (owner && owner !== String(userId)) throw new HttpError('Forbidden', 403)

  const cached = finalizedRuns.get(jobId)
  if (cached) return { status: 'completed', workflow: cached }

  let payload
  try {
    payload = await getJob(jobId)
  } catch (error) {
    throw new HttpError(`Agent job not found: ${error.message}`, 404)
  }

  const job = payload.job
  if (job.status === 'failed') throw new HttpError(job.error || 'Agent workflow failed', 400)
  if (job.status !== 'completed') return { status: job.status, job }
  if (!payload.result) throw new HttpError('Agent workflow completed without a result; re-run the pipeline', 502)

  const workflow = await buildWorkflow(userId, payload.result, job.query)
  finalizedRuns.set(jobId, workflow)
  if (finalizedRuns.size > FINALIZED_RUN_LIMIT) {
    const oldest = finalizedRuns.keys().next().value
    finalizedRuns.delete(oldest)
  }
  return { status: 'completed', workflow }
}
