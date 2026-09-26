import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useOnboarding } from '../../context/OnboardingContext.jsx'
import Icon from '../common/Icon.jsx'

function TourOverlay() {
  const navigate = useNavigate()
  const location = useLocation()
  const popoverRef = useRef(null)
  const {
    isTourActive,
    currentStep,
    currentStepIndex,
    totalSteps,
    nextStep,
    prevStep,
    skipTour,
  } = useOnboarding()

  const [bounds, setBounds] = useState(null)
  const [popoverSize, setPopoverSize] = useState({ width: 440, height: 320 })

  // Navigate to step route if needed
  useEffect(() => {
    if (!isTourActive || !currentStep) return
    if (currentStep.route && location.pathname !== currentStep.route) {
      navigate(currentStep.route)
    }
  }, [isTourActive, currentStep, location.pathname, navigate])

  // Measure popover DOM size
  useEffect(() => {
    if (popoverRef.current) {
      const rect = popoverRef.current.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) {
        setPopoverSize({ width: rect.width, height: rect.height })
      }
    }
  }, [currentStepIndex, isTourActive])

  // Measure target element bounds dynamically (in viewport coordinates)
  const updateBounds = useCallback(() => {
    if (!currentStep) return
    let el = document.querySelector(currentStep.target)
    if (!el && currentStep.fallbackTarget) {
      el = document.querySelector(currentStep.fallbackTarget)
    }

    if (el) {
      const rect = el.getBoundingClientRect()
      setBounds({
        top: rect.top,
        left: rect.left,
        right: rect.right,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height,
      })
    } else {
      setBounds(null)
    }
  }, [currentStep])

  // Scroll target element into optimal view and sync bounds
  useEffect(() => {
    if (!isTourActive || !currentStep) return

    const scrollToElement = () => {
      let el = document.querySelector(currentStep.target)
      if (!el && currentStep.fallbackTarget) {
        el = document.querySelector(currentStep.fallbackTarget)
      }

      if (el) {
        const rect = el.getBoundingClientRect()
        const absoluteTop = window.pageYOffset + rect.top
        // Position element near the top (55px) of viewport to guarantee maximum available room below for the guide card
        const optimalScrollTop = Math.max(0, absoluteTop - 55)
        window.scrollTo({ top: optimalScrollTop, behavior: 'smooth' })
      }
      updateBounds()
    }

    // Run immediately and after router page mount
    scrollToElement()
    const t1 = setTimeout(scrollToElement, 100)
    const t2 = setTimeout(scrollToElement, 300)
    const t3 = setTimeout(updateBounds, 600)
    const t4 = setTimeout(updateBounds, 900)

    window.addEventListener('resize', updateBounds)
    window.addEventListener('scroll', updateBounds, { passive: true })

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
      window.removeEventListener('resize', updateBounds)
      window.removeEventListener('scroll', updateBounds)
    }
  }, [isTourActive, currentStep, location.pathname, updateBounds])

  if (!isTourActive || !currentStep) return null

  const isFirst = currentStepIndex === 0
  const isLast = currentStepIndex === totalSteps - 1
  const progressPercent = Math.round(((currentStepIndex + 1) / totalSteps) * 100)

  // Smart Adaptive Popover Positioning (Zero-overlap with spotlight box)
  const calculatePopoverStyle = () => {
    const cardWidth = Math.min(440, window.innerWidth - 32)
    const cardHeight = popoverSize.height || 300
    const pad = 16

    if (!bounds) {
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: `${cardWidth}px`,
        maxWidth: 'calc(100vw - 32px)',
      }
    }

    const spaceBelow = window.innerHeight - bounds.bottom
    const spaceAbove = bounds.top
    const spaceRight = window.innerWidth - bounds.right
    const spaceLeft = bounds.left

    let targetTop
    let targetLeft = bounds.left + (bounds.width - cardWidth) / 2

    // 1. Preferred: Place cleanly below the spotlight box if space permits
    if (spaceBelow >= cardHeight + pad) {
      targetTop = bounds.bottom + 16
    }
    // 2. Place above the spotlight box if space permits
    else if (spaceAbove >= cardHeight + pad) {
      targetTop = bounds.top - cardHeight - 16
    }
    // 3. If vertical space is constrained, place to the right side on wide displays
    else if (spaceRight >= cardWidth + 24) {
      targetLeft = bounds.right + 20
      targetTop = Math.max(pad, Math.min(bounds.top, window.innerHeight - cardHeight - pad))
    }
    // 4. Place to the left side if right side is constrained
    else if (spaceLeft >= cardWidth + 24) {
      targetLeft = bounds.left - cardWidth - 20
      targetTop = Math.max(pad, Math.min(bounds.top, window.innerHeight - cardHeight - pad))
    }
    // 5. Fallback: Place below or above with maximum clearance
    else if (spaceBelow >= spaceAbove) {
      targetTop = bounds.bottom + 14
    } else {
      targetTop = bounds.top - cardHeight - 14
    }

    // Viewport bounds safety clamp
    const maxTop = Math.max(pad, window.innerHeight - cardHeight - pad)
    const maxLeft = Math.max(pad, window.innerWidth - cardWidth - pad)
    const clampedTop = Math.max(pad, Math.min(targetTop, maxTop))
    const clampedLeft = Math.max(pad, Math.min(targetLeft, maxLeft))

    return {
      position: 'fixed',
      top: `${Math.round(clampedTop)}px`,
      left: `${Math.round(clampedLeft)}px`,
      width: `${cardWidth}px`,
      maxWidth: 'calc(100vw - 32px)',
    }
  }

  const tooltipStyle = calculatePopoverStyle()

  return (
    <div className="tour-overlay-container">
      {/* Dimmed backdrop */}
      <div className="tour-backdrop" onClick={skipTour} />

      {/* Viewport-locked spotlight cutout */}
      {bounds && (
        <div
          className="tour-spotlight"
          style={{
            position: 'fixed',
            top: Math.max(0, bounds.top - 8),
            left: Math.max(0, bounds.left - 8),
            width: bounds.width + 16,
            height: bounds.height + 16,
          }}
        />
      )}

      {/* Floating Tooltip Card */}
      <div ref={popoverRef} className="tour-popover card" style={tooltipStyle}>
        {/* Progress Bar Header */}
        <div className="tour-popover__progress-track">
          <div
            className="tour-popover__progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="tour-popover__header">
          <div className="tour-header-meta">
            <span className="tour-phase-badge">
              {currentStep.phase || 'STEP'}
            </span>
            <span className="tour-step-counter">
              Step {currentStep.step} of {totalSteps} ({progressPercent}%)
            </span>
          </div>
          <button className="tour-close-btn" onClick={skipTour} title="Exit Tour">
            ✕
          </button>
        </div>

        <h3 className="tour-popover__title">{currentStep.title}</h3>
        <p className="tour-popover__desc">{currentStep.description}</p>

        {currentStep.tip && (
          <div className="tour-popover__tip">
            <Icon name="sparkles" size={14} />
            <span>{currentStep.tip}</span>
          </div>
        )}

        {/* Step Progress Dots */}
        <div className="tour-dots-row">
          {Array.from({ length: totalSteps }).map((_, idx) => (
            <span
              key={idx}
              className={`tour-dot ${idx === currentStepIndex ? 'tour-dot--active' : idx < currentStepIndex ? 'tour-dot--completed' : ''}`}
              title={`Step ${idx + 1}`}
            />
          ))}
        </div>

        <div className="tour-popover__footer">
          <button
            type="button"
            className="btn btn--outline btn--sm"
            onClick={prevStep}
            disabled={isFirst}
          >
            ← Previous
          </button>

          <div className="tour-popover__right-actions">
            <button type="button" className="btn btn--ghost btn--sm" onClick={skipTour}>
              Skip Tour
            </button>
            <button type="button" className="btn btn--primary btn--sm" onClick={nextStep}>
              {isLast ? 'Complete Tour 🚀' : 'Next Step →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TourOverlay

