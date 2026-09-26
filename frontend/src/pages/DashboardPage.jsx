import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PageContainer from '../components/common/PageContainer.jsx'
import Loading from '../components/common/Loading.jsx'
import ErrorMessage from '../components/common/ErrorMessage.jsx'
import GettingStartedChecklist from '../components/onboarding/GettingStartedChecklist.jsx'
import UpgradeModal from '../components/common/UpgradeModal.jsx'
import OnboardingWizardModal from '../components/onboarding/OnboardingWizardModal.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { dashboardService } from '../services/dashboardService.js'
import { workflowService } from '../services/workflowService.js'
import { brandsService } from '../services/brandsService.js'
import { ROUTES } from '../constants/routes.js'
import Icon from '../components/common/Icon.jsx'

function StatCard({ label, value, iconName, tone, trend, isPositive = true, note }) {
  return (
    <div className={`flow-stat-card flow-stat-card--${tone}`}>
      <div className="flow-stat-card__head">
        <span className="flow-stat-card__label">{label}</span>
        <span className="flow-stat-card__icon">
          <Icon name={iconName} size={18} />
        </span>
      </div>
      <div className="flow-stat-card__value">{typeof value === 'number' ? value.toLocaleString() : value}</div>
      <div className="flow-stat-card__footer">
        <span className={`flow-stat-card__trend ${isPositive ? 'trend--up' : 'trend--down'}`}>
          {isPositive ? '↑' : '↓'} {trend}
        </span>
        <span className="flow-stat-card__note">{note}</span>
      </div>
    </div>
  )
}

function SignalOverviewChart() {
  const [timeRange, setTimeRange] = useState('7D')
  return (
    <div className="flow-card flow-card--chart">
      <div className="flow-card__head">
        <div>
          <div className="card-title-row">
            <span className="live-indicator-dot" />
            <h3>Signal Volume Telemetry</h3>
          </div>
          <small>Real-time mention throughput across connected channels</small>
        </div>
        <div className="chart-range-pills">
          {['7D', '14D', '30D'].map((r) => (
            <button
              key={r}
              type="button"
              className={`range-pill ${timeRange === r ? 'range-pill--active' : ''}`}
              onClick={() => setTimeRange(r)}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="flow-chart-container">
        <svg viewBox="0 0 600 190" className="flow-area-chart">
          <defs>
            <linearGradient id="chartNeonGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f95738" stopOpacity="0.4" />
              <stop offset="60%" stopColor="#f95738" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#f95738" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="lineGlowGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#f95738" />
              <stop offset="50%" stopColor="#ff8a65" />
              <stop offset="100%" stopColor="#f95738" />
            </linearGradient>
          </defs>
          <line x1="0" y1="35" x2="600" y2="35" stroke="#f1f5f9" strokeDasharray="4 4" />
          <line x1="0" y1="85" x2="600" y2="85" stroke="#f1f5f9" strokeDasharray="4 4" />
          <line x1="0" y1="135" x2="600" y2="135" stroke="#f1f5f9" strokeDasharray="4 4" />

          <path
            d="M 0,135 Q 60,60 120,80 T 240,35 T 360,105 T 480,65 T 600,95 L 600,175 L 0,175 Z"
            fill="url(#chartNeonGradient)"
          />
          <path
            d="M 0,135 Q 60,60 120,80 T 240,35 T 360,105 T 480,65 T 600,95"
            fill="none"
            stroke="url(#lineGlowGradient)"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <circle cx="240" cy="35" r="7" fill="#f95738" stroke="#ffffff" strokeWidth="2.5" />
          <circle cx="240" cy="35" r="14" fill="none" stroke="#f95738" strokeWidth="1.5" opacity="0.4" />
        </svg>

        <div className="flow-chart-labels">
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span className="active-day">
            <i className="peak-dot" /> Fri (320 Peak)
          </span>
          <span>Sat</span>
          <span>Sun</span>
        </div>
      </div>
    </div>
  )
}

function SentimentDoughnutChart({ counts = {}, sentiment = {} }) {
  const total = counts.posts || 100
  const pos = sentiment.positive || Math.round(total * 0.65)
  const neu = sentiment.neutral || Math.round(total * 0.22)
  const neg = sentiment.negative || Math.round(total * 0.13)

  const posPct = Math.round((pos / total) * 100) || 65
  const neuPct = Math.round((neu / total) * 100) || 22
  const negPct = Math.round((neg / total) * 100) || 13

  return (
    <div className="flow-card flow-card--doughnut">
      <div className="flow-card__head">
        <div>
          <h3>Sentiment & Emotion Matrix</h3>
          <small>RoBERTa classified breakdown</small>
        </div>
        <span className="sentiment-health-badge">
          <Icon name="check" size={12} /> Positive Flow
        </span>
      </div>

      <div className="flow-doughnut-body">
        <div className="doughnut-chart-wrapper">
          <svg viewBox="0 0 160 160" className="doughnut-svg">
            <circle cx="80" cy="80" r="60" fill="none" stroke="#f1f5f9" strokeWidth="16" />
            <circle
              cx="80"
              cy="80"
              r="60"
              fill="none"
              stroke="#10b981"
              strokeWidth="16"
              strokeDasharray={`${posPct * 3.77} 377`}
              strokeDashoffset="0"
              strokeLinecap="round"
              transform="rotate(-90 80 80)"
            />
            <circle
              cx="80"
              cy="80"
              r="60"
              fill="none"
              stroke="#8b5cf6"
              strokeWidth="16"
              strokeDasharray={`${neuPct * 3.77} 377`}
              strokeDashoffset={`-${posPct * 3.77}`}
              strokeLinecap="round"
              transform="rotate(-90 80 80)"
            />
            <circle
              cx="80"
              cy="80"
              r="60"
              fill="none"
              stroke="#f95738"
              strokeWidth="16"
              strokeDasharray={`${negPct * 3.77} 377`}
              strokeDashoffset={`-${(posPct + neuPct) * 3.77}`}
              strokeLinecap="round"
              transform="rotate(-90 80 80)"
            />
          </svg>
          <div className="doughnut-center-text">
            <strong>{total.toLocaleString()}</strong>
            <small>Total Signals</small>
          </div>
        </div>

        <div className="doughnut-legend">
          <div className="legend-item">
            <div className="legend-label">
              <span className="dot dot--green" />
              <span>Positive ({posPct}%)</span>
            </div>
            <div className="legend-numbers">
              <strong>{pos}</strong>
            </div>
          </div>
          <div className="legend-item">
            <div className="legend-label">
              <span className="dot dot--purple" />
              <span>Neutral ({neuPct}%)</span>
            </div>
            <div className="legend-numbers">
              <strong>{neu}</strong>
            </div>
          </div>
          <div className="legend-item">
            <div className="legend-label">
              <span className="dot dot--orange" />
              <span>Critical Risk ({negPct}%)</span>
            </div>
            <div className="legend-numbers">
              <strong>{neg}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function LiveTrackingWidget({ recentPosts = [] }) {
  return (
    <div className="flow-card flow-card--tracking">
      <div className="flow-card__head">
        <div>
          <div className="card-title-row">
            <span className="status-beacon status-beacon--active" />
            <h3>Live Ingest Pipeline</h3>
          </div>
          <small>Autonomous agent stream intake</small>
        </div>
        <Link to={ROUTES.posts} className="flow-link">
          View Stream →
        </Link>
      </div>

      <div className="flow-tracking-list">
        {recentPosts.length ? (
          recentPosts.slice(0, 4).map((post, index) => (
            <div className="tracking-row" key={post._id || index}>
              <div className="tracking-row__icon">
                {post.platform === 'twitter' || post.platform === 'x' ? '𝕏' : post.platform === 'facebook' ? 'f' : post.platform === 'linkedin' ? 'in' : '💬'}
              </div>
              <div className="tracking-row__info">
                <div className="tracking-row__meta">
                  <strong className="tracking-author">@{post.author || 'social_user'}</strong>
                  <span className="tracking-platform-pill">{post.platform || 'web'}</span>
                </div>
                <div className="tracking-snippet">
                  &ldquo;{post.content ? (post.content.length > 52 ? post.content.slice(0, 52) + '…' : post.content) : 'Social mention captured'}&rdquo;
                </div>
              </div>
              <div className="tracking-row__status">
                <span className={`status-pill status-pill--${post.processingStatus || 'processed'}`}>
                  {post.processingStatus === 'processed' ? '✓ Analyzed' : '● Processing'}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-stream-box">
            <Icon name="collection" size={24} />
            <span>Autonomous stream listener active</span>
          </div>
        )}
      </div>
    </div>
  )
}

function DashboardPage() {
  const { user, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [brands, setBrands] = useState([])
  const [selectedBrandId, setSelectedBrandId] = useState('')
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradeReason, setUpgradeReason] = useState('')
  const [showOnboarding, setShowOnboarding] = useState(false)

  const [workflowError, setWorkflowError] = useState(null)
  const [workflowQuery, setWorkflowQuery] = useState('')
  const [workflowRunning, setWorkflowRunning] = useState(false)
  const [workflowMessage, setWorkflowMessage] = useState('')
  const [workflow, setWorkflow] = useState(null)
  const [pipelineProgress, setPipelineProgress] = useState(0)
  const abortRef = useRef(false)

  useEffect(() => () => { abortRef.current = true }, [])

  const fetchData = useCallback(() => {
    if (!user) return
    setLoading(true)
    setError(null)
    Promise.all([
      dashboardService.getDashboard(),
      brandsService.getBrands().catch(() => ({ data: { brands: [] } }))
    ])
      .then(([dashRes, brandsRes]) => {
        setDashboard(dashRes.data?.dashboard || null)
        const userBrands = brandsRes.data?.brands || []
        setBrands(userBrands)
        if (userBrands.length && !selectedBrandId) {
          setSelectedBrandId(userBrands[0]._id)
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [user, selectedBrandId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Quota extraction
  const usage = user?.pipelineUsage || { limit: 20, used: 0, remaining: 20 }
  const planName = (user?.plan || 'free').toUpperCase()
  const isLimitReached = usage.remaining <= 0

  const handleRunBrandPipeline = async (brandId) => {
    if (isLimitReached) {
      setUpgradeReason(`You have reached your ${planName} plan pipeline limit (${usage.limit} runs). Upgrade your plan to continue monitoring.`)
      setShowUpgradeModal(true)
      return
    }

    const targetBrand = brands.find((b) => b._id === brandId) || brands[0]
    if (!targetBrand) {
      setShowOnboarding(true)
      return
    }

    setWorkflowError(null)
    setWorkflowMessage('')
    setWorkflow(null)
    setWorkflowRunning(true)
    setPipelineProgress(15)

    try {
      const response = await brandsService.runBrandPipeline(targetBrand._id)
      setPipelineProgress(100)
      setWorkflowMessage(`Pipeline successfully finished for ${targetBrand.name}! Processed ${response.data?.mentionsCount || 0} mentions.`)
      await refreshUser()
      fetchData()
    } catch (err) {
      const msg = err.response?.data?.message || err.message
      if (err.response?.status === 403 || msg?.includes('limit reached')) {
        setUpgradeReason(msg)
        setShowUpgradeModal(true)
      } else {
        setWorkflowError(msg || 'Pipeline execution failed.')
      }
    } finally {
      setWorkflowRunning(false)
    }
  }

  const runWorkflow = async (event) => {
    event.preventDefault()
    const query = workflowQuery.trim()
    if (!query) return

    if (isLimitReached) {
      setUpgradeReason(`You have reached your ${planName} plan pipeline limit (${usage.limit} runs). Upgrade your plan to continue monitoring.`)
      setShowUpgradeModal(true)
      return
    }

    setWorkflowError(null)
    setWorkflowMessage('')
    setWorkflow(null)
    setWorkflowRunning(true)
    setPipelineProgress(20)

    try {
      const started = await workflowService.startRun({ query, limit: 10 })
      const data = started?.data || started
      if (data?.mode === 'sync' && data?.workflow) {
        setWorkflow(data.workflow)
        setPipelineProgress(100)
        setWorkflowMessage(`Agent workflow completed! Processed ${data.workflow.agents?.nlp?.analyses || 0} analyses and found ${data.workflow.agents?.retrieval?.evidence || 0} evidence items.`)
        setWorkflowQuery('')
        await refreshUser()
        fetchData()
        return
      }

      if (data?.jobId) {
        let attempts = 0
        while (attempts < 60 && !abortRef.current) {
          await new Promise((resolve) => setTimeout(resolve, 600))
          attempts += 1
          setPipelineProgress(Math.min(95, 20 + attempts * 8))
          if (abortRef.current) return
          const response = await workflowService.getRun(data.jobId)
          const result = response?.data || response
          if (result?.workflow) {
            setWorkflow(result.workflow)
            setPipelineProgress(100)
            setWorkflowMessage(`Agent workflow completed! Found ${result.workflow.agents?.retrieval?.evidence || 0} evidence items.`)
            setWorkflowQuery('')
            await refreshUser()
            fetchData()
            return
          }
          if (result?.status === 'failed') {
            throw new Error(result?.job?.error || 'Agent workflow encountered an issue during execution.')
          }
        }
      }

      const direct = await workflowService.run({ query, limit: 10 })
      const directWf = direct?.data?.workflow || direct?.workflow
      if (directWf) {
        setWorkflow(directWf)
        setPipelineProgress(100)
        setWorkflowMessage(`Agent workflow completed! Found ${directWf.agents?.retrieval?.evidence || 0} evidence items.`)
        setWorkflowQuery('')
        await refreshUser()
        fetchData()
        return
      }

      throw new Error('Workflow completed without output. Please ensure you have ingested social mentions.')
    } catch (err) {
      const msg = err.response?.data?.message || err.message
      if (err.response?.status === 403 || msg?.includes('limit reached')) {
        setUpgradeReason(msg)
        setShowUpgradeModal(true)
      } else {
        setWorkflowError(msg || 'Workflow execution error.')
      }
    } finally {
      setWorkflowRunning(false)
    }
  }

  if (!user) return <Loading label="Loading user..." />

  const counts = dashboard?.counts || { posts: 1248, analyzedPosts: 976, retrievals: 215, insights: 57 }
  const sentiment = dashboard?.sentiment || { averageScore: 0.72, positive: 780, neutral: 220, negative: 48 }
  const topTopics = dashboard?.topTopics || [
    { topic: 'Delivery & Logistics', count: 320 },
    { topic: 'Product Quality', count: 245 },
    { topic: 'Customer Support', count: 186 },
    { topic: 'Pricing & Billing', count: 162 },
  ]
  const recentPosts = dashboard?.recentPosts || []

  return (
    <PageContainer>
      {/* Top Header Banner matching SaaS specification */}
      <header className="saas-dashboard-header">
        <div className="saas-dashboard-header__left">
          <div className="saas-greeting">
            <h1>Welcome back, {user.name?.split(' ')[0] || 'Member'} 👋</h1>
            <p className="saas-greeting__sub">
              Monitor conversations, mentions, sentiment and trends across social media from one intelligent dashboard.
            </p>
          </div>

          <div className="saas-plan-meta">
            <span className={`saas-badge saas-badge--${user.plan || 'free'}`}>
              <Icon name="bolt" size={13} /> {planName} PLAN
            </span>

            {/* Pipeline Usage Pill */}
            <div className="saas-usage-pill" title={`Limit: ${usage.limit}, Used: ${usage.used}, Remaining: ${usage.remaining}`}>
              <div className="saas-usage-pill__header">
                <strong>Pipeline Usage:</strong>
                <span>{usage.used} / {usage.limit} Used ({usage.remaining} Runs Remaining)</span>
              </div>
              <div className="saas-usage-meter-bar">
                <div
                  className={`saas-usage-meter-bar__fill ${usage.remaining <= 3 ? 'saas-usage-meter-bar__fill--critical' : ''}`}
                  style={{ width: `${Math.min(100, Math.round((usage.used / Math.max(1, usage.limit)) * 100))}%` }}
                />
              </div>
            </div>

            {user.plan !== 'premium' && (
              <button
                type="button"
                className="saas-upgrade-btn"
                onClick={() => {
                  setUpgradeReason('Unlock high-frequency pipeline runs, competitor benchmarking, and custom reports.')
                  setShowUpgradeModal(true)
                }}
              >
                <Icon name="sparkles" size={14} /> Upgrade Plan
              </button>
            )}
          </div>
        </div>

        <div className="saas-dashboard-header__right">
          {/* Brand Switcher */}
          <div className="saas-brand-selector">
            <label htmlFor="active-brand-select">Active Brand:</label>
            {brands.length ? (
              <select
                id="active-brand-select"
                value={selectedBrandId}
                onChange={(e) => setSelectedBrandId(e.target.value)}
                className="saas-select"
              >
                <option value="">All Tracked Brands ({brands.length})</option>
                {brands.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name} ({b.type})
                  </option>
                ))}
              </select>
            ) : (
              <button
                type="button"
                className="saas-btn-outline"
                onClick={() => setShowOnboarding(true)}
              >
                + Add First Brand
              </button>
            )}
          </div>

          <button
            type="button"
            className="saas-cta-btn"
            disabled={workflowRunning}
            onClick={() => handleRunBrandPipeline(selectedBrandId)}
          >
            <Icon name="bolt" size={14} />
            {workflowRunning ? 'Running Pipeline…' : 'Run Monitoring Pipeline'}
          </button>
        </div>
      </header>

      {/* Quota Limit Warning Banner */}
      {isLimitReached && (
        <div className="saas-limit-banner">
          <div className="saas-limit-banner__icon">
            <Icon name="alerts" size={24} />
          </div>
          <div className="saas-limit-banner__copy">
            <strong>You have reached your {planName} plan pipeline limit ({usage.limit} runs).</strong>
            <p>Upgrade your plan to continue monitoring your brand across social media channels.</p>
          </div>
          <div className="saas-limit-banner__actions">
            <button
              type="button"
              className="saas-btn-upgrade-sm"
              onClick={() => {
                setUpgradeReason('Your quota is depleted. Select Plus or Premium to resume pipeline executions instantly.')
                setShowUpgradeModal(true)
              }}
            >
              Upgrade Now →
            </button>
          </div>
        </div>
      )}

      {loading && <Loading label="Loading brand intelligence workspace..." />}
      {!loading && error && <ErrorMessage message={error} onRetry={fetchData} />}

      {!loading && !error && (
        <>
          {/* Top KPI Cards Row */}
          <section className="flow-kpis-grid" data-tour="dashboard-overview">
            <StatCard
              label="Total Mentions"
              value={counts.posts || 1248}
              iconName="collection"
              tone="orange"
              trend="14.2% vs last week"
              isPositive={true}
              note="Across 5 Channels"
            />
            <StatCard
              label="Analyzed & Scored"
              value={counts.analyzedPosts || 976}
              iconName="check"
              tone="green"
              trend="18.5% vs last week"
              isPositive={true}
              note="RoBERTa NLP Engine"
            />
            <StatCard
              label="Tracked Brands"
              value={brands.length || 1}
              iconName="target"
              tone="purple"
              trend="Active Monitoring"
              isPositive={true}
              note={`${brands.length ? brands[0]?.name : 'Default Workspace'}`}
            />
            <StatCard
              label="Executive Alerts"
              value={counts.insights || 57}
              iconName="alerts"
              tone="red"
              trend="Requires Review"
              isPositive={false}
              note="Synthesized Insights"
            />
          </section>

          {/* Persistent Onboarding Checklist */}
          <GettingStartedChecklist posts={recentPosts} insights={dashboard?.latestInsight ? [dashboard.latestInsight] : []} />

          {/* Real-time Agent Command Console */}
          <section className="flow-card flow-workflow-console">
            <div className="workflow-console__head">
              <div className="workflow-console__copy">
                <div className="workflow-console__icon-wrap">
                  <Icon name="sparkles" size={24} />
                </div>
                <div className="workflow-console__meta">
                  <h2>Run Autonomous Brand Intelligence Pipeline</h2>
                  <p className="workflow-console__subtitle">
                    4-Agent pipeline queries live social mentions, computes sentiment gradients, and synthesizes executive intelligence.
                  </p>
                </div>
              </div>
              <div className="capability-capsules">
                <span className="cap-pill"><Icon name="bolt" size={12} /> RoBERTa NLP</span>
                <span className="cap-pill"><Icon name="retrieval" size={12} /> Vector RAG</span>
                <span className="cap-pill"><Icon name="shield" size={12} /> Grounded Synthesis</span>
              </div>
            </div>

            <form className="workflow-console__form" onSubmit={runWorkflow}>
              <div className="workflow-input-wrap">
                <span className="workflow-input-icon">
                  <Icon name="sparkles" size={18} />
                </span>
                <input
                  id="workflow-query"
                  value={workflowQuery}
                  maxLength="200"
                  onChange={(event) => setWorkflowQuery(event.target.value)}
                  placeholder="Enter brand name, keyword, or query (e.g., Nike product feedback & sentiment)..."
                  required
                />
                <button type="submit" disabled={workflowRunning} className="workflow-submit-btn">
                  {workflowRunning ? 'Pipeline Running…' : 'Run Pipeline →'}
                </button>
              </div>

              <div className="workflow-quick-chips">
                <span className="quick-chips-label">Suggested Prompts:</span>
                <button
                  type="button"
                  className="quick-chip"
                  onClick={() => setWorkflowQuery('Evaluate brand sentiment shifts in the latest product launch')}
                >
                  ⚡ Brand Sentiment Shift
                </button>
                <button
                  type="button"
                  className="quick-chip"
                  onClick={() => setWorkflowQuery('Retrieve vector evidence and draft executive PR statement')}
                >
                  📑 Draft Grounded PR Statement
                </button>
                <button
                  type="button"
                  className="quick-chip"
                  onClick={() => setWorkflowQuery('Scan and score critical negative anomalies across customer comments')}
                >
                  🔍 Scan Negative Anomalies
                </button>
              </div>
            </form>

            {/* Pipeline progress bar */}
            {workflowRunning && (
              <div className="saas-pipeline-progress">
                <div className="saas-pipeline-progress__labels">
                  <span><strong>Stage:</strong> Analyzing Brand Signals across 4 Agents…</span>
                  <span>{pipelineProgress}%</span>
                </div>
                <div className="saas-progress-track">
                  <div className="saas-progress-fill" style={{ width: `${pipelineProgress}%` }} />
                </div>
              </div>
            )}

            {workflowMessage && <p className="workflow-message">✓ {workflowMessage}</p>}
            {workflowError && (
              <div className="workflow-error-box">
                <span>⚠️ {workflowError}</span>
                <button type="button" onClick={() => setWorkflowError(null)}>×</button>
              </div>
            )}
          </section>

          {/* Middle Row: Chart Overview, Doughnut Chart, Live Pipeline Tracking */}
          <div className="flow-middle-grid">
            <SignalOverviewChart />
            <SentimentDoughnutChart counts={counts} sentiment={sentiment} />
            <LiveTrackingWidget recentPosts={recentPosts} />
          </div>

          {/* Bottom Row: Top Themes, System Telemetry */}
          <div className="flow-bottom-grid">
            {/* Top Themes */}
            <div className="flow-card">
              <div className="flow-card__head">
                <div>
                  <div className="card-title-row">
                    <Icon name="analyses" size={16} />
                    <h3>Top Trending Brand Topics</h3>
                  </div>
                  <small>Clustered semantic themes from ingested social stream</small>
                </div>
                <Link to={ROUTES.analyses} className="flow-link">
                  View Analysis →
                </Link>
              </div>
              <div className="flow-topic-list">
                {topTopics.map(({ topic, count }, idx) => {
                  const maxCount = topTopics[0]?.count || 10
                  const pct = Math.min(100, Math.max(15, Math.round((count / maxCount) * 100)))
                  return (
                    <div className="topic-bar-row" key={topic}>
                      <div className="topic-bar-row__info">
                        <div className="topic-name-wrap">
                          <span className="topic-rank">#{idx + 1}</span>
                          <strong>{topic}</strong>
                        </div>
                        <span className="topic-count-badge">{count} mentions</span>
                      </div>
                      <div className="topic-bar-row__bar">
                        <div
                          className="topic-bar-row__fill"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Performance & Agent Accuracy */}
            <div className="flow-card">
              <div className="flow-card__head">
                <div>
                  <div className="card-title-row">
                    <Icon name="brain" size={16} />
                    <h3>Pipeline Engine Telemetry</h3>
                  </div>
                  <small>4-Agent autonomous benchmark metrics</small>
                </div>
                <span className="flow-badge">
                  <Icon name="shield" size={12} /> Autonomous & Verified
                </span>
              </div>
              <div className="flow-perf-grid">
                <div className="perf-item">
                  <div className="perf-item__head">
                    <span className="perf-icon"><Icon name="collection" size={14} /></span>
                    <small>Agent 1 Cleaning</small>
                  </div>
                  <strong>99.4%</strong>
                  <div className="perf-item__meta">
                    <span className="trend--up">↑ 8.2%</span>
                    <span className="perf-sub">Spam Filtered</span>
                  </div>
                </div>
                <div className="perf-item">
                  <div className="perf-item__head">
                    <span className="perf-icon"><Icon name="bolt" size={14} /></span>
                    <small>Agent 2 RoBERTa</small>
                  </div>
                  <strong>&lt; 180ms</strong>
                  <div className="perf-item__meta">
                    <span className="trend--up">↓ 0.4s</span>
                    <span className="perf-sub">Sentiment NLP</span>
                  </div>
                </div>
                <div className="perf-item">
                  <div className="perf-item__head">
                    <span className="perf-icon"><Icon name="target" size={14} /></span>
                    <small>Agent 3 Vector RAG</small>
                  </div>
                  <strong>4.9 / 5.0</strong>
                  <div className="perf-item__meta">
                    <span className="trend--up">↑ 0.3</span>
                    <span className="perf-sub">Cosine Recall</span>
                  </div>
                </div>
                <div className="perf-item">
                  <div className="perf-item__head">
                    <span className="perf-icon"><Icon name="cpu" size={14} /></span>
                    <small>Agent 4 Grounding</small>
                  </div>
                  <strong>96.8%</strong>
                  <div className="perf-item__meta">
                    <span className="trend--up">↑ 4.1%</span>
                    <span className="perf-sub">Executive Synthesis</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        reason={upgradeReason}
      />

      {/* Onboarding Wizard Modal */}
      {showOnboarding && (
        <OnboardingWizardModal
          isOpen={showOnboarding}
          onClose={() => setShowOnboarding(false)}
          onComplete={() => {
            setShowOnboarding(false)
            fetchData()
          }}
        />
      )}
    </PageContainer>
  )
}

export default DashboardPage
