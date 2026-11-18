// Small, pure time/number helpers.
// Monotonic-time access is wrapped via an injectable clock so pure logic
// stays deterministic and testable in a node environment.

/**
 * Arithmetic mean of an array of numbers.
 * @param {number[]} values
 * @returns {number} mean, or 0 for an empty array.
 */
export function mean(values) {
  if (!Array.isArray(values) || values.length === 0) return 0;
  const sum = values.reduce((acc, v) => acc + v, 0);
  return sum / values.length;
}

/**
 * Median of an array of numbers (does not mutate input).
 * @param {number[]} values
 * @returns {number} median, or 0 for an empty array.
 */
export function median(values) {
  if (!Array.isArray(values) || values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

/**
 * Format a duration in milliseconds as mm:ss (pt-BR friendly, zero padded).
 * Negative or non-finite values are treated as 0.
 * @param {number} ms
 * @returns {string} e.g. "01:05"
 */
export function formatDuration(ms) {
  if (!Number.isFinite(ms) || ms < 0) ms = 0;
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  return `${mm}:${ss}`;
}

/**
 * Default clock backed by performance.now when available, else Date.now.
 * Kept out of pure functions: inject it where monotonic time is needed.
 * @returns {number} milliseconds
 */
export function defaultClock() {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now();
  }
  return Date.now();
}

/**
 * Create a monotonic stopwatch using an injectable clock.
 * @param {() => number} [clock=defaultClock]
 * @returns {{start: () => void, elapsed: () => number, reset: () => void}}
 */
export function createStopwatch(clock = defaultClock) {
  let startTime = clock();
  return {
    start() {
      startTime = clock();
    },
    elapsed() {
      return clock() - startTime;
    },
    reset() {
      startTime = clock();
    },
  };
}
