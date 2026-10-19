// Types text into a React-controlled <input>/<textarea> by using the browser's
// own value setter and firing an 'input' event so React notices the change.
export function typeIntoField(el, text) {
  if (!el || !['INPUT', 'TEXTAREA'].includes(el.tagName)) return false
  const proto = el.tagName === 'INPUT' ? HTMLInputElement.prototype : HTMLTextAreaElement.prototype
  const setter = Object.getOwnPropertyDescriptor(proto, 'value').set
  const sep = el.value && !el.value.endsWith(' ') ? ' ' : ''
  setter.call(el, el.value + sep + text)
  el.dispatchEvent(new Event('input', { bubbles: true }))
  return true
}
