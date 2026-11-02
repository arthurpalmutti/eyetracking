import { defineConfig } from 'vite';

// Vite config + Vitest test config.
// The pure core modules are DOM-free: AOI classification receives
// getBoundingClientRect-style rect objects as plain data, so the test
// environment is 'node'. If a later feature needs DOM in tests, add
// jsdom as a devDependency and override `environment` per-file.
export default defineConfig({
  server: {
    host: 'localhost',
  },
  build: {
    // WebGazer bundles its own ML models, so the main chunk is naturally large.
    // Raise the warning limit to avoid a misleading warning on a known-large dep.
    chunkSizeWarningLimit: 3000,
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
  },
});
