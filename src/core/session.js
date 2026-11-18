// Session pipeline: connective logic between live gaze predictions and the
// pure core modules (sampler, coordinateMapper, aoi, episodeDetector).
//
// This module is deliberately framework-free and injectable so it can be driven
// by app.js in the browser AND exercised deterministically in tests:
//   - The clock is injectable (defaults to performance.now via time.js).
//   - The reading-area rect is supplied by a getRect() callback (so the caller
//     can return element.getBoundingClientRect() live, or a plain object).
//   - The viewport dimensions are supplied by a getViewport() callback.
//
// It does NOT import webgazer. Live predictions arrive through onGaze(data,
// elapsed), where `data` is {x,y} client pixels or null, exactly as the
// gazeTracker wrapper forwards them.
//
// Responsibilities:
//   - Throttle incoming predictions to ~10 Hz (100 ms) via createSampler.
//   - Build per-sample records with raw + normalized coords, trackingStatus
//     (valid/missing/outlier), insideReadingArea (true/false/null), viewport.
//   - Feed classified samples incrementally to the episode detector input.
//   - Detect callback stalls (> stallGapMs, default 500 ms): the gap is marked
//     as tracking loss, distinct from "outside".
//   - On tab-hidden: pause tracking + stop the clock + record a pause event,
//     and require an explicit resume() call; record pause/resume events.

import { createSampler } from './sampler.js';
import { normalizeGaze } from './coordinateMapper.js';
import { classifyPoint, createMovingMedian } from './aoi.js';
import { defaultClock } from '../utils/time.js';

const DEFAULT_STALL_GAP_MS = 500;
const DEFAULT_INTERVAL_MS = 100;

/**
 * @typedef {Object} SessionSample
 * @property {number} elapsedMs monotonic ms since active start (pauses excluded)
 * @property {string} timestampISO wall-clock ISO timestamp
 * @property {number|null} rawX raw WebGazer x (client px), null when missing
 * @property {number|null} rawY raw WebGazer y (client px), null when missing
 * @property {number|null} filteredX smoothed x used for AOI, null when missing
 * @property {number|null} filteredY smoothed y used for AOI, null when missing
 * @property {'valid'|'missing'|'outlier'} trackingStatus
 * @property {boolean|null} insideReadingArea true/false, or null when not valid
 * @property {number} viewportWidth
 * @property {number} viewportHeight
 */

/**
 * Create a session pipeline.
 *
 * @param {Object} opts
 * @param {() => {left:number,top:number,right:number,bottom:number}} opts.getRect
 *   returns the reading-area rect in viewport CSS pixels (e.g. getBoundingClientRect).
 * @param {() => {width:number,height:number}} opts.getViewport
 *   returns current viewport width/height.
 * @param {() => number} [opts.clock] monotonic clock (ms). Defaults to performance.now.
 * @param {number} [opts.intervalMs=100] sampling interval.
 * @param {number} [opts.stallGapMs=500] gap after which a stall => tracking loss.
 * @param {(event:{type:string,elapsedMs:number,wallISO:string})=>void} [opts.onEvent]
 *   optional observer for pause/resume/trackingLoss events.
 * @returns {Object} the session controller.
 */
export function createSession({
  getRect,
  getViewport,
  clock = defaultClock,
  intervalMs = DEFAULT_INTERVAL_MS,
  stallGapMs = DEFAULT_STALL_GAP_MS,
  onEvent,
} = {}) {
  const sampler = createSampler({ intervalMs });
  const smoother = createMovingMedian(3);

  /** @type {SessionSample[]} */
  const samples = [];
  /** @type {Array<{elapsedMs:number,classification?:string,marker?:string}>} */
  const classifiedFeed = []; // ordered input for episodeDetector
  /** @type {Array<{startElapsedMs:number,endElapsedMs:number|null,reason:string}>} */
  const trackingLossPeriods = [];
  /** @type {Array<{pauseElapsedMs:number,resumeElapsedMs:number|null,reason:string}>} */
  const pauses = [];

  let running = false;
  let paused = false;

  // Monotonic time bookkeeping so pauses do not inflate elapsed time.
  let startClock = 0; // clock() value when (re)started
  let accumulatedActiveMs = 0; // active ms accrued before the current run segment
  let lastCallbackClock = null; // clock() of the last processed onGaze
  let inTrackingLoss = false;
  let currentLoss = null; // { startElapsedMs }

  function nowActiveMs() {
    if (!running || paused) return accumulatedActiveMs;
    return accumulatedActiveMs + (clock() - startClock);
  }

  function emit(type) {
    const evt = {
      type,
      elapsedMs: nowActiveMs(),
      wallISO: new Date().toISOString(),
    };
    if (typeof onEvent === 'function') onEvent(evt);
    return evt;
  }

  function openTrackingLoss(atMs, reason) {
    if (inTrackingLoss) return;
    inTrackingLoss = true;
    currentLoss = { startElapsedMs: atMs, reason };
  }

  function closeTrackingLoss(atMs) {
    if (!inTrackingLoss) return;
    trackingLossPeriods.push({
      startElapsedMs: currentLoss.startElapsedMs,
      endElapsedMs: atMs,
      reason: currentLoss.reason,
    });
    inTrackingLoss = false;
    currentLoss = null;
  }

  return {
    /** Start (or restart) the active session. */
    start() {
      running = true;
      paused = false;
      startClock = clock();
      accumulatedActiveMs = 0;
      lastCallbackClock = null;
      inTrackingLoss = false;
      currentLoss = null;
      sampler.reset();
      smoother.reset();
      samples.length = 0;
      classifiedFeed.length = 0;
      trackingLossPeriods.length = 0;
      pauses.length = 0;
    },

    /**
     * Handle one live gaze prediction. Mirrors the gazeTracker onGaze contract.
     *
     * @param {{x:number,y:number}|null} data raw gazeData ({x,y} client px) or null
     * @param {number} [elapsedFromWebgazer] elapsedTime arg from WebGazer (unused
     *   for timing; we use our own paused-aware clock).
     */
    onGaze(data /*, elapsedFromWebgazer */) {
      if (!running || paused) return;

      const tNow = clock();
      const elapsedMs = nowActiveMs();

      // Stall detection: if the previous callback was long ago, the silent gap
      // is tracking loss (NOT "outside"). WebGazer stops calling back when it
      // loses the face, so we only learn of a stall on the next callback.
      if (lastCallbackClock != null && tNow - lastCallbackClock >= stallGapMs) {
        const gapStart = elapsedMs - (tNow - lastCallbackClock);
        openTrackingLoss(gapStart, 'stall');
        classifiedFeed.push({ elapsedMs: gapStart, classification: 'missing' });
        // The smoother should not bridge across a stall.
        smoother.reset();
      }
      lastCallbackClock = tNow;

      // Throttle to ~10 Hz. We still track stalls on every callback above.
      if (!sampler.shouldSample(elapsedMs)) return;

      const viewport = getViewport ? getViewport() : { width: 0, height: 0 };
      const rect = getRect ? getRect() : null;

      const normalized = normalizeGaze(data, viewport);

      let trackingStatus;
      let insideReadingArea;
      let filteredX = null;
      let filteredY = null;

      if (normalized == null) {
        // Null prediction => missing (tracking loss), never "outside".
        trackingStatus = 'missing';
        insideReadingArea = null;
        smoother.reset();
      } else if (normalized.outlier) {
        trackingStatus = 'outlier';
        insideReadingArea = null;
      } else {
        trackingStatus = 'valid';
        const smoothed = smoother.push(normalized);
        if (smoothed) {
          filteredX = smoothed.x;
          filteredY = smoothed.y;
        }
      }

      // Classify for AOI using the smoothed point (falls back to raw normalized).
      let classification;
      if (trackingStatus === 'missing') {
        classification = 'missing';
      } else if (trackingStatus === 'outlier') {
        classification = 'outlier';
      } else {
        const pointForAoi =
          filteredX != null && filteredY != null
            ? { x: filteredX, y: filteredY }
            : normalized;
        classification = rect ? classifyPoint(pointForAoi, rect) : 'missing';
        if (classification === 'inside') insideReadingArea = true;
        else if (classification === 'outside') insideReadingArea = false;
        else insideReadingArea = null; // outlier/missing fallback
      }

      // Tracking-loss period bookkeeping based on classification.
      if (classification === 'missing' || classification === 'outlier') {
        openTrackingLoss(elapsedMs, classification);
      } else {
        closeTrackingLoss(elapsedMs);
      }

      /** @type {SessionSample} */
      const sample = {
        elapsedMs,
        timestampISO: new Date().toISOString(),
        rawX: normalized == null ? null : (data ? data.x : null),
        rawY: normalized == null ? null : (data ? data.y : null),
        filteredX,
        filteredY,
        trackingStatus,
        insideReadingArea:
          insideReadingArea === undefined ? null : insideReadingArea,
        viewportWidth: viewport.width,
        viewportHeight: viewport.height,
      };

      samples.push(sample);
      classifiedFeed.push({ elapsedMs, classification });
    },

    /**
     * Pause the session: freeze the clock, record a pause event, and break any
     * pending episode run via a 'pause' marker in the classified feed. Requires
     * an explicit resume() to continue.
     *
     * @param {string} [reason='manual'] 'manual' | 'tabHidden'
     */
    pause(reason = 'manual') {
      if (!running || paused) return;
      // Freeze accumulated active time.
      accumulatedActiveMs += clock() - startClock;
      paused = true;
      const atMs = accumulatedActiveMs;
      closeTrackingLoss(atMs);
      classifiedFeed.push({ elapsedMs: atMs, marker: 'pause' });
      pauses.push({ pauseElapsedMs: atMs, resumeElapsedMs: null, reason });
      emit('pause');
    },

    /** Explicit resume after a pause; records a resume event. */
    resume() {
      if (!running || !paused) return;
      paused = false;
      startClock = clock();
      lastCallbackClock = null; // avoid a false stall across the pause boundary
      smoother.reset();
      sampler.reset();
      const last = pauses[pauses.length - 1];
      if (last && last.resumeElapsedMs == null) {
        last.resumeElapsedMs = accumulatedActiveMs;
      }
      emit('resume');
    },

    /**
     * Convenience handler for document.visibilitychange: when hidden, pause with
     * reason 'tabHidden'. Returning to visible does NOT auto-resume: the spec
     * requires an explicit user action, so the caller invokes resume() itself.
     *
     * @param {'hidden'|'visible'} visibilityState
     */
    handleVisibilityChange(visibilityState) {
      if (visibilityState === 'hidden') {
        this.pause('tabHidden');
      }
    },

    /** Stop the session, closing any open tracking-loss period. */
    stop() {
      if (!running) return;
      if (!paused) {
        accumulatedActiveMs += clock() - startClock;
      }
      closeTrackingLoss(accumulatedActiveMs);
      running = false;
      paused = false;
    },

    // --- Accessors (read-only snapshots) ---
    getSamples() {
      return samples.slice();
    },
    getClassifiedFeed() {
      return classifiedFeed.slice();
    },
    getTrackingLossPeriods() {
      return trackingLossPeriods.slice();
    },
    getPauses() {
      return pauses.slice();
    },
    getActiveDurationMs() {
      return nowActiveMs();
    },
    isRunning() {
      return running;
    },
    isPaused() {
      return paused;
    },
  };
}

export { DEFAULT_STALL_GAP_MS, DEFAULT_INTERVAL_MS };
