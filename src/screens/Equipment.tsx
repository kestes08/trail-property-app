import { useState } from 'react'
import { SuggestionCard } from '../components/SuggestionCard'
import { useStore } from '../store'
import type { Equipment as EquipmentItem } from '../types'

const statusMeta: Record<EquipmentItem['status'], { label: string; cls: string }> = {
  due: { label: 'Due', cls: 'is-due' },
  watch: { label: 'Watch', cls: 'is-watch' },
  good: { label: 'Good', cls: 'is-good' },
}

function subtext(e: EquipmentItem): string {
  if (e.status === 'due') return `${e.hoursSinceService} h since service · past interval`
  if (e.status === 'watch') return `${e.hoursSinceService} of ${e.serviceIntervalHours} h`
  return `Serviced · ${e.hoursSinceService} h in`
}

export function Equipment() {
  const { equipment, dueEquipment, serviceEquipment, toolsDueCount, addEquipment, deleteEquipment } = useStore()
  const needsService = equipment.filter((e) => e.status !== 'good').length

  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [hours, setHours] = useState('')
  const [interval, setInterval] = useState('50')

  function submit() {
    if (!name.trim()) return
    addEquipment({
      name,
      hoursSinceService: hours ? Number(hours) : 0,
      serviceIntervalHours: interval ? Number(interval) : 50,
    })
    setName('')
    setHours('')
    setInterval('50')
    setAdding(false)
  }

  return (
    <div className="screen-pad">
      <header className="sub-header sub-header--flush">
        <div>
          <h1 className="head sub-header__title">Equipment Log</h1>
          <div className="sub-header__meta">
            {equipment.length} tools · {needsService} need service
          </div>
        </div>
        <button className="add-btn" aria-label="Add equipment" onClick={() => setAdding((v) => !v)}>
          {adding ? '×' : '+'}
        </button>
      </header>

      {adding && (
        <div className="draw__panel addform">
          <input className="draw__input" value={name} placeholder="Tool (e.g. Zero-turn Mower)" onChange={(e) => setName(e.target.value)} />
          <div className="addform__row">
            <label className="addform__field">
              <span className="field-label">Hours since service</span>
              <input className="draw__input" type="number" inputMode="numeric" value={hours} placeholder="0" onChange={(e) => setHours(e.target.value)} />
            </label>
            <label className="addform__field">
              <span className="field-label">Service every (h)</span>
              <input className="draw__input" type="number" inputMode="numeric" value={interval} onChange={(e) => setInterval(e.target.value)} />
            </label>
          </div>
          <div className="draw__actions">
            <button className="btn btn--ghost" onClick={() => setAdding(false)}>
              Cancel
            </button>
            <button className="btn btn--filled" onClick={submit} disabled={!name.trim()}>
              Add tool
            </button>
          </div>
        </div>
      )}

      {dueEquipment && (
        <SuggestionCard
          label="Maintenance Alert"
          body={`${dueEquipment.name} is at ${dueEquipment.hoursSinceService} h — past its ${dueEquipment.serviceIntervalHours} h service interval. Log service before the next use.`}
          primaryLabel="Log service"
          secondaryLabel="Snooze"
          onPrimary={() => serviceEquipment(dueEquipment.id)}
          onSecondary={() => {}}
        />
      )}

      <div className="section-head">
        <span className="label">Gear</span>
        <span className="label" style={{ color: 'var(--ink-softer)' }}>
          {toolsDueCount} due
        </span>
      </div>

      {equipment.length === 0 && <div className="mini-empty card">No equipment yet. Tap + to add a tool.</div>}

      <div className="gear-list">
        {equipment.map((e, i) => {
          const meta = statusMeta[e.status]
          return (
            <div className="gear-row card" key={e.id}>
              <div
                className="gear-row__icon"
                style={{ background: i % 2 === 0 ? 'var(--tan)' : 'var(--olive)', color: i % 2 === 0 ? 'var(--ink)' : '#fff' }}
              >
                {e.initials}
              </div>
              <div className="gear-row__body">
                <div className="gear-row__name">{e.name}</div>
                <div className="gear-row__sub">{subtext(e)}</div>
              </div>
              <span className={`status-pill ${meta.cls}`}>{meta.label}</span>
              <button className="row-del" aria-label="Delete tool" onClick={() => deleteEquipment(e.id)}>
                ×
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
