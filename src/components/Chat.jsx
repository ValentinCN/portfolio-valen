import { useEffect, useRef, useState } from 'react'
import { QA, contactLinks } from '../data'
import { Face } from './Header'

// Chat guionado: el visitante elige una pregunta y "Valen" responde. No usa ninguna API.
export function Chat({ t, lang, onAnswer }) {
  const [log, setLog] = useState([{ kind: 'greet' }])
  const [typing, setTyping] = useState(false)
  const listRef = useRef(null)
  const timer = useRef(null)
  const qs = QA[lang]
  const byId = Object.fromEntries(qs.map((q) => [q.id, q]))

  useEffect(() => () => clearTimeout(timer.current), [])
  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [log, typing])

  const ask = (id) => {
    if (typing) return
    setLog((l) => [...l, { kind: 'q', id }])
    setTyping(true)
    timer.current = setTimeout(() => {
      setLog((l) => [...l, { kind: 'a', id }])
      setTyping(false)
      onAnswer?.()
    }, 850)
  }

  const reset = () => {
    clearTimeout(timer.current)
    setTyping(false)
    setLog([{ kind: 'greet' }])
  }

  const asked = new Set(log.filter((m) => m.kind === 'q').map((m) => m.id))
  const hrefFor = (h) => (h === 'whatsapp' ? contactLinks.whatsapp : h)

  return (
    <div className="chat">
      <div className="chat-head">
        <Face talking={typing} />
        <div className="chat-who">
          <div className="chat-name">{t.chatName}</div>
          <div className="chat-status"><span className="online" aria-hidden="true" /><span className="status-text">{t.chatStatus}</span></div>
        </div>
        <button type="button" className="btn-ghost small" onClick={reset}>{t.reset}</button>
      </div>

      <div className="chat-list" ref={listRef} aria-live="polite">
        {log.map((m, i) => {
          if (m.kind === 'greet') return <Bot key={i} text={t.greet} />
          const q = byId[m.id]
          if (m.kind === 'q') return <div key={i} className="msg-user">{q.q}</div>
          return <Bot key={i} text={q.a} cta={q.cta} href={q.cta ? hrefFor(q.href) : null} />
        })}
        {typing && (
          <div className="msg-bot">
            <Face small />
            <div className="bot-bubble typing">
              <span className="d1" /><span className="d2" /><span className="d3" />
              <span className="typing-label">{t.typing}</span>
            </div>
          </div>
        )}
      </div>

      <div className="chat-foot">
        <div className="mono-label">{t.pick}</div>
        <div className="chips">
          {qs.map((q) => (
            <button key={q.id} type="button" className={`chip${asked.has(q.id) ? ' asked' : ''}`} onClick={() => ask(q.id)}>
              {q.q}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function Bot({ text, cta, href }) {
  const external = href && href.startsWith('http')
  return (
    <div className="msg-bot">
      <Face small />
      <div className="bot-bubble">
        <span>{text}</span>
        {cta && (
          <a className="bot-cta" href={href} {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}>
            {cta} →
          </a>
        )}
      </div>
    </div>
  )
}
