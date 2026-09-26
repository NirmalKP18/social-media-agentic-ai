import mongoose from 'mongoose'
import Analysis from '../models/Analysis.js'
import SocialPost from '../models/SocialPost.js'
import { analyzeText } from './nlpService.js'
import { HttpError } from '../utils/httpError.js'
import Alert from '../models/Alert.js'
import { recordAudit } from './audit.service.js'

const NOT_FOUND_MESSAGE = 'Analysis not found'
const POST_FIELDS = 'platform author content publishedAt createdAt'

const ensureValidId = (recordId) => {
  if (!mongoose.isValidObjectId(recordId)) {
    throw new HttpError(NOT_FOUND_MESSAGE, 404)
  }
}

const getOwnedPost = async (userId, postId) => {
  if (!mongoose.isValidObjectId(postId)) {
    throw new HttpError('Post not found', 404)
  }

  const post = await SocialPost.findOne({ _id: postId, user: userId })
  if (!post) {
    throw new HttpError('Post not found', 404)
  }

  return post
}

export const analyzePost = async (userId, postId) => {
  const post = await getOwnedPost(userId, postId)
  const result = analyzeText(post.content)

  const commentAnalyses = (post.comments || []).map((comment) => {
    const analysis = analyzeText(comment.content)
    return {
      author: comment.author || 'commenter',
      content: comment.content,
      sentiment: analysis.sentiment,
      topics: analysis.topics,
      entities: analysis.entities,
      intent: analysis.intent,
      emotion: analysis.emotion,
      priority: analysis.priority,
      summary: analysis.summary,
    }
  })

  const conversationCounts = commentAnalyses.reduce(
    (counts, item) => {
      counts[item.sentiment.label] = (counts[item.sentiment.label] || 0) + 1
      counts.score += item.sentiment.score
      if (item.intent === 'question') counts.questions += 1
      else if (item.intent === 'complaint') counts.complaints += 1
      else if (item.intent === 'praise') counts.praise += 1
      else if (item.intent === 'suggestion') counts.suggestions += 1
      return counts
    },
    { positive: 0, negative: 0, neutral: 0, score: 0, questions: 0, complaints: 0, praise: 0, suggestions: 0 },
  )

  const totalComments = commentAnalyses.length
  const averageScore = totalComments ? Number((conversationCounts.score / totalComments).toFixed(3)) : 0
  const backlashRatio = totalComments ? Number((conversationCounts.negative / totalComments).toFixed(3)) : 0

  const conversation = {
    totalComments,
    positive: conversationCounts.positive,
    negative: conversationCounts.negative,
    neutral: conversationCounts.neutral,
    questions: conversationCounts.questions,
    complaints: conversationCounts.complaints,
    praise: conversationCounts.praise,
    suggestions: conversationCounts.suggestions,
    averageScore,
    backlashRatio,
  }

  // Synthesize overall priority factoring in comment backlash
  let priority = result.priority
  if (backlashRatio >= 0.4 || conversationCounts.complaints >= 2) {
    priority = {
      level: 'urgent',
      score: Math.max(priority.score, 85),
      factors: [...new Set([...priority.factors, 'High comment backlash & multiple user complaints detected'])],
    }
  } else if (conversationCounts.questions >= 2) {
    priority = {
      level: priority.level === 'low' ? 'medium' : priority.level,
      score: Math.max(priority.score, 50),
      factors: [...new Set([...priority.factors, 'Multiple public customer inquiries requiring reply'])],
    }
  }

  const analysis = await Analysis.findOneAndUpdate(
    { post: post._id },
    {
      user: userId,
      post: post._id,
      ...result,
      priority,
      commentAnalyses,
      conversation,
    },
    {
      upsert: true,
      returnDocument: 'after',
      runValidators: true,
      setDefaultsOnInsert: true,
    },
  )

  const isSevere = result.sentiment.label === 'negative' || backlashRatio >= 0.5
  if (isSevere) {
    await Alert.findOneAndUpdate(
      { user: userId, post: post._id, type: 'negative_sentiment' },
      {
        analysis: analysis._id,
        severity: result.sentiment.score <= -0.6 || backlashRatio >= 0.6 ? 'high' : 'medium',
        message: `Negative sentiment / comment backlash detected in a ${post.platform} post by ${post.author} (${conversationCounts.complaints} complaint comments).`,
        status: 'open',
      },
      { upsert: true, runValidators: true, setDefaultsOnInsert: true },
    )
  } else {
    await Alert.deleteOne({ user: userId, post: post._id, type: 'negative_sentiment', status: 'open' })
  }
  await recordAudit({
    userId,
    action: 'nlp.analyze',
    resource: 'analysis',
    resourceId: analysis._id,
    metadata: {
      postId: String(post._id),
      sentiment: result.sentiment.label,
      commentsRead: totalComments,
      complaints: conversationCounts.complaints,
    },
  })

  return analysis
}

export const getAnalysisForPost = async (userId, postId) => {
  if (!mongoose.isValidObjectId(postId)) {
    throw new HttpError('Post not found', 404)
  }

  const post = await SocialPost.findOne({ _id: postId, user: userId },
    { _id: 1 })
  if (!post) {
    throw new HttpError('Post not found', 404)
  }

  return Analysis.findOne({ post: post._id, user: userId })
}

export const listAnalyses = async (userId) => {
  return Analysis.find({ user: userId })
    .sort({ createdAt: -1 })
    .populate('post', POST_FIELDS)
}

export const getAnalysis = async (userId, analysisId) => {
  ensureValidId(analysisId)

  const analysis = await Analysis.findOne({ _id: analysisId, user: userId }).populate('post', POST_FIELDS)
  if (!analysis) {
    throw new HttpError(NOT_FOUND_MESSAGE, 404)
  }

  return analysis
}

export const deleteAnalysis = async (userId, analysisId) => {
  ensureValidId(analysisId)

  const analysis = await Analysis.findOneAndDelete({ _id: analysisId, user: userId })
  if (!analysis) {
    throw new HttpError(NOT_FOUND_MESSAGE, 404)
  }

  return analysis
}
