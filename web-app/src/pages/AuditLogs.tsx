import React, { useEffect, useMemo, useState } from 'react'
import {
  Search,
  AppWindow,
  Shield,
  AlertTriangle,
  X,
} from 'lucide-react'

import {
  getAllAuditLogs,
  getApplications,
} from '../services/applicationService'

type Log = {
  id: string
  action: string
  details: string
  created_at: string
  application_id: string
  application_name: string
  resource_type: string
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<Log[]>([])
  const [apps, setApps] = useState<any[]>([])
  const [selectedApp, setSelectedApp] = useState('all')
  const [search, setSearch] = useState('')
  const [activeLog, setActiveLog] = useState<Log | null>(null)

  useEffect(() => {
    load()
  }, [])

  // Lock body scroll when drawer is open (enterprise UX standard)
  useEffect(() => {
    if (activeLog) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }
  }, [activeLog])

  async function load() {
    try {
      const [a, l] = await Promise.all([
        getApplications(),
        getAllAuditLogs(),
      ])

      setApps(a.data)

      const sorted = l.sort(
        (x: Log, y: Log) =>
          +new Date(y.created_at) - +new Date(x.created_at)
      )

      setLogs(sorted)
    } catch (err) {
      console.error(err)
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()

    return logs.filter((l) => {
      const appMatch =
        selectedApp === 'all' || l.application_id === selectedApp

      const searchMatch =
        l.action.toLowerCase().includes(q) ||
        l.details.toLowerCase().includes(q) ||
        l.resource_type.toLowerCase().includes(q)

      return appMatch && searchMatch
    })
  }, [logs, selectedApp, search])

  const severityColor = (action: string) => {
    if (action.includes('BLOCK')) return 'bg-red-500'
    if (action.includes('KEY')) return 'bg-amber-400'
    return 'bg-blue-500'
  }

  return (
    <div className="h-full bg-[#0A0F1C] text-white">

      {/* HEADER (z-30 fixed hierarchy fix) */}
      <div className="sticky top-0 z-30 border-b border-white/5 bg-[#0A0F1C]/80 backdrop-blur">
        <div className="flex items-center justify-between px-6 py-4">

          <div>
            <h1 className="text-lg font-semibold">
              Log Explorer
            </h1>
            <p className="text-xs text-gray-500">
              Audit & security event stream
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[#111827] border border-white/10 px-3 py-2 rounded-md w-[360px]">
            <Search size={14} className="text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search logs..."
              className="bg-transparent outline-none text-sm w-full"
            />
          </div>

        </div>
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-12 gap-6 px-6 py-6">

        {/* FILTERS */}
        <div className="col-span-3 space-y-2">

          <FilterItem
            active={selectedApp === 'all'}
            onClick={() => setSelectedApp('all')}
            icon={<AppWindow size={14} />}
            label="All Applications"
            count={logs.length}
          />

          {apps.map((a) => (
            <FilterItem
              key={a.id}
              active={selectedApp === a.id}
              onClick={() => setSelectedApp(a.id)}
              icon={<Shield size={14} />}
              label={a.name}
              count={
                logs.filter((l) => l.application_id === a.id).length
              }
            />
          ))}

        </div>

        {/* LOG STREAM */}
        <div className="col-span-9 space-y-2">

          {filtered.map((log) => (
            <div
              key={log.id}
              onClick={() => setActiveLog(log)}
              className="flex items-start justify-between px-4 py-3 rounded-lg hover:bg-white/5 transition cursor-pointer border border-transparent hover:border-white/10"
            >

              {/* LEFT */}
              <div className="flex gap-3">

                <span
                  className={`mt-2 h-2 w-2 rounded-full ${severityColor(
                    log.action
                  )}`}
                />

                <div>
                  <div className="text-sm font-medium">
                    {log.action}
                  </div>

                  <div className="text-xs text-gray-500 font-mono truncate max-w-[500px]">
                    {log.details}
                  </div>

                  <div className="flex gap-2 mt-2">

                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-300">
                      {log.application_name}
                    </span>

                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-400">
                      {log.resource_type}
                    </span>

                  </div>

                </div>
              </div>

              {/* TIME */}
              <div className="text-[11px] text-gray-500">
                {new Date(log.created_at).toLocaleString()}
              </div>

            </div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center text-gray-500 py-10">
              <AlertTriangle className="mx-auto mb-2" />
              No matching logs
            </div>
          )}

        </div>
      </div>

      {/* BACKDROP (FIXED LAYERING) */}
      {activeLog && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setActiveLog(null)}
        />
      )}

      {/* DRAWER (FIXED Z-INDEX = NO MORE CLASH) */}
      {activeLog && (
        <div className="fixed right-0 top-0 h-full w-[420px] bg-[#0F172A] border-l border-white/10 p-5 overflow-auto z-50">

          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-semibold">
              Log Details
            </h2>

            <button onClick={() => setActiveLog(null)}>
              <X size={16} />
            </button>
          </div>

          <div className="space-y-3 text-xs">

            <Field label="Action" value={activeLog.action} />
            <Field label="Application" value={activeLog.application_name} />
            <Field label="Resource" value={activeLog.resource_type} />
            <Field label="Time" value={activeLog.created_at} />

            <div className="pt-3 border-t border-white/10">
              <div className="text-gray-400 mb-2">Details</div>
              <pre className="text-gray-300 whitespace-pre-wrap">
                {activeLog.details}
              </pre>
            </div>

          </div>

        </div>
      )}

    </div>
  )
}

/* ---------------- FILTER ITEM ---------------- */

function FilterItem({
  active,
  onClick,
  icon,
  label,
  count,
}: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition border ${
        active
          ? 'bg-white/5 border-white/10'
          : 'border-transparent hover:bg-white/5'
      }`}
    >
      <div className="flex items-center gap-2 text-gray-300">
        {icon}
        {label}
      </div>
      <span className="text-xs text-gray-500">{count}</span>
    </button>
  )
}

/* ---------------- FIELD ---------------- */

function Field({ label, value }: any) {
  return (
    <div>
      <div className="text-gray-500">{label}</div>
      <div className="text-gray-200 font-mono break-all">
        {value}
      </div>
    </div>
  )
}