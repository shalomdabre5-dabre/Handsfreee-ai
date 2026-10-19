import { motion } from 'framer-motion'
import { ScanFace, Mic, ShieldCheck, MousePointerClick, Gauge, Accessibility } from 'lucide-react'

const features = [
  [ScanFace, 'Head-controlled cursor', 'Real face-landmark tracking in your browser moves the pointer.'],
  [Mic, 'Voice commands & typing', 'Scroll, click, search and dictate using your voice.'],
  [MousePointerClick, 'Safe, intentional clicks', 'Confirmations and a visible emergency stop prevent accidents.'],
  [Gauge, 'Measured performance', 'Dashboard for accuracy, errors and task time (coming in later phases).'],
]
const steps = ['Press Start and allow the camera and microphone.', 'Look at the middle of your screen and set the centre.', 'Turn your head to aim, say “click” to select.']

export default function Landing({ onStart }) {
  return (
    <main className="mx-auto max-w-6xl space-y-16 px-4 py-16">
      <motion.header initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 text-center">
        <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1 text-sm"><Accessibility size={16} /> Accessibility-first browsing</p>
        <h1 className="bg-gradient-to-r from-brand-purple to-brand-cyan bg-clip-text text-5xl font-extrabold tracking-tight text-transparent sm:text-7xl">HANDSFREE AI</h1>
        <p className="text-2xl font-medium">Browse Freely. Control Naturally.</p>
        <p className="mx-auto max-w-2xl text-slate-300">Millions of people cannot comfortably use a mouse or keyboard. Handsfree AI turns an ordinary webcam and microphone into a way to point, click, scroll and type.</p>
        <button className="btn btn-primary text-lg" onClick={onStart}>Start Browsing</button>
      </motion.header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Features">
        {features.map(([Icon, title, text], i) => (
          <motion.div key={title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="glass space-y-2 p-5">
            <Icon className="text-brand-cyan" /><h3 className="font-semibold">{title}</h3><p className="text-sm text-slate-300">{text}</p>
          </motion.div>
        ))}
      </section>

      <section aria-label="How it works" className="space-y-4">
        <h2 className="text-center text-3xl font-bold">How it works</h2>
        <ol className="grid gap-4 sm:grid-cols-3">
          {steps.map((s, i) => <li key={s} className="glass p-5"><span className="text-3xl font-extrabold text-brand-purple">{i + 1}</span><p className="mt-2">{s}</p></li>)}
        </ol>
      </section>

      <section className="glass flex gap-4 p-6" aria-label="Privacy">
        <ShieldCheck className="shrink-0 text-emerald-300" size={32} />
        <div className="space-y-1 text-sm text-slate-300">
          <h2 className="text-lg font-semibold text-slate-100">Privacy & honesty</h2>
          <p>Camera video is processed locally in your browser and never sent to our server. Only numbers such as session length and command counts are stored.</p>
          <p>Voice recognition uses your browser’s speech service (Chrome sends audio to Google), so it needs an internet connection. Websites cannot move the real system cursor, so this app controls its own demo workspace.</p>
        </div>
      </section>
    </main>
  )
}
