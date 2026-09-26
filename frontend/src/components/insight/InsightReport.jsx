import { useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../common/Icon.jsx'
import { getPostDetailPath } from '../../constants/routes.js'

const toNumber = (value) => Number(value || 0)

function SectionHeader({ number, title, subtitle, badge }) {
  return (
    <div className="ir-section-head">
      <div className="ir-section-title-wrap">
        <span className="ir-section-index">{String(number).padStart(2, '0')}</span>
        <div>
          <h3 className="ir-section-title">{title}</h3>
          {subtitle && <p className="ir-section-subtitle">{subtitle}</p>}
        </div>
      </div>
      {badge && <span className="ir-section-badge">{badge}</span>}
    </div>
  )
}

function StatFigure({ value, label, sublabel, tone, iconName }) {
  return (
    <div className={`ir-stat-card ${tone ? `ir-stat-card--${tone}` : ''}`}>
      <div className="ir-stat-top">
        <span className="ir-stat-label">{label}</span>
        {iconName && (
          <span className="ir-stat-icon">
            <Icon name={iconName} size={16} />
          </span>
        )}
      </div>
      <div className="ir-stat-value">{value}</div>
      {sublabel && <div className="ir-stat-sub">{sublabel}</div>}
    </div>
  )
}

function DistributionList({ title, distribution, iconName }) {
  const entries =
    distribution && typeof distribution === 'object' ? Object.entries(distribution) : []
  if (entries.length === 0) {
    return (
      <div className="ir-dist-box">
        <div className="ir-dist-head">
          {iconName && <Icon name={iconName} size={15} />}
          <h4>{title}</h4>
        </div>
        <p className="ir-empty-hint">No distribution data recorded for this run.</p>
      </div>
    )
  }

  const total = entries.reduce((sum, [, count]) => sum + toNumber(count), 0)

  return (
    <div className="ir-dist-box">
      <div className="ir-dist-head">
        {iconName && <Icon name={iconName} size={15} />}
        <h4>{title}</h4>
      </div>
      <div className="ir-dist-bars">
        {entries.map(([label, count]) => {
          const val = toNumber(count)
          const pct = total > 0 ? Math.round((val / total) * 100) : 0
          return (
            <div className="ir-dist-row" key={label}>
              <div className="ir-dist-info">
                <span className="ir-dist-name">{label}</span>
                <span className="ir-dist-count">
                  {val} <small>({pct}%)</small>
                </span>
              </div>
              <div className="ir-dist-track">
                <div className="ir-dist-fill" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function RankedCluster({ title, items, tone = 'topic', iconName }) {
  if (!items || items.length === 0) {
    return (
      <div className="ir-cluster-card">
        <div className="ir-cluster-head">
          {iconName && <Icon name={iconName} size={16} />}
          <h4>{title}</h4>
        </div>
        <p className="ir-empty-hint">No thematic clusters computed.</p>
      </div>
    )
  }

  const max = Math.max(...items.map((i) => toNumber(i.count))) || 1

  return (
    <div className="ir-cluster-card">
      <div className="ir-cluster-head">
        {iconName && <Icon name={iconName} size={16} />}
        <h4>{title}</h4>
        <span className="cluster-count-badge">{items.length} identified</span>
      </div>
      <div className="ir-cluster-list">
        {items.map((item, idx) => {
          const label = item.topic || item.entity || item.name
          const count = toNumber(item.count)
          const pct = Math.round((count / max) * 100)
          return (
            <div className="ir-cluster-item" key={label}>
              <span className="cluster-rank-num">{String(idx + 1).padStart(2, '0')}</span>
              <div className="cluster-item-body">
                <div className="cluster-item-header">
                  <strong>{label}</strong>
                  <span>{count} signal{count === 1 ? '' : 's'}</span>
                </div>
                <div className="cluster-bar-track">
                  <div
                    className={`cluster-bar-fill cluster-bar-fill--${tone}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function InsightReport({ insight }) {
  const [copiedDraft, setCopiedDraft] = useState(false)
  const [commentFilter, setCommentFilter] = useState('all')

  const { statistics = {}, topTopics = [], topEntities = [], recommendations = [] } = insight
  const distribution = statistics.sentimentDistribution || {}
  const engagement = statistics.totalEngagement || {}
  const agentMetadata = insight.agentMetadata || {}
  const knowledgeSources = insight.knowledgeSources || []
  const evidence = insight.evidence || []

  const commentDiscourse =
    insight.commentDiscourse ||
    agentMetadata.commentDiscourse || {
      totalCommentsRead: 0,
      comments: [],
      intentCounts: { question: 0, complaint: 0, praise: 0, suggestion: 0 },
      sentimentCounts: { positive: 0, neutral: 0, negative: 0 },
    }

  const intentCounts = commentDiscourse.intentCounts || {}
  const rawComments = commentDiscourse.comments || []

  const filteredComments = rawComments.filter((c) => {
    if (commentFilter === 'all') return true
    if (commentFilter === 'question') return c.intent === 'question' || String(c.content).includes('?')
    if (commentFilter === 'complaint') return c.intent === 'complaint' || c.sentiment?.label === 'negative'
    if (commentFilter === 'praise') return c.intent === 'praise' || c.sentiment?.label === 'positive'
    if (commentFilter === 'suggestion') return c.intent === 'suggestion'
    return true
  })

  const totalPosts = toNumber(statistics.totalPosts)
  const analyzedPosts = toNumber(statistics.analyzedPosts)
  const coverage = totalPosts > 0 ? Math.round((analyzedPosts / totalPosts) * 100) : 0
  const averageScore = Number(statistics.averageSentimentScore || 0)

  const labels = {
    positive: toNumber(distribution.positive),
    negative: toNumber(distribution.negative),
    neutral: toNumber(distribution.neutral),
  }

  const dominant =
    labels.positive >= labels.negative && labels.positive >= labels.neutral
      ? 'positive'
      : labels.negative >= labels.neutral
      ? 'negative'
      : 'neutral'

  const dominantCount = labels[dominant] || 0
  const dominantPercent = analyzedPosts > 0 ? Math.round((dominantCount / analyzedPosts) * 100) : 0

  let sectionCounter = 0
  const getSectionNum = () => ++sectionCounter

  const handleCopyDraft = () => {
    const text = insight.review?.editedDraft || insight.draftResponse || ''
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopiedDraft(true)
    setTimeout(() => setCopiedDraft(false), 3000)
  }

  const reportIdStr = String(insight._id || insight.id || '2026-X').slice(-8).toUpperCase()

  return (
    <div className="executive-report-container">
      {/* 1. Official Report Header Banner */}
      <header className="ir-briefing-header">
        <div className="ir-briefing-top">
          <div className="ir-brand-meta">
            <span className="ir-badge-confidential">
              <Icon name="shield" size={12} /> CONFIDENTIAL EXECUTIVE BRIEFING
            </span>
            <span className="ir-report-id">REPORT #ISR-{reportIdStr}</span>
          </div>
          <div className="ir-verification-pill">
            <span className="pulse-dot" /> Multi-Agent Grounded (Agents 1 ➔ 4)
          </div>
        </div>

        <div className="ir-briefing-main">
          <div>
            <h1 className="ir-main-title">Brand &amp; Social Intelligence Assessment</h1>
            <p className="ir-main-subtitle">
              Comprehensive sentiment diagnostics, conversational clustering, RAG-grounded evidence, and strategic response mitigation.
            </p>
          </div>

          <div className="ir-scope-tag">
            <span className="scope-label">INVESTIGATION SCOPE:</span>
            <strong>
              {insight.retrieval?.query ? `Search: "${insight.retrieval.query}"` : 'Full Ingested Social Stream'}
            </strong>
          </div>
        </div>
      </header>

      {/* 2. Executive Summary & Diagnostic Verdict */}
      <section className="ir-section-card">
        <SectionHeader
          number={getSectionNum()}
          title="Executive Summary & Sentiment Diagnostic"
          subtitle="Synthesized overview of audience sentiment and primary brand signals"
        />

        <div className="ir-summary-grid">
          <div className="ir-summary-statement">
            <p>{insight.summary || 'No summary text generated for this briefing.'}</p>
          </div>

          <div className={`ir-verdict-card ir-verdict-card--${dominant}`}>
            <span className="verdict-tag">DOMINANT SENTIMENT</span>
            <div className="verdict-name">{dominant.toUpperCase()}</div>
            <div className="verdict-stat">
              <strong>{dominantPercent}%</strong> of analyzed signals ({dominantCount}/{analyzedPosts})
            </div>
          </div>
        </div>

        {insight.insufficientEvidence && (
          <div className="ir-warning-banner">
            <Icon name="alerts" size={16} />
            <span>
              Limited Knowledge Base evidence was retrieved for this run. Grounding relies primarily on raw social posts. Adding company policy documents will increase confidence scores.
            </span>
          </div>
        )}
      </section>

      {/* 3. Key Quantitative Telemetry */}
      <section className="ir-section-card">
        <SectionHeader
          number={getSectionNum()}
          title="Quantitative Telemetry & Performance Matrix"
          subtitle="Real-time metrics, intake volume, and audience engagement aggregates"
        />

        <div className="ir-kpi-grid">
          <StatFigure
            label="Total Ingested Signals"
            value={totalPosts.toLocaleString()}
            sublabel="Multi-Platform Stream Intake"
            iconName="collection"
          />
          <StatFigure
            label="NLP Analyzed Signals"
            value={analyzedPosts.toLocaleString()}
            sublabel={`${coverage}% Coverage of Stream`}
            tone="positive"
            iconName="brain"
          />
          <StatFigure
            label="Mean Sentiment Score"
            value={averageScore.toFixed(2)}
            sublabel="Scale: -1.00 to +1.00"
            tone={averageScore >= 0.2 ? 'positive' : averageScore <= -0.2 ? 'negative' : 'neutral'}
            iconName="analyses"
          />
          <StatFigure
            label="Total Audience Likes"
            value={toNumber(engagement.likes).toLocaleString()}
            sublabel="Affirmation Signals"
            iconName="heart"
          />
          <StatFigure
            label="Total Shares / Reposts"
            value={toNumber(engagement.shares).toLocaleString()}
            sublabel="Reach & Virality Velocity"
            iconName="share"
          />
          <StatFigure
            label="Total Public Comments"
            value={toNumber(engagement.comments).toLocaleString()}
            sublabel="Discourse & Reaction Volume"
            iconName="comments"
          />
        </div>
      </section>

      {/* 4. Deep Sentiment & Emotion Dynamics */}
      <section className="ir-section-card">
        <SectionHeader
          number={getSectionNum()}
          title="NLP Sentiment & Emotion Dynamics (Agent 2)"
          subtitle="Deep linguistic parsing, tone distribution, and classification spectrum"
        />

        <div className="ir-sentiment-bars-card">
          <div className="sentiment-tier-bar">
            <div className="sentiment-tier-info">
              <span className="tier-name tier-name--pos">Positive Signals</span>
              <strong>{labels.positive} posts ({distribution.positivePercent || 0}%)</strong>
            </div>
            <div className="tier-progress-track">
              <div
                className="tier-progress-fill tier-progress-fill--pos"
                style={{ width: `${distribution.positivePercent || 0}%` }}
              />
            </div>
          </div>

          <div className="sentiment-tier-bar">
            <div className="sentiment-tier-info">
              <span className="tier-name tier-name--neu">Neutral Signals</span>
              <strong>{labels.neutral} posts ({distribution.neutralPercent || 0}%)</strong>
            </div>
            <div className="tier-progress-track">
              <div
                className="tier-progress-fill tier-progress-fill--neu"
                style={{ width: `${distribution.neutralPercent || 0}%` }}
              />
            </div>
          </div>

          <div className="sentiment-tier-bar">
            <div className="sentiment-tier-info">
              <span className="tier-name tier-name--neg">Negative Signals</span>
              <strong>{labels.negative} posts ({distribution.negativePercent || 0}%)</strong>
            </div>
            <div className="tier-progress-track">
              <div
                className="tier-progress-fill tier-progress-fill--neg"
                style={{ width: `${distribution.negativePercent || 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Priority, Emotion, and Intent Distributions */}
        <div className="ir-dist-grid">
          <DistributionList
            title="Priority Rating"
            distribution={agentMetadata.priorityDistribution}
            iconName="alerts"
          />
          <DistributionList
            title="Emotion Classification"
            distribution={agentMetadata.emotionDistribution}
            iconName="sparkles"
          />
          <DistributionList
            title="Intent Categorization"
            distribution={agentMetadata.intentDistribution}
            iconName="target"
          />
        </div>
      </section>

      {/* 5. Audience Comments & Public Conversational Discourse Intelligence */}
      <section className="ir-section-card" id="audience-comments-discourse">
        <SectionHeader
          number={getSectionNum()}
          title="Audience Comments & Conversational Discourse Intelligence (Deep NLP)"
          subtitle="Granular linguistic parsing and intent classification of individual public comments and replies"
          badge={`${commentDiscourse.totalCommentsRead || (commentDiscourse.comments || []).length || engagement.comments || 0} Comments Read`}
        />

        {/* Discourse Mini KPI Grid */}
        <div className="ir-comment-kpis">
          <div className="comment-kpi-card">
            <div className="comment-kpi-icon comment-kpi-icon--blue">
              <Icon name="comments" size={16} />
            </div>
            <div>
              <span className="comment-kpi-label">TOTAL READ COMMENTS</span>
              <strong className="comment-kpi-val">
                {commentDiscourse.totalCommentsRead || (commentDiscourse.comments || []).length || toNumber(engagement.comments)}
              </strong>
            </div>
          </div>

          <div className="comment-kpi-card">
            <div className="comment-kpi-icon comment-kpi-icon--cyan">
              <Icon name="target" size={16} />
            </div>
            <div>
              <span className="comment-kpi-label">PUBLIC INQUIRIES</span>
              <strong className="comment-kpi-val">{intentCounts.question || 0}</strong>
            </div>
          </div>

          <div className="comment-kpi-card">
            <div className={`comment-kpi-icon ${intentCounts.complaint > 0 ? 'comment-kpi-icon--rose' : 'comment-kpi-icon--slate'}`}>
              <Icon name="alerts" size={16} />
            </div>
            <div>
              <span className="comment-kpi-label">CRITICAL COMPLAINTS</span>
              <strong className="comment-kpi-val">{intentCounts.complaint || 0}</strong>
            </div>
          </div>

          <div className="comment-kpi-card">
            <div className="comment-kpi-icon comment-kpi-icon--emerald">
              <Icon name="sparkles" size={16} />
            </div>
            <div>
              <span className="comment-kpi-label">PRAISE &amp; FEEDBACK</span>
              <strong className="comment-kpi-val">{(intentCounts.praise || 0) + (intentCounts.suggestion || 0)}</strong>
            </div>
          </div>
        </div>

        {/* Interactive Filter Pills */}
        <div className="ir-comment-filter-bar">
          <span className="filter-bar-title">Filter Discourse Stream:</span>
          <div className="filter-pills-group">
            {[
              { id: 'all', label: `All Comments (${(commentDiscourse.comments || []).length})` },
              { id: 'question', label: `❓ Inquiries (${intentCounts.question || 0})` },
              { id: 'complaint', label: `⚠️ Complaints (${intentCounts.complaint || 0})` },
              { id: 'praise', label: `🌟 Praise (${intentCounts.praise || 0})` },
              { id: 'suggestion', label: `💡 Suggestions (${intentCounts.suggestion || 0})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`filter-pill-btn ${commentFilter === tab.id ? 'active' : ''}`}
                onClick={() => setCommentFilter(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Comments Cards List */}
        {filteredComments.length === 0 ? (
          <div className="ir-empty-comments-state">
            <Icon name="comments" size={24} />
            <p>
              {(commentDiscourse.comments || []).length === 0
                ? 'No individual comments were ingested with this post. Comments ingested via screenshot or API will appear here with deep sentiment & intent tagging.'
                : `No comments match the "${commentFilter}" filter.`}
            </p>
          </div>
        ) : (
          <div className="ir-comments-grid">
            {filteredComments.map((comment, index) => {
              const scoreVal = comment.sentiment?.score !== undefined ? Number(comment.sentiment.score) : 0
              const labelTone = comment.sentiment?.label || 'neutral'
              const intentTag = comment.intent || 'other'
              const emotionTag = comment.emotion?.label || comment.emotion || 'neutral'

              return (
                <div className={`ir-comment-card ir-comment-card--${labelTone}`} key={`${comment.author}-${index}`}>
                  <div className="comment-card-top">
                    <div className="comment-user-info">
                      <div className="comment-avatar">
                        {(comment.author || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <strong className="comment-author-name">@{comment.author || 'audience_member'}</strong>
                        <span className="comment-intent-badge comment-intent-badge--{intentTag}">
                          {intentTag === 'question' && '❓ Public Inquiry'}
                          {intentTag === 'complaint' && '⚠️ User Complaint'}
                          {intentTag === 'praise' && '🌟 Brand Advocacy'}
                          {intentTag === 'suggestion' && '💡 Product Suggestion'}
                          {intentTag === 'spam' && '🚫 Flagged Spam'}
                          {intentTag === 'other' && '💬 Public Discourse'}
                        </span>
                      </div>
                    </div>

                    <div className="comment-sentiment-meta">
                      <span className={`comment-score-badge comment-score-badge--${labelTone}`}>
                        {scoreVal > 0 ? `+${scoreVal.toFixed(2)}` : scoreVal.toFixed(2)}
                      </span>
                      {emotionTag && emotionTag !== 'neutral' && (
                        <span className="comment-emotion-tag">{emotionTag}</span>
                      )}
                    </div>
                  </div>

                  <p className="comment-quote-text">&ldquo;{comment.content}&rdquo;</p>

                  {(intentTag === 'question' || intentTag === 'complaint') && (
                    <div className="comment-grounding-indicator">
                      <Icon name="check" size={13} />
                      <span>Synthesized into Agent 4 PR response mitigation</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* 6. Thematic Clusters & Named Entity Recognition (NER) */}
      <section className="ir-section-card">
        <SectionHeader
          number={getSectionNum()}
          title="Conversational Themes & Entity Intelligence"
          subtitle="Aggregated topic modeling and high-frequency extracted entities"
        />

        <div className="ir-two-col-grid">
          <RankedCluster
            title="Ranked Thematic Topic Clusters"
            items={topTopics}
            tone="topic"
            iconName="collection"
          />
          <RankedCluster
            title="Extracted Named Entities (NER)"
            items={topEntities}
            tone="entity"
            iconName="bolt"
          />
        </div>
      </section>

      {/* 6. Verifiable Grounding Citations (Agent 3 RAG) */}
      <section className="ir-section-card">
        <SectionHeader
          number={getSectionNum()}
          title="Verifiable Knowledge Base Evidence (Agent 3 RAG)"
          subtitle="Semantic vector citations retrieved to ensure zero hallucination and policy adherence"
          badge={`${knowledgeSources.length} Citations Attached`}
        />

        {knowledgeSources.length === 0 ? (
          <div className="ir-empty-state-box">
            <Icon name="knowledge" size={24} />
            <p>No specific enterprise knowledge base citations were linked to this execution run.</p>
          </div>
        ) : (
          <div className="ir-citations-list">
            {knowledgeSources.map((source, index) => (
              <article className="ir-citation-card" key={`${source.title}-${index}`}>
                <div className="citation-header">
                  <div className="citation-title-group">
                    <span className="citation-index">CITATION #{String(index + 1).padStart(2, '0')}</span>
                    <strong className="citation-title">{source.title || 'Enterprise Policy Document'}</strong>
                  </div>
                  <span className="citation-score-badge">
                    {Math.round(toNumber(source.score) * 100)}% Semantic Match
                  </span>
                </div>
                {source.source && (
                  <div className="citation-source-path">
                    <span>Source URI:</span> <a href={source.source} target="_blank" rel="noreferrer">{source.source}</a>
                  </div>
                )}
                <blockquote className="citation-excerpt">
                  &ldquo;{source.chunk}&rdquo;
                </blockquote>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* 7. Ingested Social Signal Evidence Trail */}
      {evidence.length > 0 && (
        <section className="ir-section-card">
          <SectionHeader
            number={getSectionNum()}
            title="Retrieved Social Signal Evidence Trail"
            subtitle="Original raw posts and comments powering the AI analysis"
            badge={`${evidence.length} Evidence Signals`}
          />

          <div className="ir-evidence-signals-grid">
            {evidence.map(({ post, score }, index) =>
              post ? (
                <div className="ir-evidence-card" key={post._id || index}>
                  <div className="evidence-card-head">
                    <div className="evidence-author-box">
                      <span className="evidence-platform-tag">{post.platform || 'web'}</span>
                      <strong>@{post.author || 'social_user'}</strong>
                    </div>
                    <span className="evidence-match-pill">
                      {Math.round(toNumber(score) * 100)}% Match
                    </span>
                  </div>
                  <p className="evidence-content-quote">&ldquo;{post.content}&rdquo;</p>
                  <div className="evidence-card-footer">
                    <span className="evidence-date">
                      {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : 'Recent'}
                    </span>
                    <Link className="evidence-view-link" to={getPostDetailPath(post._id)}>
                      Inspect Raw Signal →
                    </Link>
                  </div>
                </div>
              ) : null,
            )}
          </div>
        </section>
      )}

      {/* 8. Polarizing Signals Spotlight (Positive vs Negative Extremes) */}
      {(insight.topNegativePosts?.length > 0 || insight.topPositivePosts?.length > 0) && (
        <section className="ir-section-card">
          <SectionHeader
            number={getSectionNum()}
            title="Polarizing Signals Spotlight"
            subtitle="Critical escalation mentions vs top brand advocacy highlights"
          />

          <div className="ir-two-col-grid">
            {/* Top Critical / Negative */}
            <div className="ir-spotlight-column">
              <div className="spotlight-col-head spotlight-col-head--negative">
                <Icon name="alerts" size={16} />
                <h4>Critical Mentions (High Negative Sentiment)</h4>
              </div>
              <div className="spotlight-cards-list">
                {insight.topNegativePosts?.map(({ post, score }) =>
                  post ? (
                    <div className="spotlight-post-card spotlight-post-card--negative" key={post._id}>
                      <div className="spotlight-post-header">
                        <span className="spotlight-author">@{post.author}</span>
                        <span className="sentiment-chip sentiment-chip--neg">{toNumber(score).toFixed(2)}</span>
                      </div>
                      <p className="spotlight-post-body">&ldquo;{post.content}&rdquo;</p>
                      <Link className="spotlight-post-link" to={getPostDetailPath(post._id)}>
                        View post details →
                      </Link>
                    </div>
                  ) : null,
                )}
              </div>
            </div>

            {/* Top Advocacy / Positive */}
            <div className="ir-spotlight-column">
              <div className="spotlight-col-head spotlight-col-head--positive">
                <Icon name="sparkles" size={16} />
                <h4>Brand Advocacy (High Positive Sentiment)</h4>
              </div>
              <div className="spotlight-cards-list">
                {insight.topPositivePosts?.map(({ post, score }) =>
                  post ? (
                    <div className="spotlight-post-card spotlight-post-card--positive" key={post._id}>
                      <div className="spotlight-post-header">
                        <span className="spotlight-author">@{post.author}</span>
                        <span className="sentiment-chip sentiment-chip--pos">+{toNumber(score).toFixed(2)}</span>
                      </div>
                      <p className="spotlight-post-body">&ldquo;{post.content}&rdquo;</p>
                      <Link className="spotlight-post-link" to={getPostDetailPath(post._id)}>
                        View post details →
                      </Link>
                    </div>
                  ) : null,
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 9. Actionable PR Recommendations & Strategy */}
      <section className="ir-section-card">
        <SectionHeader
          number={getSectionNum()}
          title="Prioritized Strategic Action Plan &amp; Mitigation"
          subtitle="Agent-synthesized executive recommendations and PR action steps"
        />

        {recommendations.length === 0 ? (
          <p className="ir-empty-hint">No recommendations generated.</p>
        ) : (
          <div className="ir-recommendations-list">
            {recommendations.map((rec, idx) => (
              <div className="ir-rec-item" key={idx}>
                <div className="rec-number-badge">{idx + 1}</div>
                <div className="rec-text-body">
                  <p>{rec}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 10. Agent 4 PR Draft Statement & Human Governance Review */}
      {(insight.draftResponse || insight.review?.editedDraft) && (
        <section className="ir-section-card ir-section-card--highlight">
          <SectionHeader
            number={getSectionNum()}
            title="Synthesized PR Response Statement (Agent 4)"
            subtitle="Grounded external response draft awaiting or verified by human governance"
            badge={`Status: ${(insight.review?.status || 'Pending').toUpperCase()}`}
          />

          <div className="ir-draft-container">
            <div className="draft-header-bar">
              <div className="draft-meta-info">
                <Icon name="shield" size={15} />
                <span>
                  Governance State: <strong>{insight.review?.status || 'Pending Human Authorization'}</strong>
                </span>
              </div>
              <button
                type="button"
                className="btn btn--outline btn--xs"
                onClick={handleCopyDraft}
              >
                {copiedDraft ? '✓ Copied to Clipboard' : '📋 Copy Draft'}
              </button>
            </div>

            <div className="draft-content-box">
              <p>{insight.review?.editedDraft || insight.draftResponse}</p>
            </div>

            {insight.review?.note && (
              <div className="draft-reviewer-note">
                <strong>Reviewer Note:</strong> {insight.review.note}
              </div>
            )}
          </div>
        </section>
      )}

      {/* 11. Compliance & Multi-Agent Audit Signature */}
      <footer className="ir-compliance-footer">
        <div className="ir-audit-meta">
          <span>Engine: <strong>{insight.generation?.provider || 'SignalOS Multi-Agent Network'}</strong></span>
          <span>Model: <strong>{insight.generation?.model || 'Agentic-v2'}</strong></span>
          <span>Verification Hash: <strong>SHA256-{reportIdStr}</strong></span>
        </div>
        <div className="ir-audit-legal">
          Strict Human-in-the-Loop governance active. All synthesized outputs require authorized approval before publication.
        </div>
      </footer>
    </div>
  )
}

export default InsightReport