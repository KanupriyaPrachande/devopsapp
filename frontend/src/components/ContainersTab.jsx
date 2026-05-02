import { useState, useCallback } from 'react'
import { useSSE } from '../hooks/useSSE'
import { API } from '../api'

function StatusBadge({ status }) {
  const running = status === 'running'
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${running ? 'bg-green-900/50 text-terminal-green' : 'bg-red-900/30 text-terminal-red'}`}>
      {running ? '● running' : '○ ' + status}
    </span>
  )
}

function Bar({ pct, width = 8 }) {
  const col = pct > 80 ? '#f85149' : pct > 60 ? '#d29922' : '#3fb950'
  const filled = Math.round((pct / 100) * width)
  return (
    <span className="font-mono">
      {Array.from({ length: width }, (_, i) => (
        <span key={i} style={{ color: i < filled ? col : '#2d333b' }}>
          {i < filled ? '█' : '░'}
        </span>
      ))}
      <span className="ml-1" style={{ color: col }}>{pct.toFixed(1)}%</span>
    </span>
  )
}

export default function ContainersTab() {
  const [containers, setContainers] = useState([])
  const [live, setLive]             = useState(false)
  const [loading, setLoading]       = useState({})
  const [selected, setSelected]     = useState(null)
  const [ctLogs, setCtLogs]         = useState([])

  const onData = useCallback((data) => {
    setContainers(data.containers || [])
    setLive(data.live)
  }, [])

  useSSE(API.containersStream, onData)

  const action = async (name, type) => {
    setLoading(l => ({ ...l, [name]: true }))
    try {
      const url = type === 'start' ? API.startContainer(name) : API.stopContainer(name)
      await fetch(url, { method: 'POST' })
    } finally {
      setLoading(l => ({ ...l, [name]: false }))
    }
  }

  const fetchLogs = async (name) => {
    setSelected(name)
    setCtLogs([])
    const res = await fetch(API.containerLogs(name))
    const data = await res.json()
    setCtLogs(data.logs || [])
  }

  return (
    <div className="h-full flex flex-col gap-3 p-3 font-mono text-xs overflow-auto">

      {/* Header */}
      <div className="flex items-center gap-3 bg-terminal-panel border border-terminal-border rounded px-4 py-2">
        <span className="text-terminal-blue font-bold">CONTAINERS</span>
        <span className="text-terminal-dimmer">│</span>
        <span className={live ? 'text-terminal-green' : 'text-terminal-yellow'}>
          {live ? '● docker connected' : '◎ demo mode'}
        </span>
        <span className="ml-auto text-terminal-dimmer">{containers.length} containers</span>
      </div>

      {/* Table */}
      <div className="bg-terminal-panel border border-terminal-border rounded overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-terminal-border text-terminal-dim">
              {['NAME','IMAGE','STATUS','CPU','MEM (MB)','PORTS','ACTIONS'].map(h => (
                <th key={h} className="px-3 py-2 text-left font-bold text-[11px]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {containers.map((ct, i) => (
              <tr
                key={ct.id}
                className={`border-b border-terminal-border/50 hover:bg-terminal-border/20 cursor-pointer transition-colors ${selected === ct.name ? 'bg-terminal-border/30' : i % 2 === 0 ? 'bg-terminal-bg' : 'bg-terminal-panel'}`}
                onClick={() => fetchLogs(ct.name)}
              >
                <td className="px-3 py-2 text-terminal-text font-bold">{ct.name}</td>
                <td className="px-3 py-2 text-terminal-blue text-[10px] max-w-[180px] truncate">{ct.image}</td>
                <td className="px-3 py-2"><StatusBadge status={ct.status} /></td>
                <td className="px-3 py-2"><Bar pct={ct.cpu_percent} width={6} /></td>
                <td className="px-3 py-2 text-terminal-dim">{ct.mem_mb.toFixed(1)}</td>
                <td className="px-3 py-2 text-terminal-dimmer text-[10px] max-w-[150px] truncate">{ct.ports || '—'}</td>
                <td className="px-3 py-2">
                  <div className="flex gap-1">
                    <button
                      onClick={e => { e.stopPropagation(); action(ct.name, 'start') }}
                      disabled={loading[ct.name] || ct.status === 'running'}
                      className="px-2 py-0.5 rounded text-[10px] bg-green-900/40 text-terminal-green hover:bg-green-800/60 disabled:opacity-30 transition-colors"
                    >
                      {loading[ct.name] ? '…' : 'start'}
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); action(ct.name, 'stop') }}
                      disabled={loading[ct.name] || ct.status !== 'running'}
                      className="px-2 py-0.5 rounded text-[10px] bg-red-900/40 text-terminal-red hover:bg-red-800/60 disabled:opacity-30 transition-colors"
                    >
                      {loading[ct.name] ? '…' : 'stop'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {containers.length === 0 && (
          <div className="p-6 text-center text-terminal-dimmer">
            connecting to container stream<span className="animate-blink">_</span>
          </div>
        )}
      </div>

      {/* Container logs panel */}
      {selected && (
        <div className="flex-1 bg-terminal-panel border border-terminal-border rounded flex flex-col min-h-0 min-h-[160px]">
          <div className="flex items-center gap-3 px-3 py-2 border-b border-terminal-border shrink-0">
            <span className="text-terminal-blue font-bold">LOGS</span>
            <span className="text-terminal-text">{selected}</span>
            <button onClick={() => setSelected(null)} className="ml-auto text-terminal-dimmer hover:text-terminal-dim">✕ close</button>
          </div>
          <div className="flex-1 overflow-auto p-3 space-y-0.5">
            {ctLogs.map((line, i) => (
              <div key={i} className={`text-[11px] ${line.includes('ERROR') ? 'text-terminal-red' : line.includes('WARN') ? 'text-terminal-yellow' : 'text-terminal-dim'}`}>
                {line}
              </div>
            ))}
            {ctLogs.length === 0 && <div className="text-terminal-dimmer">loading logs<span className="animate-blink">_</span></div>}
          </div>
        </div>
      )}
    </div>
  )
}
