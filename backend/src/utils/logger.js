const getTimestamp = () => new Date().toISOString()

export const logger = {
  info: (message) => console.log(`[INFO] ${getTimestamp()} ${message}`),
  error: (message) => console.error(`[ERROR] ${getTimestamp()} ${message}`),
}