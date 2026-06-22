import React, { useState, useEffect } from 'react'
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom'

import { useAuthStore } from './lib/auth'

import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'

import Dashboard from './pages/Dashboard'
import Detections from './pages/Detections'
import Analytics from './pages/Analytics'
import ApiKeys from './pages/ApiKeys'
import Rules from './pages/Rules'
import Settings from './pages/Settings'
import Login from './pages/Login'
import Applications from './pages/Applications'
import ApplicationDetail from './pages/ApplicationDetail'
import UsageMetrics from './pages/UsageMetrics'
import AuditLogs from './pages/AuditLogs'
import LiveMonitoring from './pages/LiveMonitoring'
import Notifications from './pages/Notifications'

import './index.css'

function App() {
  const { isAuthenticated, checkAuth } = useAuthStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      await checkAuth()
      setLoading(false)
    }
    init()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0F1C]">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <Router>
      {!isAuthenticated ? (
        <Login />
      ) : (
        <div className="flex h-screen bg-[#0A0F1C] text-white overflow-hidden">

          {/* Sidebar */}
          <Sidebar />

          {/* Right Side Layout */}
          <div className="flex-1 flex flex-col overflow-hidden">

            {/* Navbar (fixed height container) */}
            <div className="h-20 shrink-0 border-b border-white/10">
              <Navbar />
            </div>


            {/* Page Content */}
            <main className="flex-1 overflow-y-auto">
              <div className="p-6 max-w-[1800px] mx-auto">

                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/detections" element={<Detections />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/api-keys" element={<ApiKeys />} />
                  <Route path="/rules" element={<Rules />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/applications" element={<Applications />} />
                  <Route path="/applications/:id" element={<ApplicationDetail />} />
                  <Route path="/usage" element={<UsageMetrics />} />
                  <Route path="/audit-logs" element={<AuditLogs />} />
                  <Route path="/live" element={<LiveMonitoring />} />
                  <Route path="/notifications" element={<Notifications />} />

                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>

              </div>
            </main>

          </div>
        </div>
      )}
    </Router>
  )
}

export default App