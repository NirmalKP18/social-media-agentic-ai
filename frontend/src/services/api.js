import axios from 'axios'
import { getToken, clearToken } from '../utils/token.js'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const url = error.config?.url || ''

    if (
      status === 401 &&
      !url.includes('/auth/login') &&
      !url.includes('/auth/register') &&
      getToken()
    ) {
      clearToken()
      if (window.location.pathname !== '/login') {
        window.location.assign('/login')
      }
    }

    const message =
      error.response?.data?.message ||
      (error.code === 'ECONNABORTED'
        ? 'Request timed out'
        : 'Unable to reach the backend')
    return Promise.reject(new Error(message))
  },
)

export const api = {
  getHealth: () => apiClient.get('/health').then((response) => response.data),
  register: (data) => apiClient.post('/auth/register', data).then((response) => response.data),
  login: (data) => apiClient.post('/auth/login', data).then((response) => response.data),
  getMe: () => apiClient.get('/auth/me').then((response) => response.data),
}

export default apiClient