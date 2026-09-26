import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import PageContainer from '../components/common/PageContainer.jsx'
import ErrorMessage from '../components/common/ErrorMessage.jsx'
import Loading from '../components/common/Loading.jsx'
import InsightReport from '../components/insight/InsightReport.jsx'
import Icon from '../components/common/Icon.jsx'
import { insightsService } from '../services/insightsService.js'
import { ROUTES } from '../constants/routes.js'
import { downloadBlob, downloadTextFile, MIME_TYPES } from '../utils/download.js'

function InsightDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [insight, setInsight] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [exporting, setExporting] = useState(null)
  const [reviewing, setReviewing] = useState(false)
  const [editedDraft, setEditedDraft] = useState('')
  const [reviewNote, setReviewNote] = useState('')
  const [reviewSuccess, setReviewSuccess] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)

    insightsService
      .getInsight(id)
      .then((response) => {
        setInsight(response.data.insight)
        setEditedDraft(response.data.insight.review?.editedDraft || response.data.insight.draftResponse || '')
        setReviewNote(response.data.insight.review?.note || '')
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to permanently delete this executive intelligence report?')) return

    setDeleting(true)

    try {
      await insightsService.deleteInsight(id)
      navigate(ROUTES.insights)
    } catch (err) {
      setError(err.message)
      setDeleting(false)
    }
  }

  const handleExport = async (format) => {
    setError(null)
    setExporting(format)

    try {
      const response = await insightsService.exportInsight(id, format)
      downloadTextFile(response.data.content, response.data.filename, MIME_TYPES[format])
    } catch (err) {
      setError(err.message)
    } finally {
      setExporting(null)
    }
  }

  const handlePdfDownload = async () => {
    setError(null)
    setExporting('pdf')
    try {
      const response = await insightsService.downloadPdf(id)
      const disposition = response.headers['content-disposition'] || ''
      const filename = disposition.match(/filename="?([^";]+)"?/)?.[1] || `signalos-executive-report-${id.slice(-8)}.pdf`
      downloadBlob(response.data, filename)
    } catch (err) {
      setError(err.message)
    } finally {
      setExporting(null)
    }
  }

  const handleReview = async (status) => {
    setReviewing(true)
    setError(null)
    setReviewSuccess(null)
    try {
      const response = await insightsService.reviewInsight(id, { status, editedDraft, note: reviewNote })
      setInsight(response.data.insight)
      setReviewSuccess(`Report review governance status updated to "${status.toUpperCase()}".`)
      setTimeout(() => setReviewSuccess(null), 4000)
    } catch (err) {
      setError(err.message)
    } finally {
      setReviewing(false)
    }
  }

  if (loading) {
    return (
      <PageContainer title="Executive Intelligence Report">
        <Loading label="Loading structured report data and vector grounding..." />
      </PageContainer>
    )
  }

  if (error && !insight) {
    return (
      <PageContainer title="Executive Intelligence Report">
        <ErrorMessage message={error} />
        <p>
          <Link to={ROUTES.insights} className="btn btn--outline btn--sm mt-2">← Back to Insight Reports</Link>
        </p>
      </PageContainer>
    )
  }

  if (!insight) {
    return (
      <PageContainer title="Executive Intelligence Report">
        <p>This insight report could not be found.</p>
        <p>
          <Link to={ROUTES.insights} className="btn btn--outline btn--sm mt-2">← Back to Insight Reports</Link>
        </p>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      {/* Top Action Bar */}
      <div className="report-top-bar no-print">
        <div className="report-top-bar__left">
          <Link to={ROUTES.insights} className="btn btn--outline btn--sm">
            ← Back to Reports
          </Link>
          <span className="report-timestamp-tag">
            Generated {new Date(insight.createdAt).toLocaleDateString()}
          </span>
        </div>

        <div className="report-top-bar__actions">
          <button
            type="button"
            className="btn btn--primary btn--sm"
            onClick={handlePdfDownload}
            disabled={exporting !== null}
          >
            <Icon name="sparkles" size={14} />
            {exporting === 'pdf' ? 'Compiling PDF…' : 'Export Executive PDF'}
          </button>
          <button
            type="button"
            className="btn btn--outline btn--sm"
            onClick={() => handleExport('markdown')}
            disabled={exporting !== null}
          >
            Markdown (.md)
          </button>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => handleExport('json')}
            disabled={exporting !== null}
          >
            JSON
          </button>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => window.print()}
          >
            Print
          </button>
          <button
            type="button"
            className="btn btn--danger btn--sm"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}
      {reviewSuccess && (
        <div className="admin-toast admin-toast--success no-print" style={{ marginBottom: '16px' }}>
          <Icon name="check" size={16} />
          <span>{reviewSuccess}</span>
        </div>
      )}

      {/* Main Formatted Structured Report */}
      <section className="report-print-area" data-tour="ai-insight-section">
        <InsightReport insight={insight} />
      </section>

      {/* Human-in-the-Loop Governance & Authorization Workspace */}
      <section className="ir-section-card review-governance-card no-print" data-tour="human-approval-actions" style={{ marginTop: '24px' }}>
        <div className="review-workspace__head">
          <div>
            <span className="eyebrow">Human-in-the-Loop Governance</span>
            <h2>Response Authorization &amp; Compliance Sign-off</h2>
          </div>
          <span className={`status-pill status-pill--${insight.review?.status || 'pending'}`}>
            {insight.review?.status === 'approved' ? '✓ Approved for Dispatch' : insight.review?.status === 'rejected' ? '✕ Draft Rejected' : '● Pending Human Authorization'}
          </span>
        </div>

        <p className="governance-subtext">
          SignalOS ensures 100% human oversight. Edit or verify the AI-synthesized response draft below before giving formal authorization.
        </p>

        <div className="form-group" style={{ marginBottom: '14px' }}>
          <label className="form__label" htmlFor="response-draft">
            Editable Response Statement
          </label>
          <textarea
            id="response-draft"
            className="form__input form__textarea"
            rows={5}
            maxLength={2000}
            value={editedDraft}
            onChange={(e) => setEditedDraft(e.target.value)}
            placeholder="Edit draft statement..."
          />
        </div>

        <div className="form-group" style={{ marginBottom: '18px' }}>
          <label className="form__label" htmlFor="review-note">
            Reviewer Audit Note (Optional)
          </label>
          <textarea
            id="review-note"
            className="form__input form__textarea"
            rows={2}
            maxLength={500}
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
            placeholder="e.g. Verified against company refund policy v2.3. Ready for PR team."
          />
        </div>

        <div className="post-card__actions">
          <button
            type="button"
            className="btn btn--primary"
            disabled={reviewing || !editedDraft.trim()}
            onClick={() => handleReview('approved')}
          >
            {reviewing ? 'Authorizing…' : '✓ Formally Authorize & Approve Draft'}
          </button>
          <button
            type="button"
            className="btn btn--danger"
            disabled={reviewing}
            onClick={() => handleReview('rejected')}
          >
            {reviewing ? 'Rejecting…' : '✕ Reject Draft Response'}
          </button>
        </div>
      </section>
    </PageContainer>
  )
}

export default InsightDetailPage
