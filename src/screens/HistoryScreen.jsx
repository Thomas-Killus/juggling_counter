import { useMemo } from 'react'
import * as storage from '../utils/storage'
import { formatDateDisplay, formatShortDate } from '../utils/date'
import Chart from '../components/Chart'
import './HistoryScreen.css'

export default function HistoryScreen({ playerName }) {
  const submissions = storage.getRecentSubmissions(playerName, 14)

  // Last 7 days for the chart — oldest first so bars go left → right
  const chartData = useMemo(() => {
    return [...submissions]
      .slice(0, 7)
      .reverse()
      .map((s) => ({
        label: formatShortDate(s.date),
        value: s.total,
      }))
  }, [submissions])

  if (submissions.length === 0) {
    return (
      <div className="screen history">
        <header className="page-header">
          <h1 className="page-title">History</h1>
        </header>
        <div className="history-empty card">
          <div className="history-empty-icon" aria-hidden="true">🎪</div>
          <p>No submissions yet.</p>
          <p className="history-empty-sub">Start by entering today's catches on the Entry tab.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="screen history">
      <header className="page-header">
        <h1 className="page-title">History</h1>
        <span className="page-subtitle">{playerName}</span>
      </header>

      {/* Chart */}
      {chartData.length > 1 && (
        <div className="card history-chart-card">
          <div className="history-chart-title">Last {chartData.length} sessions · Total catches</div>
          <Chart data={chartData} />
        </div>
      )}

      {/* List */}
      <div className="history-list">
        {submissions.map((s) => {
          const filledTries = (s.tries ?? []).filter((t) => t !== null && t !== undefined)
          return (
            <div key={s.date} className="history-item card">
              <div className="history-item-header">
                <div className="history-item-date">{formatDateDisplay(s.date)}</div>
                <div className="history-item-total">{s.total}</div>
              </div>

              <div className="history-item-stats">
                <span className="history-stat">
                  <span className="history-stat-label">Avg</span>
                  <span className="history-stat-value">{s.average}</span>
                </span>
                <span className="history-stat history-stat--accent">
                  <span className="history-stat-label">Best ⭐</span>
                  <span className="history-stat-value">{s.best}</span>
                </span>
                <span className="history-stat">
                  <span className="history-stat-label">Tries</span>
                  <span className="history-stat-value">{filledTries.length}</span>
                </span>
              </div>

              {/* Mini try dots */}
              <div className="history-tries">
                {(s.tries ?? []).map((val, i) =>
                  val !== null && val !== undefined ? (
                    <span
                      key={i}
                      className={`try-dot${val === s.best ? ' try-dot--best' : ''}`}
                      title={`Try ${i + 1}: ${val}`}
                    >
                      {val}
                    </span>
                  ) : (
                    <span key={i} className="try-dot try-dot--empty" title={`Try ${i + 1}: —`} />
                  ),
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
