import { useEffect, useState } from 'react'
import Icon from '../common/Icon.jsx'

const AGENTS = [
  {
    core: 'CORE-01',
    system: 'INTAKE TURBINE',
    name: 'Collection Agent',
    description: 'Data Ingestion & Cleaning',
    activeText: 'Collecting and sanitizing social mentions',
    completeText: 'Stage completed successfully',
    icon: 'engineIngest',
  },
  {
    core: 'CORE-02',
    system: 'NEURAL MATRIX',
    name: 'NLP Intelligence Agent',
    description: 'NER & Sentiment Classification',
    activeText: 'Scoring sentiment, intent and entities',
    completeText: 'Language signals classified',
    icon: 'engineNlp',
  },
  {
    core: 'CORE-03',
    system: 'VECTOR REACTOR',
    name: 'Retrieval / RAG Agent',
    description: 'Semantic Evidence Search',
    activeText: 'Retrieving verified brand evidence',
    completeText: 'Grounding evidence retrieved',
    icon: 'engineRag',
  },
  {
    core: 'CORE-04',
    system: 'SYNTHESIS CORE',
    name: 'Generation Agent',
    description: 'Grounded Insight & Draft PR',
    activeText: 'Synthesizing grounded recommendations',
    completeText: 'Insight and response draft ready',
    icon: 'engineSynthesis',
  },
]

function PublicPipelineDemo() {
  const [activeAgent, setActiveAgent] = useState(0)

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) return undefined

    const timer = window.setInterval(() => {
      setActiveAgent((current) => (current + 1) % AGENTS.length)
    }, 2600)

    return () => window.clearInterval(timer)
  }, [])

  return (
    <section className="public-pipeline-demo" aria-labelledby="pipeline-demo-title">
      <header className="public-pipeline-demo__header">
        <div>
          <h2 id="pipeline-demo-title">How the Agent Pipeline Works</h2>
          <p>A slow looping demonstration of one mention moving through all four intelligence agents.</p>
        </div>
        <span className="public-pipeline-demo__badge">
          <span aria-hidden="true" /> Live process demo
        </span>
      </header>

      <div className="public-pipeline-demo__track">
        {AGENTS.map((agent, index) => {
          const state = index < activeAgent ? 'complete' : index === activeAgent ? 'active' : 'standby'
          const status = state === 'complete' ? 'Synced' : state === 'active' ? 'Active engine' : 'Standby'
          const detail = state === 'complete'
            ? agent.completeText
            : state === 'active'
              ? agent.activeText
              : 'Waiting for agent handoff'

          return (
            <article
              className={`pipeline-demo-agent pipeline-demo-agent--${state}`}
              key={agent.core}
              aria-current={state === 'active' ? 'step' : undefined}
            >
              <div className="pipeline-demo-agent__topline">
                <span className="pipeline-demo-agent__core"><b>{agent.core}</b> {agent.system}</span>
                <span className="pipeline-demo-agent__status"><i aria-hidden="true" />{status}</span>
              </div>

              <div className="pipeline-demo-agent__identity">
                <span className="pipeline-demo-agent__icon"><Icon name={agent.icon} size={22} /></span>
                <span>
                  <strong>{agent.name}</strong>
                  <small>{agent.description}</small>
                </span>
              </div>

              <div className="pipeline-demo-agent__progress" aria-hidden="true">
                <span />
              </div>
              <p>{detail}</p>
            </article>
          )
        })}
      </div>
      <span className="sr-only" aria-live="polite">{AGENTS[activeAgent].name} is processing the mention.</span>
    </section>
  )
}

export default PublicPipelineDemo
