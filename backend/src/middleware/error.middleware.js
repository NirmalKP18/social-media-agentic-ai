import { sendError } from '../utils/apiResponse.js'
import { logger } from '../utils/logger.js'

export const notFoundHandler = (req, res) => {
  sendError(res, `Route not found: ${req.method} ${req.originalUrl}`, 404)
}

export const errorHandler = (err, req, res, next) => {
  let status = err.status || 500
  let message = err.message || 'Internal Server Error'
  if (err.name === 'ValidationError' || err.name === 'CastError') status = 400
  if (err.code === 11000) { status = 409; message = 'A record with these unique fields already exists' }
  if (status >= 500 && !err.status && process.env.NODE_ENV === 'production') {
    message = 'Internal Server Error'
  }
  logger.error(`${req.method} ${req.originalUrl} ${status}: ${err.message}`)
  sendError(res, message, status)
}
