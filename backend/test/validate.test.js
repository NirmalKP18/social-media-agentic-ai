import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  validateRegister,
  validateLogin,
  validateCreatePost,
  validateUpdatePost,
  validateRetrievalSearch,
  validateCreateInsight,
  validateInsightReview,
  validateAlertStatus,
  validateKnowledgeDocument,
} from '../src/middleware/validate.middleware.js'
import { HttpError } from '../src/utils/httpError.js'

const passThrough = (body) => {
  const req = { body }
  const res = {}
  const nextCalls = []
  const next = () => nextCalls.push('next')
  return { req, res, next, nextCalls }
}

const expectHttpError = (fn, status) => {
  assert.throws(fn, (error) => error instanceof HttpError && error.status === status)
}

test('validateRegister accepts a valid payload', () => {
  const { req, res, next, nextCalls } = passThrough({
    name: 'Jane Doe',
    email: 'jane@example.com',
    password: 'password123',
  })
  validateRegister(req, res, next)
  assert.equal(nextCalls.length, 1)
})

test('validateRegister rejects a short password', () => {
  const { req, res, next } = passThrough({
    name: 'Jane Doe',
    email: 'jane@example.com',
    password: 'short',
  })
  expectHttpError(() => validateRegister(req, res, next), 400)
})

test('validateCreatePost rejects a missing platform', () => {
  const { req, res, next } = passThrough({ author: 'u1', content: 'hello world' })
  expectHttpError(() => validateCreatePost(req, res, next), 400)
})

test('validateCreatePost rejects an unsupported platform', () => {
  const { req, res, next } = passThrough({ platform: 'myspace', author: 'u1', content: 'hello' })
  expectHttpError(() => validateCreatePost(req, res, next), 400)
})

test('validateCreatePost rejects missing content', () => {
  const { req, res, next } = passThrough({ platform: 'twitter', author: 'u1' })
  expectHttpError(() => validateCreatePost(req, res, next), 400)
})

test('validateCreatePost rejects a negative engagement count', () => {
  const { req, res, next } = passThrough({
    platform: 'twitter',
    author: 'u1',
    content: 'hello',
    engagement: { likes: -1 },
  })
  expectHttpError(() => validateCreatePost(req, res, next), 400)
})

test('validateUpdatePost rejects an empty update', () => {
  const { req, res, next } = passThrough({})
  expectHttpError(() => validateUpdatePost(req, res, next), 400)
})

test('validateRetrievalSearch rejects a missing query', () => {
  const { req, res, next } = passThrough({})
  expectHttpError(() => validateRetrievalSearch(req, res, next), 400)
})

test('validateRetrievalSearch rejects an out-of-range limit', () => {
  const { req, res, next } = passThrough({ query: 'camera', limit: 21 })
  expectHttpError(() => validateRetrievalSearch(req, res, next), 400)
})

test('validateCreateInsight rejects a malformed retrieval ID', () => {
  const { req, res, next } = passThrough({ retrievalId: 'not-an-object-id' })
  expectHttpError(() => validateCreateInsight(req, res, next), 400)
})

test('validateLogin rejects missing password', () => {
  const { req, res, next } = passThrough({ email: 'jane@example.com' })
  expectHttpError(() => validateLogin(req, res, next), 400)
})

test('validateInsightReview accepts an approved edited draft', () => {
  const { req, res, next, nextCalls } = passThrough({ status: 'approved', editedDraft: 'Verified response' })
  validateInsightReview(req, res, next)
  assert.equal(nextCalls.length, 1)
})

test('validateInsightReview rejects pending as a user review action', () => {
  const { req, res, next } = passThrough({ status: 'pending' })
  expectHttpError(() => validateInsightReview(req, res, next), 400)
})

test('validateAlertStatus rejects an unsupported state', () => {
  const { req, res, next } = passThrough({ status: 'deleted' })
  expectHttpError(() => validateAlertStatus(req, res, next), 400)
})

test('validateKnowledgeDocument accepts a valid document', () => {
  const { req, res, next, nextCalls } = passThrough({ title: 'Refund policy', text: 'Refunds within 30 days.', source: 'https://example.com', tags: ['policy'] })
  validateKnowledgeDocument(req, res, next)
  assert.equal(nextCalls.length, 1)
})

test('validateKnowledgeDocument rejects a missing title', () => {
  const { req, res, next } = passThrough({ text: 'Refunds within 30 days.' })
  expectHttpError(() => validateKnowledgeDocument(req, res, next), 400)
})

test('validateKnowledgeDocument rejects an empty body of text', () => {
  const { req, res, next } = passThrough({ title: 'Refund policy', text: '   ' })
  expectHttpError(() => validateKnowledgeDocument(req, res, next), 400)
})

test('validateKnowledgeDocument rejects too many tags', () => {
  const { req, res, next } = passThrough({ title: 'Refund policy', text: 'Refunds within 30 days.', tags: Array.from({ length: 21 }, (_, i) => `tag-${i}`) })
  expectHttpError(() => validateKnowledgeDocument(req, res, next), 400)
})
