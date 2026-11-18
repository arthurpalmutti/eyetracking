// Pure ~10 Hz (100 ms) downsampler.
//
// WebGazer emits predictions faster than we want to store. This decides,
// given monotonic elapsed times supplied by the caller (performance.now based),
// whether a new sample is far enough from the last stored one to keep.
//
// Kept fully deterministic: it never calls performance.now itself.

/**
 * @param {{intervalMs?:number}} [options]
 * @returns {{shouldSample:(elapsedMs:number)=>boolean, reset:()=>void, lastSampleMs:()=>number|null}}
 */
export function createSampler({ intervalMs = 100 } = {}) {
  /** @type {number|null} */
  let lastStored = null;

  return {
    /**
     * @param {number} elapsedMs monotonic elapsed time of the incoming sample
     * @returns {boolean} true if the sample should be stored
     */
    shouldSample(elapsedMs) {
      if (!Number.isFinite(elapsedMs)) return false;
      if (lastStored === null) {
        lastStored = elapsedMs;
        return true;
      }
      if (elapsedMs - lastStored >= intervalMs) {
        lastStored = elapsedMs;
        return true;
      }
      return false;
    },
    reset() {
      lastStored = null;
    },
    lastSampleMs() {
      return lastStored;
    },
  };
}
