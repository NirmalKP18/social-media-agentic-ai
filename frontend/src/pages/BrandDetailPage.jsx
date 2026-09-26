import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import PageContainer from '../components/common/PageContainer.jsx'
import ErrorMessage from '../components/common/ErrorMessage.jsx'
import Loading from '../components/common/Loading.jsx'
import Icon from '../components/common/Icon.jsx'
import UpgradeModal from '../components/common/UpgradeModal.jsx'
import { brandsService } from '../services/brandsService.js'
import { useAuth } from '../context/AuthContext.jsx'
import { ROUTES, getPostDetailPath } from '../constants/routes.js'
import { formatDate } from '../utils/format.js'

function BrandDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, refreshUser } = useAuth()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [running, setRunning] = useState(false)
  const [notice, setNotice] = useState(null)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  const fetchBrandData = () => {
    setLoading(true)
    setError(null)
    brandsService
      .getBrandById(id)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchBrandData()
  }, [id])

  const handleRunPipeline = async () => {
    setRunning(true)
    setNotice(null)

    try {
      const res = await brandsService.runBrandPipeline(id)
      setNotice({
        type: 'success',
        message: res.data.message || 'Pipeline completed successfully for this brand profile!',
      })
      await refreshUser?.()
      fetchBrandData()
    } catch (err) {
      if (err.response?.status === 403 && (err.response?.data?.message?.includes('pipeline limit') || err.response?.data?.error === 'USAGE_LIMIT_REACHED')) {
        setShowUpgradeModal(true)
      } else {
        setNotice({
          type: 'error',
          message: err.response?.data?.message || err.message,
        })
      }
    } finally {
      setRunning(false)
    }
  }

  if (loading) {
    return (
      <PageContainer title="Brand Overview">
        <Loading label="Loading brand analytics..." />
      </PageContainer>
    )
  }

  if (error || !data?.brand) {
    return (
      <PageContainer title="Brand Overview">
        <ErrorMessage message={error || 'Brand profile not found'} onRetry={fetchBrandData} />
        <Link to={ROUTES.brands} className="btn btn--outline" style={{ marginTop: '16px' }}>
          ← Back to All Brands
        </Link>
      </PageContainer>
    )
  }

  const { brand, recentPosts = [], recentRuns = [] } = data
  const stats = brand.stats || {}

  return (
    <PageContainer
      title={`Brand Intelligence: ${brand.name}`}
      subtitle={`Tracked as ${brand.type?.toUpperCase()} · Primary Keyword: "${brand.primaryKeyword}"`}
    >
      {/* Top Banner Navigation & Actions */}
      <div className="brand-detail-head">
        <Link to={ROUTES.brands} className="back-link">
          ← Back to All Brands
        </Link>

        <div className="brand-detail-actions">
          <button
            type="button"
            className="btn btn--primary"
            onClick={handleRunPipeline}
            disabled={running || brand.status === 'paused'}
          >
            {running ? '⚡ Running 4-Agent Pipeline...' : '⚡ Run Brand Monitoring Pipeline'}
          </button>
        </div>
      </div>

      {notice && (
        <div className={`notification-banner notification-banner--${notice.type}`} style={{ marginBottom: '20px' }}>
          <span>{notice.message}</span>
          <button type="button" className="banner-close" onClick={() => setNotice(null)}>✕</button>
        </div>
      )}

      {/* KPI Overview Cards */}
      <div className="nlp-kpi-grid">
        <div className="nlp-kpi-card">
          <div className="nlp-kpi-card__head">
            <span className="nlp-kpi-card__title">Total Mentions</span>
            <div className="nlp-kpi-icon-wrap nlp-kpi-icon-wrap--blue">
              <Icon name="collection" size={18} />
            </div>
          </div>
          <div className="nlp-kpi-card__value">{stats.totalMentions || recentPosts.length}</div>
          <div className="nlp-kpi-card__sub">Across configured social channels</div>
        </div>

        <div className="nlp-kpi-card">
          <div className="nlp-kpi-card__head">
            <span className="nlp-kpi-card__title">Average Sentiment</span>
            <div className="nlp-kpi-icon-wrap nlp-kpi-icon-wrap--green">
              <Icon name="analyses" size={18} />
            </div>
          </div>
          <div className={`nlp-kpi-card__value ${stats.averageSentiment >= 0 ? 'text-pos' : 'text-neg'}`}>
            {stats.averageSentiment !== undefined ? (stats.averageSentiment > 0 ? `+${stats.averageSentiment}` : stats.averageSentiment) : '0.00'}
          </div>
          <div className="nlp-kpi-card__sub">
            {stats.positiveMentions || 0} pos · {stats.neutralMentions || 0} neu · {stats.negativeMentions || 0} neg
          </div>
        </div>

        <div className="nlp-kpi-card">
          <div className="nlp-kpi-card__head">
            <span className="nlp-kpi-card__title">Total Engagement</span>
            <div className="nlp-kpi-icon-wrap nlp-kpi-icon-wrap--purple">
              <Icon name="heart" size={18} />
            </div>
          </div>
          <div className="nlp-kpi-card__value">{stats.totalEngagement || 0}</div>
          <div className="nlp-kpi-card__sub">Likes, retweets & comments</div>
        </div>

        <div className="nlp-kpi-card">
          <div className="nlp-kpi-card__head">
            <span className="nlp-kpi-card__title">Pipeline Runs</span>
            <div className="nlp-kpi-icon-wrap nlp-kpi-icon-wrap--blue">
              <Icon name="dashboard" size={18} />
            </div>
          </div>
          <div className="nlp-kpi-card__value">{stats.pipelineRunsCount || recentRuns.length}</div>
          <div className="nlp-kpi-card__sub">
            {brand.lastAnalyzedAt ? `Last run: ${formatDate(brand.lastAnalyzedAt)}` : 'Not run yet'}
          </div>
        </div>
      </div>

      {/* Brand Configuration Card */}
      <div className="card brand-info-card" style={{ marginBottom: '24px' }}>
        <h3>Monitoring Configuration</h3>
        <div className="brand-meta-grid">
          <div className="meta-item">
            <span className="meta-label">Primary Keyword:</span>
            <strong>{brand.primaryKeyword}</strong>
          </div>
          <div className="meta-item">
            <span className="meta-label">Aliases & Hashtags:</span>
            <span>{(brand.alternativeKeywords || []).join(', ') || 'None'}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Monitored Platforms:</span>
            <div className="chips">
              {(brand.platforms || []).map((p) => (
                <span key={p} className="chip chip--entity">{p.toUpperCase()}</span>
              ))}
            </div>
          </div>
          <div className="meta-item">
            <span className="meta-label">Monitoring Status:</span>
            <span className={`status-pill status-pill--${brand.status}`}>
              {brand.status.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Recent Monitored Mentions */}
      <div className="card brand-mentions-card" style={{ marginBottom: '24px' }}>
        <div className="card-head-row">
          <h3>Recent Mentions & Captions for {brand.name}</h3>
          <Link to={`/posts?brand=${encodeURIComponent(brand.name)}`} className="btn btn--outline btn--sm">
            View All in Mentions Explorer ➔
          </Link>
        </div>

        {recentPosts.length === 0 ? (
          <p className="empty-state">No mentions captured yet. Run a monitoring pipeline to start collecting live posts.</p>
        ) : (
          <div className="brand-mentions-list">
            {recentPosts.map((post) => (
              <article className="mention-item" key={post._id}>
                <div className="mention-item__head">
                  <span className="platform-tag">{post.platform?.toUpperCase() || 'POST'}</span>
                  <span className="author-tag">@{post.author || 'User'}</span>
                  <span className="date-tag">{formatDate(post.createdAt)}</span>
                </div>
                <p className="mention-item__content">{post.content}</p>
                <div className="mention-item__actions">
                  <Link to={getPostDetailPath(post._id)} className="btn btn--outline btn--sm">
                    Inspect Pipeline Trace
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Quota Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentUsage={user?.pipelineUsage}
        userPlan={user?.plan}
      />
    </PageContainer>
  )
}

export default BrandDetailPage
