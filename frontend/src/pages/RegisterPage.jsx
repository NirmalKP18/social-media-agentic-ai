import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import ErrorMessage from '../components/common/ErrorMessage.jsx'
import Icon from '../components/common/Icon.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { ROUTES } from '../constants/routes.js'
import logo from '../assets/signalos-logo.png'

const PLANS_CONFIG = [
  {
    id: 'Free',
    name: 'Free Starter',
    price: '$0',
    cycle: 'forever',
    runs: '20 Pipeline Runs',
    badge: 'FREE',
    highlight: '20 Free Runs Included',
  },
  {
    id: 'Plus',
    name: 'Plus Plan',
    price: '$29',
    cycle: '/mo',
    runs: '100 Runs / 5 Brands',
    badge: 'POPULAR',
    highlight: '100 Runs & 5 Brands',
  },
  {
    id: 'Premium',
    name: 'Enterprise',
    price: '$79',
    cycle: '/mo',
    runs: '500 Runs / 20 Brands',
    badge: 'PRO',
    highlight: '500 Runs & Competitors',
  },
]

function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialPlan = searchParams.get('plan') || 'Free'

  const [selectedPlan, setSelectedPlan] = useState(
    ['Free', 'Plus', 'Premium'].includes(initialPlan) ? initialPlan : 'Free'
  )

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    company: '',
    country: '',
    phone: '',
  })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    const planParam = searchParams.get('plan')
    if (planParam && ['Free', 'Plus', 'Premium'].includes(planParam)) {
      setSelectedPlan(planParam)
    }
  }, [searchParams])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const validate = () => {
    if (!form.name.trim()) return 'Full Name is required'
    if (!form.email.trim()) return 'Email address is required'
    if (form.password.length < 8) return 'Password must be at least 8 characters'
    if (form.password !== form.confirmPassword) return 'Passwords do not match'
    return null
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError(null)

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setSubmitting(true)

    try {
      const { name, email, password, company, country, phone } = form
      await register({
        name,
        email,
        password,
        plan: selectedPlan,
        company,
        country,
        phone,
      })

      if (selectedPlan === 'Free') {
        navigate(ROUTES.dashboard, { replace: true })
      } else {
        navigate(`${ROUTES.checkout}?plan=${selectedPlan}`, { replace: true })
      }
    } catch (err) {
      setError(err.message || 'Unable to create account')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page-wrapper">
      {/* Top Navigation Bar */}
      <header className="auth-nav-bar">
        <Link to={ROUTES.home} className="auth-back-btn">
          <Icon name="arrow" size={14} style={{ transform: 'rotate(180deg)' }} />
          <span>Back to Overview</span>
        </Link>
        <div className="auth-telemetry-badge">
          <span className="live-pulse-dot" />
          <span>4-Agent Autonomous Pipeline • 20 Free Runs Initialized</span>
        </div>
      </header>

      <main className="auth-main-layout">
        {/* Left Side: Product Branding Hero */}
        <aside className="auth-brand-side">
          <div className="auth-brand-logo-row">
            <img src={logo} alt="SignalOS Logo" className="auth-brand-logo" />
            <div>
              <strong>SignalOS</strong>
              <small>Autonomous Brand Intelligence</small>
            </div>
          </div>

          <div className="auth-brand-content">
            <span className="auth-hero-pill">Enterprise Social Intelligence</span>
            <h1>Know What People Are Saying About Your Brand</h1>
            <p className="auth-hero-desc">
              Monitor conversations, analyze fine-grained sentiment, query grounded vector knowledge, and synthesize PR responses with complete human governance.
            </p>

            <div className="auth-benefits-grid">
              <div className="auth-benefit-item">
                <span className="benefit-icon">
                  <Icon name="sparkles" size={18} />
                </span>
                <div>
                  <strong>20 Free Pipeline Runs</strong>
                  <p>Instant account allowance for testing and monitoring</p>
                </div>
              </div>

              <div className="auth-benefit-item">
                <span className="benefit-icon">
                  <Icon name="analyses" size={18} />
                </span>
                <div>
                  <strong>Deep Emotion &amp; Intent NLP</strong>
                  <p>RoBERTa-powered multi-class emotion scoring</p>
                </div>
              </div>

              <div className="auth-benefit-item">
                <span className="benefit-icon">
                  <Icon name="retrieval" size={18} />
                </span>
                <div>
                  <strong>Vector RAG Grounding</strong>
                  <p>Zero hallucinations with verified source citations</p>
                </div>
              </div>

              <div className="auth-benefit-item">
                <span className="benefit-icon">
                  <Icon name="shield" size={18} />
                </span>
                <div>
                  <strong>Role-Based Governance</strong>
                  <p>Secure audit logging and multi-brand capacity</p>
                </div>
              </div>
            </div>
          </div>

          <footer className="auth-brand-footer">
            <span>Official SignalOS SaaS Platform</span>
            <span className="version-pill">v2.5.0 • Production Live</span>
          </footer>
        </aside>

        {/* Right Side: Clean Professional Form Card */}
        <section className="auth-form-side">
          <div className="auth-form-card">
            <div className="auth-form-header">
              <h2>Create Your Workspace</h2>
              <p>Select your tier and start monitoring brand conversations in seconds</p>
            </div>

            <form className="auth-form-body" onSubmit={handleSubmit}>
              {/* Plan Selection Cards */}
              <div className="auth-plan-selection">
                <div className="auth-plan-label-row">
                  <label>Select Subscription Tier:</label>
                  <span className="auth-plan-note">Upgrade or change anytime</span>
                </div>

                <div className="auth-plans-grid">
                  {PLANS_CONFIG.map((p) => {
                    const isSelected = selectedPlan === p.id
                    return (
                      <button
                        key={p.id}
                        type="button"
                        className={`auth-plan-card ${isSelected ? 'auth-plan-card--selected' : ''}`}
                        onClick={() => setSelectedPlan(p.id)}
                      >
                        <div className="plan-card-top">
                          <span className="plan-card-name">{p.name}</span>
                          <span className={`plan-card-badge plan-card-badge--${p.id.toLowerCase()}`}>
                            {p.badge}
                          </span>
                        </div>
                        <div className="plan-card-pricing">
                          <strong>{p.price}</strong>
                          <small>{p.cycle}</small>
                        </div>
                        <div className="plan-card-quota">{p.runs}</div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Input Fields */}
              <div className="auth-field-group">
                <label htmlFor="name">Full Name *</label>
                <div className="auth-input-container">
                  <span className="auth-input-icon">
                    <Icon name="user" size={16} />
                  </span>
                  <input
                    id="name"
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="e.g. Sahil Sharma"
                    autoComplete="name"
                    required
                  />
                </div>
              </div>

              <div className="auth-field-group">
                <label htmlFor="email">Work / Personal Email *</label>
                <div className="auth-input-container">
                  <span className="auth-input-icon">
                    <Icon name="mail" size={16} />
                  </span>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="sahil@example.com"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              {/* 2-Column Row for Optional Company & Country */}
              <div className="auth-fields-row">
                <div className="auth-field-group">
                  <label htmlFor="company">Company / Brand (Optional)</label>
                  <div className="auth-input-container">
                    <span className="auth-input-icon">
                      <Icon name="target" size={16} />
                    </span>
                    <input
                      id="company"
                      type="text"
                      name="company"
                      value={form.company}
                      onChange={handleChange}
                      placeholder="e.g. Acme Corp"
                    />
                  </div>
                </div>

                <div className="auth-field-group">
                  <label htmlFor="country">Country (Optional)</label>
                  <div className="auth-input-container">
                    <span className="auth-input-icon">
                      <Icon name="collection" size={16} />
                    </span>
                    <input
                      id="country"
                      type="text"
                      name="country"
                      value={form.country}
                      onChange={handleChange}
                      placeholder="e.g. United States"
                    />
                  </div>
                </div>
              </div>

              {/* Password Fields */}
              <div className="auth-field-group">
                <label htmlFor="password">Password (min 8 characters) *</label>
                <div className="auth-input-container">
                  <span className="auth-input-icon">
                    <Icon name="lock" size={16} />
                  </span>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="••••••••••••"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div className="auth-field-group">
                <label htmlFor="confirmPassword">Confirm Password *</label>
                <div className="auth-input-container">
                  <span className="auth-input-icon">
                    <Icon name="shield" size={16} />
                  </span>
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••••••"
                    autoComplete="new-password"
                    required
                  />
                </div>
              </div>

              {error && <ErrorMessage message={error} />}

              {/* Submit CTA */}
              <button type="submit" className="auth-submit-button" disabled={submitting}>
                {submitting ? (
                  <>
                    <span className="auth-btn-spinner" />
                    Creating Workspace...
                  </>
                ) : selectedPlan === 'Free' ? (
                  'Create Free Account (20 Runs Included) →'
                ) : (
                  `Continue to ${selectedPlan} Checkout ($${selectedPlan === 'Plus' ? '29' : '79'}/mo) →`
                )}
              </button>
            </form>

            <div className="auth-form-footer">
              <p>
                Already have an account?{' '}
                <Link to={ROUTES.login} className="auth-login-link">
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default RegisterPage