import { describe, it, expect } from 'vitest';
import { toCSV, toJSON, CSV_HEADERS } from '../src/core/exportData.js';

const sampleSession = {
  metadata: { appVersion: '0.1.0', mode: 'leitura', sessionCode: 'ABC123' },
  activeDurationMs: 2000,
  samplingParams: { intervalMs: 100, targetHz: 10 },
  thresholds: { outsideConfirmMs: 1000, returnConfirmMs: 300 },
  summary: { percentInside: 80, percentOutside: 20, confirmedEpisodeCount: 1 },
  episodes: [
    { startElapsedMs: 0, endElapsedMs: 1100, durationMs: 1100, returnLatencyMs: 1100, terminationReason: 'return' },
  ],
  pauses: [{ elapsedMs: 500 }],
  trackingLossPeriods: [{ startElapsedMs: 700, endElapsedMs: 900 }],
  quizResult: { correct: 3, total: 5 },
  samples: [
    {
      elapsedMs: 0,
      timestampISO: '2024-01-01T00:00:00.000Z',
      rawX: 120.5,
      rawY: 200.25,
      filteredX: 121,
      filteredY: 201,
      trackingStatus: 'valid',
      aoiClassification: 'inside',
      viewportWidth: 1280,
      viewportHeight: 720,
    },
    {
      elapsedMs: 100,
      timestampISO: '2024-01-01T00:00:00.100Z',
      rawX: 500,
      rawY: 50,
      filteredX: 498,
      filteredY: 52,
      trackingStatus: 'valid',
      aoiClassification: 'outside',
      viewportWidth: 1280,
      viewportHeight: 720,
    },
  ],
};

describe('toCSV', () => {
  it('starts with the expected headers', () => {
    const csv = toCSV(sampleSession);
    const lines = csv.split('\n');
    expect(lines[0]).toBe(CSV_HEADERS.join(','));
  });

  it('emits one row per sample', () => {
    const csv = toCSV(sampleSession);
    const lines = csv.split('\n');
    // header + 2 samples
    expect(lines).toHaveLength(3);
    expect(lines[1]).toContain('inside');
    expect(lines[2]).toContain('outside');
  });

  it('escapes values containing commas or quotes per RFC 4180', () => {
    const session = {
      samples: [
        {
          elapsedMs: 0,
          timestampISO: '2024-01-01T00:00:00.000Z',
          rawX: 1,
          rawY: 2,
          filteredX: 1,
          filteredY: 2,
          trackingStatus: 'valid',
          aoiClassification: 'nota, com "aspas"',
          viewportWidth: 800,
          viewportHeight: 600,
        },
      ],
    };
    const csv = toCSV(session);
    const dataRow = csv.split('\n')[1];
    expect(dataRow).toContain('"nota, com ""aspas"""');
  });

  it('handles a session with no samples (headers only)', () => {
    const csv = toCSV({ samples: [] });
    expect(csv).toBe(CSV_HEADERS.join(','));
  });
});

describe('toJSON', () => {
  it('includes metadata with webgazerVersion "3.5.3"', () => {
    const out = toJSON(sampleSession);
    expect(out.metadata.webgazerVersion).toBe('3.5.3');
    expect(out.metadata.appVersion).toBe('0.1.0');
    expect(out.metadata.mode).toBe('leitura');
    expect(out.metadata.sessionCode).toBe('ABC123');
  });

  it('includes thresholds and episodes', () => {
    const out = toJSON(sampleSession);
    expect(out.thresholds).toEqual({ outsideConfirmMs: 1000, returnConfirmMs: 300 });
    expect(out.episodes).toHaveLength(1);
    expect(out.episodes[0].terminationReason).toBe('return');
  });

  it('keeps the quiz result in a SEPARATE field from the gaze summary', () => {
    const out = toJSON(sampleSession);
    expect(out.quizResult).toEqual({ correct: 3, total: 5 });
    // The gaze summary must not contain quiz data.
    expect(out.summary).not.toHaveProperty('correct');
    expect(out.summary).not.toHaveProperty('total');
    expect(out.summary).not.toHaveProperty('quizResult');
  });

  it('provides sensible defaults for a minimal session', () => {
    const out = toJSON({});
    expect(out.metadata.webgazerVersion).toBe('3.5.3');
    expect(out.episodes).toEqual([]);
    expect(out.samples).toEqual([]);
    expect(out.quizResult).toBeNull();
    expect(out.thresholds).toEqual({ outsideConfirmMs: 1000, returnConfirmMs: 300 });
  });
});
