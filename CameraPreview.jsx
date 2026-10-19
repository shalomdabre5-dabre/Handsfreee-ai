import { useEffect, useRef } from 'react'
import { CameraOff } from 'lucide-react'

export default function CameraPreview({ stream, faceFound, className = '' }) {
  const ref = useRef(null)
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream
  }, [stream])

  return (
    <div className={`relative overflow-hidden rounded-xl bg-black/50 aspect-[4/3] ${className}`}>
      {stream ? (
        <video ref={ref} autoPlay muted playsInline className="h-full w-full -scale-x-100 object-cover" />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-400 text-sm">
          <CameraOff size={28} /> Camera is off
        </div>
      )}
      {stream && (
        <span className={`absolute left-2 top-2 rounded-full px-2 py-1 text-xs font-semibold ${faceFound ? 'bg-emerald-500/90 text-navy-950' : 'bg-amber-400 text-navy-950'}`}>
          {faceFound ? 'Face detected' : 'No face detected'}
        </span>
      )}
    </div>
  )
}
