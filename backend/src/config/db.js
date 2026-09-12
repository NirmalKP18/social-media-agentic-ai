import mongoose from 'mongoose'
import { config } from './env.js'
import { logger } from '../utils/logger.js'

export const connectDB = async () => {
  try {
    await mongoose.connect(config.mongodbUri)
    logger.info('MongoDB connected successfully')
  } catch (error) {
    logger.error(`MongoDB connection failed: ${error.message}`)
    process.exit(1)
  }
}

export default connectDB