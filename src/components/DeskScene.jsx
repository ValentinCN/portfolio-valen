import { useEffect, useRef, useState } from 'react'
import { Avatar3D } from './Avatar3D'
import { Icon, ICONS, Txt } from './Header'
import { PROJECTS, SKILLS, contactLinks, projectName } from '../data'
import { discover } from '../secrets'

// Habitación isométrica: una imagen (public/desk/cuarto-*.webp, generada en Higgsfield) con zonas
// invisibles encima para tocar cada objeto. Al tocar uno, la cámara hace zoom sobre él
// y se abre su "pantalla": monitor → proyectos, pizarra → skills, celu → contacto, cuadro → sobre mí.
// En el celular no hay zoom: el contenido se abre como una tarjeta debajo del escritorio.
// Las coordenadas están en píxeles de la imagen a 1024 × 680.

const W = 1024
const H = 680
const HOTSPOTS = [
  { id: 'projects', left: '61%', top: '23%', warm: false, look: { x: 0.9, y: -0.3 }, box: [597, 158, 732, 294] },
  { id: 'skills', left: '40.5%', top: '11%', warm: false, look: { x: -0.2, y: -0.9 }, box: [333, 82, 492, 296] },
  { id: 'contact', left: '62%', top: '58%', warm: true, look: { x: 1, y: 0.2 }, box: [640, 314, 700, 350] },
  { id: 'about', left: '81.5%', top: '21%', warm: false, look: { x: 1, y: -0.4 }, box: [797, 150, 854, 254] },
]

// Contorno de cada objeto (se ilumina al pasar el mouse o al elegirlo)
const SHAPES = {
  skills: '333,140 492,82 492,240 333,296',
  projects: '597,160 732,205 732,292 597,248',
  about: '799,152 852,168 852,252 799,235',
  contact: '646,331 670,321 692,333 668,346',
}

const clamp = (v, a, b) => Math.min(b, Math.max(a, v))

// Transformación para que el objeto quede centrado y grande dentro del recuadro.
function zoomFor(box) {
  const [x1, y1, x2, y2] = box
  const w = (x2 - x1) / W
  const h = (y2 - y1) / H
  const s = clamp(Math.min(0.5 / w, 0.5 / h), 1.8, 3.2)
  const cx = (x1 + x2) / 2 / W
  const cy = (y1 + y2) / 2 / H
  const tx = clamp(0.5 - cx * s, 1 - s, 0)
  const ty = clamp(0.5 - cy * s, 1 - s, 0)
  return `translate(${tx * 100}%, ${ty * 100}%) scale(${s})`
}

function useIsMobile() {
  const q = '(max-width: 760px)'
  const [m, setM] = useState(() => typeof window !== 'undefined' && window.matchMedia(q).matches)
  useEffect(() => {
    const mq = window.matchMedia(q)
    const on = () => setM(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return m
}

export function DeskScene({ t, lang, active, setActive, waveSignal }) {
  const [focus, setFocus] = useState(null)
  const mobile = useIsMobile()
  // Secretos: la planta y el mate reaccionan cuando los tocás (id "taza", se mantiene por los secretos guardados).
  const [fx, setFx] = useState({})
  const fxTimers = useRef({})
  const secret = (id) => {
    discover(id)
    // La nota musical abre el canal de YouTube (si está cargado en data.js).
    if (id === 'musica' && contactLinks.youtube) window.open(contactLinks.youtube, '_blank', 'noopener')
    setFx((f) => ({ ...f, [id]: true }))
    clearTimeout(fxTimers.current[id])
    fxTimers.current[id] = setTimeout(() => setFx((f) => ({ ...f, [id]: false })), id === 'taza' ? 2600 : 1100)
  }
  const panelRef = useRef(null)
  const triggerRef = useRef(null)

  const current = focus || active
  const look = HOTSPOTS.find((h) => h.id === current)?.look
  const spot = HOTSPOTS.find((h) => h.id === focus)

  const open = (id, e) => {
    triggerRef.current = e?.currentTarget || null
    setFocus(id)
  }
  const close = () => {
    setFocus(null)
    // Devolvemos el foco al objeto que lo abrió.
    requestAnimationFrame(() => triggerRef.current?.focus?.())
  }

  // Esc para volver; el foco pasa al panel apenas se abre.
  useEffect(() => {
    if (!focus) return
    const onKey = (e) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    const id = setTimeout(() => panelRef.current?.focus(), mobile ? 0 : 380)
    return () => {
      window.removeEventListener('keydown', onKey)
      clearTimeout(id)
    }
  }, [focus, mobile])

  const panel = focus && (
    <DeskPanel
      key={focus}
      id={focus}
      t={t}
      lang={lang}
      inline={mobile}
      panelRef={panelRef}
      onClose={close}
    />
  )

  return (
    <div className={`desk-scene${focus ? ' is-zoomed' : ''}${mobile ? ' is-mobile' : ''}`}>
      <div className="desk-viewport">
        <div
          className="desk-stage"
          style={!mobile && spot ? { transform: zoomFor(spot.box) } : undefined}
          onClick={!mobile && focus ? close : undefined}
        >
          <DeskSvg on={(id) => current === id} onPick={mobile ? undefined : (id) => setFocus(id)} onSecret={secret} fx={fx} t={t} />

          <Avatar3D
            className="desk-avatar"
            hidden={Boolean(focus) && !mobile}
            framing="full"
            waveSignal={waveSignal}
            lookAt={look}
            mood={current ? 'talk' : 'smile'}
            label={t.deskLabel}
          />

          {!focus && (
            <div className="bubble desk-bubble" aria-live="polite">
              {t.desk[active || 'none']}
            </div>
          )}

          {HOTSPOTS.map((h) => (
            <button
              key={h.id}
              type="button"
              className={`hotspot${h.warm ? ' warm' : ''}${current === h.id ? ' on' : ''}`}
              style={{ left: h.left, top: h.top }}
              aria-expanded={focus === h.id}
              aria-controls="desk-panel"
              tabIndex={focus || mobile ? -1 : 0}
              onMouseEnter={() => setActive(h.id)}
              onFocus={() => setActive(h.id)}
              onMouseLeave={() => setActive(null)}
              onBlur={() => setActive(null)}
              onClick={(e) => {
                e.stopPropagation()
                open(h.id, e)
              }}
            >
              <span className="pulse" aria-hidden="true" />
              {t.hot[h.id]}
            </button>
          ))}
        </div>

        {/* En compu el panel se apoya sobre el objeto agrandado */}
        {!mobile && panel}
      </div>

      {/* En el celular: botones simples y el contenido como tarjeta */}
      <nav className="desk-links" aria-label={t.deskLabel}>
        {HOTSPOTS.map((h) => (
          <button
            key={h.id}
            type="button"
            className={`btn-ghost${focus === h.id ? ' on' : ''}`}
            aria-expanded={focus === h.id}
            aria-controls="desk-panel"
            onClick={(e) => (focus === h.id ? close() : open(h.id, e))}
          >
            {t.hot[h.id]}
          </button>
        ))}
      </nav>
      {mobile && panel}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  Lo que aparece dentro de cada objeto
// ─────────────────────────────────────────────────────────────
function DeskPanel({ id, t, lang, inline, panelRef, onClose }) {
  const z = t.zoom
  const label = t.hot[id]
  return (
    <div
      id="desk-panel"
      className={`desk-panel panel-${id}${inline ? ' inline' : ''}`}
      role="dialog"
      aria-label={label}
      tabIndex={-1}
      ref={panelRef}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="desk-panel-bar">
        <button type="button" className="desk-back" onClick={onClose}>{z.back}</button>
        {!inline && <span className="mono-label">{z.hint}</span>}
      </div>
      {id === 'projects' && <ScreenPanel t={t} lang={lang} />}
      {id === 'skills' && <BoardPanel t={t} lang={lang} />}
      {id === 'contact' && <PhonePanel t={t} />}
      {id === 'about' && <FramePanel t={t} />}
    </div>
  )
}

function ScreenPanel({ t, lang }) {
  const z = t.zoom
  return (
    <div className="screen">
      <div className="screen-top">
        <span className="dots" aria-hidden="true"><i /><i /><i /></span>
        <span className="screen-path">{z.screenPath}</span>
      </div>
      <ul className="screen-list">
        {PROJECTS.map((p, i) => (
          <li key={p.id}>
            <a href={`/proyectos/${p.id}`}>
              <span className="screen-num">{String(i + 1).padStart(2, '0')}</span>
              <span className="screen-main">
                <strong>{projectName(p, lang)}</strong>
                <span><Txt>{p.desc[lang]}</Txt></span>
              </span>
              <span className="screen-open">{z.open}</span>
            </a>
          </li>
        ))}
      </ul>
      <a className="screen-all" href="#proyectos">{z.all}</a>
    </div>
  )
}

const NOTE_COLORS = ['#F2B661', '#7CC4FF', '#7FD9A0', '#F29BC0']
function BoardPanel({ t, lang }) {
  const z = t.zoom
  return (
    <div className="board">
      <h3 className="board-title">{z.boardTitle}</h3>
      <div className="board-notes">
        {SKILLS.map((g, i) => (
          <div className="note" key={i} style={{ '--note': NOTE_COLORS[i % NOTE_COLORS.length], '--tilt': `${[-2, 1.5, -1][i % 3]}deg` }}>
            <span className="note-title">{typeof g.group === 'string' ? g.group : g.group[lang]}</span>
            <ul>{g.items.map((s) => <li key={s}>{s}</li>)}</ul>
          </div>
        ))}
      </div>
    </div>
  )
}

function PhonePanel({ t }) {
  const z = t.zoom
  const ext = (href) => (href.startsWith('http') ? { target: '_blank', rel: 'noreferrer' } : {})
  const rows = [
    { k: 'whatsapp', label: 'WhatsApp', icon: ICONS.whatsapp, warm: true },
    { k: 'email', label: 'Email', icon: ICONS.email },
    { k: 'github', label: 'GitHub', icon: ICONS.code },
    { k: 'linkedin', label: 'LinkedIn', icon: ICONS.user },
  ]
  return (
    <div className="phone">
      <div className="phone-notch" aria-hidden="true" />
      <div className="phone-head">
        <div className="chat-dot" aria-hidden="true">V</div>
        <div>
          <strong>{z.phoneTitle}</strong>
          <span>{z.phoneSub}</span>
        </div>
      </div>
      <div className="phone-list">
        {rows.map((r) => (
          <a key={r.k} className={`phone-row${r.warm ? ' warm' : ''}`} href={contactLinks[r.k]} {...ext(contactLinks[r.k])}>
            <Icon d={r.icon} />
            {r.label}
          </a>
        ))}
      </div>
    </div>
  )
}

function FramePanel({ t }) {
  const z = t.zoom
  return (
    <div className="frame">
      <div className="frame-inner">
        <div className="eyebrow">{t.aboutLabel}</div>
        <h3>{t.aboutTitle}</h3>
        <p>{t.aboutText}</p>
        <div className="facts">
          {t.facts.map(([k, v]) => (
            <div key={k}><span>{k}</span><strong>{v}</strong></div>
          ))}
        </div>
      </div>
      <div className="frame-plate">{z.frameCaption}</div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  La habitación: imagen + zonas para tocar. onPick permite tocar los objetos directamente.
// ─────────────────────────────────────────────────────────────
function DeskSvg({ on, onPick, onSecret, fx, t }) {
  const pick = (id) => ({
    className: `hit${id === 'contact' ? ' warm' : ''}${on(id) ? ' on' : ''}${onPick ? ' pickable' : ''}`,
    ...(onPick ? { onClick: (e) => { e.stopPropagation(); onPick(id) } } : {}),
  })
  const hidden = (id) => ({
    onClick: (e) => { e.stopPropagation(); onSecret(id) },
    className: `secret-obj${fx[id] ? ' is-active' : ''}`,
  })
  return (
    <div className="desk-art">
      <img
        className="desk-img"
        src="/desk/cuarto-1024.webp"
        srcSet="/desk/cuarto-1024.webp 1024w, /desk/cuarto-2048.webp 2048w"
        sizes="(max-width: 760px) 100vw, 1080px"
        width="2048"
        height="1360"
        alt=""
        decoding="async"
      />
      <svg viewBox={`0 0 ${W} ${H}`} className="desk-svg desk-hits" aria-hidden="true">
        {/* sombra suave bajo los pies del personaje, sobre la alfombra */}
        <ellipse cx="441" cy="553" rx="46" ry="11" fill="#05070b" opacity="0.45" />
        {Object.entries(SHAPES).map(([id, points]) => (
          <polygon key={id} points={points} {...pick(id)} />
        ))}
        {/* el celular titila para que se note */}
        <circle cx="696" cy="322" r="5" fill="#F2B661" className="phone-blink" />

        {/* nota musical (secreto): la dorada de la pared, entre el monitor y el cuadro */}
        <g {...hidden('musica')}>
          <title>{t.secrets.items.musica.name}</title>
          <rect x="746" y="160" width="42" height="50" fill="transparent" />
          <circle className="note-glow" cx="767" cy="185" r="20" />
        </g>
        {/* mate (secreto) */}
        <g {...hidden('taza')}>
          <title>{t.secrets.items.taza.name}</title>
          <rect x="794" y="276" width="46" height="72" fill="transparent" />
          <g className="steam">
            <path d="M810 294 q-4 -6 0 -12 t0 -12" />
            <path d="M817 291 q4 -6 0 -12 t0 -12" />
            <path d="M824 294 q-4 -6 0 -12 t0 -12" />
          </g>
        </g>
        {/* planta (secreto) */}
        <g {...hidden('planta')}>
          <title>{t.secrets.items.planta.name}</title>
          <rect x="144" y="330" width="132" height="160" fill="transparent" />
          <g className="drops" fill="#7CC4FF">
            <circle cx="190" cy="334" r="3.5" />
            <circle cx="210" cy="324" r="3.5" />
            <circle cx="230" cy="336" r="3.5" />
          </g>
        </g>
      </svg>
    </div>
  )
}
