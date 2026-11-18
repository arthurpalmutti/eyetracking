// Orquestração do protótipo "Olhar em Leitura".
//
// Monta o roteador de telas e conecta o serviço isolado do WebGazer
// (gazeTracker.js) ao pipeline de sessão (core/session.js) e aos módulos puros
// (calibração, episódios, métricas, exportação). A coleta ocorre a 10 Hz com
// classificação de AOI, detecção de episódios de afastamento e pausa por
// visibilidade, exatamente como o pipeline da FEAT-001/002 já implementa.
//
// Restrições respeitadas: sem score de atenção/distração; o questionário de
// compreensão (Modo A) fica em bloco separado; a câmera só é ativada após o
// consentimento; vídeo nunca é gravado/enviado; as tracks são liberadas ao
// encerrar. Amostras brutas ficam apenas em memória até a exportação; somente
// um resumo é persistido via storage.js.

import { createGazeTracker } from './services/gazeTracker.js';
import { createSession } from './core/session.js';
import { detectEpisodes, DEFAULT_THRESHOLDS } from './core/episodeDetector.js';
import { computeMetrics } from './core/metrics.js';
import { toCSV, toJSON } from './core/exportData.js';
import {
  getCalibrationPoints,
  getVerificationTargets,
  toViewportPixels,
  computeVerificationError,
  evaluateVerification,
} from './core/calibration.js';
import {
  loadPreferences,
  savePreferences,
  addHistoryEntry,
  loadHistory,
  clearHistory,
} from './utils/storage.js';
import { getTextById, READING_TEXTS } from './data/readingTexts.js';
import {
  renderStartScreen,
  renderModeScreen,
  renderModeBConfigScreen,
  renderPrepScreen,
  renderVerificationResult,
  renderReadingScreen,
  renderResultScreen,
  renderQuizScreen,
  el,
} from './ui/screens.js';

const APP_VERSION = '0.1.0';
const SAMPLE_INTERVAL_MS = 100; // 10 Hz

/**
 * Cria a aplicação e devolve um controlador com start().
 * @param {HTMLElement} root
 */
export function createApp(root) {
  const tracker = createGazeTracker();

  // Estado da sessão em andamento (apenas em memória).
  const state = {
    prefs: loadPreferences(),
    sessionCode: '',
    mode: null, // 'A' | 'B'
    text: null, // ReadingText | {title, paragraphs} custom
    durationMin: 15,
    session: null, // instância de createSession
    verification: null, // resultado da verificação
    cameraActive: false,
    readingRefs: null,
    readingRect: null,
    timers: { tick: null, durationTimeout: null },
    lastGaze: null,
  };

  function mount(node) {
    root.innerHTML = '';
    root.appendChild(node);
  }

  function getViewport() {
    return {
      width: window.innerWidth || document.documentElement.clientWidth || 0,
      height: window.innerHeight || document.documentElement.clientHeight || 0,
    };
  }

  /* --------------------------- Encerramento câmera -------------------------- */

  async function stopCamera() {
    try {
      await tracker.end();
    } catch {
      // ignora erros de teardown
    }
    state.cameraActive = false;
  }

  function clearTimers() {
    if (state.timers.tick) {
      clearInterval(state.timers.tick);
      state.timers.tick = null;
    }
    if (state.timers.durationTimeout) {
      clearTimeout(state.timers.durationTimeout);
      state.timers.durationTimeout = null;
    }
  }

  /* ------------------------------- Tela 1 ---------------------------------- */

  function showStart() {
    clearTimers();
    mount(
      renderStartScreen({
        historyCount: loadHistory().length,
        onClearHistory: () => clearHistory(),
        onStart: ({ sessionCode }) => {
          state.sessionCode = sessionCode;
          showMode();
        },
      }),
    );
  }

  /* ------------------------------- Tela 2 ---------------------------------- */

  function showMode() {
    mount(
      renderModeScreen({
        onChooseMode: (mode) => {
          state.mode = mode;
          savePreferences({ lastMode: mode });
          if (mode === 'A') {
            // Modo A usa o primeiro texto pré-carregado.
            state.text = READING_TEXTS[0];
            state.durationMin = null;
            showPrep();
          } else {
            showModeBConfig();
          }
        },
        onBack: showStart,
      }),
    );
  }

  function showModeBConfig() {
    mount(
      renderModeBConfigScreen({
        onContinue: (cfg) => {
          state.durationMin = cfg.durationMin;
          if (cfg.source === 'custom' && cfg.customText) {
            state.text = {
              id: 'custom',
              title: 'Texto fornecido pelo participante',
              paragraphs: splitParagraphs(cfg.customText),
              questions: [],
            };
          } else {
            state.text = getTextById(cfg.textId) ?? READING_TEXTS[0];
          }
          showPrep();
        },
        onBack: showMode,
      }),
    );
  }

  /* ------------------------------- Tela 3 ---------------------------------- */

  function showPrep() {
    mount(
      renderPrepScreen({
        onToggleWebcam: (show) => {
          // Só é possível mostrar a prévia depois de init(); antes disso é no-op.
          if (state.cameraActive) tracker.showVideo(show);
        },
        onStartCalibration: () => startCalibrationFlow(),
        onBack: () => {
          stopCamera();
          state.mode === 'B' ? showModeBConfig() : showMode();
        },
      }),
    );
  }

  function setPrepStatus(msg, isError = false) {
    const node = document.getElementById('prep-status');
    if (node) {
      node.textContent = msg;
      node.className = isError ? 'notice' : 'small muted';
    }
  }

  async function ensureTrackerStarted() {
    if (state.cameraActive) return true;
    try {
      setPrepStatus('Solicitando acesso à câmera e inicializando o rastreamento...');
      await tracker.init({
        onGaze: (data) => {
          state.lastGaze = data;
          if (state.session) state.session.onGaze(data);
        },
      });
      state.cameraActive = true;
      // Mostra o feedback de rosto durante a calibração.
      tracker.showFaceOverlay(true);
      tracker.showFaceFeedbackBox(true);
      setPrepStatus('Câmera ativa. Siga as instruções de calibração.');
      return true;
    } catch (err) {
      setPrepStatus(
        `Não foi possível iniciar a câmera: ${err && err.message ? err.message : err}. Verifique as permissões e tente novamente.`,
        true,
      );
      return false;
    }
  }

  async function startCalibrationFlow() {
    const ok = await ensureTrackerStarted();
    if (!ok) return;
    runCalibration();
  }

  /**
   * Camada de calibração de 9 pontos (clique) seguida da verificação de 5
   * alvos (sem clique). Usa coordenadas em pixels do viewport.
   */
  function runCalibration() {
    const viewport = getViewport();
    const points = getCalibrationPoints();
    const layer = el('div', { class: 'calib-layer' });
    const progress = el('div', { class: 'calib-progress' });
    layer.appendChild(progress);
    document.body.appendChild(layer);

    tracker.setDebugPoints(false);

    let index = 0;
    const showPoint = () => {
      // remove ponto anterior
      const prev = layer.querySelector('.calib-point');
      if (prev) prev.remove();
      if (index >= points.length) {
        document.body.removeChild(layer);
        runVerification();
        return;
      }
      progress.innerHTML = '';
      progress.appendChild(document.createTextNode(`Ponto ${index + 1} de 9`));
      progress.appendChild(el('span', { class: 'hint', text: 'Olhe para o ponto e clique nele.' }));

      const p = points[index];
      const px = toViewportPixels(p, viewport);
      const dot = el('div', { class: 'calib-point' });
      dot.style.left = `${px.x}px`;
      dot.style.top = `${px.y}px`;
      dot.addEventListener('click', () => {
        index += 1;
        showPoint();
      });
      layer.appendChild(dot);
    };
    showPoint();
  }

  /**
   * Verificação de 5 alvos sem clique. Para cada alvo, coleta previsões via
   * getCurrentPrediction() durante uma janela curta e calcula o erro mediano.
   */
  function runVerification() {
    const viewport = getViewport();
    const targets = getVerificationTargets();
    const layer = el('div', { class: 'calib-layer' });
    const progress = el('div', { class: 'calib-progress' });
    layer.appendChild(progress);
    document.body.appendChild(layer);

    const collected = [];
    let ti = 0;

    const runTarget = () => {
      const prevDot = layer.querySelector('.calib-point');
      if (prevDot) prevDot.remove();

      if (ti >= targets.length) {
        document.body.removeChild(layer);
        finishVerification(collected);
        return;
      }

      const t = targets[ti];
      const center = toViewportPixels(t, viewport);
      progress.innerHTML = '';
      progress.appendChild(document.createTextNode(`Verificação: alvo ${ti + 1} de 5`));
      progress.appendChild(el('span', { class: 'hint', text: 'Apenas olhe para o alvo (não clique).' }));

      const dot = el('div', { class: 'calib-point calib-point--target' });
      dot.style.left = `${center.x}px`;
      dot.style.top = `${center.y}px`;
      layer.appendChild(dot);

      const predictions = [];
      // ~1.2s de coleta por alvo, amostrando a 10 Hz.
      const sampler = setInterval(() => {
        const p = tracker.getCurrentPrediction();
        predictions.push(p);
      }, SAMPLE_INTERVAL_MS);

      setTimeout(() => {
        clearInterval(sampler);
        collected.push({ id: t.id, center, predictions });
        ti += 1;
        runTarget();
      }, 1200);
    };

    runTarget();
  }

  function finishVerification(collected) {
    const result = computeVerificationError(collected);
    const evaluation = evaluateVerification(result);
    state.verification = { ...result, evaluation };

    // Monta a tela de preparação novamente com o resultado da verificação.
    const prep = renderPrepScreen({
      onToggleWebcam: (show) => {
        if (state.cameraActive) tracker.showVideo(show);
      },
      onStartCalibration: () => startCalibrationFlow(),
      onBack: () => {
        stopCamera();
        state.mode === 'B' ? showModeBConfig() : showMode();
      },
    });
    mount(prep);
    prep.appendChild(
      renderVerificationResult(
        { medianErrorPx: result.medianErrorPx, evaluation },
        {
          onContinue: () => startReading(),
          onRecalibrate: () => runCalibration(),
        },
      ),
    );
  }

  /* ------------------------------- Tela 4 ---------------------------------- */

  function startReading() {
    // Esconde overlays de calibração durante a leitura.
    tracker.showFaceOverlay(false);
    tracker.showFaceFeedbackBox(false);
    tracker.setDebugPoints(!!state.prefs.debugPoints);

    const built = renderReadingScreen(
      {
        mode: state.mode,
        title: state.text.title,
        paragraphs: state.text.paragraphs,
        prefs: state.prefs,
      },
      {
        onFinish: () => endReading(),
        onPauseToggle: () => togglePause(),
        onStopCamera: () => {
          stopCamera();
          endReading();
        },
        onToggleDebug: (on) => {
          savePreferences({ debugPoints: on });
          state.prefs.debugPoints = on;
          tracker.setDebugPoints(on);
        },
        onToggleWebcam: (show) => tracker.showVideo(show),
        onFontChange: (size) => {
          savePreferences({ fontSize: size });
          state.prefs.fontSize = size;
        },
        onContrastChange: (high) => {
          const contrast = high ? 'high' : 'normal';
          savePreferences({ contrast });
          state.prefs.contrast = contrast;
        },
      },
    );

    mount(built.element);
    state.readingRefs = built.refs;

    // Geometria da AOI: recalculada sob demanda e em redimensionamento.
    const computeRect = () => {
      const r = built.refs.readingArea.getBoundingClientRect();
      state.readingRect = {
        left: r.left,
        top: r.top,
        right: r.right,
        bottom: r.bottom,
      };
      return state.readingRect;
    };
    computeRect();

    const onResize = () => computeRect();
    window.addEventListener('resize', onResize);
    state._onResize = onResize;

    // Pipeline de sessão (10 Hz, AOI, episódios, pausa por visibilidade).
    state.session = createSession({
      getRect: () => state.readingRect,
      getViewport,
      intervalMs: SAMPLE_INTERVAL_MS,
    });
    state.session.start();

    // Pausa automática quando a aba fica oculta (exige resume explícito).
    const onVisibility = () => {
      if (!state.session) return;
      if (document.visibilityState === 'hidden') {
        state.session.handleVisibilityChange('hidden');
        tracker.pause();
        updateReadingUi();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    state._onVisibility = onVisibility;

    // Atualização da barra superior (tempo + estado).
    state.timers.tick = setInterval(updateReadingUi, 200);

    // Modo B: encerra automaticamente ao fim do tempo definido.
    if (state.mode === 'B' && state.durationMin) {
      state.timers.durationTimeout = setTimeout(
        () => endReading(),
        state.durationMin * 60 * 1000,
      );
    }
  }

  function updateReadingUi() {
    const refs = state.readingRefs;
    const session = state.session;
    if (!refs || !session) return;
    refs.setElapsed(session.getActiveDurationMs());
    if (session.isPaused()) {
      refs.setTrackingState('paused');
      refs.setPauseLabel('Retomar');
    } else {
      refs.setPauseLabel('Pausar');
      const g = state.lastGaze;
      refs.setTrackingState(g == null ? 'missing' : 'valid');
    }
  }

  function togglePause() {
    const session = state.session;
    if (!session) return;
    if (session.isPaused()) {
      session.resume();
      tracker.resume();
    } else {
      session.pause('manual');
      tracker.pause();
    }
    updateReadingUi();
  }

  /* --------------------------- Fim da leitura ------------------------------ */

  function endReading() {
    clearTimers();
    if (state._onResize) {
      window.removeEventListener('resize', state._onResize);
      state._onResize = null;
    }
    if (state._onVisibility) {
      document.removeEventListener('visibilitychange', state._onVisibility);
      state._onVisibility = null;
    }
    if (state.session) state.session.stop();

    // Modo A: questionário ANTES do resultado (não interfere na coleta, que já
    // terminou). Modo B / texto sem perguntas: vai direto ao resultado.
    const hasQuiz = state.mode === 'A' && (state.text.questions ?? []).length > 0;
    if (hasQuiz) {
      showQuiz();
    } else {
      showResult(null);
    }
  }

  /* ------------------------------- Quiz ------------------------------------ */

  function showQuiz() {
    mount(
      renderQuizScreen(state.text, {
        onSubmit: (quizResult) => showResult(quizResult),
      }),
    );
  }

  /* ------------------------------- Tela 5 ---------------------------------- */

  function buildSessionData(quizResult) {
    const session = state.session;
    const samples = session ? session.getSamples() : [];
    const feed = session ? session.getClassifiedFeed() : [];
    const trackingLossPeriods = session ? session.getTrackingLossPeriods() : [];
    const pauses = session ? session.getPauses() : [];

    // Feed de classificação já contém elapsedMs + classification/marker.
    const feedForEpisodes = feed.filter((e) => e.classification || e.marker);
    const { episodes } = detectEpisodes(feedForEpisodes, DEFAULT_THRESHOLDS);

    const metrics = computeMetrics(
      feed.filter((e) => e.classification).map((e) => ({
        elapsedMs: e.elapsedMs,
        classification: e.classification,
      })),
      episodes,
      { intervalMs: SAMPLE_INTERVAL_MS, trackingLossPeriods },
    );

    // Geometria para heatmap/trajetória: usa o viewport registrado nas amostras
    // (ou o atual como fallback) e o retângulo da área de leitura.
    const lastSample = samples[samples.length - 1];
    const viewportWidth = lastSample?.viewportWidth || getViewport().width;
    const viewportHeight = lastSample?.viewportHeight || getViewport().height;

    // Amostras no formato do exportData (com aoiClassification).
    const classByElapsed = new Map();
    for (const e of feed) {
      if (e.classification) classByElapsed.set(e.elapsedMs, e.classification);
    }
    const exportSamples = samples.map((s) => ({
      ...s,
      aoiClassification: classByElapsed.get(s.elapsedMs) ?? s.trackingStatus,
    }));

    return {
      metrics,
      episodes,
      classifiedFeed: feed,
      samples: exportSamples,
      trackingLossPeriods,
      pauses,
      verification: state.verification,
      quizResult,
      geometry: {
        viewportWidth,
        viewportHeight,
        readingRect: state.readingRect,
      },
    };
  }

  function showResult(quizResult) {
    const data = buildSessionData(quizResult);
    state._resultData = data;

    // Persiste apenas um resumo (sem amostras brutas).
    try {
      addHistoryEntry({
        dateISO: new Date().toISOString(),
        mode: state.mode,
        durationMs: data.metrics.activeDurationMs,
        episodeCount: data.metrics.confirmedEpisodeCount ?? 0,
        medianEpisodeMs: data.metrics.medianEpisodeMs ?? 0,
        trackingCoverage: data.metrics.trackingCoverage,
        verificationMedianErrorPx: state.verification?.medianErrorPx ?? null,
      });
    } catch {
      // armazenamento indisponível: segue sem persistir
    }

    mount(
      renderResultScreen(data, {
        onDownloadCsv: () => downloadCsv(data),
        onDownloadJson: () => downloadJson(data),
        onNewSession: () => {
          resetSessionState();
          state.mode === 'B' ? showModeBConfig() : showPrep();
        },
        onHome: () => {
          resetSessionState();
          stopCamera();
          showStart();
        },
      }),
    );
  }

  /* ----------------------------- Exportação -------------------------------- */

  function buildExportSession(data) {
    return {
      metadata: {
        appVersion: APP_VERSION,
        mode: state.mode,
        sessionCode: state.sessionCode || null,
        exportedAtISO: new Date().toISOString(),
      },
      activeDurationMs: data.metrics.activeDurationMs,
      samplingParams: { intervalMs: SAMPLE_INTERVAL_MS, targetHz: 10 },
      thresholds: { ...DEFAULT_THRESHOLDS },
      summary: data.metrics,
      episodes: data.episodes,
      pauses: data.pauses,
      trackingLossPeriods: data.trackingLossPeriods,
      quizResult: data.quizResult,
      samples: data.samples,
    };
  }

  function triggerDownload(content, filename, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  function stamp() {
    return new Date().toISOString().replace(/[:.]/g, '-');
  }

  function downloadCsv(data) {
    const session = buildExportSession(data);
    triggerDownload(toCSV(session), `olhar-em-leitura_${stamp()}.csv`, 'text/csv;charset=utf-8');
  }

  function downloadJson(data) {
    const session = buildExportSession(data);
    triggerDownload(
      JSON.stringify(toJSON(session), null, 2),
      `olhar-em-leitura_${stamp()}.json`,
      'application/json',
    );
  }

  /* ------------------------------ Utilidades ------------------------------- */

  function resetSessionState() {
    clearTimers();
    state.session = null;
    state.readingRefs = null;
    state.readingRect = null;
    state._resultData = null;
    state.lastGaze = null;
  }

  function splitParagraphs(raw) {
    const parts = String(raw)
      .split(/\n\s*\n/)
      .map((p) => p.replace(/\s+/g, ' ').trim())
      .filter(Boolean);
    return parts.length ? parts : [String(raw).trim()];
  }

  return {
    start() {
      showStart();
    },
  };
}
