import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api } from '../services/api.js'
import { getToken, setToken, clearToken } from '../utils/token.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getToken()

    if (!token) {
      setLoading(false)
      return
    }

    api
      .getMe()
      .then((response) => setUser(response.data.user))
      .catch(() => clearToken())
      .finally(() => setLoading(false))
  }, [])

  const storeAuth = useCallback(({ token, user }) => {
    setToken(token)
    setUser(user)
  }, [])

  const login = useCallback(
    async (credentials) => {
      const response = await api.login(credentials)
      storeAuth(response.data)
      return response.data.user
    },
    [storeAuth],
  )

  const register = useCallback(
    async (details) => {
      const response = await api.register(details)
      storeAuth(response.data)
      return response.data.user
    },
    [storeAuth],
  )

  const logout = useCallback(() => {
    clearToken()
    setUser(null)
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const response = await api.getMe()
      if (response?.data?.user) {
        setUser(response.data.user)
        return response.data.user
      }
    } catch {
      // ignore
    }
    return null
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        loading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}