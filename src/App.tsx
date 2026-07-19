import './app.css'
import { PromptBar } from './components/PromptBar'
import { StatusBar } from './components/StatusBar'
import { TabBar } from './components/TabBar'
import { Equipment } from './screens/Equipment'
import { Home } from './screens/Home'
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

  return (
    <div className={`phone ${onRanger ? 'phone--dark' : ''} ${standalone ? 'is-standalone' : ''}`}>
      {/* When installed, iOS shows its own status bar — don't duplicate it. */}
      {!standalone && <StatusBar dark={onRanger} />}

      <main className="screen">
        {route === 'home' && <Home />}
        {route === 'trails' && <TrailBuilder />}
        {route === 'yard' && <Yard />}
        {route === 'gear' && <Equipment />}
        {route === 'stats' && <Stats />}
        {route === 'ranger' && <Ranger />}
      </main>

      {toast && <div className="toast">{toast}</div>}

      <PromptBar />
      {!onRanger && <TabBar />}
    </div>
  )
}
