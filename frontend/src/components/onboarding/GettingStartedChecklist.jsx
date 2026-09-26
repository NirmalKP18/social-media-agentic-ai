import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useOnboarding, CHECKLIST_ITEMS } from '../../context/OnboardingContext.jsx'
import { ROUTES } from '../../constants/routes.js'
import Icon from '../common/Icon.jsx'

function GettingStartedChecklist({ posts = [], insights = [] }) {
  const { checklist, startTour } = useOnboarding()
  const [collapsed, setCollapsed] = useState(false)

  // Dynamically compute real task completion status from system state
  const hasPosts = posts.length > 0
  const hasProcessed = posts.some((p) => p.processingStatus === 'processed') || insights.length > 0
  const hasInsights = insights.length > 0
  const hasReviewed = insights.some((i) => i.review?.status === 'approved' || i.review?.status === 'rejected')

  const isChecked = (key) => {
    if (key === 'add_mention') return hasPosts || checklist.add_mention
    if (key === 'process_mention') return hasProcessed || checklist.process_mention
    if (key === 'review_nlp') return hasPosts || checklist.review_nlp
    if (key === 'review_evidence') return hasInsights || checklist.review_evidence
    if (key === 'review_insight') return hasInsights || checklist.review_insight
    if (key === 'approve_reject') return hasReviewed || checklist.approve_reject
    return Boolean(checklist[key])
  }

  const completedCount = CHECKLIST_ITEMS.filter((item) => isChecked(item.key)).length
  const progressPercent = Math.round((completedCount / CHECKLIST_ITEMS.length) * 100)

  return (
    <div className="card checklist-widget">
      <div className="checklist-widget__head">
        <div>
          <h3>Product Onboarding Checklist</h3>
          <p>Complete these 6 core workflow tasks to master the Agentic System</p>
        </div>

        <div className="checklist-widget__actions">
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={startTour}
            title="Restart Interactive Tour"
          >
            <Icon name="sparkles" size={14} /> Product Tour
          </button>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? 'Expand' : 'Collapse'}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="checklist-progress">
        <div className="checklist-progress__info">
          <span>{completedCount} of {CHECKLIST_ITEMS.length} Tasks Completed</span>
          <strong>{progressPercent}%</strong>
        </div>
        <div className="checklist-progress__bar">
          <div
            className="checklist-progress__fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {!collapsed && (
        <div className="checklist-items-grid">
          {CHECKLIST_ITEMS.map((item, index) => {
            const done = isChecked(item.key)
            return (
              <div
                className={`checklist-item ${done ? 'checklist-item--done' : ''}`}
                key={item.key}
              >
                <div className="checklist-item__head">
                  <span className="checklist-item__check">
                    {done ? <Icon name="check" size={13} /> : '○'}
                  </span>
                  <span className="checklist-item__step">Step {index + 1}</span>
                </div>
                <div className="checklist-item__text">
                  <strong>{item.label}</strong>
                  <span className="checklist-item__badge">{item.desc}</span>
                </div>
                {!done && (
                  <Link
                    to={
                      item.key === 'add_mention'
                        ? ROUTES.posts
                        : item.key === 'process_mention'
                        ? ROUTES.posts
                        : ROUTES.insights
                    }
                    className="checklist-item__link"
                  >
                    Start →
                  </Link>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default GettingStartedChecklist
