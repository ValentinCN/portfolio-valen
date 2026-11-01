import { useEffect, useSyncExternalStore } from 'react'

// Router mínimo (sin librerías): usa el History API del navegador.
// Rutas: "/" (inicio) y "/proyectos/:id" (caso de estudio).

const EVENT = 'locationchange'

const subscribe = (cb) => {
  window.addEventListener('popstate', cb)
  window.addEventListener(EVENT, cb)
  return () => {
    window.removeEventListener('popstate', cb)
    window.removeEventListener(EVENT, cb)
  }
}
const getPath = () => window.location.pathname

export function usePath() {
  return useSyncExternalStore(subscribe, getPath, () => '/')
}

export function navigate(to) {
  const url = new URL(to, window.location.href)
  const samePage = url.pathname === window.location.pathname
  window.history.pushState({}, '', url.pathname + url.search + url.hash)
  window.dispatchEvent(new Event(EVENT))
  if (samePage) scrollToHash(url.hash, true)
}

// Al cambiar de página el salto es instantáneo (sin el scroll suave del CSS).
export function scrollToHash(hash, smooth = false) {
  const behavior = smooth && !window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'smooth' : 'instant'
  if (!hash) return window.scrollTo({ top: 0, behavior })
  // Esperamos un frame para que la página nueva esté dibujada.
  requestAnimationFrame(() => {
    const el = document.getElementById(decodeURIComponent(hash.slice(1)))
    if (el) el.scrollIntoView({ behavior })
    else window.scrollTo({ top: 0, behavior })
  })
}

// Intercepta los clicks en links internos ("/..." ) para no recargar la página.
export function useLinkInterceptor() {
  useEffect(() => {
    const onClick = (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = e.target.closest?.('a[href]')
      if (!a || a.target || a.hasAttribute('download')) return
      const href = a.getAttribute('href')
      if (!href.startsWith('/')) return
      e.preventDefault()
      navigate(href)
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])
}

// Devuelve { name, params } según la ruta.
export function matchRoute(path) {
  const m = path.match(/^\/proyectos\/([^/]+)\/?$/)
  if (m) return { name: 'case', params: { id: decodeURIComponent(m[1]) } }
  if (path === '/' || path === '/index.html') return { name: 'home', params: {} }
  return { name: 'notfound', params: {} }
}
