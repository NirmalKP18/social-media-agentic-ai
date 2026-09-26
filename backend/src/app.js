import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { config } from './config/env.js'
import apiRouter from './routes/index.js'
import { requestLogger } from './middleware/request.middleware.js'
import { notFoundHandler, errorHandler } from './middleware/error.middleware.js'

const LOCAL_DEV_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/

const isLocalDevOrigin = (origin) => LOCAL_DEV_ORIGIN.test(origin)

const app = express()

app.disable('x-powered-by')

app.use(helmet())

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true)

      if (config.frontendOrigins.includes(origin)) {
        return callback(null, true)
      }

      if (config.nodeEnv !== 'production' && isLocalDevOrigin(origin)) {
        return callback(null, true)
      }

      return callback(null, false)
    },
  }),
)

app.use(
  rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => config.nodeEnv !== 'production' && (req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1' || isLocalDevOrigin(req.headers.origin)),
    message: { success: false, message: 'Too many requests, please try again later.' },
  }),
)

app.use(express.json({ limit: '8mb' }))
app.use(express.urlencoded({ extended: true }))

app.use(requestLogger)

app.use('/api', apiRouter)

app.use(notFoundHandler)
app.use(errorHandler)

export default app
