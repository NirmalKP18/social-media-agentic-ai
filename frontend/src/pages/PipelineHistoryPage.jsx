import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PageContainer from '../components/common/PageContainer.jsx'
import Loading from '../components/common/Loading.jsx'
import ErrorMessage from '../components/common/ErrorMessage.jsx'
import { insightsService } from '../services/insightsService.js'
import { brandsService } from '../services/brandsService.js'
import { useAuth } from '../context/AuthContext.jsx'
import { ROUTES, getInsightDetailPath } from '../constants/routes.js'
import Icon from '../components/common/Icon.jsx'
import { formatDate } from '../utils/format.js'

export default function PipelineHistoryPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [runs, setRuns] = useState([])
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [insightsRes, brandsRes] = await Promise.all([
        insightsService.getInsights(),
        brandsService.getBrands().catch(() => ({ data: { brands: [] } })),
      ])
      const insightsList = insightsRes?.data?.insights || []
      const userBrands = brandsRes?.data?.brands || []
      setBrands(userBrands)

      // Transform into pipeline runs
      const mappedRuns = insightsList.map((ins, idx) => ({
        id: ins._id,
        runNumber: `RUN-${(insightsList.length - idx).toString().padStart(4, '0')}`,
        target: ins.targetBrand || ins.summary?.slice(0, 35) || 'Brand Analysis',
        summary: ins.summary,
        status: 'Completed',
        postsAnalyzed: ins.statistics?.analyzedPosts || ins.statistics?.totalPosts || 0,
        averageSentiment: ins.statistics?.averageSentimentScore || 0,
        recommendationsCount: ins.recommendations?.length || 0,
        createdAt: ins.createdAt,
        plan: user?.plan || 'Free',
        charged: true,
      }))
      setRuns(mappedRuns)
    } catch (err) {
      setError(err.message || 'Failed to load pipeline run history.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredRuns = runs.filter((r) => {
    const matchesFilter = filterStatus === 'ALL' || r.status.toUpperCase() === filterStatus
    const matchesSearch =
      !searchQuery ||
      r.target.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.runNumber.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const usage = user?.pipelineUsage || { limit: 20, used: 0, remaining: 20 }

  return (
    <PageContainer>
      <header className="page-header">
        <div>
          <h1>Pipeline Run History</h1>
          <p>Audit trail of all autonomous multi-agent social media monitoring executions.</p>
        </div>
        <div className="header-actions">
          <Link to={ROUTES.dashboard} className="saas-cta-btn">
            <Icon name="bolt" size={14} /> Run New Pipeline
          </Link>
        </div>
      </header>

      {/* Usage summary bar */}
      <section className="pipeline-usage-summary-card">
        <div className="summary-stat">
          <span className="summary-stat__label">Total Runs In Account</span>
          <strong className="summary-stat__val">{runs.length}</strong>
        </div>
        <div className="summary-stat">
          <span className="summary-stat__label">Active Quota Allocation</span>
          <strong className="summary-stat__val">{usage.used} / {usage.limit} Runs</strong>
        </div>
        <div className="summary-stat">
          <span className="summary-stat__label">Runs Remaining</span>
          <strong className="summary-stat__val text-primary">{usage.remaining}</strong>
        </div>
        <div className="summary-stat">
          <span className="summary-stat__label">Execution Success Rate</span>
          <strong className="summary-stat__val text-green">100%</strong>
        </div>
      </section>

      {/* Filter toolbar */}
      <div className="saas-table-toolbar">
        <div className="search-box">
          <Icon name="sparkles" size={16} />
          <input
            type="text"
            placeholder="Search runs by ID, brand, or query..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="filter-pills">
          {['ALL', 'COMPLETED', 'FAILED'].map((s) => (
            <button
              key={s}
              type="button"
              className={`filter-pill ${filterStatus === s ? 'filter-pill--active' : ''}`}
              onClick={() => setFilterStatus(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading && <Loading label="Loading pipeline executions..." />}
      {!loading && error && <ErrorMessage message={error} onRetry={fetchData} />}

      {!loading && !error && (
        <>
          {filteredRuns.length > 0 ? (
            <div className="saas-table-wrapper">
              <table className="saas-table">
                <thead>
                  <tr>
                    <th>Pipeline ID</th>
                    <th>Target / Focus</th>
                    <th>Started & Completed</th>
                    <th>Status</th>
                    <th>Mentions Scored</th>
                    <th>Plan</th>
                    <th>Run Charged</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRuns.map((run) => (
                    <tr key={run.id}>
                      <td>
                        <strong>{run.runNumber}</strong>
                        <br />
                        <small className="text-muted">{run.id.slice(0, 10)}…</small>
                      </td>
                      <td>
                        <strong className="text-dark">{run.target}</strong>
                        <div className="text-muted text-truncate" style={{ maxWidth: 280 }}>
                          {run.summary}
                        </div>
                      </td>
                      <td>
                        <div>{formatDate(run.createdAt)}</div>
                        <small className="text-muted">4-Agent Workflow</small>
                      </td>
                      <td>
                        <span className="status-pill status-pill--processed">
                          ✓ {run.status}
                        </span>
                      </td>
                      <td>
                        <strong>{run.postsAnalyzed} mentions</strong>
                        <br />
                        <small className="text-muted">
                          Score: {(run.averageSentiment).toFixed(2)}
                        </small>
                      </td>
                      <td>
                        <span className={`saas-badge saas-badge--${run.plan.toLowerCase()}`}>
                          {run.plan.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <span className="charged-badge">1 Run</span>
                      </td>
                      <td>
                        <Link
                          to={getInsightDetailPath(run.id)}
                          className="saas-btn-table-action"
                        >
                          View Report →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-table-state">
              <Icon name="collection" size={40} />
              <h3>No pipeline runs found</h3>
              <p>Execute your first 4-agent brand monitoring pipeline from the dashboard or your brands page.</p>
              <Link to={ROUTES.dashboard} className="saas-cta-btn">
                Run First Analysis →
              </Link>
            </div>
          )}
        </>
      )}
    </PageContainer>
  )
}
