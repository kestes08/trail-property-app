import { useEffect, useState } from 'react'

function currentTime(): string {
  return new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

export function StatusBar({ dark = false }: { dark?: boolean }) {
  const color = dark ? '#f3efe4' : '#1a2620'
  const [time, setTime] = useState(currentTime)

  useEffect(() => {
    const id = window.setInterval(() => setTime(currentTime()), 15000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <div className="statusbar" style={{ color }}>
      <span>{time}</span>
    </div>
  )
}
