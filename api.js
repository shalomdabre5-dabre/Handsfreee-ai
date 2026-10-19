// ONE place for every backend call. Components never use fetch() directly.
const BASE = import.meta.env.VITE_API_URL
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

const mockSettings = { sensitivity: 1, dwell_ms: 1500, voice_feedback: true, high_contrast: false, store_session_data: true }
// MOCK DATA: only used when VITE_USE_MOCK=true. Replace by turning the flag off.
const mock = {
  health: () => ({ status: 'ok', storage: 'mock (no backend)' }),
  getSettings: () => mockSettings,
  updateSettings: (s) => s,
  createSession: (s) => ({ ...s, id: 'mock', created_at: new Date().toISOString() }),
  listSessions: () => [],
  getAnalytics: () => ({ total_sessions: 0, commands_attempted: 0, commands_recognized: 0, accuracy_percent: null, avg_task_completion_seconds: null, accidental_activations: 0, avg_calibration_seconds: null }),
}

async function request(path, options = {}) {
  if (!BASE) throw new Error('VITE_API_URL is not set. Copy frontend/.env.example to frontend/.env')
  let res
  try {
    res = await fetch(`${BASE}${path}`, { headers: { 'Content-Type': 'application/json' }, ...options })
  } catch {
    throw new Error(`Cannot reach the backend at ${BASE}. Is it running? (CORS problems also show up like this.)`)
  }
  if (!res.ok) throw new Error(`Backend returned ${res.status} for ${path}`)
  return res.json()
}

const call = (name, real) => async (...args) => (USE_MOCK ? mock[name](...args) : real(...args))

export const api = {
  health: call('health', () => request('/api/health')),
  getSettings: call('getSettings', () => request('/api/settings')),
  updateSettings: call('updateSettings', (s) => request('/api/settings', { method: 'PUT', body: JSON.stringify(s) })),
  createSession: call('createSession', (s) => request('/api/sessions', { method: 'POST', body: JSON.stringify(s) })),
  listSessions: call('listSessions', () => request('/api/sessions')),
  getAnalytics: call('getAnalytics', () => request('/api/analytics')),
}
