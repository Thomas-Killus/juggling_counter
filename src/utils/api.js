import { SCRIPT_URL } from '../config'
import { toSheetDate } from './date'

/**
 * Submit a session's tries to the Google Apps Script endpoint.
 *
 * Apps Script Web Apps have CORS quirks with application/json (triggers preflight
 * that Apps Script can't handle). Using application/x-www-form-urlencoded
 * (a "simple request") avoids the preflight entirely.
 *
 * The entire payload is sent as the `payload` form field, JSON-encoded.
 * In Code.gs, read it with: const data = JSON.parse(e.parameter.payload)
 */
export async function submitTries(payload) {
  const endpoint = SCRIPT_URL

  // Detect the common mistake of pasting the Google Sheets URL
  if (endpoint.includes('docs.google.com/spreadsheets')) {
    throw new Error(
      'Wrong URL: that is the Google Sheets document URL, not the Apps Script URL. ' +
      'Open script.google.com, deploy Code.gs as a Web App, and paste the ' +
      '"https://script.google.com/macros/s/…/exec" URL into src/config.js.',
    )
  }

  if (!endpoint || endpoint.includes('PASTE_YOUR_EXEC_URL_HERE')) {
    throw new Error(
      'No endpoint set. Open src/config.js and replace the placeholder with ' +
      'your Apps Script Web App URL (script.google.com/macros/s/…/exec).',
    )
  }

  const body = new URLSearchParams({
    payload: JSON.stringify({
      name:        payload.name,
      date:        payload.date,          // YYYY-MM-DD (for duplicate detection)
      sheetDate:   toSheetDate(payload.date), // M/D/YYYY  (for sheet lookup)
      tries:       payload.tries,         // array[10], nulls for empty slots
      total:       payload.total,
      average:     payload.average,
      best:        payload.best,
      submittedAt: payload.submittedAt,
    }),
  })

  let response
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })
  } catch (networkError) {
    throw new Error(
      'Network error — check your internet connection and the endpoint URL.',
    )
  }

  if (!response.ok) {
    throw new Error(
      `Server returned HTTP ${response.status}. Check your Apps Script deployment.`,
    )
  }

  let result
  try {
    result = await response.json()
  } catch {
    // Some CORS-opaque responses land here; if fetch didn't throw, treat as success.
    return { success: true }
  }

  if (result.success === false) {
    throw new Error(result.error ?? 'Apps Script returned an error')
  }

  return result
}
