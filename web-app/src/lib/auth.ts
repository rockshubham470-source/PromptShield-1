import { create } from 'zustand'
import api from './api.service'

interface User {
  id: string
  email: string
  name: string
  tier: 'free' | 'professional' | 'business' | 'enterprise'
  organization_id?: string
  organization_name?: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  checkAuth: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  signup: (email: string, password: string, name: string) => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),

  checkAuth: async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      set({ isAuthenticated: false, user: null })
      return
    }

    try {
      const response = await api.get('/auth/me')
      const userWithOrg = response.data as User
      localStorage.setItem('organization_id', userWithOrg.organization_id || '')
      localStorage.setItem('organization_name', userWithOrg.organization_name || '')
      set({ user: userWithOrg, isAuthenticated: true, token })
    } catch {
      localStorage.removeItem('token')
      localStorage.removeItem('organization_id')
      localStorage.removeItem('organization_name')
      set({ isAuthenticated: false, user: null, token: null })
    }
  },

  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', {
      email,
      password,
    })

    const { access_token, user } = response.data
    const userWithOrg = user as User

    localStorage.setItem('token', access_token)
    localStorage.setItem('organization_id', userWithOrg.organization_id || '')
    localStorage.setItem('organization_name', userWithOrg.organization_name || '')

    set({
      token: access_token,
      user: userWithOrg,
      isAuthenticated: true,
    })
  },
  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('organization_id')
    localStorage.removeItem('organization_name')
    set({ user: null, token: null, isAuthenticated: false })
  },

  signup: async (
    email: string,
    password: string,
    name: string
  ) => {
    const response = await api.post(
      '/auth/signup',
      {
        email,
        password,
        name,
      }
    )

    const { access_token, user } = response.data
    const userWithOrg = user as User

    localStorage.setItem('token', access_token)
    localStorage.setItem('organization_id', userWithOrg.organization_id || '')
    localStorage.setItem('organization_name', userWithOrg.organization_name || '')

    set({
      token: access_token,
      user: userWithOrg,
      isAuthenticated: true,
    })
  },
}))

export const getCurrentOrg = async (): Promise<string | null> => {
  const token = localStorage.getItem('token')
  if (!token) return null
  try {
    const res = await api.get('/auth/me')
    return res.data.organization_id ?? null
  } catch {
    return null
  }
}