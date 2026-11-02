// Isolated WebGazer.js service wrapper.
//
// This is the ONLY module in the project that imports webgazer. All other code
// must go through this wrapper so the WebGazer dependency stays contained and
// swappable.
//
// WebGazer 3.5.3 contract (from the official Top-Level-API wiki):
//   - setGazeListener((gazeData, elapsedTime) => ...) where gazeData is {x, y}
//     expressed in CLIENT-AREA (viewport) CSS PIXELS, or null on tracking loss.
//     A null gazeData means missing/tracking loss, NOT "looking outside".
//   - begin() starts tracking and obtains the camera; pause()/resume()/end();
//     detectCompatibility(); getCurrentPrediction() -> {x,y} or null.
//   - Display toggles: showVideo(bool), showFaceOverlay(bool),
//     showFaceFeedbackBox(bool), showPredictionPoints(bool).
//   - Settings: saveDataAcrossSessions(bool), applyKalmanFilter(bool).
//
// Only the documented 3.5.3 methods above are used; no method names are invented.
//
// Privacy / ethics: the webcam is processed in the browser only. Video is never
// recorded, stored, or transmitted. The microphone is NEVER requested.
//
// Single camera owner: WebGazer's begin() owns the one live camera stream for
// the whole session. Before begin() we do a brief video-only getUserMedia probe
// purely to surface an explicit, clear pt-BR permission error up front, and we
// stop that probe's tracks immediately so it never lingers as a second live
// camera handle. On end() we clear the gaze listener, call webgazer.end() (which
// stops WebGazer's stream), and defensively stop any MediaStream tracks this
// module might still own so the camera indicator light turns off.
//
// License note: WebGazer.js is distributed under GPL-3.0-or-later. See
// THIRD_PARTY_NOTICES.md.

// The bare `webgazer` specifier is aliased in vite.config.js to WebGazer's own
// prebuilt, webpack-minified UMD bundle (dist/webgazer.commonjs2.js) instead of
// its raw ESM `module` entry. That avoids esbuild re-minifying WebGazer's
// TensorFlow.js graph, which otherwise mangled internals and threw
// `z2 is not a function` from begin() in the production build. The commonjs2
// bundle exports `{ webgazer }`, so unwrap that single property; fall back to
// the module itself if a future build exposes the object directly.
import webgazerModule from 'webgazer';

const webgazer =
  webgazerModule && webgazerModule.webgazer ? webgazerModule.webgazer : webgazerModule;

/**
 * @typedef {Object} GazeTracker
 * @property {(opts:{onGaze:(data:{x:number,y:number}|null, elapsed:number)=>void})=>Promise<void>} init
 * @property {(visible:boolean)=>void} showVideo
 * @property {(visible:boolean)=>void} showFaceOverlay
 * @property {(visible:boolean)=>void} showFaceFeedbackBox
 * @property {(enabled:boolean)=>void} setDebugPoints
 * @property {()=>void} pause
 * @property {()=>void} resume
 * @property {()=>{x:number,y:number}|null} getCurrentPrediction
 * @property {()=>Promise<void>} end
 * @property {()=>boolean} isCompatible
 */

/**
 * Check browser compatibility for camera-based gaze tracking without starting
 * anything. Returns an object describing what is (un)available so callers can
 * show a pt-BR message. Never throws.
 *
 * @returns {{compatible:boolean, hasMediaDevices:boolean, reason:string|null}}
 */
export function checkCompatibility() {
  const hasMediaDevices =
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === 'function';

  let webgazerCompatible = true;
  try {
    if (typeof webgazer.detectCompatibility === 'function') {
      webgazerCompatible = webgazer.detectCompatibility() !== false;
    }
  } catch {
    webgazerCompatible = false;
  }

  if (!hasMediaDevices) {
    return {
      compatible: false,
      hasMediaDevices: false,
      reason:
        'Este navegador não expõe navigator.mediaDevices. Use um navegador com suporte à câmera (ex.: Chrome) em um contexto seguro (https ou localhost).',
    };
  }

  if (!webgazerCompatible) {
    return {
      compatible: false,
      hasMediaDevices: true,
      reason:
        'O WebGazer indicou que este navegador não é compatível com o rastreamento ocular.',
    };
  }

  return { compatible: true, hasMediaDevices: true, reason: null };
}

/**
 * Create the gaze tracker wrapper. Stateful (drives the WebGazer singleton,
 * which owns the single live camera stream), but keeps that state local to
 * this module.
 *
 * @returns {GazeTracker}
 */
export function createGazeTracker() {
  /**
   * Any MediaStream this module still owns. WebGazer owns the live session
   * stream; this reference exists only so end() can defensively stop any stray
   * tracks (e.g. a permission probe that failed to stop). Normally null.
   * @type {MediaStream|null}
   */
  let ownedStream = null;
  let started = false;

  /**
   * Surface the camera-permission prompt with a clear pt-BR error BEFORE
   * webgazer.begin() runs. We open a brief video-only (never audio) probe and
   * stop its tracks immediately, so WebGazer's begin() remains the single owner
   * of the live camera stream and no second handle is left running.
   *
   * @returns {Promise<void>}
   */
  async function ensureCameraPermission() {
    if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
      throw new Error('navigator.mediaDevices.getUserMedia indisponível.');
    }
    // video only, NEVER audio.
    const probe = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    ownedStream = probe;
    // Release the probe immediately; WebGazer.begin() will open the real stream.
    stopOwnedStream();
  }

  /**
   * Stop and release any MediaStream tracks this module still owns so the camera
   * light turns off. Safe to call multiple times.
   */
  function stopOwnedStream() {
    if (ownedStream) {
      try {
        ownedStream.getTracks().forEach((track) => track.stop());
      } catch {
        // ignore track-stop errors during teardown
      }
      ownedStream = null;
    }
  }

  return {
    /**
     * Initialize WebGazer: verify compatibility, prompt for camera permission
     * (video only), wire the gaze listener, apply settings, and begin tracking.
     * WebGazer.begin() owns the single live camera stream.
     *
     * @param {{onGaze:(data:{x:number,y:number}|null, elapsed:number)=>void}} opts
     * @returns {Promise<void>}
     */
    async init({ onGaze } = {}) {
      const compat = checkCompatibility();
      if (!compat.compatible) {
        throw new Error(compat.reason || 'Navegador incompatível com o rastreamento ocular.');
      }
      if (typeof onGaze !== 'function') {
        throw new Error('init requer uma função onGaze.');
      }

      // Explicit camera permission prompt (video only); probe stream is
      // released immediately so WebGazer owns the single live camera stream.
      await ensureCameraPermission();

      // Privacy / configuration defaults.
      webgazer.saveDataAcrossSessions(false);
      webgazer.applyKalmanFilter(true);
      webgazer.showPredictionPoints(false);

      // gazeData is {x,y} client pixels or null; forward as-is to the pipeline.
      webgazer.setGazeListener((gazeData, elapsedTime) => {
        onGaze(gazeData, elapsedTime);
      });

      await webgazer.begin();
      started = true;
    },

    /** Toggle the small webcam preview. */
    showVideo(visible) {
      webgazer.showVideo(!!visible);
    },

    /** Toggle the face mesh overlay (useful during calibration). */
    showFaceOverlay(visible) {
      webgazer.showFaceOverlay(!!visible);
    },

    /** Toggle the face feedback box (useful during calibration). */
    showFaceFeedbackBox(visible) {
      webgazer.showFaceFeedbackBox(!!visible);
    },

    /**
     * Debug-only: show/hide the red prediction dots. Off by default.
     * @param {boolean} enabled
     */
    setDebugPoints(enabled) {
      webgazer.showPredictionPoints(!!enabled);
    },

    /** Pause tracking (keeps the model/camera; use for tab-hidden/manual pause). */
    pause() {
      webgazer.pause();
    },

    /** Resume tracking after a pause. */
    resume() {
      webgazer.resume();
    },

    /**
     * Current one-off prediction, or null. Mostly useful for the verification
     * step; the live pipeline uses the gaze listener instead.
     * @returns {{x:number,y:number}|null}
     */
    getCurrentPrediction() {
      const p = webgazer.getCurrentPrediction();
      return p == null ? null : { x: p.x, y: p.y };
    },

    /**
     * Fully tear down: clear the gaze listener, end WebGazer (which stops its
     * live camera stream), and defensively stop any MediaStream tracks this
     * module might still own so the camera indicator turns off.
     * @returns {Promise<void>}
     */
    async end() {
      try {
        webgazer.clearGazeListener();
      } catch {
        // ignore
      }
      try {
        await webgazer.end();
      } catch {
        // ignore end() errors during teardown
      }
      stopOwnedStream();
      started = false;
    },

    /** Whether begin() has been called and not yet ended. */
    isStarted() {
      return started;
    },
  };
}
