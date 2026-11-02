import { describe, it, expect } from 'vitest';
import { classifyPoint, createMovingMedian } from '../src/core/aoi.js';

// getBoundingClientRect-style rect for the reading area.
const rect = { left: 100, top: 100, right: 300, bottom: 400, width: 200, height: 300 };

describe('classifyPoint', () => {
  it('classifies a point clearly inside the rect as "inside"', () => {
    expect(classifyPoint({ x: 200, y: 250 }, rect)).toBe('inside');
  });

  it('classifies a point clearly outside the rect as "outside"', () => {
    expect(classifyPoint({ x: 500, y: 250 }, rect)).toBe('outside');
    expect(classifyPoint({ x: 200, y: 50 }, rect)).toBe('outside');
  });

  it('classifies a null point as "missing"', () => {
    expect(classifyPoint(null, rect)).toBe('missing');
  });

  it('classifies an outlier-flagged point as "outlier"', () => {
    expect(classifyPoint({ x: 200, y: 250, outlier: true }, rect)).toBe('outlier');
  });

  it('classifies non-finite coordinates as "outlier"', () => {
    expect(classifyPoint({ x: NaN, y: 250 }, rect)).toBe('outlier');
    expect(classifyPoint({ x: 200, y: Infinity }, rect)).toBe('outlier');
  });

  it('treats the rect boundaries as inside (inclusive edges)', () => {
    expect(classifyPoint({ x: 100, y: 100 }, rect)).toBe('inside'); // top-left corner
    expect(classifyPoint({ x: 300, y: 400 }, rect)).toBe('inside'); // bottom-right corner
    expect(classifyPoint({ x: 100, y: 250 }, rect)).toBe('inside'); // left edge
    expect(classifyPoint({ x: 301, y: 250 }, rect)).toBe('outside'); // just past right edge
  });
});

describe('createMovingMedian (window of 3)', () => {
  it('returns null before any valid point is seen', () => {
    const mm = createMovingMedian(3);
    expect(mm.push(null)).toBeNull();
    expect(mm.push({ x: 10, y: 10, outlier: true })).toBeNull();
  });

  it('returns the median x/y over the last 3 valid points', () => {
    const mm = createMovingMedian(3);
    expect(mm.push({ x: 10, y: 100 })).toEqual({ x: 10, y: 100 });
    expect(mm.push({ x: 20, y: 200 })).toEqual({ x: 15, y: 150 });
    const third = mm.push({ x: 30, y: 300 });
    expect(third).toEqual({ x: 20, y: 200 });
  });

  it('slides the window, dropping the oldest point', () => {
    const mm = createMovingMedian(3);
    mm.push({ x: 10, y: 10 });
    mm.push({ x: 20, y: 20 });
    mm.push({ x: 30, y: 30 });
    // window now [10,20,30]; add 100 -> window [20,30,100] -> median 30
    expect(mm.push({ x: 100, y: 100 })).toEqual({ x: 30, y: 30 });
  });

  it('does not update the window on invalid points but keeps last smoothed value', () => {
    const mm = createMovingMedian(3);
    mm.push({ x: 10, y: 10 });
    mm.push({ x: 20, y: 20 });
    const beforeInvalid = { x: 15, y: 15 };
    expect(mm.push({ x: 999, y: 999, outlier: true })).toEqual(beforeInvalid);
    expect(mm.push(null)).toEqual(beforeInvalid);
  });

  it('resets its window', () => {
    const mm = createMovingMedian(3);
    mm.push({ x: 10, y: 10 });
    mm.reset();
    expect(mm.push(null)).toBeNull();
  });
});
