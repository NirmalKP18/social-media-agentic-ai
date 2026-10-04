import 'dotenv/config'

const getFrontendOrigins = () => {
  const origins = process.env.FRONTEND_URL || 'http://localhost:5173'
  return origins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
}

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || '',
  frontendOrigins: getFrontendOrigins(),
  jwt: {
    secret: process.env.JWT_SECRET || 'your_jwt_secret_here',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  llm: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-flash-latest',
    baseUrl: process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta',
    // This is a total generation budget, not a per-model timeout. Keeping it
    // short prevents the final pipeline stage from appearing stuck when the
    // provider is unavailable.
    timeoutMs: Number(process.env.LLM_TIMEOUT_MS) || 8000,
  },
  pythonService: {
    url: process.env.PYTHON_SERVICE_URL || `http://127.0.0.1:${Number(process.env.PYTHON_SERVICE_PORT) || 8000}`,
    host: process.env.PYTHON_SERVICE_HOST || '127.0.0.1',
    port: Number(process.env.PYTHON_SERVICE_PORT) || 8000,
    autostart: process.env.PYTHON_SERVICE_AUTOSTART !== 'false',
    command: process.env.PYTHON_COMMAND || '',
    startTimeoutMs: Number(process.env.PYTHON_SERVICE_START_TIMEOUT_MS) || 45000,
    timeoutMs: Number(process.env.PYTHON_SERVICE_TIMEOUT_MS) || 15000,
    pipelineTimeoutMs: Number(process.env.PYTHON_PIPELINE_TIMEOUT_MS) || 60000,
  },
  rateLimit: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX) || (process.env.NODE_ENV === 'production' ? 1000 : 10000),
  },
  uploads: {
    maxUploadBytes: (Number(process.env.MAX_UPLOAD_MB) || 10) * 1024 * 1024,
  },
  platforms: {
    youtube: { apiKey: process.env.YOUTUBE_API_KEY || '' },
    reddit: { clientId: process.env.REDDIT_CLIENT_ID || '', clientSecret: process.env.REDDIT_CLIENT_SECRET || '' },
    meta: { accessToken: process.env.META_ACCESS_TOKEN || '', pageId: process.env.META_PAGE_ID || '', apiVersion: process.env.META_API_VERSION || 'v23.0' },
    x: { bearerToken: process.env.X_BEARER_TOKEN || '' },
    linkedin: { accessToken: process.env.LINKEDIN_ACCESS_TOKEN || '', organizationUrn: process.env.LINKEDIN_ORGANIZATION_URN || '', version: process.env.LINKEDIN_VERSION || '202508' },
  },
}

if (config.nodeEnv === 'production' && (!config.mongodbUri || config.jwt.secret === 'your_jwt_secret_here')) {
  throw new Error('Production requires MONGODB_URI and a secure JWT_SECRET')
}
