import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

// Resolve the exact path to WebGazer's PREBUILT, webpack-minified UMD bundle.
// WebGazer 3.5.3 ships two entries in its package.json:
//   - main:   dist/webgazer.js        (prebuilt webpack bundle, `var` global target)
//   - module: src/index.mjs           (raw ESM that imports @tensorflow/tfjs etc.)
// By default Vite/Rollup prefer the `module` field, so the raw ESM source plus
// the entire TensorFlow.js dependency graph get bundled and re-minified by
// esbuild. That re-minification mangles WebGazer/TensorFlow internals and, in
// the PRODUCTION build only, surfaces at runtime as `z2 is not a function`
// thrown from webgazer.begin(). (The dev server is unminified, so it works.)
//
// Fix: alias the bare `webgazer` specifier to WebGazer's own prebuilt bundle,
// which is already minified and validated by WebGazer's webpack build and ships
// its own TensorFlow.js. We use the `commonjs2` variant because it exposes a
// CommonJS `module.exports` that Vite can import cleanly (the `var`-global
// `dist/webgazer.js` has no module export and fails Rollup resolution). The
// commonjs2 bundle exports `{ webgazer }`; src/services/gazeTracker.js unwraps
// that single named property. The regex `^webgazer$` only matches the bare
// specifier, so the sub-path import inside the alias target still resolves.
const webgazerPrebuilt = fileURLToPath(
  new URL('./node_modules/webgazer/dist/webgazer.commonjs2.js', import.meta.url)
);

// Vite config + Vitest test config.
// The pure core modules are DOM-free: AOI classification receives
// getBoundingClientRect-style rect objects as plain data, so the test
// environment is 'node'. If a later feature needs DOM in tests, add
// jsdom as a devDependency and override `environment` per-file.
export default defineConfig({
  server: {
    host: 'localhost',
  },
  resolve: {
    alias: [{ find: /^webgazer$/, replacement: webgazerPrebuilt }],
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
