import mongoose from 'mongoose'
import connectDB from './config/db.js'
import app from './app.js'
import { config } from './config/env.js'
import { logger } from './utils/logger.js'
import { startPythonService, stopPythonService } from './services/pythonService.service.js'

import { ensureAdminAccount } from './services/admin.service.js'

let server = null

const shutdown = async (signal) => {
  logger.info(`${signal} received - shutting down gracefully`)
  stopPythonService()
  if (server) await new Promise((resolve) => server.close(resolve))
  try { await mongoose.connection.close() } catch { /* connection already closed */ }
  process.exit(0)
}

const startServer = async () => {
  try {
    await connectDB()
    await ensureAdminAccount()
  } catch (error) {
    logger.error(`Continuing without a confirmed database connection: ${error.message}`)
  }

  if (config.pythonService.autostart) {
    const ready = await startPythonService()
    if (!ready) logger.error('Python agent service is not ready - the workflow will use the Node-only fallback')
  }

  server = app.listen(config.port, () => {
    logger.info(`[${config.nodeEnv}] Backend API running on http://localhost:${config.port}`)
  })
}

process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled promise rejection: ${reason instanceof Error ? reason.message : reason}`)
})

process.on('uncaughtException', (error) => {
  logger.error(`Uncaught exception: ${error.message}`)
  shutdown('uncaughtException')
})

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))

startServer()
