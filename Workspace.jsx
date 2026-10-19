import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Home, ArrowUp, ArrowDown, Volume2, VolumeX, Search, Play, Square, Crosshair } from 'lucide-react'
import { useHandsfree } from '../context/HandsfreeContext'
import { typeIntoField } from '../lib/typeIntoField'
import CameraPreview from './CameraPreview'
import PointerOverlay from './PointerOverlay'

const CLICKABLE = 'button,a,input,textarea,select,[data-clickable]'
const FILLER = [
  'Many people cannot use a mouse or keyboard because of injury, paralysis, tremors or repetitive strain. Handsfree browsing lets them reach the same websites using only head movement and their voice.',
  'Head tracking converts small, comfortable movements into pointer movement. Voice commands handle clicking, scrolling and typing so the head only has to aim.',
  'Safety matters: accidental clicks are frustrating, so important actions always ask for confirmation first.',
  'This page is placeholder content for testing. Try saying “scroll down”, “go to the top”, or “read this page”.',
  'Everything is processed in your browser. Camera frames are never uploaded.',
]

export default function Workspace() {
  const hf = useHandsfree()
  const frameRef = useRef(null)
  const scrollRef = useRef(null)
  const [page, setPage] = useState('home')
  const [stack, setStack] = useState([])
  const [query, setQuery] = useState('')
  const [results, setResults] = useState('')
  const [confirm, setConfirm] = useState(null)
  const [target, setTarget] = useState('')
  const [reading, setReading] = useState(false)
  const [sent, setSent] = useState(false)

  const go = (p) => { setStack((s) => [...s, page]); setPage(p); scrollRef.current?.scrollTo({ top: 0 }) }
  const back = () => {
    if (!stack.length) return false
    setPage(stack[stack.length - 1]); setStack((s) => s.slice(0, -1)); return true
  }
  const search = (q) => { setQuery(q); setResults(q); go('results') }
  const read = () => {
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(scrollRef.current?.innerText || '')
    u.onend = () => setReading(false)
    window.speechSynthesis.speak(u); setReading(true); return true
  }
  const stopReading = () => { window.speechSynthesis.cancel(); setReading(false); return true }
  const targetUnderPointer = () => {
    const r = frameRef.current.getBoundingClientRect()
    const { x, y } = hf.tracking.pointerRef.current
    const hit = document.elementFromPoint(r.left + x * r.width, r.top + y * r.height)
    return hit && frameRef.current.contains(hit) ? hit.closest(CLICKABLE) : null
  }

  // Register what each voice command does on this page. Re-registered when state changes.
  useEffect(() => {
    hf.handlers.current = {
      SCROLL_DOWN: () => { scrollRef.current.scrollBy({ top: 350, behavior: 'smooth' }); return true },
      SCROLL_UP: () => { scrollRef.current.scrollBy({ top: -350, behavior: 'smooth' }); return true },
      TOP: () => { scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' }); return true },
      BACK: back,
      HOME: () => { setStack([]); setPage('home'); return true },
      CLICK: () => {
        const el = targetUnderPointer()
        if (!el) return false
        el.focus?.(); el.click(); return true
      },
      SEARCH: (q) => { search(q); return true },
      TYPE: (text) => {
        let el = document.activeElement
        if (!frameRef.current.contains(el) || !['INPUT', 'TEXTAREA'].includes(el.tagName)) {
          el = frameRef.current.querySelector('input[data-search]'); el?.focus()
        }
        return typeIntoField(el, text)
      },
      READ: read,
      STOP_READING: stopReading,
      CANCEL: () => { setConfirm(null); stopReading(); return true },
      CONFIRM: () => {
        if (!confirm) return false
        confirm.onConfirm(); setConfirm(null); return true
      },
    }
    return () => { hf.handlers.current = {} }
  })

  const askToSend = () => setConfirm({
    title: 'Send this form?',
    detail: 'Nothing is really sent in this demo — but real submissions always need confirmation.',
    onConfirm: () => { setSent(true); hf.speak('Form sent') },
  })

  const link = 'block w-full rounded-xl border border-slate-300 bg-white p-4 text-left text-lg font-semibold text-navy-900 hover:bg-slate-50'

  return (
    <div className="space-y-3">
      {/* Control strip */}
      <div className="glass flex flex-wrap items-center gap-3 p-3">
        {hf.active
          ? <button className="btn btn-danger" onClick={hf.stopHandsfree}><Square size={18} /> Stop Handsfree</button>
          : <button className="btn btn-primary" onClick={hf.startHandsfree}><Play size={18} /> Start Handsfree</button>}
        <button className="btn btn-ghost" onClick={hf.tracking.setCenter} disabled={!hf.tracking.faceFound}
          title="Look at the middle of the screen, then press this">
          <Crosshair size={18} /> Set centre
        </button>
        <div className="min-w-[12rem] flex-1 text-sm" aria-live="polite">
          <p className="text-slate-400">Heard: <span className="text-slate-100">{hf.speech.interim || hf.lastHeard?.heard || '—'}</span></p>
          <p className={hf.lastHeard?.ok === false ? 'text-amber-300' : 'text-emerald-300'}>→ {hf.lastHeard?.label || 'waiting for a command'}</p>
        </div>
        <div className="w-28 shrink-0"><CameraPreview stream={hf.webcam.stream} faceFound={hf.tracking.faceFound} /></div>
      </div>

      {/* The demo "browser" */}
      <div ref={frameRef} className="relative flex h-[68vh] flex-col overflow-hidden rounded-2xl border border-white/15 bg-white text-slate-900 shadow-2xl">
        <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-100 p-2">
          <button className="btn btn-ghost !px-3 !py-2 !text-slate-800 !border-slate-300" aria-label="Back" onClick={back}><ArrowLeft size={18} /></button>
          <button className="btn btn-ghost !px-3 !py-2 !text-slate-800 !border-slate-300" aria-label="Home" onClick={() => { setStack([]); setPage('home') }}><Home size={18} /></button>
          <button className="btn btn-ghost !px-3 !py-2 !text-slate-800 !border-slate-300" aria-label="Scroll up" onClick={() => scrollRef.current.scrollBy({ top: -350, behavior: 'smooth' })}><ArrowUp size={18} /></button>
          <button className="btn btn-ghost !px-3 !py-2 !text-slate-800 !border-slate-300" aria-label="Scroll down" onClick={() => scrollRef.current.scrollBy({ top: 350, behavior: 'smooth' })}><ArrowDown size={18} /></button>
          <form className="flex flex-1 items-center gap-2 rounded-xl border border-slate-300 bg-white px-3" onSubmit={(e) => { e.preventDefault(); if (query.trim()) search(query.trim()) }}>
            <Search size={18} className="text-slate-500" />
            <input data-search value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search — click here and say “type …”, or say “search for …”"
              className="w-full bg-transparent py-3 text-base outline-none" aria-label="Search" />
          </form>
          <button className="btn btn-ghost !px-3 !py-2 !text-slate-800 !border-slate-300" aria-label={reading ? 'Stop reading' : 'Read aloud'} onClick={reading ? stopReading : read}>
            {reading ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto bg-slate-50 p-6">
          {page === 'home' && (<>
            <h2 className="text-3xl font-bold">Welcome to the Handsfree demo site</h2>
            <p className="text-slate-600">Point at a card with your head and say “click”.</p>
            <button className={link} onClick={() => go('articles')}>📰 Accessibility articles</button>
            <button className={link} onClick={() => go('form')}>✉️ Contact form</button>
            <button className={link} onClick={() => go('about')}>ℹ️ About this demo</button>
            {FILLER.map((t, i) => <p key={i} className="text-slate-700">{t}</p>)}
            {FILLER.map((t, i) => <p key={'b' + i} className="text-slate-700">{t}</p>)}
          </>)}
          {page === 'articles' && (<>
            <h2 className="text-3xl font-bold">Articles</h2>
            {['Why dwell clicking helps', 'Voice typing tips', 'Setting up good lighting'].map((t) => (
              <a key={t} href="#" data-clickable onClick={(e) => { e.preventDefault(); setResults(t); go('results') }} className={link}>{t}</a>
            ))}
            {FILLER.map((t, i) => <p key={i} className="text-slate-700">{t}</p>)}
          </>)}
          {page === 'results' && (<>
            <h2 className="text-3xl font-bold">Results for “{results}”</h2>
            <p className="text-slate-600">Demo page — there is no real search engine here.</p>
            {FILLER.map((t, i) => <p key={i} className="text-slate-700">{t}</p>)}
          </>)}
          {page === 'about' && (<>
            <h2 className="text-3xl font-bold">About</h2>
            <p className="text-slate-700">Browsers do not let a website move the real operating-system cursor, so Handsfree AI controls this demo workspace. A Chrome extension could later apply the same tracking to any website.</p>
          </>)}
          {page === 'form' && (
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <h2 className="text-3xl font-bold">Contact form</h2>
              <input className="w-full rounded-xl border border-slate-300 p-4 text-lg" placeholder="Your name" aria-label="Your name" />
              <textarea className="h-32 w-full rounded-xl border border-slate-300 p-4 text-lg" placeholder="Message — click here, then say “type hello”" aria-label="Message" />
              <button type="button" onClick={askToSend} className="rounded-xl bg-navy-900 px-6 py-4 text-lg font-semibold text-white">Send message</button>
              {sent && <p className="font-semibold text-emerald-700">✅ Sent (demo only)</p>}
            </form>
          )}
        </div>

        <div className="border-t border-slate-200 bg-slate-100 px-4 py-2 text-sm text-slate-700" aria-live="polite">
          {target ? <>Pointer is on: <strong>{target}</strong> — say “click” to activate</> : 'Move your head to aim the pointer'}
        </div>

        {hf.active && hf.webcam.stream && !hf.tracking.faceFound && !hf.tracking.loading && (
          <div className="absolute inset-x-0 top-16 z-40 mx-auto w-fit rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-navy-950">
            Face not detected — tracking paused. Face the camera and check your lighting.
          </div>
        )}

        {confirm && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 p-4" role="alertdialog" aria-label={confirm.title}>
            <div className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6">
              <h3 className="text-2xl font-bold">{confirm.title}</h3>
              <p className="text-slate-600">{confirm.detail}</p>
              <p className="text-sm font-semibold text-brand-purple">Say “confirm” or “cancel”</p>
              <div className="flex gap-3">
                <button className="btn btn-primary flex-1" onClick={() => { confirm.onConfirm(); setConfirm(null) }}>Confirm</button>
                <button className="btn flex-1 border border-slate-300 !text-slate-800" onClick={() => setConfirm(null)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        <PointerOverlay frameRef={frameRef} pointerRef={hf.tracking.pointerRef}
          visible={hf.active && hf.tracking.faceFound} onTarget={setTarget} />
      </div>
    </div>
  )
}
