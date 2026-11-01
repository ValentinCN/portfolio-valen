import { useEffect, useRef, useState } from 'react'
import { SECRET_IDS, discover, resetSecrets, useSecrets } from '../secrets'
import { contactLinks } from '../data'
import { prefersReducedMotion } from '../pointer'

// Contador "Encontraste X de 5 secretos", avisos y el código Konami.
const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']
const SWIPES = ['up', 'up', 'down', 'down', 'left', 'right', 'left', 'right'] // en el celu, sin B y A

export function Secrets({ t }) {
  const s = t.secrets
  const found = useSecrets()
  const [toasts, setToasts] = useState([])
  const [open, setOpen] = useState(false)
  const [party, setParty] = useState(0)
  const panelRef = useRef(null)
  const btnRef = useRef(null)

  // Avisos cuando se encuentra un secreto.
  useEffect(() => {
    const onSecret = (e) => {
      const { id, total } = e.detail
      // Guardamos solo el id: el texto se arma al mostrarlo, así sale en el idioma actual.
      const items = [{ key: `${id}-${Date.now()}`, id, n: total }]
      if (total === SECRET_IDS.length) items.push({ key: `all-${Date.now()}`, all: true })
      setToasts((list) => [...list, ...items])
      if (id === 'konami' || total === SECRET_IDS.length) setParty((n) => n + 1)
    }
    window.addEventListener('valen:secret', onSecret)
    return () => window.removeEventListener('valen:secret', onSecret)
  }, [])

  useEffect(() => {
    if (!toasts.length) return
    const id = setTimeout(() => setToasts((list) => list.slice(1)), toasts[0].all ? 7000 : 4200)
    return () => clearTimeout(id)
  }, [toasts])

  // Código Konami: teclado (↑↑↓↓←→←→BA) o deslizando el dedo en el celu.
  useEffect(() => {
    let keys = []
    const onKey = (e) => {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key
      keys = [...keys, k].slice(-KONAMI.length)
      if (KONAMI.every((v, i) => keys[i] === v)) discover('konami')
    }
    let swipes = []
    let start = null
    const onStart = (e) => {
      const p = e.touches[0]
      start = { x: p.clientX, y: p.clientY }
    }
    const onEnd = (e) => {
      if (!start) return
      const p = e.changedTouches[0]
      const dx = p.clientX - start.x
      const dy = p.clientY - start.y
      start = null
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 40) return
      const dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up'
      swipes = [...swipes, dir].slice(-SWIPES.length)
      if (SWIPES.every((v, i) => swipes[i] === v)) discover('konami')
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchend', onEnd, { passive: true })
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('touchstart', onStart)
      window.removeEventListener('touchend', onEnd)
    }
  }, [])

  // Panel: Esc para cerrar y foco adentro.
  useEffect(() => {
    if (!open) return
    panelRef.current?.focus()
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false)
        btnRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const n = found.length
  const total = SECRET_IDS.length

  return (
    <>
      <div className="secrets-dock">
        {open && (
          <div className="secrets-panel" role="dialog" aria-label={s.title} tabIndex={-1} ref={panelRef}>
            <div className="secrets-head">
              <strong>{s.title}</strong>
              <span className="mono-label">{s.counter(n, total)}</span>
            </div>
            <div className="secrets-bar"><span style={{ width: `${(n / total) * 100}%` }} /></div>
            <ul className="secrets-list">
              {SECRET_IDS.map((id) => {
                const ok = found.includes(id)
                return (
                  <li key={id} className={ok ? 'ok' : ''}>
                    <span className="secrets-mark" aria-hidden="true">{ok ? '✓' : '?'}</span>
                    <span>
                      <strong>{ok ? s.items[id].name : '???'}</strong>
                      <span>{s.items[id].hint}</span>
                      {ok && id === 'musica' && contactLinks.youtube && (
                        <a className="secrets-link" href={contactLinks.youtube} target="_blank" rel="noreferrer">{s.listen}</a>
                      )}
                    </span>
                  </li>
                )
              })}
            </ul>
            {n === total && (
              <a className="btn-warm small-cta" href={contactLinks.whatsapp} target="_blank" rel="noreferrer">{s.allCta}</a>
            )}
            {n > 0 && (
              <button type="button" className="secrets-reset" onClick={resetSecrets}>{s.reset}</button>
            )}
          </div>
        )}
        <button
          type="button"
          ref={btnRef}
          className={`secrets-pill${n === total ? ' done' : ''}`}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <span aria-hidden="true">{n === total ? '🏆' : '🔍'}</span>
          <span>{s.counter(n, total)}</span>
        </button>
      </div>

      <div className="secrets-toasts" role="status" aria-live="polite">
        {toasts.slice(0, 1).map((toast) => (
          <div key={toast.key} className={`secrets-toast${toast.all ? ' all' : ''}`}>
            <strong>{toast.all ? s.allTitle : `${s.found} · ${toast.n}/${total}`}</strong>
            <span>{toast.all ? s.allText : s.items[toast.id].msg}</span>
          </div>
        ))}
      </div>

      {party > 0 && !prefersReducedMotion && <Confetti key={party} />}
    </>
  )
}

// Lluvia corta de papelitos con los colores de la página.
function Confetti() {
  const [on, setOn] = useState(true)
  useEffect(() => {
    const id = setTimeout(() => setOn(false), 2600)
    return () => clearTimeout(id)
  }, [])
  if (!on) return null
  const colors = ['#7CC4FF', '#F2B661', '#7FD9A0', '#F29BC0', '#EDEFF3']
  return (
    <div className="confetti" aria-hidden="true">
      {Array.from({ length: 42 }, (_, i) => (
        <i
          key={i}
          style={{
            left: `${(i * 37) % 100}%`,
            background: colors[i % colors.length],
            animationDelay: `${(i % 7) * 0.08}s`,
            animationDuration: `${1.6 + (i % 5) * 0.18}s`,
            '--x': `${((i * 53) % 120) - 60}px`,
            '--r': `${(i * 47) % 360}deg`,
          }}
        />
      ))}
    </div>
  )
}
