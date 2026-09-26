import { useOnboarding } from '../../context/OnboardingContext.jsx'
import logo from '../../assets/signalos-logo.png'
import Icon from '../common/Icon.jsx'

function WelcomeModal() {
  const {
    showWelcomeModal,
    dontShowAgain,
    handleDontShowAgainChange,
    startTour,
    skipTour,
  } = useOnboarding()

  if (!showWelcomeModal) return null

  return (
    <div className="onboarding-modal-backdrop" role="dialog" aria-modal="true">
      <div className="onboarding-modal card tour-welcome-card">
        {/* Header */}
        <div className="onboarding-modal__header">
          <div className="onboarding-modal__brand">
            <img src={logo} alt="SignalOS Logo" className="brand-logo" />
            <div>
              <span className="eyebrow">Enterprise Guided Walkthrough</span>
              <h2>Welcome to SignalOS Agentic AI</h2>
            </div>
          </div>
          <span className="tour-badge-pill">
            <Icon name="sparkles" size={14} /> 8 Step Interactive Tour
          </span>
        </div>

        <p className="onboarding-modal__intro">
          SignalOS automates enterprise social intelligence through an autonomous 4-agent pipeline with strict human-in-the-loop governance. Take this 2-minute step-by-step tour to master the platform from start to finish.
        </p>

        {/* 8-Step Visual Roadmap */}
        <div className="tour-roadmap-grid">
          <div className="roadmap-step-item">
            <div className="step-num">1</div>
            <div className="step-body">
              <strong>Telemetry Hub</strong>
              <small>Live sentiment &amp; alerts</small>
            </div>
          </div>
          <div className="roadmap-arrow">➔</div>

          <div className="roadmap-step-item">
            <div className="step-num">2</div>
            <div className="step-body">
              <strong>Data Ingestion</strong>
              <small>Agent 1 cleaning &amp; spam filter</small>
            </div>
          </div>
          <div className="roadmap-arrow">➔</div>

          <div className="roadmap-step-item">
            <div className="step-num">3</div>
            <div className="step-body">
              <strong>Agent Workflow</strong>
              <small>Autonomous 4-agent run</small>
            </div>
          </div>
          <div className="roadmap-arrow">➔</div>

          <div className="roadmap-step-item">
            <div className="step-num">4</div>
            <div className="step-body">
              <strong>NLP Analytics</strong>
              <small>Agent 2 sentiment &amp; NER</small>
            </div>
          </div>
        </div>

        <div className="tour-roadmap-grid" style={{ marginTop: '10px' }}>
          <div className="roadmap-step-item">
            <div className="step-num">5</div>
            <div className="step-body">
              <strong>Vector RAG</strong>
              <small>Agent 3 grounded evidence</small>
            </div>
          </div>
          <div className="roadmap-arrow">➔</div>

          <div className="roadmap-step-item">
            <div className="step-num">6</div>
            <div className="step-body">
              <strong>AI Synthesis</strong>
              <small>Agent 4 draft responses</small>
            </div>
          </div>
          <div className="roadmap-arrow">➔</div>

          <div className="roadmap-step-item roadmap-step-item--highlight">
            <div className="step-num">7</div>
            <div className="step-body">
              <strong>Human Approval</strong>
              <small>100% review governance</small>
            </div>
          </div>
          <div className="roadmap-arrow">➔</div>

          <div className="roadmap-step-item">
            <div className="step-num">8</div>
            <div className="step-body">
              <strong>Admin &amp; Billing</strong>
              <small>Users, roles &amp; revenue</small>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="onboarding-modal__footer">
          <label className="dont-show-again-label">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => handleDontShowAgainChange(e.target.checked)}
            />
            Don&apos;t show this welcome screen again
          </label>

          <div className="onboarding-modal__actions">
            <button type="button" className="btn btn--ghost" onClick={skipTour}>
              Skip &amp; Explore
            </button>
            <button type="button" className="btn btn--primary" onClick={startTour}>
              🚀 Start Interactive Product Tour (Step 1 → 8)
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WelcomeModal
