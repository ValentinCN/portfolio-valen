import { useEffect, useState } from 'react'
import { Header } from './components/Header'
import { Loader } from './components/Loader'
import { Secrets } from './components/Secrets'
import { discover } from './secrets'
import { Home } from './pages/Home'
import { CaseStudy } from './pages/CaseStudy'
import { T } from './data'
import { usePath, matchRoute, useLinkInterceptor, scrollToHash } from './router'

const readLang = () => {
  try { return localStorage.getItem('valen-lang') === 'en' ? 'en' : 'es' } catch { return 'es' }
}

export default function App() {
  const [lang, setLangState] = useState(readLang)
  const t = T[lang]
  const path = usePath()
  const route = matchRoute(path)
  useLinkInterceptor()

  const setLang = (l) => {
    if (l !== lang) discover('idioma')
    setLangState(l)
    try { localStorage.setItem('valen-lang', l) } catch { /* modo privado */ }
  }

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  // Al cambiar de página: ir a la sección del #hash o arriba de todo.
  useEffect(() => {
    scrollToHash(window.location.hash)
  }, [path])

  return (
    <>
      <Loader t={t} />
      <Secrets t={t} />
      <a href="#contenido" className="skip-link">{lang === 'es' ? 'Saltar al contenido' : 'Skip to content'}</a>
      <Header t={t} lang={lang} setLang={setLang} />
      <div id="contenido">
        {route.name === 'home' && <Home t={t} lang={lang} />}
        {route.name === 'case' && <CaseStudy key={route.params.id} id={route.params.id} t={t} lang={lang} />}
        {route.name === 'notfound' && (
          <main className="wrap section notfound">
            <h1>{t.notFound}</h1>
            <a href="/" className="btn-primary">{t.home}</a>
          </main>
        )}
      </div>
      <footer className="wrap footer">
        <span>© {new Date().getFullYear()} Valentín Campos</span>
        <a href={route.name === 'home' ? '#inicio' : '/#proyectos'}>{route.name === 'home' ? t.top : t.cs.back}</a>
      </footer>
    </>
  )
}
