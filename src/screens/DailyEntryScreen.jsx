import { useState, useMemo } from 'react'
import * as storage from '../utils/storage'
import * as api from '../utils/api'
import { SCRIPT_URL } from '../config'
import { getTodayISO, formatDateDisplay } from '../utils/date'
import './DailyEntryScreen.css'

const NUM_TRIES = 10

// status machine: idle → confirm | submitting → success | error
export default function DailyEntryScreen({ playerName }) {
  const today = getTodayISO()
  const [selectedDate, setSelectedDate] = useState(today)
  const [tries, setTries] = useState(Array(NUM_TRIES).fill(''))
  const [status, setStatus] = useState('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const endpointReady = SCRIPT_URL && !SCRIPT_URL.includes('PASTE_YOUR_EXEC_URL_HERE')

  // ── Derived stats ───────────────────────────────────────────────────────────
  const { filledTries, total, average, best, bestIndex } = useMemo(() => {
    const filled = tries
      .map((t, i) => ({ val: t, i }))
      .filter(({ val }) => val !== '' && !isNaN(Number(val)) && Number(val) >= 0)
      .map(({ val, i }) => ({ val: Number(val), i }))

    const sum = filled.reduce((a, b) => a + b.val, 0)
    const avg = filled.length > 0 ? sum / filled.length : null
    const maxVal = filled.length > 0 ? Math.max(...filled.map((f) => f.val)) : null
    const maxIdx = maxVal !== null ? filled.find((f) => f.val === maxVal)?.i ?? -1 : -1

    return {
      filledTries: filled,
      total: sum,
      average: avg !== null ? avg.toFixed(1) : null,
      best: maxVal,
      bestIndex: maxIdx,
    }
  }, [tries])

  // ── Handlers ────────────────────────────────────────────────────────────────
  function handleTryChange(idx, value) {
    if (value === '' || /^\d+$/.test(value)) {
      const next = [...tries]
      next[idx] = value
      setTries(next)
    }
  }

  async function handleSubmit(confirmed = false) {
    if (filledTries.length === 0) return

    if (!confirmed) {
      const existing = storage.getSubmissionForDate(playerName, selectedDate)
      if (existing) {
        setStatus('confirm')
        return
      }
    }

    setStatus('submitting')
    setErrorMsg('')

    const payload = {
      name:        playerName,
      date:        selectedDate,
      tries:       tries.map((t) => (t === '' ? null : Number(t))),
      total,
      average:     average !== null ? parseFloat(average) : 0,
      best:        best ?? 0,
      submittedAt: new Date().toISOString(),
    }

    try {
      await api.submitTries(payload)
      storage.saveSubmission(payload)
      setStatus('success')
    } catch (err) {
      setErrorMsg(err.message)
      setStatus('error')
    }
  }

  function handleReset() {
    setTries(Array(NUM_TRIES).fill(''))
    setStatus('idle')
    setErrorMsg('')
    setSelectedDate(today)
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  const busy = status === 'submitting'
  const done = status === 'success'
  const hasData = filledTries.length > 0

  return (
    <div className="screen daily">
      {/* Header */}
      <header className="daily-header">
        <div className="daily-header-text">
          <div className="daily-player">{playerName}</div>
          <div className="daily-date">{formatDateDisplay(selectedDate)}</div>
        </div>
        <label className="daily-date-picker" title="Change date">
          <input
            type="date"
            value={selectedDate}
            max={today}
            onChange={(e) => {
              if (e.target.value) {
                setSelectedDate(e.target.value)
                setStatus('idle')
                setErrorMsg('')
              }
            }}
            disabled={busy || done}
            aria-label="Session date"
          />
          📅
        </label>
      </header>

      {/* Endpoint missing warning */}
      {!endpointReady && (
        <div className="alert alert--warning">
          ⚠️ Apps Script URL not configured. Open <code>src/config.js</code> and
          paste your <code>/exec</code> URL, then rebuild.
        </div>
      )}

      {/* Already submitted indicator */}
      {storage.getSubmissionForDate(playerName, selectedDate) && status === 'idle' && (
        <div className="alert alert--info">
          ✓ You already submitted today. Entering new values will overwrite.
        </div>
      )}

      {/* Try inputs grid */}
      <div className="tries-grid" aria-label="Try inputs">
        {tries.map((val, i) => {
          const isBest = i === bestIndex && val !== '' && best !== null
          return (
            <div key={i} className={`try-cell${isBest ? ' try-cell--best' : ''}`}>
              <label className="try-label" htmlFor={`try-${i}`}>
                {isBest ? '⭐ Try ' : 'Try '}{i + 1}
              </label>
              <input
                id={`try-${i}`}
                type="number"
                className="try-input"
                value={val}
                onChange={(e) => handleTryChange(i, e.target.value)}
                min="0"
                step="1"
                inputMode="numeric"
                pattern="\d*"
                placeholder="—"
                disabled={busy || done}
                aria-label={`Try ${i + 1}`}
              />
            </div>
          )
        })}
      </div>

      {/* Live stats bar */}
      <div className="stats-bar card">
        <div className="stat">
          <span className="stat-value">{hasData ? total : '—'}</span>
          <span className="stat-label">Total</span>
        </div>
        <div className="stat-divider" />
        <div className="stat">
          <span className="stat-value">{average ?? '—'}</span>
          <span className="stat-label">Average</span>
        </div>
        <div className="stat-divider" />
        <div className="stat stat--accent">
          <span className="stat-value">{best ?? '—'}</span>
          <span className="stat-label">Best ⭐</span>
        </div>
      </div>

      {/* Status messages */}
      {status === 'confirm' && (
        <div className="alert alert--warning">
          <strong>Already submitted today.</strong> Overwrite with new values?
          <div className="alert-actions">
            <button
              className="btn btn--sm btn--ghost"
              onClick={() => setStatus('idle')}
            >
              Cancel
            </button>
            <button
              className="btn btn--sm btn--primary"
              onClick={() => handleSubmit(true)}
            >
              Yes, overwrite
            </button>
          </div>
        </div>
      )}

      {status === 'success' && (
        <div className="alert alert--success">
          ✓ Submitted! <strong>{total}</strong> total catches recorded for {selectedDate === today ? 'today' : formatDateDisplay(selectedDate)}.
          <button
            className="btn btn--sm btn--ghost"
            onClick={handleReset}
            style={{ marginTop: 'var(--space-3)', display: 'block', width: '100%' }}
          >
            Start a new entry
          </button>
        </div>
      )}

      {status === 'error' && (
        <div className="alert alert--error">
          <strong>Submission failed:</strong> {errorMsg}
          <button
            className="btn btn--sm btn--ghost"
            onClick={() => setStatus('idle')}
            style={{ marginTop: 'var(--space-3)', display: 'block', width: '100%' }}
          >
            Try again
          </button>
        </div>
      )}

      {/* Submit button */}
      {!done && (
        <button
          className="btn btn--primary btn--full daily-submit"
          onClick={() => handleSubmit()}
          disabled={!hasData || busy || status === 'confirm'}
        >
          {busy ? 'Submitting…' : 'Submit to Sheet'}
        </button>
      )}
    </div>
  )
}
