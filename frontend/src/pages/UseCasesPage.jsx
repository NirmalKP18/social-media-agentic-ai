import { useState } from 'react'
import { Link } from 'react-router-dom'
import PageContainer from '../components/common/PageContainer.jsx'
import Icon from '../components/common/Icon.jsx'
import { ROUTES } from '../constants/routes.js'

const DETAILED_USE_CASES = [
  {
    id: 'creators',
    tag: 'Creators & Public Figures',
    title: 'Personal Brand & Audience Comment Intelligence',
    description:
      'Gain real-time clarity on how followers perceive your video launches, sponsored collabs, and personal announcements. Keep your finger on the pulse of sentiment shifts.',
    iconName: 'heart',
    benefits: [
      'Monitor reactions across post captions & comment threads in 1 view',
      'Identify top loyal commenters and flag toxic spam instantly',
      'Detect early sentiment spikes after video or podcast releases',
      'Receive multi-agent suggestions for high-converting comment replies',
    ],
    stat: '94% Faster Reaction Insights',
  },
  {
    id: 'brands',
    tag: 'Brands & E-Commerce',
    title: 'Brand Reputation & Product Launch Listening',
    description:
      'Evaluate customer feedback on feature launches, unboxing reactions, pricing changes, and customer support queries across social channels.',
    iconName: 'analyses',
    benefits: [
      'Real-time emotion tracking (Joy, Skepticism, Anger, Trust)',
      'SentenceTransformers vector semantic search over 50,000+ customer comments',
      'Cross-channel post performance benchmarking vs historical campaigns',
      'Automated crisis detection with configurable sentiment drop alerts',
    ],
    stat: '85% Reduction in Crisis Response Time',
  },
  {
    id: 'pr',
    tag: 'PR Agencies & Corporate Comms',
    title: 'Multi-Agent PR & Crisis Action Center',
    description:
      'Empower your PR and communications team with autonomous Agent 4 that synthesizes grounded PR response statements backed by verified post evidence.',
    iconName: 'alerts',
    benefits: [
      'Grounded PR statement generator with evidence citation links',
      'Human-in-the-loop review workflow for stakeholder approval',
      'Built-in prompt injection defense & hallucination prevention guardrails',
      'One-click export to executive PDF, Markdown, and formatted briefs',
    ],
    stat: '99.4% Grounded Response Accuracy',
  },
  {
    id: 'agencies',
    tag: 'Social Media & Growth Agencies',
    title: 'Multi-Client Campaign Analytics & Reporting',
    description:
      'Manage multiple brand workspaces with role-based access control, automated weekly insight digests, and executive PDF exports for clients.',
    iconName: 'dashboard',
    benefits: [
      'Unified multi-client dashboard with analyst & admin permission tiers',
      'Automated weekly intelligence reports ready to share with executives',
      'Custom vector rules & client-specific sentiment threshold triggers',
      'Historical trend graphs tracking audience trust and net sentiment',
    ],
    stat: '3x More Clients Managed Per Strategist',
  },
]

function UseCasesPage() {
  const [selectedId, setSelectedId] = useState('creators')
  const currentCase = DETAILED_USE_CASES.find((c) => c.id === selectedId) || DETAILED_USE_CASES[0]

  return (
    <PageContainer>
      <div className="landing-page">
        {/* Header */}
        <div className="section-header" style={{ marginTop: '24px' }}>
          <span className="section-tag">
            <Icon name="target" size={14} /> Tailored Workflows
          </span>
          <h1 className="section-title">Built For Brands, Creators &amp; PR Teams</h1>
          <p className="section-subtitle">
            See how SignalOS transforms post captions, comment threads, and engagement data into actionable intelligence for your role.
          </p>
        </div>

        {/* Persona Selector Tabs */}
        <section className="landing-section">
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '36px' }}>
            {DETAILED_USE_CASES.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`btn ${selectedId === item.id ? 'btn--primary' : 'btn--ghost'}`}
                onClick={() => setSelectedId(item.id)}
                style={{ borderRadius: '999px', padding: '10px 22px', fontSize: '0.9rem', fontWeight: 700 }}
              >
                <Icon name={item.iconName} size={16} />
                <span>{item.tag}</span>
              </button>
            ))}
          </div>

          {/* Featured Case Spotlight */}
          <div className="demo-card" style={{ padding: '40px', background: '#ffffff', borderRadius: '24px' }}>
            <div className="demo-grid" style={{ alignItems: 'flex-start' }}>
              <div>
                <span className="persona-badge" style={{ marginBottom: '8px' }}>{currentCase.tag}</span>
                <h2 style={{ fontSize: '1.85rem', color: '#0f172a', marginBottom: '14px', fontWeight: 800 }}>
                  {currentCase.title}
                </h2>
                <p style={{ color: '#475569', fontSize: '1.02rem', lineHeight: 1.65, marginBottom: '24px' }}>
                  {currentCase.description}
                </p>
                <div style={{ display: 'inline-block', background: '#fff0ec', color: '#f95738', padding: '8px 18px', borderRadius: '12px', fontWeight: 800, fontSize: '0.92rem', marginBottom: '24px' }}>
                  🚀 Impact Metric: {currentCase.stat}
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <Link to={ROUTES.register} className="btn btn--primary">
                    Start Using For {currentCase.tag.split('&')[0]} →
                  </Link>
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '28px', borderRadius: '18px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '1.1rem', color: '#0f172a', marginBottom: '18px', fontWeight: 800 }}>
                  Key Agentic Capabilities
                </h3>
                <div className="demo-checklist">
                  {currentCase.benefits.map((b, i) => (
                    <div key={i} className="demo-check-item" style={{ alignItems: 'flex-start' }}>
                      <span className="demo-check-icon" style={{ marginTop: '2px' }}>
                        <Icon name="check" size={12} />
                      </span>
                      <span style={{ fontSize: '0.92rem', color: '#334155', lineHeight: 1.5 }}>{b}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* All Personas Grid */}
        <section className="landing-section">
          <div className="section-header">
            <span className="section-tag"><Icon name="collection" size={14} /> All Roles</span>
            <h2>Comprehensive Industry Solutions</h2>
            <p>Select your operational profile to see the tailored autonomous pipeline.</p>
          </div>

          <div className="personas-grid">
            {DETAILED_USE_CASES.map((p) => (
              <div key={p.id} className="persona-card" style={{ cursor: 'pointer' }} onClick={() => setSelectedId(p.id)}>
                <span className="persona-badge">{p.tag}</span>
                <h3>{p.title}</h3>
                <p>{p.description}</p>
                <div style={{ fontWeight: 700, color: '#f95738', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>{p.stat}</span>
                  <span style={{ marginLeft: 'auto' }}>Learn more →</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="landing-section">
          <div className="landing-cta-banner">
            <div className="cta-banner__content">
              <h2>Ready to Elevate Your Social Strategy?</h2>
              <p>Join top brands and creators leveraging SignalOS autonomous multi-agent intelligence.</p>
              <div className="cta-buttons">
                <Link to={ROUTES.register} className="btn-large-primary">
                  Start Free Analysis <span>→</span>
                </Link>
                <Link to={ROUTES.login} className="btn-large-ghost">
                  Sign In to Workspace
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PageContainer>
  )
}

export default UseCasesPage
