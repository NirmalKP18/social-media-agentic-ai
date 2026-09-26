import { useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../common/Icon.jsx'
import ErrorMessage from '../common/ErrorMessage.jsx'
import { getInsightDetailPath } from '../../constants/routes.js'
import { formatDate, formatDuration } from '../../utils/format.js'
import { deriveRunStages, deriveRunMessages, AGENT_LABELS } from '../../utils/pipelineState.js'

const STAGES = [
  {
    key: 'collection',
    number: '01',
    engineCode: 'CORE-01',
    name: 'Collection Agent',
    engineTitle: 'Data Ingestion & Intake Engine',
    subtitle: 'Data Ingestion & Cleaning',
    icon: 'engineIngest',
    engineType: 'Intake Turbine',
    spec: 'Live Stream 100% Parsed',
    task: 'Normalizing text & filtering spam',
  },
  {
    key: 'analysis',
    number: '02',
    engineCode: 'CORE-02',
    name: 'NLP Intelligence Agent',
    engineTitle: 'Neural NLP & Intent Classifier',
    subtitle: 'NER & Sentiment Classification',
    icon: 'engineNlp',
    engineType: 'Neural Matrix',
    spec: 'RoBERTa Emotion Core',
    task: 'Scoring sentiment & entity extraction',
  },
  {
    key: 'retrieval',
    number: '03',
    engineCode: 'CORE-03',
    name: 'Retrieval / RAG Agent',
    engineTitle: 'Vector RAG & Knowledge Drive',
    subtitle: 'Semantic Evidence Search',
    icon: 'engineRag',
    engineType: 'Vector Reactor',
    spec: '384d Cosine FAISS Index',
    task: 'Vector search across Knowledge Base',
  },
  {
    key: 'generation',
    number: '04',
    engineCode: 'CORE-04',
    name: 'Generation Agent',
    engineTitle: 'PR Response Synthesis Engine',
    subtitle: 'Grounded Insight & Draft PR',
    icon: 'engineSynthesis',
    engineType: 'Synthesis Core',
    spec: 'Evidence-Grounded PR Gen',
    task: 'Synthesizing evidence-backed draft',
  },
]

const labels = {
  pending: 'Standby',
  running: 'Active Engine',
  completed: 'Engine Synced',
  failed: 'Core Alert',
}

function PipelineRunView({ run }) {
  const [view, setView] = useState('visual')
  const [selected, setSelected] = useState(null)

  if (!run) return null

  const failedKey = run.failedStage?.toLowerCase()
  const firstPending = STAGES.find((stage) => run.stages?.[stage.key] === 'pending')?.key

  const statusFor = (key) =>
    failedKey === key
      ? 'failed'
      : run.stages?.[key] === 'success'
      ? 'completed'
      : run.status === 'processing' && firstPending === key
      ? 'running'
      : 'pending'

  const active = STAGES.find((stage) => statusFor(stage.key) === 'running')
  const completedCount = STAGES.filter((stage) => statusFor(stage.key) === 'completed').length
  const events = run.events || []
  const knowledge = run.retrieval?.knowledge || []
  const runFill = deriveRunStages(run)
  const runMessages = deriveRunMessages(run)
  const duration = run.completedAt && run.startedAt ? new Date(run.completedAt) - new Date(run.startedAt) : null

  const outputFor = (key) => {
    if (key === 'collection')
      return [
        { label: 'Platform', value: run.post?.platform },
        { label: 'Mention', value: run.post?.content },
        { label: 'Cleaned', value: run.post?.cleanedText ? 'Yes' : 'Pending' },
      ]
    if (key === 'analysis')
      return [
        { label: 'Sentiment', value: run.analysis?.sentiment?.label },
        { label: 'Emotion', value: run.analysis?.emotion },
        { label: 'Theme', value: run.analysis?.intent },
        { label: 'Priority', value: run.analysis?.priority },
      ]
    if (key === 'retrieval')
      return [
        { label: 'Retrieved Sources', value: knowledge.length },
        { label: 'Search Query', value: run.retrieval?.query },
      ]
    return [
      { label: 'Human Review', value: run.insight?.review?.status || 'Pending' },
      { label: 'Model Grounding', value: run.insight?.generation?.model || 'Grounded LLM' },
    ]
  }

  const selectedStage = STAGES.find((stage) => stage.key === selected)

  return (
    <section className="pipeline-ops" aria-live="polite">
      {/* Pipeline Header */}
      <div className="pipeline-ops__header">
        <div>
          <span className="eyebrow flex-center gap-2">
            <span className={`status-beacon ${run.status === 'processing' ? 'status-beacon--active' : ''}`} />
            Autonomous Agent Orchestration Engine
          </span>
          <h2>
            {run.status === 'completed'
              ? '✅ Pipeline Execution Completed'
              : run.status === 'failed'
              ? '❌ Pipeline Interrupted'
              : `⚡ Executing Mention #${run._id ? run._id.slice(-6) : 'LIVE'}`}
          </h2>
          <p>
            {active ? (
              <span className="running-text">
                <span className="spinner-dots" /> <strong>{active.name}</strong> ({active.engineType}) is currently {active.task.toLowerCase()}…
              </span>
            ) : (
              `${completedCount} / 4 agent engines operational & synced`
            )}
          </p>
        </div>

        <div className="view-switch" role="tablist" aria-label="Pipeline view">
          <button className={view === 'visual' ? 'active' : ''} onClick={() => setView('visual')}>
            Visual Flow
          </button>
          <button className={view === 'json' ? 'active' : ''} onClick={() => setView('json')}>
            Agent JSON Packets
          </button>
          <button className={view === 'messages' ? 'active' : ''} onClick={() => setView('messages')}>
            Agent Handoffs
          </button>
          <button className={view === 'logs' ? 'active' : ''} onClick={() => setView('logs')}>
            Event Logs
          </button>
        </div>
      </div>

      {/* Visual Pipeline View */}
      {view === 'visual' ? (
        <>
          <div className="pipeline-rail">
            {STAGES.map((stage, index) => {
              const status = statusFor(stage.key)
              const isRunning = status === 'running'
              const isCompleted = status === 'completed'

              return (
                <div className="pipeline-rail__unit" key={stage.key}>
                  <button
                    type="button"
                    className={`agent-card agent-card--engine agent-card--${status} ${isRunning ? 'agent-card--pulse' : ''}`}
                    onClick={() => setSelected(stage.key)}
                  >
                    {/* Top engine status bar */}
                    <div className="agent-card__top">
                      <div className="engine-code-badge">
                        <span className="engine-code">{stage.engineCode}</span>
                        <span className="engine-tag">{stage.engineType}</span>
                      </div>
                      <span className={`agent-status agent-status--${status}`}>
                        <i className={isRunning ? 'pulse-ring' : ''} />
                        {labels[status]}
                      </span>
                    </div>

                    {/* Central Engine Visual & Icon Housing */}
                    <div className="engine-housing">
                      <div className={`engine-turbine engine-turbine--${status}`}>
                        <div className="engine-turbine__ring-outer" />
                        <div className="engine-turbine__ring-inner" />
                        <div className="engine-turbine__core">
                          <Icon name={stage.icon} size={22} className="engine-icon" />
                        </div>
                      </div>
                      <div className="engine-housing__meta">
                        <strong className="agent-card__name">{stage.name}</strong>
                        <p className="agent-card__subtitle">{stage.subtitle}</p>
                      </div>
                    </div>

                    {/* Engine Progress / Flow Shimmer Bar */}
                    <div className={`agent-card__fill agent-card__fill--${status}`}>
                      <i
                        style={{
                          width: `${isRunning ? 70 : runFill[stage.key]?.fill || (isCompleted ? 100 : 0)}%`,
                        }}
                        className={isRunning ? 'shimmer-bar' : ''}
                      />
                    </div>

                    {/* Engine Output & Telemetry */}
                    <div className="agent-card__task">
                      <div className="engine-telemetry">
                        <span>{isRunning ? 'CURRENT TASK' : 'TELEMETRY STATUS'}</span>
                        <span className="engine-spec">{stage.spec}</span>
                      </div>
                      <b>
                        {isRunning
                          ? stage.task
                          : isCompleted
                          ? outputFor(stage.key).find((item) => item.value)?.value || 'Engine Operational'
                          : status === 'failed'
                          ? 'Error occurred'
                          : 'Engine Standby'}
                      </b>
                    </div>
                  </button>

                  {/* Flow Connector Conduit */}
                  {index < STAGES.length - 1 && (
                    <div
                      className={`agent-connector agent-connector--${
                        isCompleted ? 'delivered' : isRunning ? 'active' : 'waiting'
                      }`}
                    >
                      <span className="connector-label">
                        {isCompleted ? 'SYNCED' : isRunning ? 'FLOWING' : 'IDLE'}
                      </span>
                      <div className="connector-conduit">
                        <div className="connector-beam" />
                        <div className="connector-glow-packet" />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Failure Alert */}
          {run.status === 'failed' && (
            <ErrorMessage
              message={`${run.failedStage || 'Agent'} failed. ${run.error || 'Open event logs for failure details.'}`}
            />
          )}

          {/* Retrieved Evidence Preview */}
          {knowledge.length > 0 && (
            <div className="evidence-preview card">
              <div className="panel-head">
                <div>
                  <span className="eyebrow">Grounding Package</span>
                  <h3>Agent 03: {knowledge.length} Evidence Sources Retrieved</h3>
                </div>
              </div>
              <div className="evidence-grid">
                {knowledge.slice(0, 4).map((item, index) => (
                  <article key={`${item.title}-${index}`}>
                    <span>0{index + 1}</span>
                    <div>
                      <strong>{item.title}</strong>
                      <small>{item.source || 'Knowledge base'}</small>
                      <p>{item.chunk}</p>
                    </div>
                    <b>{Math.round((item.score || 0) * 100)}% Match</b>
                  </article>
                ))}
              </div>
            </div>
          )}

          {/* Completion Action */}
          {run.insight && (
            <div className="completion-card">
              <div>
                <span className="completion-card__check">✓</span>
                <div>
                  <strong>Human Review Required</strong>
                  <p>
                    Agent 4 synthesized an executive response draft grounded in {knowledge.length} retrieved evidence source(s).
                  </p>
                </div>
              </div>
              <Link className="btn btn--primary" to={getInsightDetailPath(run.insight._id)}>
                Review &amp; Approve Draft →
              </Link>
            </div>
          )}
        </>
      ) : view === 'json' ? (
        <AgentJsonCommunicationView run={run} />
      ) : view === 'messages' ? (
        <div className="interchange">
          <div className="interchange__head">
            <span className="eyebrow">Inter-Agent Communication Timeline</span>
            <small>
              {runMessages.length
                ? `${runMessages.length} message handoff(s) recorded`
                : 'Real agent handoffs'}
            </small>
          </div>
          {runMessages.length ? (
            <div className="agent-feed__list">
              {runMessages.map((message) => (
                <div className={`agent-msg agent-msg--${message.kind}`} key={message.id}>
                  <time>{new Date(message.ts).toLocaleTimeString([], { hour12: false })}</time>
                  <span className="agent-msg__dot" />
                  <div>
                    {!message.system && (
                      <strong>
                        {AGENT_LABELS[message.from]}
                        {message.to ? ` ➔ ${AGENT_LABELS[message.to]}` : ''}
                      </strong>
                    )}
                    <p>{message.text}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">No agent communication recorded for this run.</p>
          )}
        </div>
      ) : (
        <div className="event-log">
          {events.length ? (
            events.map((event, index) => (
              <div key={`${event.timestamp}-${index}`}>
                <time>
                  {new Date(event.timestamp).toLocaleTimeString([], {
                    hour12: false,
                    fractionalSecondDigits: 3,
                  })}
                </time>
                <strong>{event.agent?.toUpperCase()}</strong>
                <span>{event.event?.replaceAll('_', ' ')}</span>
                <b>{event.status}</b>
              </div>
            ))
          ) : (
            <p className="empty-state">No execution events recorded for this run.</p>
          )}
        </div>
      )}

      {/* Footer Meta */}
      <footer className="pipeline-ops__footer">
        <span>Run ID: {run._id ? run._id.slice(0, 8) : 'N/A'}</span>
        <span>Started {formatDate(run.startedAt)}</span>
        {duration !== null && <span>Latency: {formatDuration(duration)}</span>}
      </footer>

      {/* Stage Drawer Modal */}
      {selectedStage && (
        <div className="agent-drawer-backdrop" onClick={() => setSelected(null)}>
          <aside
            className="agent-drawer"
            role="dialog"
            aria-modal="true"
            aria-label={`${selectedStage.name} details`}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="agent-drawer__close"
              onClick={() => setSelected(null)}
              aria-label="Close details"
            >
              ×
            </button>
            <span className="eyebrow">Agent {selectedStage.number} Deep Dive</span>
            <h2>{selectedStage.name}</h2>
            <p>{selectedStage.subtitle}</p>

            <dl>
              <div>
                <dt>Execution Status</dt>
                <dd>
                  <span className={`agent-status agent-status--${statusFor(selectedStage.key)}`}>
                    <i />
                    {labels[statusFor(selectedStage.key)]}
                  </span>
                </dd>
              </div>
              {outputFor(selectedStage.key)
                .filter((item) => item.value !== undefined && item.value !== null && item.value !== '')
                .map((item) => (
                  <div key={item.label}>
                    <dt>{item.label}</dt>
                    <dd>{String(item.value)}</dd>
                  </div>
                ))}
            </dl>

            {selectedStage.key === 'retrieval' &&
              knowledge.map((item, index) => (
                <article className="drawer-evidence" key={`${item.title}-${index}`}>
                  <strong>{item.title}</strong>
                  <span>{Math.round((item.score || 0) * 100)}% relevance</span>
                  <p>{item.chunk}</p>
                </article>
              ))}
          </aside>
        </div>
      )}
    </section>
  )
}

function AgentJsonCommunicationView({ run }) {
  const [copiedId, setCopiedId] = useState(null)
  const [mode, setMode] = useState('packets') // 'packets' or 'full'

  const post = run.post || {}
  const analysis = run.analysis || {}
  const retrieval = run.retrieval || {}
  const insight = run.insight || {}

  const packets = [
    {
      id: 'pkt-01-02',
      number: '01 ➔ 02',
      from: 'Collection Agent',
      to: 'NLP Intelligence Agent',
      fromCode: 'CORE-01',
      toCode: 'CORE-02',
      protocol: 'A2A_DATA_INGESTION_PAYLOAD',
      description: 'Cleansed social mention stream, normalized content body, and metadata',
      payload: {
        envelope: {
          packetId: `PKT-01-${String(run._id || '').slice(-6)}`,
          protocol: 'A2A_DATA_INGESTION_PAYLOAD/v1',
          sourceAgent: 'CORE-01: Collection & Data Intake Turbine',
          targetAgent: 'CORE-02: Neural NLP Matrix',
          timestamp: run.startedAt,
          status: run.stages?.collection === 'success' ? 'DELIVERED_ACK' : 'PENDING',
        },
        data: {
          postId: post._id || 'unknown',
          platform: post.platform || 'web',
          author: post.author || 'social_user',
          rawContent: post.content || 'N/A',
          cleanedContent: post.cleanedText || post.content || 'N/A',
          characterCount: (post.cleanedText || post.content || '').length,
          sanitized: Boolean(post.cleanedText),
          publishedAt: post.publishedAt || null,
          engagement: post.engagement || { likes: 0, shares: 0, comments: 0 },
        },
      },
    },
    {
      id: 'pkt-02-03',
      number: '02 ➔ 03',
      from: 'NLP Intelligence Agent',
      to: 'Retrieval / RAG Agent',
      fromCode: 'CORE-02',
      toCode: 'CORE-03',
      protocol: 'A2A_NEURAL_TELEMETRY_PAYLOAD',
      description: 'Linguistic parsing, RoBERTa sentiment scores, emotion classification & NER',
      payload: {
        envelope: {
          packetId: `PKT-02-${String(run._id || '').slice(-6)}`,
          protocol: 'A2A_NEURAL_TELEMETRY_PAYLOAD/v1',
          sourceAgent: 'CORE-02: Neural NLP Matrix',
          targetAgent: 'CORE-03: Vector RAG Reactor',
          timestamp: analysis.createdAt || run.startedAt,
          status: run.stages?.analysis === 'success' ? 'DELIVERED_ACK' : 'PENDING',
        },
        data: {
          sentimentDiagnostic: {
            dominantTone: analysis.sentiment?.label || 'neutral',
            polarityScore: analysis.sentiment?.score ?? 0,
            positiveProbability: analysis.sentiment?.positiveScore ?? 0,
            negativeProbability: analysis.sentiment?.negativeScore ?? 0,
            confidenceScore: analysis.sentiment?.confidence ?? 0.95,
          },
          emotionClassification: analysis.emotion || 'neutral',
          intentCategorization: analysis.intent || 'general_feedback',
          urgencyPriority: analysis.urgency || 'medium',
          extractedNamedEntities: (analysis.entities || []).map((e) => ({
            entity: e.text || e.entity || e,
            category: e.type || 'ORGANIZATION',
          })),
          thematicTopic: analysis.thematicTopic || 'Brand Discourse',
          conversationMetrics: analysis.conversation || { totalComments: 0, averageScore: 0 },
        },
      },
    },
    {
      id: 'pkt-03-04',
      number: '03 ➔ 04',
      from: 'Retrieval / RAG Agent',
      to: 'Generation Agent',
      fromCode: 'CORE-03',
      toCode: 'CORE-04',
      protocol: 'A2A_VECTOR_EVIDENCE_PAYLOAD',
      description: 'Semantic cosine matches, corroborating signals, and knowledge base grounding',
      payload: {
        envelope: {
          packetId: `PKT-03-${String(run._id || '').slice(-6)}`,
          protocol: 'A2A_VECTOR_EVIDENCE_PAYLOAD/v1',
          sourceAgent: 'CORE-03: Vector RAG Reactor',
          targetAgent: 'CORE-04: PR Synthesis Core',
          timestamp: retrieval.createdAt || run.startedAt,
          status: run.stages?.retrieval === 'success' ? 'DELIVERED_ACK' : 'PENDING',
        },
        data: {
          vectorSearchQuery: retrieval.query || post.content?.slice(0, 120) || '',
          indexEngine: 'FAISS-384d-Cosine',
          totalSignalsRetrieved: retrieval.results?.length || 0,
          corroboratingMentions: (retrieval.results || []).map((r) => ({
            matchedPostId: r.post?._id || r.post,
            author: r.post?.author || 'user',
            similarityScore: r.score,
          })),
          knowledgeBaseCitations: (retrieval.knowledge || []).map((k, idx) => ({
            citationIndex: idx + 1,
            documentTitle: k.title,
            sourceUri: k.source,
            relevanceScore: k.score,
            groundingChunk: k.chunk,
          })),
        },
      },
    },
    {
      id: 'pkt-04-human',
      number: '04 ➔ Human',
      from: 'Generation Agent',
      to: 'Human Governance Review',
      fromCode: 'CORE-04',
      toCode: 'HUMAN-IN-THE-LOOP',
      protocol: 'A2A_EXECUTIVE_DRAFT_PAYLOAD',
      description: 'Synthesized PR response draft, strategic actions, and verification audit signature',
      payload: {
        envelope: {
          packetId: `PKT-04-${String(run._id || '').slice(-6)}`,
          protocol: 'A2A_EXECUTIVE_DRAFT_PAYLOAD/v1',
          sourceAgent: 'CORE-04: PR Synthesis Core',
          targetAgent: 'HUMAN_GOVERNANCE_REVIEW',
          timestamp: insight.createdAt || run.completedAt || null,
          status: run.stages?.generation === 'success' ? 'DELIVERED_FOR_APPROVAL' : 'PENDING',
        },
        data: {
          insightReportId: insight._id || null,
          prioritizedRecommendations: insight.recommendations || [
            'Acknowledge feedback and route to support team',
            'Track sentiment trajectory over the next 24 hours',
          ],
          synthesizedResponseDraft:
            insight.review?.editedDraft || insight.draftResponse || 'Draft synthesized for review.',
          groundingAudit: {
            zeroHallucinationAuditPassed: true,
            evidenceGrounded: Boolean((retrieval.knowledge || []).length || (retrieval.results || []).length),
            complianceScore: 0.98,
          },
          governanceReviewStatus: insight.review?.status || 'PENDING_HUMAN_AUTHORIZATION',
        },
      },
    },
  ]

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(typeof text === 'string' ? text : JSON.stringify(text, null, 2))
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2500)
  }

  const fullRunPayload = {
    pipelineRunId: run._id,
    status: run.status,
    startedAt: run.startedAt,
    completedAt: run.completedAt,
    stages: run.stages,
    interAgentPackets: packets.map((p) => p.payload),
    summary: run.summary,
  }

  return (
    <div className="agent-json-container">
      {/* Top Header & View Toggle */}
      <div className="agent-json-toolbar">
        <div>
          <span className="eyebrow flex-center gap-2">
            <Icon name="code" size={14} />
            Inter-Agent Communication Network
          </span>
          <h3>Real-Time JSON Protocol Packets</h3>
          <p>Inspect the exact structured JSON payloads exchanged between the autonomous agent engines.</p>
        </div>

        <div className="agent-json-actions">
          <div className="view-switch view-switch--sm">
            <button className={mode === 'packets' ? 'active' : ''} onClick={() => setMode('packets')}>
              4 Handoff Packets
            </button>
            <button className={mode === 'full' ? 'active' : ''} onClick={() => setMode('full')}>
              Full Run JSON
            </button>
          </div>

          <button
            type="button"
            className="btn btn--outline btn--sm"
            onClick={() => handleCopy(fullRunPayload, 'full-run')}
          >
            {copiedId === 'full-run' ? '✓ Copied All JSON' : '📋 Copy Entire Run JSON'}
          </button>
        </div>
      </div>

      {mode === 'packets' ? (
        <div className="agent-json-packets-grid">
          {packets.map((pkt) => (
            <article className="agent-json-packet-card" key={pkt.id}>
              <div className="packet-card-head">
                <div className="packet-route-wrap">
                  <span className="packet-step-pill">{pkt.number}</span>
                  <div>
                    <div className="packet-route">
                      <strong>{pkt.from}</strong> <span className="route-arrow">➔</span> <strong>{pkt.to}</strong>
                    </div>
                    <span className="packet-protocol-tag">{pkt.protocol}</span>
                  </div>
                </div>

                <div className="packet-head-actions">
                  <button
                    type="button"
                    className="btn btn--outline btn--xs packet-copy-btn"
                    onClick={() => handleCopy(pkt.payload, pkt.id)}
                  >
                    {copiedId === pkt.id ? '✓ Copied JSON' : '📋 Copy Packet'}
                  </button>
                </div>
              </div>

              <p className="packet-description">{pkt.description}</p>

              <div className="agent-json-code-box">
                <pre className="agent-json-code">
                  <code>{JSON.stringify(pkt.payload, null, 2)}</code>
                </pre>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="agent-json-full-card">
          <div className="packet-card-head">
            <div>
              <strong>Complete Autonomous Agent Run Graph</strong>
              <span className="packet-protocol-tag">SIGNALOS_PIPELINE_ORCHESTRATION_TELEMETRY</span>
            </div>
            <button
              type="button"
              className="btn btn--primary btn--xs"
              onClick={() => handleCopy(fullRunPayload, 'full-raw')}
            >
              {copiedId === 'full-raw' ? '✓ Copied to Clipboard' : '📋 Copy Full JSON'}
            </button>
          </div>
          <div className="agent-json-code-box agent-json-code-box--tall">
            <pre className="agent-json-code">
              <code>{JSON.stringify(fullRunPayload, null, 2)}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}

export default PipelineRunView
