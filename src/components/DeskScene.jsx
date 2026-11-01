import { useEffect, useRef, useState } from 'react'
import { Avatar3D } from './Avatar3D'
import { Icon, ICONS, Txt } from './Header'
import { PROJECTS, SKILLS, contactLinks, projectName } from '../data'
import { discover } from '../secrets'

// Habitación isométrica en SVG. Al tocar un objeto, la cámara hace zoom sobre él
// y se abre su "pantalla": monitor → proyectos, pizarra → skills, celu → contacto, cuadro → sobre mí.
// En el celular no hay zoom: el contenido se abre como una tarjeta debajo del escritorio.

const W = 900
const H = 640
const HOTSPOTS = [
  { id: 'projects', left: '65%', top: '22%', warm: false, look: { x: 0.9, y: -0.3 }, box: [525, 146, 647, 302] },
  { id: 'skills', left: '36.6%', top: '11%', warm: false, look: { x: -0.7, y: -0.9 }, box: [259, 80, 398, 262] },
  { id: 'contact', left: '73%', top: '48%', warm: true, look: { x: 1, y: 0.2 }, box: [606, 310, 648, 346] },
  { id: 'about', left: '81.2%', top: '34%', warm: false, look: { x: 1, y: -0.4 }, box: [705, 226, 758, 320] },
]

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
  // Secretos: la planta y la taza reaccionan cuando las tocás.
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
//  La habitación (SVG). onPick permite tocar los objetos directamente.
// ─────────────────────────────────────────────────────────────
function DeskSvg({ on, onPick, onSecret, fx, t }) {
  const pick = (id) => (onPick ? { onClick: (e) => { e.stopPropagation(); onPick(id) }, className: 'pickable' } : {})
  const hidden = (id) => ({
    onClick: (e) => { e.stopPropagation(); onSecret(id) },
    className: `secret-obj${fx[id] ? ' is-active' : ''}`,
  })
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="desk-svg" aria-hidden="true">
      <defs>
        <linearGradient id="scr" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#A9DCFF" />
          <stop offset="1" stopColor="#3E8FD6" />
        </linearGradient>
        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#7CC4FF" stopOpacity="0.28" />
          <stop offset="1" stopColor="#7CC4FF" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* paredes y piso */}
      <polygon points="450,260 138,440 138,200 450,20" fill="#1B2130" />
      <polygon points="450,260 762,440 762,200 450,20" fill="#232A39" />
      <polygon points="450,260 762,440 450,620 138,440" fill="#2B3242" />
      <polygon points="138,440 450,620 450,636 138,456" fill="#1A1F2A" />
      <polygon points="450,620 762,440 762,456 450,636" fill="#141922" />
      <polyline points="138,440 450,260 762,440" fill="none" stroke="#3A4356" strokeWidth="3" />
      <line x1="450" y1="20" x2="450" y2="260" stroke="#151A24" strokeWidth="2" />
      <polygon points="406.7,375 545.3,455 406.7,535 268.1,455" fill="#313B50" />
      <polygon points="406.7,389 521,455 406.7,521 292.4,455" fill="none" stroke="#45526E" strokeWidth="2" />
      <ellipse cx="560" cy="250" rx="170" ry="110" fill="url(#glow)" />
      {/* ventana */}
      <polygon points="250.8,285 172.9,330 172.9,220 250.8,175" fill="#1E3B5A" stroke="#3A4356" strokeWidth="5" />
      <circle cx="225" cy="214" r="9" fill="#F2E6C9" />
      <circle cx="190" cy="255" r="1.8" fill="#F2E6C9" />
      <circle cx="236" cy="252" r="1.5" fill="#F2E6C9" />
      <circle cx="200" cy="225" r="1.5" fill="#F2E6C9" />
      <line x1="211.9" y1="307.5" x2="211.9" y2="197.5" stroke="#3A4356" strokeWidth="3" />
      <line x1="250.8" y1="230" x2="172.9" y2="275" stroke="#3A4356" strokeWidth="3" />
      {/* pizarra */}
      <g {...pick('skills')}>
        <polygon points="398,180 259.5,260 259.5,160 398,80" fill="#E9EEF5" stroke={on('skills') ? '#7CC4FF' : '#5A6478'} strokeWidth="5" />
        <polygon points="380.7,140 354.7,155 354.7,125 380.7,110" fill="#F2B661" />
        <polygon points="341.75,157.5 315.8,172.5 315.8,142.5 341.75,127.5" fill="#7CC4FF" />
        <polygon points="302.8,187 276.8,202 276.8,172 302.8,157" fill="#7FD9A0" />
        <polygon points="367.7,187.5 341.75,202.5 341.75,172.5 367.7,157.5" fill="#F29BC0" />
        <polygon points="320.1,213 294.1,228 294.1,198 320.1,183" fill="#F2B661" />
        <line x1="398" y1="182" x2="259.5" y2="262" stroke="#8892A6" strokeWidth="4" strokeLinecap="round" />
      </g>
      {/* nota musical (secreto): flota en la pared, entre el monitor y el cuadro */}
      <g {...hidden('musica')} transform="translate(158 117) scale(0.82)">
        <title>{t.secrets.items.musica.name}</title>
        <rect x="586" y="40" width="64" height="74" fill="transparent" />
        <g className="music-note">
          <ellipse cx="604" cy="96" rx="8" ry="6" fill="#F2B661" transform="rotate(-20 604 96)" />
          <ellipse cx="630" cy="88" rx="8" ry="6" fill="#F2B661" transform="rotate(-20 630 88)" />
          <path d="M611 95 V62 L637 54 V87" fill="none" stroke="#F2B661" strokeWidth="4" strokeLinejoin="round" />
          <path d="M611 66 L637 58" stroke="#F2B661" strokeWidth="6" />
        </g>
      </g>
      {/* estante */}
      <polygon points="484.6,80 579.9,135 562.6,145 467.3,90" fill="#8A6650" />
      <polygon points="467.3,90 562.6,145 562.6,151 467.3,96" fill="#5A4030" />
      <polygon points="484.6,90 493.3,95 493.3,65 484.6,60" fill="#5BA8E8" />
      <polygon points="495,96 503.9,101 503.9,77 495,72" fill="#F2B661" />
      <polygon points="505.6,102 514.3,107 514.3,79 505.6,74" fill="#5FCB8A" />
      {/* cuadro */}
      <g {...pick('about')}>
        <polygon points="709.8,290 753.1,315 753.1,255 709.8,230" fill="#C9A27E" stroke={on('about') ? '#7CC4FF' : '#8A6650'} strokeWidth="5" />
        <polygon points="715,287 747.9,306 747.9,258 715,239" fill="#2D6FB0" />
        <circle cx="731.5" cy="266" r="8" fill="#DDA47C" />
        <path d="M720 292 Q731.5 274 743 299" fill="#A9DCFF" />
      </g>
      {/* escritorio */}
      <polygon points="502,215 692.5,325 614.5,370 424,260" fill="#8A6650" />
      <polygon points="424,260 614.5,370 614.5,445 424,335" fill="#5A4030" />
      <polygon points="614.5,370 692.5,325 692.5,400 614.5,445" fill="#47321F" />
      <line x1="424" y1="268" x2="614.5" y2="378" stroke="#4A3427" strokeWidth="2" />
      {/* monitor */}
      <g {...pick('projects')}>
        <polygon points="534,146.5 646.6,211.5 637.9,216.5 525.3,151.5" fill="#1A202B" />
        <polygon points="637.9,301.5 646.6,296.5 646.6,211.5 637.9,216.5" fill="#0A0D13" />
        <polygon points="525.3,236.5 637.9,301.5 637.9,216.5 525.3,151.5" fill="#11151D" stroke={on('projects') ? '#7CC4FF' : '#11151D'} strokeWidth="5" />
        <polygon points="530.4,233.5 630.9,291.5 630.9,220.5 530.4,162.5" fill="url(#scr)" />
        <g transform="matrix(0.866 0.5 0 1 0 0)">
          <rect x="620.6" y="-132.8" width="58" height="5" rx="2.5" fill="#0D1F33" opacity="0.55" />
          <rect x="630.6" y="-120.8" width="78" height="5" rx="2.5" fill="#0D1F33" opacity="0.45" />
          <rect x="630.6" y="-108.8" width="48" height="5" rx="2.5" fill="#0D1F33" opacity="0.45" />
          <rect x="620.6" y="-96.8" width="66" height="5" rx="2.5" fill="#0D1F33" opacity="0.55" />
          <text x="690" y="-82" fontFamily="JetBrains Mono, monospace" fontSize="20" fontWeight="500" fill="#0D1F33">&lt;/&gt;</text>
        </g>
        <line x1="581.6" y1="269" x2="574" y2="284" stroke="#11151D" strokeWidth="8" strokeLinecap="round" />
        <ellipse cx="572" cy="287" rx="22" ry="7" fill="#11151D" />
      </g>
      {/* teclado y taza */}
      <polygon points="514.95,266.5 592.9,311.5 571.2,324 493.3,279" fill="#2A3140" />
      <polygon points="519,270 588,309.8 571.2,319.5 502,279.7" fill="none" stroke="#3E485C" strokeWidth="1.5" />
      <g {...hidden('taza')}>
        <title>{t.secrets.items.taza.name}</title>
        <rect x="438" y="196" width="42" height="60" fill="transparent" />
        <rect x="450" y="232" width="18" height="18" rx="3" fill="#E0679A" />
        <ellipse cx="459" cy="232" rx="9" ry="4" fill="#F29BC0" />
        <path d="M468 237 q7 0 7 6 t-7 6" fill="none" stroke="#E0679A" strokeWidth="2.5" />
        <g className="steam">
          <path d="M454 226 q-4 -6 0 -12 t0 -12" />
          <path d="M460 226 q4 -6 0 -12 t0 -12" />
          <path d="M465 226 q-4 -6 0 -12 t0 -12" />
        </g>
      </g>
      {/* celular */}
      <g {...pick('contact')}>
        <polygon points="623.2,324 642.2,335 629.3,342.5 610.2,331.5" fill="#11151D" stroke={on('contact') ? '#F2B661' : '#11151D'} strokeWidth="4" />
        <polygon points="623.5,327 637,334.8 628.8,339.6 615.3,331.8" fill="#F2B661" />
        <circle cx="644" cy="318" r="5" fill="#F2B661" className="phone-blink" />
      </g>
      {/* planta */}
      <g {...hidden('planta')}>
        <title>{t.secrets.items.planta.name}</title>
        <rect x="180" y="400" width="70" height="112" fill="transparent" />
        <polygon points="196,470 234,470 228,506 202,506" fill="#C98A3E" />
        <ellipse cx="215" cy="470" rx="19" ry="5" fill="#8A5A26" />
        <g className="leaves">
          <ellipse cx="203" cy="448" rx="9" ry="22" fill="#4FAF76" transform="rotate(-24 203 448)" />
          <ellipse cx="226" cy="446" rx="9" ry="24" fill="#5FCB8A" transform="rotate(20 226 446)" />
          <ellipse cx="215" cy="438" rx="8" ry="26" fill="#3F9A65" />
        </g>
        <g className="drops" fill="#7CC4FF">
          <circle cx="205" cy="400" r="3" />
          <circle cx="218" cy="392" r="3" />
          <circle cx="229" cy="402" r="3" />
        </g>
      </g>
    </svg>
  )
}
