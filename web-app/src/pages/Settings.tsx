import React, { useState } from 'react'
import { useAuthStore } from '../lib/auth'
import { Save, Lock } from 'lucide-react'

export default function Settings() {
  const { user } = useAuthStore()
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    notifications: true,
    alerts: true,
    threshold: 60,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-gray-400">Manage your account and application settings</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main Settings */}
        <div className="col-span-2">
          {/* Profile Settings */}
          <div className="card mb-6">
            <h3 className="text-lg font-semibold mb-4">Profile Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-sm mb-2">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                />
              </div>
              <button className="btn-primary flex items-center gap-2">
                <Save size={18} />
                Save Changes
              </button>
            </div>
          </div>

          {/* Detection Settings */}
          <div className="card mb-6">
            <h3 className="text-lg font-semibold mb-4">Detection Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2">Risk Threshold</label>
                <select name="threshold" value={formData.threshold} onChange={handleChange}>
                  <option value={30}>Low (30)</option>
                  <option value={60}>Medium (60)</option>
                  <option value={80}>High (80)</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Enable ML Detection</div>
                  <div className="text-xs text-gray-400">Use machine learning for detection</div>
                </div>
                <input type="checkbox" defaultChecked />
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="card mb-6">
            <h3 className="text-lg font-semibold mb-4">Notifications</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Email Notifications</div>
                  <div className="text-xs text-gray-400">Receive alerts via email</div>
                </div>
                <input
                  type="checkbox"
                  name="notifications"
                  checked={formData.notifications}
                  onChange={handleChange}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Critical Alerts</div>
                  <div className="text-xs text-gray-400">Alert on critical detections</div>
                </div>
                <input
                  type="checkbox"
                  name="alerts"
                  checked={formData.alerts}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Change Password */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Lock size={20} />
              Change Password
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2">Current Password</label>
                <input type="password" placeholder="••••••••" />
              </div>
              <div>
                <label className="block text-sm mb-2">New Password</label>
                <input type="password" placeholder="••••••••" />
              </div>
              <div>
                <label className="block text-sm mb-2">Confirm Password</label>
                <input type="password" placeholder="••••••••" />
              </div>
              <button className="btn-primary">Update Password</button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div>
          {/* Subscription */}
          <div className="card mb-6">
            <h3 className="text-lg font-semibold mb-4">Subscription</h3>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-500 mb-2">Professional</div>
              <div className="text-gray-400 text-sm mb-4">$99/month</div>
              <div className="text-xs text-gray-400 mb-4">
                Renews on January 15, 2027
              </div>
              <button className="btn-secondary w-full">Manage Billing</button>
            </div>
          </div>

          {/* Usage */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Monthly Usage</h3>
            <div className="space-y-3">
              <div>
                <div className="text-sm mb-1">API Calls</div>
                <div className="w-full bg-gray-700 rounded h-2">
                  <div className="bg-blue-500 h-2 rounded w-1/3"></div>
                </div>
                <div className="text-xs text-gray-400 mt-1">1,234 / 100,000</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
