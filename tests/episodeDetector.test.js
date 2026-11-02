import { describe, it, expect } from 'vitest';
import { detectEpisodes } from '../src/core/episodeDetector.js';

// Helper: build a run of classified samples at a fixed interval.
function run(startMs, count, classification, intervalMs = 100) {
  const out = [];
  for (let i = 0; i < count; i++) {
    out.push({ elapsedMs: startMs + i * intervalMs, classification });
  }
  return out;
}

describe('detectEpisodes', () => {
  it('confirms an episode only after >=1000ms continuously outside', () => {
    // 11 samples at 0..1000 => span exactly 1000ms => confirms.
    const outside = run(0, 11, 'outside'); // 0,100,...,1000
    // then a confirmed return: inside span >= 300ms
    const inside = run(1100, 4, 'inside'); // 1100,1200,1300,1400 => span 300
    const { episodes } = detectEpisodes([...outside, ...inside]);
    expect(episodes).toHaveLength(1);
    expect(episodes[0].startElapsedMs).toBe(0);
    expect(episodes[0].endElapsedMs).toBe(1100);
    expect(episodes[0].terminationReason).toBe('return');
    expect(episodes[0].returnLatencyMs).toBe(1100);
    expect(episodes[0].durationMs).toBe(1100);
  });

  it('does NOT confirm a 900ms outside blip', () => {
    // 10 samples at 0..900 => span 900ms => below threshold.
    const outside = run(0, 10, 'outside'); // 0..900
    const inside = run(1000, 5, 'inside');
    const { episodes } = detectEpisodes([...outside, ...inside]);
    expect(episodes).toHaveLength(0);
  });

  it('confirms a return only after >=300ms continuously inside', () => {
    const outside = run(0, 11, 'outside'); // confirms episode
    // Only 200ms inside (3 samples span 200) then back outside: no return yet.
    const shortInside = run(1100, 3, 'inside'); // 1100,1200,1300 span 200
    const moreOutside = run(1400, 5, 'outside');
    const { episodes } = detectEpisodes([...outside, ...shortInside, ...moreOutside]);
    // Episode is active but no confirmed return; endOfData terminates it.
    expect(episodes).toHaveLength(1);
    expect(episodes[0].terminationReason).toBe('endOfData');
    expect(episodes[0].endElapsedMs).toBeNull();
    expect(episodes[0].returnLatencyMs).toBeNull();
  });

  it('breaks an active episode on tracking loss (missing/outlier)', () => {
    const outside = run(0, 11, 'outside'); // confirms episode at start 0
    const loss = run(1100, 3, 'missing');
    const { episodes } = detectEpisodes([...outside, ...loss]);
    expect(episodes).toHaveLength(1);
    expect(episodes[0].terminationReason).toBe('trackingLoss');
    expect(episodes[0].startElapsedMs).toBe(0);
    expect(episodes[0].endElapsedMs).toBeNull();
  });

  it('breaks an active episode on a manual pause marker', () => {
    const outside = run(0, 11, 'outside');
    const samples = [...outside, { elapsedMs: 1100, marker: 'pause' }];
    const { episodes } = detectEpisodes(samples);
    expect(episodes).toHaveLength(1);
    expect(episodes[0].terminationReason).toBe('pause');
  });

  it('breaks an active episode on a tab-hidden marker', () => {
    const outside = run(0, 11, 'outside');
    const samples = [...outside, { elapsedMs: 1100, marker: 'tabHidden' }];
    const { episodes } = detectEpisodes(samples);
    expect(episodes).toHaveLength(1);
    expect(episodes[0].terminationReason).toBe('tabHidden');
  });

  it('missing/outlier runs do not create episodes', () => {
    const samples = [...run(0, 20, 'missing'), ...run(2000, 20, 'outlier')];
    const { episodes } = detectEpisodes(samples);
    expect(episodes).toHaveLength(0);
  });

  it('missing/outlier do not merge two separate short outside runs into one episode', () => {
    // Two 500ms outside runs separated by tracking loss: neither confirms.
    const first = run(0, 6, 'outside'); // 0..500 => 500ms
    const loss = run(600, 3, 'missing'); // breaks the run
    const second = run(900, 6, 'outside'); // 900..1400 => 500ms
    const { episodes } = detectEpisodes([...first, ...loss, ...second]);
    expect(episodes).toHaveLength(0);
  });

  it('inside samples break a pending (unconfirmed) outside run', () => {
    const first = run(0, 6, 'outside'); // 500ms, not enough
    const insideBlip = run(600, 1, 'inside');
    const second = run(700, 6, 'outside'); // 500ms, not enough
    const { episodes } = detectEpisodes([...first, ...insideBlip, ...second]);
    expect(episodes).toHaveLength(0);
  });

  it('detects multiple confirmed episodes in one feed', () => {
    const ep1Out = run(0, 11, 'outside'); // 0..1000
    const ep1Ret = run(1100, 4, 'inside'); // return at 1100
    const gap = run(1500, 5, 'inside'); // stay inside
    const ep2Out = run(2000, 11, 'outside'); // 2000..3000
    const ep2Ret = run(3100, 4, 'inside'); // return at 3100
    const { episodes } = detectEpisodes([
      ...ep1Out,
      ...ep1Ret,
      ...gap,
      ...ep2Out,
      ...ep2Ret,
    ]);
    expect(episodes).toHaveLength(2);
    expect(episodes[0].startElapsedMs).toBe(0);
    expect(episodes[0].endElapsedMs).toBe(1100);
    expect(episodes[1].startElapsedMs).toBe(2000);
    expect(episodes[1].endElapsedMs).toBe(3100);
    expect(episodes.every((e) => e.terminationReason === 'return')).toBe(true);
  });

  it('respects configurable thresholds', () => {
    // Lower outside threshold to 500ms; a 600ms run should now confirm.
    const outside = run(0, 7, 'outside'); // 0..600 => 600ms
    const inside = run(700, 2, 'inside'); // span 100 with returnConfirmMs 100
    const { episodes } = detectEpisodes([...outside, ...inside], {
      outsideConfirmMs: 500,
      returnConfirmMs: 100,
    });
    expect(episodes).toHaveLength(1);
    expect(episodes[0].terminationReason).toBe('return');
  });
});
