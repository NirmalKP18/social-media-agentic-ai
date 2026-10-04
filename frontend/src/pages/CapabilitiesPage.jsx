import { Link } from 'react-router-dom'
import PageContainer from '../components/common/PageContainer.jsx'
import Icon from '../components/common/Icon.jsx'
import { ROUTES } from '../constants/routes.js'

const AGENT_PIPELINE = [
  {
    step: 'Agent 01',
    name: 'Collection & Ingestion Agent',
    badge: 'Async Queue & Deduplication',
    desc: 'Ingests social posts, reels, video captions, comment threads, reply hierarchies, like counts, and shares across multi-platform sources.',
    tech: 'FastAPI • Pydantic • Normalization & Deduplication',
    color: '#0ea5e9',
    icon: 'collection',
  },
  {
    step: 'Agent 02',
    name: 'NLP & Emotion Extraction Agent',
    badge: 'Dual-Layer Sentiment & Emotion',
    desc: 'Scores post sentiment from -1.0 to +1.0, tags 8 fundamental emotions (Joy, Trust, Fear, Anger, Surprise, Sadness, Disgust, Anticipation), and performs Named Entity Recognition (NER).',
    tech: 'Sentiment • Intent • Emotion • Entity Extraction',
    color: '#8b5cf6',
    icon: 'brain',
  },
  {
    step: 'Agent 03',
    name: 'Vector RAG Indexing Agent',
    badge: 'Semantic Evidence Retrieval',
    desc: 'Generates high-dimensional vector embeddings for all posts, captions, and comments. Enables instant semantic retrieval and historical cluster matching.',
    tech: 'SentenceTransformers • Cosine Similarity • Vector Index',
    color: '#10b981',
    icon: 'retrieval',
  },
  {
    step: 'Agent 04',
    name: 'Grounded PR & Report Agent',
    badge: 'Grounded Synthesis & Defense',
    desc: 'Synthesizes executive reports, anomaly warnings, and grounded PR response statements backed by post citations with strict prompt injection guardrails.',
    tech: 'Gemini or Local Fallback • Evidence Context • Guardrails',
    color: '#f95738',
    icon: 'insights',
  },
]

const CAPABILITY_LIST = [
  {
    icon: 'collection',
    title: 'Posts & Caption Ingestion',
    desc: 'Collect posts, video descriptions, and comment hierarchies with automated bot filtering and metadata normalization.',
  },
  {
    icon: 'brain',
    title: 'Granular Sentiment & Emotion',
    desc: 'Deep NLP sentiment scoring with granular emotion probability breakdowns across audience reactions.',
  },
  {
    icon: 'retrieval',
    title: 'SentenceTransformers Vector RAG',
    desc: 'Semantic queries across historical comments and approved knowledge using local embeddings with lexical fallback.',
  },
  {
    icon: 'shield',
    title: 'Prompt Injection Defense',
    desc: 'Multi-layer security layer protecting your PR responses and agent reasoning from adversarial prompt manipulation.',
  },
  {
    icon: 'insights',
    title: 'Executive PDF & Trend Briefs',
    desc: 'Automated executive insight generators that turn raw engagement noise into clean, polished strategic recommendations.',
  },
  {
    icon: 'settings',
    title: 'Enterprise RBAC & Audit Trails',
    desc: 'JWT security with Admin / Analyst roles, detailed step-by-step agent execution logs, and live system health monitoring.',
  },
]

function CapabilitiesPage() {
  return (
    <PageContainer>
      <div className="landing-page public-detail-page public-capabilities-page">
        {/* Header */}
        <div className="section-header public-detail-hero">
          <span className="section-tag">
            <Icon name="bolt" size={14} /> Technical Architecture
          </span>
          <h1 className="section-title">Platform Capabilities &amp; Multi-Agent AI</h1>
          <p className="section-subtitle">
            A governed multi-agent intelligence architecture for structured post, comment, and sentiment evaluation.
          </p>
          <div className="public-detail-hero__trust">
            <span><Icon name="shield" size={14} /> Human approval</span>
            <span><Icon name="knowledge" size={14} /> Source-grounded output</span>
            <span><Icon name="logs" size={14} /> Traceable agent runs</span>
          </div>
        </div>

        {/* Metrics Overview */}
        <section className="metrics-strip">
          <div className="metric-box">
            <strong>6 signals</strong>
            <small>Sentiment, emotion, intent, priority, entities &amp; topics</small>
          </div>
          <div className="metric-box">
            <strong>Hybrid RAG</strong>
            <small>Semantic embeddings with lexical fallback</small>
          </div>
          <div className="metric-box">
            <strong>4 Agents</strong>
            <small>Autonomous Collaborative Network</small>
          </div>
          <div className="metric-box">
            <strong>Human review</strong>
            <small>Approval required before any response action</small>
          </div>
        </section>

        {/* 4-Agent Pipeline Workflow */}
        <section className="landing-section">
          <div className="section-header">
            <span className="section-tag"><Icon name="dashboard" size={14} /> Autonomous Workflow</span>
            <h2>The 4-Agent Sequential Pipeline</h2>
            <p>Every post and comment flows through specialized agents for traceable, evidence-grounded intelligence.</p>
          </div>

          <div className="capability-agent-grid">
            {AGENT_PIPELINE.map((agent) => (
              <div
                key={agent.step}
                className="demo-card capability-agent-card"
                style={{ '--agent-color': agent.color }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: agent.color, textTransform: 'uppercase', letterSpacing: '.08em' }}>
                    {agent.step}
                  </span>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#f1f5f9', display: 'grid', placeItems: 'center', color: agent.color }}>
                    <Icon name={agent.icon} size={18} />
                  </div>
                </div>

                <h3 style={{ fontSize: '1.2rem', color: '#0f172a', marginBottom: '8px', fontWeight: 800 }}>
                  {agent.name}
                </h3>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '3px 8px', borderRadius: '6px', width: 'fit-content', marginBottom: '14px' }}>
                  {agent.badge}
                </span>

                <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '20px', flex: 1 }}>
                  {agent.desc}
                </p>

                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px', fontSize: '0.78rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                  {agent.tech}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Feature Grid */}
        <section className="landing-section">
          <div className="section-header">
            <span className="section-tag"><Icon name="sparkles" size={14} /> Full Feature Matrix</span>
            <h2>Built for Deep Social Reaction Understanding</h2>
            <p>Explore the complete suite of analytical, security, and reporting capabilities.</p>
          </div>

          <div className="features-grid">
            {CAPABILITY_LIST.map((feat) => (
              <div key={feat.title} className="feature-card">
                <div className="feature-icon-box">
                  <Icon name={feat.icon} size={24} />
                </div>
                <h3>{feat.title}</h3>
                <p>{feat.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="landing-section">
          <div className="landing-cta-banner">
            <div className="cta-banner__content">
              <h2>Experience the 4-Agent Pipeline Today</h2>
              <p>Test your live posts, captions, and comments in the intelligence workspace.</p>
              <div className="cta-buttons">
                <Link to={ROUTES.register} className="btn-large-primary">
                  Start Free Analysis <span>→</span>
                </Link>
                <Link to={ROUTES.preview} className="btn-large-ghost">
                  Explore Sandbox Demo
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PageContainer>
  )
}

export default CapabilitiesPage
