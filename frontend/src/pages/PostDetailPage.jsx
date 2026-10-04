import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import PageContainer from '../components/common/PageContainer.jsx'
import ErrorMessage from '../components/common/ErrorMessage.jsx'
import Loading from '../components/common/Loading.jsx'
import AnalysisResult from '../components/analysis/AnalysisResult.jsx'
import { postsService } from '../services/postsService.js'
import { analysesService } from '../services/analysesService.js'
import { pipelineService } from '../services/pipelineService.js'
import { insightsService } from '../services/insightsService.js'
import PipelineRunView from '../components/pipeline/PipelineRunView.jsx'
import { ROUTES, getRetrievalPath, getInsightDetailPath } from '../constants/routes.js'
import { formatDate } from '../utils/format.js'

const PLATFORMS = ['twitter', 'facebook', 'instagram', 'linkedin', 'youtube', 'reddit', 'other']
const MAX_CONTENT_LENGTH = 2000

function PostDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(null)
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [analysis, setAnalysis] = useState(null)
  const [analysisLoading, setAnalysisLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisError, setAnalysisError] = useState(null)

  const [run, setRun] = useState(null)
  const [runLoading, setRunLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [stopping, setStopping] = useState(false)
  const [runError, setRunError] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)

    postsService
      .getPost(id)
      .then((response) => setPost(response.data.post))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    setAnalysisLoading(true)
    setAnalysisError(null)
    setAnalysis(null)

    analysesService
      .getAnalysisForPost(id)
      .then((response) => setAnalysis(response.data.analysis))
      .catch((err) => setAnalysisError(err.message))
      .finally(() => setAnalysisLoading(false))
  }, [id])

  useEffect(() => {
    setRunLoading(true)
    setRunError(null)

    pipelineService
      .listRuns({ post: id, limit: 1 })
      .then((response) => setRun(response.data.runs[0] || null))
      .catch((err) => setRunError(err.message))
      .finally(() => setRunLoading(false))
  }, [id])

  const handleProcess = async () => {
    setRunError(null)
    setProcessing(true)

    try {
      const response = await pipelineService.startMention(id)
      setRun(response.data.run)
    } catch (err) {
      if (err.message.includes('RETRIEVAL')) {
        setRunError('Retrieval stage failed — likely because this knowledge base has no indexed documents that match the mention.')
      } else {
        setRunError(err.message)
      }
    } finally {
      setProcessing(false)
    }
  }

  const handleStop = async () => {
    if (!run?._id || stopping) return
    setStopping(true)
    setRunError(null)
    try {
      const response = await pipelineService.stopRun(run._id)
      setRun(response.data.run)
      setProcessing(false)
    } catch (err) {
      setRunError(err.message)
    } finally {
      setStopping(false)
    }
  }

  useEffect(() => {
    if (!run?._id || run.status !== 'processing') return undefined
    const timer = window.setInterval(async () => {
      try {
        const response = await pipelineService.getRun(run._id)
        setRun(response.data.run)
        if (response.data.run.status !== 'processing') setProcessing(false)
      } catch (err) {
        setRunError(err.message)
        setProcessing(false)
      }
    }, 800)
    return () => window.clearInterval(timer)
  }, [run?._id, run?.status])

  const handleAnalyze = async () => {
    setAnalysisError(null)
    setAnalyzing(true)

    try {
      const response = await analysesService.analyzePost(id)
      setAnalysis(response.data.analysis)
    } catch (err) {
      setAnalysisError(err.message)
    } finally {
      setAnalyzing(false)
    }
  }

  const startEditing = () => {
    setForm({
      platform: post.platform,
      author: post.author,
      content: post.content,
      externalId: post.externalId || '',
      publishedAt: post.publishedAt ? post.publishedAt.slice(0, 10) : '',
      likes: post.engagement.likes,
      shares: post.engagement.shares,
      comments: post.engagement.comments,
    })
    setFormError(null)
    setEditing(true)
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = async (event) => {
    event.preventDefault()
    setFormError(null)

    if (!form.author.trim()) return setFormError('Author is required')
    if (!form.content.trim()) return setFormError('Content is required')
    if (form.content.trim().length > MAX_CONTENT_LENGTH) {
      return setFormError(`Content must be ${MAX_CONTENT_LENGTH} characters or fewer`)
    }
    for (const field of ['likes', 'shares', 'comments']) {
      const value = Number(form[field])
      if (!Number.isInteger(value) || value < 0) {
        return setFormError('Engagement counts must be non-negative whole numbers')
      }
    }

    setSaving(true)

    try {
      const payload = {
        platform: form.platform,
        author: form.author.trim(),
        content: form.content.trim(),
        externalId: form.externalId.trim() || undefined,
        publishedAt: form.publishedAt || undefined,
        engagement: {
          likes: Number(form.likes),
          shares: Number(form.shares),
          comments: Number(form.comments),
        },
      }

      const response = await postsService.updatePost(id, payload)
      setPost(response.data.post)
      setEditing(false)
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this collected post?')) return

    setDeleting(true)

    try {
      await postsService.deletePost(id)
      navigate(ROUTES.posts)
    } catch (err) {
      setError(err.message)
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <PageContainer title="Post detail">
        <Loading label="Loading post..." />
      </PageContainer>
    )
  }

  if (error) {
    return (
      <PageContainer title="Post detail">
        <ErrorMessage message={error} />
        <p>
          <Link to={ROUTES.posts}>Back to collection</Link>
        </p>
      </PageContainer>
    )
  }

  if (!post) {
    return (
      <PageContainer title="Post detail">
        <p>This post could not be found.</p>
        <p>
          <Link to={ROUTES.posts}>Back to collection</Link>
        </p>
      </PageContainer>
    )
  }

  return (
    <PageContainer title="Post detail" subtitle={`@${post.author}`}>
      <div className="card post-card">
        <div className="post-card__head">
          <span className="badge">{post.platform}</span>
          <span className="post-card__date">Collected {formatDate(post.createdAt)}</span>
        </div>
        <p className="post-card__content">{post.content}</p>
        <dl className="post-detail">
          <div>
            <dt>External ID</dt>
            <dd>{post.externalId || '—'}</dd>
          </div>
          <div>
            <dt>Published</dt>
            <dd>{formatDate(post.publishedAt)}</dd>
          </div>
          <div>
            <dt>Likes</dt>
            <dd>{post.engagement.likes}</dd>
          </div>
          <div>
            <dt>Shares</dt>
            <dd>{post.engagement.shares}</dd>
          </div>
          <div>
            <dt>Comments</dt>
            <dd>{post.engagement.comments}</dd>
          </div>
        </dl>
        {!editing && (
          <div className="post-card__actions">
            <button type="button" className="btn" onClick={startEditing}>
              Edit
            </button>
            <button
              type="button"
              className="btn btn--danger"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
            <Link className="btn btn--ghost" to={ROUTES.posts}>
              Back to collection
            </Link>
            <Link
              className="btn"
              to={getRetrievalPath(post.content.slice(0, 200))}
              title="Search your collection with this post as the query"
            >
              Find similar posts
            </Link>
          </div>
        )}
      </div>

      <section className="posts-section">
        <h2 className="posts-section__title">NLP Analysis</h2>

        {analysisLoading && <Loading label="Checking analysis..." />}

        {!analysisLoading && analysisError && <ErrorMessage message={analysisError} />}

        {!analysisLoading && !analysisError && !analysis && (
          <p className="empty-state">This post has not been analyzed yet.</p>
        )}

        {!analysisLoading && !analysisError && analysis && (
          <div className="card">
            <AnalysisResult analysis={analysis} />
            <p className="analysis-date">Analyzed {formatDate(analysis.createdAt)}</p>
          </div>
        )}

        <div className="post-card__actions">
          <button
            type="button"
            className="btn"
            onClick={handleAnalyze}
            disabled={analyzing || analysisLoading}
          >
            {analyzing ? 'Analyzing...' : analysis ? 'Re-analyze' : 'Analyze'}
          </button>
        </div>
      </section>

      <section className="posts-section pipeline-console" data-tour="run-pipeline-btn">
        <div className="posts-section__head">
          <h2 className="posts-section__title">Agent pipeline</h2>
          <button type="button" className="btn btn--primary" onClick={handleProcess} disabled={processing || runLoading || run?.status === 'processing'}>
            {processing ? 'Agents working…' : run ? 'Re-run full pipeline' : 'Run full pipeline'}
          </button>
          {run?.status === 'processing' && (
            <button type="button" className="btn btn--danger" onClick={handleStop} disabled={stopping}>
              {stopping ? 'Stopping...' : 'Stop pipeline'}
            </button>
          )}
        </div>
        <p className="analysis-date">
          The four agents process this mention end-to-end: clean the text, score its sentiment and intent, rank credible supporting evidence from your collection and knowledge base, then draft a review-ready response.
        </p>

        {runLoading && <Loading label="Checking previous runs..." />}
        {!runLoading && runError && !run && <ErrorMessage message={runError} />}
        {!runLoading && runError && run && <ErrorMessage message={runError} />}

        {!runLoading && run && (
          <PipelineRunView run={run} onRefetch={setRun} onError={setRunError} />
        )}

        {!runLoading && !run && !processing && !runError && (
          <p className="empty-state">
            No pipeline run for this mention yet. Press “Run full pipeline” to collect, analyze, retrieve and generate a draft.
          </p>
        )}

        {processing && <Loading label="Running the four agents..." />}
      </section>

      {/* Screen 39 Requirement: Human Review Draft Response Controls directly on Post Details */}
      {run?.insight && (
        <section className="posts-section card review-workspace" data-tour="human-approval-actions">
          <div className="review-workspace__head">
            <div>
              <span className="eyebrow">Human-in-the-Loop Review (Screen #39)</span>
              <h2>AI Insight & Draft Response</h2>
            </div>
            <span className={`badge badge--${run.insight.review?.status || 'pending'}`}>
              {run.insight.review?.status || 'pending'}
            </span>
          </div>

          <div className="card-sub-block">
            <strong>AI Summary:</strong>
            <p>{run.insight.summary}</p>
          </div>

          <div className="form__group">
            <label className="form__label">Generated Response Draft</label>
            <textarea
              className="form__input form__textarea"
              rows={4}
              value={run.insight.review?.editedDraft || run.insight.draftResponse}
              readOnly
            />
          </div>

          <div className="post-card__actions">
            <Link className="btn btn--primary" to={getInsightDetailPath(run.insight._id)}>
              Open Full Review Workspace →
            </Link>
          </div>
        </section>
      )}

      {editing && (
        <form className="form form--wide" onSubmit={handleSave}>
          <h2 className="form__title">Edit post</h2>

          <label className="form__label" htmlFor="platform">
            Platform
          </label>
          <select
            id="platform"
            className="form__input"
            name="platform"
            value={form.platform}
            onChange={handleChange}
          >
            {PLATFORMS.map((platform) => (
              <option key={platform} value={platform}>
                {platform.charAt(0).toUpperCase() + platform.slice(1)}
              </option>
            ))}
          </select>

          <label className="form__label" htmlFor="author">
            Author
          </label>
          <input
            id="author"
            className="form__input"
            type="text"
            name="author"
            value={form.author}
            onChange={handleChange}
            maxLength={100}
            required
          />

          <label className="form__label" htmlFor="content">
            Content
          </label>
          <textarea
            id="content"
            className="form__input form__textarea"
            name="content"
            value={form.content}
            onChange={handleChange}
            maxLength={MAX_CONTENT_LENGTH}
            rows={4}
            required
          />

          <div className="form__row">
            <div>
              <label className="form__label" htmlFor="externalId">
                External ID
              </label>
              <input
                id="externalId"
                className="form__input"
                type="text"
                name="externalId"
                value={form.externalId}
                onChange={handleChange}
                maxLength={200}
              />
            </div>
            <div>
              <label className="form__label" htmlFor="publishedAt">
                Published date
              </label>
              <input
                id="publishedAt"
                className="form__input"
                type="date"
                name="publishedAt"
                value={form.publishedAt}
                onChange={handleChange}
              />
            </div>
          </div>

          <fieldset className="form__group">
            <legend className="form__label">Engagement</legend>
            <div className="form__row">
              {['likes', 'shares', 'comments'].map((field) => (
                <div key={field}>
                  <label className="form__label" htmlFor={field}>
                    {field.charAt(0).toUpperCase() + field.slice(1)}
                  </label>
                  <input
                    id={field}
                    className="form__input"
                    type="number"
                    name={field}
                    value={form[field]}
                    onChange={handleChange}
                    min={0}
                    step={1}
                  />
                </div>
              ))}
            </div>
          </fieldset>

          {formError && <ErrorMessage message={formError} />}

          <div className="form__actions">
            <button className="form__submit" type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save changes'}
            </button>
            <button
              type="button"
              className="form__cancel"
              onClick={() => setEditing(false)}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </PageContainer>
  )
}

export default PostDetailPage
