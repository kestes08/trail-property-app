import { useEffect, useRef } from 'react'
import { useStore } from '../store'
import type { ChatMessage } from '../types'

function RecordCard({ msg }: { msg: ChatMessage }) {
  if (!msg.recordUpdate?.length) return null
  return (
    <div className="record-card">
      <div className="record-card__head">✓ Record updated</div>
      <div className="record-card__rows">
        {msg.recordUpdate.map((r, i) => (
          <div className="record-card__row" key={i}>
            <span className="record-card__field">{r.field}</span>
            <span className="record-card__vals">
              <span className="record-card__from">{r.from}</span>
              <span className="record-card__arrow">→</span>
              <span className="record-card__to">{r.to}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function Ranger() {
  const { chat, submitPrompt, closeRanger } = useStore()
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [chat.length])

  return (
    <div className="ranger">
      <header className="ranger__header">
        <button className="ranger__back" aria-label="Back" onClick={closeRanger}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
            <path d="M12 4 6 10l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="ranger__avatar">
          <span className="livedot" />
        </div>
        <div>
          <div className="head ranger__name">Ranger</div>
          <div className="ranger__sub">Your property assistant</div>
        </div>
      </header>

      <div className="ranger__thread">
        <div className="date-divider">
          <span>Today</span>
        </div>

        {chat.map((m) => (
          <div key={m.id} className={`bubble-wrap ${m.role === 'user' ? 'is-user' : 'is-ai'}`}>
            <div className={`bubble ${m.role === 'user' ? 'bubble--user' : 'bubble--ai'}`}>
              {m.text}
            </div>
            {m.role === 'ai' && <RecordCard msg={m} />}
            {m.role === 'ai' && m.chips && (
              <div className="chips">
                {m.chips.map((c) => (
                  <button key={c} className="chip" onClick={() => submitPrompt(c)}>
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  )
}
