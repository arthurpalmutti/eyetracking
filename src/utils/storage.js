// localStorage helpers for PREFERENCES and a SUMMARIZED session history.
//
// Privacy by design:
//   - Only user preferences and a short, non-identifiable summary of past
//     sessions are persisted. NO raw gaze samples, NO video, NO personal data.
//   - Raw session samples stay in memory only and are discarded unless the user
//     explicitly exports them.
//   - Everything is wrapped in try/catch because localStorage throws in private
//     mode / when storage is disabled. All helpers degrade gracefully.

const PREFS_KEY = 'ert.preferences.v1';
const HISTORY_KEY = 'ert.history.v1';
const MAX_HISTORY_ENTRIES = 50;

const DEFAULT_PREFERENCES = {
  fontSize: 'medium', // 'small' | 'medium' | 'large'
  contrast: 'normal', // 'normal' | 'high'
  debugPoints: false, // show WebGazer prediction dots (debug only)
  lastMode: null, // last reading/activity mode used
};

/**
 * Whether a usable localStorage is available. Never throws.
 * @returns {boolean}
 */
function storageAvailable() {
  try {
    if (typeof localStorage === 'undefined' || localStorage == null) return false;
    const probe = '__ert_probe__';
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

/**
 * Load preferences, merged over defaults. Returns defaults on any failure.
 * @returns {typeof DEFAULT_PREFERENCES}
 */
export function loadPreferences() {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return { ...DEFAULT_PREFERENCES };
    const parsed = JSON.parse(raw);
    if (parsed == null || typeof parsed !== 'object') {
      return { ...DEFAULT_PREFERENCES };
    }
    return { ...DEFAULT_PREFERENCES, ...parsed };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

/**
 * Persist a partial set of preferences (merged over the stored ones).
 * @param {Partial<typeof DEFAULT_PREFERENCES>} partial
 * @returns {boolean} true on success
 */
export function savePreferences(partial) {
  try {
    const current = loadPreferences();
    const next = { ...current, ...(partial ?? {}) };
    localStorage.setItem(PREFS_KEY, JSON.stringify(next));
    return true;
  } catch {
    return false;
  }
}

/**
 * Load the summarized session history (most recent first). Empty on failure.
 * @returns {Array<Object>}
 */
export function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Append a SUMMARIZED session entry. Any raw-sample-like fields are stripped so
 * raw gaze data can never leak into persistent storage.
 *
 * @param {Object} summary e.g. { dateISO, mode, durationMs, episodeCount,
 *   medianEpisodeMs, trackingCoverage, verificationMedianErrorPx }
 * @returns {boolean} true on success
 */
export function addHistoryEntry(summary) {
  try {
    const clean = sanitizeSummary(summary);
    const history = loadHistory();
    history.unshift(clean);
    if (history.length > MAX_HISTORY_ENTRIES) {
      history.length = MAX_HISTORY_ENTRIES;
    }
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    return true;
  } catch {
    return false;
  }
}

/**
 * Strip any fields that could carry raw samples or identifiable data, keeping
 * only a small, safe, numeric/string summary.
 * @param {Object} summary
 * @returns {Object}
 */
function sanitizeSummary(summary) {
  const s = summary ?? {};
  return {
    dateISO: typeof s.dateISO === 'string' ? s.dateISO : new Date().toISOString(),
    mode: s.mode ?? null,
    durationMs: Number.isFinite(s.durationMs) ? s.durationMs : 0,
    episodeCount: Number.isFinite(s.episodeCount) ? s.episodeCount : 0,
    medianEpisodeMs: Number.isFinite(s.medianEpisodeMs) ? s.medianEpisodeMs : 0,
    trackingCoverage: Number.isFinite(s.trackingCoverage) ? s.trackingCoverage : null,
    verificationMedianErrorPx: Number.isFinite(s.verificationMedianErrorPx)
      ? s.verificationMedianErrorPx
      : null,
    // Intentionally NO raw samples, NO coordinates, NO video, NO names.
  };
}

/**
 * Clear ONLY the local history ("Apagar histórico local"). Preferences are kept.
 * @returns {boolean} true on success
 */
export function clearHistory() {
  try {
    localStorage.removeItem(HISTORY_KEY);
    return true;
  } catch {
    return false;
  }
}

/**
 * Clear everything this app stores (history + preferences).
 * @returns {boolean} true on success
 */
export function clearAll() {
  try {
    localStorage.removeItem(HISTORY_KEY);
    localStorage.removeItem(PREFS_KEY);
    return true;
  } catch {
    return false;
  }
}

export {
  PREFS_KEY,
  HISTORY_KEY,
  DEFAULT_PREFERENCES,
  MAX_HISTORY_ENTRIES,
  storageAvailable,
};
