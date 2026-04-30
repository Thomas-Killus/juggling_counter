import { useState } from 'react'
import * as storage from './utils/storage'
import OnboardingScreen from './screens/OnboardingScreen'
import DailyEntryScreen from './screens/DailyEntryScreen'
import HistoryScreen from './screens/HistoryScreen'
import SettingsScreen from './screens/SettingsScreen'
import BottomNav from './components/BottomNav'
import './App.css'

export default function App() {
  const [playerName, setPlayerName] = useState(() => storage.getName())
  const [activeTab, setActiveTab] = useState('entry')

  function handleNameSaved(name) {
    storage.setName(name)
    setPlayerName(name)
  }

  if (!playerName) {
    return <OnboardingScreen onComplete={handleNameSaved} />
  }

  return (
    <div className="app">
      <main className="app-content">
        {activeTab === 'entry' && (
          <DailyEntryScreen playerName={playerName} />
        )}
        {activeTab === 'history' && (
          <HistoryScreen playerName={playerName} />
        )}
        {activeTab === 'settings' && (
          <SettingsScreen
            playerName={playerName}
            onNameChange={handleNameSaved}
          />
        )}
      </main>
      <BottomNav activeTab={activeTab} onChange={setActiveTab} />
    </div>
  )
}
