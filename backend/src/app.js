import express from 'express'
import cors from 'cors'
import { config } from './config/env.js'
import healthRouter from './routes/health.routes.js'
import { notFoundHandler, errorHandler } from './middleware/error.middleware.js'

const LOCAL_DEV_ORIGIN =
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/

const isLocalDevOrigin = (origin) => LOCAL_DEV_ORIGIN.test(origin)

const app = express()

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true)

      if (config.clientOrigins.includes(origin)) {
        return callback(null, true)
      }

      if (config.nodeEnv !== 'production' && isLocalDevOrigin(origin)) {
        return callback(null, true)
      }

      return callback(null, false)
    },
  }),
)
app.use(express.json())

app.use('/api', healthRouter)

app.use(notFoundHandler)
app.use(errorHandler)

export default app