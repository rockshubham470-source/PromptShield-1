import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  AlertTriangle,
  BarChart3,
  KeyRound,
  Settings,
  Shield,
  AppWindow,
  Activity,
  FileText,
  Gauge,
  Lock,
  Webhook,
  Users,
  CreditCard,
} from 'lucide-react'

const menuItems = [
  {
    group: 'Core',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
      { icon: AppWindow, label: 'Applications', path: '/applications' },
      { icon: AlertTriangle, label: 'Detections', path: '/detections' },
    ],
  },
  {
    group: 'Insights',
    items: [
      { icon: BarChart3, label: 'Analytics', path: '/analytics' },
      { icon: Gauge, label: 'Usage Metrics', path: '/usage' },
      { icon: Activity, label: 'Live Monitoring', path: '/live' },
    ],
  },
  {
    group: 'Security',
    items: [
      { icon: Shield, label: 'Rules', path: '/rules' },
      { icon: FileText, label: 'Audit Logs', path: '/audit-logs' },
      { icon: Lock, label: 'Security', path: '/security' },
      { icon: Webhook, label: 'Webhooks', path: '/webhooks' },
    ],
  },
  {
    group: 'Organization',
    items: [
      { icon: Users, label: 'Team', path: '/team' },
      { icon: CreditCard, label: 'Billing', path: '/billing' },
    ],
  },
  {
    group: 'System',
    items: [
      { icon: KeyRound, label: 'API Keys', path: '/api-keys' },
      { icon: Settings, label: 'Settings', path: '/settings' },
    ],
  },
]

export default function Sidebar() {
  const location = useLocation()

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <aside className="w-72 border-r border-white/10 bg-white/5 backdrop-blur-xl flex flex-col h-screen">

      {/* LOGO */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 flex items-center justify-center font-bold">
            P
          </div>

          <div>
            <h1 className="text-lg font-bold text-white">
              PromptShield
            </h1>
            <p className="text-xs text-gray-400">
              AI Security Platform
            </p>
          </div>
        </div>
      </div>

      {/* NAV */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-6">

        {menuItems.map((section) => (
          <div key={section.group}>
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-3 px-3">
              {section.group}
            </div>

            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon
                const active = isActive(item.path)

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`
                      flex items-center gap-3
                      px-4 py-3 rounded-xl
                      transition-all duration-200
                      ${
                        active
                          ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }
                    `}
                  >
                    <Icon size={18} />
                    <span className="text-sm font-medium">
                      {item.label}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}

      </nav>

      {/* USAGE FOOTER */}

    </aside>
  )
}