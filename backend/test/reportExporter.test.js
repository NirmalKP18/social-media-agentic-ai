 import { test } from 'node:test'
import assert from 'node:assert/strict'
import { exportInsightReport, FORMAT_MARKDOWN, FORMAT_JSON, FORMAT_PDF } from '../src/services/reportExporter.js'
import { HttpError } from '../src/utils/httpError.js'

const buildInsight = (overrides = {}) => ({
  _id: '507f1f77bcf86cd799439011',
  createdAt: new Date('2026-09-13T10:30:00.000Z'),
  retrieval: null,
  summary: 'Overall sentiment is positive with an average score of 0.28.',
  statistics: {
    totalPosts: 4,
    analyzedPosts: 4,
    averageSentimentScore: 0.28,
    sentimentDistribution: {
      positive: 2,
      negative: 1,
      neutral: 1,
      positivePercent: 50,
      negativePercent: 25,
      neutralPercent: 25,
    },
    totalEngagement: { likes: 12, shares: 5, comments: 3 },
  },
  topTopics: [
    { topic: 'battery', count: 3 },
    { topic: 'camera', count: 1 },
  ],
  topEntities: [{ entity: '@brand', count: 2 }],
  topPositivePosts: [
    {
      post: { platform: 'twitter', author: 'fanuser', content: 'The camera quality is amazing.' },
      score: 0.8,
    },
  ],
  topNegativePosts: [
    {
      post: { platform: 'twitter', author: 'angryuser', content: 'Battery life is terrible.' },
      score: -0.7,
    },
  ],
  recommendations: ['Address battery concerns raised by customers.'],
  ...overrides,
})

test('exports a readable markdown document for a full report', () => {
  const { format, filename, content } = exportInsightReport(buildInsight(), FORMAT_MARKDOWN)

  assert.equal(format, FORMAT_MARKDOWN)
  assert.match(filename, /^signalos-executive-intelligence-report-.*\.md$/)

  assert.match(content, /^# SignalOS Executive Brand & Social Intelligence Report/m)
  assert.match(content, /Entire Ingested Social Stream/)
  assert.match(content, /## 1\. Executive Summary & Sentiment Diagnostic/)
  assert.match(content, /Overall sentiment is positive/)
  assert.match(content, /## 2\. Quantitative Telemetry & Key Performance Metrics/)
  assert.match(content, /Analyzed Signals/)
  assert.match(content, /### Sentiment Distribution Breakdown/)
  assert.match(content, /Positive Tone/)
  assert.match(content, /## 4\. Conversation Themes & Named Entity Intelligence/)
  assert.match(content, /battery/)
  assert.match(content, /## 7\. Polarizing Signals Spotlight/)
  assert.match(content, /@angryuser/)
  assert.match(content, /Battery life is terrible\./)
  assert.match(content, /## 8\. Actionable PR Recommendations & Mitigation Roadmap/)
  assert.match(content, /1\. Address battery concerns/)
})

test('shows the grounded search query in the markdown scope', () => {
  const insight = buildInsight({ retrieval: { query: 'camera quality' } })
  const { content } = exportInsightReport(insight, FORMAT_MARKDOWN)

  assert.match(content, /Investigation Focus.*Query \u201Ccamera quality\u201D/)
})

test('exports a parseable normalized JSON document', () => {
  const { format, filename, content } = exportInsightReport(buildInsight(), FORMAT_JSON)

  assert.equal(format, FORMAT_JSON)
  assert.match(filename, /\.json$/)

  const parsed = JSON.parse(content)
  assert.equal(parsed.id, '507f1f77bcf86cd799439011')
  assert.deepEqual(parsed.scope, { type: 'collection' })
  assert.equal(parsed.statistics.analyzedPosts, 4)
  assert.equal(parsed.topTopics[0].topic, 'battery')
  assert.equal(parsed.topNegativePosts[0].author, 'angryuser')
  assert.equal(parsed.topNegativePosts[0].content, 'Battery life is terrible.')
  assert.equal(parsed.recommendations[0], 'Address battery concerns raised by customers.')
})

test('handles an empty report without crashing', () => {
  const insight = buildInsight({
    topTopics: [],
    topEntities: [],
    topPositivePosts: [],
    topNegativePosts: [],
    recommendations: [],
  })

  const { content, format } = exportInsightReport(insight, FORMAT_MARKDOWN)

  assert.equal(format, FORMAT_MARKDOWN)
  assert.match(content, /## 1\. Executive Summary/)
  assert.match(content, /## 8\. Actionable PR Recommendations & Mitigation Roadmap/)
})

test('exports a valid PDF document', async () => {
  const exported = exportInsightReport(buildInsight(), FORMAT_PDF)
  const content = await exported.content
  assert.equal(exported.format, FORMAT_PDF)
  assert.match(exported.filename, /\.pdf$/)
  assert.equal(content.subarray(0, 5).toString(), '%PDF-')
  assert.ok(content.length > 1000)
})

test('rejects unsupported export formats with 400', () => {
  assert.throws(
    () => exportInsightReport(buildInsight(), 'csv'),
    (error) => error instanceof HttpError && error.status === 400,
  )
})

test('defaults to markdown when no format is provided', () => {
  const { format, filename } = exportInsightReport(buildInsight())
  assert.equal(format, FORMAT_MARKDOWN)
  assert.match(filename, /\.md$/)
})

test('escapes pipe characters inside markdown table cells', () => {
  const insight = buildInsight({ topTopics: [{ topic: 'a|b|c', count: 1 }] })
  const { content } = exportInsightReport(insight, FORMAT_MARKDOWN)

  assert.match(content, /a\\\|b\\\|c/)
})

