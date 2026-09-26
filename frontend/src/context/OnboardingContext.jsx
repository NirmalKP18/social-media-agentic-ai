import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useAuth } from './AuthContext.jsx'

const OnboardingContext = createContext(null)

export const TOUR_STEPS = [
  {
    step: 1,
    phase: 'LIVE TELEMETRY',
    target: '[data-tour="dashboard-overview"]',
    fallbackTarget: '.dashboard-page',
    title: 'Step 1: Real-Time Intelligence & Dashboard',
    description:
      'Welcome to your central operations hub! Monitor live mention throughput, real-time sentiment distribution (Positive, Neutral, Negative), high-priority incident triggers, and active multi-agent pipeline telemetry.',
    tip: 'Review live signal metrics here before triggering manual or automated ingestion pipelines.',
    route: '/dashboard',
  },
  {
    step: 2,
    phase: 'DATA INGESTION',
    target: '[data-tour="add-mention-cta"]',
    fallbackTarget: '.posts-page-container',
    title: 'Step 2: Ingest & Clean Social Mentions (Agent 1)',
    description:
      'Ingest raw brand mentions from X (Twitter), Reddit, LinkedIn, Facebook, Instagram, or manual entry. Agent 1 automatically cleans raw text, strips malicious URLs/handles, normalizes formatting, and filters spam.',
    tip: 'Use "Add New Mention" for real-time testing or import batch social datasets.',
    route: '/posts',
  },
  {
    step: 3,
    phase: 'AGENTIC PIPELINE',
    target: '[data-tour="run-pipeline-btn"]',
    fallbackTarget: '.pipeline-console',
    title: 'Step 3: Run Autonomous 4-Agent Workflow',
    description:
      'Launch the autonomous multi-agent pipeline on any ingested post. Watch Agent 1 ➔ Agent 2 ➔ Agent 3 ➔ Agent 4 execute with real-time stage telemetry, milestone timers, and instant state synchronization.',
    tip: 'Execute batch runs across entire feeds or test individual social mentions with live logs.',
    route: '/posts',
  },
  {
    step: 4,
    phase: 'NLP & SENTIMENT',
    target: '[data-tour="analyses-container"]',
    fallbackTarget: '.analyses-page-container',
    title: 'Step 4: Deep NLP, Emotion & Entity Analysis (Agent 2)',
    description:
      'Inspect the NLP intelligence layer: continuous sentiment scoring (-1.00 to +1.00), emotion vectors (Anger, Joy, Fear, Surprise, Sadness), extracted Named Entities (Organizations, Products, People), and theme clustering.',
    tip: 'Filter by high negative sentiment to immediately identify and triage potential PR crises.',
    route: '/analyses',
  },
  {
    step: 5,
    phase: 'SEMANTIC RAG',
    target: '[data-tour="retrieval-container"]',
    fallbackTarget: '.retrieval-page-container',
    title: 'Step 5: Vector RAG & Knowledge Base Retrieval (Agent 3)',
    description:
      'Agent 3 indexes and queries your enterprise knowledge base using SentenceTransformers vector embeddings. It retrieves top-k relevant policy and factual evidence with cosine similarity scores to prevent AI hallucinations.',
    tip: 'Inspect ranked documents and relevance scores to ensure responses adhere to company policy.',
    route: '/retrieval',
  },
  {
    step: 6,
    phase: 'EXECUTIVE SYNTHESIS',
    target: '[data-tour="insights-container"]',
    fallbackTarget: '.insights-page-container',
    title: 'Step 6: AI Insight Synthesis & Response Drafts (Agent 4)',
    description:
      'Agent 4 combines the original mention, NLP analytics, and retrieved RAG evidence to draft executive summaries, crisis escalation alerts, and empathetic brand response drafts.',
    tip: 'All AI generated responses remain strictly in draft mode until approved by a human reviewer.',
    route: '/insights',
  },
  {
    step: 7,
    phase: 'HUMAN GOVERNANCE',
    target: '[data-tour="human-approval-actions"]',
    fallbackTarget: '.insight-card',
    title: 'Step 7: Human-in-the-Loop Governance & Authorization',
    description:
      'Maintain 100% human oversight. Review the complete verifiable trace (Mention ➔ NLP ➔ Evidence ➔ Draft), edit content, and formally Approve or Reject before any external communication goes live.',
    tip: 'Every approval decision is timestamped and logged for compliance and auditing.',
    route: '/insights',
  },
  {
    step: 8,
    phase: 'ADMIN & BILLING',
    target: '[data-tour="admin-overview"]',
    fallbackTarget: '.admin-page-container',
    title: 'Step 8: Platform Administration & Billing Ledger',
    description:
      'Manage user accounts, assign roles (Admin, Reviewer, User), manage enterprise subscription plans, and monitor payment ledgers and platform health in the Executive Admin Console.',
    tip: 'You can relaunch this interactive tour anytime from the sidebar or settings!',
    route: '/admin',
  },
]

export const CHECKLIST_ITEMS = [
  { key: 'add_mention', label: '1. Ingest Social Mention', desc: 'Ingest raw post into system (Agent 1)' },
  { key: 'process_mention', label: '2. Run AI Multi-Agent Pipeline', desc: 'Execute Agent 1 ➔ 4 pipeline' },
  { key: 'review_nlp', label: '3. Inspect NLP & Sentiment', desc: 'Verify NER, sentiment & emotion (Agent 2)' },
  { key: 'review_evidence', label: '4. Check RAG Evidence', desc: 'Verify Knowledge Base hits (Agent 3)' },
  { key: 'review_insight', label: '5. Review AI Insight & Draft', desc: 'Check synthesized response (Agent 4)' },
  { key: 'approve_reject', label: '6. Authorize or Reject Draft', desc: 'Human-in-the-loop governance' },
]

export function OnboardingProvider({ children }) {
  const { user } = useAuth()

  const [showWelcomeModal, setShowWelcomeModal] = useState(false)
  const [isTourActive, setIsTourActive] = useState(false)
  const [isTourCompleted, setIsTourCompleted] = useState(false)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [dontShowAgain, setDontShowAgain] = useState(false)

  const [checklist, setChecklist] = useState(() => {
    return {
      add_mention: false,
      process_mention: false,
      review_nlp: false,
      review_evidence: false,
      review_insight: false,
      approve_reject: false,
    }
  })

  // Check user preferences from backend & localStorage
  useEffect(() => {
    if (!user) return

    if (user.onboardingPreferences) {
      const prefs = user.onboardingPreferences
      setDontShowAgain(Boolean(prefs.dontShowAgain))
      if (prefs.checklist) {
        setChecklist((prev) => ({ ...prev, ...prefs.checklist }))
      }
      if (!prefs.dontShowAgain && !prefs.hasSeenWelcome) {
        setShowWelcomeModal(true)
      }
      return
    }

    const storageKey = `signalos_onboarding_${user.id || user.email}`
    const saved = localStorage.getItem(storageKey)

    if (saved) {
      try {
        const data = JSON.parse(saved)
        setDontShowAgain(Boolean(data.dontShowAgain))
        if (data.checklist) {
          setChecklist((prev) => ({ ...prev, ...data.checklist }))
        }
        if (!data.dontShowAgain && !data.hasSeenWelcome) {
          setShowWelcomeModal(true)
        }
      } catch {
        setShowWelcomeModal(true)
      }
    } else {
      setShowWelcomeModal(true)
    }
  }, [user])

  const savePreferences = useCallback(
    (updates = {}) => {
      if (!user) return
      const storageKey = `signalos_onboarding_${user.id || user.email}`
      const current = localStorage.getItem(storageKey)
      let parsed = {}
      try {
        parsed = current ? JSON.parse(current) : {}
      } catch {
        parsed = {}
      }

      const updated = {
        ...parsed,
        dontShowAgain: updates.dontShowAgain !== undefined ? updates.dontShowAgain : dontShowAgain,
        hasSeenWelcome: true,
        checklist: updates.checklist || checklist,
      }

      localStorage.setItem(storageKey, JSON.stringify(updated))
    },
    [user, dontShowAgain, checklist],
  )

  const markChecklistDone = useCallback(
    (key) => {
      setChecklist((prev) => {
        if (prev[key]) return prev
        const updated = { ...prev, [key]: true }
        savePreferences({ checklist: updated })
        return updated
      })
    },
    [savePreferences],
  )

  const startTour = useCallback(() => {
    setShowWelcomeModal(false)
    setIsTourCompleted(false)
    setCurrentStepIndex(0)
    setIsTourActive(true)
    savePreferences({ hasSeenWelcome: true })
  }, [savePreferences])

  const finishTour = useCallback(() => {
    setIsTourActive(false)
    setIsTourCompleted(false)
    setShowWelcomeModal(false)
    savePreferences({ hasSeenWelcome: true })
  }, [savePreferences])

  const nextStep = useCallback(() => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1)
    } else {
      setIsTourActive(false)
      setIsTourCompleted(true)
    }
  }, [currentStepIndex])

  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1)
    }
  }, [currentStepIndex])

  const skipTour = useCallback(() => {
    setIsTourActive(false)
    setIsTourCompleted(false)
    setShowWelcomeModal(false)
    savePreferences({ hasSeenWelcome: true })
  }, [savePreferences])

  const handleDontShowAgainChange = (checked) => {
    setDontShowAgain(checked)
    savePreferences({ dontShowAgain: checked })
  }

  return (
    <OnboardingContext.Provider
      value={{
        showWelcomeModal,
        setShowWelcomeModal,
        isTourActive,
        isTourCompleted,
        currentStepIndex,
        currentStep: TOUR_STEPS[currentStepIndex],
        totalSteps: TOUR_STEPS.length,
        dontShowAgain,
        handleDontShowAgainChange,
        startTour,
        nextStep,
        prevStep,
        skipTour,
        finishTour,
        checklist,
        markChecklistDone,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  )
}

export const useOnboarding = () => {
  const context = useContext(OnboardingContext)
  if (!context) {
    throw new Error('useOnboarding must be used within an AuthProvider')
  }
  return context
}
