import { useEffect, useRef, useState } from 'react'
import { Avatar3D } from './Avatar3D'
import { PLANS, PLAN_EXTRAS, planPrice, planWhatsApp } from '../data'

const GUIDE_LOOK = { x: 0.9, y: 0.1 }

// Los tickets se imprimen una sola vez por visita (aunque vuelvas desde un caso de estudio).
const printedIds = new Set()

const skipPrint = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches || typeof IntersectionObserver === 'undefined'

// Cada ticket se imprime la primera vez que entra en pantalla. Devuelve { id: orden }:
// los que entran juntos (una fila en la compu) salen uno tras otro según ese orden.
// Los que ya se imprimieron antes (o con "reducir movimiento") quedan en 'done', sin animación.
function usePrintOnView(ref) {
  const [order, setOrder] = useState(() =>
    Object.fromEntries(PLANS.filter((x) => skipPrint() || printedIds.has(x.id)).map((x) => [x.id, 'done']))
  )
  useEffect(() => {
    const items = [...(ref.current?.querySelectorAll('[data-plan]') ?? [])].filter((el) => !printedIds.has(el.dataset.plan))
    if (!items.length || skipPrint()) return
    const io = new IntersectionObserver(
      (entries) => {
        const fresh = entries.filter((e) => e.isIntersecting).map((e) => e.target)
        if (!fresh.length) return
        fresh.forEach((el) => {
          printedIds.add(el.dataset.plan)
          io.unobserve(el)
        })
        setOrder((o) => ({ ...o, ...Object.fromEntries(fresh.map((el, k) => [el.dataset.plan, k])) }))
      },
      { threshold: 0.2 }
    )
    items.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [ref])
  return order
}

// Sección "Planes": cada plan es un ticket de impresora térmica que sale de su ranura.
export function Plans({ t, lang }) {
  const p = t.plans
  const gridRef = useRef(null)
  const order = usePrintOnView(gridRef)
  const [hovered, setHovered] = useState(null)
  const guidePlan = PLANS.find((x) => x.id === hovered)

  return (
    <section id="planes" className="band">
      <div className="wrap section">
        <div className="section-head">
          <div>
            <div className="eyebrow">{p.label}</div>
            <h2>{p.title}</h2>
          </div>
          <p className="muted">{p.sub}</p>
        </div>

        <div className="plan-row">
          {/* Guía compacto, como el de Proyectos (en el celular no aparece) */}
          <aside className="guide plan-guide">
            <div className="bubble guide-bubble" aria-live="polite">
              {guidePlan ? guidePlan.say[lang] : p.idle}
            </div>
            <Avatar3D
              className="guide-avatar"
              framing="bust"
              mood={guidePlan ? 'talk' : 'smile'}
              lookAt={guidePlan ? GUIDE_LOOK : undefined}
              label={lang === 'es' ? 'Avatar guía' : 'Guide avatar'}
            />
          </aside>

          <div className="plan-grid" ref={gridRef}>
            {PLANS.map((plan, i) => (
              <Ticket key={plan.id} plan={plan} n={i} order={order[plan.id]} t={p} lang={lang} onHover={setHovered} />
            ))}
          </div>
        </div>

        <div className="plan-extras">
          <span className="mono-label">{p.extras}</span>
          <ul>
            {PLAN_EXTRAS.map((x) => (
              <li key={x.id}>
                <span>{x.name[lang]}</span>
                <strong>
                  {x.monthly && `${p.from} `}{planPrice(x, lang)}{x.monthly && ` ${p.perMonth}`}
                </strong>
              </li>
            ))}
          </ul>
          <p className="plan-fine">{p.fine}</p>
        </div>
      </div>
    </section>
  )
}

function Ticket({ plan, n, order, t, lang, onHover }) {
  const name = plan.name[lang]
  // Cada renglón lleva su número (--j) para aparecer de a uno.
  let j = 0
  const line = () => ({ '--j': j++ })

  return (
    <div
      className="plan-item"
      data-plan={plan.id}
      data-printed={order === undefined ? 'no' : order === 'done' ? 'done' : 'yes'}
      style={{ '--i': typeof order === 'number' ? order : 0 }}
      onMouseEnter={() => onHover(plan.id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(plan.id)}
    >
      <div className="plan-slot" aria-hidden="true" />
      {/* post-it pegado a la impresora, que lleva al caso de estudio */}
      {plan.note && (
        <a href={plan.note.href} className="plan-note" style={{ '--note': plan.note.color }}>
          {plan.note.label[lang]}
        </a>
      )}
      <article className="plan-ticket" aria-labelledby={`plan-${plan.id}`}>
        <div style={line()} className="plan-line plan-shop" aria-hidden="true">{t.shop}</div>
        <div style={line()} className="plan-line plan-meta" aria-hidden="true">
          <span>{t.ticket} {String(n + 1).padStart(4, '0')}</span>
          <span>{t.date}</span>
        </div>
        <hr className="plan-cut" />
        <h3 style={line()} className="plan-line plan-name" id={`plan-${plan.id}`}>{name}</h3>
        <p style={line()} className="plan-line plan-for">{plan.for[lang]}</p>
        <hr className="plan-cut" />
        <ul className="plan-items">
          {plan.items[lang].map((item, k) => (
            <li key={k} className="plan-line" style={line()}>{item}</li>
          ))}
        </ul>
        <hr className="plan-cut" />
        <div style={line()} className="plan-line plan-total">
          <span>{t.total}</span>
          <span className="plan-price">
            <small>{t.from}</small> <strong>{planPrice(plan, lang)}</strong>
          </span>
        </div>
        {plan.plus && <p style={line()} className="plan-line plan-plus">{plan.plus[lang]}</p>}
        <a
          style={line()}
          className="plan-line plan-buy"
          href={planWhatsApp(plan, lang)}
          target="_blank"
          rel="noreferrer"
          aria-label={t.buyLabel(name)}
        >
          {t.buy}
        </a>
        <div style={line()} className="plan-line plan-thanks" aria-hidden="true">{t.thanks}</div>
      </article>
    </div>
  )
}
