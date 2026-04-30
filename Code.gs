// ─── Configuration ────────────────────────────────────────────────────────────
var SPREADSHEET_ID = '1qh4PSpIX26BVkaLpk2euVfFRfTPoOR7Xz-73_TerNGc';

// Sheet layout:
//   Col B  = date  (M/D/YYYY)  ← searched to find the right row
//   Col C–L = Try 1–10         ← only these 10 cells are written
var DATE_COL    = 2;   // B
var TRIES_START = 3;   // C

// ─── Entry point ──────────────────────────────────────────────────────────────
function doPost(e) {
  try {
    var raw = e.parameter && e.parameter.payload
      ? e.parameter.payload
      : e.postData.contents;

    var data = JSON.parse(raw);

    var name      = String(data.name      || '').trim();
    var sheetDate = String(data.sheetDate || '').trim(); // M/D/YYYY
    var tries     = data.tries || [];                    // array[10], nulls OK

    if (!name || !sheetDate) {
      return jsonResponse({ success: false, error: 'Missing name or date' });
    }

    var ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = findSheet(ss, name);

    if (!sheet) {
      return jsonResponse({
        success: false,
        error: 'Sheet not found for "' + name + '". ' +
               'Expected a tab named "5 Bälle ' + name + '" or "5 Ballen ' + name + '".'
      });
    }

    var rowIdx = findDateRow(sheet, sheetDate);

    if (!rowIdx) {
      return jsonResponse({
        success: false,
        error: 'Date "' + sheetDate + '" not found in column B of sheet "' +
               sheet.getName() + '". Make sure the date row exists in the spreadsheet.'
      });
    }

    // Build the 10 try values (empty string for skipped tries)
    var triesCells = [];
    for (var i = 0; i < 10; i++) {
      var t = tries[i];
      triesCells.push(t === null || t === undefined || t === '' ? '' : Number(t));
    }

    var range = sheet.getRange(rowIdx, TRIES_START, 1, 10);
    range.setValues([triesCells]);
    // Force plain number format so date-formatted columns don't mangle integers
    range.setNumberFormat('0');

    return jsonResponse({ success: true, row: rowIdx, sheet: sheet.getName() });

  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

// Health-check endpoint (GET)
function doGet(e) {
  return jsonResponse({ status: 'ok', message: '5-Ball Catch Tracker API is running' });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Find the sheet for this player.
 * Tries (in order):
 *   1. "5 Bälle <Name>"  (with umlaut)
 *   2. "5 Ballen <Name>" (without umlaut)
 *   3. Case-insensitive partial match as a last resort
 */
function findSheet(ss, name) {
  var capitalized = name.charAt(0).toUpperCase() + name.slice(1);
  var candidates = [
    '5 Bälle ' + capitalized,
    '5 Ballen ' + capitalized,
    '5 Bälle ' + name,
    '5 Ballen ' + name,
  ];

  var sheets = ss.getSheets();

  // Exact match first
  for (var i = 0; i < candidates.length; i++) {
    for (var j = 0; j < sheets.length; j++) {
      if (sheets[j].getName() === candidates[i]) {
        return sheets[j];
      }
    }
  }

  // Case-insensitive fallback
  var lowerName = name.toLowerCase();
  for (var k = 0; k < sheets.length; k++) {
    var tabName = sheets[k].getName().toLowerCase();
    if ((tabName.indexOf('bälle') !== -1 || tabName.indexOf('ballen') !== -1) &&
         tabName.indexOf(lowerName) !== -1) {
      return sheets[k];
    }
  }

  return null;
}

/**
 * Find the 1-based row index where column B matches sheetDate (M/D/YYYY).
 * Returns null if not found — never appends rows.
 *
 * Handles:
 *   - Date objects  → formatted with the spreadsheet's timezone (avoids UTC shift)
 *   - Text "M/D/YYYY"  (e.g. "5/1/2026")
 *   - Text "DD.MM.YYYY" (e.g. "01.05.2026", German locale text)
 */
function findDateRow(sheet, sheetDate) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 1) return null;

  // Parse the target date into numeric parts so format differences don't matter
  var tp = sheetDate.split('/');
  if (tp.length !== 3) return null;
  var targetMonth = parseInt(tp[0], 10);
  var targetDay   = parseInt(tp[1], 10);
  var targetYear  = parseInt(tp[2], 10);

  var tz = Session.getScriptTimeZone();
  var dateValues = sheet.getRange(1, DATE_COL, lastRow, 1).getValues();

  for (var i = 0; i < dateValues.length; i++) {
    var cell = dateValues[i][0];
    if (!cell && cell !== 0) continue;

    var cellMonth, cellDay, cellYear;

    if (cell instanceof Date) {
      // Use script timezone — avoids off-by-one-day UTC issues
      var formatted = Utilities.formatDate(cell, tz, 'M/d/yyyy');
      var fp = formatted.split('/');
      cellMonth = parseInt(fp[0], 10);
      cellDay   = parseInt(fp[1], 10);
      cellYear  = parseInt(fp[2], 10);
    } else {
      var s = String(cell).trim();
      var mSlash = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      var mDot   = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
      if (mSlash) {
        // M/D/YYYY  or  MM/DD/YYYY
        cellMonth = parseInt(mSlash[1], 10);
        cellDay   = parseInt(mSlash[2], 10);
        cellYear  = parseInt(mSlash[3], 10);
      } else if (mDot) {
        // DD.MM.YYYY  (German text format)
        cellDay   = parseInt(mDot[1], 10);
        cellMonth = parseInt(mDot[2], 10);
        cellYear  = parseInt(mDot[3], 10);
      } else {
        continue; // unrecognised format, skip
      }
    }

    if (cellYear === targetYear && cellMonth === targetMonth && cellDay === targetDay) {
      return i + 1; // 1-indexed
    }
  }

  return null;
}

/**
 * Run this manually in the Apps Script editor to verify date matching.
 * Open the editor → select testDateLookup → click Run.
 * Check the Execution log for output.
 */
function testDateLookup() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheets = ss.getSheets();
  Logger.log('Sheets in this spreadsheet:');
  for (var i = 0; i < sheets.length; i++) {
    Logger.log('  ' + sheets[i].getName());
  }

  var testName = 'Thomas';   // ← your player name
  var testDate = '5/1/2026'; // ← a date that EXISTS in the sheet (M/D/YYYY)

  var sheet = findSheet(ss, testName);
  if (!sheet) {
    Logger.log('ERROR: sheet not found for "' + testName + '"');
    return;
  }
  Logger.log('Found sheet: ' + sheet.getName());
  Logger.log('getLastRow(): ' + sheet.getLastRow());
  Logger.log('getLastColumn(): ' + sheet.getLastColumn());

  var tz = Session.getScriptTimeZone();
  Logger.log('Script timezone: ' + tz);

  // Read first 20 rows across columns A–F so we can see the real layout
  var numRows = Math.min(sheet.getLastRow(), 20);
  var numCols = Math.min(sheet.getLastColumn(), 6);
  if (numRows < 1 || numCols < 1) {
    Logger.log('Sheet appears empty!');
    return;
  }

  var data = sheet.getRange(1, 1, numRows, numCols).getValues();
  Logger.log('First ' + numRows + ' rows (columns A–' + String.fromCharCode(64 + numCols) + '):');
  for (var r = 0; r < data.length; r++) {
    var parts = [];
    for (var c = 0; c < data[r].length; c++) {
      var v = data[r][c];
      var label = String.fromCharCode(65 + c) + '=';
      if (v instanceof Date) {
        parts.push(label + 'Date(' + Utilities.formatDate(v, tz, 'M/d/yyyy') + ')');
      } else if (v === '' || v === null || v === undefined) {
        parts.push(label + '(empty)');
      } else {
        parts.push(label + '"' + v + '"');
      }
    }
    Logger.log('  row ' + (r + 1) + ': ' + parts.join('  '));
  }

  Logger.log('--- Searching DATE_COL=' + DATE_COL + ' for "' + testDate + '" ---');
  var rowIdx = findDateRow(sheet, testDate);
  if (rowIdx) {
    Logger.log('SUCCESS: found at row ' + rowIdx);
  } else {
    Logger.log('FAIL: not found — check which column holds the dates above');
  }
}

/** Return a JSON ContentService response. */
function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
