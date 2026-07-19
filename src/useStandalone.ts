import { useEffect, useState } from 'react'

function getStandalone(): boolean {
  if (typeof window === 'undefined') return false
  const displayMode = window.matchMedia?.('(display-mode: standalone)').matches
  // iOS Safari exposes navigator.standalone for Home Screen web apps.
  const iosStandalone = (window.navigator as { standalone?: boolean }).standalone === true
  return Boolean(displayMode || iosStandalone)
}

/** True when the app is running installed to the Home Screen (standalone). */
export function useStandalone(): boolean {
  const [standalone, setStandalone] = useState(getStandalone)
  useEffect(() => {
    const mq = window.matchMedia('(display-mode: standalone)')
    const onChange = () => setStandalone(getStandalone())
    mq.addEventListener?.('change', onChange)
    return () => mq.removeEventListener?.('change', onChange)
  }, [])
  return standalone
}
