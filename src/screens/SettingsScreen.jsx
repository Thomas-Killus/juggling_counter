import { useState } from 'react'
import * as storage from '../utils/storage'
import { SCRIPT_URL } from '../config'
import './SettingsScreen.css'

export default function SettingsScreen({ playerName, onNameChange }) {
  const [nameInput, setNameInput] = useState(playerName)
  const [nameSaved, setNameSaved] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  function saveName(e) {
    e.preventDefault()
    const trimmed = nameInput.trim()
    if (!trimmed) return
    storage.setName(trimmed)
    onNameChange(trimmed)
    setNameSaved(true)
    setTimeout(() => setNameSaved(false), 2500)
  }

  function handleClearHistory() {
    storage.clearSubmissions()
    setShowClearConfirm(false)
  }

  const endpointConfigured = SCRIPT_URL && !SCRIPT_URL.includes('PASTE_YOUR_EXEC_URL_HERE')

  return (
    <div className="screen settings">
      <header className="page-header">
        <h1 className="page-title">Settings</h1>
      </header>

      {/* ── Player name ──────────────────────────────────────── */}
      <section className="settings-section card">
        <h2 className="settings-section-title">Player name</h2>
        <p className="settings-section-desc">
          Must match your sheet tab: <em>"5 Bälle&nbsp;[Name]"</em> or <em>"5 Ballen&nbsp;[Name]"</em>.
        </p>
        <form onSubmit={saveName}>
          <div className="form-group">
            <label className="form-label" htmlFor="settings-name">Name</label>
            <input
              id="settings-name"
              className="form-input"
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              maxLength={40}
              autoComplete="off"
            />
          </div>
          <button
            className={`btn btn--full${nameSaved ? ' btn--success' : ' btn--primary'}`}
            type="submit"
            disabled={!nameInput.trim() || nameInput.trim() === playerName}
          >
            {nameSaved ? '✓ Saved!' : 'Save name'}
          </button>
        </form>
      </section>

      {/* ── Apps Script status ───────────────────────────────── */}
      <section className="settings-section card">
        <h2 className="settings-section-title">Apps Script endpoint</h2>
        {endpointConfigured ? (
          <div className="alert alert--success" style={{ marginBottom: 0 }}>
            ✓ Endpoint configured in <code>src/config.js</code>
          </div>
        ) : (
          <div className="alert alert--warning" style={{ marginBottom: 0 }}>
            ⚠️ Not configured yet.<br />
            <strong>Open <code>src/config.js</code></strong> and replace the placeholder with
            your Apps Script Web App URL.<br /><br />
            The URL must look like:<br />
            <code className="settings-code">https://script.google.com/macros/s/…/exec</code><br /><br />
            It is <strong>not</strong> the Google Sheets URL (<code>docs.google.com/…</code>).
          </div>
        )}
      </section>

      {/* ── Danger zone ─────────────────────────────────────── */}
      <section className="settings-section card settings-danger-zone">
        <h2 className="settings-section-title settings-danger-title">Danger zone</h2>
        {showClearConfirm ? (
          <div>
            <p className="settings-section-desc">
              This deletes your local history cache. The Google Sheet is not affected.
            </p>
            <div className="alert-actions">
              <button className="btn btn--sm btn--ghost" onClick={() => setShowClearConfirm(false)}>
                Cancel
              </button>
              <button className="btn btn--sm btn--danger" onClick={handleClearHistory}>
                Yes, clear history
              </button>
            </div>
          </div>
        ) : (
          <button
            className="btn btn--ghost btn--full"
            style={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}
            onClick={() => setShowClearConfirm(true)}
          >
            Clear local history
          </button>
        )}
      </section>

      {/* ── Info ────────────────────────────────────────────── */}
      <p className="settings-footer">
        5-Ball Catch Tracker · v1.0.0
      </p>
    </div>
  )
}
