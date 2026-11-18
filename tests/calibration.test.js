import { describe, it, expect } from 'vitest';
import {
  getCalibrationPoints,
  getVerificationTargets,
  toViewportPixels,
  computeTargetError,
  computeVerificationError,
  evaluateVerification,
  DEFAULT_HIGH_ERROR_PX,
} from '../src/core/calibration.js';

describe('calibration layout', () => {
  it('defines exactly 9 calibration points on a 3x3 grid within margins', () => {
    const points = getCalibrationPoints(0.1);
    expect(points).toHaveLength(9);
    const xs = [...new Set(points.map((p) => p.fx))].sort((a, b) => a - b);
    const ys = [...new Set(points.map((p) => p.fy))].sort((a, b) => a - b);
    expect(xs).toEqual([0.1, 0.5, 0.9]);
    expect(ys).toEqual([0.1, 0.5, 0.9]);
  });

  it('defines exactly 5 verification targets (center + 4 corners)', () => {
    const targets = getVerificationTargets(0.1);
    expect(targets).toHaveLength(5);
    expect(targets.some((t) => t.fx === 0.5 && t.fy === 0.5)).toBe(true);
  });

  it('converts fractional points to viewport pixels', () => {
    expect(toViewportPixels({ fx: 0.5, fy: 0.5 }, { width: 1000, height: 800 })).toEqual({
      x: 500,
      y: 400,
    });
  });
});

describe('computeTargetError', () => {
  it('uses the MEDIAN of predictions per target (robust to outliers)', () => {
    const target = {
      id: 't1',
      center: { x: 100, y: 100 },
      // median x = 110, median y = 100 -> error = hypot(10, 0) = 10
      predictions: [
        { x: 90, y: 90 },
        { x: 110, y: 100 },
        { x: 130, y: 110 },
        { x: 10000, y: 10000 }, // outlier should not dominate the median
      ],
    };
    const res = computeTargetError(target);
    expect(res.medianPrediction.x).toBe(120); // median of [90,110,130,10000] = (110+130)/2
    expect(res.sampleCount).toBe(4);
    expect(res.errorPx).toBeGreaterThan(0);
  });

  it('returns null error and zero samples when no valid predictions', () => {
    const res = computeTargetError({
      id: 'empty',
      center: { x: 0, y: 0 },
      predictions: [null, { x: NaN, y: 1 }],
    });
    expect(res.errorPx).toBeNull();
    expect(res.medianPrediction).toBeNull();
    expect(res.sampleCount).toBe(0);
  });
});

describe('computeVerificationError', () => {
  it('reports the MEDIAN of per-target errors as the overall error', () => {
    // Three targets with per-target errors 10, 20, 30 -> overall median 20.
    const targets = [
      { id: 'a', center: { x: 0, y: 0 }, predictions: [{ x: 10, y: 0 }] }, // err 10
      { id: 'b', center: { x: 0, y: 0 }, predictions: [{ x: 20, y: 0 }] }, // err 20
      { id: 'c', center: { x: 0, y: 0 }, predictions: [{ x: 30, y: 0 }] }, // err 30
    ];
    const res = computeVerificationError(targets);
    expect(res.perTarget).toHaveLength(3);
    expect(res.medianErrorPx).toBe(20);
    expect(res.totalSamples).toBe(3);
  });

  it('ignores targets with no valid predictions when computing overall error', () => {
    const targets = [
      { id: 'a', center: { x: 0, y: 0 }, predictions: [{ x: 10, y: 0 }] },
      { id: 'b', center: { x: 0, y: 0 }, predictions: [null] },
    ];
    const res = computeVerificationError(targets);
    expect(res.medianErrorPx).toBe(10);
  });

  it('returns null overall error when no target has valid predictions', () => {
    const res = computeVerificationError([
      { id: 'a', center: { x: 0, y: 0 }, predictions: [] },
    ]);
    expect(res.medianErrorPx).toBeNull();
  });
});

describe('evaluateVerification (non-blocking warnings)', () => {
  it('does not warn for low error with enough samples', () => {
    const many = Array.from({ length: 6 }, () => ({ x: 5, y: 0 }));
    const targets = [
      { id: 'c', center: { x: 0, y: 0 }, predictions: many },
    ];
    const result = computeVerificationError(targets);
    const evaln = evaluateVerification(result, { minSamplesPerTarget: 5 });
    expect(evaln.warn).toBe(false);
    expect(evaln.level).toBe('none');
    expect(evaln.message).toBeNull();
  });

  it('warns on too-few samples per target without blocking', () => {
    const targets = [
      { id: 'c', center: { x: 0, y: 0 }, predictions: [{ x: 5, y: 0 }] }, // 1 sample
    ];
    const result = computeVerificationError(targets);
    const evaln = evaluateVerification(result, { minSamplesPerTarget: 5 });
    expect(evaln.warn).toBe(true);
    expect(evaln.reasons.join(' ')).toMatch(/[Pp]oucas amostras/);
  });

  it('warns on high median error without blocking', () => {
    const preds = Array.from({ length: 6 }, () => ({ x: DEFAULT_HIGH_ERROR_PX + 50, y: 0 }));
    const targets = [
      { id: 'c', center: { x: 0, y: 0 }, predictions: preds },
    ];
    const result = computeVerificationError(targets);
    const evaln = evaluateVerification(result);
    expect(evaln.warn).toBe(true);
    expect(evaln.reasons.join(' ')).toMatch(/[Ee]rro mediano/);
  });

  it('warns when no valid predictions were collected at all', () => {
    const result = computeVerificationError([
      { id: 'c', center: { x: 0, y: 0 }, predictions: [] },
    ]);
    const evaln = evaluateVerification(result);
    expect(evaln.warn).toBe(true);
    expect(evaln.message).toMatch(/nenhuma previsão válida/);
  });
});
