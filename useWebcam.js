import { useCallback, useRef, useState } from 'react'

// Opens the camera ONLY when start() is called (after a button click) and
// releases it completely in stop().
export function useWebcam() {
  const [stream, setStream] = useState(null)
  const [status, setStatus] = useState('idle') // idle | requesting | active | error
  const [error, setError] = useState(null)
  const streamRef = useRef(null)

  const start = useCallback(async () => {
    if (streamRef.current) return true
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('error')
      setError('Camera access needs localhost or an HTTPS page, and a modern browser.')
      return false
    }
    setStatus('requesting')
    setError(null)
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' }, audio: false })
      streamRef.current = s
      setStream(s)
      setStatus('active')
      return true
    } catch (e) {
      setStatus('error')
      setError(
        e.name === 'NotAllowedError' ? 'Camera permission was denied. Click the lock icon in the address bar and allow the camera.'
        : e.name === 'NotFoundError' ? 'No camera was found on this device.'
        : e.name === 'NotReadableError' ? 'The camera is being used by another app. Close it and try again.'
        : `Camera error: ${e.message}`
      )
      return false
    }
  }, [])

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop()) // turns the camera light off
    streamRef.current = null
    setStream(null)
    setStatus('idle')
  }, [])

  return { stream, status, error, start, stop }
}
