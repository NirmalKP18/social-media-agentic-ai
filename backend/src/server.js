import connectDB from './config/db.js'
import app from './app.js'
import { config } from './config/env.js'
import { logger } from './utils/logger.js'

const startServer = async () => {
  await connectDB()

  app.listen(config.port, () => {
    logger.info(`[${config.nodeEnv}] Backend API running on http://localhost:${config.port}`)
  })
}

startServer()