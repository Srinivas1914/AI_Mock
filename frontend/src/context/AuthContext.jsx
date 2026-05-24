import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

const API = axios.create({ baseURL: '/api' })

// Attach JWT to every request
API.interceptors.request.use(cfg => {
  const token = localStorage.getItem('preplab_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

API.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('preplab_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export { API }

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('preplab_token')
    if (token) {
      API.get('/auth/me')
        .then(r => setUser(r.data))
        .catch(() => localStorage.removeItem('preplab_token'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (email, password) => {
    const form = new URLSearchParams()
    form.append('username', email)
    form.append('password', password)
    const { data } = await API.post('/auth/login', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })
    localStorage.setItem('preplab_token', data.access_token)
    setUser(data.user)
    return data.user
  }, [])

  const register = useCallback(async (name, email, password) => {
    const { data } = await API.post('/auth/register', { name, email, password })
    localStorage.setItem('preplab_token', data.access_token)
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('preplab_token')
    setUser(null)
    toast.success('Logged out successfully')
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, API }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
