import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { interpret, type AIResult } from './ai'
import * as seed from './data'
import type {
  ChatMessage,
  Equipment,
  Property,
  Task,
  TrailSegment,
  WeatherSnapshot,
} from './types'

export type TabKey = 'home' | 'trails' | 'yard' | 'gear' | 'stats'
export type Route = TabKey | 'ranger'

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}

function openingMessage(segments: TrailSegment[], weather: WeatherSnapshot): ChatMessage {
  const lowest = segments
    .filter((s) => s.status !== 'planned')
    .slice()
    .sort((a, b) => a.percentComplete - b.percentComplete)[0]
  const text =
    weather.rainIncoming && lowest
      ? `Morning. ${weather.condition} — ${lowest.name} is your lowest segment at ${lowest.percentComplete}%. If you cut its drainage today the tread will hold through the rain. Want me to schedule it?`
      : `Morning. Trail work is looking good. Tell me what you knock out and I'll keep the records straight.`
  return {
    id: 'msg-opening',
    role: 'ai',
    text,
    chips: lowest ? ['Yes, schedule it', 'Show the map', "What's left?"] : ['Show the map'],
  }
}

interface Store {
  property: Property
  weather: WeatherSnapshot
  segments: TrailSegment[]
  tasks: Task[]
  equipment: Equipment[]
  chat: ChatMessage[]

  route: Route
  prevTab: TabKey
  draft: string
  toast: string | null
  suggestionDismissed: boolean

  setRoute: (r: Route) => void
  closeRanger: () => void
  setDraft: (s: string) => void
  submitPrompt: (text?: string) => void
  toggleTask: (id: string) => void
  serviceEquipment: (id: string) => void
  dismissSuggestion: () => void
  addTaskForSuggestion: () => void

  // derived
  overallPercent: number
  feetComplete: number
  feetTotal: number
  openTaskCount: number
  toolsDueCount: number
  flaggedSegment?: TrailSegment
  dueEquipment?: Equipment
}

const StoreContext = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [segments, setSegments] = useState<TrailSegment[]>(seed.trailSegments)
  const [tasks, setTasks] = useState<Task[]>(seed.tasks)
  const [equipment, setEquipment] = useState<Equipment[]>(seed.equipment)
  const [chat, setChat] = useState<ChatMessage[]>(() =>
    [openingMessage(seed.trailSegments, seed.weather)],
  )
  const [route, setRouteState] = useState<Route>('home')
  const [prevTab, setPrevTab] = useState<TabKey>('home')
  const [draft, setDraft] = useState('')

  // Remember the last real tab so the Ranger screen can return to its origin.
  const setRoute = useCallback((r: Route) => {
    setRouteState((current) => {
      if (r === 'ranger' && current !== 'ranger') setPrevTab(current as TabKey)
      return r
    })
  }, [])

  const closeRanger = useCallback(() => setRouteState(prevTab), [prevTab])
  const [toast, setToast] = useState<string | null>(null)
  const [suggestionDismissed, setSuggestionDismissed] = useState(false)
  const toastTimer = useRef<number | undefined>(undefined)

  const flashToast = useCallback((msg: string) => {
    setToast(msg)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 2600)
  }, [])

  const applyResult = useCallback(
    (result: AIResult) => {
      if (result.patch?.segments) setSegments(result.patch.segments)
      if (result.patch?.tasks) setTasks(result.patch.tasks)
      if (result.patch?.equipment) setEquipment(result.patch.equipment)
    },
    [],
  )

  const submitPrompt = useCallback(
    (textArg?: string) => {
      const text = (textArg ?? draft).trim()
      if (!text) return
      const onRanger = route === 'ranger'

      const result = interpret(text, { segments, tasks, equipment, weather: seed.weather })

      const userMsg: ChatMessage = { id: uid('u'), role: 'user', text }
      const aiMsg: ChatMessage = {
        id: uid('a'),
        role: 'ai',
        text: result.reply,
        recordUpdate: result.recordUpdate,
        chips: result.chips,
      }
      setChat((c) => [...c, userMsg, aiMsg])
      applyResult(result)
      setDraft('')

      if (onRanger) {
        // stay on the chat; the thread shows the confirmation + record card
      } else {
        // route the interaction to Ranger so the write is always visible,
        // and surface a toast on the way out.
        if (result.toast) flashToast(result.toast)
        setRoute('ranger')
      }
    },
    [draft, route, segments, tasks, equipment, applyResult, flashToast],
  )

  const toggleTask = useCallback((id: string) => {
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, done: !t.done, loggedByAI: false } : t)))
  }, [])

  const serviceEquipment = useCallback(
    (id: string) => {
      setEquipment((es) =>
        es.map((e) => (e.id === id ? { ...e, hoursSinceService: 0, status: 'good' } : e)),
      )
      const tool = equipment.find((e) => e.id === id)
      if (tool) flashToast(`Serviced ${tool.name}`)
    },
    [equipment, flashToast],
  )

  const dismissSuggestion = useCallback(() => setSuggestionDismissed(true), [])

  const addTaskForSuggestion = useCallback(() => {
    const flagged = segments.find((s) => s.aiFlagged)
    if (!flagged) return
    setTasks((ts) => {
      if (ts.some((t) => t.module === 'trail' && t.title.includes(flagged.name))) return ts
      return [
        {
          id: uid('task'),
          title: `Cut drainage on ${flagged.name}`,
          module: 'trail' as const,
          dueDate: '2026-07-20',
          done: false,
          loggedByAI: true,
        },
        ...ts,
      ]
    })
    flashToast('Added: drainage task')
  }, [segments, flashToast])

  const feetComplete = segments.reduce((a, s) => a + s.feetComplete, 0)
  const feetTotal = segments.reduce((a, s) => a + s.feetTotal, 0)
  const overallPercent = feetTotal ? Math.round((feetComplete / feetTotal) * 100) : 0
  const openTaskCount = tasks.filter((t) => !t.done).length
  const toolsDueCount = equipment.filter((e) => e.status === 'due').length
  const flaggedSegment = segments.find((s) => s.aiFlagged)
  const dueEquipment = equipment.find((e) => e.status === 'due')

  const value = useMemo<Store>(
    () => ({
      property: seed.property,
      weather: seed.weather,
      segments,
      tasks,
      equipment,
      chat,
      route,
      prevTab,
      draft,
      toast,
      suggestionDismissed,
      setRoute,
      closeRanger,
      setDraft,
      submitPrompt,
      toggleTask,
      serviceEquipment,
      dismissSuggestion,
      addTaskForSuggestion,
      overallPercent,
      feetComplete,
      feetTotal,
      openTaskCount,
      toolsDueCount,
      flaggedSegment,
      dueEquipment,
    }),
    [
      segments,
      tasks,
      equipment,
      chat,
      route,
      prevTab,
      draft,
      toast,
      suggestionDismissed,
      setRoute,
      closeRanger,
      submitPrompt,
      toggleTask,
      serviceEquipment,
      dismissSuggestion,
      addTaskForSuggestion,
      overallPercent,
      feetComplete,
      feetTotal,
      openTaskCount,
      toolsDueCount,
      flaggedSegment,
      dueEquipment,
    ],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): Store {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
