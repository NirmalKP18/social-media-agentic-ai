import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Loading from '../components/common/Loading.jsx'

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <Loading label="Checking authentication..." />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return children
}

export function AdminRoute({ children }) {
  const { user, isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <Loading label="Checking authentication..." />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (user?.role !== 'admin') {
    return (
      <section className="page">
        <header className="page__header">
          <h1 className="page__title">Administrators only</h1>
          <p className="page__subtitle">The knowledge base can only be managed by an administrator.</p>
        </header>
      </section>
    )
  }

  return children
}

export default ProtectedRoute