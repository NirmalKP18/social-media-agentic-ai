import { useCallback, useEffect, useState } from 'react'
import PageContainer from '../components/common/PageContainer.jsx'
import ErrorMessage from '../components/common/ErrorMessage.jsx'
import Loading from '../components/common/Loading.jsx'
import { agentLogService } from '../services/agentLogService.js'
import { formatDate, formatDuration } from '../utils/format.js'

const AGENT_OPTIONS = ['collection', 'nlp', 'retrieval', 'insight']
const STATUS_OPTIONS = ['success', 'failed']

function AgentLogsPage() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [agent, setAgent] = useState('')
  const [status, setStatus] = useState('')
  const [expandedRun, setExpandedRun] = useState(null)
  const [expandedLoading, setExpandedLoading] = useState(false)

  const load = useCallback(async (filters = {}) => {
    setLoading(true)
    setError(null)
    try {
      const params = {}
      if (filters.agent) params.agent = filters.agent
      if (filters.status) params.status = filters.status
      const response = await agentLogService.list(params)
      setLogs(response.data.logs)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleFilter = async (event) => {
    event.preventDefault()
    await load({ agent, status })
  }

  const toggleRun = async (log) => {
    if (!log.pipelineRun) return
    if (expandedRun === log.pipelineRun) {
      setExpandedRun(null)
      return
    }
    setExpandedRun(log.pipelineRun)
    setExpandedLoading(true)
    try {
      const response = await agentLogService.byPipelineRun(log.pipelineRun)
      setLogs((prev) => {
        const attached = response.data.logs
        /* keep the other entries untouched, replace this run's logs with the sorted set */
        const others = prev.filter((entry) => entry.pipelineRun !== log.pipelineRun)
        return [...attached, ...others]
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setExpandedLoading(false)
    }
  }

  return (
    <PageContainer
      title="Agent logs"
      subtitle="Local execution trace for the collection, analysis, retrieval and generation agents"
    >
      <form className="filter-toolbar" onSubmit={handleFilter}>
        <label className="form__label" htmlFor="log-agent">Agent</label>
        <select id="log-agent" className="form__input" value={agent} onChange={(event) => setAgent(event.target.value)}>
          <option value="">All agents</option>
          {AGENT_OPTIONS.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
        <label className="form__label" htmlFor="log-status">Status</label>
        <select id="log-status" className="form__input" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">Any status</option>
          {STATUS_OPTIONS.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
        <button className="form__submit" type="submit" disabled={loading}>
          Apply filters
        </button>
        <button
          type="button"
          className="form__cancel"
          onClick={() => { setAgent(''); setStatus(''); load(); }}
          disabled={loading}
        >
          Reset
        </button>
      </form>

      {loading && <Loading label="Loading agent logs..." />}
      {!loading && error && <ErrorMessage message={error} onRetry={() => load({ agent, status })} />}
      {!loading && !error && logs.length === 0 && (
        <p className="empty-state">No agent activity recorded yet. Run a mention pipeline or the dashboard workflow to populate these logs.</p>
      )}
      {!loading && !error && logs.length > 0 && (
        <div className="posts-list">
          {logs.map((log) => (
            <article className={`card post-card agent-log agent-log--${log.agentName}`} key={log._id}>
              <div className="post-card__head">
                <span className={`badge badge--${log.status}`}>{log.status}</span>
                <span className="agent-log__agent">{log.agentName} agent</span>
                <span className="post-card__date">
                  {formatDate(log.startedAt)} · {formatDuration(log.durationMs)}
                </span>
              </div>
              <p className="post-card__content">{log.action}</p>
              {log.outputSummary && <div className="agent-log__output">{log.outputSummary}</div>}
              {log.errorMessage && <div className="agent-log__output agent-log__output--error">Error: {log.errorMessage}</div>}
              <div className="post-detail">
                {log.post && (
                  <div>
                    <dt>Post</dt>
                    <dd className="post-detail__truncate">{log.post.content || log.post}</dd>
                  </div>
                )}
                {log.pipelineRun && (
                  <div>
                    <dt>Pipeline run</dt>
                    <dd>
                      <button
                        type="button"
                        className="text-link"
                        onClick={() => toggleRun(log)}
                        disabled={expandedLoading}
                        title={expandedRun === log.pipelineRun ? 'Collapse run' : 'Show this run’s full trace'}
                      >
                        {expandedRun === log.pipelineRun ? 'Collapse trace' : 'Show trace'} ({log.pipelineRun.slice(0, 8)}…)
                      </button>
                    </dd>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </PageContainer>
  )
}

export default AgentLogsPage