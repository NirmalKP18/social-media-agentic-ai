import { test } from 'node:test'
import assert from 'node:assert/strict'
import { analyzeText } from '../src/services/nlpService.js'

test('analyzeText detects positive sentiment', () => {
  const result = analyzeText('The camera quality is amazing, I love this phone!')
  assert.equal(result.sentiment.label, 'positive')
  assert.ok(result.sentiment.score > 0.15)
  assert.ok(result.sentiment.confidence >= 0.5 && result.sentiment.confidence <= 1)
})

test('analyzeText detects negative sentiment', () => {
  const result = analyzeText('The battery life is terrible and it keeps crashing every day.')
  assert.equal(result.sentiment.label, 'negative')
  assert.ok(result.sentiment.score < -0.15)
})

test('analyzeText stays neutral without sentiment words', () => {
  const result = analyzeText('The update installed on the device earlier this morning.')
  assert.equal(result.sentiment.label, 'neutral')
  assert.equal(result.sentiment.score, 0)
})

test('analyzeText flips polarity within the negation window', () => {
  const result = analyzeText('This product is not good at all.')
  assert.equal(result.sentiment.label, 'negative')
  assert.ok(result.sentiment.score < 0)
})

test('analyzeText extracts top topics sorted by frequency', () => {
  const result = analyzeText('battery battery battery, camera camera, love the speaker')
  assert.equal(result.topics[0], 'battery')
  assert.equal(result.topics[1], 'camera')
  assert.ok(result.topics.length <= 5)
})

test('analyzeText extracts entities from handles and hashtags', () => {
  const result = analyzeText('Thanks @support for fixing #bugreport quickly.')
  assert.ok(result.entities.includes('@support'))
  assert.ok(result.entities.includes('#bugreport'))
})

test('analyzeText generates a summary capped at 280 characters', () => {
  const result = analyzeText(
    'I love the new camera mode. It works in very low light. Every photo comes out sharp.',
  )
  assert.equal(typeof result.summary, 'string')
  assert.ok(result.summary.length <= 280)
})
