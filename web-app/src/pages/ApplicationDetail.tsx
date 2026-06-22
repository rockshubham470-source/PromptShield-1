import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Copy,
  RefreshCcw,
  Eye,
  Shield,
  Activity,
} from 'lucide-react'
import {
  getApplication,
  getApplicationMetrics,
  getApplicationApiKeys,
  getApplicationDetections,
  rotateApiKey,
  getApplicationAuditLogs,
} from '../services/applicationService'
import {
  TrendChart,
  RiskDistributionChart,
  BarChartComponent,
} from '../components/Charts'

const ApplicationDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [application, setApplication] = useState<any>(null)
  const [metrics, setMetrics] = useState<any>(null)
  const [apiKeys, setApiKeys] = useState<any[]>([])
  const [detections, setDetections] = useState<any[]>([])
  // State for tracking which API key's full key is being shown
  const [showFullKey, setShowFullKey] = useState<Record<string, boolean>>({})
  // State for storing full API keys (temporarily from localStorage)
  const [fullKeys, setFullKeys] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!id) return

    const loadData = async () => {
      try {
        const [
          appRes,
          metricsRes,
          keysRes,
          detectionsRes,
        ] = await Promise.all([
          getApplication(id),
          getApplicationMetrics(id),
          getApplicationApiKeys(id),
          getApplicationDetections(id),
        ])

        setApplication(appRes.data)
        setMetrics(metricsRes.data)
        setApiKeys(keysRes.data)
        setDetections(detectionsRes.data)

        // Check localStorage for any stored full API keys for this app's API keys (from creation)
        const newFullKeys: Record<string, string> = {}
        keysRes.data.forEach((key: any) => {
          const storageKey = `promptshield_apiKey_${key.id}`
          const storedKey = localStorage.getItem(storageKey)
          if (storedKey) {
            newFullKeys[key.id] = storedKey
            // Remove from localStorage after retrieving (so it's only shown once)
            localStorage.removeItem(storageKey)
          }
        })
        // Merge with existing fullKeys (though should be empty)
        setFullKeys(prev => ({ ...prev, ...newFullKeys }))
      } catch (err) {
        console.error(err)
      }
    }

    loadData()
  }, [id])

  const handleCopy = async (text: string) => {
    if (!text) {
      alert('No text to copy')
      return
    }
    try {
      await navigator.clipboard.writeText(text)
      alert('Copied to clipboard!')
    } catch (err) {
      console.error('Failed to copy:', err)
      alert('Failed to copy: ' + err)
    }
  }

  const handleToggleEye = (keyId: string) => {
    setShowFullKey(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }))
  }

const handleRotateKey = async () => {
  try {
    if (!id) return

    const rotateResponse = await rotateApiKey(id)
    const rawKey = rotateResponse.data?.api_key // raw key from backend

    const keysResponse = await getApplicationApiKeys(id)

    setApiKeys(keysResponse.data)

    // Store the full key for the newly active key
    const newActiveKey = keysResponse.data.find((k: any) => k.is_active)
    if (newActiveKey && rawKey) {
      setFullKeys(prev => ({ ...prev, [newActiveKey.id]: rawKey }))
    }

    alert("API key rotated successfully")
  } catch (error) {
    console.error(error)
    alert("Rotation failed")
  }
}

  return (
    <div className="p-6 space-y-6 text-white">

      {/* HEADER */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold">
            Application Overview
          </h1>

          <p className="text-gray-400 text-sm mt-2">
            Application ID:
            <span className="text-gray-200 ml-2">
              {id}
            </span>
          </p>
        </div>

        <div className="flex gap-3">
  <button
    onClick={handleRotateKey}
    className="px-4 py-2 rounded-lg bg-[#111827] hover:bg-[#1f2937]"
  >
    Rotate API Key
  </button>

  <button
    onClick={() => navigate(`/audit-logs?appId=${id}`)}
    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700"
  >
    Show Full Audit Logs
  </button>

</div>
      </div>

      {/* APPLICATION DETAILS */}
      <div className="bg-[#111827] rounded-xl p-6">

        <h2 className="text-lg font-semibold mb-5">
          Application Details
        </h2>

        <div className="grid md:grid-cols-2 gap-5">

          <div>
            <p className="text-gray-400 text-sm">
              Environment
            </p>
            <p>{application?.environment}</p>
          </div>

          <div>
            <p className="text-gray-400 text-sm">
              Provider
            </p>
            <p>{application?.provider}</p>
          </div>

          <div>
            <p className="text-gray-400 text-sm">
              Status
            </p>

            <span className="text-green-400">
              {application?.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>

          <div>
            <p className="text-gray-400 text-sm">
              Created
            </p>

            <p>
              {application?.created_at ? new Date(application.created_at).toLocaleDateString() : 'N/A'}
            </p>
          </div>

        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid md:grid-cols-4 gap-4">

        <div className="bg-[#111827] p-5 rounded-xl">
          <p className="text-gray-400 text-sm">
            Total Requests
          </p>

          <h2 className="text-2xl font-bold mt-2">
            {metrics?.total_requests ?? 0}
          </h2>
        </div>

        <div className="bg-[#111827] p-5 rounded-xl">
          <p className="text-gray-400 text-sm">
            Blocked Requests
          </p>

          <h2 className="text-2xl font-bold text-red-400 mt-2">
            {metrics?.blocked_requests ?? 0}
          </h2>
        </div>

        <div className="bg-[#111827] p-5 rounded-xl">
          <p className="text-gray-400 text-sm">
            Success Rate
          </p>

          <h2 className="text-2xl font-bold text-green-400 mt-2">
            {metrics?.success_rate ?? 100}%
          </h2>
        </div>

        <div className="bg-[#111827] p-5 rounded-xl">
          <p className="text-gray-400 text-sm">
            Avg Latency
          </p>

          <h2 className="text-2xl font-bold mt-2">
            124 ms
          </h2>
        </div>

      </div>

      {/* CHARTS */}
      <div className="grid lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2">
          <TrendChart />
        </div>

        <div>
          <RiskDistributionChart />
        </div>

      </div>

      <BarChartComponent />

      {/* API KEYS */}
      <div className="bg-[#111827] rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-5">
          API Keys
        </h2>

        <div className="space-y-4">
          {apiKeys.map((key) => {
            const isShowing = showFullKey[key.id] ?? false
            // Determine what to display: full key if available and toggled, else prefix
            const displayKey = isShowing && fullKeys[key.id]
              ? fullKeys[key.id]
              : key.prefix

            return (
              <div
                key={key.id}
                className="bg-[#0A0F1C] rounded-lg p-4 flex items-center justify-between"
              >
                <div>
                  <p className="text-gray-400 text-sm">
                    {key.name}
                  </p>

                  <p className="font-mono text-sm mt-1">
                    {displayKey}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-sm text-green-400">
                    {key.is_active ? 'Active' : 'Inactive'}
                  </span>

                  {/* Eye icon to toggle full key visibility */}
                  <Eye
                    size={18}
                    className={`cursor-pointer ${isShowing ? 'text-yellow-400' : 'text-gray-400'} hover:text-white`}
                    onClick={() => handleToggleEye(key.id)}
                  />

                  {/* Copy button */}
                  <Copy
                    size={18}
                    className="cursor-pointer text-gray-400 hover:text-white"
                    onClick={() => handleCopy(displayKey)}
                  />

                  <RefreshCcw
                    size={18}
                    className="cursor-pointer text-yellow-400"
                    onClick={handleRotateKey}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* SECURITY SUMMARY */}
      <div className="grid md:grid-cols-3 gap-4">

        <div className="bg-[#111827] p-5 rounded-xl">
          <p className="text-gray-400 text-sm">
            Threats Blocked
          </p>

          <h2 className="text-2xl font-bold text-red-400 mt-2">
            1284
          </h2>
        </div>

        <div className="bg-[#111827] p-5 rounded-xl">
          <p className="text-gray-400 text-sm">
            Active Rules
          </p>

          <h2 className="text-2xl font-bold mt-2">
            18
          </h2>
        </div>

        <div className="bg-[#111827] p-5 rounded-xl">
          <p className="text-gray-400 text-sm">
            Risk Level
          </p>

          <h2 className="text-2xl font-bold text-yellow-400 mt-2">
            Medium
          </h2>
        </div>

      </div>

      {/* RECENT ACTIVITY */}
      <div className="bg-[#111827] rounded-xl p-6">

        <h2 className="text-lg font-semibold mb-5">
          Recent Activity
        </h2>

        <div className="space-y-4">

          {[
            {
              action: 'Request Blocked',
              time: '2 min ago',
              status: 'blocked',
            },
            {
              action: 'API Key Used',
              time: '10 min ago',
              status: 'success',
            },
            {
              action: 'New Rule Added',
              time: '1 hr ago',
              status: 'info',
            },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-[#0A0F1C] rounded-lg p-4 flex justify-between"
            >
              <div className="flex gap-3 items-center">

                {item.status === 'blocked' ? (
                  <Shield className="text-red-400" size={18} />
                ) : (
                  <Activity className="text-blue-400" size={18} />
                )}

                <div>
                  <p>{item.action}</p>
                  <p className="text-sm text-gray-400">
                    {item.time}
                  </p>
                </div>

                </div>

                <span
                  className={
                    item.status === 'blocked'
                      ? 'text-red-400'
                      : item.status === 'success'
                      ? 'text-green-400'
                      : 'text-blue-400'
                  }
                >
                  {item.status.toUpperCase()}
                </span>

              </div>
          ))}

        </div>

      </div>
      {/* DETECTIONS TABLE */}
      <div className="bg-[#111827] rounded-xl p-6">

        <h2 className="text-lg font-semibold mb-5">
          Recent Detections
        </h2>

        <table className="w-full">

          <thead className="text-gray-400 text-sm">
            <tr>
              <th className="text-left pb-3">
                Time
              </th>

              <th className="text-left pb-3">
                Risk
              </th>

              <th className="text-left pb-3">
                Pattern
              </th>
            </tr>
          </thead>

          <tbody>
          {detections?.map((detection, index) => (
            <tr key={index} className="border-t border-gray-800">
              <td className="py-4">
                {new Date(detection.created_at).toLocaleString()}
              </td>
              <td>{detection.risk_level}</td>
              <td>{detection.detected_patterns}</td>
            </tr>
          ))}
          </tbody>

        </table>

      </div>

    </div>
  )
}
export default ApplicationDetail