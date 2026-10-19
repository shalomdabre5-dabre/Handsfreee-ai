import { useState } from 'react'
import { LayoutDashboard, AppWindow, OctagonAlert } from 'lucide-react'
import { HandsfreeProvider, useHandsfree } from './context/HandsfreeContext'
import Landing from './components/Landing'
import Dashboard from './components/Dashboard'
import Workspace from './components/Workspace'

function Shell({ view, setView }) {
  const { emergencyStop } = useHandsfree()
  const tab = (id, Icon, label) => (
    <button onClick={() => setView(id)} className={`btn !py-2 ${view === id ? 'btn-primary' : 'btn-ghost'}`}><Icon size={18} /> {label}</button>
  )
  return (
    <div className="mx-auto max-w-7xl space-y-4 p-4">
      <header className="glass flex flex-wrap items-center gap-3 p-3">
        <span className="bg-gradient-to-r from-brand-purple to-brand-cyan bg-clip-text text-xl font-extrabold text-transparent">HANDSFREE AI</span>
        <nav className="flex gap-2">{tab('dashboard', LayoutDashboard, 'Dashboard')}{tab('workspace', AppWindow, 'Workspace')}</nav>
        <button className="btn btn-danger ml-auto !py-2" onClick={emergencyStop}><OctagonAlert size={18} /> Emergency Stop</button>
      </header>
      {view === 'dashboard' ? <Dashboard openWorkspace={() => setView('workspace')} /> : <Workspace />}
    </div>
  )
}

export default function App() {
  const [view, setView] = useState('landing')
  return (
    <HandsfreeProvider>
      {view === 'landing' ? <Landing onStart={() => setView('dashboard')} /> : <Shell view={view} setView={setView} />}
    </HandsfreeProvider>
  )
}
