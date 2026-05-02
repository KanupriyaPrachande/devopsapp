import { useState, useCallback, useRef } from 'react'
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts'
import { useSSE } from '../hooks/useSSE'
import { API } from '../api'

const MAX_HISTORY = 40

function MiniSparkline({ data, color }) {
  return (
    <ResponsiveContainer width="100%" height={32}>
      <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
        <defs>
          <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={color} stopOpacity={0.4} />
            <stop offset="95%" stopColor={color} stopOpacity={0.0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#grad-${color})`}
          dot={false}
          isAnimationActive={false}
        />
        <Tooltip
          contentStyle={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 4, fontSize: 10, fontFamily: 'monospace' }}
          labelStyle={{ display: 'none' }}
          formatter={(v) => [`${v}%`]}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

function MetricCard({ label, value, history, color, extra }) {
  const pct = parseFloat(value) || 0
  const col = pct > 80 ? '#f85149' : pct > 60 ? '#d29922' : color

  return (
    <div className="bg-terminal-panel border border-terminal-border rounded p-3 flex-1 min-w-0">
      <div className="flex items-center justify-between mb-1">
        <span className="text-terminal-dim text-[11px]">{label}</span>
        <span className="font-bold tabular-nums" style={{ color: col }}>{value}%</span>
      </div>
      <MiniSparkline data={history} color={col} />
      {extra && <div className="text-terminal-dimmer text-[10px] mt-1">{extra}</div>}
    </div>
  )
}

function Bar({ pct }) {
  const col = pct > 80 ? '#f85149' : pct > 60 ? '#d29922' : '#3fb950'
  const filled = Math.round(pct / 100 * 12)
  return (
    <span className="font-mono text-xs">
      {Array.from({ length: 12 }, (_, i) => (
        <span key={i} style={{ color: i < filled ? col : '#2d333b' }}>
          {i < filled ? '█' : '░'}
        </span>
      ))}
    </span>
  )
}

const LOG_COLORS = { INFO: '#8b949e', WARN: '#d29922', ERROR: '#f85149' }

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null)
  const [cpuHist, setCpuHist]   = useState([])
  const [memHist, setMemHist]   = useState([])
  const [diskHist, setDiskHist] = useState([])
  const [logs, setLogs]         = useState([])
  const logRef = useRef(null)

  const onMetrics = useCallback((data) => {
    setMetrics(data)
    setCpuHist(h  => [...h.slice(-MAX_HISTORY), { v: data.cpu }])
    setMemHist(h  => [...h.slice(-MAX_HISTORY), { v: data.mem }])
    setDiskHist(h => [...h.slice(-MAX_HISTORY), { v: data.disk }])
  }, [])

  const onLog = useCallback((data) => {
    setLogs(l => {
      const next = [...l.slice(-99), data]
      setTimeout(() => logRef.current?.scrollTo({ top: 9999, behavior: 'smooth' }), 50)
      return next
    })
  }, [])

  useSSE(API.metricsStream, onMetrics)
  useSSE(API.logsStream,    onLog)

  const status = metrics ? (metrics.cpu < 90 ? 'UP' : 'DEGRADED') : 'CONNECTING'
  const statusColor = status === 'UP' ? '#3fb950' : status === 'DEGRADED' ? '#d29922' : '#8b949e'

  return (
    <div className="h-full flex flex-col gap-3 p-3 overflow-auto font-mono text-xs">

      {/* Status bar */}
      <div className="flex items-center gap-4 bg-terminal-panel border border-terminal-border rounded px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-terminal-dim">STATUS</span>
          <span className="px-2 py-0.5 rounded text-[11px] font-bold text-white" style={{ background: statusColor === '#3fb950' ? '#14532d' : '#7f1d1d' }}>
            ● {status}
          </span>
        </div>
        <span className="text-terminal-dimmer">│</span>
        {metrics && (
          <>
            <span className="text-terminal-dim">CPU <Bar pct={metrics.cpu} /> <span className="text-white">{metrics.cpu}%</span></span>
            <span className="text-terminal-dimmer">│</span>
            <span className="text-terminal-dim">MEM <Bar pct={metrics.mem} /> <span className="text-white">{metrics.mem}%</span></span>
            <span className="text-terminal-dimmer">│</span>
            <span className="text-terminal-dim">DISK <Bar pct={metrics.disk} /> <span className="text-white">{metrics.disk}%</span></span>
            <span className="text-terminal-dimmer">│</span>
            <span className="text-terminal-dim">uptime <span className="text-terminal-blue">{metrics.uptime}</span></span>
          </>
        )}
        <span className="ml-auto flex items-center gap-1.5 text-terminal-green">
          <span className="w-1.5 h-1.5 rounded-full bg-terminal-green animate-pulse-slow inline-block" />
          live
        </span>
      </div>

      {/* Metric cards */}
      <div className="flex gap-3">
        <MetricCard
          label="CPU USAGE" value={metrics?.cpu ?? '—'}
          history={cpuHist} color="#58a6ff"
          extra={`${cpuHist.length} samples`}
        />
        <MetricCard
          label="MEMORY" value={metrics?.mem ?? '—'}
          history={memHist} color="#3fb950"
          extra={metrics ? `${metrics.mem_used_gb}GB / ${metrics.mem_total_gb}GB` : ''}
        />
        <MetricCard
          label="DISK" value={metrics?.disk ?? '—'}
          history={diskHist} color="#bc8cff"
          extra={metrics ? `${metrics.disk_used_gb}GB / ${metrics.disk_total_gb}GB` : ''}
        />
        <div className="bg-terminal-panel border border-terminal-border rounded p-3 flex-1 min-w-0">
          <div className="text-terminal-dim text-[11px] mb-1">NETWORK</div>
          <div className="space-y-1 mt-2">
            <div className="flex justify-between">
              <span className="text-terminal-dimmer">↑ sent</span>
              <span className="text-terminal-blue">{metrics?.net_sent_mb ?? '—'} MB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-terminal-dimmer">↓ recv</span>
              <span className="text-terminal-green">{metrics?.net_recv_mb ?? '—'} MB</span>
            </div>
          </div>
        </div>
      </div>

      {/* Live log stream */}
      <div className="flex-1 bg-terminal-panel border border-terminal-border rounded flex flex-col min-h-0">
        <div className="flex items-center gap-3 px-3 py-2 border-b border-terminal-border shrink-0">
          <span className="text-terminal-blue font-bold">LOG STREAM</span>
          <span className="text-terminal-dimmer">live tail</span>
          <span className="ml-auto flex items-center gap-1.5 text-terminal-green text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-terminal-green animate-pulse-slow inline-block" />
            {logs.length} entries
          </span>
        </div>
        <div ref={logRef} className="flex-1 overflow-auto p-3 space-y-0.5">
          {logs.map((log, i) => (
            <div key={i} className="flex gap-3 hover:bg-terminal-border/30 px-1 rounded">
              <span className="text-terminal-dimmer shrink-0 tabular-nums">{log.ts}</span>
              <span className="shrink-0 w-12 font-bold" style={{ color: LOG_COLORS[log.level] || '#8b949e' }}>
                {log.level}
              </span>
              <span className="text-terminal-text">{log.msg}</span>
            </div>
          ))}
          {logs.length === 0 && (
            <div className="text-terminal-dimmer">connecting to log stream<span className="animate-blink">_</span></div>
          )}
        </div>
      </div>
    </div>
  )
}
