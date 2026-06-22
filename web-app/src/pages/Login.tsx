import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  AlertCircle,
  Shield,
  Mail,
  Lock,
  User,
  ArrowRight,
} from 'lucide-react'

import { useAuthStore } from '../lib/auth'

export default function Login() {
  const navigate = useNavigate()
  const { login, signup } = useAuthStore()

  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setError('')
    setLoading(true)

    try {
      if (isSignUp) {
        await signup(
          formData.email,
          formData.password,
          formData.name
        )
      } else {
        await login(formData.email, formData.password)
      }

      navigate('/')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Authentication failed'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050816] flex items-center justify-center px-4">

      {/* Grid Background */}
      <div className="absolute inset-0 opacity-20">
        <div
          className="h-full w-full"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Glow Effects */}
      <div className="absolute top-0 left-0 h-[500px] w-[500px] bg-blue-600/20 blur-[140px]" />
      <div className="absolute bottom-0 right-0 h-[500px] w-[500px] bg-purple-600/20 blur-[140px]" />

      <div className="relative z-10 w-full max-w-7xl grid lg:grid-cols-2 gap-16 items-center">

        {/* Left Section */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          className="hidden lg:block"
        >
          <div className="mb-8 flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20">
              <Shield size={32} className="text-blue-400" />
            </div>

            <div>
              <h1 className="text-5xl font-bold">
                <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  PromptShield
                </span>
              </h1>

              <p className="text-gray-400 mt-2">
                Enterprise AI Security Platform
              </p>
            </div>
          </div>

          <p className="text-xl text-gray-300 mb-10 leading-relaxed">
            Protect LLM applications from prompt injection,
            sensitive data leakage, jailbreak attempts,
            and malicious user interactions.
          </p>

          <div className="space-y-5">
            {[
              'Prompt Injection Detection',
              'Real-Time Threat Analysis',
              'Enterprise Governance',
              'AI Risk Monitoring',
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 text-gray-300"
              >
                <div className="h-2 w-2 rounded-full bg-blue-400" />
                {item}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4 mt-12">
            {[
              {
                value: '88.4%',
                label: 'Accuracy',
              },
              {
                value: '<60ms',
                label: 'Latency',
              },
              {
                value: '1000+',
                label: 'Req/Sec',
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5"
              >
                <div className="text-2xl font-bold text-white">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-400">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md mx-auto"
        >
          <div className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl">

            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white">
                {isSignUp ? 'Create Account' : 'Welcome Back'}
              </h2>

              <p className="text-gray-400 mt-2">
                Secure access to PromptShield
              </p>
            </div>

            {error && (
              <div className="mb-6 flex gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
                <AlertCircle
                  size={20}
                  className="text-red-400"
                />
                <p className="text-red-300 text-sm">
                  {error}
                </p>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              {isSignUp && (
                <div className="relative">
                  <User
                    size={18}
                    className="absolute left-4 top-4 text-gray-500"
                  />
                  <input
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Full Name"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all"
                  />
                </div>
              )}

              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-4 top-4 text-gray-500"
                />
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email Address"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all"
                />
              </div>

              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-4 top-4 text-gray-500"
                />
                <input
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group w-full rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 py-3 font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02]"
              >
                <span className="flex items-center justify-center gap-2">
                  {loading
                    ? 'Loading...'
                    : isSignUp
                    ? 'Create Account'
                    : 'Sign In'}

                  <ArrowRight
                    size={18}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </span>
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() =>
                  setIsSignUp(!isSignUp)
                }
                className="text-blue-400 hover:text-blue-300"
              >
                {isSignUp
                  ? 'Already have an account? Sign In'
                  : "Don't have an account? Sign Up"}
              </button>
            </div>

            <div className="mt-8 border-t border-white/10 pt-6">
              <div className="rounded-xl bg-white/5 p-4 text-xs text-gray-400">
                <div>Demo Credentials</div>
                <div className="mt-2">
                  Email: demo@example.com
                </div>
                <div>Password: demo123</div>
              </div>
            </div>

          </div>
        </motion.div>
      </div>
    </div>
  )
}