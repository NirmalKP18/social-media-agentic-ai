import 'dotenv/config'

const getClientOrigins = () => {
  const origins = process.env.CLIENT_ORIGINS || 'http://localhost:5173'
  return origins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
}

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || '',
  clientOrigins: getClientOrigins(),
}