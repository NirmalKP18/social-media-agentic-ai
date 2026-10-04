import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { useOnboarding } from '../../context/OnboardingContext.jsx'
import { ROUTES } from '../../constants/routes.js'
import Icon from '../common/Icon.jsx'
import UpgradeModal from '../common/UpgradeModal.jsx'
import logo from '../../assets/signalos-logo.png'

const NAV_ITEMS = [
  { to: ROUTES.dashboard, label: 'Overview', icon: 'dashboard' },
  { to: ROUTES.brands, label: 'My Brands', icon: 'target' },
  { to: ROUTES.posts, label: 'Mentions Stream', icon: 'collection' },
  { to: ROUTES.analyses, label: 'Analytics', icon: 'analyses' },
  { to: ROUTES.retrieval, label: 'Vector RAG', icon: 'retrieval' },
  { to: ROUTES.insights, label: 'AI Insights & Reports', icon: 'insights' },
  { to: ROUTES.pipelineHistory, label: 'Pipeline History', icon: 'logs' },
  { to: ROUTES.alerts, label: 'Alerts', icon: 'alerts' },
  { to: ROUTES.subscription, label: 'Subscription & Billing', icon: 'creditCard', customerOnly: true },
  { to: ROUTES.connections, label: 'Connections', icon: 'connections' },
  { to: ROUTES.evaluation, label: 'System Evaluation', icon: 'evaluation' },
  { to: ROUTES.knowledge, label: 'Knowledge Base', icon: 'knowledge', adminOnly: true },
  { to: ROUTES.agentLogs, label: 'Agent Logs', icon: 'logs', adminOnly: true },
  { to: ROUTES.admin, label: 'Admin Console', icon: 'admin', adminOnly: true },
  { to: ROUTES.settings, label: 'Settings', icon: 'settings' },
]

function Navbar({ collapsed = false, onCollapse }) {
  const { user, logout } = useAuth()
  const { startTour } = useOnboarding()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  const handleLogout = () => {
    logout()
    navigate(ROUTES.home)
  }

  const toggleMobileMenu = () => setMobileMenuOpen((prev) => !prev)

  const usage = user?.pipelineUsage || { limit: 20, used: 0, remaining: 20 }
  const planName = (user?.plan || 'free').toUpperCase()

  return (
    <nav
      className={`navbar ${user ? 'navbar--workspace' : 'navbar--public'}${collapsed ? ' navbar--collapsed' : ''}`}
      aria-label="Primary navigation"
      data-tour="sidebar-nav"
    >
      <div className="navbar__inner">
        {/* Brand Header */}
        <Link to={user ? ROUTES.dashboard : ROUTES.home} className="navbar__brand" aria-label="SignalOS home">
          <img className="brand-logo" src={logo} alt="SignalOS" />
          <span className="brand-copy">
            <strong>Signal<span className="brand-copy-accent">OS</span></strong>
            <small>Brand Intelligence</small>
          </span>
        </Link>

        {user ? (
          <>
            <button
              className="navbar__collapse"
              type="button"
              onClick={onCollapse}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? '›' : '‹'}
            </button>

            {/* Workspace Navigation Menu */}
            <ul className="navbar__links">
              {NAV_ITEMS.filter((item) => (!item.adminOnly || user.role === 'admin') && (!item.customerOnly || user.role !== 'admin')).map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    title={item.label}
                    className={({ isActive }) => (isActive ? 'navbar__link navbar__link--active' : 'navbar__link')}
                  >
                    <span className="navbar__icon">
                      <Icon name={item.icon} />
                    </span>
                    <span>{item.label}</span>
                    {item.icon === 'alerts' && <i className="navbar__notification" />}
                  </NavLink>
                </li>
              ))}
            </ul>

            {/* Quota Meter & Plan Badge in Sidebar */}
            {!collapsed && user.role !== 'admin' && (
              <div className="navbar__quota-card">
                <div className="navbar__quota-top">
                  <span className={`saas-badge saas-badge--${(user.plan || 'free').toLowerCase()}`}>
                    {planName}
                  </span>
                  <span className="navbar__quota-count">
                    <strong>{usage.remaining}</strong> left
                  </span>
                </div>
                <div className="navbar__quota-label">
                  Pipeline: {usage.used} / {usage.limit} Runs
                </div>
                <div className="saas-usage-meter-bar saas-usage-meter-bar--sidebar">
                  <div
                    className={`saas-usage-meter-bar__fill ${usage.remaining <= 3 ? 'saas-usage-meter-bar__fill--critical' : ''}`}
                    style={{ width: `${Math.min(100, Math.round((usage.used / Math.max(1, usage.limit)) * 100))}%` }}
                  />
                </div>
                {user.plan !== 'premium' ? (
                  <button
                    type="button"
                    className="navbar__upgrade-btn"
                    onClick={() => setShowUpgradeModal(true)}
                  >
                    <Icon name="sparkles" size={13} /> Upgrade Plan
                  </button>
                ) : (
                  <button type="button" className="navbar__tour-btn" onClick={startTour}>
                    Product Tour →
                  </button>
                )}
              </div>
            )}

            {/* User Account Card at Bottom */}
            <div className="navbar__account flow-user-card">
              <span className="navbar__avatar">{user.name?.charAt(0).toUpperCase()}</span>
              <span className="navbar__identity">
                <strong>{user.name}</strong>
                <small>{user.role === 'admin' ? 'Administrator' : `${planName} Member`}</small>
              </span>
              <button
                type="button"
                className="navbar__logout"
                onClick={handleLogout}
                aria-label="Log out"
                title="Log out"
              >
                <Icon name="logout" size={16} />
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Public Landing Navigation Menu */}
            <ul className={`navbar__links navbar__links--public ${mobileMenuOpen ? 'navbar__links--mobile-open' : ''}`}>
              <li>
                <NavLink
                  to={ROUTES.home}
                  end
                  className={({ isActive }) => (isActive ? 'navbar__link navbar__link--active' : 'navbar__link')}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon name="sparkles" size={15} />
                  <span>Overview</span>
                </NavLink>
              </li>
              <li>
                <NavLink
                  to={ROUTES.preview}
                  className={({ isActive }) => (isActive ? 'navbar__link navbar__link--active' : 'navbar__link')}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon name="analyses" size={15} />
                  <span>Live Preview</span>
                </NavLink>
              </li>
              <li>
                <NavLink
                  to={ROUTES.useCases}
                  className={({ isActive }) => (isActive ? 'navbar__link navbar__link--active' : 'navbar__link')}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon name="target" size={15} />
                  <span>Use Cases</span>
                </NavLink>
              </li>
              <li>
                <NavLink
                  to={ROUTES.capabilities}
                  className={({ isActive }) => (isActive ? 'navbar__link navbar__link--active' : 'navbar__link')}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon name="bolt" size={15} />
                  <span>Capabilities</span>
                </NavLink>
              </li>
              {mobileMenuOpen && (
                <li className="mobile-only-action">
                  <NavLink to={ROUTES.login} className="navbar__link" onClick={() => setMobileMenuOpen(false)}>
                    <Icon name="user" size={15} />
                    <span>Sign In</span>
                  </NavLink>
                </li>
              )}
            </ul>

            {/* Desktop Public Action Cluster */}
            <div className="navbar__public-actions">
              <NavLink to={ROUTES.login} className="btn btn--ghost btn--sm flex-center gap-1">
                <Icon name="user" size={15} /> Sign In
              </NavLink>
              <Link to={ROUTES.register} className="navbar__cta flex-center gap-1">
                <span>Start Free (20 Runs)</span>
                <Icon name="arrow" size={14} />
              </Link>
            </div>

            {/* Mobile Hamburger Toggle Button */}
            <button
              type="button"
              className="navbar__mobile-toggle"
              onClick={toggleMobileMenu}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              <Icon name={mobileMenuOpen ? 'logout' : 'dashboard'} size={20} />
            </button>
          </>
        )}
      </div>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        reason="Upgrade to Plus or Premium for high-frequency pipeline executions and multi-brand tracking."
      />
    </nav>
  )
}

export default Navbar
