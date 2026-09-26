export const AGENT_LABELS = {
  collection: 'Collection Agent',
  analysis: 'NLP Intelligence Agent',
  nlp: 'NLP Intelligence Agent',
  retrieval: 'Retrieval / RAG Agent',
  insight: 'Generation Agent',
  generation: 'Generation Agent',
  human_review: 'Human review',
  system: 'System',
}

const FILL_FALLBACK_MS = 1200

const jobStageKey = { collecting: 'collection', analyzing: 'nlp', retrieving: 'retrieval', generating: 'insight' }

const parse = (value) => (value ? Date.parse(value) : null)

const median = (values) => {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

export function deriveJobStages(job, order = ['collection', 'nlp', 'retrieval', 'insight']) {
  const transitions = job?.transitions || []
  const present = []
  transitions.forEach((entry) => {
    const key = jobStageKey[entry.status]
    if (key && !present.some((item) => item.key === key)) present.push({ key, entry })
  })

  const durations = []
  present.forEach((item, index) => {
    const start = parse(item.entry.at)
    const nextEntry = present[index + 1]
    const end = nextEntry ? parse(nextEntry.entry.at) : job?.finished_at ? parse(job.finished_at) : null
    if (end !== null && start !== null && end >= start) durations.push(end - start)
  })

  const failed = job?.status === 'failed'
  const completed = job?.status === 'completed'

  const stages = {}
  order.forEach((key) => {
    const item = present.find((candidate) => candidate.key === key) || null
    if (!item) {
      stages[key] = { status: 'pending', fill: 0, startedAt: null, duration: null }
      return
    }
    const start = parse(item.entry.at)
    const index = present.indexOf(item)
    const nextEntry = present[index + 1] ? parse(present[index + 1].entry.at) : job?.finished_at ? parse(job.finished_at) : null
    const done = nextEntry !== null || completed || failed
    if (done) {
      stages[key] = {
        status: failed && index === present.length - 1 ? 'failed' : 'completed',
        fill: 100,
        startedAt: start,
        duration: nextEntry !== null ? nextEntry - start : null,
      }
    } else {
      stages[key] = { status: 'pending', fill: 0, startedAt: start, duration: null }
    }
  })

  if (job?.stage && !completed && !failed) {
    const activeKey = jobStageKey[job.stage]
    if (activeKey && stages[activeKey]) {
      stages[activeKey].status = 'active'
      const start = stages[activeKey].startedAt
      if (start !== null) {
        const expected = median(durations) || FILL_FALLBACK_MS
        const elapsed = Math.max(0, Date.now() - start)
        stages[activeKey].fill = Math.min(99, Math.round((elapsed / expected) * 100))
      }
    }
  }

  return stages
}

export function deriveRunStages(run, order = ['collection', 'analysis', 'retrieval', 'generation']) {
  const normalizeKey = (agent) => (agent === 'nlp' ? 'analysis' : agent === 'insight' || agent === 'generation' ? 'generation' : agent)
  const events = run?.events || []
  const started = {}
  const completed = {}
  events.forEach((event) => {
    const key = normalizeKey(event.agent)
    if (!key) return
    if (event.event === 'AGENT_STARTED') started[key] = parse(event.timestamp)
    if (event.event === 'AGENT_COMPLETED') completed[key] = parse(event.timestamp)
  })

  const durations = order
    .map((key) => (started[key] !== undefined && completed[key] !== undefined ? completed[key] - started[key] : null))
    .filter((value) => value !== null && value >= 0)

  const stages = {}
  order.forEach((key) => {
    const start = started[key]
    const end = completed[key]
    if (end !== undefined) {
      stages[key] = { status: 'completed', fill: 100, startedAt: start, duration: end - (start || 0) }
    } else if (start !== undefined) {
      const expected = median(durations) || FILL_FALLBACK_MS
      const elapsed = Math.max(0, Date.now() - start)
      stages[key] = { status: 'running', fill: Math.min(99, Math.round((elapsed / expected) * 100)), startedAt: start, duration: null }
    } else {
      stages[key] = { status: 'pending', fill: 0, startedAt: null, duration: null }
    }
  })
  return stages
}

export function deriveRunMessages(run) {
  const events = (run?.events || [])
    .map((event) => ({ ...event, at: parse(event.timestamp) }))
    .filter((event) => event.at !== null)
    .sort((a, b) => a.at - b.at)
  const messages = []
  events.forEach((event) => {
    const agent = AGENT_LABELS[event.agent] ? event.agent : null
    const ts = event.at
    if (event.event === 'AGENT_STARTED' && agent) {
      messages.push({ id: `start-${ts}-${event.agent}`, ts, kind: 'start', from: agent, text: `${AGENT_LABELS[agent]} started processing` })
    } else if (event.event === 'AGENT_COMPLETED' && agent) {
      messages.push({ id: `done-${ts}-${event.agent}`, ts, kind: 'completed', from: agent, text: `${AGENT_LABELS[agent]} finished processing` })
    } else if (event.event === 'MESSAGE_TRANSFERRED' && agent) {
      const recipient = AGENT_LABELS[event.recipient] ? event.recipient : null
      messages.push({
        id: `handoff-${ts}-${event.agent}`,
        ts,
        kind: 'handoff',
        from: agent,
        to: recipient,
        text: `${AGENT_LABELS[agent]} transferred results to ${recipient ? AGENT_LABELS[recipient] : 'the next agent'}`,
      })
    } else if (event.event === 'PIPELINE_STARTED') {
      messages.push({ id: `pstart-${ts}`, ts, kind: 'system', system: true, text: 'Pipeline started' })
    } else if (event.event === 'PIPELINE_COMPLETED') {
      messages.push({ id: `pdone-${ts}`, ts, kind: 'system', system: true, text: 'Pipeline completed — draft delivered for human review' })
    } else if (event.event === 'AGENT_FAILED') {
      messages.push({ id: `fail-${ts}-${event.agent}`, ts, kind: 'error', from: event.agent, text: `${AGENT_LABELS[event.agent] || 'Agent'} failed: ${event.message || 'unknown error'}` })
    }
  })
  return messages
}

export function deriveJobMessages(job) {
  const transitions = job?.transitions || []
  const messages = []
  transitions.forEach((entry) => {
    const ts = parse(entry.at)
    if (ts === null) return
    const key = jobStageKey[entry.status]
    if (entry.status === 'failed') {
      messages.push({ id: `fail-${ts}`, ts, kind: 'error', from: key, text: `${AGENT_LABELS[key || 'collection']} failed: ${entry.error || 'unknown error'}` })
      return
    }
    if (key) messages.push({ id: `start-${ts}-${entry.status}`, ts, kind: 'start', from: key, text: `${AGENT_LABELS[key]} started processing` })
    if (entry.status === 'completed') {
      messages.push({ id: `pdone-${ts}`, ts, kind: 'system', system: true, text: 'Pipeline completed — draft delivered for human review' })
    }
  })

  const handoffs = [
    ['collecting', 'analyzing', 'collection', 'nlp'],
    ['analyzing', 'retrieving', 'nlp', 'retrieval'],
    ['retrieving', 'generating', 'retrieval', 'insight'],
    ['generating', 'completed', 'insight', 'human_review'],
  ]
  const reached = new Set(transitions.map((entry) => entry.status))
  handoffs.forEach(([fromStage, toStage, from, to]) => {
    if (!reached.has(toStage)) return
    const at = transitions.find((entry) => entry.status === toStage)?.at
    if (!at) return
    const ts = parse(at)
    if (ts === null) return
    messages.push({ id: `handoff-${ts}-${fromStage}`, ts, kind: 'handoff', from, to, text: `${AGENT_LABELS[from]} transferred results to ${AGENT_LABELS[to]}` })
  })

  if (job?.status === 'completed' && job?.summary) {
    const summary = job.summary
    const at = parse(job.finished_at)
    const facts = [
      summary.posts > 0 && { text: `Collection normalized ${summary.posts} post${summary.posts === 1 ? '' : 's'}` },
      summary.analyses > 0 && { text: `NLP produced ${summary.analyses} analysis${summary.analyses === 1 ? '' : 's'}` },
      summary.evidence > 0 && { text: `Retrieval returned ${summary.evidence} evidence item${summary.evidence === 1 ? '' : 's'}${summary.knowledgeSources ? ` and ${summary.knowledgeSources} knowledge source${summary.knowledgeSources === 1 ? '' : 's'}` : ''}` },
      (summary.insufficientEvidence || summary.knowledgeSources > 0) && { text: summary.insufficientEvidence ? 'Evidence was insufficient — draft flagged for review' : 'Generation produced a grounded, review-ready draft' },
    ].filter(Boolean)
    facts.forEach((fact, index) => {
      if (at === null) return
      messages.push({ id: `fact-${at}-${index}`, ts: at, kind: 'result', system: true, text: fact.text })
    })
  }

  return messages
}