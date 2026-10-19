import { useCallback, useEffect, useRef, useState } from 'react'

const SR = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null

// Browser speech recognition (Chrome/Edge). NOTE: Chrome sends the audio to
// Google's servers, so it needs internet — it does NOT work offline.
export function useSpeechRecognition(onFinal) {
  const [listening, setListening] = useState(false)
  const [interim, setInterim] = useState('')
  const [error, setError] = useState(null)
  const recRef = useRef(null)
  const wantRef = useRef(false)
  const cbRef = useRef(onFinal)
  useEffect(() => { cbRef.current = onFinal }, [onFinal])

  const start = useCallback(() => {
    if (!SR) { setError('Speech recognition is not supported in this browser. Use Chrome or Edge.'); return false }
    if (recRef.current) return true
    const rec = new SR()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = 'en-US'
    rec.onstart = () => { setListening(true); setError(null) }
    rec.onresult = (e) => {
      let live = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i]
        if (r.isFinal) { cbRef.current(r[0].transcript, r[0].confidence); setInterim('') }
        else live += r[0].transcript
      }
      if (live) setInterim(live)
    }
    rec.onerror = (e) => {
      if (e.error === 'no-speech' || e.error === 'aborted') return
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        wantRef.current = false
        setError('Microphone permission was denied. Allow the microphone in the address bar and try again.')
      } else if (e.error === 'network') setError('Speech recognition needs an internet connection.')
      else setError(`Speech error: ${e.error}`)
    }
    rec.onend = () => {
      recRef.current = null
      setListening(false)
      if (wantRef.current) { try { start() } catch { /* ignore */ } } // Chrome stops after silence; restart
    }
    wantRef.current = true
    recRef.current = rec
    try { rec.start() } catch { /* already started */ }
    return true
  }, [])

  const stop = useCallback(() => {
    wantRef.current = false
    recRef.current?.stop()
    setInterim('')
  }, [])

  useEffect(() => () => { wantRef.current = false; recRef.current?.abort() }, [])

  return { supported: !!SR, listening, interim, error, start, stop }
}
