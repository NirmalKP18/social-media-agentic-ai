import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageContainer from '../components/common/PageContainer.jsx'
import Loading from '../components/common/Loading.jsx'
import ErrorMessage from '../components/common/ErrorMessage.jsx'
import { alertsService } from '../services/alertsService.js'
import { getPostDetailPath } from '../constants/routes.js'
import { formatDate } from '../utils/format.js'

function AlertsPage() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [updating, setUpdating] = useState(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try { const response = await alertsService.getAlerts(); setAlerts(response.data.alerts) }
    catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const changeStatus = async (id, status) => {
    setUpdating(id); setError(null)
    try {
      const response = await alertsService.updateStatus(id, status)
      setAlerts((items) => items.map((item) => item._id === id ? response.data.alert : item))
    } catch (err) { setError(err.message) }
    finally { setUpdating(null) }
  }

  return <PageContainer title="Alerts" subtitle="Negative-sentiment signals requiring human attention">
    {loading && <Loading label="Loading alerts..." />}
    {!loading && error && <ErrorMessage message={error} onRetry={load} />}
    {!loading && alerts.length === 0 && <p className="empty-state">No alerts. Negative analyses will appear here automatically.</p>}
    <div className="posts-list">{alerts.map((alert) => <article className="card post-card" key={alert._id}>
      <div className="post-card__head"><span className="badge">{alert.severity}</span><strong>{alert.status}</strong><span className="post-card__date">{formatDate(alert.createdAt)}</span></div>
      <p>{alert.message}</p>
      {alert.post && <><p className="post-card__content">{alert.post.content}</p><Link to={getPostDetailPath(alert.post._id)}>View evidence post</Link></>}
      <div className="post-card__actions">
        {alert.status === 'open' && <button className="btn" disabled={updating === alert._id} onClick={() => changeStatus(alert._id, 'acknowledged')}>Acknowledge</button>}
        {alert.status !== 'resolved' && <button className="btn btn--ghost" disabled={updating === alert._id} onClick={() => changeStatus(alert._id, 'resolved')}>Resolve</button>}
      </div>
    </article>)}</div>
  </PageContainer>
}

export default AlertsPage
