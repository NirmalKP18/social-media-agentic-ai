import {
  computeSentimentDistribution,
  aggregateTopItems,
  getDominantLabel,
} from './metrics.js'

const TOP_TOPICS_LIMIT = 5
const RECENT_POSTS_LIMIT = 5
const TOTAL_ZERO = { likes: 0, shares: 0, comments: 0 }

export const compileDashboard = ({
  postsCount,
  analyses,
  retrievalsCount,
  insightsCount,
  engagement = TOTAL_ZERO,
  recentPosts = [],
  latestInsight = null,
}) => {
  const sentiment = computeSentimentDistribution(analyses)
  const topTopics = aggregateTopItems(analyses, 'topics', TOP_TOPICS_LIMIT).map(({ name, count }) => ({
    topic: name,
    count,
  }))

  return {
    counts: {
      posts: postsCount,
      analyzedPosts: analyses.length,
      retrievals: retrievalsCount,
      insights: insightsCount,
    },
    sentiment,
    dominantSentiment: getDominantLabel(sentiment.distribution),
    totalEngagement: {
      likes: engagement.likes ?? 0,
      shares: engagement.shares ?? 0,
      comments: engagement.comments ?? 0,
    },
    topTopics,
    recentPosts: recentPosts.slice(0, RECENT_POSTS_LIMIT),
    latestInsight,
  }
}
// [NirmalKP18-revision-tag-3]: feat(collection): implement exponential backoff metadata tags for retry queue
