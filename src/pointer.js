// Posición del mouse (o del dedo) en toda la ventana, compartida por todos los avatares.
export const pointer = { x: 0, y: 0, active: false }

if (typeof window !== 'undefined') {
  const update = (e) => {
    pointer.x = e.clientX
    pointer.y = e.clientY
    pointer.active = true
  }
  window.addEventListener('pointermove', update, { passive: true })
  window.addEventListener('pointerdown', update, { passive: true })
  document.addEventListener('mouseleave', () => { pointer.active = false })
}

export const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
