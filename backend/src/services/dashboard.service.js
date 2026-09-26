import mongoose from 'mongoose'
import SocialPost from '../models/SocialPost.js'
import Analysis from '../models/Analysis.js'
import Retrieval from '../models/Retrieval.js'
import Insight from '../models/Insight.js'
import { compileDashboard } from './dashboardEngine.js'

const POST_FIELDS = 'platform author content publishedAt createdAt'

const getEngagementTotals = async (userId) => {
  const [aggregate] = await SocialPost.aggregate([
    { $match: { user: userId } },
    {
      $group: {
        _id: null,
        likes: { $sum: '$engagement.likes' },
        shares: { $sum: '$engagement.shares' },
        comments: { $sum: '$engagement.comments' },
      },
    },
  ])

  return aggregate || { likes: 0, shares: 0, comments: 0 }
}

export const getDashboardSummary = async (userId) => {
  if (!mongoose.isValidObjectId(userId)) {
    return compileDashboard({
      postsCount: 0,
      analyses: [],
      retrievalsCount: 0,
      insightsCount: 0,
    })
  }

  const [postsCount, analyses, retrievalsCount, insightsCount, engagement, recentPosts, latestInsight] =
    await Promise.all([
      SocialPost.countDocuments({ user: userId }),
      Analysis.find({ user: userId }).lean(),
      Retrieval.countDocuments({ user: userId }),
      Insight.countDocuments({ user: userId }),
      getEngagementTotals(userId),
      SocialPost.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select(POST_FIELDS)
        .lean(),
      Insight.findOne({ user: userId })
        .sort({ createdAt: -1 })
        .populate('retrieval', 'query'),
    ])

  return compileDashboard({
    postsCount,
    analyses,
    retrievalsCount,
    insightsCount,
    engagement,
    recentPosts,
    latestInsight,
  })
}