import { useHealthCheck } from '../hooks/useHealthCheck.js'
import { getStatusText } from '../utils/status.js'
import Loading from './common/Loading.jsx'
import ErrorMessage from './common/ErrorMessage.jsx'

function HealthCheck() {
  const { data, loading, error, retry } = useHealthCheck()
  const statusText = getStatusText({ loading, error, data })

  return (
    <div className={`health ${loading ? 'health--loading' : ''}${error ? ' health--error' : ''}${data?.success ? ' health--ok' : ''}`}>
      <div className="health__row">
        <span className="health__dot" aria-hidden="true" />
        <span className="health__status">{statusText}</span>
      </div>

      {loading && <Loading label="Checking GET /api/health..." />}

      {error && <ErrorMessage message={error} onRetry={retry} />}

      {!loading && !error && data && (
        <p className="health__detail">Response: {data.message}</p>
      )}
    </div>
  )
}

export default HealthCheck