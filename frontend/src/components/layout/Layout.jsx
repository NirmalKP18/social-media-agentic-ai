import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar.jsx'
import Icon from '../common/Icon.jsx'
import HealthCheck from '../HealthCheck.jsx'
import WelcomeModal from '../onboarding/WelcomeModal.jsx'
import TourOverlay from '../onboarding/TourOverlay.jsx'
import CompletionModal from '../onboarding/CompletionModal.jsx'
import { useOnboarding } from '../../context/OnboardingContext.jsx'

const TITLES = {
  dashboard: 'Overview',
  posts: 'Mentions',
  analyses: 'Insights',
  retrieval: 'Retrieval',
  insights: 'Reports',
  alerts: 'Alerts',
  knowledge: 'Knowledge Base',
  'agent-logs': 'Agent Logs',
  evaluation: 'Evaluation',
  settings: 'Settings',
  connections: 'Connections',
}

const PUBLIC_ROUTES = ['/', '/login', '/register', '/preview', '/use-cases', '/capabilities']

function Layout() {
  const location = useLocation()
  const workspace = !PUBLIC_ROUTES.includes(location.pathname)
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebar-collapsed') === 'true')
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light')
  const { startTour } = useOnboarding()

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', collapsed)
  }, [collapsed])

  const title = TITLES[location.pathname.split('/')[1]] || 'SignalOS'

  return (
    <div className={`app-layout${collapsed ? ' app-layout--collapsed' : ''}`}>
      <Navbar collapsed={collapsed} onCollapse={() => setCollapsed((value) => !value)} />

      {workspace && (
        <header className="topbar">
          <div>
            <span>Workspace</span>
            <strong>{title}</strong>
          </div>
          <div className="topbar__actions">
            <button
              type="button"
              className="btn btn--ghost btn--sm flex-center gap-1"
              onClick={startTour}
              title="How It Works / Take Product Tour"
            >
              <Icon name="help" size={15} /> How It Works
            </button>
            <HealthCheck />
            <button
              className="icon-button"
              type="button"
              onClick={() => setTheme((value) => (value === 'light' ? 'dark' : 'light'))}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              title="Change theme"
            >
              {theme === 'light' ? '☾' : '☀'}
            </button>
          </div>
        </header>
      )}

      <main className="app-main">
        <Outlet />
      </main>

      {/* Global Onboarding Components */}
      {workspace && (
        <>
          <WelcomeModal />
          <TourOverlay />
          <CompletionModal />
        </>
      )}
    </div>
  )
}

export default Layout
