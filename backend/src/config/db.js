import mongoose from 'mongoose'
import { config } from './env.js'
import { logger } from '../utils/logger.js'

const CONNECT_ATTEMPTS = 2
const SERVER_SELECTION_TIMEOUT_MS = 15000

const delay = (ms) => new Promise((resolve) => { setTimeout(resolve, ms) })

export const connectDB = async () => {
  if (!config.mongodbUri) {
    logger.error('MONGODB_URI is not set - skipping database connection')
    return
  }

  for (let attempt = 1; attempt <= CONNECT_ATTEMPTS; attempt += 1) {
    try {
      await mongoose.connect(config.mongodbUri, { serverSelectionTimeoutMS: SERVER_SELECTION_TIMEOUT_MS })
      logger.info('MongoDB connected successfully')
      return
    } catch (error) {
      logger.error(`MongoDB connection attempt ${attempt}/${CONNECT_ATTEMPTS} failed: ${error.message}`)
      if (attempt === CONNECT_ATTEMPTS) throw error
      await delay(2000)
    }
  }
}

export default connectDB
