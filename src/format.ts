function today(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

export function dueLabel(iso: string): string {
  const due = new Date(iso + 'T00:00:00')
  const days = Math.round((due.getTime() - today().getTime()) / 86400000)
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
