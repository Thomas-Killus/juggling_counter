// Keys kept short to save localStorage space
const KEYS = {
  NAME:        'ct_name',
  SUBMISSIONS: 'ct_submissions',
}

function safeGet(key, fallback) {
  try {
    return localStorage.getItem(key) ?? fallback
  } catch {
    return fallback
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Silently fail (e.g. private browsing quota exceeded)
  }
}

// ─── Player name ─────────────────────────────────────────────────────────────
export function getName() {
  return safeGet(KEYS.NAME, '')
}

export function setName(name) {
  safeSet(KEYS.NAME, name.trim())
}

// ─── Submissions cache ────────────────────────────────────────────────────────
export function getSubmissions() {
  try {
    const raw = localStorage.getItem(KEYS.SUBMISSIONS)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveSubmission(submission) {
  const all = getSubmissions()
  // Remove existing entry for the same player + date (overwrite)
  const filtered = all.filter(
    (s) => !(s.name === submission.name && s.date === submission.date),
  )
  filtered.unshift(submission) // newest first
  safeSet(KEYS.SUBMISSIONS, JSON.stringify(filtered.slice(0, 90)))
}

export function getSubmissionForDate(name, date) {
  return getSubmissions().find((s) => s.name === name && s.date === date) ?? null
}

/**
 * Returns submissions for a player within the last `days` days,
 * sorted newest → oldest.
 */
export function getRecentSubmissions(name, days = 14) {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  cutoff.setHours(0, 0, 0, 0)
  return getSubmissions().filter(
    (s) => s.name === name && new Date(s.date + 'T00:00:00') >= cutoff,
  )
}

export function clearSubmissions() {
  safeSet(KEYS.SUBMISSIONS, '[]')
}
