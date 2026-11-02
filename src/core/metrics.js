// Pure metrics aggregation over classified samples + confirmed episodes.
//
// Strictly geometric/descriptive. These numbers are estimates of gaze position
// relative to the reading area. They do NOT measure attention, focus,
// distraction, fatigue, or any clinical condition.
//
// Rules:
//   - 'missing' and 'outlier' samples are NEVER added to inside/outside time.
//   - percentages are computed over valid (inside + outside) samples only.
//   - if there is not enough valid data, return a 'dados insuficientes' flag.
//   - coverage < 70% raises an operational warning flag (NOT a clinical claim).

import { mean, median } from '../utils/time.js';

const COVERAGE_WARNING_THRESHOLD = 0.7; // 70%
const MIN_VALID_SAMPLES = 2;

/**
 * @param {Array<{elapsedMs:number,classification:string}>} samples ordered
 * @param {Array<{durationMs:number,returnLatencyMs:number|null,terminationReason:string}>} episodes
 * @param {{intervalMs?:number, trackingLossPeriods?:Array}} [options]
 */
export function computeMetrics(samples = [], episodes = [], options = {}) {
  const intervalMs = options.intervalMs ?? 100;
  const trackingLossPeriods = options.trackingLossPeriods ?? [];

  const total = samples.length;
  let insideCount = 0;
  let outsideCount = 0;
  let missingCount = 0;
  let outlierCount = 0;

  for (const s of samples) {
    switch (s.classification) {
      case 'inside':
        insideCount++;
        break;
      case 'outside':
        outsideCount++;
        break;
      case 'missing':
        missingCount++;
        break;
      case 'outlier':
        outlierCount++;
        break;
      default:
        break;
    }
  }

  const validCount = insideCount + outsideCount;

  // Active duration: span of the ordered samples.
  let activeDurationMs = 0;
  if (total >= 2) {
    activeDurationMs =
      samples[total - 1].elapsedMs - samples[0].elapsedMs;
  }

  // Coverage: valid samples / expected samples during active time.
  const expectedSamples = total > 0 ? total : 0;
  const trackingCoverage = expectedSamples > 0 ? validCount / expectedSamples : 0;

  // Insufficient valid data guard.
  if (validCount < MIN_VALID_SAMPLES) {
    return {
      insufficientData: true,
      reason: 'dados insuficientes',
      activeDurationMs,
      trackingCoverage,
      coverageWarning: trackingCoverage < COVERAGE_WARNING_THRESHOLD,
      sampleCounts: {
        total,
        valid: validCount,
        inside: insideCount,
        outside: outsideCount,
        missing: missingCount,
        outlier: outlierCount,
      },
    };
  }

  // Time estimates: each valid sample represents ~intervalMs of time.
  const timeInsideMs = insideCount * intervalMs;
  const timeOutsideMs = outsideCount * intervalMs;

  const percentInside = (insideCount / validCount) * 100;
  const percentOutside = (outsideCount / validCount) * 100;

  // Episode-derived aggregates.
  const confirmedEpisodes = episodes.filter(
    (e) => e.terminationReason === 'return'
  );
  const episodeDurations = confirmedEpisodes.map((e) => e.durationMs);
  const returnLatencies = confirmedEpisodes
    .map((e) => e.returnLatencyMs)
    .filter((v) => v != null);

  const confirmedEpisodeCount = confirmedEpisodes.length;
  const meanEpisodeMs = episodeDurations.length ? mean(episodeDurations) : 0;
  const medianEpisodeMs = episodeDurations.length ? median(episodeDurations) : 0;
  const longestEpisodeMs = episodeDurations.length
    ? Math.max(...episodeDurations)
    : 0;
  const meanReturnLatencyMs = returnLatencies.length
    ? mean(returnLatencies)
    : 0;

  return {
    insufficientData: false,
    activeDurationMs,
    trackingCoverage,
    coverageWarning: trackingCoverage < COVERAGE_WARNING_THRESHOLD,
    sampleCounts: {
      total,
      valid: validCount,
      inside: insideCount,
      outside: outsideCount,
      missing: missingCount,
      outlier: outlierCount,
    },
    timeInsideMs,
    timeOutsideMs,
    percentInside,
    percentOutside,
    confirmedEpisodeCount,
    meanEpisodeMs,
    medianEpisodeMs,
    longestEpisodeMs,
    meanReturnLatencyMs,
    trackingLossPeriods,
  };
}

export { COVERAGE_WARNING_THRESHOLD };
