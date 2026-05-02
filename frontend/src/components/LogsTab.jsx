import { useState, useCallback, useRef, useEffect } from 'react'
import { useSSE } from '../hooks/useSSE'
import { API } from '../api'

const LEVEL_COLORS = { INFO: '#8b949e', WARN: '#d29922', ERROR: '#f85149' }
const LEVEL_BG     = { INFO: '', WARN: 'rgba(210,153,34,0.08)', ERROR: 'rgba(248,81,73,0.08)' }

export default function LogsTab() {
  const [logs,    setLogs]    = useState([])
  const [filter,  setFilter]  = useState('')
  const [level,   setLevel]   = useState('ALL')
  const [paused,  setPaused]  = useState(false)
  const pausedRef = useRef(false)
  const logRef    = useRef(null)

  pausedRef.current = paused

  const onLog = useCallback((data) => {
    if (pausedRef.current) return
    setLogs(l => {
      const next = [...l.slice(-999), data]
      setTimeout(() => logRef.current?.scrollTo({ top: 9999, behavior: 'smooth' }), 30)
      return next
    })
  }, [])

  useSSE(API.logsStream, onLog)

  const filtered = logs.filter(l =>
    (level === 'ALL' || l.level === level) &&
    (!filter || l.msg.toLowerCase().includes(filter.toLowerCase()))
  )

  return (
    <div className="h-full flex flex-col font-mono text-xs p-3 gap-3 overflow-hidden">

      {/* Controls */}
      <div className="flex items-center gap-3 bg-terminal-panel border border-terminal-border rounded px-3 py-2 shrink-0">
        <span className="text-terminal-blue font-bold">LOG VIEWER</span>
        <span className="text-terminal-dimmer">│</span>

        {/* Filter input */}
        <div className="flex items-center gap-1 bg-terminal-bg border border-terminal-border rounded px-2 py-1 flex-1 max-w-xs">
          <span className="text-terminal-dimmer">filter:</span>
          <input
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="type to search…"
            className="bg-transparent text-terminal-text outline-none flex-1 placeholder-terminal-dimmer text-xs"
          />
          {filter && <button onClick={() => setFilter('')} className="text-terminal-dimmer hover:text-terminal-dim">✕</button>}
        </div>

        {/* Level filter */}
        <div className="flex gap-1">
          {['ALL','INFO','WARN','ERROR'].map(l => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              className={`px-2 py-0.5 rounded text-[10px] transition-colors ${level === l ? 'bg-terminal-accent text-white' : 'text-terminal-dimmer hover:text-terminal-dim'}`}
            >
              {l}
            </button>
          ))}
        </div>

        {/* Pause */}
        <button
          onClick={() => setPaused(p => !p)}
          className={`px-2 py-0.5 rounded text-[10px] transition-colors ${paused ? 'bg-yellow-900/50 text-terminal-yellow' : 'text-terminal-dimmer hover:text-terminal-dim'}`}
        >
          {paused ? '⏸ paused' : '● live'}
        </button>

        {/* Clear */}
        <button onClick={() => setLogs([])} className="text-terminal-dimmer hover:text-terminal-red transition-colors">
          clear
        </button>

        <span className="ml-auto text-terminal-dimmer">
          {filtered.length}/{logs.length} lines
        </span>
      </div>

      {/* Log output */}
      <div ref={logRef} className="flex-1 bg-terminal-panel border border-terminal-border rounded overflow-auto p-2 space-y-0.5">
        {filtered.map((log, i) => (
          <div
            key={i}
            className="flex gap-3 px-2 py-0.5 rounded hover:bg-terminal-border/30 transition-colors"
            style={{ background: LEVEL_BG[log.level] || '' }}
          >
            <span className="text-terminal-dimmer shrink-0 tabular-nums">{log.ts}</span>
            <span className="shrink-0 w-12 font-bold text-center" style={{ color: LEVEL_COLORS[log.level] || '#8b949e' }}>
              {log.level}
            </span>
            <span className="text-terminal-text flex-1">
              {filter
                ? log.msg.split(new RegExp(`(${filter})`, 'gi')).map((part, j) =>
                    part.toLowerCase() === filter.toLowerCase()
                      ? <mark key={j} className="bg-yellow-500/30 text-terminal-yellow rounded px-0.5">{part}</mark>
                      : part
                  )
                : log.msg
              }
            </span>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="p-8 text-center text-terminal-dimmer">
            {paused ? 'stream paused' : `no logs matching "${filter || level}"`}
            <span className="animate-blink">_</span>
          </div>
        )}
      </div>
    </div>
  )
}
