// Barra superior, igual en todas las páginas. Los links usan "/#seccion"
// para que funcionen también desde un caso de estudio.
export function Header({ t, lang, setLang }) {
  return (
    <header className="site-header">
      <div className="wrap header-row">
        <a href="/" className="logo">valen<span>.dev</span></a>
        <nav aria-label="Principal" className="nav">
          <a href="/#escritorio">{t.nav.desk}</a>
          <a href="/#proyectos">{t.nav.projects}</a>
          <a href="/#skills">{t.nav.skills}</a>
          <a href="/#contacto">{t.nav.contact}</a>
          <div className="lang" role="group" aria-label="Idioma / Language">
            <button type="button" aria-pressed={lang === 'es'} onClick={() => setLang('es')}>ES</button>
            <button type="button" aria-pressed={lang === 'en'} onClick={() => setLang('en')}>EN</button>
          </div>
          <a href="/#proyectos" className="btn-outline">{t.nav.fast}</a>
        </nav>
      </div>
    </header>
  )
}

// Muestra un texto y resalta lo que esté [ENTRE CORCHETES] (pendiente de completar).
export function Txt({ children }) {
  if (typeof children !== 'string' || !children.includes('[')) return children
  return children.split(/(\[[^\]]+\])/g).map((part, i) =>
    part.startsWith('[') && part.endsWith(']') ? <mark key={i} className="todo">{part}</mark> : part
  )
}

export function Icon({ d }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  )
}

export const ICONS = {
  whatsapp: 'M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z',
  email: 'M3 7l9 6 9-6M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z',
  code: 'M8 8l-4 4 4 4M16 8l4 4-4 4M13 6l-2 12',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 20c1.5-4 4.5-6 8-6s6.5 2 8 6',
  external: 'M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5',
}
