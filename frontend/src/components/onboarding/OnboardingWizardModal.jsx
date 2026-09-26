import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../common/Icon.jsx'
import { brandsService } from '../../services/brandsService.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { ROUTES } from '../../constants/routes.js'

const MONITOR_TYPES = [
  { id: 'brand', label: 'Brand', icon: 'sparkles', desc: 'Commercial brand identity & products' },
  { id: 'company', label: 'Company / Org', icon: 'shield', desc: 'Corporate organization or enterprise' },
  { id: 'product', label: 'Product / SaaS', icon: 'target', desc: 'Specific product line or software app' },
  { id: 'personal_name', label: 'Personal Name', icon: 'user', desc: 'Executive, founder, or personal brand' },
  { id: 'creator', label: 'Creator / Influencer', icon: 'heart', desc: 'Content creator or media personality' },
  { id: 'campaign', label: 'Campaign / Event', icon: 'barChart', desc: 'Marketing launch or conference event' },
  { id: 'keyword', label: 'Topic / Keyword', icon: 'retrieval', desc: 'Industry trend or keyword cluster' },
]

const PLATFORM_OPTIONS = [
  { id: 'x', label: 'X (Twitter)', icon: '💬', color: '#0f1419' },
  { id: 'reddit', label: 'Reddit', icon: '🤖', color: '#ff4500' },
  { id: 'linkedin', label: 'LinkedIn', icon: '💼', color: '#0a66c2' },
  { id: 'facebook', label: 'Facebook', icon: '🌐', color: '#1877f2' },
  { id: 'youtube', label: 'YouTube', icon: '▶️', color: '#ff0000' },
  { id: 'instagram', label: 'Instagram', icon: '📷', color: '#e1306c' },
]

function OnboardingWizardModal({ isOpen, onClose, onComplete }) {
  const navigate = useNavigate()
  const { user, refreshUser } = useAuth()

  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    type: 'brand',
    name: '',
    primaryKeyword: '',
    alternativeKeywords: '',
    platforms: ['x', 'reddit', 'linkedin'],
    description: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  if (!isOpen) return null

  const handleTypeSelect = (typeId) => {
    setFormData((prev) => ({ ...prev, type: typeId }))
  }

  const handlePlatformToggle = (platformId) => {
    setFormData((prev) => {
      const exists = prev.platforms.includes(platformId)
      const nextPlatforms = exists
        ? prev.platforms.filter((p) => p !== platformId)
        : [...prev.platforms, platformId]
      return { ...prev, platforms: nextPlatforms.length ? nextPlatforms : [platformId] }
    })
  }

  const handleCreateAndRun = async () => {
    if (!formData.name.trim()) {
      setError('Please provide a name for what you are monitoring.')
      setStep(3)
      return
    }
    if (!formData.primaryKeyword.trim()) {
      setError('Please enter at least one primary search keyword.')
      setStep(3)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // 1. Create the brand profile
      const brandRes = await brandsService.createBrand({
        name: formData.name.trim(),
        type: formData.type,
        primaryKeyword: formData.primaryKeyword.trim(),
        alternativeKeywords: formData.alternativeKeywords
          ? formData.alternativeKeywords.split(',').map((k) => k.trim()).filter(Boolean)
          : [],
        platforms: formData.platforms,
        description: formData.description.trim(),
      })

      const brand = brandRes.data?.brand

      // 2. Automatically trigger initial autonomous pipeline run for this brand
      if (brand?._id) {
        try {
          await brandsService.runBrandPipeline(brand._id)
        } catch (pipeErr) {
          console.warn('Initial onboarding pipeline run completed with notice:', pipeErr.message)
        }
      }

      await refreshUser?.()
      onComplete?.()
      onClose?.()
      navigate(ROUTES.dashboard)
    } catch (err) {
      setError(err.response?.data?.message || err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal onboarding-wizard-modal" onClick={(e) => e.stopPropagation()}>
        {/* Progress Bar */}
        <div className="wizard-progress-bar">
          <div className="wizard-progress-fill" style={{ width: `${(step / 5) * 100}%` }} />
        </div>

        {/* Step Header */}
        <div className="wizard-header">
          <div className="wizard-step-tag">STEP {step} OF 5</div>
          <button className="modal__close" onClick={onClose} title="Skip Setup">
            ✕
          </button>
        </div>

        {error && <div className="error-message" style={{ margin: '0 24px 16px' }}>{error}</div>}

        {/* ---------------- STEP 1: WELCOME ---------------- */}
        {step === 1 && (
          <div className="wizard-body wizard-step-fade">
            <div className="wizard-hero-icon">
              <Icon name="sparkles" size={32} />
            </div>
            <h2>Welcome to SignalOS!</h2>
            <p className="wizard-subtitle">
              Hello <strong>{user?.name || 'there'}</strong>! Let's set up your intelligence workspace in less than 60 seconds.
            </p>
            <div className="wizard-features-preview">
              <div className="wizard-feature-pill">
                <span>🛰️</span>
                <div>
                  <strong>Multi-Channel Ingestion</strong>
                  <small>Capture posts across social networks</small>
                </div>
              </div>
              <div className="wizard-feature-pill">
                <span>🧠</span>
                <div>
                  <strong>4-Agent AI Engine</strong>
                  <small>Clean, score sentiment, retrieve facts & draft responses</small>
                </div>
              </div>
              <div className="wizard-feature-pill">
                <span>⚡</span>
                <div>
                  <strong>{user?.pipelineUsage?.limit || 20} Free Pipeline Runs</strong>
                  <small>Assigned to your account ready to explore</small>
                </div>
              </div>
            </div>

            <div className="wizard-footer">
              <button type="button" className="btn btn--primary btn--lg" onClick={() => setStep(2)}>
                Get Started ➔
              </button>
            </div>
          </div>
        )}

        {/* ---------------- STEP 2: WHAT TO MONITOR ---------------- */}
        {step === 2 && (
          <div className="wizard-body wizard-step-fade">
            <h2>What would you like to monitor?</h2>
            <p className="wizard-subtitle">
              Select the tracking profile category that best matches your objective:
            </p>

            <div className="wizard-type-grid">
              {MONITOR_TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`wizard-type-card ${formData.type === t.id ? 'wizard-type-card--selected' : ''}`}
                  onClick={() => handleTypeSelect(t.id)}
                >
                  <div className="wizard-type-icon">
                    <Icon name={t.icon} size={20} />
                  </div>
                  <div className="wizard-type-info">
                    <strong>{t.label}</strong>
                    <small>{t.desc}</small>
                  </div>
                </button>
              ))}
            </div>

            <div className="wizard-footer">
              <button type="button" className="btn btn--outline" onClick={() => setStep(1)}>
                ← Back
              </button>
              <button type="button" className="btn btn--primary" onClick={() => setStep(3)}>
                Next: Keywords ➔
              </button>
            </div>
          </div>
        )}

        {/* ---------------- STEP 3: MONITORING DETAILS ---------------- */}
        {step === 3 && (
          <div className="wizard-body wizard-step-fade">
            <h2>Enter Monitoring Details</h2>
            <p className="wizard-subtitle">
              Specify the exact brand name and search keywords to track across feeds:
            </p>

            <div className="wizard-form-fields">
              <div className="form-group">
                <label className="form__label">
                  {formData.type === 'personal_name' ? 'Full Person / Creator Name' : 'Brand or Entity Name'} *
                </label>
                <input
                  type="text"
                  className="form__input"
                  placeholder="e.g. Nike, Apple, Acme Corp, or @JohnDoe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form__label">Primary Search Keyword *</label>
                <input
                  type="text"
                  className="form__input"
                  placeholder="e.g. Nike, iPhone, Acme software"
                  value={formData.primaryKeyword}
                  onChange={(e) => setFormData({ ...formData, primaryKeyword: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form__label">Alternative Keywords & Hashtags (Comma-separated)</label>
                <input
                  type="text"
                  className="form__input"
                  placeholder="e.g. #JustDoIt, NikeShoes, AirMax, @NikeSupport"
                  value={formData.alternativeKeywords}
                  onChange={(e) => setFormData({ ...formData, alternativeKeywords: e.target.value })}
                />
              </div>
            </div>

            <div className="wizard-footer">
              <button type="button" className="btn btn--outline" onClick={() => setStep(2)}>
                ← Back
              </button>
              <button
                type="button"
                className="btn btn--primary"
                disabled={!formData.name.trim() || !formData.primaryKeyword.trim()}
                onClick={() => setStep(4)}
              >
                Next: Platforms ➔
              </button>
            </div>
          </div>
        )}

        {/* ---------------- STEP 4: CHOOSE PLATFORMS ---------------- */}
        {step === 4 && (
          <div className="wizard-body wizard-step-fade">
            <h2>Choose Social Platforms</h2>
            <p className="wizard-subtitle">
              Select which channels the autonomous ingestion pipeline should scan:
            </p>

            <div className="wizard-platforms-grid">
              {PLATFORM_OPTIONS.map((p) => {
                const isSelected = formData.platforms.includes(p.id)
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={`wizard-platform-chip ${isSelected ? 'wizard-platform-chip--selected' : ''}`}
                    onClick={() => handlePlatformToggle(p.id)}
                  >
                    <span className="platform-icon">{p.icon}</span>
                    <span className="platform-label">{p.label}</span>
                    <span className="platform-check">{isSelected ? '✓' : '+'}</span>
                  </button>
                )
              })}
            </div>

            <div className="wizard-footer">
              <button type="button" className="btn btn--outline" onClick={() => setStep(3)}>
                ← Back
              </button>
              <button type="button" className="btn btn--primary" onClick={() => setStep(5)}>
                Next: Review Setup ➔
              </button>
            </div>
          </div>
        )}

        {/* ---------------- STEP 5: CONFIRM & LAUNCH ---------------- */}
        {step === 5 && (
          <div className="wizard-body wizard-step-fade">
            <h2>Confirm & Launch First Analysis</h2>
            <p className="wizard-subtitle">
              Everything is ready. Confirm your monitoring profile to start autonomous intelligence:
            </p>

            <div className="wizard-summary-card">
              <div className="summary-row">
                <span className="summary-label">Profile Name:</span>
                <strong>{formData.name}</strong>
              </div>
              <div className="summary-row">
                <span className="summary-label">Category:</span>
                <span className="chip">{formData.type.replace('_', ' ').toUpperCase()}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Primary Keyword:</span>
                <code>{formData.primaryKeyword}</code>
              </div>
              {formData.alternativeKeywords && (
                <div className="summary-row">
                  <span className="summary-label">Aliases / Tags:</span>
                  <span>{formData.alternativeKeywords}</span>
                </div>
              )}
              <div className="summary-row">
                <span className="summary-label">Connected Platforms:</span>
                <div className="chips">
                  {formData.platforms.map((p) => (
                    <span key={p} className="chip chip--entity">{p.toUpperCase()}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="wizard-footer">
              <button type="button" className="btn btn--outline" onClick={() => setStep(4)} disabled={loading}>
                ← Back
              </button>
              <button
                type="button"
                className="btn btn--primary btn--lg"
                onClick={handleCreateAndRun}
                disabled={loading}
              >
                {loading ? 'Initializing Agent Pipeline...' : '🚀 Launch Pipeline & Go to Dashboard'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default OnboardingWizardModal
