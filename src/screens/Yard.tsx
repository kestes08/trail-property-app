import { useState } from 'react'
import { dueLabel, isSoon } from '../format'
import { useStore } from '../store'
import type { Task, YardZone } from '../types'

const zones: Array<'All' | YardZone> = ['All', 'Meadow', 'Garden', 'Drive']

function TaskRow({ task, onToggle }: { task: Task; onToggle: () => void }) {
  const meta = [task.zone, task.durationMin ? `${task.durationMin} min` : null]
    .filter(Boolean)
    .join(' · ')
  return (
    <div className={`task-row card ${task.done ? 'is-complete' : ''}`}>
      <button
        className={`checkbox ${task.done ? 'is-done' : ''}`}
        aria-label={task.done ? 'Mark not done' : 'Mark done'}
        onClick={onToggle}
      />
      <div className="task-row__body">
        <div className="task-row__title">{task.title}</div>
        <div className="task-row__sub">
          {meta}
          {task.loggedByAI && task.done ? ' · logged by Ranger' : ''}
        </div>
      </div>
      {!task.done && (
        <span className={`due-pill ${isSoon(task.dueDate) ? 'is-soon' : ''}`}>{dueLabel(task.dueDate)}</span>
      )}
    </div>
  )
}

export function Yard() {
  const { tasks, toggleTask } = useStore()
  const [zone, setZone] = useState<'All' | YardZone>('All')

  const yardTasks = tasks.filter((t) => t.module === 'yard')
  const filtered = zone === 'All' ? yardTasks : yardTasks.filter((t) => t.zone === zone)

  const open = filtered.filter((t) => !t.done)
  const thisWeek = open.filter((t) => isSoon(t.dueDate) || dueLabel(t.dueDate).endsWith('d'))
  const later = open.filter((t) => !thisWeek.includes(t))
  const completed = filtered.filter((t) => t.done)

  const dueThisWeek = yardTasks.filter((t) => !t.done && (isSoon(t.dueDate) || dueLabel(t.dueDate).endsWith('d'))).length
  const doneThisMonth = yardTasks.filter((t) => t.done).length

  return (
    <div className="screen-pad">
      <header className="sub-header sub-header--flush">
        <div>
          <h1 className="head sub-header__title">Yard Tasks</h1>
          <div className="sub-header__meta">Around the property</div>
        </div>
      </header>

      <div className="banner">
        <div>
          <div className="num banner__num">{dueThisWeek}</div>
          <div className="banner__cap">Due this week</div>
        </div>
        <div className="banner__divide" />
        <div>
          <div className="num banner__num">{doneThisMonth}</div>
          <div className="banner__cap">Done this month</div>
        </div>
      </div>

      <div className="chip-filter">
        {zones.map((z) => (
          <button
            key={z}
            className={`filter-chip ${zone === z ? 'is-active' : ''}`}
            onClick={() => setZone(z)}
          >
            {z}
          </button>
        ))}
      </div>

      {yardTasks.length === 0 && (
        <div className="mini-empty card" style={{ marginTop: 16 }}>
          No yard tasks yet.
        </div>
      )}

      {thisWeek.length > 0 && (
        <>
          <div className="section-head">
            <span className="label">This week</span>
          </div>
          <div className="task-list">
            {thisWeek.map((t) => (
              <TaskRow key={t.id} task={t} onToggle={() => toggleTask(t.id)} />
            ))}
          </div>
        </>
      )}

      {later.length > 0 && (
        <>
          <div className="section-head">
            <span className="label">Later</span>
          </div>
          <div className="task-list">
            {later.map((t) => (
              <TaskRow key={t.id} task={t} onToggle={() => toggleTask(t.id)} />
            ))}
          </div>
        </>
      )}

      {completed.length > 0 && (
        <>
          <div className="section-head">
            <span className="label">Completed</span>
          </div>
          <div className="task-list">
            {completed.map((t) => (
              <TaskRow key={t.id} task={t} onToggle={() => toggleTask(t.id)} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
