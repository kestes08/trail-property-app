import type {
  Equipment,
  RecordUpdate,
  Task,
  TrailSegment,
  WeatherSnapshot,
} from './types'

export type Intent =
  | 'log-progress'
  | 'log-task-complete'
  | 'log-maintenance'
  | 'question'

export interface AIState {
  segments: TrailSegment[]
  tasks: Task[]
  equipment: Equipment[]
  weather: WeatherSnapshot
}

export interface AIResult {
  intent: Intent
  reply: string
  recordUpdate?: RecordUpdate[]
  chips?: string[]
  patch?: {
    segments?: TrailSegment[]
    tasks?: Task[]
    equipment?: Equipment[]
  }
  /** Short confirmation for non-chat screens. */
  toast?: string
}

// ---- small text helpers -------------------------------------------------

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n))

/** Count shared meaningful word-stems between the input and a candidate name. */
function overlapScore(input: string, name: string): number {
  const stop = new Set(['the', 'a', 'on', 'to', 'up', 'of', 'and', 'trail', 'segment', 'section'])
  const words = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stop.has(w))
  const a = new Set(words(input))
  return words(name).reduce((acc, w) => acc + (a.has(w) ? 1 : 0), 0)
}

function bestMatch<T extends { name: string }>(input: string, items: T[]): T | undefined {
  let best: T | undefined
  let bestScore = 0
  for (const item of items) {
    const s = overlapScore(input, item.name)
    if (s > bestScore) {
      bestScore = s
      best = item
    }
  }
  return bestScore > 0 ? best : undefined
}

function firstNumber(text: string): number | undefined {
  const m = text.match(/(\d+(?:\.\d+)?)/)
  return m ? parseFloat(m[1]) : undefined
}

const equipStatus = (e: Equipment): Equipment['status'] => {
  const ratio = e.hoursSinceService / e.serviceIntervalHours
  if (ratio >= 0.9) return 'due'
  if (ratio >= 0.6) return 'watch'
  return 'good'
}

// ---- intent classification ---------------------------------------------

function classify(text: string): Intent {
  const t = text.toLowerCase()
  const maintenance = /(servic|oil|sharpen|greas|tune|blade|filter|replace)/.test(t)
  const done = /(done|finish|complete|mowed|cleared|weeded|cut|knock(ed)? out|wrapped up)/.test(t)
  const progress = /(\d+)\s*(%|percent|feet|ft|foot)/.test(t) || /(built|dug|graded|worked on|progress|up to)/.test(t)
  const question = /[?]|what|how|when|where|which|show|left|status|remaining/.test(t)

  if (maintenance && /(mower|chainsaw|trimmer|tractor|mattock|saw|tool)/.test(t)) return 'log-maintenance'
  // Progress on a trail wins over a generic "done" if a number of feet/percent is present.
  if (progress && !maintenance) return 'log-progress'
  if (done && !maintenance) return 'log-task-complete'
  if (question) return 'question'
  if (maintenance) return 'log-maintenance'
  return 'question'
}

// ---- intent handlers ----------------------------------------------------

function handleProgress(text: string, state: AIState): AIResult | undefined {
  const inProgress = state.segments.filter((s) => s.status !== 'planned')
  const seg =
    bestMatch(text, state.segments) ??
    // fall back to the lowest-progress active segment if the user was vague
    inProgress.slice().sort((a, b) => a.percentComplete - b.percentComplete)[0]
  if (!seg) return undefined

  const t = text.toLowerCase()
  const num = firstNumber(text)
  const prevPct = seg.percentComplete
  const prevFeet = seg.feetComplete
  let nextFeet = prevFeet
  let nextPct = prevPct

  if (num !== undefined && /(feet|ft|foot)/.test(t)) {
    // additive feet
    nextFeet = Math.min(seg.feetTotal, prevFeet + num)
    nextPct = clamp(Math.round((nextFeet / seg.feetTotal) * 100))
  } else if (num !== undefined && /(%|percent|up to|to\s+\d)/.test(t)) {
    // absolute percent
    nextPct = clamp(Math.round(num))
    nextFeet = Math.round((nextPct / 100) * seg.feetTotal)
  } else if (num !== undefined) {
    // bare number → treat as feet added
    nextFeet = Math.min(seg.feetTotal, prevFeet + num)
    nextPct = clamp(Math.round((nextFeet / seg.feetTotal) * 100))
  } else {
    // no number → nudge by a modest amount
    nextFeet = Math.min(seg.feetTotal, prevFeet + Math.round(seg.feetTotal * 0.05))
    nextPct = clamp(Math.round((nextFeet / seg.feetTotal) * 100))
  }

  const nextStatus: TrailSegment['status'] =
    nextPct >= 100 ? 'done' : 'in_progress'
  const updated: TrailSegment = {
    ...seg,
    feetComplete: nextFeet,
    percentComplete: nextPct,
    status: nextStatus,
    // clearing the flag once real work lands on the flagged segment
    aiFlagged: seg.aiFlagged && nextPct < 60 ? true : false,
  }

  const hoursMatch = text.match(/(\d+(?:\.\d+)?)\s*(hour|hr)/i)
  const recordUpdate: RecordUpdate[] = [
    { field: 'Segment', from: seg.name, to: seg.name },
    { field: 'Progress', from: `${prevPct}%`, to: `${nextPct}%` },
    { field: 'Feet complete', from: `${prevFeet} ft`, to: `${nextFeet} ft` },
  ]
  if (hoursMatch) {
    recordUpdate.push({ field: 'Hours logged', from: '—', to: `${hoursMatch[1]} hr` })
  }

  const gained = nextPct - prevPct
  const reply =
    nextPct >= 100
      ? `Nice — ${seg.name} is complete. I closed it out and updated the trail total.`
      : `Logged it. ${seg.name} moved from ${prevPct}% to ${nextPct}% (${nextFeet} of ${seg.feetTotal} ft). I updated the dashboard and trail list.`

  return {
    intent: 'log-progress',
    reply,
    recordUpdate,
    chips: gained > 0 ? ["What's left?", 'Show the map'] : ['Undo that', "What's left?"],
    patch: { segments: state.segments.map((s) => (s.id === seg.id ? updated : s)) },
    toast: `${seg.name}: ${prevPct}% → ${nextPct}%`,
  }
}

function handleTaskComplete(text: string, state: AIState): AIResult | undefined {
  const open = state.tasks.filter((tk) => !tk.done)
  const task =
    open.find((tk) => overlapScore(text, tk.title) > 0) ??
    open.find((tk) => tk.zone && text.toLowerCase().includes(tk.zone.toLowerCase()))
  if (!task) return undefined

  const updated: Task = { ...task, done: true, loggedByAI: true }
  const recordUpdate: RecordUpdate[] = [
    { field: 'Task', from: task.title, to: task.title },
    { field: 'Status', from: 'Open', to: 'Done' },
  ]
  if (task.zone) recordUpdate.push({ field: 'Zone', from: task.zone, to: task.zone })

  return {
    intent: 'log-task-complete',
    reply: `Marked "${task.title}" done. It's off your open list.`,
    recordUpdate,
    chips: ["What's left?", 'Show the map'],
    patch: { tasks: state.tasks.map((tk) => (tk.id === task.id ? updated : tk)) },
    toast: `Done: ${task.title}`,
  }
}

function handleMaintenance(text: string, state: AIState): AIResult | undefined {
  const tool = bestMatch(text, state.equipment)
  if (!tool) return undefined

  const prevHours = tool.hoursSinceService
  const prevStatus = tool.status
  const updated: Equipment = {
    ...tool,
    hoursSinceService: 0,
    status: 'good',
  }
  // also close any matching open equipment task
  const relatedTask = state.tasks.find(
    (tk) => !tk.done && tk.module === 'equipment' && overlapScore(tool.name, tk.title) > 0,
  )
  const nextTasks = relatedTask
    ? state.tasks.map((tk) => (tk.id === relatedTask.id ? { ...tk, done: true, loggedByAI: true } : tk))
    : undefined

  const recordUpdate: RecordUpdate[] = [
    { field: 'Tool', from: tool.name, to: tool.name },
    { field: 'Hours since service', from: `${prevHours} h`, to: '0 h' },
    { field: 'Status', from: prevStatus.toUpperCase(), to: 'GOOD' },
  ]

  return {
    intent: 'log-maintenance',
    reply: `Logged service on the ${tool.name}. Reset the hour counter and cleared the alert.`,
    recordUpdate,
    chips: ['What needs service next?', "What's left?"],
    patch: { equipment: state.equipment.map((e) => (e.id === tool.id ? updated : e)), tasks: nextTasks },
    toast: `Serviced ${tool.name}`,
  }
}

function handleQuestion(text: string, state: AIState): AIResult {
  const t = text.toLowerCase()
  const openTasks = state.tasks.filter((tk) => !tk.done)
  const active = state.segments.filter((s) => s.status !== 'planned')
  const totalFeet = state.segments.reduce((a, s) => a + s.feetTotal, 0)
  const doneFeet = state.segments.reduce((a, s) => a + s.feetComplete, 0)
  const overall = totalFeet ? Math.round((doneFeet / totalFeet) * 100) : 0
  const lowest = active.slice().sort((a, b) => a.percentComplete - b.percentComplete)[0]
  const dueTool = state.equipment.find((e) => e.status === 'due')

  let reply: string
  if (/map/.test(t)) {
    reply = 'The map is on the Home screen — the clay line is the trail, olive is the meadow connector still to build.'
  } else if (/service|maintenance|tool|gear|oil/.test(t)) {
    reply = dueTool
      ? `${dueTool.name} is the one to watch — ${dueTool.hoursSinceService} h since service, past its ${dueTool.serviceIntervalHours} h interval.`
      : 'Nothing is past its service interval right now.'
  } else if (/weather|rain/.test(t)) {
    reply = `${state.weather.tempF}°, ${state.weather.condition.toLowerCase()}.${
      state.weather.rainIncoming ? ` Good day to finish drainage on ${lowest?.name} before the ground softens.` : ''
    }`
  } else {
    reply =
      `Trail is ${overall}% overall (${doneFeet} of ${totalFeet} ft). ` +
      `${lowest ? `${lowest.name} is furthest behind at ${lowest.percentComplete}%. ` : ''}` +
      `${openTasks.length} open task${openTasks.length === 1 ? '' : 's'}${
        dueTool ? `, and ${dueTool.name} is due for service.` : '.'
      }`
  }

  return {
    intent: 'question',
    reply,
    chips: lowest ? [`Log work on ${lowest.name}`, 'Show the map', 'What needs service next?'] : ['Show the map'],
  }
}

/**
 * Interpret a free-text prompt into a structured result. Rule-based today;
 * the same signature can be backed by a real LLM call later.
 */
export function interpret(text: string, state: AIState): AIResult {
  const intent = classify(text)
  const result =
    (intent === 'log-progress' && handleProgress(text, state)) ||
    (intent === 'log-task-complete' && handleTaskComplete(text, state)) ||
    (intent === 'log-maintenance' && handleMaintenance(text, state))
  if (result) return result
  // If a write intent matched nothing concrete, fall back to a helpful answer.
  return handleQuestion(text, state)
}

/** Recompute an equipment status from its hours — exported for reuse/tests. */
export function statusForEquipment(e: Equipment): Equipment['status'] {
  return equipStatus(e)
}
