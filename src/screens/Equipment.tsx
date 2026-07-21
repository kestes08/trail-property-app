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
  const { equipment, dueEquipment, serviceEquipment, toolsDueCount } = useStore()
  const needsService = equipment.filter((e) => e.status !== 'good').length

  return (
    <div className="screen-pad">
      <header className="sub-header sub-header--flush">
        <div>
          <h1 className="head sub-header__title">Equipment Log</h1>
          <div className="sub-header__meta">
            {equipment.length} tools · {needsService} need service
          </div>
        </div>
      </header>

      {dueEquipment && (
        <SuggestionCard
          label="Maintenance Alert"
          body={`${dueEquipment.name} is at ${dueEquipment.hoursSinceService} h — past its ${dueEquipment.serviceIntervalHours} h service interval. Log service before the next mow.`}
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

      {equipment.length === 0 && <div className="mini-empty card">No equipment yet.</div>}

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
            </div>
          )
        })}
      </div>
    </div>
  )
}
