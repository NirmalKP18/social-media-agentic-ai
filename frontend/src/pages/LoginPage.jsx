import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import ErrorMessage from '../components/common/ErrorMessage.jsx'
import Icon from '../components/common/Icon.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { ROUTES } from '../constants/routes.js'
import logo from '../assets/signalos-logo.png'

function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [form, setForm] = useState({ email: '', password: '', rememberMe: true })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const redirectTo = location.state?.from || ROUTES.dashboard

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      await login({ email: form.email, password: form.password })
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err.message || 'Invalid email or password.')
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
          <span>Enterprise Social Intelligence • Autonomous Pipeline</span>
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
            <h1>Monitor Brand Perception In Real Time</h1>
            <p className="auth-hero-desc">
              Access your real-time social streams, track public sentiment shifts across channels, and review autonomous PR drafts with zero hallucination.
            </p>

            <div className="auth-benefits-grid">
              <div className="auth-benefit-item">
                <span className="benefit-icon">
                  <Icon name="sparkles" size={18} />
                </span>
                <div>
                  <strong>Live Operations Hub</strong>
                  <p>Stream telemetry across X, Reddit, Meta &amp; LinkedIn</p>
                </div>
              </div>

              <div className="auth-benefit-item">
                <span className="benefit-icon">
                  <Icon name="analyses" size={18} />
                </span>
                <div>
                  <strong>Fine-Grained Sentiment</strong>
                  <p>RoBERTa neural polarity &amp; emotion vectors</p>
                </div>
              </div>

              <div className="auth-benefit-item">
                <span className="benefit-icon">
                  <Icon name="retrieval" size={18} />
                </span>
                <div>
                  <strong>Vector RAG Intelligence</strong>
                  <p>Grounded semantic search across knowledge bases</p>
                </div>
              </div>

              <div className="auth-benefit-item">
                <span className="benefit-icon">
                  <Icon name="shield" size={18} />
                </span>
                <div>
                  <strong>Human-in-the-Loop</strong>
                  <p>Executive review &amp; authorization controls</p>
                </div>
              </div>
            </div>
          </div>

          <footer className="auth-brand-footer">
            <span>Official SignalOS SaaS Platform</span>
            <span className="version-pill">v2.5.0 • Production Live</span>
          </footer>
        </aside>

        {/* Right Side: Clean Professional Sign In Card */}
        <section className="auth-form-side">
          <div className="auth-form-card">
            <div className="auth-form-header">
              <h2>Sign In to SignalOS</h2>
              <p>Welcome back! Enter your account credentials to access your dashboard</p>
            </div>

            <form className="auth-form-body" onSubmit={handleSubmit}>
              <div className="auth-field-group">
                <label htmlFor="email">Work / Personal Email</label>
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
                    placeholder="name@company.com"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="auth-field-group">
                <div className="auth-label-row-between">
                  <label htmlFor="password">Password</label>
                  <span className="auth-helper-link" onClick={() => alert('Password reset link will be sent to your email.')}>
                    Forgot password?
                  </span>
                </div>
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
                    autoComplete="current-password"
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

              {/* Remember Me Option */}
              <div className="auth-remember-row">
                <label className="auth-checkbox-label">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={form.rememberMe}
                    onChange={handleChange}
                  />
                  <span>Keep me signed in for 30 days</span>
                </label>
              </div>

              {error && <ErrorMessage message={error} />}

              {/* Submit CTA */}
              <button type="submit" className="auth-submit-button" disabled={submitting}>
                {submitting ? (
                  <>
                    <span className="auth-btn-spinner" />
                    Signing in...
                  </>
                ) : (
                  'Sign In to Workspace →'
                )}
              </button>
            </form>

            <div className="auth-form-footer">
              <p>
                Don&apos;t have an account?{' '}
                <Link to={ROUTES.register} className="auth-login-link">
                  Create Account (20 Free Runs) →
                </Link>
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default LoginPage