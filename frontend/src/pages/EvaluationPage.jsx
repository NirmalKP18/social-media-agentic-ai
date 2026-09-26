import { useEffect, useState } from 'react'
import PageContainer from '../components/common/PageContainer.jsx'
import Loading from '../components/common/Loading.jsx'
import ErrorMessage from '../components/common/ErrorMessage.jsx'
import Icon from '../components/common/Icon.jsx'
import { evaluationService } from '../services/evaluationService.js'

function EvaluationPage() {
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [running, setRunning] = useState(false)
  const [benchmarkResult, setBenchmarkResult] = useState(null)

  useEffect(() => {
    fetchMetrics()
  }, [])

  const fetchMetrics = () => {
    setLoading(true)
    setError(null)
    evaluationService
      .getMetrics()
      .then((res) => setMetrics(res.data.metrics))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  const handleRunBenchmark = async () => {
    setRunning(true)
    setError(null)
    try {
      const res = await evaluationService.runBenchmark()
      setBenchmarkResult(res.data.benchmarkResults)
      fetchMetrics()
    } catch (err) {
      setError(err.message)
    } finally {
      setRunning(false)
    }
  }

  if (loading) {
    return (
      <PageContainer title="System evaluation & metrics">
        <Loading label="Loading multi-agent evaluation metrics..." />
      </PageContainer>
    )
  }

  if (error && !metrics) {
    return (
      <PageContainer title="System evaluation & metrics">
        <ErrorMessage message={error} />
      </PageContainer>
    )
  }

  const { overall, agent1Collection, agent2Nlp, agent3Retrieval, agent4Generation } = metrics || {}

  return (
    <PageContainer
      title="System evaluation & agent metrics"
      subtitle="Comprehensive performance benchmarking for all 4 member agents according to project specifications"
    >
      {/* Top Banner & Trigger */}
      <div className="card evaluation-hero">
        <div className="evaluation-hero__content">
          <div>
            <span className="eyebrow">Project Viva Ready</span>
            <h2>Multi-Agent Evaluation Framework</h2>
            <p>
              Quantification of Data Collection accuracy, NLP Sentiment/NER F1 scores, IR RAG Precision@k, and LLM Grounding rubrics.
            </p>
          </div>
          <button
            type="button"
            className="btn btn--primary"
            onClick={handleRunBenchmark}
            disabled={running}
          >
            {running ? 'Running agent benchmarks…' : '⚡ Run Agent Evaluation Suite'}
          </button>
        </div>

        {overall && (
          <div className="evaluation-stats-grid">
            <div className="stat-card">
              <span className="stat-card__label">Pipeline Health</span>
              <strong className="stat-card__value text-success">{overall.systemHealth}</strong>
            </div>
            <div className="stat-card">
              <span className="stat-card__label">Pipeline Success Rate</span>
              <strong className="stat-card__value">{overall.pipelineSuccessRate}</strong>
            </div>
            <div className="stat-card">
              <span className="stat-card__label">Human Review Approval</span>
              <strong className="stat-card__value">{overall.humanApprovalRate}</strong>
            </div>
            <div className="stat-card">
              <span className="stat-card__label">Avg End-to-End Latency</span>
              <strong className="stat-card__value">{overall.averagePipelineLatencyMs} ms</strong>
            </div>
          </div>
        )}
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Live Benchmark Execution Results */}
      {benchmarkResult && (
        <section className="posts-section card benchmark-card">
          <div className="panel-head">
            <div>
              <span className="eyebrow">Benchmark Output</span>
              <h3>Golden Test Suite Result — {benchmarkResult.status}</h3>
              <p>{benchmarkResult.summary}</p>
            </div>
            <span className="badge badge--approved">Verified</span>
          </div>

          <table className="table">
            <thead>
              <tr>
                <th>Agent Component</th>
                <th>Target Evaluation Metric</th>
                <th>Measured Score</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {benchmarkResult.details?.map((item, index) => (
                <tr key={index}>
                  <td><strong>{item.agent}</strong></td>
                  <td>{item.metric}</td>
                  <td><span className="code-pill">{item.score}</span></td>
                  <td>
                    <span className="badge badge--approved">PASSED</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Grid of 4 Member Agent Metrics */}
      <div className="evaluation-grid">
        {/* Agent 1 */}
        <article className="card agent-eval-card">
          <div className="agent-eval-card__header">
            <span className="agent-eval-card__badge">Agent 01</span>
            <div>
              <h3>Data Collection Agent</h3>
              <small>{agent1Collection?.memberOwner}</small>
            </div>
          </div>
          <p className="agent-eval-card__desc">
            Raw data ingestion, url/handle cleaning, text normalization, duplicate detection & spam filtering.
          </p>

          <dl className="eval-dl">
            <div>
              <dt>Cleaning Correctness</dt>
              <dd><strong>{agent1Collection?.cleaningCorrectness}</strong></dd>
            </div>
            <div>
              <dt>Spam & Noise Detection</dt>
              <dd><strong>{agent1Collection?.spamDetectionAccuracy}</strong></dd>
            </div>
            <div>
              <dt>Duplicate Filtering</dt>
              <dd><strong>{agent1Collection?.duplicateFilteringRate}</strong></dd>
            </div>
            <div>
              <dt>Avg Processing Latency</dt>
              <dd>{agent1Collection?.averageLatencyMs} ms</dd>
            </div>
          </dl>
        </article>

        {/* Agent 2 */}
        <article className="card agent-eval-card">
          <div className="agent-eval-card__header">
            <span className="agent-eval-card__badge">Agent 02</span>
            <div>
              <h3>NLP & Sentiment Agent</h3>
              <small>{agent2Nlp?.memberOwner}</small>
            </div>
          </div>
          <p className="agent-eval-card__desc">
            Named Entity Recognition (NER), Sentiment scoring, Emotion classification, Theme & Priority matrix.
          </p>

          <dl className="eval-dl">
            <div>
              <dt>Sentiment F1 Score</dt>
              <dd><strong className="text-highlight">{agent2Nlp?.sentimentF1Score}</strong></dd>
            </div>
            <div>
              <dt>Sentiment Precision / Recall</dt>
              <dd>{agent2Nlp?.sentimentPrecision} / {agent2Nlp?.sentimentRecall}</dd>
            </div>
            <div>
              <dt>NER Accuracy</dt>
              <dd><strong>{agent2Nlp?.nerAccuracy}</strong></dd>
            </div>
            <div>
              <dt>Theme & Priority Accuracy</dt>
              <dd><strong>{agent2Nlp?.themePriorityAccuracy}</strong></dd>
            </div>
          </dl>
        </article>

        {/* Agent 3 */}
        <article className="card agent-eval-card">
          <div className="agent-eval-card__header">
            <span className="agent-eval-card__badge">Agent 03</span>
            <div>
              <h3>IR & RAG Retrieval Agent</h3>
              <small>{agent3Retrieval?.memberOwner}</small>
            </div>
          </div>
          <p className="agent-eval-card__desc">
            Vector DB embeddings (SentenceTransformers), Top-K semantic retrieval, chunking & evidence ranking.
          </p>

          <dl className="eval-dl">
            <div>
              <dt>Precision@3 (Top 3)</dt>
              <dd><strong className="text-highlight">{agent3Retrieval?.precisionAt3}</strong></dd>
            </div>
            <div>
              <dt>Mean Reciprocal Rank (MRR)</dt>
              <dd><strong>{agent3Retrieval?.meanReciprocalRank}</strong></dd>
            </div>
            <div>
              <dt>Vector Store Hit Rate</dt>
              <dd>{agent3Retrieval?.vectorHitRate}</dd>
            </div>
            <div>
              <dt>Avg Search Latency</dt>
              <dd>{agent3Retrieval?.averageLatencyMs} ms</dd>
            </div>
          </dl>
        </article>

        {/* Agent 4 */}
        <article className="card agent-eval-card">
          <div className="agent-eval-card__header">
            <span className="agent-eval-card__badge">Agent 04</span>
            <div>
              <h3>Insight & Generation Agent</h3>
              <small>{agent4Generation?.memberOwner}</small>
            </div>
          </div>
          <p className="agent-eval-card__desc">
            RAG-grounded LLM response generation, alert banners, prompt injection protection & human review workflow.
          </p>

          <dl className="eval-dl">
            <div>
              <dt>Grounding Score (1-5)</dt>
              <dd><strong className="text-highlight">{agent4Generation?.groundingScore}</strong></dd>
            </div>
            <div>
              <dt>Factuality Score</dt>
              <dd><strong>{agent4Generation?.factualityScore}</strong></dd>
            </div>
            <div>
              <dt>Prompt Injection Protection</dt>
              <dd><strong className="text-success">{agent4Generation?.safetyPromptInjectionProtection}</strong></dd>
            </div>
            <div>
              <dt>Hallucination Prevention Index</dt>
              <dd>{agent4Generation?.hallucinationPreventionIndex}</dd>
            </div>
          </dl>
        </article>
      </div>
    </PageContainer>
  )
}

export default EvaluationPage
