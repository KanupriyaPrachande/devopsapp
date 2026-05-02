import { useState, useEffect } from 'react'
import { useAuth } from '../AuthContext'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function TerminalLines() {
  const lines = [
    { text: '$ docker ps --all',                            top: '8%',  left: '2%',  delay: 0 },
    { text: '● fastapi-container   running   0.0.0.0:8000', top: '12%', left: '2%',  delay: 0.1 },
    { text: '● redis-cache         running   0.0.0.0:6379', top: '16%', left: '2%',  delay: 0.2 },
    { text: '$ kubectl get pods',                           top: '22%', left: '2%',  delay: 0.3 },
    { text: 'NAME                  READY  STATUS   RESTARTS',top: '26%', left: '2%', delay: 0.4 },
    { text: 'api-deployment-7d9f8  1/1    Running  0',      top: '30%', left: '2%',  delay: 0.5 },
    { text: '$ htop --sort-key PERCENT_CPU',                top: '38%', left: '2%',  delay: 0.2 },
    { text: 'CPU[|||||||           23.1%]',                 top: '42%', left: '2%',  delay: 0.3 },
    { text: 'MEM[||||||||||||      68.4%]',                 top: '46%', left: '2%',  delay: 0.4 },
    { text: '$ tail -f /var/log/app.log',                   top: '54%', left: '2%',  delay: 0.1 },
    { text: '[INFO] GET /api/health → 200 OK (2ms)',        top: '58%', left: '2%',  delay: 0.2 },
    { text: '[INFO] POST /api/deploy → 202 Accepted',       top: '62%', left: '2%',  delay: 0.3 },
    { text: '[WARN] High memory usage: 84%',                top: '66%', left: '2%',  delay: 0.4 },
    { text: '[INFO] Container heartbeat ok',                top: '70%', left: '2%',  delay: 0.5 },
    { text: '$ git log --oneline -5',                       top: '78%', left: '2%',  delay: 0.2 },
    { text: 'a3f92d1  feat: add JWT auth',                  top: '82%', left: '2%',  delay: 0.3 },
    { text: 'b1e04c9  fix: container health check',         top: '86%', left: '2%',  delay: 0.4 },
    { text: '$ nginx -t && systemctl reload nginx',         top: '8%',  right: '2%', delay: 0.1 },
    { text: 'nginx: configuration file OK',                 top: '12%', right: '2%', delay: 0.2 },
    { text: '$ systemctl status postgres',                  top: '20%', right: '2%', delay: 0.3 },
    { text: '● postgres.service - running (active)',        top: '24%', right: '2%', delay: 0.4 },
    { text: '$ netstat -tulpn | grep LISTEN',               top: '32%', right: '2%', delay: 0.1 },
    { text: 'tcp  0.0.0.0:8000  LISTEN  uvicorn',          top: '36%', right: '2%', delay: 0.2 },
    { text: 'tcp  0.0.0.0:5432  LISTEN  postgres',         top: '40%', right: '2%', delay: 0.3 },
    { text: '$ prometheus --config.file=prom.yml',          top: '48%', right: '2%', delay: 0.2 },
    { text: 'level=info msg="Server ready"',                top: '52%', right: '2%', delay: 0.3 },
    { text: '$ docker stats --no-stream',                   top: '60%', right: '2%', delay: 0.1 },
    { text: 'CONTAINER    CPU%    MEM',                     top: '64%', right: '2%', delay: 0.2 },
    { text: 'fastapi      12.4%   148MiB',                  top: '68%', right: '2%', delay: 0.3 },
    { text: 'redis         0.3%   8.1MiB',                  top: '72%', right: '2%', delay: 0.4 },
    { text: '$ uptime',                                     top: '80%', right: '2%', delay: 0.1 },
    { text: 'up 8 days, load: 0.42 0.38 0.31',             top: '84%', right: '2%', delay: 0.2 },
  ]
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden font-mono text-[10px] leading-relaxed z-10">
      {lines.map((l, i) => {
        const isWarn = l.text.includes('WARN') || l.text.includes('High')
        const isOk   = l.text.includes('running') || l.text.includes('OK') || l.text.includes('ok') || l.text.includes('Running') || l.text.includes('ready') || l.text.includes('active')
        const isCmd  = l.text.startsWith('$')
        const color  = isCmd ? 'rgba(88,166,255,0.7)' : isWarn ? 'rgba(210,153,34,0.7)' : isOk ? 'rgba(63,185,80,0.65)' : 'rgba(201,209,217,0.45)'
        return (
          <div key={i} className="absolute whitespace-nowrap"
            style={{ top: l.top, left: l.left, right: l.right, color,
              animation: `termFadeIn 0.8s ease-out ${l.delay}s forwards`, opacity: 0 }}>
            {l.text}
          </div>
        )
      })}
    </div>
  )
}

export default function LoginPage() {
  const { login }  = useAuth()
  const [tab,      setTab]     = useState('demo')
  const [username, setUsername] = useState('demo')
  const [password, setPassword] = useState('')
  const [error,    setError]   = useState('')
  const [loading,  setLoading] = useState(false)
  const [showPw,   setShowPw]  = useState(false)
  const [typed,    setTyped]   = useState('')
  const [showCard, setShowCard] = useState(false)
  
  const banner = '$ ssh admin@devopsapp --secure'
  useEffect(() => {
    setTimeout(() => setShowCard(true), 300)
    let i = 0
    const id = setInterval(() => {
      setTyped(banner.slice(0, i++))
      if (i > banner.length) clearInterval(id)
    }, 60)
    return () => clearInterval(id)
  }, [])

  const switchTab = (t) => { setTab(t); setUsername(t); setPassword(''); setError('') }

  const handleLogin = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const res  = await fetch(`${BASE}/api/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.detail || 'Login failed'); return }
      login(data.token, { username: data.username, name: data.name, role: data.role })
    } catch { setError('Cannot connect to backend. Is it running?') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center font-mono p-4 relative overflow-hidden">

      {/* ── Background: beach image ── */}
      <div className="fixed inset-0 z-0 transition-opacity duration-1000"
        style={{
          backgroundImage: `url('/beach.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center bottom',
          opacity: 1,
        }}
      />
      
      {/* Dark overlay — 55% so image is clearly visible */}
      <div className="fixed inset-0 z-0"
        style={{ background: 'rgba(4,8,18,0.25)' }} 
      />
      {/* Vignette edges */}
      <div className="fixed inset-0 z-0"
        style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)' }}
      />

      {/* Terminal lines floating */}
      <TerminalLines />

      {/* Centre glow */}
      <div className="fixed z-10 pointer-events-none"
        style={{ top:'50%', left:'50%', transform:'translate(-50%,-50%)',
          width:'520px', height:'600px',
          background:'radial-gradient(ellipse, rgba(31,111,235,0.1) 0%, transparent 70%)' }}
      />

      {/* ── Card ── */}
      <div className={`w-full max-w-md z-20 transition-all duration-700 ${showCard ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>

        {/* Typewriter */}
        <div className="text-terminal-green text-xs mb-4 h-5">
          {typed}<span className="animate-blink text-terminal-blue">█</span>
        </div>

        <div className="rounded-xl overflow-hidden"
          style={{
            background: 'rgba(10,14,23,0.90)',
            backdropFilter: 'blur(18px)',
            border: '1px solid rgba(88,166,255,0.2)',
            boxShadow: '0 0 0 1px rgba(88,166,255,0.05), 0 32px 64px rgba(0,0,0,0.75), 0 0 60px rgba(31,111,235,0.1)',
          }}>

          {/* Window chrome */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-terminal-border"
            style={{ background: 'rgba(13,17,23,0.95)' }}>
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="ml-3 text-terminal-dimmer text-[11px] flex-1 text-center">devopsapp — login</span>
            <span className="text-terminal-green text-[10px] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-terminal-green animate-pulse inline-block" />
              live
            </span>
          </div>

          {/* Logo */}
          <div className="px-6 pt-6 pb-4 text-center border-b border-terminal-border">
            <div className="text-terminal-blue text-[11px]">╔══════════════════════════╗</div>
            <div className="text-[13px] font-bold py-0.5">
              <span className="text-terminal-blue">║</span>{'  '}
              <span className="text-white">⬡ DevOps</span><span className="text-terminal-blue">App</span>
              {'            '}<span className="text-terminal-blue">║</span>
            </div>
            <div className="text-terminal-blue text-[11px]">╚══════════════════════════╝</div>
            <p className="text-terminal-dimmer text-[10px] mt-2 tracking-widest uppercase">
              Live Infrastructure Monitoring
            </p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-terminal-border">
            {[['demo','◎ Demo Access'],['admin','⬡ Admin Login']].map(([t, label]) => (
              <button key={t} onClick={() => switchTab(t)}
                className={`flex-1 py-2.5 text-xs transition-all ${
                  tab === t ? 'text-terminal-blue border-b-2 border-terminal-blue bg-terminal-bg' : 'text-terminal-dimmer hover:text-terminal-dim'
                }`}>
                {label}
              </button>
            ))}
          </div>

          <div className="p-5">
            {tab === 'demo' && (
              <div className="mb-4 rounded-lg p-3 text-[11px]"
                style={{ background:'rgba(63,185,80,0.06)', border:'1px solid rgba(63,185,80,0.2)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-terminal-green" />
                  <span className="text-terminal-green font-bold">DEMO MODE</span>
                </div>
                {[['✓','Live metrics — CPU, RAM, Disk','#3fb950'],
                  ['✓','Docker containers + logs','#3fb950'],
                  ['✓','Sandboxed terminal (safe)','#3fb950'],
                  ['✕','Cannot modify anything','#484f58'],
                ].map(([icon, text, color], i) => (
                  <div key={i} className="flex items-center gap-2 py-0.5" style={{ color }}>
                    <span className="w-3 text-[10px]">{icon}</span>
                    <span className="text-terminal-dim">{text}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-terminal-border">
                  <span className="text-terminal-dimmer text-[10px]">password</span>
                  <span className="text-terminal-green font-bold tracking-wider">demo123</span>
                </div>
              </div>
            )}

            {tab === 'admin' && (
              <div className="mb-4 rounded-lg p-3 text-[11px]"
                style={{ background:'rgba(188,140,255,0.06)', border:'1px solid rgba(188,140,255,0.2)' }}>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  <span className="text-purple-300 font-bold">ADMIN ACCESS — FULL CONTROL</span>
                </div>
                <div className="text-terminal-dimmer text-[10px] mt-1.5">
                  Password set via environment variable. Not shown here.
                </div>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-3">
              <div>
                <label className="block text-terminal-dimmer text-[10px] mb-1 uppercase tracking-widest">Username</label>
                <div className="flex items-center bg-terminal-bg border border-terminal-border rounded-lg px-3 py-2.5 focus-within:border-terminal-blue transition-colors">
                  <span className="text-terminal-blue mr-2 text-xs">$</span>
                  <input type="text" value={username} readOnly={tab==='demo'}
                    onChange={e => setUsername(e.target.value)}
                    className="flex-1 bg-transparent text-terminal-text text-xs outline-none" />
                  {tab==='demo' && <span className="text-terminal-dimmer text-[10px]">locked</span>}
                </div>
              </div>
              <div>
                <label className="block text-terminal-dimmer text-[10px] mb-1 uppercase tracking-widest">Password</label>
                <div className="flex items-center bg-terminal-bg border border-terminal-border rounded-lg px-3 py-2.5 focus-within:border-terminal-blue transition-colors">
                  <span className="text-terminal-blue mr-2 text-xs">$</span>
                  <input type={showPw?'text':'password'} value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={tab==='demo'?'demo123':'enter admin password'}
                    autoFocus
                    className="flex-1 bg-transparent text-terminal-text text-xs outline-none placeholder-terminal-dimmer" />
                  <button type="button" onClick={() => setShowPw(p=>!p)}
                    className="text-terminal-dimmer hover:text-terminal-dim text-[10px] ml-2 transition-colors">
                    {showPw?'hide':'show'}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-lg px-3 py-2"
                  style={{ background:'rgba(248,81,73,0.1)', border:'1px solid rgba(248,81,73,0.25)' }}>
                  <span className="text-terminal-red">✕</span>
                  <span className="text-terminal-red text-xs">{error}</span>
                </div>
              )}

              <button type="submit" disabled={loading || !password}
                className="w-full font-bold py-3 rounded-lg text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: tab==='demo'
                    ? 'linear-gradient(135deg, rgba(63,185,80,0.15), rgba(63,185,80,0.08))'
                    : 'linear-gradient(135deg, #1f6feb, #1158c7)',
                  border: tab==='demo' ? '1px solid rgba(63,185,80,0.35)' : '1px solid rgba(31,111,235,0.5)',
                  color: tab==='demo' ? '#3fb950' : '#fff',
                  boxShadow: tab==='demo' ? '0 0 20px rgba(63,185,80,0.08)' : '0 0 20px rgba(31,111,235,0.2)',
                }}>
                {loading
                  ? <><span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />authenticating...</>
                  : tab==='demo' ? '→ Enter Demo' : '→ Admin Login'}
              </button>
            </form>
          </div>
        </div>

        <div className="text-center mt-4 text-terminal-dimmer text-[10px] tracking-wider">
          DevOpsApp v2.0 · React + FastAPI · JWT Secured
        </div>
      </div>

      <style>{`
        @keyframes termFadeIn {
          from { opacity:0; transform:translateX(-8px); }
          to   { opacity:1; transform:translateX(0); }
        }
      `}</style>
    </div>
  )
}