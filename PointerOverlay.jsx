import { useEffect, useRef } from 'react'

const CLICKABLE = 'button,a,input,textarea,select,[data-clickable]'

// The visible head-controlled cursor. It moves by writing to the DOM directly
// every animation frame (fast, no React re-render at 60 fps).
export default function PointerOverlay({ frameRef, pointerRef, visible, onTarget }) {
  const dot = useRef(null)
  const cb = useRef(onTarget)
  useEffect(() => { cb.current = onTarget }, [onTarget])

  useEffect(() => {
    let raf = 0, prev = null
    const tick = () => {
      const frame = frameRef.current
      if (frame && dot.current) {
        const r = frame.getBoundingClientRect()
        const { x, y } = pointerRef.current
        dot.current.style.transform = `translate(${x * r.width}px, ${y * r.height}px)`
        const hit = document.elementFromPoint(r.left + x * r.width, r.top + y * r.height)
        const t = hit && frame.contains(hit) ? hit.closest(CLICKABLE) : null
        if (t !== prev) {
          prev?.classList.remove('hf-target')
          t?.classList.add('hf-target')
          prev = t
          cb.current(t ? (t.getAttribute('aria-label') || t.innerText || t.placeholder || t.tagName).trim().slice(0, 40) : '')
        }
      }
      raf = requestAnimationFrame(tick)
    }
    tick()
    return () => { cancelAnimationFrame(raf); prev?.classList.remove('hf-target') }
  }, [frameRef, pointerRef])

  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden" aria-hidden="true">
      <div ref={dot} className={`absolute left-0 top-0 transition-opacity ${visible ? 'opacity-100' : 'opacity-0'}`}>
        <div className="-ml-4 -mt-4 h-8 w-8 rounded-full border-4 border-brand-cyan bg-brand-purple/40 shadow-[0_0_20px_#22d3ee]" />
      </div>
    </div>
  )
}
