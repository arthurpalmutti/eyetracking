// Pure (as far as possible) calibration geometry and verification math.
//
// Two phases, matching the spec:
//   1. Guided 9-point CLICK calibration (3x3 grid, with margins) - the user
//      clicks each point so WebGazer can map eye features to screen position.
//   2. 5-target NO-CLICK verification - targets are shown one at a time and we
//      collect gaze predictions, then estimate the error (in px) between each
//      target center and the MEDIAN of the predicted coordinates.
//
// The point LAYOUTS are expressed as fractions of the usable viewport so the UI
// can place them at any size. The ERROR math is pure: it takes arrays of
// predictions and target centers and returns numbers, so it is unit-testable in
// a node environment with no DOM and no camera.
//
// These are geometric/statistical measurements only. They say nothing about
// attention, focus, distraction, or any clinical condition.

import { median } from '../utils/time.js';

// Fractional margin kept away from each viewport edge so points are not placed
// right at the screen border (which is hard to look at / click accurately).
const DEFAULT_MARGIN_FRACTION = 0.1;

// Error (in px) at or above which we surface a non-blocking "high error" warning.
const DEFAULT_HIGH_ERROR_PX = 150;

// Minimum valid predictions per target to consider a target's error reliable.
const DEFAULT_MIN_SAMPLES_PER_TARGET = 5;

/**
 * The 9 calibration points as {x,y} fractions of the usable area, laid out on a
 * 3x3 grid between `margin` and `1 - margin` on each axis.
 *
 * @param {number} [margin=DEFAULT_MARGIN_FRACTION]
 * @returns {Array<{id:string,fx:number,fy:number}>}
 */
export function getCalibrationPoints(margin = DEFAULT_MARGIN_FRACTION) {
  const positions = [margin, 0.5, 1 - margin];
  const points = [];
  let i = 1;
  for (const fy of positions) {
    for (const fx of positions) {
      points.push({ id: `cal-${i}`, fx, fy });
      i += 1;
    }
  }
  return points; // 9 points
}

/**
 * The 5 verification targets as {x,y} fractions: center + 4 offset points
 * (upper-left, upper-right, lower-left, lower-right), inside the margins.
 *
 * @param {number} [margin=DEFAULT_MARGIN_FRACTION]
 * @returns {Array<{id:string,fx:number,fy:number}>}
 */
export function getVerificationTargets(margin = DEFAULT_MARGIN_FRACTION) {
  const lo = margin;
  const hi = 1 - margin;
  return [
    { id: 'ver-center', fx: 0.5, fy: 0.5 },
    { id: 'ver-tl', fx: lo, fy: lo },
    { id: 'ver-tr', fx: hi, fy: lo },
    { id: 'ver-bl', fx: lo, fy: hi },
    { id: 'ver-br', fx: hi, fy: hi },
  ];
}

/**
 * Convert a fractional point into absolute viewport CSS pixels.
 *
 * @param {{fx:number,fy:number}} point
 * @param {{width:number,height:number}} viewport
 * @returns {{x:number,y:number}}
 */
export function toViewportPixels(point, viewport) {
  return {
    x: point.fx * (viewport?.width ?? 0),
    y: point.fy * (viewport?.height ?? 0),
  };
}

/**
 * Euclidean distance between two points.
 * @param {{x:number,y:number}} a
 * @param {{x:number,y:number}} b
 * @returns {number}
 */
function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * Keep only finite, non-null {x,y} predictions.
 * @param {Array<{x:number,y:number}|null>} predictions
 * @returns {Array<{x:number,y:number}>}
 */
function validPredictions(predictions) {
  if (!Array.isArray(predictions)) return [];
  return predictions.filter(
    (p) => p != null && Number.isFinite(p.x) && Number.isFinite(p.y),
  );
}

/**
 * Compute the estimated error for a single verification target: the distance in
 * px between the target center and the MEDIAN of the valid predicted
 * coordinates (median of x and median of y computed independently).
 *
 * @param {{center:{x:number,y:number}, predictions:Array<{x:number,y:number}|null>}} target
 * @returns {{id?:string, center:{x:number,y:number}, medianPrediction:{x:number,y:number}|null, errorPx:number|null, sampleCount:number}}
 */
export function computeTargetError(target) {
  const center = target.center;
  const valid = validPredictions(target.predictions);
  if (valid.length === 0) {
    return {
      id: target.id,
      center,
      medianPrediction: null,
      errorPx: null,
      sampleCount: 0,
    };
  }
  const medianPrediction = {
    x: median(valid.map((p) => p.x)),
    y: median(valid.map((p) => p.y)),
  };
  return {
    id: target.id,
    center,
    medianPrediction,
    errorPx: distance(center, medianPrediction),
    sampleCount: valid.length,
  };
}

/**
 * Compute the overall verification error across all targets.
 *
 * For each target, the per-target error is the px distance between the target
 * center and the median predicted coordinate. The overall estimated error is
 * the MEDIAN of the per-target errors.
 *
 * @param {Array<{id?:string, center:{x:number,y:number}, predictions:Array<{x:number,y:number}|null>}>} targets
 * @returns {{
 *   perTarget:Array<{id?:string,center:{x:number,y:number},medianPrediction:{x:number,y:number}|null,errorPx:number|null,sampleCount:number}>,
 *   medianErrorPx:number|null,
 *   totalSamples:number
 * }}
 */
export function computeVerificationError(targets) {
  const list = Array.isArray(targets) ? targets : [];
  const perTarget = list.map((t) => computeTargetError(t));
  const errors = perTarget
    .map((t) => t.errorPx)
    .filter((e) => e != null && Number.isFinite(e));
  const totalSamples = perTarget.reduce((acc, t) => acc + t.sampleCount, 0);
  return {
    perTarget,
    medianErrorPx: errors.length === 0 ? null : median(errors),
    totalSamples,
  };
}

/**
 * Decide whether to show a NON-BLOCKING warning after verification. The user is
 * never blocked; this only informs them that the estimate may be unreliable.
 *
 * @param {{perTarget:Array<{errorPx:number|null,sampleCount:number}>, medianErrorPx:number|null}} result
 * @param {{highErrorPx?:number, minSamplesPerTarget?:number}} [options]
 * @returns {{warn:boolean, level:'none'|'info'|'warning', reasons:string[], message:string|null}}
 */
export function evaluateVerification(result, options = {}) {
  const highErrorPx = options.highErrorPx ?? DEFAULT_HIGH_ERROR_PX;
  const minSamplesPerTarget =
    options.minSamplesPerTarget ?? DEFAULT_MIN_SAMPLES_PER_TARGET;

  const perTarget = result?.perTarget ?? [];
  const reasons = [];

  // Too few samples: any target with no data, or below the minimum.
  const targetsWithTooFew = perTarget.filter(
    (t) => t.sampleCount < minSamplesPerTarget,
  );
  if (perTarget.length === 0 || result?.medianErrorPx == null) {
    reasons.push(
      'Não foi possível estimar o erro: nenhuma previsão válida foi coletada na verificação.',
    );
  } else if (targetsWithTooFew.length > 0) {
    reasons.push(
      `Poucas amostras em ${targetsWithTooFew.length} de ${perTarget.length} alvos (mínimo sugerido: ${minSamplesPerTarget} por alvo). A estimativa de erro pode ser pouco confiável.`,
    );
  }

  // High error.
  if (
    result?.medianErrorPx != null &&
    Number.isFinite(result.medianErrorPx) &&
    result.medianErrorPx >= highErrorPx
  ) {
    reasons.push(
      `Erro mediano estimado de ${Math.round(result.medianErrorPx)} px (limite sugerido: ${highErrorPx} px). Recomenda-se refazer a calibração para melhorar a precisão.`,
    );
  }

  const warn = reasons.length > 0;
  return {
    warn,
    level: warn ? 'warning' : 'none',
    reasons,
    message: warn ? reasons.join(' ') : null,
  };
}

export {
  DEFAULT_MARGIN_FRACTION,
  DEFAULT_HIGH_ERROR_PX,
  DEFAULT_MIN_SAMPLES_PER_TARGET,
};
