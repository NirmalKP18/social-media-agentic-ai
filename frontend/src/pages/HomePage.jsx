import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PageContainer from '../components/common/PageContainer.jsx'
import HealthCheck from '../components/HealthCheck.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { ROUTES } from '../constants/routes.js'
import Icon from '../components/common/Icon.jsx'
import PublicPipelineDemo from '../components/pipeline/PublicPipelineDemo.jsx'
import logo from '../assets/signalos-logo.png'

const PRICING_PLANS = [
  {
    id: 'Free',
    name: 'Free Starter',
    badge: 'FREE FOREVER',
    priceMonthly: 0,
    priceAnnual: 0,
    description: 'Perfect for exploring social intelligence with zero commitment.',
    runsHighlight: '20 Pipeline Runs Included',
    features: [
      '20 Full Multi-Agent Pipeline Runs',
      '1 Tracked Brand or Keyword Profile',
      'Basic Social-Media Monitoring',
      'Continuous Sentiment Scoring (-1.0 to +1.0)',
      'Live Operations Dashboard',
      'Standard 14-Day Data History',
      'Community & Knowledge Base Support',
    ],
    ctaText: 'Start Monitoring Free',
    ctaVariant: 'btn--outline',
    isPopular: false,
  },
  {
    id: 'Plus',
    name: 'Plus Professional',
    badge: 'MOST POPULAR',
    priceMonthly: 29,
    priceAnnual: 23, // 20% off annual
    description: 'Ideal for creators, agencies & growing brand marketing teams.',
    runsHighlight: '100 Pipeline Runs / Month',
    features: [
      '100 Pipeline Runs per Month',
      'Up to 5 Tracked Brand & Keyword Profiles',
      'Multi-Platform Autonomous Social Monitoring',
      'Deep Emotion & Intent NLP Analysis (Agent 2)',
      'Vector RAG Knowledge Base Grounding (Agent 3)',
      'Automated PR Response Drafting (Agent 4)',
      'Executive PDF & Markdown Report Exports',
      'Priority Pipeline Execution Queue',
      '60-Day Historical Analytics Archive',
    ],
    ctaText: 'Select Plus Plan',
    ctaVariant: 'btn--primary',
    isPopular: true,
  },
  {
    id: 'Premium',
    name: 'Enterprise Premium',
    badge: 'FOR ENTERPRISES & AGENCIES',
    priceMonthly: 79,
    priceAnnual: 63,
    description: 'Uncapped intelligence, competitor tracking & custom RAG pipelines.',
    runsHighlight: '500 Pipeline Runs / Month',
    features: [
      '500 Pipeline Runs / Month (High-Capacity)',
      'Up to 20 Tracked Brands & Competitor Profiles',
      'Competitor Benchmarking & Sentiment Shifts',
      'Custom Enterprise Vector Knowledge Base',
      'Human-in-the-Loop PR Crisis Authorization',
      'Unlimited White-Label PDF / JSON / MD Reports',
      'Real-Time Webhook & Telegram / Slack Alerts',
      'Dedicated 24/7 Priority Support & SLAs',
      'Unlimited Historical Archive Access',
    ],
    ctaText: 'Select Premium Plan',
    ctaVariant: 'btn--primary',
    isPopular: false,
  },
]

const FAQS = [
  {
    q: 'How do the 20 Free Pipeline Runs work?',
    a: 'Every new Free account automatically receives 20 full Multi-Agent pipeline executions upon registration. You can track your brand or keywords, run deep NLP sentiment analysis, and test automated PR drafts. Once all 20 runs are completed, you can easily upgrade to Plus or Premium to continue monitoring.',
  },
  {
    q: 'What social media channels can I monitor?',
    a: 'SignalOS connects with X (formerly Twitter), Reddit, LinkedIn, Facebook, Instagram, YouTube, and allows custom webhook ingestion or direct screenshot OCR analysis.',
  },
  {
    q: 'What makes SignalOS different from basic social listening tools?',
    a: 'Traditional tools just count keywords. SignalOS runs an autonomous 4-Agent AI network: Agent 1 cleans raw data, Agent 2 extracts emotions and commenter intent, Agent 3 queries your verified knowledge base to prevent hallucinations, and Agent 4 drafts brand-protective responses with human governance.',
  },
  {
    q: 'Can I cancel or change my plan anytime?',
    a: 'Yes, absolutely. You can upgrade, downgrade, or cancel your subscription at any time with zero hassle from your Subscription & Billing settings.',
  },
]

function HomePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [billingCycle, setBillingCycle] = useState('monthly')
  const [openFaq, setOpenFaq] = useState(null)
  const [demoQuery, setDemoQuery] = useState('Nike')
  const [isSimulating, setIsSimulating] = useState(false)
  const [demoResult, setDemoResult] = useState(null)

  const handleSelectPlan = (planId) => {
    if (user) {
      navigate(`${ROUTES.checkout}?plan=${planId}`)
    } else {
      navigate(`${ROUTES.register}?plan=${planId}`)
    }
  }

  const handleRunDemo = () => {
    if (!demoQuery.trim()) return
    setIsSimulating(true)
    setDemoResult(null)

    setTimeout(() => {
      setIsSimulating(false)
      setDemoResult({
        brand: demoQuery.trim(),
        sentimentScore: '+0.78',
        sentimentLabel: 'Positive (89% Confidence)',
        emotion: '😊 Excitement & Joy (64%)',
        intent: 'Feature Praise & Inquiries',
        topTopic: '#innovation, #productdesign',
        summary: `Autonomous 4-Agent Pipeline analyzed live conversation for "${demoQuery.trim()}". Public perception is heavily positive with high engagement across major social feeds.`,
      })
    }, 900)
  }

  return (
    <PageContainer hideTitle>
      {/* ---------------- HERO SECTION ---------------- */}
      <section className="landing-hero">
        <div className="landing-hero__copy">
          <div className="landing-hero__badge"><span /> Autonomous brand intelligence</div>
          <h1 className="landing-hero__title">
            Turn every social signal into <span className="hero-highlight">a confident next move.</span>
          </h1>
          <p className="landing-hero__subtitle">
            SignalOS brings social monitoring, deep sentiment analysis, verified evidence, and response drafting into one human-governed intelligence workspace.
          </p>
          <div className="landing-hero__cta-row">
            <button type="button" className="btn btn--primary btn--lg" onClick={() => handleSelectPlan('Free')}>
              Start free <Icon name="arrow" size={17} />
            </button>
            <a href="#demo-section" className="btn btn--outline btn--lg">Try the live demo</a>
          </div>
          <div className="landing-hero__assurance" aria-label="Account benefits">
            <span><Icon name="check" size={14} /> 20 pipeline runs included</span>
            <span><Icon name="check" size={14} /> No credit card required</span>
            <span><Icon name="shield" size={14} /> Human approval built in</span>
          </div>
        </div>

        <div className="hero-product-preview" aria-label="SignalOS intelligence dashboard preview">
          <div className="hero-product-preview__bar">
            <span className="preview-brand"><img src={logo} alt="" /> SignalOS Intelligence</span>
            <span className="preview-live"><i /> Live monitoring</span>
          </div>
          <div className="hero-product-preview__body">
            <div className="preview-heading">
              <div><small>BRAND HEALTH</small><strong>Customer sentiment</strong></div>
              <span>Last 30 days</span>
            </div>
            <div className="preview-score-row">
              <div className="preview-score"><strong>78</strong><span>/100</span><small>Healthy</small></div>
              <div className="preview-chart" aria-hidden="true">
                {[36, 42, 39, 51, 48, 58, 62, 57, 69, 72, 78, 74].map((height, index) => (
                  <i key={index} style={{ height: `${height}%` }} />
                ))}
              </div>
            </div>
            <div className="preview-kpis">
              <div><span>Positive</span><strong className="positive">72%</strong><small>+8.4%</small></div>
              <div><span>Mentions</span><strong>2,847</strong><small>Across 6 sources</small></div>
              <div><span>Urgent</span><strong>12</strong><small>Need review</small></div>
            </div>
            <div className="preview-insight">
              <span><Icon name="sparkles" size={17} /></span>
              <div><small>AI INSIGHT</small><p>Product-launch sentiment is trending upward, led by feature praise and design conversations.</p></div>
            </div>
          </div>
          <div className="preview-float-card preview-float-card--top"><Icon name="brain" size={17} /><span><strong>Intent detected</strong><small>Feature praise</small></span></div>
          <div className="preview-float-card preview-float-card--bottom"><Icon name="shield" size={17} /><span><strong>Evidence grounded</strong><small>3 verified sources</small></span></div>
        </div>
      </section>

      <section className="landing-proof-strip" aria-label="Platform highlights">
        <div><strong>4</strong><span>specialized AI agents</span></div>
        <div><strong>6+</strong><span>supported data sources</span></div>
        <div><strong>100%</strong><span>human-governed responses</span></div>
        <div><strong>24/7</strong><span>continuous intelligence</span></div>
      </section>

      <PublicPipelineDemo />

      {/* ---------------- LIVE SIMULATOR / INTERACTIVE DEMO ---------------- */}
      <section id="demo-section" className="landing-demo-section card">
        <div className="demo-header">
          <span className="eyebrow">Interactive Live Simulator</span>
          <h2>Experience the Autonomous Monitoring Engine</h2>
          <p>Enter any company name, brand, creator handle, or product keyword to simulate our 4-Agent pipeline in real time:</p>
        </div>

        <div className="demo-search-bar">
          <input
            type="text"
            className="demo-input"
            placeholder="Enter brand name (e.g. Nike, Apple, Tesla, Stripe)..."
            value={demoQuery}
            onChange={(e) => setDemoQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRunDemo()}
          />
          <button
            type="button"
            className="btn btn--primary"
            onClick={handleRunDemo}
            disabled={isSimulating}
          >
            {isSimulating ? 'Agents Running...' : 'Run Pipeline Demo ➔'}
          </button>
        </div>

        {isSimulating && (
          <div className="demo-running-state">
            <div className="pipeline-spinner" />
            <span>Agent 1 Sanitizing ➔ Agent 2 Neural NLP ➔ Agent 3 RAG Evidence ➔ Agent 4 Synthesizing...</span>
          </div>
        )}

        {demoResult && (
          <div className="demo-result-card">
            <div className="demo-result-head">
              <span className="demo-brand-tag">🎯 Monitored Target: <strong>{demoResult.brand}</strong></span>
              <span className="demo-sentiment-tag">Sentiment: {demoResult.sentimentLabel}</span>
            </div>
            <p className="demo-summary">{demoResult.summary}</p>
            <div className="demo-metrics-chips">
              <span className="chip">Emotion: {demoResult.emotion}</span>
              <span className="chip">Intent: {demoResult.intent}</span>
              <span className="chip chip--entity">Topics: {demoResult.topTopic}</span>
            </div>
            <div className="demo-cta-footer">
              <span>Ready to monitor <strong>{demoResult.brand}</strong> across real feeds?</span>
              <button
                type="button"
                className="btn btn--primary btn--sm"
                onClick={() => handleSelectPlan('Free')}
              >
                Create Account with 20 Free Runs ➔
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ---------------- HOW IT WORKS: 4-AGENT PIPELINE ---------------- */}
      <section className="landing-workflow-section">
        <div className="section-head text-center">
          <span className="eyebrow">How It Works</span>
          <h2>The Autonomous 4-Agent Intelligence Pipeline</h2>
          <p>Every brand mention passes through an orchestrated pipeline designed for zero-hallucination accuracy.</p>
        </div>

        <div className="workflow-grid">
          <div className="workflow-card">
            <div className="workflow-card__number">01</div>
            <h3>Agent 1: Ingestion & Sanitization</h3>
            <p>Scans connected social platforms, strips malicious scripts/handles, normalizes whitespace, and filters spam.</p>
          </div>
          <div className="workflow-card">
            <div className="workflow-card__number">02</div>
            <h3>Agent 2: Deep NLP & Emotion</h3>
            <p>Calculates exact polarity scores (-1.00 to +1.00), fine-grained emotion vectors (Joy, Anger, Surprise), and commenter intent.</p>
          </div>
          <div className="workflow-card">
            <div className="workflow-card__number">03</div>
            <h3>Agent 3: Semantic Vector RAG</h3>
            <p>Indexes enterprise knowledge documents and retrieves top-k factual evidence with cosine similarity to anchor every insight.</p>
          </div>
          <div className="workflow-card">
            <div className="workflow-card__number">04</div>
            <h3>Agent 4: PR Synthesis & Governance</h3>
            <p>Synthesizes executive summaries and drafts empathetic brand responses with 100% human-in-the-loop authorization.</p>
          </div>
        </div>
      </section>

      <section className="landing-outcomes-section">
        <div className="landing-outcomes-copy">
          <span className="eyebrow">From noise to action</span>
          <h2>One operating view for every conversation that matters.</h2>
          <p>Move beyond volume charts. SignalOS connects the original mention, audience intent, trusted evidence, and a governed response so your team can act with context.</p>
          <Link to={ROUTES.capabilities} className="landing-text-link">Explore all capabilities <Icon name="arrow" size={15} /></Link>
        </div>
        <div className="landing-outcomes-grid">
          <article><span><Icon name="analyses" /></span><h3>Understand the why</h3><p>Go deeper than positive or negative with emotion, intent, entities, topics, and priority.</p></article>
          <article><span><Icon name="knowledge" /></span><h3>Ground every claim</h3><p>Retrieve relevant knowledge and source context before insights or drafts are generated.</p></article>
          <article><span><Icon name="shield" /></span><h3>Keep humans in control</h3><p>Review, edit, approve, or reject every response with a clear governance trail.</p></article>
          <article><span><Icon name="alerts" /></span><h3>Focus on what matters</h3><p>Surface high-priority sentiment shifts and urgent conversations without losing context.</p></article>
        </div>
      </section>

      {/* ---------------- PRICING PLANS SECTION ---------------- */}
      <section id="pricing" className="landing-pricing-section">
        <div className="section-head text-center">
          <span className="eyebrow">Transparent Pricing</span>
          <h2>Choose the Right Intelligence Tier</h2>
          <p>Start with 20 Free pipeline runs or unlock high-capacity brand monitoring for your organization.</p>

          {/* Billing Cycle Toggle */}
          <div className="pricing-toggle-wrap">
            <span className={billingCycle === 'monthly' ? 'active' : ''}>Monthly Billing</span>
            <button
              type="button"
              className={`toggle-switch ${billingCycle === 'annual' ? 'active' : ''}`}
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
            >
              <div className="toggle-switch-handle" />
            </button>
            <span className={billingCycle === 'annual' ? 'active' : ''}>
              Annual Billing <span className="discount-pill">Save 20%</span>
            </span>
          </div>
        </div>

        <div className="pricing-cards-grid">
          {PRICING_PLANS.map((plan) => {
            const price = billingCycle === 'annual' ? plan.priceAnnual : plan.priceMonthly

            return (
              <div
                key={plan.id}
                className={`pricing-card ${plan.isPopular ? 'pricing-card--popular' : ''}`}
              >
                {plan.isPopular && <div className="popular-badge">RECOMMENDED</div>}

                <div className="pricing-card__header">
                  <div className="plan-badge-tag">{plan.badge}</div>
                  <h3 className="plan-name">{plan.name}</h3>
                  <div className="plan-price-block">
                    <span className="plan-currency">$</span>
                    <span className="plan-amount">{price}</span>
                    <span className="plan-cycle">/month</span>
                  </div>
                  <p className="plan-desc">{plan.description}</p>
                </div>

                <div className="plan-runs-callout">
                  <Icon name="sparkles" size={15} />
                  <strong>{plan.runsHighlight}</strong>
                </div>

                <ul className="plan-features-list">
                  {plan.features.map((feat, idx) => (
                    <li key={idx}>
                      <span className="check-icon">✓</span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  className={`btn ${plan.ctaVariant} plan-cta-btn`}
                  onClick={() => handleSelectPlan(plan.id)}
                >
                  {plan.ctaText} ➔
                </button>
              </div>
            )
          })}
        </div>
      </section>

      {/* ---------------- FAQ SECTION ---------------- */}
      <section className="landing-faq-section">
        <div className="section-head text-center">
          <span className="eyebrow">Frequently Asked Questions</span>
          <h2>Got Questions? We Have Answers</h2>
        </div>

        <div className="faq-accordion">
          {FAQS.map((faq, index) => (
            <div
              key={index}
              className={`faq-item ${openFaq === index ? 'faq-item--open' : ''}`}
            >
              <button type="button" className="faq-question" onClick={() => setOpenFaq(openFaq === index ? null : index)} aria-expanded={openFaq === index}>
                <strong>{faq.q}</strong>
                <span className="faq-toggle">{openFaq === index ? '−' : '+'}</span>
              </button>
              {openFaq === index && <p className="faq-answer">{faq.a}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- FINAL CTA BANNER ---------------- */}
      <section className="landing-cta-banner card">
        <div className="cta-banner-content">
          <h2>Ready to Know What People Are Saying?</h2>
          <p>Create your account in seconds and unlock 20 free autonomous pipeline runs immediately.</p>
          <div className="cta-actions">
            <button
              type="button"
              className="btn btn--primary btn--lg"
              onClick={() => handleSelectPlan('Free')}
            >
              Start Monitoring Free ➔
            </button>
          </div>
        </div>
      </section>

      {/* ---------------- FOOTER ---------------- */}
      <footer className="landing-footer">
        <div className="landing-footer__top">
          <div className="footer-brand">
            <div className="footer-logo">
              <img src={logo} alt="SignalOS Logo" height="24" />
              <strong>SignalOS</strong>
            </div>
            <p>Autonomous Social Media Intelligence & Brand Monitoring SaaS.</p>
          </div>

          <div className="footer-links-group">
            <strong>Platform</strong>
            <Link to={ROUTES.home}>Overview</Link>
            <a href="#pricing">Pricing</a>
            <Link to={ROUTES.capabilities}>Capabilities</Link>
          </div>

          <div className="footer-links-group">
            <strong>Account</strong>
            <Link to={ROUTES.login}>Sign In</Link>
            <Link to={ROUTES.register}>Register Free</Link>
            <Link to={ROUTES.subscription}>Subscription</Link>
          </div>

          <div className="footer-links-group">
            <strong>System</strong>
            <HealthCheck />
          </div>
        </div>

        <div className="landing-footer__bottom">
          <span>© 2026 SignalOS Inc. All rights reserved.</span>
          <span>Enterprise Social Media Intelligence & Autonomous Governance.</span>
        </div>
      </footer>
    </PageContainer>
  )
}

export default HomePage
