// Turns what the user SAID into an ACTION. Fixed rules only — no AI/LLM needed.
// Anything that does not match is ignored, so normal talking never triggers actions.
const norm = (t) => t.toLowerCase().replace(/[.,!?]/g, '').replace(/\s+/g, ' ').trim()

const EXACT = {
  'start handsfree': ['START_HANDSFREE', 'Start handsfree'],
  'stop handsfree': ['STOP_HANDSFREE', 'Stop handsfree'],
  'scroll down': ['SCROLL_DOWN', 'Scroll down'],
  'scroll up': ['SCROLL_UP', 'Scroll up'],
  'go to the top': ['TOP', 'Go to the top'],
  'go back': ['BACK', 'Go back'],
  'go home': ['HOME', 'Go to the home page'],
  click: ['CLICK', 'Click what the pointer is on'],
  'read this page': ['READ', 'Read this page aloud'],
  'stop reading': ['STOP_READING', 'Stop reading'],
  cancel: ['CANCEL', 'Cancel'],
  confirm: ['CONFIRM', 'Confirm the pending action'],
}

export const COMMAND_HELP = [
  'start handsfree', 'stop handsfree', 'scroll down', 'scroll up', 'go to the top', 'go back',
  'click', 'search for …', 'type …', 'read this page', 'stop reading', 'cancel', 'confirm',
]

export function interpret(raw) {
  const t = norm(raw)
  if (EXACT[t]) return { action: EXACT[t][0], label: EXACT[t][1] }
  let m = t.match(/^search for (.+)$/)
  if (m) return { action: 'SEARCH', payload: m[1], label: `Search for “${m[1]}”` }
  m = t.match(/^type (.+)$/)
  if (m) return { action: 'TYPE', payload: m[1], label: `Type “${m[1]}”` }
  return null
}
