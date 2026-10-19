import { useEffect, useState } from 'react'
import { Camera, Mic, ScanFace, AudioLines, Play, Square, Crosshair, OctagonAlert, Server, Save } from 'lucide-react'
import { useHandsfree } from '../context/HandsfreeContext'
import { api } from '../services/api'
import { COMMAND_HELP } from '../lib/commandRouter'
import CameraPreview from './CameraPreview'
import StatusPill from './StatusPill'

export default function Dashboard({ openWorkspace }) {
  const hf = useHandsfree()
  const { webcam, tracking, speech } = hf
  const [backend, setBackend] = useState({ state: 'loading' })
  const [saveMsg, setSaveMsg] = useState('')

  const checkBackend = async () => {
    setBackend({ state: 'loading' })
    try {
      const h = await api.health()
      const s = await api.getSettings()
      hf.setSensitivity(s.sensitivity)
      hf.setVoiceFeedback(s.voice_feedback)
      setBackend({ state: 'ok', storage: h.storage, settings: s })
    } catch (e) {
      setBackend({ state: 'error', message: e.message })
    }
  }
  useEffect(() => { checkBackend() }, []) // eslint-disable-line

  const save = async () => {
    try {
      await api.updateSettings({ ...backend.settings, sensitivity: hf.sensitivity, voice_feedback: hf.voiceFeedback })
      setSaveMsg('Settings saved ✔')
    } catch (e) { setSaveMsg(e.message) }
    setTimeout(() => setSaveMsg(''), 3000)
  }

  const cam = webcam.status === 'active' ? ['ok', 'Camera on'] : webcam.status === 'requesting' ? ['warn', 'Waiting for permission'] : webcam.status === 'error' ? ['err', 'Problem'] : ['off', 'Off']
  const track = tracking.error ? ['err', 'Error'] : tracking.loading ? ['warn', 'Loading model…'] : tracking.faceFound ? ['ok', 'Tracking'] : tracking.ready ? ['warn', 'No face'] : ['off', 'Off']
  const mic = !speech.supported ? ['err', 'Unsupported'] : speech.error ? ['err', 'Problem'] : speech.listening ? ['ok', 'Listening'] : ['off', 'Off']

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <section className="glass space-y-4 p-4 lg:col-span-2">
        <CameraPreview stream={webcam.stream} faceFound={tracking.faceFound} />
        {[webcam.error, tracking.error, speech.error].filter(Boolean).map((m) => (
          <p key={m} className="rounded-lg bg-red-500/20 p-3 text-sm text-red-200" role="alert">{m}</p>
        ))}
        {!speech.supported && <p className="rounded-lg bg-amber-400/20 p-3 text-sm text-amber-200">Voice commands need Chrome or Edge. Head tracking still works.</p>}
        <div className="flex flex-wrap gap-3">
          <button className="btn btn-primary" onClick={hf.startHandsfree} disabled={hf.active}><Play size={18} /> Start Handsfree</button>
          <button className="btn btn-ghost" onClick={hf.stopHandsfree} disabled={!hf.active}><Square size={18} /> Stop Handsfree</button>
          <button className="btn btn-ghost" onClick={tracking.setCenter} disabled={!tracking.faceFound}><Crosshair size={18} /> Set centre</button>
          <button className="btn btn-danger" onClick={hf.emergencyStop}><OctagonAlert size={18} /> Emergency Stop</button>
          <button className="btn btn-ghost" onClick={openWorkspace}>Open Workspace →</button>
        </div>
        <p className="text-sm text-slate-400">Tip: start handsfree, look at the middle of your screen, press “Set centre”, then turn your head gently to move the pointer in the Workspace.</p>
      </section>

      <section className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <StatusPill icon={Camera} label="Camera" state={cam[0]} text={cam[1]} />
          <StatusPill icon={Mic} label="Microphone" state={mic[0]} text={mic[1]} />
          <StatusPill icon={ScanFace} label="Head tracking" state={track[0]} text={track[1]} />
          <StatusPill icon={AudioLines} label="Voice" state={speech.listening ? 'ok' : 'off'} text={speech.listening ? 'Recognising' : 'Idle'} />
        </div>

        <div className="glass p-4" aria-live="polite">
          <p className="text-xs uppercase tracking-wide text-slate-400">Current command</p>
          <p className="mt-1 text-lg font-semibold">{speech.interim || hf.lastHeard?.heard || '—'}</p>
          <p className={`text-sm ${hf.lastHeard?.ok === false ? 'text-amber-300' : 'text-brand-cyan'}`}>→ {hf.lastHeard?.label || 'Say “start handsfree” or press the button'}</p>
        </div>

        <div className="glass space-y-3 p-4">
          <label className="block text-sm font-semibold" htmlFor="sens">Cursor sensitivity: {hf.sensitivity.toFixed(1)}×</label>
          <input id="sens" type="range" min="0.2" max="3" step="0.1" value={hf.sensitivity}
            onChange={(e) => hf.setSensitivity(Number(e.target.value))} className="w-full accent-brand-cyan" />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={hf.voiceFeedback} onChange={(e) => hf.setVoiceFeedback(e.target.checked)} /> Spoken feedback</label>
          <button className="btn btn-ghost !py-2 text-sm" onClick={save} disabled={backend.state !== 'ok'}><Save size={16} /> Save to server</button>
          {saveMsg && <p className="text-sm text-emerald-300">{saveMsg}</p>}
        </div>

        <div className="glass p-4 text-sm">
          <p className="flex items-center gap-2 font-semibold"><Server size={16} /> Backend</p>
          {backend.state === 'loading' && <p className="text-slate-400">Checking…</p>}
          {backend.state === 'ok' && <p className="text-emerald-300">Connected · storage: {backend.storage}</p>}
          {backend.state === 'error' && <p className="text-amber-300">{backend.message}</p>}
          <button className="mt-2 text-brand-cyan underline" onClick={checkBackend}>Check again</button>
        </div>
      </section>

      <section className="glass p-4 lg:col-span-2">
        <h2 className="mb-2 font-semibold">Recent commands</h2>
        {hf.history.length === 0 && <p className="text-sm text-slate-400">Nothing yet.</p>}
        <ul className="max-h-56 space-y-1 overflow-y-auto text-sm">
          {hf.history.map((h) => (
            <li key={h.id} className="flex gap-3 rounded-lg bg-white/5 px-3 py-2">
              <span className="text-slate-500">{h.time}</span>
              <span className="flex-1">“{h.heard}”</span>
              <span className={h.ok ? 'text-emerald-300' : 'text-amber-300'}>{h.label}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="glass p-4">
        <h2 className="mb-2 font-semibold">Voice commands</h2>
        <ul className="flex flex-wrap gap-2 text-xs">
          {COMMAND_HELP.map((c) => <li key={c} className="rounded-full bg-white/10 px-3 py-1">{c}</li>)}
        </ul>
      </section>
    </div>
  )
}
