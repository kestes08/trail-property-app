import { useState } from 'react'
import { dueLabel, isSoon } from '../format'
import { useStore } from '../store'
import type { Task, YardZone } from '../types'

const zones: Array<'All' | YardZone> = ['All', 'Meadow', 'Garden', 'Drive']
const addZones: YardZone[] = ['Meadow', 'Garden', 'Drive']

function todayISO(): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString().slice(0, 10)
}

function TaskRow({ task, onToggle, onDelete }: { task: Task; onToggle: () => void; onDelete: () => void }) {
  const meta = [task.zone, task.durationMin ? `${task.durationMin} min` : null].filter(Boolean).join(' · ')
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
      <button className="row-del" aria-label="Delete task" onClick={onDelete}>
        ×
      </button>
    </div>
  )
}

export function Yard() {
  const { tasks, toggleTask, addTask, deleteTask } = useStore()
  const [zone, setZone] = useState<'All' | YardZone>('All')
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [newZone, setNewZone] = useState<YardZone | undefined>(undefined)
  const [due, setDue] = useState(todayISO())
  const [duration, setDuration] = useState('')

  const yardTasks = tasks.filter((t) => t.module === 'yard')
  const filtered = zone === 'All' ? yardTasks : yardTasks.filter((t) => t.zone === zone)

  const open = filtered.filter((t) => !t.done)
  const thisWeek = open.filter((t) => isSoon(t.dueDate) || dueLabel(t.dueDate).endsWith('d'))
  const later = open.filter((t) => !thisWeek.includes(t))
  const completed = filtered.filter((t) => t.done)

  const dueThisWeek = yardTasks.filter((t) => !t.done && (isSoon(t.dueDate) || dueLabel(t.dueDate).endsWith('d'))).length
  const doneThisMonth = yardTasks.filter((t) => t.done).length

  function submit() {
    if (!title.trim()) return
    addTask({
      title,
      zone: newZone,
      dueDate: due || todayISO(),
      durationMin: duration ? Number(duration) : undefined,
    })
    setTitle('')
    setNewZone(undefined)
    setDue(todayISO())
    setDuration('')
    setAdding(false)
  }

  return (
    <div className="screen-pad">
      <header className="sub-header sub-header--flush">
        <div>
          <h1 className="head sub-header__title">Yard Tasks</h1>
          <div className="sub-header__meta">Around the property</div>
        </div>
        <button className="add-btn" aria-label="Add task" onClick={() => setAdding((v) => !v)}>
          {adding ? '×' : '+'}
        </button>
      </header>

      {adding && (
        <div className="draw__panel addform">
          <input className="draw__input" value={title} placeholder="Task (e.g. Mow the meadow)" onChange={(e) => setTitle(e.target.value)} />
          <div className="field-label">Zone</div>
          <div className="chip-filter" style={{ marginTop: 0 }}>
            <button className={`filter-chip ${newZone === undefined ? 'is-active' : ''}`} onClick={() => setNewZone(undefined)}>
              None
            </button>
            {addZones.map((z) => (
              <button key={z} className={`filter-chip ${newZone === z ? 'is-active' : ''}`} onClick={() => setNewZone(z)}>
                {z}
              </button>
            ))}
          </div>
          <div className="addform__row">
            <label className="addform__field">
              <span className="field-label">Due</span>
              <input className="draw__input" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
            </label>
            <label className="addform__field">
              <span className="field-label">Minutes</span>
              <input className="draw__input" type="number" inputMode="numeric" value={duration} placeholder="—" onChange={(e) => setDuration(e.target.value)} />
            </label>
          </div>
          <div className="draw__actions">
            <button className="btn btn--ghost" onClick={() => setAdding(false)}>
              Cancel
            </button>
            <button className="btn btn--filled" onClick={submit} disabled={!title.trim()}>
              Add task
            </button>
          </div>
        </div>
      )}

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
          <button key={z} className={`filter-chip ${zone === z ? 'is-active' : ''}`} onClick={() => setZone(z)}>
            {z}
          </button>
        ))}
      </div>

      {yardTasks.length === 0 && <div className="mini-empty card" style={{ marginTop: 16 }}>No yard tasks yet. Tap + to add one.</div>}

      {thisWeek.length > 0 && (
        <>
          <div className="section-head">
            <span className="label">This week</span>
          </div>
          <div className="task-list">
            {thisWeek.map((t) => (
              <TaskRow key={t.id} task={t} onToggle={() => toggleTask(t.id)} onDelete={() => deleteTask(t.id)} />
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
              <TaskRow key={t.id} task={t} onToggle={() => toggleTask(t.id)} onDelete={() => deleteTask(t.id)} />
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
              <TaskRow key={t.id} task={t} onToggle={() => toggleTask(t.id)} onDelete={() => deleteTask(t.id)} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
