import React, { useEffect, useState } from 'react'

const LiveMonitoring = () => {
  const [events, setEvents] = useState<any[]>([])

  useEffect(() => {
    const interval = setInterval(() => {
      setEvents((prev) => [
        {
          id: Date.now(),
          event: 'Request analyzed',
          status: Math.random() > 0.8 ? 'Blocked' : 'Allowed',
        },
        ...prev.slice(0, 9),
      ])
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="p-6 space-y-6">

      <h1 className="text-2xl font-semibold">Live Monitoring</h1>

      <div className="space-y-3">
        {events.map((e) => (
          <div key={e.id} className="p-4 bg-[#111827] rounded-xl flex justify-between">
            <div>{e.event}</div>
            <div className={e.status === 'Blocked' ? 'text-red-400' : 'text-green-400'}>
              {e.status}
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}

export default LiveMonitoring