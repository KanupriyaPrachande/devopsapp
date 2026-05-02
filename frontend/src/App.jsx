import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './AuthContext'
import LoginPage from './components/LoginPage'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import ContainersTab from './components/ContainersTab'
import LogsTab from './components/LogsTab'
import TerminalTab from './components/TerminalTab'
import Topbar from './components/Topbar'

const TABS = [
  { id: 'dashboard',  label: '⬡ Dashboard',  key: '1' },
  { id: 'containers', label: '⬡ Containers', key: '2' },
  { id: 'logs',       label: '⬡ Logs',       key: '3' },
  { id: 'terminal',   label: '⬡ Terminal',   key: '4' },
]

function AppShell() {
  const { isAuthed, ready, user, logout } = useAuth()
  const [tab, setTab] = useState('dashboard')

  useEffect(() => {
    const handler = (e) => {
      if (!isAuthed) return
      if (e.key === '1') setTab('dashboard')
      if (e.key === '2') setTab('containers')
      if (e.key === '3') setTab('logs')
      if (e.key === '4') setTab('terminal')
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isAuthed])

  if (!ready) {
    return (
      <div className="min-h-screen bg-terminal-bg flex items-center justify-center font-mono text-terminal-dim text-xs">
        <span className="animate-pulse">loading...</span>
      </div>
    )
  }

  if (!isAuthed) return <LoginPage />

  return (
    <div className="flex flex-col h-screen w-screen bg-terminal-bg overflow-hidden">
      <Topbar user={user} onLogout={logout} />

      {/* Tab bar */}
      <div className="flex items-center border-b border-terminal-border bg-terminal-panel shrink-0">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-6 py-2 text-xs font-mono transition-all border-b-2 ${
              tab === t.id
                ? 'border-terminal-blue text-terminal-blue bg-terminal-bg'
                : 'border-transparent text-terminal-dim hover:text-terminal-text'
            }`}
          >
            {t.label}
            <span className="ml-2 text-terminal-dimmer">[{t.key}]</span>
          </button>
        ))}

        {/* User badge */}
        <div className="ml-auto flex items-center gap-3 px-4">
          <span className="text-terminal-dimmer text-[10px] font-mono">
            logged in as{' '}
            <span className="text-terminal-blue">{user?.username}</span>
            {' '}
            <span className={`px-1.5 py-0.5 rounded text-[9px] ${user?.role === 'admin' ? 'bg-purple-900/50 text-purple-300' : 'bg-terminal-border text-terminal-dimmer'}`}>
              {user?.role}
            </span>
          </span>
          <button
            onClick={logout}
            className="text-terminal-dimmer hover:text-terminal-red text-[10px] font-mono transition-colors"
          >
            logout →
          </button>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeTab={tab} onTabChange={setTab} user={user} />
        <main className="flex-1 overflow-hidden">
          {tab === 'dashboard'  && <Dashboard />}
          {tab === 'containers' && <ContainersTab />}
          {tab === 'logs'       && <LogsTab />}
          {tab === 'terminal'   && (user?.role === 'admin'
            ? <TerminalTab />
            : <div className="h-full flex items-center justify-center font-mono text-xs text-terminal-dimmer">
                <div className="text-center">
                  <div className="text-terminal-red text-2xl mb-3">⊘</div>
                  <div className="text-terminal-red mb-1">Access Denied</div>
                  <div className="text-terminal-dimmer">Terminal requires admin role</div>
                </div>
              </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <div className="shrink-0 flex items-center gap-6 px-4 py-1 bg-terminal-panel border-t border-terminal-border text-xs text-terminal-dimmer font-mono">
        {[['1','Dashboard'],['2','Containers'],['3','Logs'],['4','Terminal']].map(([k,l]) => (
          <span key={k}>
            <kbd className="bg-terminal-accent text-white px-1 rounded text-[10px]">{k}</kbd>
            <span className="ml-1">{l}</span>
          </span>
        ))}
        <span className="ml-auto">DevOpsApp v2.0 — React + FastAPI + JWT</span>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  )
}