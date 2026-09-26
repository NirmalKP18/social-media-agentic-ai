import { config } from '../config/env.js'
import { logger } from '../utils/logger.js'

const CANDIDATE_LLM_MODELS = [
  config.llm.model || 'gemini-3.6-flash',
  'gemini-3.6-flash',
  'gemini-3.1-flash-lite',
  'gemini-3.7-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-flash-latest',
  'gemini-3.8-flash',
]

const localFallback = ({ query, evidence, negativeTopic, comments = [] }) => {
  const hasQuestions = comments.some((c) => c.intent === 'question' || String(c.content).includes('?'))
  const hasComplaints = comments.some((c) => c.intent === 'complaint' || c.sentiment?.label === 'negative')
  
  let draft = ''
  if (hasComplaints && hasQuestions) {
    draft = `Thank you for sharing your feedback and inquiries${negativeTopic ? ` regarding ${negativeTopic}` : ''}. Our team has reviewed the concerns raised in the comments. We are actively investigating the reported issues and will provide direct resolutions to all questions shortly. For immediate assistance, please reach out to our official support channel.`
  } else if (hasQuestions) {
    draft = `Thanks for reaching out with your questions! We appreciate the active discussion. Our engineering and support teams are looking into the specific points raised in the comments and will provide full details shortly.`
  } else if (hasComplaints) {
    draft = `We sincerely apologize for the inconvenience reported${negativeTopic ? ` with ${negativeTopic}` : ''}. We take community feedback seriously and are actively working on a resolution. Thank you for your patience.`
  } else {
    draft = `Thank you for the active discussion and feedback${negativeTopic ? ` about ${negativeTopic}` : ''}. We are closely monitoring this thread and appreciate your continued engagement with our platform.`
  }

  return {
    provider: 'local-fallback',
    model: 'grounded-template-v2',
    warning: 'No LLM API key was configured; review this comment-grounded draft before broadcast.',
    draft,
    rationale: `Drafted from ${evidence.length} retrieved post(s) and ${comments.length} analyzed comment(s)${query ? ` for “${query}”` : ''}.`,
  }
}

const parseJson = (text) => {
  const cleaned = text.replace(/^```json\s*|\s*```$/g, '').trim()
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON object detected in response')
  return JSON.parse(jsonMatch[0])
}

export const generateGroundedDraft = async ({ query, evidence = [], negativeTopic, comments = [], knowledgeSources = [] }) => {
  if (!config.llm.apiKey || (evidence.length === 0 && comments.length === 0)) {
    return localFallback({ query, evidence, negativeTopic, comments })
  }

  const formattedComments = comments.slice(0, 20).map((c) => ({
    author: c.author || 'User',
    content: c.content,
    sentiment: c.sentiment?.label || 'neutral',
    intent: c.intent || 'other',
  }))

  const formattedEvidence = evidence.slice(0, 6).map((e) => ({
    id: e.id,
    content: e.content,
  }))

  const formattedKnowledge = knowledgeSources.slice(0, 6).map((k) => ({
    title: k.title,
    chunk: k.chunk,
  }))

  const systemPrompt = `You are Agent 4: Strategic PR & Communications Intelligence Agent.
Your job is to generate a highly accurate, grounded, empathetic, and professional social media PR response.
CRITICAL INSTRUCTIONS:
1. READ and COMPREHEND both the main social post AND all attached audience comments/replies.
2. If commenters asked specific questions or raised specific complaints, your draft response must directly address those exact topics.
3. Ground your response strictly on the provided Knowledge Base facts and evidence. Do not invent unverifiable claims.
4. Maintain a calm, helpful, brand-protective executive tone.
5. Return ONLY a valid JSON object with keys:
   - "draft": string (the exact public response text, max 1000 characters)
   - "rationale": string (concise explanation of how this response addresses the post and specific comment inquiries)`

  const payloadBody = {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents: [{
      role: 'user',
      parts: [{
        text: JSON.stringify({
          query: query || 'social conversation overview',
          evidencePosts: formattedEvidence,
          readComments: formattedComments,
          knowledgeBaseCitations: formattedKnowledge,
          negativeTopic: negativeTopic || null,
        }),
      }],
    }],
    generationConfig: { temperature: 0.15, responseMimeType: 'application/json' },
  }

  const modelsToTry = [...new Set(CANDIDATE_LLM_MODELS.filter(Boolean))]
  let lastError = null

  for (const modelName of modelsToTry) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), config.llm.timeoutMs || 25000)

    try {
      const url = `${config.llm.baseUrl}/models/${encodeURIComponent(modelName)}:generateContent?key=${encodeURIComponent(config.llm.apiKey)}`
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'x-goog-api-key': config.llm.apiKey,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify(payloadBody),
      })

      if (!response.ok) {
        const errPayload = await response.json().catch(() => ({}))
        const errorMsg = errPayload.error?.message || `HTTP ${response.status}`
        logger.warn(`LLM model ${modelName} returned ${response.status}: ${errorMsg}. Trying next candidate...`)
        continue
      }

      const payload = await response.json()
      const parts = payload.candidates?.[0]?.content?.parts || []
      const responseText = parts
        .filter((p) => !p.thought && typeof p.text === 'string')
        .map((p) => p.text)
        .join('\n') || parts.map((p) => p.text || '').join('\n')

      if (!responseText.trim()) continue

      const parsed = parseJson(responseText)
      if (!parsed.draft || typeof parsed.draft !== 'string') {
        throw new Error('LLM response missing valid draft field')
      }

      logger.info(`Agent 4 PR response synthesized successfully using model ${modelName}`)
      return {
        provider: 'gemini',
        model: modelName,
        warning: '',
        draft: parsed.draft.slice(0, 2000),
        rationale: String(parsed.rationale || `Addressed ${formattedComments.length} comment(s) and grounded on ${formattedKnowledge.length} knowledge source(s).`).slice(0, 1000),
      }
    } catch (err) {
      lastError = err
      logger.warn(`Model ${modelName} failed generation: ${err.message}`)
    } finally {
      clearTimeout(timer)
    }
  }

  logger.warn(`All Gemini candidate models failed (${lastError?.message || 'Unknown error'}). Falling back to local grounded template.`)
  return localFallback({ query, evidence, negativeTopic, comments })
}


