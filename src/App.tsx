import { useEffect, useState } from 'react'
import './app.css'
import { PromptBar } from './components/PromptBar'
import { SplashArt } from './components/SplashArt'
import { StatusBar } from './components/StatusBar'
import { TabBar } from './components/TabBar'
import { Equipment } from './screens/Equipment'
import { Home } from './screens/Home'
import { MapScreen } from './screens/MapScreen'
import { Ranger } from './screens/Ranger'
import { Stats } from './screens/Stats'
import { TrailBuilder } from './screens/TrailBuilder'
import { Yard } from './screens/Yard'
import { useStore } from './store'
import { useStandalone } from './useStandalone'

export default function App() {
  const { route, toast } = useStore()
  const onRanger = route === 'ranger'
  const standalone = useStandalone()
  const [splash, setSplash] = useState(true)
  // Use public/splash.jpg if it's been added; otherwise the SVG scene.
  const [useSplashImage, setUseSplashImage] = useState(true)

  useEffect(() => {
    const t = window.setTimeout(() => setSplash(false), 2200)
    return () => window.clearTimeout(t)
  }, [])

  return (
    <div className={`phone ${onRanger ? 'phone--dark' : ''} ${standalone ? 'is-standalone' : ''}`}>
      {/* When installed, iOS shows its own status bar — don't duplicate it. */}
      {!standalone && <StatusBar dark={onRanger} />}

      <main className="screen">
        {route === 'home' && <Home />}
        {route === 'map' && <MapScreen />}
        {route === 'trails' && <TrailBuilder />}
        {route === 'yard' && <Yard />}
        {route === 'gear' && <Equipment />}
        {route === 'stats' && <Stats />}
        {route === 'ranger' && <Ranger />}
      </main>

      {toast && <div className="toast">{toast}</div>}

      <PromptBar />
      {!onRanger && <TabBar />}

      {/* Dark strip behind the (now transparent, white-text) status bar so the
          time/battery stay readable on light screens. The splash sits above it. */}
      {standalone && <div className="statusbar-scrim" aria-hidden />}

      {splash && (
        <div className="splash">
          {useSplashImage ? (
            <img
              className="splash__art"
              src={`${import.meta.env.BASE_URL}splash.jpg`}
              alt=""
              onError={() => setUseSplashImage(false)}
            />
          ) : (
            <SplashArt />
          )}
          <div className="splash__word">Ridgeline</div>
        </div>
      )}
    </div>
  )
}
