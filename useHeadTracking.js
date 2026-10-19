import { useCallback, useEffect, useRef, useState } from 'react'
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'

const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'

const SMOOTHING = 0.3 // 0 = frozen, 1 = no smoothing. Lower = steadier but laggier cursor.
const YAW_GAIN = 3.5   // how far the cursor moves per head turn (left/right)
const PITCH_GAIN = 5   // pitch changes less in the image, so it needs more gain

/**
 * REAL landmark-based head tracking (no simulation).
 * Idea: the position of the nose tip INSIDE the face outline changes when you
 * turn/tilt your head, but not much when you just lean or move the whole body.
 *   rx = how far across the face (cheek→cheek) the nose is   (turn left/right)
 *   ry = how far down the face (forehead→chin) the nose is   (look up/down)
 * We compare rx/ry with a "centre" pose and smooth the result.
 * pointerRef.current = { x, y } in 0..1 (0,0 = top-left of the workspace).
 */
export function useHeadTracking(stream, sensitivity) {
  const pointerRef = useRef({ x: 0.5, y: 0.5 })
  const rawRef = useRef(null)
  const centerRef = useRef({ rx: 0.5, ry: 0.55 })
  const sensRef = useRef(sensitivity)
  const [state, setState] = useState({ loading: false, ready: false, faceFound: false, error: null })

  useEffect(() => { sensRef.current = sensitivity }, [sensitivity])

  useEffect(() => {
    if (!stream) {
      setState({ loading: false, ready: false, faceFound: false, error: null })
      return
    }
    let cancelled = false, raf = 0, landmarker = null

    // Hidden <video> that feeds frames to MediaPipe (the visible preview is separate).
    const video = document.createElement('video')
    Object.assign(video.style, { position: 'fixed', left: '0', top: '0', width: '2px', height: '2px', opacity: '0', pointerEvents: 'none' })
    video.muted = true
    video.playsInline = true
    video.srcObject = stream
    document.body.appendChild(video)

    ;(async () => {
      try {
        setState((s) => ({ ...s, loading: true, error: null }))
        const fileset = await FilesetResolver.forVisionTasks(WASM_URL)
        const make = (delegate) =>
          FaceLandmarker.createFromOptions(fileset, { baseOptions: { modelAssetPath: MODEL_URL, delegate }, runningMode: 'VIDEO', numFaces: 1 })
        try { landmarker = await make('GPU') } catch { landmarker = await make('CPU') }
        await video.play()
        if (cancelled) return
        setState((s) => ({ ...s, loading: false, ready: true }))

        let lastTime = -1, faceFound = false, lostSince = null
        const loop = () => {
          if (cancelled) return
          if (video.readyState >= 2 && video.currentTime !== lastTime) {
            lastTime = video.currentTime
            const lm = landmarker.detectForVideo(video, performance.now()).faceLandmarks?.[0]
            if (lm) {
              const nose = lm[1], left = lm[234], right = lm[454], top = lm[10], chin = lm[152]
              const rx = (nose.x - left.x) / (right.x - left.x)
              const ry = (nose.y - top.y) / (chin.y - top.y)
              rawRef.current = { rx, ry }
              const c = centerRef.current, g = sensRef.current
              // Camera image is un-mirrored: turning right moves the nose toward image-left (rx drops).
              const tx = 0.5 + (c.rx - rx) * YAW_GAIN * g
              const ty = 0.5 + (ry - c.ry) * PITCH_GAIN * g
              const p = pointerRef.current
              p.x += (Math.min(1, Math.max(0, tx)) - p.x) * SMOOTHING
              p.y += (Math.min(1, Math.max(0, ty)) - p.y) * SMOOTHING
              lostSince = null
              if (!faceFound) { faceFound = true; setState((s) => ({ ...s, faceFound: true })) }
            } else {
              // Face lost → the pointer simply stops (tracking is paused).
              lostSince ??= performance.now()
              if (faceFound && performance.now() - lostSince > 400) {
                faceFound = false
                setState((s) => ({ ...s, faceFound: false }))
              }
            }
          }
          raf = requestAnimationFrame(loop)
        }
        loop()
      } catch (e) {
        if (!cancelled) setState({ loading: false, ready: false, faceFound: false, error: `Head tracking could not start: ${e.message}` })
      }
    })()

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      landmarker?.close()
      video.srcObject = null
      video.remove()
    }
  }, [stream])

  // "Set centre": remember the pose you are in right now as the middle of the screen.
  const setCenter = useCallback(() => {
    if (!rawRef.current) return false
    centerRef.current = { ...rawRef.current }
    pointerRef.current.x = 0.5
    pointerRef.current.y = 0.5
    return true
  }, [])

  return { ...state, pointerRef, setCenter }
}
