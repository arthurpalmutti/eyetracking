import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

// WebGazer is deliberately NOT bundled or transformed by Vite/esbuild.
//
// Why: WebGazer 3.5.3 ships its own prebuilt, webpack-minified bundle that
// embeds the entire TensorFlow.js dependency graph. Letting Vite/Rollup resolve
// the package (via its `module` ESM entry) OR even re-process its prebuilt
// CommonJS bundle runs that code back through esbuild's CommonJS->ESM interop
// and minifier. That transform mangles WebGazer/TensorFlow internals and, in
// the PRODUCTION build only, surfaced at runtime as `z2 is not a function` and
// then `t5 is not a function` thrown from inside webgazer.begin(). The minified
// symbol kept changing because the real defect is the bundler touching the
// dependency at all, not a missing method.
//
// Fix (WebGazer's officially supported load method): serve WebGazer's prebuilt
// UMD/global bundle (node_modules/webgazer/dist/webgazer.js, the `var webgazer`
// global variant) VERBATIM as a static asset and load it with a plain
// <script> tag in index.html, before the app module. That defines a global
// `window.webgazer`, which src/services/gazeTracker.js consumes. The bundle is
// never parsed, transformed, or minified by Vite, so esbuild can no longer
// mangle it.
//
// To keep the served copy pinned to the installed 3.5.3 dependency (instead of
// a hand-edited duplicate), the plugin below copies dist/webgazer.js into
// public/vendor/webgazer.js on every dev-server start and production build.
// Files in public/ are copied verbatim into dist/ and served at the same path
// in dev, preview, and the production build.

const webgazerSource = fileURLToPath(
  new URL('./node_modules/webgazer/dist/webgazer.js', import.meta.url)
);
const webgazerPublicDest = fileURLToPath(
  new URL('./public/vendor/webgazer.js', import.meta.url)
);

/**
 * Copy WebGazer's prebuilt UMD global bundle into public/vendor so it is served
 * untransformed and stays in sync with the pinned webgazer@3.5.3 dependency.
 * Runs at config resolution so it is ready for dev, build, and preview.
 */
function syncWebgazerVendor() {
  return {
    name: 'sync-webgazer-vendor',
    configResolved() {
      mkdirSync(dirname(webgazerPublicDest), { recursive: true });
      copyFileSync(webgazerSource, webgazerPublicDest);
    },
  };
}

// Vite config + Vitest test config.
// The pure core modules are DOM-free: AOI classification receives
// getBoundingClientRect-style rect objects as plain data, so the test
// environment is 'node'. If a later feature needs DOM in tests, add
// jsdom as a devDependency and override `environment` per-file.
export default defineConfig({
  plugins: [syncWebgazerVendor()],
  server: {
    host: 'localhost',
  },
  build: {
    // WebGazer is served as a standalone static script (public/vendor), so the
    // app bundle itself is small. Keep a generous limit as a harmless guard.
    chunkSizeWarningLimit: 3000,
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
  },
});
