import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PageContainer from '../components/common/PageContainer.jsx'
import Loading from '../components/common/Loading.jsx'
import ErrorMessage from '../components/common/ErrorMessage.jsx'
import UpgradeModal from '../components/common/UpgradeModal.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { subscriptionService } from '../services/subscriptionService.js'
import { ROUTES } from '../constants/routes.js'
import Icon from '../components/common/Icon.jsx'
import { formatDate } from '../utils/format.js'

export default function SubscriptionPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [plans, setPlans] = useState([])
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [plansRes, subRes] = await Promise.all([
        subscriptionService.getPlans(),
        subscriptionService.getSubscription().catch(() => ({ data: { subscription: null, user: null } })),
      ])
      setPlans(plansRes.data?.plans || [])
      setSubscription(subRes.data || null)
    } catch (err) {
      setError(err.message || 'Failed to load subscription details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (loading) return <Loading label="Loading billing & subscription..." />
  if (error) return <ErrorMessage message={error} onRetry={fetchData} />

  const currentPlanName = (user?.plan || 'free').toLowerCase()
  const usage = user?.pipelineUsage || { limit: 20, used: 0, remaining: 20 }
  const payments = subscription?.payments || []

  return (
    <PageContainer>
      <header className="page-header">
        <div>
          <h1>Subscription & Billing</h1>
          <p>Manage your account tier, monitor pipeline quota, and review invoice history.</p>
        </div>
      </header>

      {/* Current Subscription Card */}
      <section className="billing-current-card">
        <div className="billing-current-card__left">
          <div className="billing-current-badge">
            <span className={`saas-badge saas-badge--${currentPlanName}`}>
              <Icon name="bolt" size={14} /> {currentPlanName.toUpperCase()} PLAN
            </span>
            <span className="billing-status-pill">
              ● {user?.subscriptionStatus?.toUpperCase() || 'ACTIVE'}
            </span>
          </div>
          <h2>
            {currentPlanName === 'free' ? 'Free Starter Tier' : currentPlanName === 'plus' ? 'Professional Plus' : 'Enterprise Premium'}
          </h2>
          <p className="billing-sub-text">
            {currentPlanName === 'free'
              ? 'Enjoy 20 baseline pipeline runs for testing and personal tracking. Upgrade anytime to unlock real-time streaming and unlimited brands.'
              : 'Active high-frequency social intelligence monitoring with priority queue processing.'}
          </p>

          <div className="billing-usage-box">
            <div className="billing-usage-header">
              <strong>Pipeline Usage Allocation:</strong>
              <span className="billing-usage-numbers">
                <strong>{usage.used}</strong> / {usage.limit} Runs Used ({usage.remaining} Remaining)
              </span>
            </div>
            <div className="saas-usage-meter-bar saas-usage-meter-bar--lg">
              <div
                className={`saas-usage-meter-bar__fill ${usage.remaining <= 3 ? 'saas-usage-meter-bar__fill--critical' : ''}`}
                style={{ width: `${Math.min(100, Math.round((usage.used / Math.max(1, usage.limit)) * 100))}%` }}
              />
            </div>
            {usage.remaining === 0 && (
              <p className="billing-limit-warn">
                ⚠️ You have reached your pipeline limit. Upgrade your plan to continue running monitoring jobs.
              </p>
            )}
          </div>
        </div>

        <div className="billing-current-card__right">
          <div className="billing-price-box">
            <span className="billing-price-val">
              {currentPlanName === 'free' ? '$0' : currentPlanName === 'plus' ? '$49' : '$149'}
            </span>
            <span className="billing-price-period">/ month</span>
          </div>

          <div className="billing-cta-stack">
            {currentPlanName !== 'premium' ? (
              <button
                type="button"
                className="saas-cta-btn"
                onClick={() => setShowUpgradeModal(true)}
              >
                <Icon name="sparkles" size={16} /> Upgrade Plan
              </button>
            ) : (
              <button type="button" className="saas-btn-outline" disabled>
                ✓ Premium Active
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Plan Selection Cards */}
      <section className="billing-plans-section">
        <h2>Available Intelligence Plans</h2>
        <p className="section-sub">Choose the ideal pipeline volume and brand capacity for your team.</p>

        <div className="pricing-grid">
          {plans.map((plan) => {
            const isCurrent = plan.slug === currentPlanName
            return (
              <div
                key={plan.slug}
                className={`pricing-card ${plan.isFeatured ? 'pricing-card--popular' : ''} ${isCurrent ? 'pricing-card--current' : ''}`}
              >
                {plan.isFeatured && <div className="popular-badge">MOST POPULAR</div>}
                <div className="pricing-card__head">
                  <h3>{plan.name}</h3>
                  <p>{plan.description}</p>
                </div>
                <div className="pricing-card__price">
                  <span className="price-curr">$</span>
                  <span className="price-num">{plan.price}</span>
                  <span className="price-per">/ mo</span>
                </div>

                <div className="plan-quota-badge">
                  ⚡ <strong>{plan.pipelineLimit}</strong> Pipeline Runs / month
                </div>

                <ul className="pricing-card__features">
                  {plan.features?.map((f, idx) => (
                    <li key={idx}>✓ {f}</li>
                  ))}
                  <li>✓ Track up to <strong>{plan.brandLimit}</strong> brand profiles</li>
                  <li>✓ <strong>{plan.reportAccess?.toUpperCase()}</strong> report generation</li>
                </ul>

                <div className="pricing-card__action">
                  {isCurrent ? (
                    <button className="pricing-btn pricing-btn--active" disabled>
                      Current Plan
                    </button>
                  ) : plan.slug === 'free' ? (
                    <button className="pricing-btn pricing-btn--outline" disabled>
                      Default Plan
                    </button>
                  ) : (
                    <button
                      className="pricing-btn pricing-btn--primary"
                      onClick={() => navigate(`${ROUTES.checkout}?plan=${plan.slug}`)}
                    >
                      Upgrade to {plan.name} →
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Payment & Invoice History */}
      <section className="billing-history-section">
        <div className="section-header-row">
          <div>
            <h2>Payment & Invoice History</h2>
            <p className="section-sub">Transparent billing ledger and transaction receipts.</p>
          </div>
        </div>

        {payments.length > 0 ? (
          <div className="saas-table-wrapper">
            <table className="saas-table">
              <thead>
                <tr>
                  <th>Invoice ID</th>
                  <th>Plan</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Transaction Ref</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p._id}>
                    <td><code>{p.invoiceId || p._id.slice(0, 8).toUpperCase()}</code></td>
                    <td><strong className="text-capitalize">{p.plan}</strong></td>
                    <td><strong>${p.amount} {p.currency}</strong></td>
                    <td>{formatDate(p.createdAt)}</td>
                    <td><code>{p.transactionId || 'SYS_MOCK_TXN'}</code></td>
                    <td>
                      <span className={`status-pill status-pill--${p.status === 'paid' ? 'processed' : 'pending'}`}>
                        {p.status?.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="billing-empty-history">
            <Icon name="collection" size={32} />
            <p>No paid invoices yet. Active on Free Tier (20 free runs).</p>
          </div>
        )}
      </section>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        reason="Upgrade your subscription to unlock unlimited brand tracking and higher pipeline run allocations."
      />
    </PageContainer>
  )
}
