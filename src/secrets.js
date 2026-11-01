import { useSyncExternalStore } from 'react'

// Secretos escondidos en la página. Se guardan en el navegador del visitante (localStorage).
export const SECRET_IDS = ['planta', 'taza', 'musica', 'konami', 'avatar', 'idioma']
const KEY = 'valen-secretos'

const read = () => {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]')
    return Array.isArray(v) ? v.filter((id) => SECRET_IDS.includes(id)) : []
  } catch {
    return []
  }
}

let found = typeof window !== 'undefined' ? read() : []
const listeners = new Set()
const emit = () => listeners.forEach((l) => l())

export function useSecrets() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => found,
    () => found
  )
}

// Marca un secreto como encontrado. Devuelve true si es nuevo.
export function discover(id) {
  if (!SECRET_IDS.includes(id) || found.includes(id)) return false
  found = [...found, id]
  try { localStorage.setItem(KEY, JSON.stringify(found)) } catch { /* modo privado */ }
  emit()
  window.dispatchEvent(new CustomEvent('valen:secret', { detail: { id, total: found.length } }))
  return true
}

export function resetSecrets() {
  found = []
  try { localStorage.removeItem(KEY) } catch { /* modo privado */ }
  emit()
}
