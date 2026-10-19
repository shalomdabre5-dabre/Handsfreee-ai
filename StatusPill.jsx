const COLORS = {
  ok: 'bg-emerald-400', warn: 'bg-amber-400', err: 'bg-red-500', off: 'bg-slate-500',
}

export default function StatusPill({ icon: Icon, label, state, text }) {
  return (
    <div className="glass flex items-center gap-3 p-3" role="status" aria-label={`${label}: ${text}`}>
      <span className="rounded-lg bg-white/10 p-2"><Icon size={20} /></span>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
        <p className="flex items-center gap-2 text-sm font-semibold">
          <span className={`h-2.5 w-2.5 rounded-full ${COLORS[state]}`} /> {text}
        </p>
      </div>
    </div>
  )
}
