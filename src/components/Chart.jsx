import './Chart.css'

/**
 * Simple SVG bar chart.
 *
 * @param {{ label: string, value: number }[]} data  — ordered oldest → newest
 */
export default function Chart({ data }) {
  if (!data || data.length === 0) return null

  const BAR_GAP = 6
  const LABEL_H = 22
  const VALUE_H = 16
  const CHART_H = 100
  const totalH = CHART_H + LABEL_H + VALUE_H

  const maxVal = Math.max(...data.map((d) => d.value), 1)
  const barW = (300 - BAR_GAP * (data.length + 1)) / data.length

  return (
    <svg
      className="catch-chart"
      viewBox={`0 0 300 ${totalH}`}
      aria-label="Catches per session bar chart"
      role="img"
    >
      {data.map((d, i) => {
        const barH = Math.max((d.value / maxVal) * CHART_H, d.value > 0 ? 4 : 0)
        const x = BAR_GAP + i * (barW + BAR_GAP)
        const y = CHART_H - barH
        const cx = x + barW / 2

        return (
          <g key={`${d.label}-${i}`}>
            {/* Bar */}
            <rect
              x={x}
              y={y}
              width={barW}
              height={barH}
              rx={3}
              ry={3}
              className="chart-bar"
            />
            {/* Value label above bar */}
            {d.value > 0 && (
              <text
                x={cx}
                y={y - 3}
                textAnchor="middle"
                className="chart-value"
              >
                {d.value}
              </text>
            )}
            {/* Date label below bar */}
            <text
              x={cx}
              y={CHART_H + LABEL_H - 4}
              textAnchor="middle"
              className="chart-label"
            >
              {d.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
