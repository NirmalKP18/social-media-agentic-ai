import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import PageContainer from '../components/common/PageContainer.jsx'
import ErrorMessage from '../components/common/ErrorMessage.jsx'
import Icon from '../components/common/Icon.jsx'
import { subscriptionService } from '../services/subscriptionService.js'
import { useAuth } from '../context/AuthContext.jsx'
import { ROUTES } from '../constants/routes.js'

const PLAN_DETAILS = {
  Plus: {
    name: 'Plus Professional',
    priceMonthly: 29,
    priceAnnual: 278, // $23/mo billed annually
    pipelineRuns: 100,
    brandLimit: 5,
    features: [
      '100 Pipeline Runs per Month',
      'Up to 5 Tracked Brands & Keywords',
      'Deep Emotion & Intent Classification',
      'Vector RAG Knowledge Retrieval',
      'Executive PDF & Markdown Reports',
      'Priority Processing Queue',
    ],
  },
  Premium: {
    name: 'Enterprise Premium',
    priceMonthly: 79,
    priceAnnual: 758, // $63/mo billed annually
    pipelineRuns: 500,
    brandLimit: 20,
    features: [
      '500 Pipeline Runs per Month (High-Capacity)',
      'Up to 20 Tracked Brands & Competitor Profiles',
      'Competitor Benchmarking & Shift Tracking',
      'Custom Enterprise Vector Knowledge Base',
      'Unlimited White-Label Report Exports',
      'Dedicated 24/7 Priority Support & SLAs',
    ],
  },
}

function CheckoutPage() {
  const { user, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const planQuery = searchParams.get('plan') || 'Plus'

  const [selectedPlan, setSelectedPlan] = useState(
    ['Plus', 'Premium'].includes(planQuery) ? planQuery : 'Plus'
  )
  const [billingCycle, setBillingCycle] = useState('monthly')
  const [paymentMethod, setPaymentMethod] = useState('card')

  // Card form state
  const [cardData, setCardData] = useState({
    cardNumber: '•••• •••• •••• 4242',
    cardExpiry: '12/28',
    cardCvc: '•••',
    cardName: user?.name || 'Authorized Customer',
  })

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [successReceipt, setSuccessReceipt] = useState(null)

  useEffect(() => {
    if (!user) {
      navigate(`${ROUTES.login}?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`)
    }
  }, [user, navigate])

  const planInfo = PLAN_DETAILS[selectedPlan] || PLAN_DETAILS.Plus
  const price = billingCycle === 'annual' ? planInfo.priceAnnual : planInfo.priceMonthly

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const txnId = `txn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
      const res = await subscriptionService.checkout({
        planName: selectedPlan,
        billingCycle,
        paymentMethod: paymentMethod === 'card' ? 'Visa **** 4242' : 'Stripe Express',
        transactionId: txnId,
      })

      await refreshUser?.()
      setSuccessReceipt(res.data)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Payment processing failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (successReceipt) {
    return (
      <PageContainer title="Subscription Activated" subtitle="Your payment was confirmed and your quota is credited.">
        <div className="card checkout-success-card">
          <div className="checkout-success-icon">✓</div>
          <h2>Payment Successful!</h2>
          <p className="checkout-success-msg">
            Thank you for subscribing to <strong>{selectedPlan} Plan</strong>. Your account now has{' '}
            <strong>{planInfo.pipelineRuns} Pipeline Runs</strong> credited.
          </p>

          <div className="receipt-box">
            <div className="receipt-row">
              <span>Invoice ID:</span>
              <strong>{successReceipt.invoiceId || 'INV-SUCCESS'}</strong>
            </div>
            <div className="receipt-row">
              <span>Plan:</span>
              <strong>{selectedPlan} ({billingCycle})</strong>
            </div>
            <div className="receipt-row">
              <span>Amount Paid:</span>
              <strong>${price}.00 USD</strong>
            </div>
            <div className="receipt-row">
              <span>Status:</span>
              <span className="badge badge--success">PAID & ACTIVE</span>
            </div>
          </div>

          <div className="checkout-success-actions">
            <button
              type="button"
              className="btn btn--primary btn--lg"
              onClick={() => navigate(ROUTES.dashboard)}
            >
              Go to Your Dashboard ➔
            </button>
            <Link to={ROUTES.subscription} className="btn btn--outline">
              View Billing & Subscription
            </Link>
          </div>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer title="Checkout & Subscription Activation" subtitle="Complete your subscription to unlock high-capacity brand monitoring">
      <div className="checkout-layout">
        {/* Left Column: Plan Summary & Features */}
        <div className="card checkout-summary-card">
          <div className="checkout-plan-selector">
            <span className="eyebrow">Selected Plan</span>
            <div className="checkout-tabs">
              <button
                type="button"
                className={`checkout-tab ${selectedPlan === 'Plus' ? 'active' : ''}`}
                onClick={() => setSelectedPlan('Plus')}
              >
                Plus ($29/mo)
              </button>
              <button
                type="button"
                className={`checkout-tab ${selectedPlan === 'Premium' ? 'active' : ''}`}
                onClick={() => setSelectedPlan('Premium')}
              >
                Premium ($79/mo)
              </button>
            </div>
          </div>

          <div className="checkout-price-display">
            <div className="checkout-price-num">${price}<span>.00 / {billingCycle === 'annual' ? 'year' : 'month'}</span></div>
            <span className="badge badge--primary">{planInfo.pipelineRuns} Pipeline Runs Credited</span>
          </div>

          <div className="billing-cycle-selector">
            <label className={`cycle-option ${billingCycle === 'monthly' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="cycle"
                value="monthly"
                checked={billingCycle === 'monthly'}
                onChange={() => setBillingCycle('monthly')}
              />
              <span>Monthly Billing (${planInfo.priceMonthly}/mo)</span>
            </label>
            <label className={`cycle-option ${billingCycle === 'annual' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="cycle"
                value="annual"
                checked={billingCycle === 'annual'}
                onChange={() => setBillingCycle('annual')}
              />
              <span>Annual Billing (${planInfo.priceAnnual}/yr - 20% Off)</span>
            </label>
          </div>

          <div className="checkout-features-list">
            <h4>Included in {selectedPlan}:</h4>
            <ul>
              {planInfo.features.map((feat, idx) => (
                <li key={idx}>✓ {feat}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Column: Payment Form */}
        <div className="card checkout-payment-card">
          <h3>Secure Payment Details</h3>
          <p className="checkout-subtitle">All transactions are encrypted with 256-bit SSL technology.</p>

          <form onSubmit={handleCheckoutSubmit} className="checkout-form">
            <div className="payment-gateways-row">
              <button
                type="button"
                className={`gateway-btn ${paymentMethod === 'card' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('card')}
              >
                💳 Credit / Debit Card
              </button>
              <button
                type="button"
                className={`gateway-btn ${paymentMethod === 'stripe' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('stripe')}
              >
                ⚡ Stripe 1-Click
              </button>
            </div>

            <div className="form-group">
              <label className="form__label">Cardholder Full Name</label>
              <input
                type="text"
                className="form__input"
                value={cardData.cardName}
                onChange={(e) => setCardData({ ...cardData, cardName: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form__label">Card Number</label>
              <input
                type="text"
                className="form__input"
                value={cardData.cardNumber}
                onChange={(e) => setCardData({ ...cardData, cardNumber: e.target.value })}
                placeholder="4242 •••• •••• 4242"
                required
              />
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label className="form__label">Expires (MM/YY)</label>
                <input
                  type="text"
                  className="form__input"
                  value={cardData.cardExpiry}
                  onChange={(e) => setCardData({ ...cardData, cardExpiry: e.target.value })}
                  placeholder="12/28"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form__label">CVC / CVV</label>
                <input
                  type="text"
                  className="form__input"
                  value={cardData.cardCvc}
                  onChange={(e) => setCardData({ ...cardData, cardCvc: e.target.value })}
                  placeholder="888"
                  required
                />
              </div>
            </div>

            {error && <ErrorMessage message={error} />}

            <div className="checkout-total-row">
              <span>Total Due Today:</span>
              <strong>${price}.00 USD</strong>
            </div>

            <button
              type="submit"
              className="btn btn--primary btn--lg checkout-pay-btn"
              disabled={submitting}
            >
              {submitting ? 'Verifying & Activating...' : `Pay $${price}.00 & Activate ${selectedPlan} Plan ➔`}
            </button>

            <p className="checkout-security-note">
              🔒 30-Day Money-Back Guarantee • Instant Quota Activation
            </p>
          </form>
        </div>
      </div>
    </PageContainer>
  )
}

export default CheckoutPage
