import mongoose from 'mongoose'
import { config } from '../config/env.js'
import { getServiceHealth, getKnowledgeStats } from './pythonService.service.js'

export const getSettings = async () => {
  let vectorStore = { status: 'unknown', documents: 0, chunks: 0, embeddingsInstalled: false, embeddingsLoaded: false }
  let pythonReachable = false
  try {
    const stats = await getKnowledgeStats()
    vectorStore = {
      status: stats.chunks > 0 ? 'indexed' : 'empty',
      documents: Number(stats.documents) || 0,
      chunks: Number(stats.chunks) || 0,
      embeddingsInstalled: Boolean(stats.embeddingsInstalled),
      embeddingsLoaded: Boolean(stats.embeddingsLoaded),
    }
    pythonReachable = true
  } catch {
    vectorStore.status = 'unreachable'
  }

  const mongoState = mongoose.connection.readyState
  const mongoStatus = mongoState === 1 ? 'connected' : mongoState === 2 ? 'connecting' : 'disconnected'

  return {
    mongodb: {
      status: mongoStatus,
      database: mongoose.connection.name || 'unknown',
    },
    vectorStore,
    pythonService: {
      url: config.pythonService.url,
      reachable: pythonReachable,
    },
    llm: {
      provider: config.llm.apiKey ? 'external' : 'local-fallback',
      model: config.llm.model,
      configured: Boolean(config.llm.apiKey),
    },
    agents: {
      embeddingModel: 'all-MiniLM-L6-v2',
      topK: 3,
      engine: 'python-agents',
    },
    app: {
      name: 'SignalOS Brand Listening',
      environment: config.nodeEnv,
    },
  }
}

export const getHealth = () => getServiceHealth()