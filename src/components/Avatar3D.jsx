import { useEffect, useRef, useState } from 'react'
import { CharacterView } from './CharacterView'
import { getEngine, supports3D } from '../three/stage'

// Personaje 3D (mismas opciones que CharacterView). Se usa en toda la página.
// - Mientras carga, o si el navegador no tiene WebGL, se ve la ilustración 2D.
// - framing: 'full' (cuerpo entero) o 'bust' (de la cintura para arriba).
// - waveSignal: cada vez que cambia, saluda. mood 'talk': se mueve como si hablara.
// - lookAt {x, y}: mira hacia un lugar. spin: se puede girar arrastrando. hidden: no se dibuja.
export function Avatar3D(props) {
  const { className, framing = 'full', waveSignal = 0, mood = 'smile', lookAt, onClick, label, spin = false, hidden = false } = props
  const canvasRef = useRef(null)
  const viewRef = useRef(null)
  const optsRef = useRef({})
  const downRef = useRef(null)
  const [enabled] = useState(supports3D)
  const [ready, setReady] = useState(false)
  optsRef.current = { framing, mood, lookAt, hidden }

  useEffect(() => {
    if (!enabled) return
    let alive = true
    getEngine()
      .then((engine) => {
        if (!alive || !canvasRef.current) return
        viewRef.current = engine.createView(canvasRef.current, optsRef)
        setReady(true)
      })
      .catch((err) => console.info('[Avatar3D] usando la versión 2D:', err?.message || err))
    return () => {
      alive = false
      viewRef.current?.dispose()
      viewRef.current = null
    }
  }, [enabled])

  // Saluda cuando cambia la señal (y una vez al aparecer, si ya había un saludo pendiente).
  useEffect(() => {
    if (waveSignal) viewRef.current?.wave()
  }, [waveSignal])
  useEffect(() => {
    if (ready && waveSignal) viewRef.current?.wave()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  const interactive = Boolean(onClick) || spin
  return (
    <div className={`avatar3d framing-${framing}${ready ? ' is-ready' : ''} ${className || ''}`}>
      <CharacterView {...props} className="avatar3d-fallback" onClick={ready ? undefined : onClick} />
      {enabled && (
        <canvas
          ref={canvasRef}
          className={`avatar3d-canvas${spin ? ' can-spin' : ''}`}
          role={onClick ? 'button' : 'img'}
          tabIndex={onClick && ready ? 0 : -1}
          aria-label={label}
          aria-hidden={!ready}
          style={interactive ? undefined : { pointerEvents: 'none' }}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && onClick) {
              e.preventDefault()
              onClick()
            }
          }}
          onPointerDown={(e) => {
            downRef.current = { x: e.clientX, y: e.clientY }
            if (spin) {
              e.currentTarget.setPointerCapture?.(e.pointerId)
              viewRef.current?.dragStart(e.clientX)
            }
          }}
          onPointerMove={(e) => spin && viewRef.current?.dragMove(e.clientX)}
          onPointerUp={(e) => {
            const d = downRef.current
            if (onClick && d && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 6) onClick()
            downRef.current = null
            viewRef.current?.dragEnd()
          }}
          onPointerCancel={() => viewRef.current?.dragEnd()}
        />
      )}
    </div>
  )
}
