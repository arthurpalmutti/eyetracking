// Pure episode detector for "afastamento visual" (visual departure from the
// reading area) and "retorno à área de leitura" (return).
//
// Geometric, non-clinical definitions:
//   - An "afastamento visual" episode is CONFIRMED only after the gaze stays
//     continuously 'outside' the reading area for >= outsideConfirmMs (1000ms).
//     The episode START is the first sample of that confirmed outside run.
//   - A RETURN is CONFIRMED only after the gaze stays continuously 'inside' for
//     >= returnConfirmMs (300ms). The episode END is the boundary of that
//     confirmed return (the first inside sample of the confirming run).
//
// Episodes are BROKEN (never merged) by tracking loss (a run of
// 'missing'/'outlier'), by a manual pause marker, or by a tab-hidden marker.
// 'missing'/'outlier' are NEVER counted as 'outside' and cannot start, extend,
// or bridge an outside run.
//
// Input: an ordered array of classified samples. Each sample is:
//   { elapsedMs:number, classification:'inside'|'outside'|'missing'|'outlier' }
// Interruption markers (optional, interleaved in the same ordered array):
//   { elapsedMs:number, marker:'pause'|'tabHidden' }

/**
 * @typedef {Object} Episode
 * @property {number} startElapsedMs first sample of the confirmed outside run
 * @property {number|null} endElapsedMs confirmed return boundary, or null if
 *   the episode never confirmed a return before termination
 * @property {number} durationMs time from start to end (or to termination)
 * @property {number|null} returnLatencyMs time from start to confirmed return,
 *   null when no return was confirmed
 * @property {string} terminationReason 'return' | 'trackingLoss' | 'pause'
 *   | 'tabHidden' | 'endOfData'
 */

const DEFAULT_THRESHOLDS = {
  outsideConfirmMs: 1000,
  returnConfirmMs: 300,
};

/**
 * Detect confirmed episodes over an ordered feed of classified samples.
 *
 * @param {Array<{elapsedMs:number,classification?:string,marker?:string}>} samples
 * @param {{outsideConfirmMs?:number,returnConfirmMs?:number}} [thresholds]
 * @returns {{episodes:Episode[]}}
 */
export function detectEpisodes(samples, thresholds = {}) {
  const outsideConfirmMs =
    thresholds.outsideConfirmMs ?? DEFAULT_THRESHOLDS.outsideConfirmMs;
  const returnConfirmMs =
    thresholds.returnConfirmMs ?? DEFAULT_THRESHOLDS.returnConfirmMs;

  /** @type {Episode[]} */
  const episodes = [];

  // Outside-run tracking (before an episode is confirmed).
  let outsideRunStart = null; // elapsedMs of first sample in current outside run
  let outsideRunLast = null; // elapsedMs of last sample in current outside run

  // Active (confirmed) episode tracking.
  let activeEpisode = null; // { startElapsedMs, lastOutsideMs }
  let insideRunStart = null; // elapsedMs of first sample in current inside run
  let insideRunLast = null; // elapsedMs of last inside sample

  function resetOutsideRun() {
    outsideRunStart = null;
    outsideRunLast = null;
  }

  function resetInsideRun() {
    insideRunStart = null;
    insideRunLast = null;
  }

  /**
   * Terminate the active episode (if any) without a confirmed return.
   * @param {number} atMs
   * @param {string} reason
   */
  function terminateActive(atMs, reason) {
    if (activeEpisode == null) return;
    episodes.push({
      startElapsedMs: activeEpisode.startElapsedMs,
      endElapsedMs: null,
      durationMs: atMs - activeEpisode.startElapsedMs,
      returnLatencyMs: null,
      terminationReason: reason,
    });
    activeEpisode = null;
    resetInsideRun();
  }

  for (const entry of samples) {
    // Interruption markers break any pending outside run and terminate any
    // active (confirmed) episode. They never merge runs across the break.
    if (entry.marker === 'pause' || entry.marker === 'tabHidden') {
      const reason = entry.marker;
      if (activeEpisode != null) {
        terminateActive(entry.elapsedMs, reason);
      }
      resetOutsideRun();
      resetInsideRun();
      continue;
    }

    const cls = entry.classification;
    const t = entry.elapsedMs;

    if (activeEpisode == null) {
      // --- Phase 1: looking for a confirmed outside run ---
      if (cls === 'outside') {
        if (outsideRunStart === null) {
          outsideRunStart = t;
        }
        outsideRunLast = t;

        if (outsideRunLast - outsideRunStart >= outsideConfirmMs) {
          // Episode confirmed; its start is the first sample of this run.
          activeEpisode = {
            startElapsedMs: outsideRunStart,
            lastOutsideMs: outsideRunLast,
          };
          resetOutsideRun();
          resetInsideRun();
        }
      } else {
        // Any non-outside sample (inside/missing/outlier) breaks the pending
        // outside run. missing/outlier never count as outside.
        resetOutsideRun();
      }
    } else {
      // --- Phase 2: episode active, looking for a confirmed return ---
      if (cls === 'inside') {
        if (insideRunStart === null) {
          insideRunStart = t;
        }
        insideRunLast = t;

        if (insideRunLast - insideRunStart >= returnConfirmMs) {
          // Return confirmed. The episode END boundary is the first sample of
          // the confirming inside run.
          const endMs = insideRunStart;
          episodes.push({
            startElapsedMs: activeEpisode.startElapsedMs,
            endElapsedMs: endMs,
            durationMs: endMs - activeEpisode.startElapsedMs,
            returnLatencyMs: endMs - activeEpisode.startElapsedMs,
            terminationReason: 'return',
          });
          activeEpisode = null;
          resetInsideRun();
          resetOutsideRun();
        }
      } else if (cls === 'outside') {
        // Still/again outside: any partial inside run is abandoned.
        activeEpisode.lastOutsideMs = t;
        resetInsideRun();
      } else {
        // missing / outlier => tracking loss breaks the episode.
        terminateActive(t, 'trackingLoss');
        resetOutsideRun();
      }
    }
  }

  // End of data: an active episode that never confirmed a return terminates.
  if (activeEpisode != null) {
    const lastMs =
      insideRunLast ?? activeEpisode.lastOutsideMs ?? activeEpisode.startElapsedMs;
    terminateActive(lastMs, 'endOfData');
  }

  return { episodes };
}

export { DEFAULT_THRESHOLDS };
