// "Today" is pinned to the app's reference date so the seeded due dates read
// sensibly regardless of when the demo is opened.
const TODAY = new Date('2026-07-19T00:00:00')

export function dueLabel(iso: string): string {
  const due = new Date(iso + 'T00:00:00')
  const days = Math.round((due.getTime() - TODAY.getTime()) / 86400000)
  if (days < 0) return 'Overdue'
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days < 7) return `${days}d`
  return due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function isSoon(iso: string): boolean {
  const label = dueLabel(iso)
  return label === 'Today' || label === 'Overdue' || label === 'Tomorrow'
}
