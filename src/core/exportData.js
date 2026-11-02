// Pure export builders (no DOM / no Blob here).
//
// toCSV produces one row per raw sample with stable headers.
// toJSON produces a structured session object. The comprehension quiz result
// is kept in a SEPARATE field (quizResult) and is never merged into the gaze
// metrics summary.

const WEBGAZER_VERSION = '3.5.3';

const CSV_HEADERS = [
  'elapsedMs',
  'timestampISO',
  'rawX',
  'rawY',
  'filteredX',
  'filteredY',
  'trackingStatus',
  'aoiClassification',
  'viewportWidth',
  'viewportHeight',
];

/**
 * Escape a single CSV field per RFC 4180: wrap in double quotes when it
 * contains a comma, quote, CR or LF, and double any inner quotes.
 * @param {*} value
 * @returns {string}
 */
function escapeCsv(value) {
  if (value == null) return '';
  const str = String(value);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Build a CSV string, one row per sample.
 * @param {{samples?:Array<Object>}} session
 * @returns {string}
 */
export function toCSV(session) {
  const samples = session?.samples ?? [];
  const lines = [CSV_HEADERS.join(',')];

  for (const s of samples) {
    const row = [
      s.elapsedMs,
      s.timestampISO,
      s.rawX,
      s.rawY,
      s.filteredX,
      s.filteredY,
      s.trackingStatus,
      s.aoiClassification,
      s.viewportWidth,
      s.viewportHeight,
    ].map(escapeCsv);
    lines.push(row.join(','));
  }

  return lines.join('\n');
}

/**
 * Build the structured JSON session object.
 * @param {Object} session
 * @param {{appVersion?:string,mode?:string,sessionCode?:string}} [session.metadata]
 * @param {number} [session.activeDurationMs]
 * @param {Object} [session.samplingParams]
 * @param {Object} [session.thresholds]
 * @param {Object} [session.summary] metrics summary (gaze only)
 * @param {Array} [session.episodes]
 * @param {Array} [session.pauses]
 * @param {Array} [session.trackingLossPeriods]
 * @param {Object|null} [session.quizResult] kept SEPARATE from gaze summary
 * @param {Array} [session.samples]
 * @returns {Object}
 */
export function toJSON(session = {}) {
  const md = session.metadata ?? {};
  return {
    metadata: {
      appVersion: md.appVersion ?? '0.1.0',
      webgazerVersion: WEBGAZER_VERSION,
      mode: md.mode ?? null,
      sessionCode: md.sessionCode ?? null,
      exportedAtISO: md.exportedAtISO ?? null,
    },
    activeDurationMs: session.activeDurationMs ?? 0,
    samplingParams: session.samplingParams ?? { intervalMs: 100, targetHz: 10 },
    thresholds: session.thresholds ?? {
      outsideConfirmMs: 1000,
      returnConfirmMs: 300,
    },
    summary: session.summary ?? null,
    episodes: session.episodes ?? [],
    pauses: session.pauses ?? [],
    trackingLossPeriods: session.trackingLossPeriods ?? [],
    // Comprehension quiz result is intentionally kept separate from gaze
    // metrics so it is never conflated with the geometric measurements.
    quizResult: session.quizResult ?? null,
    samples: session.samples ?? [],
  };
}

export { CSV_HEADERS, WEBGAZER_VERSION };
