import { useEffect, useRef, useState } from 'react'
import { Avatar3D } from '../components/Avatar3D'
import { discover } from '../secrets'
import { DeskScene } from '../components/DeskScene'
import { Chat } from '../components/Chat'
import { PROJECTS, SKILLS, contactLinks, projectName } from '../data'
import { Txt, Icon, ICONS, BrowserBar, frameLabel } from '../components/Header'

const GUIDE_LOOK = { x: 0.9, y: 0.1 }
const pick = (v, lang) => (typeof v === 'string' ? v : v[lang])

// Dispara un número nuevo la primera vez que el elemento entra en pantalla.
function useWaveOnView(ref) {
  const [signal, setSignal] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSignal((s) => s + 1)
          io.disconnect()
        }
      },
      { threshold: 0.5 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [ref])
  return [signal, setSignal]
}

export function Home({ t, lang }) {
  const [heroWave, setHeroWave] = useState(1)
  // Secreto: tocar el avatar 5 veces seguidas (con menos de 2,5 s entre toques).
  const taps = useRef({ n: 0, last: 0 })
  const tapHero = () => {
    setHeroWave((n) => n + 1)
    const now = Date.now()
    taps.current.n = now - taps.current.last < 2500 ? taps.current.n + 1 : 1
    taps.current.last = now
    if (taps.current.n >= 5) discover('avatar')
  }
  const deskRef = useRef(null)
  const [deskWave] = useWaveOnView(deskRef)
  const [deskActive, setDeskActive] = useState(null)
  const [hovered, setHovered] = useState(null)
  const [chatWave, setChatWave] = useState(0)
  const [chatTalking, setChatTalking] = useState(false)
  const talkTimer = useRef(null)
  const onAnswer = () => {
    setChatWave((n) => n + 1)
    setChatTalking(true)
    clearTimeout(talkTimer.current)
    talkTimer.current = setTimeout(() => setChatTalking(false), 4200)
  }

  const guideProject = PROJECTS.find((p) => p.id === hovered)

  return (
    <main>
      {/* 01 · PORTADA */}
      <section id="inicio" className="wrap hero">
        <div className="hero-copy">
          <div className="eyebrow">{t.eyebrow}</div>
          <h1>{t.heroTitle}</h1>
          <p className="lead">{t.heroSub}</p>
          <div className="row">
            <a href="#escritorio" className="btn-primary">{t.heroCta1}</a>
            <a href="#contacto" className="btn-ghost">{t.heroCta2}</a>
          </div>
          <div className="hero-note">{t.heroNote}</div>
        </div>
        <div className="hero-stage">
          <div className="halo" aria-hidden="true" />
          <div className="plinth" aria-hidden="true" />
          <Avatar3D
            className="hero-avatar"
            spin
            framing="full"
            waveSignal={heroWave}
            onClick={tapHero}
            label={lang === 'es' ? 'Avatar de Valentín. Tocalo para que salude.' : 'Valentín’s avatar. Click to wave.'}
          />
          <div className="bubble hero-bubble">{t.heroBubble}</div>
          <div className="chip-float f1" aria-hidden="true">React</div>
          <div className="chip-float f2" aria-hidden="true">Node.js</div>
          <div className="chip-float f3" aria-hidden="true">MongoDB</div>
        </div>
      </section>

      {/* 02 · ESCRITORIO */}
      <section id="escritorio" className="band">
        <div className="wrap section" ref={deskRef}>
          <div className="section-head">
            <div>
              <div className="eyebrow">{t.deskLabel}</div>
              <h2>{t.deskTitle}</h2>
            </div>
            <p className="muted">{t.deskSub}</p>
          </div>
          <DeskScene t={t} lang={lang} active={deskActive} setActive={setDeskActive} waveSignal={deskWave} />
        </div>
      </section>

      {/* 03 · PROYECTOS */}
      <section id="proyectos" className="wrap section">
        <div className="section-head">
          <div>
            <div className="eyebrow">{t.projLabel}</div>
            <h2>{t.projTitle}</h2>
          </div>
          <p className="muted">{t.projSub}</p>
        </div>
        <div className="projects-row">
          <aside className="guide">
            <div className="bubble guide-bubble" aria-live="polite">
              {guideProject ? guideProject.say[lang] : t.guideIdle}
            </div>
            <Avatar3D
              className="guide-avatar"
              framing="bust"
              mood={guideProject ? 'talk' : 'smile'}
              lookAt={guideProject ? GUIDE_LOOK : undefined}
              label={lang === 'es' ? 'Avatar guía' : 'Guide avatar'}
            />
            <div className="mono-label">{t.guide}</div>
          </aside>
          <div className="projects-grid">
            {PROJECTS.map((p) => (
              <article
                key={p.id}
                className={`card${hovered === p.id ? ' on' : ''}`}
                onMouseEnter={() => setHovered(p.id)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(p.id)}
              >
                <BrowserBar label={frameLabel(p, t)} />
                <div className="shot">
                  {p.image ? <img src={p.image} alt={projectName(p, lang)} loading="lazy" /> : <span>[{t.shot} · {projectName(p, lang)}]</span>}
                </div>
                <div className="card-body">
                  <h3><a href={`/proyectos/${p.id}`} className="card-link">{projectName(p, lang)}</a></h3>
                  <p><Txt>{p.desc[lang]}</Txt></p>
                  <div className="tags">{p.tags.map((tag) => <span key={tag}><Txt>{tag}</Txt></span>)}</div>
                  <div className="card-links">
                    <a href={`/proyectos/${p.id}`} className="case-link">{t.seeCase}</a>
                    {p.demo && <a href={p.demo} className="dim" target="_blank" rel="noreferrer">{t.demo}</a>}
                    {p.code && <a href={p.code} className="dim" target="_blank" rel="noreferrer">{t.code}</a>}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 04 · SKILLS + SOBRE MÍ */}
      <section id="skills" className="band">
        <div className="wrap section two-col">
          <div className="panel">
            <div className="eyebrow">{t.skillsLabel}</div>
            <h2>Skills</h2>
            {SKILLS.map((g) => (
              <div className="skill-group" key={pick(g.group, 'es')}>
                <span className="skill-title">{pick(g.group, lang)}</span>
                <div className="tags big">{g.items.map((s) => <span key={s}>{s}</span>)}</div>
              </div>
            ))}
          </div>
          <div className="panel" id="sobre">
            <div className="eyebrow">{t.aboutLabel}</div>
            <h2>{t.aboutTitle}</h2>
            <p className="about">{t.aboutText}</p>
            <div className="facts">
              {t.facts.map(([k, v]) => (
                <div key={k}><span>{k}</span><strong>{v}</strong></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 05 · CONTACTO / CHAT */}
      <section id="contacto" className="wrap section">
        <div className="section-head">
          <div>
            <div className="eyebrow warm">{t.chatLabel}</div>
            <h2>{t.chatTitle}</h2>
          </div>
        </div>
        <div className="chat-row">
          <div className="chat-stage">
            <div className="halo" aria-hidden="true" />
            <Avatar3D
              className="chat-avatar"
              framing="full"
              waveSignal={chatWave}
              mood={chatTalking ? 'talk' : 'smile'}
              label={lang === 'es' ? 'Avatar de Valentín' : 'Valentín’s avatar'}
            />
          </div>
          <Chat t={t} lang={lang} onAnswer={onAnswer} />
        </div>
        <div className="direct">
          <span className="muted">{t.direct}</span>
          <a className="btn-warm" href={contactLinks.whatsapp} target="_blank" rel="noreferrer">
            <Icon d={ICONS.whatsapp} />WhatsApp
          </a>
          <a className="btn-ghost" href={contactLinks.email}>
            <Icon d={ICONS.email} />Email
          </a>
          <a className="btn-ghost" href={contactLinks.github} target="_blank" rel="noreferrer">
            <Icon d={ICONS.code} />GitHub
          </a>
          <a className="btn-ghost" href={contactLinks.linkedin} target="_blank" rel="noreferrer">
            <Icon d={ICONS.user} />LinkedIn
          </a>
        </div>
      </section>
    </main>
  )
}
