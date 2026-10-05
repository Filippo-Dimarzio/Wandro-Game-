/**
 * Wandro beta waitlist: receives sign-ups from the /join page and adds them to this Google Sheet.
 * Paste into Extensions -> Apps Script of the sheet, then Deploy -> New deployment -> Web app
 * (Execute as: Me, Who has access: Anyone). Setup steps: docs/waitlist/README.md.
 */
var SHEET = 'Sign-ups';
var HEADERS = [
  'Signed up at',
  'Email',
  'First name',
  'Lives in',
  'Occupation',
  'Gets around by',
  'Would explore first',
  'Fog Walk?',
  'Consent',
  'Came from',
];
var ALLOWED = {
  livesIn: ['lisbon', 'sintra', 'porto', 'portugal', 'visiting'],
  occupation: ['study', 'work', 'both', 'other'],
  fogWalk: ['yes', 'maybe', 'no'],
  transport: ['metro', 'train', 'bus_tram', 'walk', 'bike', 'car'],
  interests: ['coast', 'nature', 'heritage', 'culture', 'art', 'music_events', 'other'],
};

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var s = JSON.parse(e.postData.contents);
    var email = String(s.email || '')
      .trim()
      .toLowerCase()
      .slice(0, 254);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || s.consent !== true)
      return reply('rejected');
    if (ALLOWED.livesIn.indexOf(s.livesIn) < 0) return reply('rejected');
    if (ALLOWED.occupation.indexOf(s.occupation) < 0) return reply('rejected');
    if (ALLOWED.fogWalk.indexOf(s.fogWalk) < 0) return reply('rejected');

    var sheet = getSheet();
    var emails = sheet.getRange(2, 2, Math.max(sheet.getLastRow() - 1, 1), 1).getValues();
    for (var i = 0; i < emails.length; i++)
      if (String(emails[i][0]).replace(/^'/, '') === email) return reply('already');

    sheet.appendRow([
      new Date(),
      clean(email, 254),
      clean(s.firstName, 60),
      s.livesIn,
      s.occupation,
      pick(s.transport, ALLOWED.transport),
      pick(s.interests, ALLOWED.interests),
      s.fogWalk,
      'yes',
      clean(s.source, 32),
    ]);
    return reply('ok');
  } finally {
    lock.releaseLock();
  }
}

function getSheet() {
  var book = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = book.getSheetByName(SHEET) || book.insertSheet(SHEET);
  if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);
  return sheet;
}

/** Only known answers, joined for the sheet. */
function pick(list, allowed) {
  return (Array.isArray(list) ? list : [])
    .filter(function (x) {
      return allowed.indexOf(x) >= 0;
    })
    .join(', ');
}

/** Plain text only, with formulas defused, so nothing sent in can run inside the sheet. */
function clean(value, max) {
  var t = String(value || '')
    .replace(/[\r\n\t]/g, ' ')
    .trim()
    .slice(0, max);
  return /^[=+\-@]/.test(t) ? "'" + t : t;
}

function reply(status) {
  return ContentService.createTextOutput(status);
}
