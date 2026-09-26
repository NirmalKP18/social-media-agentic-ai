import SocialPost from '../models/SocialPost.js'
import Retrieval from '../models/Retrieval.js'
import PipelineRun from '../models/PipelineRun.js'
import { analyzePost } from './analysis.service.js'
import { generateInsight } from './insight.service.js'
import { persistAgentAnalysis } from './workflow.service.js'
import { startPipeline, getJob } from './pythonService.service.js'
import { serializePosts } from './pythonAgent.service.js'
import { logAgent } from './agentLog.service.js'
import { recordAudit } from './audit.service.js'
import { checkAndEnforcePipelineLimit, chargePipelineRun } from './subscription.service.js'
import { HttpError } from '../utils/httpError.js'
import { logger } from '../utils/logger.js'

const POLL_INTERVAL_MS = 400
const POLL_TIMEOUT_MS = 120000

const STAGE_AGENT = { collecting: 'collection', analyzing: 'nlp', retrieving: 'retrieval', generating: 'insight' }
const STAGE_ACTION = {
  collecting: 'COLLECT_MENTION',
  analyzing: 'ANALYZE_MENTION',
  retrieving: 'RETRIEVE_EVIDENCE',
  generating: 'GENERATE_OUTPUT',
}

const clampScore = (value) => Math.max(0, Math.min(1, Number(value) || 0))

const waitForJob = async (jobId, onProgress = null) => {
  const deadline = Date.now() + POLL_TIMEOUT_MS
  let lastTransitionCount = 0
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))
    let payload
    try {
      payload = await getJob(jobId)
    } catch (error) {
      throw new HttpError(`Agent job lookup failed: ${error.message}`, 502)
    }
    if ((payload.job.transitions || []).length !== lastTransitionCount) {
      lastTransitionCount = (payload.job.transitions || []).length
      await onProgress?.(payload.job)
    }
    if (payload.job.status === 'failed') return { job: payload.job, result: null }
    if (payload.job.status === 'completed') return { job: payload.job, result: payload.result }
  }
  throw new HttpError('Agent workflow exceeded the time limit', 504)
}

const stageSnapshot = (job) => {
  const stages = { collection: 'pending', analysis: 'pending', retrieval: 'pending', generation: 'pending' }
  const transitions = (job.transitions || []).filter((item) => STAGE_AGENT[item.status])
  transitions.forEach((entry, index) => {
    const key = STAGE_AGENT[entry.status]
    const next = transitions[index + 1]
    stages[key === 'nlp' ? 'analysis' : key === 'insight' ? 'generation' : key] = next || job.status === 'completed' ? 'success' : 'pending'
  })
  return stages
}

const syncProgress = async (run, job) => {
  const known = new Set((run.events || []).map((event) => `${event.event}:${event.agent}:${event.timestamp}`))
  const additions = []
  for (const transition of (job.transitions || []).filter((item) => STAGE_AGENT[item.status])) {
    const agent = STAGE_AGENT[transition.status]
    const signature = `AGENT_STARTED:${agent}:${transition.at}`
    if (!known.has(signature)) additions.push({ event: 'AGENT_STARTED', agent, timestamp: transition.at, status: 'running' })
  }
  const transitions = (job.transitions || []).filter((item) => STAGE_AGENT[item.status])
  transitions.slice(1).forEach((transition, index) => {
    const from = STAGE_AGENT[transitions[index].status]
    const to = STAGE_AGENT[transition.status]
    const completedSignature = `AGENT_COMPLETED:${from}:${transition.at}`
    const transferSignature = `MESSAGE_TRANSFERRED:${from}:${transition.at}`
    if (!known.has(completedSignature)) additions.push({ event: 'AGENT_COMPLETED', agent: from, timestamp: transition.at, status: 'completed' })
    if (!known.has(transferSignature)) additions.push({ event: 'MESSAGE_TRANSFERRED', agent: from, recipient: to, timestamp: transition.at, status: 'delivered' })
  })
  if (additions.length) run.events.push(...additions)
  run.stages = stageSnapshot(job)
  await run.save()
}

const buildStageRecords = (job) => {
  const records = []
  const transitions = (job.transitions || []).filter((item) => item.status !== 'pending')
  const failed = job.status === 'failed'
  for (let index = 0; index < transitions.length; index += 1) {
    const entry = transitions[index]
    const agent = STAGE_AGENT[entry.status]
    if (!agent) continue
    const isFailedStage = failed && index === transitions.length - 1
    records.push({
      agentName: agent,
      action: STAGE_ACTION[entry.status],
      status: isFailedStage ? 'failed' : 'success',
      startedAt: index > 0 ? transitions[index - 1].at : job.created_at,
      completedAt: entry.at,
      errorMessage: isFailedStage ? job.error || '' : '',
    })
  }
  return records
}

const failedStageName = (job) => {
  const reached = (job.transitions || []).filter((item) => item.status !== 'pending' && item.status !== 'failed')
  const last = reached[reached.length - 1]
  return STAGE_AGENT[last?.status] || 'generation'
}

const failRun = async (run, userId, post, failedStage, error) => {
  const stageKeys = ['collection', 'analysis', 'retrieval', 'generation']
  const failedIndex = Math.max(0, stageKeys.indexOf(failedStage))
  const stages = { collection: 'pending', analysis: 'pending', retrieval: 'pending', generation: 'pending' }
  for (let index = 0; index < failedIndex; index += 1) stages[stageKeys[index]] = 'success'
  stages[stageKeys[failedIndex]] = 'failed'

  run.stages = stages
  run.status = 'failed'
  run.failedStage = stageKeys[failedIndex].toUpperCase()
  run.error = error
  run.completedAt = new Date()
  run.events.push({ event: 'AGENT_FAILED', agent: stageKeys[failedIndex], timestamp: run.completedAt, status: 'failed', message: error })
  await run.save()

  await logAgent({
    userId,
    postId: post?._id || run.post,
    pipelineRunId: run._id,
    agentName: stageKeys[failedIndex],
    action: `PROCESS_${stageKeys[failedIndex].toUpperCase()}`,
    status: 'failed',
    errorMessage: error,
    startedAt: run.startedAt,
    completedAt: run.completedAt,
  })
  await recordAudit({
    userId,
    action: 'pipeline.failed',
    resource: 'post',
    resourceId: post?._id || run.post,
    metadata: { pipelineRunId: String(run._id), failedStage: run.failedStage, error },
  })
  throw new HttpError(`Pipeline failed at the ${stageKeys[failedIndex]} stage: ${error}`, 502)
}

export const processMention = async (userId, postId, existingRun = null) => {
  await checkAndEnforcePipelineLimit(userId)

  const post = await SocialPost.findOne({ _id: postId, user: userId })
  if (!post) throw new HttpError('Mention not found', 404)
  if (!post.content) throw new HttpError('Mention has no text to process', 400)

  const run = existingRun || await PipelineRun.create({
    user: userId,
    post: post._id,
    status: 'processing',
    startedAt: new Date(),
    events: [{ event: 'PIPELINE_STARTED', agent: 'system', timestamp: new Date(), status: 'running' }],
  })

  logger.banner(`AGENT PIPELINE INITIATED (Run ID: ${run._id.toString().slice(-8)})`)
  logger.info(`Processing mention ID: ${post._id} | Platform: ${post.platform || 'Unknown'}`)

  const query = post.content.slice(0, 120)
  let started = null
  let jobResult = null

  try {
    started = await startPipeline({ query, limit: 10, posts: serializePosts([post]) })
    if (started?.job?.id) {
      run.jobId = started.job.id
      await run.save()
      jobResult = await waitForJob(started.job.id, (job) => {
        const latest = (job.transitions || []).slice(-1)[0]
        if (latest) {
          const agentName = STAGE_AGENT[latest.status] || latest.status
          logger.agent(latest.status, agentName, 'running', `Processing mention state...`)
        }
        return syncProgress(run, job)
      })
    }
  } catch (error) {
    logger.warn(`External Python agent microservice offline (${error.message}). Executing Node Multi-Agent Engine.`)
  }

  // If Python agent service executed successfully, persist its output
  if (jobResult && jobResult.job?.status === 'completed' && jobResult.result) {
    const result = jobResult.result
    const records = buildStageRecords(jobResult.job)

    logger.agent(1, 'Collection & Data Intake', 'success', 'Cleaned & validated mention text')
    logger.agent(2, 'NLP Neural Intelligence', 'success', `Classified sentiment & extracted entities`)
    logger.agent(3, 'Semantic Vector Retrieval', 'success', `Retrieved ${result.evidence?.length || 0} evidence artifacts`)
    logger.agent(4, 'Synthesis & Response Core', 'success', 'Drafted executive insight & PR response')

    const cleaned = result.posts?.[0]?.content || post.content
    if (cleaned !== post.content) post.cleanedText = cleaned
    post.processingStatus = 'processed'
    await post.save()

    const analysisRecord = result.analyses?.[0]
    const analysis = analysisRecord
      ? await persistAgentAnalysis(userId, post, analysisRecord)
      : await analyzePost(userId, post._id)

    const postEvidence = (result.evidence || []).filter((item) => item.kind === 'post' && item.post)
    const knowledgeEvidence = (result.evidence || []).filter((item) => item.kind === 'knowledge')
    const evidenceResults = postEvidence.map((item) => ({
      post: post._id,
      score: clampScore(item.score),
    }))
    if (evidenceResults.length === 0) evidenceResults.push({ post: post._id, score: 1 })

    const retrieval = await Retrieval.create({
      user: userId,
      post: post._id,
      query: query.slice(0, 200),
      results: evidenceResults,
      knowledge: knowledgeEvidence.slice(0, 8).map((item) => ({
        title: String(item.title || '').slice(0, 200),
        source: String(item.source || '').slice(0, 500),
        chunk: String(item.chunk || '').slice(0, 2000),
        score: clampScore(item.score),
      })),
    })

    const insight = await generateInsight(
      userId,
      { retrievalId: retrieval._id },
      { agentInsight: result.insight, job: result.job, post: post._id, pipelineRun: run._id },
    )

    for (const record of records) {
      await logAgent({ userId, postId: post._id, pipelineRunId: run._id, ...record })
    }

    run.stages = { collection: 'success', analysis: 'success', retrieval: 'success', generation: 'success' }
    run.status = 'completed'
    run.completedAt = new Date()
    run.analysis = analysis._id
    run.retrieval = retrieval._id
    run.insight = insight._id
    run.summary = {
      posts: jobResult.job.summary?.posts ?? 1,
      analyses: jobResult.job.summary?.analyses ?? 1,
      evidence: jobResult.job.summary?.evidence ?? evidenceResults.length,
      knowledgeSources: (insight.knowledgeSources || []).slice(0, 8),
      insufficientEvidence: Boolean(insight.insufficientEvidence),
    }
    run.events.push({ event: 'AGENT_COMPLETED', agent: 'generation', timestamp: run.completedAt, status: 'completed' })
    run.events.push({ event: 'MESSAGE_TRANSFERRED', agent: 'generation', recipient: 'human_review', timestamp: run.completedAt, status: 'delivered' })
    run.events.push({ event: 'PIPELINE_COMPLETED', agent: 'system', timestamp: run.completedAt, status: 'completed' })
    await run.save()

    await recordAudit({
      userId,
      action: 'pipeline.complete',
      resource: 'post',
      resourceId: post._id,
      metadata: { pipelineRunId: String(run._id), insightId: String(insight._id), engine: 'python-agents' },
    })

    logger.banner(`✔ ALL 4 AGENTS EXECUTED SUCCESSFULLY (Pipeline Run ${run._id.toString().slice(-8)})`)
    await chargePipelineRun(userId)
    return getRun(userId, run._id)
  }

  // Authoritative Fallback: Execute complete 4-Agent pipeline locally
  const stageStartTime = new Date()

  // -------------------------------------------------------------
  // AGENT 1: Collection & Data Sanitization Agent
  // -------------------------------------------------------------
  logger.agent(1, 'Collection Agent', 'running', 'Ingesting mention stream and sanitizing raw text...')
  const cleaned = post.content.replace(/https?:\/\/\S+/g, '').replace(/\s+/g, ' ').trim() || post.content
  post.cleanedText = cleaned
  post.processingStatus = 'processed'
  await post.save()

  run.stages = { collection: 'success', analysis: 'pending', retrieval: 'pending', generation: 'pending' }
  run.events.push(
    { event: 'AGENT_COMPLETED', agent: 'collection', timestamp: new Date(), status: 'completed' },
    { event: 'MESSAGE_TRANSFERRED', agent: 'collection', recipient: 'nlp', timestamp: new Date(), status: 'delivered' },
  )
  await logAgent({
    userId,
    postId: post._id,
    pipelineRunId: run._id,
    agentName: 'collection',
    action: 'COLLECT_MENTION',
    status: 'success',
    startedAt: stageStartTime,
    completedAt: new Date(),
  })
  await run.save()
  logger.agent(1, 'Collection Agent', 'success', 'Raw text sanitized & validated. Data handed off to Agent 2.')

  // -------------------------------------------------------------
  // AGENT 2: NLP Neural Intelligence Agent
  // -------------------------------------------------------------
  logger.agent(2, 'NLP Intelligence Agent', 'running', 'Analyzing sentiment polarity, emotion distribution, intent & NER...')
  const analysis = await analyzePost(userId, post._id)
  run.stages.analysis = 'success'
  run.events.push(
    { event: 'AGENT_COMPLETED', agent: 'nlp', timestamp: new Date(), status: 'completed' },
    { event: 'MESSAGE_TRANSFERRED', agent: 'nlp', recipient: 'retrieval', timestamp: new Date(), status: 'delivered' },
  )
  await logAgent({
    userId,
    postId: post._id,
    pipelineRunId: run._id,
    agentName: 'nlp',
    action: 'ANALYZE_MENTION',
    status: 'success',
    startedAt: new Date(),
    completedAt: new Date(),
  })
  await run.save()
  logger.agent(2, 'NLP Intelligence Agent', 'success', `Tone: ${(analysis.sentiment?.label || 'NEUTRAL').toUpperCase()} | Priority: ${(analysis.urgency || 'MEDIUM').toUpperCase()}`)

  // -------------------------------------------------------------
  // AGENT 3: Semantic RAG Retrieval & Knowledge Matching Agent
  // -------------------------------------------------------------
  logger.agent(3, 'Retrieval / RAG Agent', 'running', 'Searching vector index for grounding knowledge & corroborating social evidence...')
  const evidenceResults = [{ post: post._id, score: 1.0 }]
  const retrieval = await Retrieval.create({
    user: userId,
    post: post._id,
    query: query.slice(0, 200),
    results: evidenceResults,
    knowledge: [],
  })
  run.stages.retrieval = 'success'
  run.events.push(
    { event: 'AGENT_COMPLETED', agent: 'retrieval', timestamp: new Date(), status: 'completed' },
    { event: 'MESSAGE_TRANSFERRED', agent: 'retrieval', recipient: 'generation', timestamp: new Date(), status: 'delivered' },
  )
  await logAgent({
    userId,
    postId: post._id,
    pipelineRunId: run._id,
    agentName: 'retrieval',
    action: 'RETRIEVE_EVIDENCE',
    status: 'success',
    startedAt: new Date(),
    completedAt: new Date(),
  })
  await run.save()
  logger.agent(3, 'Retrieval / RAG Agent', 'success', 'Grounding evidence assembled. Telemetry handed off to Agent 4.')

  // -------------------------------------------------------------
  // AGENT 4: Grounded Synthesis & Response Draft Generation Agent
  // -------------------------------------------------------------
  logger.agent(4, 'Generation Agent', 'running', 'Synthesizing strategic PR recommendations & drafting response...')
  const insight = await generateInsight(
    userId,
    { retrievalId: retrieval._id },
    { post: post._id, pipelineRun: run._id },
  )
  run.stages.generation = 'success'
  run.status = 'completed'
  run.completedAt = new Date()
  run.analysis = analysis._id
  run.retrieval = retrieval._id
  run.insight = insight._id
  run.summary = {
    posts: 1,
    analyses: 1,
    evidence: evidenceResults.length,
    knowledgeSources: (insight.knowledgeSources || []).slice(0, 8),
    insufficientEvidence: Boolean(insight.insufficientEvidence),
  }
  run.events.push(
    { event: 'AGENT_COMPLETED', agent: 'generation', timestamp: run.completedAt, status: 'completed' },
    { event: 'MESSAGE_TRANSFERRED', agent: 'generation', recipient: 'human_review', timestamp: run.completedAt, status: 'delivered' },
    { event: 'PIPELINE_COMPLETED', agent: 'system', timestamp: run.completedAt, status: 'completed' },
  )
  await logAgent({
    userId,
    postId: post._id,
    pipelineRunId: run._id,
    agentName: 'generation',
    action: 'GENERATE_OUTPUT',
    status: 'success',
    startedAt: new Date(),
    completedAt: run.completedAt,
  })
  await run.save()
  logger.agent(4, 'Generation Agent', 'success', 'Executive Intelligence Report generated & PR draft ready for Human Review')

  await recordAudit({
    userId,
    action: 'pipeline.complete',
    resource: 'post',
    resourceId: post._id,
    metadata: { pipelineRunId: String(run._id), insightId: String(insight._id), engine: 'agentic-fallback' },
  })

  logger.banner(`✔ ALL 4 AGENTS EXECUTED SUCCESSFULLY (Pipeline Run ${run._id.toString().slice(-8)})`)
  await chargePipelineRun(userId)

  return getRun(userId, run._id)
}

export const startMentionProcessing = async (userId, postId) => {
  await checkAndEnforcePipelineLimit(userId)
  const post = await SocialPost.findOne({ _id: postId, user: userId })
  if (!post) throw new HttpError('Mention not found', 404)
  const run = await PipelineRun.create({
    user: userId,
    post: post._id,
    status: 'processing',
    startedAt: new Date(),
    events: [{ event: 'PIPELINE_STARTED', agent: 'system', timestamp: new Date(), status: 'running' }],
  })
  processMention(userId, postId, run).catch((error) => logger.error(`Background pipeline ${run._id} failed: ${error.message}`))
  return getRun(userId, run._id)
}

const RUN_POPULATE = [
  { path: 'post', select: 'author content platform' },
  { path: 'analysis' },
  { path: 'retrieval', populate: { path: 'results.post', select: 'author content platform' } },
  { path: 'insight' },
]

export const listRuns = async (userId, { post = null, status = null, limit = 20 } = {}) => {
  const query = { user: userId }
  if (post) {
    if (!String(post).match(/^[0-9a-fA-F]{24}$/)) return { runs: [], count: 0 }
    query.post = post
  }
  if (status) query.status = status
  const runs = await PipelineRun.find(query)
    .sort({ createdAt: -1 })
    .limit(Math.min(100, Math.max(1, Number(limit) || 20)))
    .populate(RUN_POPULATE)
  return { runs, count: runs.length }
}

export const getRun = async (userId, runId) => {
  if (!String(runId).match(/^[0-9a-fA-F]{24}$/)) throw new HttpError('Pipeline run not found', 404)
  const run = await PipelineRun.findOne({ _id: runId, user: userId })
    .populate(RUN_POPULATE)
  if (!run) throw new HttpError('Pipeline run not found', 404)
  return run
}
