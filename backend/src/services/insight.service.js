import mongoose from 'mongoose'
import Insight from '../models/Insight.js'
import Analysis from '../models/Analysis.js'
import SocialPost from '../models/SocialPost.js'
import Retrieval from '../models/Retrieval.js'
import { HttpError } from '../utils/httpError.js'
import { exportInsightReport } from './reportExporter.js'
import { generateGroundedDraft } from './llm.service.js'
import { recordAudit } from './audit.service.js'
import {
  round,
  computeSentimentDistribution,
  aggregateTopItems,
  getDominantLabel,
} from './metrics.js'

const NOT_FOUND_MESSAGE = 'Insight not found'
const POST_FIELDS = 'platform author content publishedAt createdAt'
const TOP_POSTS_LIMIT = 3
const TOP_ITEMS_LIMIT = 5

const ensureValidId = (insightId) => {
  if (!mongoose.isValidObjectId(insightId)) {
    throw new HttpError(NOT_FOUND_MESSAGE, 404)
  }
}

const getScope = async (userId, retrievalId) => {
  if (!retrievalId) {
    return { postIds: null, retrieval: null, groundedQuery: null }
  }

  if (!mongoose.isValidObjectId(retrievalId)) {
    throw new HttpError('Retrieval not found', 404)
  }

  const retrieval = await Retrieval.findOne({ _id: retrievalId, user: userId }).lean()
  if (!retrieval) {
    throw new HttpError('Retrieval not found', 404)
  }

  const postIds = (retrieval.results || [])
    .map((result) => result.post)
    .filter((postId) => postId !== null && postId !== undefined)

  if (postIds.length === 0) {
    throw new HttpError('The selected search has no retrievable posts', 400)
  }

  return { postIds, retrieval, groundedQuery: retrieval.query }
}

const plural = (count) => (count === 1 ? 'post' : 'posts')

const buildRecommendations = ({
  negativeAnalyses,
  positiveAnalyses,
  labels,
  averageScore,
  totalPosts,
  totalEngagement,
  topTopics,
  groundedQuery,
  commentDiscourse = null,
}) => {
  const analyzedCount = negativeAnalyses.length + positiveAnalyses.length + labels.neutral
  const recommendations = []

  recommendations.push(
    `Overall sentiment is ${getDominantLabel(labels)} with an average sentiment score of ${averageScore.toFixed(2)} across ${analyzedCount} analyzed ${plural(analyzedCount)}.`,
  )

  const negativeTopic = aggregateTopItems(negativeAnalyses, 'topics', TOP_ITEMS_LIMIT)[0]
  if (labels.negative > 0) {
    recommendations.push(
      negativeTopic
        ? `Negative feedback clusters around "${negativeTopic.name}" (${negativeTopic.count} analyzed ${plural(negativeTopic.count)}). Review the negative posts below to identify root causes.`
        : `${labels.negative} analyzed ${plural(labels.negative)} show negative sentiment. Review them to identify root causes.`,
    )
  }

  const positiveTopic = aggregateTopItems(positiveAnalyses, 'topics', TOP_ITEMS_LIMIT)[0]
  if (labels.positive > 0 && labels.positive / analyzedCount >= 0.5) {
    recommendations.push(
      positiveTopic
        ? `Positive sentiment is strong around "${positiveTopic.name}". Reinforce this theme in future messaging.`
        : `Positive sentiment is strong (${labels.positive} ${plural(labels.positive)}). Keep amplifying the themes that users respond to.`,
    )
  }

  if (commentDiscourse && commentDiscourse.totalCommentsRead > 0) {
    const { totalCommentsRead, intentCounts = {}, questions = [], complaints = [] } = commentDiscourse
    if (intentCounts.complaint > 0) {
      recommendations.push(
        `High-priority comment friction: Detected ${intentCounts.complaint} direct customer complaint(s) in the conversation stream. Immediate clarification is advised.`,
      )
    }
    if (intentCounts.question > 0) {
      recommendations.push(
        `Audience inquiry engagement: ${intentCounts.question} user question(s) identified. Publish the grounded PR response to provide official answers.`,
      )
    }
    if (intentCounts.suggestion > 0) {
      recommendations.push(
        `Community product feedback: ${intentCounts.suggestion} feature request(s)/suggestion(s) gathered from public replies.`,
      )
    }
  }

  recommendations.push(
    `The collection has generated ${totalEngagement.likes} likes, ${totalEngagement.shares} shares, and ${totalEngagement.comments} comments across ${totalPosts} collected ${plural(totalPosts)}.`,
  )

  if (topTopics.length > 0) {
    recommendations.push(
      `The most discussed theme across your data is "${topTopics[0].name}", which appears in ${topTopics[0].count} analyzed ${plural(topTopics[0].count)}.`,
    )
  }

  if (groundedQuery) {
    recommendations.push(`This report is grounded in the saved search "${groundedQuery}".`)
  }

  if (analyzedCount === 0) {
    recommendations.push(
      'No analyzed posts exist yet. Run the NLP analysis on collected posts before generating reports.',
    )
  }

  return recommendations
}

const buildReport = ({ posts, analyses, groundedQuery }) => {
  const analyzedCount = analyses.length
  const analysesWithPosts = analyses.filter((analysis) => analysis.post)
  const { distribution, averageScore, positivePercent, negativePercent, neutralPercent } =
    computeSentimentDistribution(analyses)

  const totalEngagement = posts.reduce(
    (totals, post) => ({
      likes: totals.likes + (post.engagement?.likes || 0),
      shares: totals.shares + (post.engagement?.shares || 0),
      comments: totals.comments + (post.engagement?.comments || 0),
    }),
    { likes: 0, shares: 0, comments: 0 },
  )

  // Aggregate all read comments across analyses
  const allComments = analyses.flatMap((a) => a.commentAnalyses || [])
  const commentIntentCounts = allComments.reduce(
    (acc, c) => {
      const intent = c.intent || 'other'
      acc[intent] = (acc[intent] || 0) + 1
      return acc
    },
    { question: 0, complaint: 0, praise: 0, suggestion: 0, spam: 0, other: 0 },
  )
  const commentSentimentCounts = allComments.reduce(
    (acc, c) => {
      const label = c.sentiment?.label || 'neutral'
      acc[label] = (acc[label] || 0) + 1
      return acc
    },
    { positive: 0, negative: 0, neutral: 0 },
  )

  const commentDiscourse = {
    totalCommentsRead: allComments.length,
    intentCounts: commentIntentCounts,
    sentimentCounts: commentSentimentCounts,
    comments: allComments.slice(0, 30),
    questions: allComments.filter((c) => c.intent === 'question' || String(c.content).includes('?')).slice(0, 10),
    complaints: allComments.filter((c) => c.intent === 'complaint' || c.sentiment?.label === 'negative').slice(0, 10),
  }

  const sortedByScore = [...analysesWithPosts].sort((a, b) => a.sentiment.score - b.sentiment.score)
  const topNegativePosts = sortedByScore
    .slice(0, TOP_POSTS_LIMIT)
    .map((analysis) => ({ post: analysis.post._id, score: analysis.sentiment.score }))
  const topPositivePosts = sortedByScore
    .slice(-TOP_POSTS_LIMIT)
    .reverse()
    .map((analysis) => ({ post: analysis.post._id, score: analysis.sentiment.score }))

  const topTopics = aggregateTopItems(analyses, 'topics', TOP_ITEMS_LIMIT).map(({ name, count }) => ({
    topic: name,
    count,
  }))
  const topEntities = aggregateTopItems(analyses, 'entities', TOP_ITEMS_LIMIT).map(({ name, count }) => ({
    entity: name,
    count,
  }))

  const dominantLabel = getDominantLabel(distribution)
  const dominantPercent =
    analyzedCount === 0 ? 0 : round((distribution[dominantLabel] / analyzedCount) * 100, 1)

  let summary = `Your collection covers ${posts.length} collected ${plural(posts.length)}, ${analyzedCount} of which have been analyzed.`

  if (analyzedCount === 0) {
    summary += ' No sentiment insights are available yet.'
  } else {
    summary += ` Overall sentiment is ${dominantLabel} (${dominantPercent}% of analyzed posts) with an average sentiment score of ${averageScore.toFixed(2)}.`
    if (topTopics.length > 0) {
      summary += ` The dominant theme is "${topTopics[0].topic}".`
    }
    if (commentDiscourse.totalCommentsRead > 0) {
      summary += ` Additionally, ${commentDiscourse.totalCommentsRead} individual public comments were read and analyzed (${commentDiscourse.intentCounts.question || 0} questions, ${commentDiscourse.intentCounts.complaint || 0} complaints).`
    }
  }

  const negativeAnalyses = analyses.filter((analysis) => analysis.sentiment.label === 'negative')
  const positiveAnalyses = analyses.filter((analysis) => analysis.sentiment.label === 'positive')

  const recommendations = buildRecommendations({
    negativeAnalyses,
    positiveAnalyses,
    labels: distribution,
    averageScore,
    totalPosts: posts.length,
    totalEngagement,
    topTopics,
    groundedQuery,
    commentDiscourse,
  })

  return {
    summary,
    statistics: {
      totalPosts: posts.length,
      analyzedPosts: analyzedCount,
      sentimentDistribution: {
        ...distribution,
        positivePercent,
        negativePercent,
        neutralPercent,
      },
      averageSentimentScore: averageScore,
      totalEngagement,
    },
    topTopics,
    topEntities,
    topPositivePosts,
    topNegativePosts,
    recommendations,
    commentDiscourse,
  }
}

export const generateInsight = async (
  userId,
  { retrievalId } = {},
  { agentInsight = null, job = null, post = null, pipelineRun = null, useExternalLlm = true } = {},
) => {
  const { postIds, retrieval, groundedQuery } = await getScope(userId, retrievalId)

  const postFilter = postIds ? { user: userId, _id: { $in: postIds } } : { user: userId }
  const analysisFilter = postIds ? { user: userId, post: { $in: postIds } } : { user: userId }

  const posts = await SocialPost.find(postFilter)
  const analyses = await Analysis.find(analysisFilter).populate('post', POST_FIELDS)

  const report = buildReport({ posts, analyses, groundedQuery })

  const retrievalScores = new Map((retrieval?.results || []).map((item) => [String(item.post), item.score]))
  const evidencePosts = posts.slice(0, 10)
  const evidence = evidencePosts.map((post) => ({
    post: post._id,
    score: retrievalScores.get(String(post._id)) ?? 1,
  }))

  const knowledgeSources = (agentInsight?.knowledgeSources || retrieval?.knowledge || []).slice(0, 10).map((item) => ({
    title: String(item.title || '').slice(0, 200),
    source: String(item.source || '').slice(0, 500),
    chunk: String(item.chunk || '').slice(0, 2000),
    score: Math.max(0, Math.min(1, round(Number(item.score) || 0, 4))),
  }))

  const readComments = report.commentDiscourse?.comments || []

  const groundedDraft = agentInsight?.draftResponse
    ? {
        provider: agentInsight.generation?.provider || 'python-agent',
        model: agentInsight.generation?.model || 'grounded-rag-template-v2',
        warning: agentInsight.generation?.warning || '',
        rationale: `Grounded on ${knowledgeSources.length} knowledge source(s), ${evidence.length} evidence item(s), and ${readComments.length} analyzed comment(s).`,
        draft: agentInsight.draftResponse,
      }
    : await generateGroundedDraft({
        query: groundedQuery,
        negativeTopic: report.topTopics[0]?.topic,
        evidence: evidencePosts.map((post) => ({ id: String(post._id), content: post.content })),
        comments: readComments,
        knowledgeSources,
        useExternalLlm,
      })

  const overrides = agentInsight
    ? {
        summary: agentInsight.summary || report.summary,
        recommendations: agentInsight.recommendations?.length ? agentInsight.recommendations : report.recommendations,
        knowledgeSources,
        insufficientEvidence: Boolean(agentInsight.insufficientEvidence),
        agentMetadata: {
          priorityDistribution: agentInsight.statistics?.priorityDistribution || {},
          emotionDistribution: agentInsight.statistics?.emotionDistribution || {},
          intentDistribution: agentInsight.statistics?.intentDistribution || {},
          commentDiscourse: report.commentDiscourse || {},
          job: job ? { id: job.id, status: job.status } : null,
        },
      }
    : {
        knowledgeSources,
        agentMetadata: {
          commentDiscourse: report.commentDiscourse || {},
        },
      }

  const insight = await Insight.create({
    user: userId,
    retrieval: retrieval ? retrieval._id : null,
    post: post || null,
    pipelineRun: pipelineRun || null,
    ...report,
    ...overrides,
    evidence,
    generation: {
      provider: groundedDraft.provider,
      model: groundedDraft.model,
      warning: groundedDraft.warning,
      rationale: groundedDraft.rationale,
    },
    draftResponse: groundedDraft.draft,
  })

  await recordAudit({ userId, action: 'insight.generate', resource: 'insight', resourceId: insight._id, metadata: { provider: groundedDraft.provider, evidenceCount: evidence.length, knowledgeSources: overrides.knowledgeSources?.length || 0, commentsRead: readComments.length } })

  return getInsight(userId, insight._id)
}


export const listInsights = async (userId) => {
  return Insight.find({ user: userId })
    .sort({ createdAt: -1 })
    .populate('retrieval', 'query')
}

export const getInsight = async (userId, insightId) => {
  ensureValidId(insightId)

  const insight = await Insight.findOne({ _id: insightId, user: userId }).populate([
    { path: 'topPositivePosts.post', select: POST_FIELDS },
    { path: 'topNegativePosts.post', select: POST_FIELDS },
    { path: 'retrieval', select: 'query' },
    { path: 'evidence.post', select: POST_FIELDS },
  ])

  if (!insight) {
    throw new HttpError(NOT_FOUND_MESSAGE, 404)
  }

  insight.topPositivePosts = insight.topPositivePosts.filter(({ post }) => post)
  insight.topNegativePosts = insight.topNegativePosts.filter(({ post }) => post)

  return insight
}

export const reviewInsight = async (userId, insightId, { status, editedDraft = '', note = '' }) => {
  ensureValidId(insightId)
  const insight = await Insight.findOneAndUpdate(
    { _id: insightId, user: userId },
    { review: { status, editedDraft: editedDraft.trim(), note: note.trim(), reviewedAt: new Date() } },
    { returnDocument: 'after', runValidators: true },
  )
  if (!insight) throw new HttpError(NOT_FOUND_MESSAGE, 404)
  await recordAudit({ userId, action: `insight.${status}`, resource: 'insight', resourceId: insight._id, metadata: { edited: Boolean(editedDraft.trim()), note: note.trim() } })
  return getInsight(userId, insightId)
}

export const deleteInsight = async (userId, insightId) => {
  ensureValidId(insightId)

  const insight = await Insight.findOneAndDelete({ _id: insightId, user: userId })
  if (!insight) {
    throw new HttpError(NOT_FOUND_MESSAGE, 404)
  }

  return insight
}

export const exportInsight = async (userId, insightId, format) => {
  const insight = await getInsight(userId, insightId)
  const exported = exportInsightReport(insight, format)
  return { ...exported, content: await exported.content }
}
