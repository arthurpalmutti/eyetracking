import { describe, it, expect } from 'vitest';
import { computeMetrics } from '../src/core/metrics.js';

function run(startMs, count, classification, intervalMs = 100) {
  const out = [];
  for (let i = 0; i < count; i++) {
    out.push({ elapsedMs: startMs + i * intervalMs, classification });
  }
  return out;
}

describe('computeMetrics', () => {
  it('computes percentages WITHOUT including missing/outlier samples', () => {
    // 6 inside, 2 outside, 2 missing. valid = 8.
    const samples = [
      ...run(0, 6, 'inside'),
      ...run(600, 2, 'outside'),
      ...run(800, 2, 'missing'),
    ];
    const m = computeMetrics(samples, []);
    expect(m.insufficientData).toBe(false);
    expect(m.sampleCounts.valid).toBe(8);
    expect(m.sampleCounts.missing).toBe(2);
    expect(m.percentInside).toBeCloseTo(75, 5); // 6/8
    expect(m.percentOutside).toBeCloseTo(25, 5); // 2/8
    expect(m.timeInsideMs).toBe(600); // 6 * 100
    expect(m.timeOutsideMs).toBe(200); // 2 * 100
  });

  it('computes tracking coverage as valid/total', () => {
    const samples = [
      ...run(0, 7, 'inside'),
      ...run(700, 3, 'missing'),
    ];
    const m = computeMetrics(samples, []);
    expect(m.trackingCoverage).toBeCloseTo(0.7, 5); // 7/10
    expect(m.coverageWarning).toBe(false); // exactly 70% is not < 70%
  });

  it('raises a coverage warning when coverage < 70%', () => {
    const samples = [
      ...run(0, 6, 'inside'),
      ...run(600, 4, 'missing'),
    ];
    const m = computeMetrics(samples, []);
    expect(m.trackingCoverage).toBeCloseTo(0.6, 5);
    expect(m.coverageWarning).toBe(true);
  });

  it('returns a "dados insuficientes" flag when there is not enough valid data', () => {
    const samples = [
      ...run(0, 1, 'inside'),
      ...run(100, 9, 'missing'),
    ];
    const m = computeMetrics(samples, []);
    expect(m.insufficientData).toBe(true);
    expect(m.reason).toBe('dados insuficientes');
    expect(m.coverageWarning).toBe(true);
  });

  it('aggregates episode duration stats and return latency', () => {
    const samples = [...run(0, 10, 'inside'), ...run(1000, 10, 'outside')];
    const episodes = [
      { durationMs: 1000, returnLatencyMs: 1000, terminationReason: 'return' },
      { durationMs: 2000, returnLatencyMs: 2000, terminationReason: 'return' },
      { durationMs: 3000, returnLatencyMs: 3000, terminationReason: 'return' },
      // A non-return (interrupted) episode must not count toward confirmed stats.
      { durationMs: 500, returnLatencyMs: null, terminationReason: 'trackingLoss' },
    ];
    const m = computeMetrics(samples, episodes);
    expect(m.confirmedEpisodeCount).toBe(3);
    expect(m.meanEpisodeMs).toBeCloseTo(2000, 5);
    expect(m.medianEpisodeMs).toBeCloseTo(2000, 5);
    expect(m.longestEpisodeMs).toBe(3000);
    expect(m.meanReturnLatencyMs).toBeCloseTo(2000, 5);
  });

  it('computes active duration from the sample span', () => {
    const samples = run(0, 11, 'inside'); // 0..1000
    const m = computeMetrics(samples, []);
    expect(m.activeDurationMs).toBe(1000);
  });

  it('passes through tracking loss periods separately', () => {
    const samples = run(0, 10, 'inside');
    const losses = [{ startElapsedMs: 300, endElapsedMs: 500 }];
    const m = computeMetrics(samples, [], { trackingLossPeriods: losses });
    expect(m.trackingLossPeriods).toEqual(losses);
  });
});
