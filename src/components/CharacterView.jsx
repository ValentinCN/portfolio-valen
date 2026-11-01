import { useEffect, useRef, useState } from 'react'
import { pointer, prefersReducedMotion } from '../pointer'

// Imágenes del personaje (WebP con fondo transparente) dentro de /public/avatar
export const AVATAR_IMG = {
  idle: '/avatar/valen.webp',
  wave: '/avatar/valen-saludo.webp',
}

const clamp = (v) => Math.max(-1, Math.min(1, v))
const WAVE_MS = 2400

/**
 * Recuadro con el personaje ilustrado.
 * - Se inclina suavemente hacia el mouse (efecto 2.5D) y respira.
 * - waveSignal: cada vez que cambia, muestra la pose de saludo.
 * - mood 'talk': da saltitos como si hablara.
 * - lookAt {x, y}: obliga a inclinarse hacia un lugar (ej. un objeto del escritorio).
 * - framing 'full' (cuerpo entero) o 'bust' (de la cintura para arriba).
 */
export function CharacterView({ className, framing = 'full', waveSignal = 0, mood = 'smile', lookAt, onClick, label }) {
  const ref = useRef(null)
  const [look, setLook] = useState({ x: 0, y: 0 })
  const [waving, setWaving] = useState(false)

  useEffect(() => {
    let raf
    let cur = { x: 0, y: 0 }
    const tick = () => {
      let tx = 0
      let ty = 0
      const el = ref.current
      if (lookAt) {
        tx = lookAt.x
        ty = lookAt.y
      } else if (el && pointer.active) {
        const r = el.getBoundingClientRect()
        tx = clamp((pointer.x - (r.left + r.width / 2)) / (window.innerWidth * 0.4))
        ty = clamp((pointer.y - (r.top + r.height * 0.3)) / (window.innerHeight * 0.45))
      }
      const nx = cur.x + (tx - cur.x) * 0.12
      const ny = cur.y + (ty - cur.y) * 0.12
      if (Math.abs(nx - cur.x) > 0.002 || Math.abs(ny - cur.y) > 0.002) {
        cur = { x: nx, y: ny }
        setLook(cur)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [lookAt])

  useEffect(() => {
    if (!waveSignal) return
    setWaving(true)
    const stop = setTimeout(() => setWaving(false), WAVE_MS)
    return () => clearTimeout(stop)
  }, [waveSignal])

  const tilt = prefersReducedMotion
    ? undefined
    : { transform: `perspective(900px) rotateY(${look.x * 10}deg) rotateX(${-look.y * 4}deg) translateX(${look.x * 6}px)` }

  const interactive = Boolean(onClick)
  const Tag = interactive ? 'button' : 'div'

  return (
    <Tag
      ref={ref}
      type={interactive ? 'button' : undefined}
      className={`character-view framing-${framing} mood-${mood}${waving ? ' is-waving' : ''}${prefersReducedMotion ? ' reduced' : ''} ${className || ''}`}
      onClick={onClick}
      aria-label={label}
    >
      <span className="character-tilt" style={tilt}>
        <span className="character-body">
          <img className="pose pose-idle" src={AVATAR_IMG.idle} alt="" draggable="false" />
          <img className="pose pose-wave" src={AVATAR_IMG.wave} alt="" draggable="false" />
        </span>
      </span>
    </Tag>
  )
}
