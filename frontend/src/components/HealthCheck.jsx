import { useHealthCheck } from '../hooks/useHealthCheck.js'
import { getStatusText } from '../utils/status.js'

function HealthCheck() {
  const { data, loading, error, retry } = useHealthCheck()
  const statusText = getStatusText({ loading, error, data })

  return (
    <div className={`health ${loading ? 'health--loading' : ''}${error ? ' health--error' : ''}${data?.success ? ' health--ok' : ''}`}>
      <div className="health__row">
        <span className="health__dot" aria-hidden="true" />
        <span className="health__status">{statusText}</span>
      </div>

      {loading && <p className="health__detail">Checking <code>GET /api/health</code>...</p>}

      {error && (
        <div className="health__detail">
          <p>{error}</p>
          <button type="button" onClick={retry}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && data && (
        <p className="health__detail">Response: {data.message}</p>
      )}
    </div>
  )
}

export default HealthCheck