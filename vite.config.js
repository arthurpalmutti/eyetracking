import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { copyFileSync, mkdirSync, cpSync } from 'node:fs';
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
//
// WebGazer's MediaPipe FaceMesh solution assets (the SECOND fix below).
//
// WebGazer 3.5.3's face tracker is MediaPipe FaceMesh. At runtime,
// node_modules/webgazer/src/facemesh.mjs calls
// faceLandmarksDetection.createDetector(model, { runtime: 'mediapipe',
// solutionPath: params.faceMeshSolutionPath }). In params.mjs,
// `faceMeshSolutionPath` defaults to the RELATIVE path './mediapipe/face_mesh'.
// The MediaPipe runtime then injects a <script> to load `face_mesh.js` from
// that path and that loader fetches ~16 MB of solution assets (WASM + model
// data) from the same base via `locateFile`.
//
// Those assets ship inside the package at
// node_modules/webgazer/dist/mediapipe/face_mesh/ but our app served NONE of
// them, so './mediapipe/face_mesh/...' resolved to 404s. When MediaPipe's
// loader fails to fetch/instantiate its solution files, its own minified
// wrapper throws `t is not a function` from inside webgazer.begin(). That is a
// MISSING-ASSET problem, not a bundler problem (which is why the earlier
// bundler fixes only shifted the minified symbol z2 -> t5 -> t).
//
// Fix: copy the whole dist/mediapipe/ folder VERBATIM into
// public/vendor/mediapipe/ so the assets are served (byte-for-byte, binary
// files untouched) at /vendor/mediapipe/face_mesh/ in dev, preview, and the
// production build. src/services/gazeTracker.js points
// webgazer.params.faceMeshSolutionPath at the absolute served path
// '/vendor/mediapipe/face_mesh' before begin() runs, so the MediaPipe runtime
// loads the assets locally from our own origin (no third-party CDN fetch).

const webgazerSource = fileURLToPath(
  new URL('./node_modules/webgazer/dist/webgazer.js', import.meta.url)
);
const webgazerPublicDest = fileURLToPath(
  new URL('./public/vendor/webgazer.js', import.meta.url)
);
const mediapipeSource = fileURLToPath(
  new URL('./node_modules/webgazer/dist/mediapipe', import.meta.url)
);
const mediapipePublicDest = fileURLToPath(
  new URL('./public/vendor/mediapipe', import.meta.url)
);

/**
 * Copy WebGazer's prebuilt UMD global bundle AND its MediaPipe FaceMesh
 * solution assets into public/vendor so they are served untransformed and stay
 * in sync with the pinned webgazer@3.5.3 dependency. Runs at config resolution
 * so everything is ready for dev, build, and preview.
 *
 * The MediaPipe assets include binary files (.wasm, .data, .binarypb); they are
 * copied byte-for-byte with cpSync (never transformed) so their bytes are
 * served losslessly.
 */
function syncWebgazerVendor() {
  return {
    name: 'sync-webgazer-vendor',
    configResolved() {
      mkdirSync(dirname(webgazerPublicDest), { recursive: true });
      copyFileSync(webgazerSource, webgazerPublicDest);
      // Recursively copy the MediaPipe FaceMesh solution folder verbatim.
      cpSync(mediapipeSource, mediapipePublicDest, { recursive: true });
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
