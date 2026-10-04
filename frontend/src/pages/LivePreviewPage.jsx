import { useState } from 'react'
import { Link } from 'react-router-dom'
import PageContainer from '../components/common/PageContainer.jsx'
import Icon from '../components/common/Icon.jsx'
import { ROUTES } from '../constants/routes.js'

const SHOWCASE_TABS = [
  { id: 'reactions', label: 'Brand & Profile Sentiment', icon: 'analyses' },
  { id: 'posts_comments', label: 'Posts, Captions & Comments Engine', icon: 'collection' },
  { id: 'agents', label: 'Multi-Agent Orchestration', icon: 'dashboard' },
  { id: 'pr', label: 'Grounded PR & Action Center', icon: 'insights' },
]

const SAMPLE_POSTS = [
  {
    type: 'Brand Post Caption & Reaction',
    user: 'Official Brand Handle • Product Launch Announcement',
    sentiment: 'High Positive (+0.88)',
    badgeColor: '#10b981',
    metrics: '1,420 Likes • 342 Retweets • 185 Comments',
    summary: 'Multi-Agent Analysis: High audience excitement for new feature release; 84% positive engagement across post text & comments.',
  },
  {
    type: 'Public Audience Comment Highlight',
    user: 'Sarah Jenkins • Lead Brand Strategist',
    sentiment: 'Positive (+0.85)',
    badgeColor: '#10b981',
    metrics: 'Top Voted Comment • 92 Likes',
    summary: 'Comment Sentiment Analysis: Praises UI overhaul & speed boost. Recommended action: Pin comment & acknowledge feedback.',
  },
  {
    type: 'Anomaly / Feedback Alert',
    user: 'TechCommunity • Public Discussion Thread',
    sentiment: 'Critical (-0.42)',
    badgeColor: '#ef4444',
    metrics: '48 Replies • High Velocity',
    summary: 'Multi-Agent Alert: Isolated latency report during peak load. Agent 4 generated grounded PR response statement.',
  },
]

const AGENTS = [
  {
    step: '01',
    name: 'Agent 1: Collection & Ingestion',
    role: 'Posts, Captions & Comment Collector',
    detail: 'Ingests social posts, captions, comments, likes, and shares with automated deduplication and spam filtering.',
    iconName: 'collection',
  },
  {
    step: '02',
    name: 'Agent 2: NLP & Emotion Engine',
    role: 'Deep Post & Comment Analytics',
    detail: 'Calculates sentiment (-1 to +1), identifies 8 core emotions, extracts entities (NER), and clusters trending topics.',
    iconName: 'brain',
  },
  {
    step: '03',
    name: 'Agent 3: Vector RAG Index',
    role: 'Semantic Knowledge Search',
    detail: 'Indexes posts and comments in SentenceTransformers vector space for instant semantic retrieval and evidence scoring.',
    iconName: 'retrieval',
  },
  {
    step: '04',
    name: 'Agent 4: Grounded PR Synthesis',
    role: 'Actionable PR & Executive Reports',
    detail: 'Synthesizes grounded executive summaries, sentiment reports, and PR draft statements with human-in-the-loop review.',
    iconName: 'insights',
  },
]

function LivePreviewPage() {
  const [activeTab, setActiveTab] = useState('reactions')
  const [testQuery, setTestQuery] = useState('')
  const [querySimulated, setQuerySimulated] = useState(false)

  const handleSimulate = (e) => {
    e.preventDefault()
    if (!testQuery.trim()) return
    setQuerySimulated(true)
  }

  return (
    <PageContainer>
      <div className="landing-page public-detail-page public-preview-page">
        {/* Header Banner */}
        <div className="section-header public-detail-hero">
          <span className="section-tag">
            <Icon name="sparkles" size={14} /> Interactive Sandbox
          </span>
          <h1 className="section-title">Live Platform Preview</h1>
          <p className="section-subtitle">
            Explore how SignalOS analyzes post captions, comment sentiment, evidence retrieval, and governed response workflows.
          </p>
          <div className="public-detail-hero__trust">
            <span><Icon name="check" size={14} /> No account required</span>
            <span><Icon name="shield" size={14} /> Human-governed outputs</span>
            <span><Icon name="bolt" size={14} /> Interactive product tour</span>
          </div>
        </div>

        {/* Live Interactive Tab System */}
        <section className="landing-section">
          <div className="interactive-showcase public-showcase-shell">
            <div className="showcase-tabs">
              {SHOWCASE_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`showcase-tab ${activeTab === tab.id ? 'showcase-tab--active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon name={tab.icon} size={16} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            <div className="showcase-content">
              {activeTab === 'reactions' && (
                <div className="demo-grid">
                  <div className="demo-copy">
                    <h3>Overall Brand &amp; Profile Sentiment</h3>
                    <p>
                      Gain a 360° overview of how your target audience reacts to your overall profile, recent campaign posts, and viral announcements.
                    </p>
                    <div className="demo-checklist">
                      <div className="demo-check-item">
                        <span className="demo-check-icon"><Icon name="check" size={12} /></span>
                        Multi-Agent post caption &amp; comment thread ingestion
                      </div>
                      <div className="demo-check-item">
                        <span className="demo-check-icon"><Icon name="check" size={12} /></span>
                        Real-time emotion breakdown (Joy, Trust, Skepticism, Anger)
                      </div>
                      <div className="demo-check-item">
                        <span className="demo-check-icon"><Icon name="check" size={12} /></span>
                        High-precision topic clustering &amp; entity extraction
                      </div>
                    </div>
                  </div>

                  <div className="demo-card">
                    <div className="demo-card__header">
                      <span className="demo-card__title">Brand Perception Index</span>
                      <span className="demo-badge">Overall Score: +0.78</span>
                    </div>

                    <div className="sentiment-bar-widget">
                      <div className="sentiment-segment sentiment-segment--pos" style={{ width: '72%' }} title="Positive: 72%" />
                      <div className="sentiment-segment sentiment-segment--neu" style={{ width: '18%' }} title="Neutral: 18%" />
                      <div className="sentiment-segment sentiment-segment--neg" style={{ width: '10%' }} title="Negative: 10%" />
                    </div>

                    <div className="sentiment-legend">
                      <span>Positive (72%)</span>
                      <span>Neutral (18%)</span>
                      <span>Critical (10%)</span>
                    </div>

                    <div className="emotion-chips">
                      <span className="emotion-chip">Joy (85%)</span>
                      <span className="emotion-chip">Trust (78%)</span>
                      <span className="emotion-chip">Excitement (71%)</span>
                      <span className="emotion-chip">Curiosity (40%)</span>
                    </div>

                    <div className="comment-snippet">
                      <div className="comment-snippet__user">
                        <Icon name="comments" size={14} />
                        <span>Multi-Agent Insight Highlight</span>
                      </div>
                      <p className="comment-snippet__text">
                        &quot;Multi-agent analysis detected an 85% positive shift following your latest post update, driven by community enthusiasm for new features.&quot;
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'posts_comments' && (
                <div className="demo-grid">
                  <div className="demo-copy">
                    <h3>Deep Post, Caption &amp; Comment Analysis</h3>
                    <p>
                      Our multi-agent system evaluates post text, captions, user comments, replies, and like-to-comment ratios simultaneously.
                    </p>
                    <div className="demo-checklist">
                      <div className="demo-check-item">
                        <span className="demo-check-icon"><Icon name="check" size={12} /></span>
                        Unified processing of post content AND audience comment responses
                      </div>
                      <div className="demo-check-item">
                        <span className="demo-check-icon"><Icon name="check" size={12} /></span>
                        Automated spam, bot, and toxic comment filtering
                      </div>
                      <div className="demo-check-item">
                        <span className="demo-check-icon"><Icon name="check" size={12} /></span>
                        Vector indexing for instant semantic search across all posts &amp; comments
                      </div>
                    </div>
                  </div>

                  <div className="demo-card">
                    <div className="demo-card__header">
                      <span className="demo-card__title">Multi-Agent Analyzed Items</span>
                      <span className="demo-badge">12 Posts • 840 Comments</span>
                    </div>

                    {SAMPLE_POSTS.map((item, i) => (
                      <div key={i} className="comment-snippet">
                        <div className="comment-snippet__user">
                          <Icon name="collection" size={14} />
                          <span>{item.type}</span>
                          <small style={{ marginLeft: 'auto', color: item.badgeColor, fontWeight: 700 }}>
                            {item.sentiment}
                          </small>
                        </div>
                        <p style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, margin: '2px 0 4px' }}>{item.user}</p>
                        <p className="comment-snippet__text">{item.summary}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'agents' && (
                <div className="demo-grid">
                  <div className="demo-copy">
                    <h3>4-Agent Autonomous Pipeline</h3>
                    <p>
                      Four specialized AI agents collaborate sequentially to process posts, extract emotions, index comments, and generate grounded PR strategies.
                    </p>
                    <div className="demo-checklist">
                      <div className="demo-check-item">
                        <span className="demo-check-icon"><Icon name="check" size={12} /></span>
                        Agent 1: Collects posts, captions, comments, and engagement metrics
                      </div>
                      <div className="demo-check-item">
                        <span className="demo-check-icon"><Icon name="check" size={12} /></span>
                        Agent 2: Analyzes sentiment (-1..1), 8 emotions, and topics
                      </div>
                      <div className="demo-check-item">
                        <span className="demo-check-icon"><Icon name="check" size={12} /></span>
                        Agent 3: Indexes items in SentenceTransformers vector RAG space
                      </div>
                      <div className="demo-check-item">
                        <span className="demo-check-icon"><Icon name="check" size={12} /></span>
                        Agent 4: Generates grounded PR draft statements &amp; executive reports
                      </div>
                    </div>
                  </div>

                  <div className="architecture-flow">
                    {AGENTS.map((agent) => (
                      <div key={agent.name} className="arch-card">
                        <div className="arch-step-num">{agent.step}</div>
                        <h4>{agent.name}</h4>
                        <p><strong>{agent.role}</strong></p>
                        <p style={{ marginTop: '6px' }}>{agent.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'pr' && (
                <div className="demo-grid">
                  <div className="demo-copy">
                    <h3>Grounded PR &amp; Executive Responses</h3>
                    <p>
                      When public reaction shifts or critical comments surface, Agent 4 synthesizes grounded PR response statements backed by verified post evidence.
                    </p>
                    <div className="demo-checklist">
                      <div className="demo-check-item">
                        <span className="demo-check-icon"><Icon name="check" size={12} /></span>
                        Human-in-the-loop review workflow before publishing
                      </div>
                      <div className="demo-check-item">
                        <span className="demo-check-icon"><Icon name="check" size={12} /></span>
                        Built-in prompt injection defense &amp; hallucination safeguards
                      </div>
                      <div className="demo-check-item">
                        <span className="demo-check-icon"><Icon name="check" size={12} /></span>
                        One-click export to Markdown, JSON, or executive PDF report
                      </div>
                    </div>
                  </div>

                  <div className="demo-card">
                    <div className="demo-card__header">
                      <span className="demo-card__title">AI Generated PR Response Draft</span>
                      <span className="demo-badge" style={{ background: '#d1fae5', color: '#10b981' }}>Grounded Score: 98%</span>
                    </div>

                    <div style={{ background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.84rem', color: '#1e293b', lineHeight: 1.6 }}>
                      <strong style={{ display: 'block', color: '#0f172a', marginBottom: '6px' }}>
                        Proposed Response Statement:
                      </strong>
                      &quot;We hear our community loud and clear regarding the recent post feedback. Our team has deployed a performance patch addressing API sync latency. Thank you for your continued support!&quot;
                    </div>

                    <div style={{ marginTop: '14px', display: 'flex', gap: '10px' }}>
                      <Link to={ROUTES.register} className="btn btn--primary btn--sm" style={{ padding: '8px 14px' }}>
                        Try in Free Account
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Semantic Query Simulator */}
        <section className="landing-section">
          <div className="demo-card public-rag-simulator">
            <div className="section-header" style={{ marginBottom: '24px' }}>
              <span className="section-tag"><Icon name="retrieval" size={14} /> Semantic RAG Simulator</span>
              <h2>Test Vector Search Across Posts &amp; Comments</h2>
              <p>Type a question or sentiment topic to test the agentic semantic search retrieval index.</p>
            </div>

            <form onSubmit={handleSimulate} style={{ display: 'flex', gap: '12px', maxWidth: '720px', margin: '0 auto 20px' }}>
              <input
                type="text"
                className="form__input"
                placeholder="e.g. How are users reacting to the new pricing or UI update?"
                value={testQuery}
                onChange={(e) => setTestQuery(e.target.value)}
                style={{ flex: 1, margin: 0 }}
              />
              <button type="submit" className="btn btn--primary">
                Search RAG
              </button>
            </form>

            {querySimulated && (
              <div style={{ maxWidth: '720px', margin: '0 auto', background: '#f8fafc', padding: '20px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <strong style={{ color: '#0f172a' }}>Top Semantic Match (Score: 0.94)</strong>
                  <span style={{ fontSize: '0.75rem', background: '#d1fae5', color: '#10b981', padding: '2px 8px', borderRadius: '999px', fontWeight: 700 }}>320ms Retrieval</span>
                </div>
                <p style={{ fontSize: '0.86rem', color: '#475569', margin: 0 }}>
                  Found 14 relevant post comments across X &amp; LinkedIn indicating 82% favorable reception with specific praise for speed improvements.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* CTA */}
        <section className="landing-section">
          <div className="landing-cta-banner">
            <div className="cta-banner__content">
              <h2>Ready to Experience Full Autonomous Social AI?</h2>
              <p>Create a workspace, define a monitoring profile, and start turning approved social data into multi-agent intelligence.</p>
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

export default LivePreviewPage
