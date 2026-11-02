// Pure Area-Of-Interest (AOI) classification.
//
// Classifies an estimated gaze point relative to the reading area rectangle.
// The rect is a getBoundingClientRect-style object with left/top/right/bottom
// (width/height optional). Classification is purely geometric: it never claims
// anything about attention, focus, distraction, or any clinical condition.

/**
 * @typedef {'inside'|'outside'|'missing'|'outlier'} AoiClassification
 */

/**
 * @typedef {Object} GazePoint
 * @property {number} x viewport CSS pixels
 * @property {number} y viewport CSS pixels
 * @property {boolean} [outlier] marked by the coordinate mapper
 */

/**
 * Classify a (possibly null) gaze point against the reading-area rect.
 *
 * @param {GazePoint|null} point normalized gaze point, or null (no prediction)
 * @param {{left:number,top:number,right:number,bottom:number}} rect
 * @returns {AoiClassification}
 *   'missing'  -> point is null (tracking loss / no prediction)
 *   'outlier'  -> point flagged as outlier by the coordinate mapper
 *   'inside'   -> x within [left,right] AND y within [top,bottom]
 *   'outside'  -> a valid point that falls outside the rect
 */
export function classifyPoint(point, rect) {
  if (point == null) return 'missing';
  if (point.outlier === true) return 'outlier';
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return 'outlier';

  const { x, y } = point;
  const inside =
    x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;

  return inside ? 'inside' : 'outside';
}

/**
 * Create a moving-median smoother over the last N valid gaze points.
 *
 * Used ONLY to stabilize AOI classification; raw coordinates must be kept
 * separately by the caller. Only valid points (non-null, non-outlier, finite)
 * update the window. `push` returns the smoothed {x,y} point, or null when no
 * valid point has been seen yet.
 *
 * @param {number} [windowSize=3]
 * @returns {{push:(point:GazePoint|null)=>({x:number,y:number}|null), reset:()=>void}}
 */
export function createMovingMedian(windowSize = 3) {
  /** @type {{x:number,y:number}[]} */
  let windowPoints = [];

  function medianOf(nums) {
    const sorted = [...nums].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) {
      return (sorted[mid - 1] + sorted[mid]) / 2;
    }
    return sorted[mid];
  }

  return {
    push(point) {
      const valid =
        point != null &&
        point.outlier !== true &&
        Number.isFinite(point.x) &&
        Number.isFinite(point.y);

      if (!valid) {
        // Invalid points do not update the window; return last smoothed value.
        if (windowPoints.length === 0) return null;
        return {
          x: medianOf(windowPoints.map((p) => p.x)),
          y: medianOf(windowPoints.map((p) => p.y)),
        };
      }

      windowPoints.push({ x: point.x, y: point.y });
      if (windowPoints.length > windowSize) {
        windowPoints.shift();
      }
      return {
        x: medianOf(windowPoints.map((p) => p.x)),
        y: medianOf(windowPoints.map((p) => p.y)),
      };
    },
    reset() {
      windowPoints = [];
    },
  };
}
