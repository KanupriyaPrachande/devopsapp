export default function Sidebar({ activeTab, onTabChange }) {
  const navItems = [
    { id: 'dashboard',  label: 'Dashboard',  key: '1', icon: '▶' },
    { id: 'containers', label: 'Containers', key: '2', icon: '▶' },
    { id: 'logs',       label: 'Logs',       key: '3', icon: '▶' },
    { id: 'terminal',   label: 'Terminal',   key: '4', icon: '▶' },
  ]
 
  return (
    <aside className="w-52 shrink-0 flex flex-col bg-terminal-bg border-r border-terminal-border font-mono text-xs overflow-hidden">
      <div className="p-3 border-b border-terminal-border">
        <div className="text-terminal-blue text-[11px]">╔════════════════════╗</div>
        <div className="text-[11px]">
          <span className="text-terminal-blue">║</span>
          {' '}<span className="text-white font-bold">⬡ DevOps</span><span className="text-terminal-blue font-bold">App</span>
          {'     '}
          <span className="text-terminal-blue">║</span>
        </div>
        <div className="text-terminal-blue text-[11px]">╚════════════════════╝</div>
      </div>
 
      <div className="p-2">
        <div className="text-terminal-dimmer mb-1 px-1">── NAVIGATE ──────────</div>
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-full text-left px-2 py-1.5 rounded transition-colors flex items-center gap-2 ${
              activeTab === item.id
                ? 'bg-terminal-panel text-terminal-text'
                : 'text-terminal-dimmer hover:text-terminal-dim'
            }`}
          >
            <span className={activeTab === item.id ? 'text-terminal-blue' : 'text-terminal-dimmer'}>
              {item.icon}
            </span>
            {item.label}
            <span className="ml-auto text-terminal-dimmer">[{item.key}]</span>
          </button>
        ))}
      </div>
 
      <div className="p-2 border-t border-terminal-border mt-1">
        <div className="text-terminal-dimmer mb-1 px-1">── SYSTEM ────────────</div>
        <div className="px-2 space-y-0.5">
          <div><span className="text-terminal-blue">host</span> <span className="text-terminal-dim">prod-server-01</span></div>
          <div><span className="text-terminal-blue">env </span> <span className="text-terminal-green">● production</span></div>
          <div><span className="text-terminal-blue">ver </span> <span className="text-terminal-dim">v2.4.1</span></div>
          <div><span className="text-terminal-blue">api </span> <span className="text-terminal-green">● connected</span></div>
        </div>
      </div>
 
      <div className="p-2 border-t border-terminal-border mt-auto">
        <div className="text-terminal-dimmer mb-1 px-1">── BINDINGS ──────────</div>
        {[['1','Dashboard'],['2','Containers'],['3','Logs'],['4','Terminal']].map(([key, label]) => (
          <div key={key} className="px-2 py-0.5 flex gap-2">
            <span className="text-terminal-blue font-bold w-4">{key}</span>
            <span className="text-terminal-dimmer">→</span>
            <span className="text-terminal-dim">{label}</span>
          </div>
        ))}
      </div>
    </aside>
  )
}
