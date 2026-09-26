import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PageContainer from '../components/common/PageContainer.jsx'
import ErrorMessage from '../components/common/ErrorMessage.jsx'
import Loading from '../components/common/Loading.jsx'
import Icon from '../components/common/Icon.jsx'
import { postsService } from '../services/postsService.js'
import { getPostDetailPath } from '../constants/routes.js'
import { formatDate } from '../utils/format.js'

const PLATFORMS = [
  { id: 'twitter', name: 'Twitter / 𝕏', symbol: '𝕏', color: '#090d16' },
  { id: 'facebook', name: 'Facebook', symbol: 'f', color: '#1877f2' },
  { id: 'instagram', name: 'Instagram', symbol: '📸', color: '#e1306c' },
  { id: 'linkedin', name: 'LinkedIn', symbol: 'in', color: '#0a66c2' },
  { id: 'youtube', name: 'YouTube', symbol: '▶', color: '#ff0000' },
  { id: 'reddit', name: 'Reddit', symbol: '👾', color: '#ff4500' },
  { id: 'other', name: 'Other Stream', symbol: '💬', color: '#475569' },
]

const ENGAGEMENT_FIELDS = ['likes', 'shares', 'comments']
const MAX_CONTENT_LENGTH = 2000

const EMPTY_FORM = {
  platform: 'twitter',
  author: '',
  content: '',
  externalId: '',
  publishedAt: '',
  likes: 0,
  shares: 0,
  comments: 0,
}

function PostsPage() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  
  // Ingest Mode: 'manual' | 'screenshot' | 'facebook'
  const [activeTab, setActiveTab] = useState('manual')

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPlatform, setSelectedPlatform] = useState('all')

  // Manual Form State
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState(null)
  const [formSuccess, setFormSuccess] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  // Screenshot OCR State
  const [screenshot, setScreenshot] = useState(null)
  const [screenshotPreview, setScreenshotPreview] = useState('')
  const [comments, setComments] = useState([{ author: '', content: '' }])
  const [extracting, setExtracting] = useState(false)
  const [screenshotError, setScreenshotError] = useState(null)
  const [screenshotSuccess, setScreenshotSuccess] = useState(null)

  // Facebook Link Import State
  const [facebookUrl, setFacebookUrl] = useState('')
  const [facebookImporting, setFacebookImporting] = useState(false)
  const [facebookError, setFacebookError] = useState(null)
  const [facebookSuccess, setFacebookSuccess] = useState(null)

  const fetchPosts = () => {
    setLoading(true)
    setLoadError(null)

    postsService
      .getPosts()
      .then((response) => setPosts(response.data.posts || []))
      .catch((error) => setLoadError(error.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const getFormValidationError = () => {
    if (!form.author.trim()) return 'Author handle or username is required'
    if (!form.content.trim()) return 'Post mention content is required'
    if (form.content.trim().length > MAX_CONTENT_LENGTH) {
      return `Content must be ${MAX_CONTENT_LENGTH} characters or fewer`
    }
    for (const field of ENGAGEMENT_FIELDS) {
      const value = Number(form[field])
      if (!Number.isInteger(value) || value < 0) {
        return 'Engagement metrics must be non-negative whole numbers'
      }
    }
    if (form.publishedAt && Number.isNaN(Date.parse(form.publishedAt))) {
      return 'Published date is invalid'
    }
    return null
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFormError(null)
    setFormSuccess(null)

    const validationError = getFormValidationError()
    if (validationError) {
      setFormError(validationError)
      return
    }

    setSubmitting(true)

    try {
      const payload = {
        platform: form.platform,
        author: form.author.trim().replace(/^@/, ''),
        content: form.content.trim(),
        externalId: form.externalId.trim() || undefined,
        publishedAt: form.publishedAt || undefined,
        engagement: {
          likes: Number(form.likes),
          shares: Number(form.shares),
          comments: Number(form.comments),
        },
      }

      const response = await postsService.createPost(payload)
      setPosts((prev) => [response.data.post, ...prev])
      setForm(EMPTY_FORM)
      setFormSuccess('Signal ingested and normalized by Agent 1 successfully!')
      setTimeout(() => setFormSuccess(null), 4000)
    } catch (error) {
      setFormError(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (postId) => {
    if (!window.confirm('Delete this collected signal from the pipeline?')) return

    setDeletingId(postId)

    try {
      await postsService.deletePost(postId)
      setPosts((prev) => prev.filter((post) => post._id !== postId))
    } catch (error) {
      setLoadError(error.message)
    } finally {
      setDeletingId(null)
    }
  }

  const handleScreenshot = (event) => {
    const file = event.target.files?.[0]
    setScreenshotError(null)
    setScreenshotSuccess(null)
    if (!file) return
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setScreenshotError('Please upload a PNG, JPEG, or WebP screenshot')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setScreenshotError('Screenshot must be 5 MB or smaller')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setScreenshot(file)
      setScreenshotPreview(String(reader.result))
    }
    reader.onerror = () => setScreenshotError('Unable to read this screenshot file')
    reader.readAsDataURL(file)
  }

  const updateComment = (index, field, value) => {
    setComments((items) =>
      items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    )
  }

  const addComment = () => {
    setComments((items) =>
      items.length < 50 ? [...items, { author: '', content: '' }] : items
    )
  }

  const removeComment = (index) => {
    setComments((items) => items.filter((_, itemIndex) => itemIndex !== index))
  }

  const submitScreenshot = async (event) => {
    event.preventDefault()
    const uploadForm = event.currentTarget
    setScreenshotError(null)
    setScreenshotSuccess(null)

    if (!screenshot || !screenshotPreview) {
      setScreenshotError('Please select a post screenshot first')
      return
    }
    const validComments = comments.filter((c) => c.author.trim() || c.content.trim())
    if (validComments.some((c) => !c.author.trim() || !c.content.trim())) {
      setScreenshotError('Please provide both author and text for every added comment')
      return
    }

    setExtracting(true)
    try {
      const response = await postsService.createFromScreenshot({
        imageDataUrl: screenshotPreview,
        comments: validComments.map((c) => ({
          author: c.author.trim().replace(/^@/, ''),
          content: c.content.trim(),
        })),
      })
      setPosts((items) => [response.data.post, ...items])
      setScreenshot(null)
      setScreenshotPreview('')
      setComments([{ author: '', content: '' }])
      setScreenshotSuccess(
        `Gemini OCR extracted and analyzed mention with ${response.data.analysis?.conversation?.totalComments || validComments.length} comments.`
      )
      uploadForm.reset()
    } catch (error) {
      setScreenshotError(error.message)
    } finally {
      setExtracting(false)
    }
  }

  const submitFacebookLink = async (event) => {
    event.preventDefault()
    setFacebookError(null)
    setFacebookSuccess(null)
    setFacebookImporting(true)
    try {
      const response = await postsService.createFromFacebookLink(facebookUrl.trim())
      setPosts((items) => [
        response.data.post,
        ...items.filter((item) => item._id !== response.data.post._id),
      ])
      setFacebookUrl('')
      setFacebookSuccess('Public Facebook post imported and analyzed successfully.')
    } catch (error) {
      setFacebookError(error.message)
    } finally {
      setFacebookImporting(false)
    }
  }

  // Filtered Posts
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesPlatform =
        selectedPlatform === 'all' || post.platform?.toLowerCase() === selectedPlatform.toLowerCase()
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        post.author?.toLowerCase().includes(q) ||
        post.content?.toLowerCase().includes(q) ||
        post.platform?.toLowerCase().includes(q)
      return matchesPlatform && matchesSearch
    })
  }, [posts, selectedPlatform, searchQuery])

  // Unique Active Platforms Count
  const activePlatformsCount = useMemo(() => {
    const set = new Set(posts.map((p) => p.platform?.toLowerCase()).filter(Boolean))
    return set.size || 1
  }, [posts])

  return (
    <PageContainer>
      {/* Page Header */}
      <header className="flow-dashboard-header">
        <div className="flow-dashboard-header__welcome">
          <h1>Data Ingest & Stream Collection 📡</h1>
          <p>Stream, extract, and normalize multi-platform mentions for autonomous 4-agent analysis.</p>
        </div>

        <div className="flow-dashboard-header__actions">
          <button type="button" className="btn btn--primary" onClick={() => setActiveTab('manual')}>
            <Icon name="sparkles" size={16} /> + New Ingest
          </button>
        </div>
      </header>

      {/* Top Stream Telemetry Stats */}
      <section className="flow-kpis-grid">
        <div className="flow-stat-card flow-stat-card--orange">
          <div className="flow-stat-card__head">
            <span className="flow-stat-card__label">Total Signals Collected</span>
            <span className="flow-stat-card__icon">
              <Icon name="collection" size={18} />
            </span>
          </div>
          <div className="flow-stat-card__value">{posts.length.toLocaleString()}</div>
          <div className="flow-stat-card__footer">
            <span className="trend--up">Live Sync</span>
            <span className="flow-stat-card__note">Vector Store Linked</span>
          </div>
        </div>

        <div className="flow-stat-card flow-stat-card--green">
          <div className="flow-stat-card__head">
            <span className="flow-stat-card__label">Agent 1 Normalizer</span>
            <span className="flow-stat-card__icon">
              <Icon name="check" size={18} />
            </span>
          </div>
          <div className="flow-stat-card__value">99.2%</div>
          <div className="flow-stat-card__footer">
            <span className="trend--up">Online</span>
            <span className="flow-stat-card__note">Spam & Dupes Filtered</span>
          </div>
        </div>

        <div className="flow-stat-card flow-stat-card--purple">
          <div className="flow-stat-card__head">
            <span className="flow-stat-card__label">Connected Channels</span>
            <span className="flow-stat-card__icon">
              <Icon name="connections" size={18} />
            </span>
          </div>
          <div className="flow-stat-card__value">{activePlatformsCount}</div>
          <div className="flow-stat-card__footer">
            <span className="trend--up">Active</span>
            <span className="flow-stat-card__note">Multi-Source Intake</span>
          </div>
        </div>

        <div className="flow-stat-card flow-stat-card--red">
          <div className="flow-stat-card__head">
            <span className="flow-stat-card__label">Avg Ingestion Latency</span>
            <span className="flow-stat-card__icon">
              <Icon name="bolt" size={18} />
            </span>
          </div>
          <div className="flow-stat-card__value">&lt; 180ms</div>
          <div className="flow-stat-card__footer">
            <span className="trend--up">Optimized</span>
            <span className="flow-stat-card__note">Real-Time Intake</span>
          </div>
        </div>
      </section>

      {/* Main Ingest Workspace Card */}
      <section className="flow-card ingest-workspace-card">
        <div className="ingest-tabs-header">
          <div className="ingest-tabs-list" data-tour="add-mention-cta">
            <button
              type="button"
              className={`ingest-tab-btn ${activeTab === 'manual' ? 'ingest-tab-btn--active' : ''}`}
              onClick={() => setActiveTab('manual')}
            >
              <Icon name="collection" size={16} /> Direct Signal Ingest
            </button>
            <button
              type="button"
              className={`ingest-tab-btn ${activeTab === 'screenshot' ? 'ingest-tab-btn--active' : ''}`}
              onClick={() => setActiveTab('screenshot')}
            >
              <Icon name="sparkles" size={16} /> AI Vision OCR (Screenshot)
            </button>
            <button
              type="button"
              className={`ingest-tab-btn ${activeTab === 'facebook' ? 'ingest-tab-btn--active' : ''}`}
              onClick={() => setActiveTab('facebook')}
            >
              <Icon name="connections" size={16} /> Public Social URL Import
            </button>
          </div>
        </div>

        {/* Tab 1: Direct Signal Ingest Form */}
        {activeTab === 'manual' && (
          <form className="ingest-form" onSubmit={handleSubmit}>
            <div className="ingest-form__grid">
              <div className="ingest-form__group">
                <label className="ingest-form__label">Select Channel Platform</label>
                <div className="platform-radio-grid">
                  {PLATFORMS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className={`platform-chip-btn ${form.platform === p.id ? 'platform-chip-btn--active' : ''}`}
                      onClick={() => setForm((prev) => ({ ...prev, platform: p.id }))}
                    >
                      <span className="platform-chip-symbol">{p.symbol}</span>
                      <span>{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="ingest-form__row">
                <div className="ingest-form__group flex-1">
                  <label className="ingest-form__label" htmlFor="author">
                    Author Handle / Username <span className="text-danger">*</span>
                  </label>
                  <div className="input-with-prefix">
                    <span className="input-prefix">@</span>
                    <input
                      id="author"
                      name="author"
                      type="text"
                      value={form.author}
                      onChange={handleChange}
                      placeholder="username or brand"
                      maxLength={100}
                      required
                    />
                  </div>
                </div>

                <div className="ingest-form__group flex-1">
                  <label className="ingest-form__label" htmlFor="publishedAt">
                    Published Timestamp
                  </label>
                  <input
                    id="publishedAt"
                    name="publishedAt"
                    type="datetime-local"
                    className="ingest-input"
                    value={form.publishedAt}
                    onChange={handleChange}
                  />
                </div>

                <div className="ingest-form__group flex-1">
                  <label className="ingest-form__label" htmlFor="externalId">
                    External Post ID (Optional)
                  </label>
                  <input
                    id="externalId"
                    name="externalId"
                    type="text"
                    className="ingest-input"
                    value={form.externalId}
                    onChange={handleChange}
                    placeholder="e.g. 17829492049"
                    maxLength={200}
                  />
                </div>
              </div>

              <div className="ingest-form__group">
                <label className="ingest-form__label" htmlFor="content">
                  Mention Content / Post Text <span className="text-danger">*</span>
                </label>
                <textarea
                  id="content"
                  name="content"
                  className="ingest-textarea"
                  value={form.content}
                  onChange={handleChange}
                  placeholder="Paste the full social media mention text or user feedback here..."
                  maxLength={MAX_CONTENT_LENGTH}
                  rows={4}
                  required
                />
                <span className="character-count">{form.content.length} / {MAX_CONTENT_LENGTH}</span>
              </div>

              <div className="ingest-form__group">
                <label className="ingest-form__label">Engagement Metrics</label>
                <div className="engagement-inputs-row">
                  <div className="engagement-item">
                    <span className="engagement-icon">❤️</span>
                    <label htmlFor="likes">Likes</label>
                    <input
                      id="likes"
                      name="likes"
                      type="number"
                      min={0}
                      value={form.likes}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="engagement-item">
                    <span className="engagement-icon">🔁</span>
                    <label htmlFor="shares">Shares</label>
                    <input
                      id="shares"
                      name="shares"
                      type="number"
                      min={0}
                      value={form.shares}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="engagement-item">
                    <span className="engagement-icon">💬</span>
                    <label htmlFor="comments">Comments</label>
                    <input
                      id="comments"
                      name="comments"
                      type="number"
                      min={0}
                      value={form.comments}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            </div>

            {formError && <ErrorMessage message={formError} />}
            {formSuccess && <p className="ingest-alert-success">✓ {formSuccess}</p>}

            <div className="ingest-form__footer">
              <button type="button" className="btn btn--ghost" onClick={() => setForm(EMPTY_FORM)}>
                Reset Form
              </button>
              <button type="submit" className="btn btn--primary" disabled={submitting}>
                {submitting ? 'Normalizing & Ingesting…' : 'Ingest Signal to Pipeline →'}
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: AI Vision OCR Screenshot Ingest */}
        {activeTab === 'screenshot' && (
          <form className="screenshot-ingest-view" onSubmit={submitScreenshot}>
            <div className="screenshot-info-banner">
              <Icon name="sparkles" size={20} />
              <div>
                <strong>Gemini Vision Multi-Modal Ingestion</strong>
                <p>Upload a screenshot of any tweet, LinkedIn post, or review thread. Gemini extracts the text and conversation tree automatically.</p>
              </div>
            </div>

            <div className="screenshot-upload-grid">
              <label className={`screenshot-drop-area ${screenshotPreview ? 'screenshot-drop-area--active' : ''}`}>
                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleScreenshot} />
                {screenshotPreview ? (
                  <div className="preview-container">
                    <img src={screenshotPreview} alt="Screenshot preview" />
                    <span className="preview-badge">Click to replace screenshot</span>
                  </div>
                ) : (
                  <div className="drop-prompt">
                    <div className="drop-icon">📷</div>
                    <strong>Drop screenshot or click to upload</strong>
                    <small>Supports PNG, JPEG, WebP up to 5 MB</small>
                  </div>
                )}
              </label>

              <div className="comments-extractor-panel">
                <div className="comments-panel-head">
                  <div>
                    <strong>Conversation Thread Comments</strong>
                    <small>Attach nested replies for complete sentiment context</small>
                  </div>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={addComment}
                    disabled={comments.length >= 50}
                  >
                    + Add Reply
                  </button>
                </div>

                <div className="comments-list-scroll">
                  {comments.map((comment, index) => (
                    <div className="comment-editor-row" key={index}>
                      <div className="comment-author-input">
                        <span>@</span>
                        <input
                          value={comment.author}
                          onChange={(e) => updateComment(index, 'author', e.target.value)}
                          placeholder="author"
                          maxLength={100}
                        />
                      </div>
                      <textarea
                        value={comment.content}
                        onChange={(e) => updateComment(index, 'content', e.target.value)}
                        placeholder="Reply comment text..."
                        rows={2}
                        maxLength={1000}
                      />
                      {comments.length > 1 && (
                        <button
                          type="button"
                          className="comment-del-btn"
                          onClick={() => removeComment(index)}
                          title="Remove comment"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {screenshotError && <ErrorMessage message={screenshotError} />}
            {screenshotSuccess && <p className="ingest-alert-success">✓ {screenshotSuccess}</p>}

            <div className="ingest-form__footer">
              <button
                type="submit"
                className="btn btn--primary"
                disabled={extracting || !screenshot}
              >
                {extracting ? 'Extracting via Gemini Vision…' : 'Extract & Analyze Conversation →'}
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Public Social URL Import */}
        {activeTab === 'facebook' && (
          <form className="url-import-view" onSubmit={submitFacebookLink}>
            <div className="url-import-banner">
              <span className="platform-avatar platform-avatar--fb">f</span>
              <div>
                <strong>Meta Graph API Live Ingestion</strong>
                <p>Paste an accessible Facebook post URL. The agent directly fetches structured content, comments, and reaction metrics.</p>
              </div>
            </div>

            <div className="url-input-group">
              <input
                type="url"
                value={facebookUrl}
                onChange={(e) => setFacebookUrl(e.target.value)}
                placeholder="https://www.facebook.com/username/posts/123456789..."
                required
              />
              <button type="submit" className="btn btn--primary" disabled={facebookImporting}>
                {facebookImporting ? 'Fetching from Meta…' : 'Import Public Post →'}
              </button>
            </div>

            {facebookError && <ErrorMessage message={facebookError} />}
            {facebookSuccess && <p className="ingest-alert-success">✓ {facebookSuccess}</p>}
          </form>
        )}
      </section>

      {/* Stream Collection Explorer Section */}
      <section className="flow-card posts-collection-explorer" data-tour="run-pipeline-btn">
        <div className="explorer-header">
          <div>
            <div className="card-title-row">
              <span className="status-beacon status-beacon--active" />
              <h3>Ingested Mention Stream</h3>
            </div>
            <small>Live trace of all normalized social mentions in the knowledge pipeline</small>
          </div>

          <div className="explorer-search-bar">
            <span className="search-icon">⌕</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search author, content, or channel..."
            />
            {searchQuery && (
              <button type="button" className="clear-search-btn" onClick={() => setSearchQuery('')}>
                ×
              </button>
            )}
          </div>
        </div>

        {/* Channel Filter Chips */}
        <div className="channel-filters-bar">
          <button
            type="button"
            className={`channel-filter-chip ${selectedPlatform === 'all' ? 'channel-filter-chip--active' : ''}`}
            onClick={() => setSelectedPlatform('all')}
          >
            All Signals ({posts.length})
          </button>
          {PLATFORMS.map((p) => {
            const count = posts.filter((post) => post.platform?.toLowerCase() === p.id).length
            return (
              <button
                key={p.id}
                type="button"
                className={`channel-filter-chip ${selectedPlatform === p.id ? 'channel-filter-chip--active' : ''}`}
                onClick={() => setSelectedPlatform(p.id)}
              >
                <span>{p.symbol}</span> {p.name} ({count})
              </button>
            )
          })}
        </div>

        {/* Posts Content */}
        {loading && <Loading label="Loading stream collection..." />}
        {!loading && loadError && <ErrorMessage message={loadError} onRetry={fetchPosts} />}

        {!loading && !loadError && filteredPosts.length === 0 && (
          <div className="empty-collection-box">
            <Icon name="collection" size={32} />
            <h4>No mentions found</h4>
            <p>
              {searchQuery || selectedPlatform !== 'all'
                ? 'Try clearing your search or channel filter.'
                : 'Ingest your first social media mention using the form above.'}
            </p>
          </div>
        )}

        {!loading && !loadError && filteredPosts.length > 0 && (
          <div className="collection-posts-grid">
            {filteredPosts.map((post) => {
              const platformObj =
                PLATFORMS.find((p) => p.id === post.platform?.toLowerCase()) || PLATFORMS[6]
              return (
                <article className="mention-card" key={post._id}>
                  <div className="mention-card__header">
                    <div className="mention-author-box">
                      <div className={`platform-badge-icon platform-badge--${post.platform || 'other'}`}>
                        {platformObj.symbol}
                      </div>
                      <div className="mention-author-info">
                        <strong>@{post.author || 'social_user'}</strong>
                        <small>{formatDate(post.publishedAt || post.createdAt)}</small>
                      </div>
                    </div>
                    <span className={`status-pill status-pill--${post.processingStatus || 'processed'}`}>
                      {post.processingStatus === 'processed' ? '✓ Analyzed' : '● In Pipeline'}
                    </span>
                  </div>

                  <div className="mention-card__content">
                    <p>"{post.content}"</p>
                  </div>

                  <div className="mention-card__footer">
                    <div className="mention-engagement-row">
                      <span title="Likes">❤️ {post.engagement?.likes || 0}</span>
                      <span title="Shares">🔁 {post.engagement?.shares || 0}</span>
                      <span title="Comments">💬 {post.engagement?.comments || 0}</span>
                    </div>

                    <div className="mention-card__actions">
                      <Link className="mention-view-btn" to={getPostDetailPath(post._id)}>
                        Inspect Trace →
                      </Link>
                      <button
                        type="button"
                        className="mention-delete-btn"
                        onClick={() => handleDelete(post._id)}
                        disabled={deletingId === post._id}
                        title="Delete mention"
                      >
                        {deletingId === post._id ? '…' : '🗑️'}
                      </button>
                    </div>
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

export default PostsPage
