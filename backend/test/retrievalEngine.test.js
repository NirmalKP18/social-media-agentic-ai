import { test } from 'node:test'
import assert from 'node:assert/strict'
import { rankPosts } from '../src/services/retrievalEngine.js'

const posts = [
  { _id: 'p1', content: 'The camera quality is amazing and photos look sharp.' },
  { _id: 'p2', content: 'My laptop battery drains very fast.' },
  { _id: 'p3', content: 'Camera photos are crisp even in low light.' },
]

test('rankPosts returns posts sorted by descending relevance', () => {
  const results = rankPosts(posts, 'camera photos', 3)
  const ids = results.map((result) => result.postId)
  assert.ok(ids.length > 0)
  assert.ok(results.every((result) => result.score > 0))
  assert.ok(results.every((result, index) => index === 0 || results[index - 1].score >= result.score))
})

test('rankPosts prefers the closest match for a query term', () => {
  const results = rankPosts(posts, 'camera', 10)
  const ids = results.map((result) => result.postId)
  assert.equal(ids[0], 'p1')
})

test('rankPosts returns an empty array for a stopword-only query', () => {
  assert.deepEqual(rankPosts(posts, 'the a of', 5), [])
})

test('rankPosts respects the limit', () => {
  const results = rankPosts(posts, 'camera photos battery', 1)
  assert.ok(results.length <= 1)
})