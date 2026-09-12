import mongoose from 'mongoose'

const DB_STATES = ['disconnected', 'connected', 'connecting', 'disconnecting']

export const getHealthData = () => ({
  success: true,
  message: 'Backend API is running',
  database: DB_STATES[mongoose.connection.readyState] || 'unknown',
})