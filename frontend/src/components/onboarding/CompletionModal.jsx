import { Link } from 'react-router-dom'
import { useOnboarding } from '../../context/OnboardingContext.jsx'
import logo from '../../assets/signalos-logo.png'
import Icon from '../common/Icon.jsx'
import { ROUTES } from '../../constants/routes.js'

function CompletionModal() {
  const { isTourCompleted, finishTour, startTour } = useOnboarding()

  if (!isTourCompleted) return null

  return (
    <div className="onboarding-modal-backdrop" role="dialog" aria-modal="true">
      <div className="onboarding-modal card tour-completion-card text-center">
        <div className="completion-badge-wrap">
          <div className="completion-star-icon">
            <Icon name="sparkles" size={28} />
          </div>
        </div>

        <img src={logo} alt="SignalOS" className="brand-logo mx-auto mb-2" style={{ width: 44, height: 44 }} />
        <span className="eyebrow">Product Tour Complete</span>
        <h2 className="completion-title">You&apos;re Ready to Launch!</h2>
        
        <p className="onboarding-modal__intro">
          You have mastered the complete SignalOS multi-agent workflow: Ingestion (Agent 1) ➔ NLP Sentiment (Agent 2) ➔ Grounded RAG Retrieval (Agent 3) ➔ Executive Synthesis (Agent 4) ➔ Human-in-the-Loop Approval.
        </p>

        {/* Quick Launch Cards */}
        <div className="completion-actions-grid">
          <Link
            to={ROUTES.posts}
            className="completion-quick-card"
            onClick={finishTour}
          >
            <div className="quick-card-icon">
              <Icon name="collection" size={20} />
            </div>
            <strong>Ingest Social Mentions</strong>
            <small>Add posts &amp; run Agent 1</small>
          </Link>

          <Link
            to={ROUTES.dashboard}
            className="completion-quick-card"
            onClick={finishTour}
          >
            <div className="quick-card-icon">
              <Icon name="dashboard" size={20} />
            </div>
            <strong>Live Dashboard</strong>
            <small>Monitor sentiment &amp; alerts</small>
          </Link>

          <Link
            to={ROUTES.admin}
            className="completion-quick-card"
            onClick={finishTour}
          >
            <div className="quick-card-icon">
              <Icon name="shield" size={20} />
            </div>
            <strong>Admin Console</strong>
            <small>Manage users &amp; payments</small>
          </Link>
        </div>

        <div className="onboarding-modal__footer completion-footer">
          <button type="button" className="btn btn--ghost btn--sm" onClick={startTour}>
            🔄 Restart Tour
          </button>
          <button type="button" className="btn btn--primary" onClick={finishTour}>
            🚀 Start Exploring SignalOS
          </button>
        </div>
      </div>
    </div>
  )
}

export default CompletionModal
