import { useNavigate } from 'react-router-dom'
import Icon from './Icon.jsx'
import { ROUTES } from '../../constants/routes.js'

function UpgradeModal({ isOpen, onClose, currentUsage, userPlan = 'Free' }) {
  const navigate = useNavigate()

  if (!isOpen) return null

  const handleSelectPlan = (planName) => {
    onClose?.()
    navigate(`${ROUTES.checkout}?plan=${encodeURIComponent(planName)}`)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal upgrade-modal" onClick={(e) => e.stopPropagation()}>
        <div className="upgrade-modal__header">
          <div className="upgrade-modal__badge">
            <Icon name="sparkles" size={16} />
            <span>UNRESTRICTED ACCESS</span>
          </div>
          <button className="modal__close" onClick={onClose} title="Close">
            ✕
          </button>
        </div>

        <div className="upgrade-modal__intro">
          <h2>Pipeline Quota Reached</h2>
          <p>
            You have used <strong>{currentUsage?.used || 20}</strong> of your{' '}
            <strong>{currentUsage?.limit || 20}</strong> pipeline runs on the {userPlan} plan. Upgrade your subscription to continue monitoring brands and running autonomous AI pipelines.
          </p>
        </div>

        <div className="upgrade-plans-grid">
          {/* Plan 1: Plus */}
          <div className="upgrade-plan-card upgrade-plan-card--featured">
            <div className="upgrade-plan-card__pill">MOST POPULAR</div>
            <div className="upgrade-plan-card__name">Plus Plan</div>
            <div className="upgrade-plan-card__price">
              <span className="price-currency">$</span>
              <span className="price-num">29</span>
              <span className="price-cycle">/month</span>
            </div>
            <p className="upgrade-plan-card__desc">Ideal for creators, agencies & growing brand teams.</p>
            <ul className="upgrade-plan-features">
              <li>✓ <strong>100 Pipeline Runs</strong> per month</li>
              <li>✓ Up to <strong>5 Monitored Brands</strong></li>
              <li>✓ Deep Emotion & Intent NLP Analysis</li>
              <li>✓ Vector RAG Knowledge Base Grounding</li>
              <li>✓ Executive PDF & Markdown Reports</li>
              <li>✓ Priority Execution Queue</li>
            </ul>
            <button
              type="button"
              className="btn btn--primary upgrade-plan-btn"
              onClick={() => handleSelectPlan('Plus')}
            >
              Upgrade to Plus ➔
            </button>
          </div>

          {/* Plan 2: Premium */}
          <div className="upgrade-plan-card">
            <div className="upgrade-plan-card__name">Enterprise Premium</div>
            <div className="upgrade-plan-card__price">
              <span className="price-currency">$</span>
              <span className="price-num">79</span>
              <span className="price-cycle">/month</span>
            </div>
            <p className="upgrade-plan-card__desc">Uncapped intelligence, competitor tracking & custom RAG.</p>
            <ul className="upgrade-plan-features">
              <li>✓ <strong>500 Pipeline Runs</strong> per month</li>
              <li>✓ Up to <strong>20 Monitored Brands</strong></li>
              <li>✓ Competitor Benchmarking & Shift Alerts</li>
              <li>✓ Full 4-Agent Autonomous Workflow</li>
              <li>✓ Unlimited White-Label Exports</li>
              <li>✓ 24/7 Dedicated Support & SLAs</li>
            </ul>
            <button
              type="button"
              className="btn btn--outline upgrade-plan-btn"
              onClick={() => handleSelectPlan('Premium')}
            >
              Upgrade to Premium ➔
            </button>
          </div>
        </div>

        <div className="upgrade-modal__footer">
          <button type="button" className="btn btn--ghost btn--sm" onClick={onClose}>
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  )
}

export default UpgradeModal
