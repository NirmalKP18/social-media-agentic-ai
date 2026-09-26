import { useCallback, useEffect, useState } from 'react'
import PageContainer from '../components/common/PageContainer.jsx'
import Loading from '../components/common/Loading.jsx'
import ErrorMessage from '../components/common/ErrorMessage.jsx'
import PipelineRunView from '../components/pipeline/PipelineRunView.jsx'
import { pipelineService } from '../services/pipelineService.js'
import { formatDate } from '../utils/format.js'

const AGENTS = [
  ['01', 'Collection', 'Ingestion & preprocessing'],
  ['02', 'NLP Intelligence', 'Language classification'],
  ['03', 'Retrieval / RAG', 'Semantic evidence search'],
  ['04', 'Generation', 'Grounded response drafting'],
]

function AgentWorkflowPage() {
  const [runs, setRuns] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const load = useCallback(async () => {
    try { const response = await pipelineService.listRuns({ limit: 20 }); setRuns(response.data.runs); setSelected((current) => response.data.runs.find((run) => run._id === current?._id) || current || response.data.runs[0] || null); setError(null) } catch (err) { setError(err.message) } finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])
  useEffect(() => {
    if (!runs.some((run) => run.status === 'processing')) return undefined
    const timer = window.setInterval(load, 1000)
    return () => window.clearInterval(timer)
  }, [runs, load])

  return <PageContainer title="AI Agent Workflow" subtitle="Monitor how specialized agents transform raw mentions into grounded, review-ready intelligence.">
    <section className="workflow-agent-grid">{AGENTS.map(([number, name, detail]) => <article className="card" key={number}><span>{number}</span><strong>{name}</strong><p>{detail}</p></article>)}</section>
    {loading && <Loading label="Loading pipeline activity…" />}
    {error && <ErrorMessage message={error} onRetry={load} />}
    {!loading && !error && <>
      <section className="posts-section"><div className="panel-head"><div><span className="eyebrow">Operations</span><h2>Live pipeline runs</h2></div><button className="btn" onClick={load}>Refresh</button></div>{runs.length === 0 ? <p className="empty-state">No pipeline runs yet. Open a mention and choose “Run full pipeline” to watch the agents work.</p> : <div className="runs-table" role="table"><div role="row" className="runs-table__head"><span>Mention</span><span>Progress</span><span>Started</span><span>Status</span></div>{runs.map((run) => { const progress = Object.values(run.stages || {}).filter((value) => value === 'success').length; return <button role="row" key={run._id} className={selected?._id === run._id ? 'selected' : ''} onClick={() => setSelected(run)}><span><strong>{run.post?.content || `Mention #${run._id.slice(-6)}`}</strong><small>{run.post?.platform || 'source'}</small></span><span>{progress} / 4 agents</span><span>{formatDate(run.startedAt)}</span><span className={`badge badge--${run.status}`}>{run.status}</span></button> })}</div>}</section>
      {selected && <section className="posts-section"><PipelineRunView run={selected} /></section>}
    </>}
  </PageContainer>
}
export default AgentWorkflowPage
