import { useStore } from '../store'

export function Stats() {
  const {
    segments,
    tasks,
    equipment,
    overallPercent,
    feetComplete,
    feetTotal,
    openTaskCount,
    toolsDueCount,
  } = useStore()

  const doneSegments = segments.filter((s) => s.status === 'done').length
  const activeSegments = segments.filter((s) => s.status === 'in_progress').length
  const tasksDone = tasks.filter((t) => t.done).length
  const aiLogged = tasks.filter((t) => t.loggedByAI).length

  const tiles = [
    { big: `${overallPercent}%`, cap: 'Trail complete', bg: 'var(--forest)', fg: 'var(--cream)' },
    { big: `${feetComplete.toLocaleString()}`, cap: `of ${feetTotal.toLocaleString()} ft built`, bg: 'var(--olive)', fg: '#fff' },
    { big: `${openTaskCount}`, cap: 'Open tasks', bg: 'var(--tan)', fg: 'var(--ink)' },
    { big: `${tasksDone}`, cap: 'Tasks done', bg: 'var(--white)', fg: 'var(--ink)' },
    { big: `${equipment.length}`, cap: 'Tools tracked', bg: 'var(--white)', fg: 'var(--ink)' },
    { big: `${toolsDueCount}`, cap: 'Tools due service', bg: 'var(--white)', fg: 'var(--ink)' },
  ]

  return (
    <div className="screen-pad">
      <header className="sub-header sub-header--flush">
        <div>
          <h1 className="head sub-header__title">Stats</h1>
        </div>
      </header>

      <div className="stats-grid">
        {tiles.map((t) => (
          <div
            className="stats-tile"
            key={t.cap}
            style={{ background: t.bg, color: t.fg, border: t.bg === 'var(--white)' ? '1px solid var(--hairline)' : 'none' }}
          >
            <div className="num stats-tile__big">{t.big}</div>
            <div className="stats-tile__cap">{t.cap}</div>
          </div>
        ))}
      </div>

      <div className="section-head">
        <span className="label">Trail breakdown</span>
      </div>
      <div className="card stats-panel">
        <div className="stats-line">
          <span>Segments complete</span>
          <span className="num">{doneSegments}</span>
        </div>
        <div className="stats-line">
          <span>In progress</span>
          <span className="num">{activeSegments}</span>
        </div>
        <div className="stats-line">
          <span>Logged by Ranger</span>
          <span className="num">{aiLogged}</span>
        </div>
      </div>
    </div>
  )
}
