import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import PageContainer from '../components/common/PageContainer.jsx'
import ErrorMessage from '../components/common/ErrorMessage.jsx'
import Loading from '../components/common/Loading.jsx'
import InsightReport from '../components/insight/InsightReport.jsx'
import Icon from '../components/common/Icon.jsx'
import { insightsService } from '../services/insightsService.js'
import { retrievalService } from '../services/retrievalService.js'
import { getInsightDetailPath } from '../constants/routes.js'
import { formatDate } from '../utils/format.js'
import { downloadBlob, downloadTextFile, MIME_TYPES } from '../utils/download.js'

function InsightsPage() {
  const [searchParams] = useSearchParams()
  const urlRetrievalId = searchParams.get('retrieval') || ''

  const [savedSearches, setSavedSearches] = useState([])
  const [searchesLoading, setSearchesLoading] = useState(true)
  const [selectedRetrieval, setSelectedRetrieval] = useState(urlRetrievalId)

  const [generating, setGenerating] = useState(false)
  const [formError, setFormError] = useState(null)
  const [current, setCurrent] = useState(null)

  const [insights, setInsights] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [exportingId, setExportingId] = useState(null)

  const lastAutoRetrieval = useRef(null)

  const generate = async (retrievalId) => {
    setFormError(null)
    setGenerating(true)

    try {
      const payload = retrievalId ? { retrievalId } : {}
      const response = await insightsService.createInsight(payload)
      setCurrent(response.data.insight)
      setInsights((prev) => [response.data.insight, ...prev])
    } catch (err) {
      setFormError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  const handleGenerate = (event) => {
    event.preventDefault()
    generate(selectedRetrieval)
  }

  const fetchData = () => {
    setLoading(true)
    setLoadError(null)
    setSearchesLoading(true)

    retrievalService
      .getRetrievals()
      .then((response) => setSavedSearches(response.data.retrievals || []))
      .catch(() => setSavedSearches([]))
      .finally(() => setSearchesLoading(false))

    insightsService
      .getInsights()
      .then((response) => setInsights(response.data.insights || []))
      .catch((err) => setLoadError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (!urlRetrievalId || urlRetrievalId === lastAutoRetrieval.current) return
    lastAutoRetrieval.current = urlRetrievalId
    setSelectedRetrieval(urlRetrievalId)
    generate(urlRetrievalId)
  }, [urlRetrievalId])

  const handleDelete = async (insightId) => {
    if (!window.confirm('Are you sure you want to permanently delete this executive intelligence report?')) return

    setDeletingId(insightId)

    try {
      await insightsService.deleteInsight(insightId)
      setInsights((prev) => prev.filter((item) => item._id !== insightId))
      if (current?._id === insightId) setCurrent(null)
    } catch (err) {
      setLoadError(err.message)
    } finally {
      setDeletingId(null)
    }
  }

  const handleExportMarkdown = async (insightId) => {
    setLoadError(null)
    setExportingId(`md-${insightId}`)

    try {
      const response = await insightsService.exportInsight(insightId, 'markdown')
      downloadTextFile(response.data.content, response.data.filename, MIME_TYPES.markdown)
    } catch (err) {
      setLoadError(err.message)
    } finally {
      setExportingId(null)
    }
  }

  const handleDownloadPdf = async (insightId) => {
    setLoadError(null)
    setExportingId(`pdf-${insightId}`)

    try {
      const response = await insightsService.downloadPdf(insightId)
      const disposition = response.headers['content-disposition'] || ''
      const filename = disposition.match(/filename="?([^";]+)"?/)?.[1] || `signalos-executive-report-${String(insightId).slice(-8)}.pdf`
      downloadBlob(response.data, filename)
    } catch (err) {
      setLoadError(err.message)
    } finally {
      setExportingId(null)
    }
  }

  // Telemetry Aggregates
  const totalReportsCount = insights.length
  const totalCitationsCount = insights.reduce((acc, curr) => acc + (curr.knowledgeSources?.length || 0), 0)
  const approvedCount = insights.filter((item) => item.review?.status === 'approved').length

  return (
    <PageContainer
      title="Executive Intelligence & Reports"
      subtitle="Synthesized brand diagnostics, sentiment dynamics, verifiable RAG grounding, and strategic PR roadmaps."
    >
      {/* 1. Header Telemetry Deck */}
      <section className="reports-telemetry-deck">
        <div className="telemetry-box">
          <span className="telemetry-label">GENERATED BRIEFINGS</span>
          <strong className="telemetry-val">{totalReportsCount}</strong>
          <small className="telemetry-sub">Multi-Agent Reports</small>
        </div>
        <div className="telemetry-box">
          <span className="telemetry-label">GROUNDED CITATIONS</span>
          <strong className="telemetry-val">{totalCitationsCount}</strong>
          <small className="telemetry-sub">Verified Enterprise Sources</small>
        </div>
        <div className="telemetry-box">
          <span className="telemetry-label">GOVERNANCE AUTHORIZATIONS</span>
          <strong className="telemetry-val">{approvedCount}</strong>
          <small className="telemetry-sub">Approved PR Drafts</small>
        </div>
        <div className="telemetry-box">
          <span className="telemetry-label">ACTIVE ORCHESTRATION</span>
          <strong className="telemetry-val" style={{ color: '#10b981' }}>100%</strong>
          <small className="telemetry-sub">Agents 1 ➔ 4 Operational</small>
        </div>
      </section>

      {/* 2. Synthesis Generator Deck */}
      <section className="report-generator-card" data-tour="insights-container">
        <div className="generator-card-head">
          <div className="generator-title-wrap">
            <span className="eyebrow flex-center gap-2">
              <Icon name="sparkles" size={14} /> Autonomous Generation Engine
            </span>
            <h2>Synthesize New Executive Intelligence Report</h2>
            <p>
              Initiates Agent 3 (Semantic RAG Retrieval) and Agent 4 (Synthesis Core) to compile deep diagnostics, thematic clusters, citations, and strategic PR response drafts.
            </p>
          </div>
        </div>

        <form className="generator-form-grid" onSubmit={handleGenerate}>
          <div className="form-group-wrap">
            <label className="generator-label" htmlFor="retrieval-scope">
              INVESTIGATION FOCUS SCOPE
            </label>
            <select
              id="retrieval-scope"
              className="form__input generator-select"
              value={selectedRetrieval}
              onChange={(event) => setSelectedRetrieval(event.target.value)}
              disabled={searchesLoading || generating}
            >
              <option value="">Full Ingested Social Stream (All Monitored Platforms)</option>
              {savedSearches.map((item) => (
                <option key={item._id} value={item._id}>
                  Vector Search Scope: &ldquo;{item.query}&rdquo;
                </option>
              ))}
            </select>
          </div>

          <button
            className="btn btn--primary generator-submit-btn"
            type="submit"
            disabled={generating || searchesLoading}
          >
            {generating ? (
              <>
                <span className="spinner-dots" /> Synthesizing Multi-Agent Briefing…
              </>
            ) : (
              <>
                <Icon name="sparkles" size={16} /> Synthesize Executive Briefing
              </>
            )}
          </button>
        </form>

        {formError && (
          <div style={{ marginTop: '16px' }}>
            <ErrorMessage message={formError} />
          </div>
        )}
      </section>

      {/* 3. Recently Generated Real-Time Report Preview */}
      {current && (
        <section className="current-report-preview-section">
          <div className="preview-section-header">
            <div>
              <span className="eyebrow">Active Execution Session</span>
              <h2>Newly Generated Executive Intelligence Report</h2>
            </div>
            <div className="preview-actions">
              <button
                type="button"
                className="btn btn--primary btn--sm"
                onClick={() => handleDownloadPdf(current._id)}
                disabled={exportingId === `pdf-${current._id}`}
              >
                <Icon name="sparkles" size={14} />
                {exportingId === `pdf-${current._id}` ? 'Generating PDF…' : 'Export Executive PDF'}
              </button>
              <Link className="btn btn--outline btn--sm" to={getInsightDetailPath(current._id)}>
                Open Full Report Workspace →
              </Link>
            </div>
          </div>

          <div className="report-container-wrapper">
            <InsightReport insight={current} />
          </div>
        </section>
      )}

      {/* 4. Report History Repository */}
      <section className="reports-history-section">
        <div className="history-section-header">
          <div>
            <span className="eyebrow">Enterprise Briefing Repository</span>
            <h2>Intelligence Reports Ledger ({insights.length})</h2>
          </div>
          <button className="btn btn--outline btn--sm" onClick={fetchData} disabled={loading}>
            Refresh Ledger
          </button>
        </div>

        {loading && <Loading label="Loading intelligence reports ledger..." />}
        {!loading && loadError && <ErrorMessage message={loadError} onRetry={fetchData} />}

        {!loading && !loadError && insights.length === 0 && (
          <div className="ir-empty-state-box card">
            <Icon name="insights" size={32} />
            <p>No executive intelligence reports generated yet.</p>
            <small>Choose a focus scope above and click &ldquo;Synthesize Executive Briefing&rdquo; to compile your first report.</small>
          </div>
        )}

        {!loading && !loadError && insights.length > 0 && (
          <div className="reports-executive-grid">
            {insights.map((item) => {
              const reportIdStr = String(item._id || '').slice(-8).toUpperCase()
              const dist = item.statistics?.sentimentDistribution || {}
              const dominant =
                (dist.positive || 0) >= (dist.negative || 0) && (dist.positive || 0) >= (dist.neutral || 0)
                  ? 'positive'
                  : (dist.negative || 0) >= (dist.neutral || 0)
                  ? 'negative'
                  : 'neutral'

              const citationsCount = item.knowledgeSources?.length || 0
              const evidenceCount = item.evidence?.length || 0

              return (
                <article className="executive-report-item-card" key={item._id}>
                  {/* Card Header */}
                  <div className="item-card-top">
                    <div className="item-meta-row">
                      <span className="item-report-id">#ISR-{reportIdStr}</span>
                      <span className={`status-pill status-pill--${dominant}`}>
                        {dominant.toUpperCase()} TONE
                      </span>
                      {item.review?.status === 'approved' && (
                        <span className="item-approved-tag">✔ AUTHORIZED</span>
                      )}
                    </div>
                    <span className="item-date">{formatDate(item.createdAt)}</span>
                  </div>

                  {/* Scope & Title */}
                  <h3 className="item-card-title">
                    {item.retrieval?.query ? `Search: "${item.retrieval.query}"` : 'Full Ingested Social Stream'}
                  </h3>

                  {/* Summary Text */}
                  <p className="item-card-summary">
                    {item.summary || 'Executive summary compiled across multi-platform signals.'}
                  </p>

                  {/* Telemetry Chips */}
                  <div className="item-telemetry-chips">
                    <span className="meta-chip">
                      <Icon name="collection" size={13} /> {item.statistics?.totalPosts || 1} Signals Ingested
                    </span>
                    <span className="meta-chip">
                      <Icon name="brain" size={13} /> {item.statistics?.analyzedPosts || 1} NLP Analyzed
                    </span>
                    <span className="meta-chip">
                      <Icon name="knowledge" size={13} /> {citationsCount} RAG Citations
                    </span>
                    {evidenceCount > 0 && (
                      <span className="meta-chip">
                        <Icon name="target" size={13} /> {evidenceCount} Corroborating Signals
                      </span>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="item-card-actions">
                    <Link className="btn btn--primary btn--sm" to={getInsightDetailPath(item._id)}>
                      Open Report →
                    </Link>
                    <button
                      type="button"
                      className="btn btn--outline btn--sm"
                      onClick={() => handleDownloadPdf(item._id)}
                      disabled={exportingId === `pdf-${item._id}`}
                    >
                      {exportingId === `pdf-${item._id}` ? 'Exporting…' : 'PDF'}
                    </button>
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      onClick={() => handleExportMarkdown(item._id)}
                      disabled={exportingId === `md-${item._id}`}
                    >
                      {exportingId === `md-${item._id}` ? '…' : '.MD'}
                    </button>
                    <button
                      type="button"
                      className="btn btn--danger btn--sm"
                      onClick={() => handleDelete(item._id)}
                      disabled={deletingId === item._id}
                    >
                      {deletingId === item._id ? '…' : 'Delete'}
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </PageContainer>
  )
}

export default InsightsPage