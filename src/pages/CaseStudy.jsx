import { useEffect } from 'react'
import { Avatar3D } from '../components/Avatar3D'
import { Txt, Icon, ICONS } from '../components/Header'
import { PROJECTS, contactLinks, projectName } from '../data'

const GUIDE_LOOK = { x: 0.6, y: 0.15 }

// Página de un proyecto: /proyectos/:id
export function CaseStudy({ id, t, lang }) {
  const index = PROJECTS.findIndex((p) => p.id === id)
  const p = PROJECTS[index]
  const c = t.cs

  useEffect(() => {
    document.title = p ? `${projectName(p, lang)} · ${c.label} · Valentín Campos` : 'Valentín Campos'
    return () => { document.title = 'Valentín Campos · Full-stack developer' }
  }, [p, c.label])

  if (!p) {
    return (
      <main className="wrap section notfound">
        <h1>{c.notFound}</h1>
        <a href="/#proyectos" className="btn-primary">{c.back}</a>
      </main>
    )
  }

  const prev = PROJECTS[(index - 1 + PROJECTS.length) % PROJECTS.length]
  const next = PROJECTS[(index + 1) % PROJECTS.length]
  const num = String(index + 1).padStart(2, '0')
  const total = String(PROJECTS.length).padStart(2, '0')

  return (
    <main className="case">
      {/* Encabezado */}
      <section className="wrap case-hero">
        <a href="/#proyectos" className="back-link">{c.back}</a>
        <div className="eyebrow">{c.label} · {num} / {total}</div>
        <h1>{projectName(p, lang)}</h1>
        <p className="lead"><Txt>{p.desc[lang]}</Txt></p>
        <dl className="case-meta">
          <div><dt>{c.role}</dt><dd><Txt>{p.role[lang]}</Txt></dd></div>
          <div><dt>{c.kind}</dt><dd>{p.kind[lang]}</dd></div>
          <div><dt>{c.year}</dt><dd><Txt>{p.year}</Txt></dd></div>
        </dl>
        <div className="row">
          {p.demo
            ? <a className="btn-primary" href={p.demo} target="_blank" rel="noreferrer">{t.demo}</a>
            : <span className="btn-ghost is-disabled" aria-disabled="true">{t.demo.replace(' →', '')} · {c.soon}</span>}
          {p.code
            ? <a className="btn-ghost" href={p.code} target="_blank" rel="noreferrer"><Icon d={ICONS.code} />{t.code}</a>
            : <span className="btn-ghost is-disabled" aria-disabled="true"><Icon d={ICONS.code} />{t.code} · {c.soon}</span>}
        </div>
      </section>

      {/* Captura principal */}
      <div className="wrap">
        <Shot shot={p.shots[0]} lang={lang} hint={c.shotHint} big />
      </div>

      {/* Contenido + guía */}
      <div className="wrap case-body">
        <div className="case-main">
          <Block n="01" title={c.problem}><p><Txt>{p.problem[lang]}</Txt></p></Block>
          <Block n="02" title={c.solution}>
            <p><Txt>{p.solution[lang]}</Txt></p>
            <h3 className="mono-label">{c.features}</h3>
            <ul className="feature-list">
              {p.features[lang].map((f) => <li key={f}><Txt>{f}</Txt></li>)}
            </ul>
          </Block>
          {p.shots.length > 1 && (
            <Block n="03" title={c.shots}>
              <div className="shots-grid">
                {p.shots.slice(1).map((s) => <Shot key={s.file} shot={s} lang={lang} hint={c.shotHint} />)}
              </div>
            </Block>
          )}
          <Block n={p.shots.length > 1 ? '04' : '03'} title={c.stack}>
            <div className="tags big">{p.tags.map((tag) => <span key={tag}><Txt>{tag}</Txt></span>)}</div>
          </Block>
          <Block n={p.shots.length > 1 ? '05' : '04'} title={c.result} warm>
            <p className="result"><Txt>{p.result[lang]}</Txt></p>
          </Block>
        </div>

        <aside className="case-guide" aria-label={c.guide}>
          <div className="bubble guide-bubble">{p.say[lang]}</div>
          <Avatar3D className="guide-avatar" framing="bust" mood="smile" lookAt={GUIDE_LOOK} label={c.guide} />
          <div className="mono-label">{c.guide}</div>
        </aside>
      </div>

      {/* Llamado a la acción */}
      <section className="wrap">
        <div className="case-cta">
          <div>
            <h2>{c.ctaTitle}</h2>
            <p className="muted">{c.ctaText}</p>
          </div>
          <a className="btn-warm" href={contactLinks.whatsapp} {...(contactLinks.whatsapp.startsWith('http') ? { target: '_blank', rel: 'noreferrer' } : {})}>
            <Icon d={ICONS.whatsapp} />{c.ctaBtn}
          </a>
        </div>
      </section>

      {/* Anterior / siguiente */}
      <nav className="wrap case-nav" aria-label={t.nav.projects}>
        <a href={`/proyectos/${prev.id}`}><span className="mono-label">{c.prev}</span><strong>{projectName(prev, lang)}</strong></a>
        <a href={`/proyectos/${next.id}`} className="right"><span className="mono-label">{c.next}</span><strong>{projectName(next, lang)}</strong></a>
      </nav>
    </main>
  )
}

function Block({ n, title, warm, children }) {
  return (
    <section className="case-block">
      <div className={`eyebrow${warm ? ' warm' : ''}`}>{n}</div>
      <h2>{title}</h2>
      {children}
    </section>
  )
}

function Shot({ shot, lang, hint, big }) {
  if (!shot) return null
  return (
    <figure className={`case-shot${big ? ' big' : ''}`}>
      <div className="shot">
        {shot.src
          ? <img src={shot.src} alt={shot.caption[lang]} loading={big ? 'eager' : 'lazy'} />
          : <span>{hint}{shot.file}</span>}
      </div>
      <figcaption>{shot.caption[lang]}</figcaption>
    </figure>
  )
}
