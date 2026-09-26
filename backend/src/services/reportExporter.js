import { HttpError } from '../utils/httpError.js'
import PDFDocument from 'pdfkit'

export const FORMAT_MARKDOWN = 'markdown'
export const FORMAT_JSON = 'json'
export const FORMAT_PDF = 'pdf'
const SUPPORTED_FORMATS = [FORMAT_MARKDOWN, FORMAT_JSON, FORMAT_PDF]
const DEFAULT_FORMAT = FORMAT_MARKDOWN

const cleanText = (value) =>
  String(value || '')
    .replace(/\s+/g, ' ')
    .trim()

const escapeCell = (value) => cleanText(value).replace(/\|/g, '\\|')

const normalizePosts = (rankedPosts) =>
  (rankedPosts || [])
    .filter(({ post }) => post)
    .map(({ post, score }) => ({
      platform: post.platform || 'web',
      author: post.author || 'social_user',
      content: cleanText(post.content),
      score: Number(score),
    }))

const normalizeInsight = (insight) => ({
  id: insight._id,
  createdAt: insight.createdAt instanceof Date ? insight.createdAt.toISOString() : String(insight.createdAt),
  scope: insight.retrieval
    ? { type: 'search', query: cleanText(insight.retrieval.query) }
    : { type: 'collection' },
  summary: cleanText(insight.summary),
  statistics: {
    totalPosts: insight.statistics?.totalPosts || 0,
    analyzedPosts: insight.statistics?.analyzedPosts || 0,
    averageSentimentScore: insight.statistics?.averageSentimentScore || 0,
    sentimentDistribution: insight.statistics?.sentimentDistribution || {
      positive: 0,
      negative: 0,
      neutral: 0,
      positivePercent: 0,
      negativePercent: 0,
      neutralPercent: 0,
    },
    totalEngagement: insight.statistics?.totalEngagement || { likes: 0, shares: 0, comments: 0 },
  },
  topTopics: (insight.topTopics || []).map(({ topic, count }) => ({ topic: cleanText(topic), count })),
  topEntities: (insight.topEntities || []).map(({ entity, count }) => ({
    entity: cleanText(entity),
    count,
  })),
  topPositivePosts: normalizePosts(insight.topPositivePosts),
  topNegativePosts: normalizePosts(insight.topNegativePosts),
  recommendations: (insight.recommendations || []).map(cleanText),
  knowledgeSources: (insight.knowledgeSources || []).map((source) => ({
    title: cleanText(source.title) || 'Untitled Knowledge Document',
    source: cleanText(source.source),
    chunk: cleanText(source.chunk),
    score: Number(source.score || 0),
  })),
  evidence: (insight.evidence || [])
    .filter(({ post }) => post)
    .map(({ post, score }) => ({
      platform: post.platform || 'web',
      author: post.author || 'social_user',
      content: cleanText(post.content),
      score: Number(score || 1),
    })),
  commentDiscourse: insight.commentDiscourse || insight.agentMetadata?.commentDiscourse || {
    totalCommentsRead: 0,
    comments: [],
    intentCounts: { question: 0, complaint: 0, praise: 0, suggestion: 0 },
    sentimentCounts: { positive: 0, neutral: 0, negative: 0 },
  },
  agentMetadata: insight.agentMetadata || {},
  draftResponse: cleanText(insight.review?.editedDraft || insight.draftResponse),
  review: {
    status: insight.review?.status || 'pending',
    note: cleanText(insight.review?.note),
    reviewedAt: insight.review?.reviewedAt || null,
  },
  generation: {
    provider: cleanText(insight.generation?.provider) || 'Multi-Agent Network',
    model: cleanText(insight.generation?.model) || 'Agentic-v2',
    rationale: cleanText(insight.generation?.rationale),
  },
})

const buildFilename = (insightId, createdAt, format) => {
  const date = createdAt instanceof Date ? createdAt : new Date(createdAt)
  const datePart = Number.isNaN(date.getTime())
    ? 'unknown'
    : date.toISOString().slice(0, 10)
  const extension = format === FORMAT_JSON ? 'json' : format === FORMAT_PDF ? 'pdf' : 'md'
  return `signalos-executive-intelligence-report-${insightId}-${datePart}.${extension}`
}

const formatDate = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

const buildMarkdown = (data) => {
  const lines = []
  const scopeLine =
    data.scope.type === 'search'
      ? `**Investigation Focus**: Query \u201C${escapeCell(data.scope.query)}\u201D`
      : '**Investigation Focus**: Entire Ingested Social Stream'

  lines.push('# SignalOS Executive Brand & Social Intelligence Report')
  lines.push('')
  lines.push(`> **Report ID**: \`#ISR-${String(data.id).slice(-8).toUpperCase()}\`  `)
  lines.push(`> **Generated**: ${formatDate(data.createdAt)}  `)
  lines.push(`> **Classification**: INTERNAL EXECUTIVE BRIEFING — CONFIDENTIAL  `)
  lines.push(`> ${scopeLine}`)
  lines.push('')

  lines.push('---', '')
  lines.push('## 1. Executive Summary & Sentiment Diagnostic', '')
  lines.push(data.summary || 'No summary available.')
  lines.push('')

  lines.push('## 2. Quantitative Telemetry & Key Performance Metrics', '')
  lines.push('| Metric | Value | Reference Benchmark |')
  lines.push('|:-------|:------|:--------------------|')
  lines.push(`| **Total Ingested Signals** | ${data.statistics.totalPosts} | Multi-Channel Stream Intake |`)
  lines.push(`| **NLP Analyzed Signals** | ${data.statistics.analyzedPosts} | RoBERTa Sentiment & Emotion |`)
  lines.push(`| **Mean Sentiment Score** | ${Number(data.statistics.averageSentimentScore).toFixed(2)} | Scale: -1.00 (Extreme Neg) to +1.00 (Extreme Pos) |`)
  lines.push(`| **Audience Comments Read** | ${data.commentDiscourse.totalCommentsRead || data.statistics.totalEngagement?.comments || 0} | Deep NLP Comment Comprehension |`)
  lines.push(`| **Total Likes** | ${data.statistics.totalEngagement.likes?.toLocaleString()} | Audience Affirmation |`)
  lines.push(`| **Total Shares** | ${data.statistics.totalEngagement.shares?.toLocaleString()} | Virality & Reach Velocity |`)
  lines.push('')

  lines.push('### Sentiment Distribution Breakdown', '')
  lines.push('| Sentiment Tier | Post Volume | Percentage Share |')
  lines.push('|:---------------|:------------|:-----------------|')
  const dist = data.statistics.sentimentDistribution
  lines.push(`| **Positive Tone** | ${dist.positive} signals | ${dist.positivePercent}% |`)
  lines.push(`| **Neutral Tone** | ${dist.neutral} signals | ${dist.neutralPercent}% |`)
  lines.push(`| **Negative Tone** | ${dist.negative} signals | ${dist.negativePercent}% |`)
  lines.push('')

  // Analyzed Comments Stream & Discourse section
  if (data.commentDiscourse && data.commentDiscourse.totalCommentsRead > 0) {
    const cd = data.commentDiscourse
    lines.push('## 3. Audience Comments & Public Discourse Intelligence', '')
    lines.push(`Deep linguistic analysis was executed on **${cd.totalCommentsRead} public comments/replies**.`)
    lines.push('')
    lines.push('| Intent Classification | Comment Count | Strategic Context |')
    lines.push('|:----------------------|:--------------|:------------------|')
    lines.push(`| ❓ **Inquiries / Questions** | ${cd.intentCounts?.question || 0} comments | Addressed directly in Agent 4 PR response |`)
    lines.push(`| ⚠️ **Customer Complaints** | ${cd.intentCounts?.complaint || 0} comments | Friction points & root causes flagged |`)
    lines.push(`| 🌟 **Praise & Advocacy** | ${cd.intentCounts?.praise || 0} comments | Positive brand sentiment anchors |`)
    lines.push(`| 💡 **Feedback & Suggestions** | ${cd.intentCounts?.suggestion || 0} comments | User feature requests & recommendations |`)
    lines.push('')

    if (cd.comments && cd.comments.length > 0) {
      lines.push('### Verified Audience Comment Ledger')
      cd.comments.slice(0, 10).forEach((comment, idx) => {
        const sentimentScore = comment.sentiment?.score !== undefined ? Number(comment.sentiment.score).toFixed(2) : '0.00'
        const intentTag = String(comment.intent || 'Comment').toUpperCase()
        lines.push(`${idx + 1}. **@${escapeCell(comment.author || 'user')}** \`[${intentTag} | Score: ${sentimentScore}]\``)
        lines.push(`   > "${escapeCell(comment.content)}"`)
        lines.push('')
      })
    }
  }

  lines.push('## 4. Conversation Themes & Named Entity Intelligence (NER)', '')
  if (data.topTopics.length > 0) {
    lines.push('### Top Thematic Topic Clusters')
    data.topTopics.forEach(({ topic, count }, i) => {
      lines.push(`${i + 1}. **${escapeCell(topic)}** — *${count} mention${count === 1 ? '' : 's'} recorded*`)
    })
    lines.push('')
  }

  if (data.topEntities.length > 0) {
    lines.push('### Extracted Named Entities (NER)')
    data.topEntities.forEach(({ entity, count }, i) => {
      lines.push(`- **${escapeCell(entity)}** (${count} occurrence${count === 1 ? '' : 's'})`)
    })
    lines.push('')
  }

  lines.push('## 5. Grounding Knowledge Base Evidence (Agent 3 RAG)', '')
  if (data.knowledgeSources.length === 0) {
    lines.push('*No specific internal knowledge-base citations were attached to this execution run.*', '')
  } else {
    data.knowledgeSources.forEach((source, idx) => {
      lines.push(`### Citation #${idx + 1}: ${escapeCell(source.title)} (${Math.round(source.score * 100)}% Semantic Match)`)
      if (source.source) lines.push(`- **Source Reference**: ${escapeCell(source.source)}`)
      lines.push(`- **Grounded Excerpt**:`)
      lines.push(`  > "${escapeCell(source.chunk)}"`)
      lines.push('')
    })
  }

  lines.push('## 6. Retrieved Social Mention Evidence Trail', '')
  if (data.evidence.length === 0) {
    lines.push('*No social post evidence references logged.*', '')
  } else {
    data.evidence.forEach((ev, idx) => {
      lines.push(`### Signal Evidence #${idx + 1} — @${escapeCell(ev.author)} [${escapeCell(ev.platform).toUpperCase()}]`)
      lines.push(`- **Relevance Confidence**: ${Math.round(ev.score * 100)}%`)
      lines.push(`- **Signal Content**:`)
      lines.push(`  > "${escapeCell(ev.content)}"`)
      lines.push('')
    })
  }

  lines.push('## 7. Polarizing Signals Spotlight (Critical vs Advocacy)', '')
  if (data.topNegativePosts.length > 0) {
    lines.push('### Critical Escalations (Highest Negative Sentiment)')
    data.topNegativePosts.forEach((post, i) => {
      lines.push(`${i + 1}. **@${escapeCell(post.author)}** (${escapeCell(post.platform)}) — Score: \`${post.score.toFixed(2)}\``)
      lines.push(`   > "${escapeCell(post.content)}"`)
      lines.push('')
    })
  }

  if (data.topPositivePosts.length > 0) {
    lines.push('### Advocacy Highlights (Highest Positive Sentiment)')
    data.topPositivePosts.forEach((post, i) => {
      lines.push(`${i + 1}. **@${escapeCell(post.author)}** (${escapeCell(post.platform)}) — Score: \`+${post.score.toFixed(2)}\``)
      lines.push(`   > "${escapeCell(post.content)}"`)
      lines.push('')
    })
  }

  lines.push('## 8. Actionable PR Recommendations & Mitigation Roadmap', '')
  if (data.recommendations.length === 0) {
    lines.push('No strategic recommendations generated.', '')
  } else {
    data.recommendations.forEach((rec, i) => {
      lines.push(`${i + 1}. ${rec}`)
    })
    lines.push('')
  }

  if (data.draftResponse) {
    lines.push('## 9. Verified AI Response Draft (Agent 4 & Human Review)', '')
    lines.push(`> **Review Governance Status**: \`${data.review.status.toUpperCase()}\``)
    if (data.review.note) lines.push(`> **Reviewer Note**: ${escapeCell(data.review.note)}`)
    lines.push('')
    lines.push('```text')
    lines.push(data.draftResponse)
    lines.push('```')
    lines.push('')
  }


  lines.push('---')
  lines.push(`*Generated by SignalOS Autonomous Multi-Agent AI Engine (${data.generation.provider} / ${data.generation.model}). Verification audit complete.*`)

  return `${lines.join('\n').trim()}\n`
}

const buildJson = (data) => `${JSON.stringify(data, null, 2)}\n`

const buildPdf = (data) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      bufferPages: true,
      margins: { top: 40, right: 40, bottom: 50, left: 40 },
      info: {
        Title: `SignalOS Executive Intelligence Report #${String(data.id).slice(-8).toUpperCase()}`,
        Author: 'SignalOS Autonomous Multi-Agent AI',
        Subject: data.summary,
      },
    })

    const chunks = []
    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('error', reject)
    doc.on('end', () => resolve(Buffer.concat(chunks)))

    const primaryNavy = '#0f172a'
    const primaryBlue = '#0284c7'
    const textDark = '#1e293b'
    const textMuted = '#64748b'
    const borderLight = '#e2e8f0'
    const bgCard = '#f8fafc'
    const bgCardWhite = '#ffffff'
    const green = '#16a34a'
    const red = '#dc2626'
    const amber = '#d97706'
    const pageWidth = 595
    const leftMargin = 40
    const rightMargin = 555
    const contentWidth = rightMargin - leftMargin // 515px

    const checkPageBreak = (neededHeight = 60) => {
      if (doc.y + neededHeight > 745) {
        doc.addPage()
        doc.x = leftMargin
        doc.y = 50
      }
    }

    const drawSectionHeader = (titleText, sectionNumber) => {
      checkPageBreak(50)
      doc.y += 10
      const currentY = doc.y

      // Number badge
      doc.roundedRect(leftMargin, currentY, 24, 18, 4).fill(primaryBlue)
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8.5).text(String(sectionNumber).padStart(2, '0'), leftMargin, currentY + 4, {
        width: 24,
        align: 'center',
      })

      // Title
      doc.fillColor(primaryNavy).font('Helvetica-Bold').fontSize(12).text(titleText, leftMargin + 32, currentY + 3, {
        width: contentWidth - 32,
      })

      doc.y = currentY + 24
      doc.moveTo(leftMargin, doc.y).lineTo(rightMargin, doc.y).strokeColor(borderLight).lineWidth(1).stroke()
      doc.y += 10
      doc.x = leftMargin
    }

    // ==========================================
    // 1. Sleek Modern Header
    // ==========================================
    doc.rect(0, 0, pageWidth, 110).fill(primaryNavy)
    
    // Top subtle bar
    doc.rect(0, 0, pageWidth, 4).fill(primaryBlue)

    doc.fillColor('#38bdf8').font('Helvetica-Bold').fontSize(8.5).text('SIGNALOS  /  AUTONOMOUS AGENTIC INTELLIGENCE', leftMargin, 24, {
      characterSpacing: 1.2,
    })

    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(20).text('Executive Brand & Social Intelligence Report', leftMargin, 40, {
      width: contentWidth,
    })

    const reportIdStr = String(data.id).slice(-8).toUpperCase()
    doc.fillColor('#94a3b8').font('Helvetica').fontSize(8).text(
      `CONFIDENTIAL BRIEFING  •  REPORT #ISR-${reportIdStr}  •  GENERATED: ${formatDate(data.createdAt)}`,
      leftMargin,
      76,
    )

    // Verification badge in header
    doc.roundedRect(rightMargin - 150, 22, 150, 20, 10).fill('#1e293b')
    doc.fillColor('#34d399').font('Helvetica-Bold').fontSize(7.5).text('✔ MULTI-AGENT VERIFIED', rightMargin - 150, 27, {
      width: 150,
      align: 'center',
    })

    doc.y = 125
    doc.x = leftMargin

    // ==========================================
    // 2. Executive Summary & Diagnostic
    // ==========================================
    drawSectionHeader('Executive Summary & Sentiment Diagnostic', 1)

    // Summary Box
    const summaryStartY = doc.y
    doc.roundedRect(leftMargin, summaryStartY, contentWidth, 54, 6).fillAndStroke(bgCard, borderLight)
    doc.rect(leftMargin, summaryStartY, 4, 54).fill(primaryBlue)

    doc.fillColor(textDark).font('Helvetica').fontSize(9.5).text(
      data.summary || 'Summary unavailable.',
      leftMargin + 14,
      summaryStartY + 10,
      { width: contentWidth - 28, lineGap: 3.5 },
    )
    doc.y = summaryStartY + 64
    doc.x = leftMargin

    // ==========================================
    // 3. Quantitative Telemetry (4-Card Grid)
    // ==========================================
    const stats = data.statistics
    const cardY = doc.y
    const cardW = 122
    const cardH = 54
    const cardGap = (contentWidth - cardW * 4) / 3

    const cards = [
      { val: stats.totalPosts || 0, label: 'TOTAL INGESTED', sub: 'Stream Intake' },
      { val: stats.analyzedPosts || 0, label: 'NLP ANALYZED', sub: 'RoBERTa Matrix' },
      { val: Number(stats.averageSentimentScore || 0).toFixed(2), label: 'AVG SENTIMENT', sub: 'Scale: -1.0 to +1.0' },
      { val: stats.totalEngagement?.likes || 0, label: 'ENGAGEMENT LIKES', sub: 'Social Affirmation' },
    ]

    cards.forEach((c, idx) => {
      const cx = leftMargin + idx * (cardW + cardGap)
      doc.roundedRect(cx, cardY, cardW, cardH, 6).fillAndStroke(bgCardWhite, borderLight)
      doc.fillColor(primaryNavy).font('Helvetica-Bold').fontSize(15).text(String(c.val), cx + 10, cardY + 8, { width: cardW - 20 })
      doc.fillColor(textMuted).font('Helvetica-Bold').fontSize(7).text(c.label, cx + 10, cardY + 28, { width: cardW - 20, characterSpacing: 0.3 })
      doc.fillColor(primaryBlue).font('Helvetica').fontSize(6.5).text(c.sub, cx + 10, cardY + 39, { width: cardW - 20 })
    })

    doc.y = cardY + cardH + 15
    doc.x = leftMargin

    // ==========================================
    // 4. Sentiment & Emotion Dynamics
    // ==========================================
    drawSectionHeader('Sentiment & Emotion Matrix (Agent 2 NLP)', 2)

    const distribution = stats.sentimentDistribution || {}
    const tiers = [
      { key: 'positive', label: 'Positive Tone', color: green, pct: Number(distribution.positivePercent || 0), count: distribution.positive || 0 },
      { key: 'neutral', label: 'Neutral Tone', color: '#64748b', pct: Number(distribution.neutralPercent || 0), count: distribution.neutral || 0 },
      { key: 'negative', label: 'Negative Tone', color: red, pct: Number(distribution.negativePercent || 0), count: distribution.negative || 0 },
    ]

    tiers.forEach((t) => {
      const rowY = doc.y
      doc.fillColor(primaryNavy).font('Helvetica-Bold').fontSize(8.5).text(t.label, leftMargin, rowY, { width: 90 })

      // Progress Track
      const trackX = leftMargin + 95
      const trackW = 310
      doc.roundedRect(trackX, rowY + 1, trackW, 8, 4).fill('#e2e8f0')
      if (t.pct > 0) {
        doc.roundedRect(trackX, rowY + 1, Math.max(8, (trackW * Math.min(100, t.pct)) / 100), 8, 4).fill(t.color)
      }

      doc.fillColor(textMuted).font('Helvetica-Bold').fontSize(8).text(`${t.count} signals (${t.pct}%)`, leftMargin + 415, rowY, {
        width: 100,
        align: 'right',
      })

      doc.y = rowY + 18
      doc.x = leftMargin
    })

    doc.y += 8

    // ==========================================
    // 5. Conversation Themes & Named Entities
    // ==========================================
    drawSectionHeader('Conversation Themes & Named Entities', 3)

    if (!data.topTopics.length && !data.topEntities.length) {
      doc.fillColor(textMuted).font('Helvetica').fontSize(8.5).text('No thematic clusters identified.', leftMargin, doc.y)
      doc.y += 12
    } else {
      // 2-Column Grid: Topics on Left, Entities on Right
      const blockStartY = doc.y
      const colWidth = (contentWidth - 15) / 2

      // Left: Topics
      doc.fillColor(primaryBlue).font('Helvetica-Bold').fontSize(8).text('TOP IDENTIFIED TOPICS', leftMargin, blockStartY)
      let topicY = blockStartY + 14
      data.topTopics.slice(0, 5).forEach((item, index) => {
        doc.roundedRect(leftMargin, topicY, colWidth, 20, 4).fillAndStroke(bgCard, borderLight)
        doc.fillColor(primaryBlue).font('Helvetica-Bold').fontSize(7.5).text(String(index + 1).padStart(2, '0'), leftMargin + 8, topicY + 5)
        doc.fillColor(primaryNavy).font('Helvetica-Bold').fontSize(8).text(item.topic, leftMargin + 26, topicY + 5, { width: colWidth - 80 })
        doc.fillColor(textMuted).font('Helvetica').fontSize(7).text(`${item.count} mention${item.count === 1 ? '' : 's'}`, leftMargin + colWidth - 60, topicY + 5, { width: 52, align: 'right' })
        topicY += 24
      })

      // Right: Entities
      const rightColX = leftMargin + colWidth + 15
      doc.fillColor(primaryBlue).font('Helvetica-Bold').fontSize(8).text('KEY NAMED ENTITIES (NER)', rightColX, blockStartY)
      let entityY = blockStartY + 14
      data.topEntities.slice(0, 5).forEach((item, index) => {
        doc.roundedRect(rightColX, entityY, colWidth, 20, 4).fillAndStroke(bgCard, borderLight)
        doc.fillColor('#8b5cf6').font('Helvetica-Bold').fontSize(7.5).text(String(index + 1).padStart(2, '0'), rightColX + 8, entityY + 5)
        doc.fillColor(primaryNavy).font('Helvetica-Bold').fontSize(8).text(item.entity, rightColX + 26, entityY + 5, { width: colWidth - 80 })
        doc.fillColor(textMuted).font('Helvetica').fontSize(7).text(`${item.count} mention${item.count === 1 ? '' : 's'}`, rightColX + colWidth - 60, entityY + 5, { width: 52, align: 'right' })
        entityY += 24
      })

      doc.y = Math.max(topicY, entityY) + 5
      doc.x = leftMargin
    }

    // ==========================================
    // 6. Grounding Citations (Agent 3 RAG)
    // ==========================================
    drawSectionHeader('Knowledge Base Citations & Grounding (Agent 3 RAG)', 4)

    if (!data.knowledgeSources.length) {
      doc.roundedRect(leftMargin, doc.y, contentWidth, 30, 4).fillAndStroke(bgCard, borderLight)
      doc.fillColor(textMuted).font('Helvetica').fontSize(8).text(
        'Self-grounded directly on raw social mentions (No internal knowledge base PDF/document was queried for this run).',
        leftMargin + 10,
        doc.y + 10,
        { width: contentWidth - 20 },
      )
      doc.y += 38
      doc.x = leftMargin
    } else {
      data.knowledgeSources.slice(0, 3).forEach((source, index) => {
        checkPageBreak(55)
        const citeY = doc.y
        doc.roundedRect(leftMargin, citeY, contentWidth, 48, 5).fillAndStroke(bgCard, borderLight)
        doc.rect(leftMargin, citeY, 3, 48).fill(primaryBlue)

        doc.fillColor(primaryBlue).font('Helvetica-Bold').fontSize(7.5).text(
          `CITATION #${String(index + 1).padStart(2, '0')}  •  RELEVANCE: ${Math.round(source.score * 100)}%`,
          leftMargin + 12,
          citeY + 7,
        )
        doc.fillColor(primaryNavy).font('Helvetica-Bold').fontSize(8.5).text(source.title, leftMargin + 12, citeY + 18, { width: contentWidth - 24 })
        doc.fillColor(textMuted).font('Helvetica').fontSize(7.5).text(source.chunk || '', leftMargin + 12, citeY + 29, { width: contentWidth - 24, height: 14, ellipsis: true })

        doc.y = citeY + 54
        doc.x = leftMargin
      })
    }

    // ==========================================
    // 7. Retrieved Social Signal Evidence Ledger
    // ==========================================
    if (data.evidence.length > 0) {
      drawSectionHeader('Retrieved Social Signal Evidence Trail', 5)

      data.evidence.slice(0, 3).forEach((ev, idx) => {
        checkPageBreak(50)
        const evY = doc.y
        doc.roundedRect(leftMargin, evY, contentWidth, 42, 5).fillAndStroke(bgCardWhite, borderLight)

        doc.fillColor(primaryNavy).font('Helvetica-Bold').fontSize(7.5).text(
          `SIGNAL #${idx + 1}  •  @${ev.author}  •  [${ev.platform.toUpperCase()}]  •  CONFIDENCE: ${Math.round(ev.score * 100)}%`,
          leftMargin + 10,
          evY + 6,
        )
        doc.fillColor(textDark).font('Helvetica').fontSize(8).text(`"${ev.content}"`, leftMargin + 10, evY + 18, {
          width: contentWidth - 20,
          height: 18,
          ellipsis: true,
        })

        doc.y = evY + 48
        doc.x = leftMargin
      })
    }

    // ==========================================
    // 8. Actionable Strategic PR Recommendations
    // ==========================================
    drawSectionHeader('Actionable PR Recommendations & Strategy', 6)

    if (!data.recommendations.length) {
      doc.fillColor(textMuted).font('Helvetica').fontSize(8.5).text('No specific mitigation steps generated.', leftMargin, doc.y)
      doc.y += 12
    } else {
      data.recommendations.forEach((item, index) => {
        checkPageBreak(36)
        const recY = doc.y

        // Number bullet circle
        doc.circle(leftMargin + 8, recY + 8, 8).fill(primaryBlue)
        doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(7.5).text(String(index + 1), leftMargin + 4, recY + 5, {
          width: 8,
          align: 'center',
        })

        doc.fillColor(primaryNavy).font('Helvetica').fontSize(8.5).text(item, leftMargin + 24, recY + 2, {
          width: contentWidth - 24,
          lineGap: 2,
        })

        doc.y = Math.max(doc.y + 4, recY + 26)
        doc.x = leftMargin
      })
    }

    // ==========================================
    // 9. Response Draft & Human Authorization
    // ==========================================
    if (data.draftResponse) {
      drawSectionHeader('AI PR Response Draft (Human Review)', 7)
      checkPageBreak(80)

      const draftY = doc.y
      const isApproved = data.review.status === 'approved'

      // Status pill
      doc.roundedRect(leftMargin, draftY, contentWidth, 20, 4).fill(isApproved ? '#dcfce7' : '#fef9c3')
      doc.fillColor(isApproved ? green : '#854d0e').font('Helvetica-Bold').fontSize(7.5).text(
        `GOVERNANCE STATUS: ${data.review.status.toUpperCase()}  •  HUMAN-IN-THE-LOOP APPROVAL REQUIRED BEFORE BROADCAST`,
        leftMargin + 10,
        draftY + 6,
      )

      doc.y = draftY + 26
      doc.roundedRect(leftMargin, doc.y, contentWidth, 48, 4).fillAndStroke(bgCard, borderLight)
      doc.fillColor(textDark).font('Helvetica').fontSize(8.5).text(data.draftResponse, leftMargin + 10, doc.y + 8, {
        width: contentWidth - 20,
        lineGap: 2.5,
      })

      doc.y += 54
      doc.x = leftMargin
    }

    // ==========================================
    // Running Page Footer on all pages
    // ==========================================
    const pages = doc.bufferedPageRange()
    for (let page = pages.start; page < pages.start + pages.count; page += 1) {
      doc.switchToPage(page)
      doc.moveTo(leftMargin, 795).lineTo(rightMargin, 795).strokeColor(borderLight).lineWidth(1).stroke()
      doc.fillColor(textMuted).font('Helvetica').fontSize(7).text(
        'CONFIDENTIAL & PROPRIETARY  •  SIGNALOS AUTONOMOUS MULTI-AGENT INTELLIGENCE',
        leftMargin,
        805,
      )
      doc.text(`PAGE ${page + 1} OF ${pages.count}`, rightMargin - 100, 805, {
        width: 100,
        align: 'right',
      })
    }

    doc.end()
  })

export const exportInsightReport = (insight, format = DEFAULT_FORMAT) => {
  if (!SUPPORTED_FORMATS.includes(format)) {
    throw new HttpError(
      `Unsupported export format: "${format}". Use "${FORMAT_MARKDOWN}", "${FORMAT_JSON}", or "${FORMAT_PDF}".`,
      400,
    )
  }

  const data = normalizeInsight(insight)
  const filename = buildFilename(insight._id, insight.createdAt, format)
  const content = format === FORMAT_PDF ? buildPdf(data) : format === FORMAT_JSON ? buildJson(data) : buildMarkdown(data)

  return { format, filename, content }
}
