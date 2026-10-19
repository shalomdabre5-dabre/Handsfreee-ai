import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useWebcam } from '../hooks/useWebcam'
import { useHeadTracking } from '../hooks/useHeadTracking'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { interpret } from '../lib/commandRouter'
import { api } from '../services/api'

const Ctx = createContext(null)
export const useHandsfree = () => useContext(Ctx)

// Holds everything "handsfree" in one place so every page can use it.
export function HandsfreeProvider({ children }) {
  const webcam = useWebcam()
  const [active, setActive] = useState(false)
  const [sensitivity, setSensitivity] = useState(1)
  const [voiceFeedback, setVoiceFeedback] = useState(true)
  const [history, setHistory] = useState([])
  const [lastHeard, setLastHeard] = useState(null)
  const tracking = useHeadTracking(webcam.stream, sensitivity)

  // The Workspace page puts its action functions here (SCROLL_DOWN, CLICK, ...).
  const handlers = useRef({})
  const actions = useRef({}) // start/stop handsfree (filled below to avoid circular deps)
  const stats = useRef({ attempted: 0, recognized: 0, startedAt: null })
  const feedbackRef = useRef(voiceFeedback)
  useEffect(() => { feedbackRef.current = voiceFeedback }, [voiceFeedback])

  const speak = useCallback((text) => {
    if (!feedbackRef.current || !('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text))
  }, [])

  const log = useCallback((entry) => {
    const item = { id: crypto.randomUUID(), time: new Date().toLocaleTimeString(), ...entry }
    setLastHeard(item)
    setHistory((h) => [item, ...h].slice(0, 30))
  }, [])

  const handleSpeech = useCallback((text) => {
    stats.current.attempted += 1
    const cmd = interpret(text)
    if (!cmd) { log({ heard: text, label: 'Not a command — ignored', ok: false }); return }
    stats.current.recognized += 1
    let ok
    if (cmd.action === 'START_HANDSFREE') ok = actions.current.start()
    else if (cmd.action === 'STOP_HANDSFREE') ok = actions.current.stop()
    else ok = handlers.current[cmd.action]?.(cmd.payload)
    if (ok === false || ok === undefined) {
      log({ heard: text, label: `${cmd.label} — not available right now (open the Workspace?)`, ok: false })
      speak('That is not available right now')
    } else {
      log({ heard: text, label: cmd.label, ok: true })
    }
  }, [log, speak])

  const speech = useSpeechRecognition(handleSpeech)

  const startHandsfree = useCallback(async () => {
    await webcam.start() // if the camera fails we still continue in voice-only mode
    speech.start()
    stats.current = { attempted: 0, recognized: 0, startedAt: Date.now() }
    setActive(true)
    return true
  }, [webcam, speech])

  const stopHandsfree = useCallback(() => {
    webcam.stop()
    speech.stop()
    window.speechSynthesis?.cancel()
    setActive(false)
    const s = stats.current
    if (s.startedAt) {
      api.createSession({
        duration_seconds: (Date.now() - s.startedAt) / 1000,
        commands_attempted: s.attempted,
        commands_recognized: s.recognized,
      }).catch(() => {}) // backend being offline must never break the app
      stats.current.startedAt = null
    }
    return true
  }, [webcam, speech])

  useEffect(() => { actions.current = { start: startHandsfree, stop: stopHandsfree } })

  const emergencyStop = useCallback(() => {
    handlers.current.CANCEL?.()
    stopHandsfree()
  }, [stopHandsfree])

  return (
    <Ctx.Provider value={{
      webcam, tracking, speech, active, sensitivity, setSensitivity, voiceFeedback, setVoiceFeedback,
      history, lastHeard, handlers, speak, startHandsfree, stopHandsfree, emergencyStop,
    }}>
      {children}
    </Ctx.Provider>
  )
}
