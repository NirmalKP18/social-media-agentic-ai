import { test } from 'node:test'
import assert from 'node:assert/strict'
import { compileDashboard } from '../src/services/dashboardEngine.js'

const analysis = (label, score, topics = [], entities = []) => ({
  sentiment: { label, score },
  topics,
  entities,
})

test('returns zeroed metrics for an empty dataset', () => {
  const result = compileDashboard({
    postsCount: 0,
    analyses: [],
    retrievalsCount: 0,
    insightsCount: 0,
  })

  assert.deepEqual(result.counts, { posts: 0, analyzedPosts: 0, retrievals: 0, insights: 0 })
  assert.deepEqual(result.sentiment.distribution, { positive: 0, negative: 0, neutral: 0 })
  assert.equal(result.sentiment.averageScore, 0)
  assert.equal(result.dominantSentiment, 'neutral')
  assert.deepEqual(result.topTopics, [])
  assert.deepEqual(result.recentPosts, [])
  assert.equal(result.latestInsight, null)
  assert.deepEqual(result.totalEngagement, { likes: 0, shares: 0, comments: 0 })
})

test('computes sentiment distribution, percentages and average score', () => {
  const result = compileDashboard({
    postsCount: 4,
    analyses: [
      analysis('positive', 0.9, ['camera']),
      analysis('positive', 0.6, ['camera']),
      analysis('negative', -0.5, ['battery']),
      analysis('neutral', 0.1, ['price']),
    ],
    retrievalsCount: 2,
    insightsCount: 1,
  })

  assert.equal(result.counts.posts, 4)
  assert.equal(result.counts.analyzedPosts, 4)
  assert.equal(result.counts.retrievals, 2)
  assert.equal(result.counts.insights, 1)
  assert.deepEqual(result.sentiment.distribution, { positive: 2, negative: 1, neutral: 1 })
  assert.equal(result.sentiment.positivePercent, 50)
  assert.equal(result.sentiment.negativePercent, 25)
  assert.equal(result.sentiment.neutralPercent, 25)
  assert.equal(result.sentiment.averageScore, 0.28)
  assert.equal(result.dominantSentiment, 'positive')
})

test('ranks top topics by frequency and takes the dominant theme', () => {
  const result = compileDashboard({
    postsCount: 0,
    analyses: [
      analysis('negative', -0.5, ['battery', 'battery', 'charging']),
      analysis('positive', 0.8, ['camera']),
      analysis('negative', -0.4, ['battery']),
    ],
    retrievalsCount: 0,
    insightsCount: 0,
  })

  assert.deepEqual(result.topTopics, [
    { topic: 'battery', count: 3 },
    { topic: 'charging', count: 1 },
    { topic: 'camera', count: 1 },
  ])
})

test('forwards engagement totals, recent posts and latest insight', () => {
  const recentPosts = [{ _id: 'p1' }, { _id: 'p2' }]
  const latestInsight = { _id: 'insight1', summary: 'hello' }

  const result = compileDashboard({
    postsCount: 2,
    analyses: [],
    retrievalsCount: 0,
    insightsCount: 1,
    engagement: { likes: 10, shares: 20, comments: 30 },
    recentPosts,
    latestInsight,
  })

  assert.deepEqual(result.totalEngagement, { likes: 10, shares: 20, comments: 30 })
  assert.deepEqual(result.recentPosts, recentPosts)
  assert.deepEqual(result.latestInsight, latestInsight)
})

test('caps recent posts at five items', () => {
  const recentPosts = [{ _id: '1' }, { _id: '2' }, { _id: '3' }, { _id: '4' }, { _id: '5' }, { _id: '6' }]

  const result = compileDashboard({
    postsCount: 6,
    analyses: [],
    retrievalsCount: 0,
    insightsCount: 0,
    recentPosts,
  })

  assert.equal(result.recentPosts.length, 5)
})