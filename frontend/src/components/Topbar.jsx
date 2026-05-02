import { useState, useEffect } from 'react'

export default function Topbar({ user, onLogout }) {
  const [time, setTime] = useState('')
  const [date, setDate] = useState('')

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString('en-GB'))
      setDate(now.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="shrink-0 flex items-center gap-3 px-4 py-2 bg-terminal-panel border-b border-terminal-border font-mono text-xs">
      <div className="flex gap-1.5">
        <div className="w-3 h-3 rounded-full bg-red-500" />
        <div className="w-3 h-3 rounded-full bg-yellow-400" />
        <div className="w-3 h-3 rounded-full bg-green-500" />
      </div>
      <span className="text-terminal-text font-bold text-sm">⬡ DevOpsApp</span>
      <span className="text-terminal-dimmer">─</span>
      <span className="text-terminal-blue">prod-server-01</span>
      <span className="text-terminal-dimmer">─</span>
      <span className="flex items-center gap-1.5 text-terminal-green">
        <span className="w-1.5 h-1.5 rounded-full bg-terminal-green animate-pulse-slow inline-block" />
        live
      </span>
      <div className="ml-auto flex items-center gap-4 text-terminal-dim">
        <span>{date}</span>
        <span className="text-terminal-blue font-bold tabular-nums">{time}</span>
      </div>
    </div>
  )
}
