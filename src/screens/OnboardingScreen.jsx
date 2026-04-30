import { useState } from 'react'
import './OnboardingScreen.css'

export default function OnboardingScreen({ onComplete }) {
  const [name, setName] = useState('')
  const trimmed = name.trim()

  function handleSubmit(e) {
    e.preventDefault()
    if (trimmed) onComplete(trimmed)
  }

  return (
    <div className="onboarding">
      <div className="onboarding-inner">
        {/* Logo */}
        <div className="onboarding-logo" aria-hidden="true">
          <img src="/icons/icon.svg" alt="" width="96" height="96" />
        </div>

        <h1 className="onboarding-title">5-Ball<br />Catch&nbsp;Tracker</h1>
        <p className="onboarding-subtitle">
          Track your daily juggling practice and post results straight to your
          shared Google Sheet.
        </p>

        <form className="onboarding-form" onSubmit={handleSubmit}>
          <label className="form-label" htmlFor="player-name">
            Your name
          </label>
          <input
            id="player-name"
            className="form-input onboarding-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Thomas"
            autoFocus
            autoComplete="given-name"
            maxLength={40}
          />
          <p className="onboarding-hint">
            This must match the sheet tab name:<br />
            <em>"5 Bälle Thomas"</em> or <em>"5 Ballen Thomas"</em>
          </p>

          <button
            className="btn btn--primary btn--full onboarding-btn"
            type="submit"
            disabled={!trimmed}
          >
            Start Tracking →
          </button>
        </form>
      </div>
    </div>
  )
}
