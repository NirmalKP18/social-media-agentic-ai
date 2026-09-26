import { useCallback, useEffect, useState } from 'react'
import PageContainer from '../components/common/PageContainer.jsx'
import ErrorMessage from '../components/common/ErrorMessage.jsx'
import Loading from '../components/common/Loading.jsx'
import { knowledgeService } from '../services/knowledgeService.js'
import { useAuth } from '../context/AuthContext.jsx'
import { formatDate } from '../utils/format.js'

const EMPTY_FORM = { title: '', source: '', tags: '', text: '' }

function KnowledgeBasePage() {
  const { user } = useAuth()

  const [documents, setDocuments] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [reindexing, setReindexing] = useState(false)

  const [uploadFile, setUploadFile] = useState(null)
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadSaving, setUploadSaving] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [uploadNotice, setUploadNotice] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const [docsResponse, statsResponse] = await Promise.all([
        knowledgeService.getDocuments(),
        knowledgeService.getStats(),
      ])
      setDocuments(docsResponse.data.documents)
      setStats(statsResponse.data.stats)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user?.role === 'admin') load()
  }, [load, user])

  const refreshStats = async () => {
    try {
      const statsResponse = await knowledgeService.getStats()
      setStats(statsResponse.data.stats)
    } catch {
      /* stats are non-critical */
    }
  }

  const handleChange = (event) => setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }))

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFormError(null)
    setNotice(null)

    if (!form.title.trim() || !form.text.trim()) {
      setFormError('A title and document text are required.')
      return
    }

    const tags = form.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
    setSaving(true)

    try {
      const response = await knowledgeService.createDocument({
        title: form.title,
        source: form.source,
        tags,
        text: form.text,
      })
      setDocuments((prev) => [response.data.document, ...prev])
      setForm(EMPTY_FORM)
      setNotice('Document added and indexed into the knowledge base.')
      await refreshStats()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (documentId) => {
    if (!window.confirm('Remove this document from the knowledge base?')) return

    setDeletingId(documentId)
    setError(null)
    setNotice(null)

    try {
      await knowledgeService.deleteDocument(documentId)
      setDocuments((prev) => prev.filter((document) => document._id !== documentId))
      await refreshStats()
    } catch (err) {
      setError(err.message)
    } finally {
      setDeletingId(null)
    }
  }

  const handleReindex = async () => {
    setReindexing(true)
    setError(null)
    setNotice(null)

    try {
      const response = await knowledgeService.reindex()
      setStats((prev) => ({ ...prev, ...response.data.stats }))
      setNotice('Knowledge base index rebuilt.')
    } catch (err) {
      setError(err.message)
    } finally {
      setReindexing(false)
    }
  }

  const handleUpload = async (event) => {
    event.preventDefault()
    setUploadError(null)
    setUploadNotice(null)

    if (!uploadFile) {
      setUploadError('Choose a .txt, .md or .json file to upload.')
      return
    }

    setUploadSaving(true)

    try {
      const formData = new FormData()
      formData.append('file', uploadFile)
      if (uploadTitle.trim()) formData.append('title', uploadTitle.trim())
      const response = await knowledgeService.uploadDocument(formData)
      setDocuments((prev) => [response.data.document, ...prev])
      setUploadFile(null)
      setUploadTitle('')
      setUploadNotice(`"${response.data.document.title}" uploaded and indexed.`)
      await refreshStats()
    } catch (err) {
      setUploadError(err.message)
    } finally {
      setUploadSaving(false)
    }
  }

  return (
    <PageContainer
      title="Knowledge Base"
      subtitle="Admin-managed documents that ground agent evidence and generated drafts"
    >
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-card__value">{stats.documents}</span>
            <span className="stat-card__label">Documents</span>
          </div>
          <div className="stat-card">
            <span className="stat-card__value">{stats.chunks}</span>
            <span className="stat-card__label">Indexed chunks</span>
          </div>
          <div className="stat-card">
            <span className="stat-card__value">{stats.embeddingsLoaded ? 'ready' : stats.embeddingsInstalled ? 'idle' : 'off'}</span>
            <span className="stat-card__label">Embeddings</span>
          </div>
          <div className="stat-card">
            <span className="stat-card__value">{stats.embeddingModel?.split('/').pop() || '—'}</span>
            <span className="stat-card__label">Embedding model</span>
          </div>
        </div>
      )}

      <form className="form form--wide" onSubmit={handleSubmit}>
        <h2 className="form__title">Add a knowledge document</h2>

        <label className="form__label" htmlFor="kb-title">Title</label>
        <input
          id="kb-title"
          name="title"
          className="form__input"
          maxLength={200}
          value={form.title}
          onChange={handleChange}
          placeholder="Refund and returns policy"
        />

        <div className="form__row">
          <div>
            <label className="form__label" htmlFor="kb-source">Source URL</label>
            <input
              id="kb-source"
              name="source"
              className="form__input"
              maxLength={500}
              value={form.source}
              onChange={handleChange}
              placeholder="https://example.com/policies/refunds"
            />
          </div>
          <div>
            <label className="form__label" htmlFor="kb-tags">Tags (comma separated)</label>
            <input
              id="kb-tags"
              name="tags"
              className="form__input"
              value={form.tags}
              onChange={handleChange}
              placeholder="policy, refunds"
            />
          </div>
        </div>

        <label className="form__label" htmlFor="kb-text">Document text</label>
        <textarea
          id="kb-text"
          name="text"
          className="form__input form__textarea"
          rows="6"
          maxLength={20000}
          value={form.text}
          onChange={handleChange}
          placeholder="Paste the authoritative text the agents should ground their answers on."
        />

        {formError && <ErrorMessage message={formError} />}
        {notice && <p className="empty-state" role="status">{notice}</p>}

        <button className="form__submit" type="submit" disabled={saving}>
          {saving ? 'Indexing...' : 'Add and index document'}
        </button>
      </form>

      <form className="form form--wide" onSubmit={handleUpload}>
        <h2 className="form__title">Upload a document file</h2>
        <p className="analysis-date">Supported formats: .txt, .md and .json, up to 10 MB.</p>

        <label className={`kb-dropzone${uploadFile ? ' kb-dropzone--ready' : ''}`}>
          <input
            type="file"
            accept=".txt,.md,.json"
            aria-label="Upload a document file"
            onChange={(event) => setUploadFile(event.target.files?.[0] || null)}
          />
          <span className="kb-dropzone__icon">↑</span>
          <strong>{uploadFile ? uploadFile.name : 'Choose a file or drop it here'}</strong>
          <small>JSON may use {'{'}title, text{'}'}, {'{'}content{'}'} or a list of strings</small>
        </label>

        <label className="form__label" htmlFor="kb-upload-title">Optional title</label>
        <input
          id="kb-upload-title"
          className="form__input"
          maxLength={200}
          value={uploadTitle}
          onChange={(event) => setUploadTitle(event.target.value)}
          placeholder="Defaults to the file name"
        />

        {uploadError && <ErrorMessage message={uploadError} />}
        {uploadNotice && <p className="empty-state" role="status">{uploadNotice}</p>}

        <button className="form__submit" type="submit" disabled={uploadSaving}>
          {uploadSaving ? 'Uploading and indexing...' : 'Upload and index'}
        </button>
      </form>

      <section className="posts-section">
        <div className="posts-section__head">
          <h2 className="posts-section__title">Indexed documents</h2>
          <button type="button" className="btn btn--ghost" onClick={handleReindex} disabled={reindexing}>
            {reindexing ? 'Rebuilding...' : 'Rebuild index'}
          </button>
        </div>

        {loading && <Loading label="Loading knowledge base..." />}
        {!loading && error && <ErrorMessage message={error} onRetry={load} />}

        {!loading && !error && documents.length === 0 && (
          <p className="empty-state">No knowledge documents yet. Add one above to ground the agents.</p>
        )}

        {!loading && !error && documents.length > 0 && (
          <div className="posts-list">
            {documents.map((document) => (
              <article className="card post-card" key={document._id}>
                <div className="post-card__head">
                  <span className="badge">knowledge</span>
                  <span className="post-card__author">{document.title}</span>
                  <span className="post-card__date">{formatDate(document.createdAt)}</span>
                </div>
                <p className="post-card__content">{document.text}</p>
                <div className="post-card__meta">
                  <span>{document.chunks} chunk(s)</span>
                  {document.source && (
                    <a href={document.source} target="_blank" rel="noreferrer">Source</a>
                  )}
                  {document.tags?.map((tag) => (
                    <span className="chip" key={tag}>{tag}</span>
                  ))}
                </div>
                <div className="post-card__actions">
                  <button
                    type="button"
                    className="btn btn--danger"
                    onClick={() => handleDelete(document._id)}
                    disabled={deletingId === document._id}
                  >
                    {deletingId === document._id ? 'Removing...' : 'Remove'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </PageContainer>
  )
}

export default KnowledgeBasePage
