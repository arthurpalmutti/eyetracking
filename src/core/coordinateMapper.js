// Pure coordinate mapping for WebGazer predictions.
//
// Per the WebGazer 3.5.3 setGazeListener docs, the callback receives
// `function(gazeData, elapsedTime)` where gazeData is {x, y} expressed in
// client-area (viewport) CSS pixels, or null on tracking loss.
//
// We therefore treat {x, y} as viewport CSS pixels directly and do NOT apply
// any arbitrary devicePixelRatio or scroll offset conversions. The 5-target
// verification step (a later UI feature) is what catches gross mapping errors.

const DEFAULT_OUTLIER_MARGIN = 200; // px allowed beyond each viewport edge

/**
 * Normalize a WebGazer prediction into viewport CSS pixels.
 *
 * @param {{x:number,y:number}|null} prediction raw gazeData from WebGazer
 * @param {{width:number,height:number,outlierMargin?:number}} viewport
 * @returns {{x:number,y:number,outlier:boolean}|null}
 *   null when the prediction is null (tracking loss / missing).
 *   Otherwise {x, y, outlier} where outlier is true for non-finite values or
 *   coordinates far outside reasonable viewport bounds.
 */
export function normalizeGaze(prediction, viewport) {
  if (prediction == null) return null;

  const { x, y } = prediction;
  const width = viewport?.width ?? 0;
  const height = viewport?.height ?? 0;
  const margin = viewport?.outlierMargin ?? DEFAULT_OUTLIER_MARGIN;

  // Non-finite coordinates are always outliers.
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return { x, y, outlier: true };
  }

  const outlier =
    x < -margin ||
    x > width + margin ||
    y < -margin ||
    y > height + margin;

  return { x, y, outlier };
}

export { DEFAULT_OUTLIER_MARGIN };
