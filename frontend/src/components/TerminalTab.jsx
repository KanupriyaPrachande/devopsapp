import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../AuthContext'

const WS_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000')
  .replace('http://', 'ws://')
  .replace('https://', 'wss://')

export default function TerminalTab() {
  const { user } = useAuth()
  const containerRef = useRef(null)
  const termRef      = useRef(null)
  const wsRef        = useRef(null)
  const [status, setStatus] = useState('connecting')
  const role = user?.role || 'demo'

  useEffect(() => {
    let term, fitAddon, ws, disposed = false

    async function init() {
      const { Terminal } = await import('@xterm/xterm')
      const { FitAddon } = await import('@xterm/addon-fit')
      await import('@xterm/xterm/css/xterm.css')

      term = new Terminal({
        cursorBlink: true,
        cursorStyle: 'block',
        fontSize: 13,
        fontFamily: '"JetBrains Mono", "Fira Code", monospace',
        lineHeight: 1.4,
        scrollback: 5000,
        convertEol: false,
        theme: {
          background: '#0d1117', foreground: '#c9d1d9',
          cursor: '#58a6ff', cursorAccent: '#0d1117',
          selectionBackground: '#264f78',
          black: '#0d1117', red: '#f85149', green: '#3fb950',
          yellow: '#d29922', blue: '#58a6ff', magenta: '#bc8cff',
          cyan: '#39d353', white: '#c9d1d9', brightBlack: '#484f58',
          brightRed: '#ff7b72', brightGreen: '#56d364', brightYellow: '#e3b341',
          brightBlue: '#79c0ff', brightMagenta: '#d2a8ff',
          brightCyan: '#56d364', brightWhite: '#ffffff',
        },
      })

      fitAddon = new FitAddon()
      term.loadAddon(fitAddon)
      termRef.current = term

      if (containerRef.current) {
        term.open(containerRef.current)
        requestAnimationFrame(() => { fitAddon.fit(); term.focus() })
      }

      // Pass role as query param so backend knows which shell to give
      ws = new WebSocket(`${WS_URL}/terminal/ws?role=${role}`)
      wsRef.current = ws
      ws.binaryType = 'arraybuffer'

      ws.onopen = () => {
        if (disposed) return
        setStatus('connected')
        setTimeout(() => { term.focus() }, 200)
      }

      ws.onmessage = (e) => {
        if (disposed) return
        if (typeof e.data === 'string') term.write(e.data)
        else term.write(new Uint8Array(e.data))
      }

      ws.onclose = () => {
        if (disposed) return
        setStatus('disconnected')
        term.write('\r\n\x1b[31m● Session ended. Refresh to reconnect.\x1b[0m\r\n')
      }

      ws.onerror = () => {
        if (disposed) return
        setStatus('error')
        term.write('\r\n\x1b[31m● Cannot connect to backend.\x1b[0m\r\n')
      }

      term.onData((data) => {
        if (ws && ws.readyState === WebSocket.OPEN) ws.send(data)
      })

      const observer = new ResizeObserver(() => { try { fitAddon.fit() } catch {} })
      if (containerRef.current) observer.observe(containerRef.current)
    }

    init()
    return () => { disposed = true; ws?.close(); term?.dispose() }
  }, [role])

  const st = {
    connecting:   { color: '#d29922', label: 'connecting...' },
    connected:    { color: '#3fb950', label: role === 'admin' ? 'admin shell — full access' : 'demo sandbox — safe mode' },
    disconnected: { color: '#f85149', label: 'disconnected' },
    error:        { color: '#f85149', label: 'connection error' },
  }[status]

  const tips = role === 'admin'
    ? ['dir', 'docker ps', 'python --version', 'ipconfig', 'Get-Process']
    : ['dir', 'docker ps', 'python --version', 'pip list', 'git --version', 'help']

  return (
    <div className="h-full flex flex-col bg-terminal-bg">
      <div className="shrink-0 flex items-center gap-3 px-4 py-2 bg-terminal-panel border-b border-terminal-border font-mono text-xs">
        <span className="w-2 h-2 rounded-full animate-pulse-slow" style={{ background: st.color }} />
        <span className="font-bold" style={{ color: st.color }}>TERMINAL</span>
        <span className="text-terminal-dimmer">│</span>
        <span className="text-terminal-dim">{role === 'admin' ? 'powershell.exe' : 'sandbox'}</span>
        <span className="text-terminal-dimmer">│</span>
        <span className="text-[11px]" style={{ color: st.color }}>{st.label}</span>
        {role === 'demo' && (
          <>
            <span className="text-terminal-dimmer">│</span>
            <span className="text-[10px] text-yellow-400">⚠ read-only sandbox</span>
          </>
        )}
      </div>

      <div className="shrink-0 flex items-center gap-6 px-4 py-1 bg-terminal-bg border-b border-terminal-border font-mono text-[10px] text-terminal-dimmer">
        {tips.map(cmd => (
          <span key={cmd}>
            try: <span
              className="text-terminal-green cursor-pointer hover:underline"
              onClick={() => {
                if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(cmd + '\r')
                termRef.current?.focus()
              }}
            >{cmd}</span>
          </span>
        ))}
      </div>

      <div
        ref={containerRef}
        className="flex-1 overflow-hidden cursor-text"
        style={{ padding: '8px', background: '#0d1117' }}
        onClick={() => termRef.current?.focus()}
      />
    </div>
  )
}