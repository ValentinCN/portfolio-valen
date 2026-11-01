import { useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from '../pointer'
import { AVATAR_IMG } from './CharacterView'

// Pantalla de carga "Compilando a Valen… 87%".
// - Dura menos de 2 segundos y se saltea con el botón, Esc, Enter o tocando la pantalla.
// - Se muestra una sola vez por visita (sessionStorage) y nunca con "reducir movimiento".

const KEY = 'valen-loader-visto'
const DURATION = 1700

// Avisa al resto de la página (por ejemplo, al personaje 3D) que ya puede cargar lo pesado.
export function markLoaded() {
  window.__valenLoaded = true
  window.dispatchEvent(new Event('valen:loaded'))
}
export function whenLoaded(cb) {
  if (window.__valenLoaded) return cb(), () => {}
  window.addEventListener('valen:loaded', cb, { once: true })
  return () => window.removeEventListener('valen:loaded', cb)
}

function shouldShow() {
  if (typeof window === 'undefined' || prefersReducedMotion) return false
  try {
    return !sessionStorage.getItem(KEY)
  } catch {
    return true
  }
}

export function Loader({ t }) {
  const [show, setShow] = useState(() => {
    const s = shouldShow()
    if (!s && typeof window !== 'undefined') window.__valenLoaded = true
    return s
  })
  const [leaving, setLeaving] = useState(false)
  const [pct, setPct] = useState(0)
  const doneRef = useRef(false)
  const l = t.loader

  const finish = () => {
    if (doneRef.current) return
    doneRef.current = true
    try { sessionStorage.setItem(KEY, '1') } catch { /* modo privado */ }
    setLeaving(true)
    setTimeout(() => {
      setShow(false)
      markLoaded()
    }, 420)
  }

  useEffect(() => {
    if (!show) return
    document.documentElement.classList.add('is-loading')
    let raf
    const start = performance.now()
    const tick = (now) => {
      const k = Math.min(1, (now - start) / DURATION)
      // Avanza rápido, se "traba" un poquito cerca del 87% y termina.
      const eased = k < 0.7 ? (k / 0.7) * 0.87 : 0.87 + ((k - 0.7) / 0.3) ** 2 * 0.13
      setPct(Math.round(eased * 100))
      if (k < 1) raf = requestAnimationFrame(tick)
      else setTimeout(finish, 180)
    }
    raf = requestAnimationFrame(tick)
    const onKey = (e) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') finish()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', onKey)
      document.documentElement.classList.remove('is-loading')
    }
  }, [show])

  if (!show) return null

  const stepIndex = pct >= 100 ? 4 : pct >= 90 ? 3 : pct >= 70 ? 2 : pct >= 35 ? 1 : 0

  return (
    <div className={`loader${leaving ? ' out' : ''}`} onClick={finish} role="status" aria-label={l.title}>
      <button type="button" className="btn-ghost small loader-skip" onClick={finish}>
        {l.skip} →
      </button>

      <div className="loader-card" aria-hidden="true">
        <div className="loader-avatar" style={{ '--p': `${pct}%` }}>
          <img className="ghost" src={AVATAR_IMG.idle} alt="" />
          <img className="built" src={AVATAR_IMG.idle} alt="" />
          <span className="scan" />
        </div>

        <div className="loader-title">
          {l.title} <span className="loader-pct">{pct}%</span>
        </div>
        <div className="loader-bar"><span style={{ width: `${pct}%` }} /></div>

        <ul className="loader-steps">
          {l.steps.map((s, i) => (
            <li key={s} className={i < stepIndex ? 'ok' : i === stepIndex ? 'now' : ''}>
              <span className="mark">{i < stepIndex ? '✓' : i === stepIndex ? '›' : '·'}</span>
              {s}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
