import { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PageContainer from '../components/common/PageContainer.jsx'
import ErrorMessage from '../components/common/ErrorMessage.jsx'
import Loading from '../components/common/Loading.jsx'
import AnalysisResult from '../components/analysis/AnalysisResult.jsx'
import Icon from '../components/common/Icon.jsx'
import { analysesService } from '../services/analysesService.js'
import { getPostDetailPath } from '../constants/routes.js'
import { formatDate } from '../utils/format.js'

const PLATFORM_COLORS = {
  x: { bg: '#0f1419', text: '#ffffff', label: 'X / Twitter' },
  twitter: { bg: '#1d9bf0', text: '#ffffff', label: 'X / Twitter' },
  reddit: { bg: '#ff4500', text: '#ffffff', label: 'Reddit' },
  linkedin: { bg: '#0a66c2', text: '#ffffff', label: 'LinkedIn' },
  facebook: { bg: '#1877f2', text: '#ffffff', label: 'Facebook' },
  meta: { bg: '#0064e0', text: '#ffffff', label: 'Meta' },
  instagram: { bg: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)', text: '#ffffff', label: 'Instagram' },
  youtube: { bg: '#ff0000', text: '#ffffff', label: 'YouTube' },
  other: { bg: '#475569', text: '#ffffff', label: 'Post' },
}

function AnalysesPage() {
  const navigate = useNavigate()
  const [analyses, setAnalyses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  // Filters & Search State
  const [searchQuery, setSearchQuery] = useState('')
  const [sentimentFilter, setSentimentFilter] = useState('ALL')
  const [priorityFilter, setPriorityFilter] = useState('ALL')
  const [platformFilter, setPlatformFilter] = useState('ALL')
  const [sortBy, setSortBy] = useState('newest')

  const fetchAnalyses = () => {
    setLoading(true)
    setError(null)

    analysesService
      .getAnalyses()
      .then((response) => setAnalyses(response.data.analyses || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchAnalyses()
  }, [])

  const handleDelete = async (analysisId) => {
    if (!window.confirm('Are you sure you want to delete this NLP analysis record?')) return

    setDeletingId(analysisId)

    try {
      await analysesService.deleteAnalysis(analysisId)
      setAnalyses((prev) => prev.filter((analysis) => analysis._id !== analysisId))
    } catch (err) {
      setError(err.message)
    } finally {
      setDeletingId(null)
    }
  }

  // Calculate Executive KPIs
  const stats = useMemo(() => {
    const total = analyses.length
    if (total === 0) {
      return {
        total: 0,
        positiveCount: 0,
        positivePct: 0,
        neutralCount: 0,
        neutralPct: 0,
        negativeCount: 0,
        negativePct: 0,
        urgentCount: 0,
        dominantEmotion: 'None',
        totalComments: 0,
      }
    }

    let positiveCount = 0
    let neutralCount = 0
    let negativeCount = 0
    let urgentCount = 0
    let totalComments = 0
    const emotionCounts = {}

    analyses.forEach((a) => {
      const sent = (a.sentiment?.label || 'neutral').toLowerCase()
      if (sent === 'positive') positiveCount++
      else if (sent === 'negative') negativeCount++
      else neutralCount++

      const prio = (a.priority?.level || 'low').toLowerCase()
      if (prio === 'urgent' || prio === 'high') urgentCount++

      const emo = a.emotion?.label?.toLowerCase()
      if (emo) emotionCounts[emo] = (emotionCounts[emo] || 0) + 1

      if (a.conversation?.totalComments) {
        totalComments += a.conversation.totalComments
      }
    })

    let dominantEmotion = 'Neutral'
    let maxEmoCount = 0
    Object.entries(emotionCounts).forEach(([emo, count]) => {
      if (count > maxEmoCount) {
        maxEmoCount = count
        dominantEmotion = emo.charAt(0).toUpperCase() + emo.slice(1)
      }
    })

    return {
      total,
      positiveCount,
      positivePct: Math.round((positiveCount / total) * 100),
      neutralCount,
      neutralPct: Math.round((neutralCount / total) * 100),
      negativeCount,
      negativePct: Math.round((negativeCount / total) * 100),
      urgentCount,
      dominantEmotion,
      totalComments,
    }
  }, [analyses])

  // Filter and Sort Analyses
  const filteredAnalyses = useMemo(() => {
    return analyses
      .filter((analysis) => {
        // Search query across content, author, topics, entities
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase()
          const contentMatch = (analysis.post?.content || '').toLowerCase().includes(q)
          const authorMatch = (analysis.post?.author || '').toLowerCase().includes(q)
          const summaryMatch = (analysis.summary || '').toLowerCase().includes(q)
          const topicMatch = (analysis.topics || []).some((t) => t.toLowerCase().includes(q))
          const entityMatch = (analysis.entities || []).some((e) => e.toLowerCase().includes(q))
          if (!contentMatch && !authorMatch && !summaryMatch && !topicMatch && !entityMatch) {
            return false
          }
        }

        // Sentiment filter
        if (sentimentFilter !== 'ALL') {
          const sent = (analysis.sentiment?.label || 'neutral').toUpperCase()
          if (sent !== sentimentFilter) return false
        }

        // Priority filter
        if (priorityFilter !== 'ALL') {
          const prio = (analysis.priority?.level || 'low').toUpperCase()
          if (prio !== priorityFilter) return false
        }

        // Platform filter
        if (platformFilter !== 'ALL') {
          const plat = (analysis.post?.platform || 'other').toLowerCase()
          if (plat !== platformFilter.toLowerCase()) return false
        }

        return true
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.createdAt) - new Date(a.createdAt)
        }
        if (sortBy === 'priority') {
          return (b.priority?.score || 0) - (a.priority?.score || 0)
        }
        if (sortBy === 'negative') {
          return (a.sentiment?.score || 0) - (b.sentiment?.score || 0)
        }
        if (sortBy === 'positive') {
          return (b.sentiment?.score || 0) - (a.sentiment?.score || 0)
        }
        return 0
      })
  }, [analyses, searchQuery, sentimentFilter, priorityFilter, platformFilter, sortBy])

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    sentimentFilter !== 'ALL' ||
    priorityFilter !== 'ALL' ||
    platformFilter !== 'ALL' ||
    sortBy !== 'newest'

  const clearFilters = () => {
    setSearchQuery('')
    setSentimentFilter('ALL')
    setPriorityFilter('ALL')
    setPlatformFilter('ALL')
    setSortBy('newest')
  }

  return (
    <PageContainer
      title="Agent 2: NLP & Emotion Intelligence"
      subtitle="Deep semantic polarity, fine-grained emotion vectors, intent classification, and entity extraction across all social channels."
    >
      {/* Executive KPI Overview Cards */}
      <div className="nlp-kpi-grid">
        {/* Card 1: Total Posts Analyzed */}
        <div className="nlp-kpi-card">
          <div className="nlp-kpi-card__head">
            <span className="nlp-kpi-card__title">Total Analyzed</span>
            <div className="nlp-kpi-icon-wrap nlp-kpi-icon-wrap--blue">
              <Icon name="engineNlp" size={18} />
            </div>
          </div>
          <div className="nlp-kpi-card__value">{stats.total}</div>
          <div className="nlp-kpi-card__sub">
            <span>Live Agent 2 Pipeline Ingestion</span>
          </div>
        </div>

        {/* Card 2: Sentiment Spectrum */}
        <div className="nlp-kpi-card">
          <div className="nlp-kpi-card__head">
            <span className="nlp-kpi-card__title">Sentiment Distribution</span>
            <div className="nlp-kpi-icon-wrap nlp-kpi-icon-wrap--green">
              <Icon name="barChart" size={18} />
            </div>
          </div>
          <div className="nlp-sentiment-kpi-bars">
            <div className="nlp-kpi-stat-item">
              <span className="nlp-kpi-dot nlp-kpi-dot--pos" />
              <span className="nlp-kpi-stat-label">Pos: {stats.positivePct}%</span>
            </div>
            <div className="nlp-kpi-stat-item">
              <span className="nlp-kpi-dot nlp-kpi-dot--neu" />
              <span className="nlp-kpi-stat-label">Neu: {stats.neutralPct}%</span>
            </div>
            <div className="nlp-kpi-stat-item">
              <span className="nlp-kpi-dot nlp-kpi-dot--neg" />
              <span className="nlp-kpi-stat-label">Neg: {stats.negativePct}%</span>
            </div>
          </div>
          <div className="nlp-spectrum-bar">
            <div className="nlp-spectrum-fill nlp-spectrum-fill--pos" style={{ width: `${stats.positivePct}%` }} />
            <div className="nlp-spectrum-fill nlp-spectrum-fill--neu" style={{ width: `${stats.neutralPct}%` }} />
            <div className="nlp-spectrum-fill nlp-spectrum-fill--neg" style={{ width: `${stats.negativePct}%` }} />
          </div>
        </div>

        {/* Card 3: Dominant Emotion & Mood */}
        <div className="nlp-kpi-card">
          <div className="nlp-kpi-card__head">
            <span className="nlp-kpi-card__title">Dominant Tone</span>
            <div className="nlp-kpi-icon-wrap nlp-kpi-icon-wrap--purple">
              <Icon name="brain" size={18} />
            </div>
          </div>
          <div className="nlp-kpi-card__value nlp-kpi-card__value--highlight">
            {stats.dominantEmotion}
          </div>
          <div className="nlp-kpi-card__sub">
            <span>{stats.totalComments} comments analyzed across feeds</span>
          </div>
        </div>

        {/* Card 4: Crisis & Priority Escalation */}
        <div className="nlp-kpi-card">
          <div className="nlp-kpi-card__head">
            <span className="nlp-kpi-card__title">Priority Escalations</span>
            <div className="nlp-kpi-icon-wrap nlp-kpi-icon-wrap--red">
              <Icon name="alerts" size={18} />
            </div>
          </div>
          <div className="nlp-kpi-card__value nlp-kpi-card__value--urgent">
            {stats.urgentCount}
            {stats.urgentCount > 0 && <span className="nlp-pulse-badge">ACTION REQ</span>}
          </div>
          <div className="nlp-kpi-card__sub">
            <span>High/Urgent PR attention triggers</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Control Toolbar */}
      <div className="nlp-toolbar card">
        <div className="nlp-toolbar__top">
          {/* Live Search Input */}
          <div className="nlp-search-box">
            <Icon name="retrieval" size={16} className="nlp-search-icon" />
            <input
              type="text"
              className="nlp-search-input"
              placeholder="Search post text, author @handle, topics (#tag), or recognized entities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="nlp-search-clear-btn"
                onClick={() => setSearchQuery('')}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="nlp-sort-box">
            <label className="nlp-sort-label" htmlFor="nlp-sort-select">Sort by:</label>
            <select
              id="nlp-sort-select"
              className="nlp-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">🕒 Newest Ingested</option>
              <option value="priority">🔥 Highest Priority First</option>
              <option value="negative">🚨 Most Negative First</option>
              <option value="positive">✨ Most Positive First</option>
            </select>
          </div>
        </div>

        {/* Filter Pills Row */}
        <div className="nlp-toolbar__filters">
          {/* Sentiment Filter */}
          <div className="nlp-filter-group">
            <span className="nlp-filter-label">Sentiment:</span>
            <div className="nlp-filter-pills">
              {['ALL', 'POSITIVE', 'NEUTRAL', 'NEGATIVE'].map((val) => (
                <button
                  key={val}
                  type="button"
                  className={`nlp-filter-pill ${sentimentFilter === val ? 'nlp-filter-pill--active' : ''}`}
                  onClick={() => setSentimentFilter(val)}
                >
                  {val === 'ALL' ? 'All' : val.charAt(0) + val.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Priority Filter */}
          <div className="nlp-filter-group">
            <span className="nlp-filter-label">Priority:</span>
            <div className="nlp-filter-pills">
              {['ALL', 'URGENT', 'HIGH', 'MEDIUM', 'LOW'].map((val) => (
                <button
                  key={val}
                  type="button"
                  className={`nlp-filter-pill ${priorityFilter === val ? 'nlp-filter-pill--active' : ''}`}
                  onClick={() => setPriorityFilter(val)}
                >
                  {val === 'ALL' ? 'All' : val.charAt(0) + val.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Platform Filter */}
          <div className="nlp-filter-group">
            <span className="nlp-filter-label">Platform:</span>
            <div className="nlp-filter-pills">
              {['ALL', 'X', 'REDDIT', 'LINKEDIN', 'FACEBOOK', 'OTHER'].map((val) => (
                <button
                  key={val}
                  type="button"
                  className={`nlp-filter-pill ${platformFilter === val ? 'nlp-filter-pill--active' : ''}`}
                  onClick={() => setPlatformFilter(val)}
                >
                  {val === 'ALL' ? 'All' : val}
                </button>
              ))}
            </div>
          </div>

          {hasActiveFilters && (
            <button type="button" className="btn btn--outline btn--sm nlp-reset-btn" onClick={clearFilters}>
              Reset Filters ({filteredAnalyses.length} of {analyses.length})
            </button>
          )}
        </div>
      </div>

      {/* Main Content Stream */}
      {loading && <Loading label="Loading intelligence analyses..." />}

      {!loading && error && <ErrorMessage message={error} onRetry={fetchAnalyses} />}

      {!loading && !error && analyses.length === 0 && (
        <div className="card nlp-empty-state-card" data-tour="analyses-container">
          <div className="nlp-empty-icon-wrap">
            <Icon name="engineNlp" size={32} />
          </div>
          <h3>No NLP Analyses Ingested Yet</h3>
          <p>
            Agent 2 processes raw social mentions, runs continuous sentiment scoring, extracts Named Entities, and
            analyzes audience comment intent. Ingest or test a mention to get started.
          </p>
          <div className="nlp-empty-actions">
            <Link className="btn btn--primary" to="/posts">
              Go to Ingestion Collection ➔
            </Link>
          </div>
        </div>
      )}

      {!loading && !error && analyses.length > 0 && filteredAnalyses.length === 0 && (
        <div className="card nlp-empty-state-card">
          <h3>No Matches Found</h3>
          <p>No analyzed records match your current search and filter combination.</p>
          <button type="button" className="btn btn--primary btn--sm" onClick={clearFilters}>
            Clear All Filters
          </button>
        </div>
      )}

      {!loading && !error && filteredAnalyses.length > 0 && (
        <div className="nlp-cards-feed" data-tour="analyses-container">
          {filteredAnalyses.map((analysis) => {
            const platformKey = (analysis.post?.platform || 'other').toLowerCase()
            const platformInfo = PLATFORM_COLORS[platformKey] || PLATFORM_COLORS.other
            const author = analysis.post?.author ? `@${analysis.post.author}` : '@Unknown author'

            return (
              <article className="card nlp-post-card" key={analysis._id}>
                {/* Header Bar: Platform Badge, Author, Date, Quick Stats */}
                <div className="nlp-post-card__head">
                  <div className="nlp-post-card__meta">
                    <span
                      className="nlp-platform-badge"
                      style={{ background: platformInfo.bg, color: platformInfo.text }}
                    >
                      {platformInfo.label}
                    </span>
                    <span className="nlp-author-badge">
                      <span className="nlp-author-avatar">{author.charAt(1)?.toUpperCase() || 'U'}</span>
                      <strong className="nlp-author-name">{author}</strong>
                    </span>
                    <span className="nlp-post-date">
                      {formatDate(analysis.createdAt || analysis.post?.createdAt)}
                    </span>
                  </div>

                  <div className="nlp-post-card__head-actions">
                    {analysis.priority?.level && (
                      <span className={`nlp-head-priority-pill nlp-head-priority-pill--${analysis.priority.level}`}>
                        {analysis.priority.level.toUpperCase()} PRIORITY
                      </span>
                    )}
                  </div>
                </div>

                {/* Original Post Quotation Bubble */}
                <div className="nlp-post-content-bubble">
                  <div className="nlp-quote-bar" />
                  <div className="nlp-post-content-body">
                    <p className="nlp-post-text">{analysis.post?.content || '—'}</p>
                    <div className="nlp-post-content-meta">
                      <span>{(analysis.post?.content || '').length} chars</span>
                      {analysis.post?.engagement && (
                        <span>
                          · {analysis.post.engagement.likes || 0} likes · {analysis.post.engagement.comments || 0} comments · {analysis.post.engagement.shares || 0} shares
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Rich Agent 2 NLP Intelligence Suite */}
                <AnalysisResult analysis={analysis} />

                {/* Card Action Footer */}
                <div className="nlp-post-card__footer">
                  <div className="nlp-post-card__footer-left">
                    {analysis.post && (
                      <Link className="btn btn--primary btn--sm" to={getPostDetailPath(analysis.post._id)}>
                        <Icon name="sparkles" size={14} />
                        <span>Inspect Full Pipeline Trace</span>
                      </Link>
                    )}
                    {analysis.topics?.length > 0 && (
                      <button
                        type="button"
                        className="btn btn--outline btn--sm"
                        onClick={() => navigate(`/retrieval?q=${encodeURIComponent(analysis.topics[0])}`)}
                        title="Search Vector Knowledge Base for this topic"
                      >
                        <Icon name="retrieval" size={14} />
                        <span>Query RAG ({analysis.topics[0]})</span>
                      </button>
                    )}
                  </div>

                  <div className="nlp-post-card__footer-right">
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm nlp-delete-btn"
                      onClick={() => handleDelete(analysis._id)}
                      disabled={deletingId === analysis._id}
                      title="Delete this analysis record"
                    >
                      {deletingId === analysis._id ? 'Deleting...' : '🗑 Delete'}
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </PageContainer>
  )
}

export default AnalysesPage