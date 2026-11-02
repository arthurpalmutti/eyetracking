// Construtores de tela (DOM puro) para o protótipo "Olhar em Leitura".
//
// Cada função recebe um objeto de callbacks e devolve um HTMLElement pronto
// para ser montado. Todo o texto é em português do Brasil. Nenhum acesso à
// câmera ou ao WebGazer acontece aqui; isso é responsabilidade do app.js e do
// serviço isolado gazeTracker.js.
//
// Restrições científicas/éticas respeitadas: não se fala em atenção, foco,
// distração, fadiga ou condição clínica. Usamos "olhar fora da área de
// leitura", "episódio de afastamento visual" e "retorno à área de leitura".

import { READING_TEXTS, MAX_CUSTOM_TEXT_CHARS } from '../data/readingTexts.js';
import { formatDuration } from '../utils/time.js';
import { renderTimeline, renderTrajectory, buildTrajectorySegments } from './charts.js';
import { renderHeatmap } from './heatmap.js';

/** Cria um elemento com atributos e filhos de forma concisa. */
function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k === 'text') node.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') {
      node.addEventListener(k.slice(2).toLowerCase(), v);
    } else if (v !== null && v !== undefined) {
      node.setAttribute(k, v);
    }
  }
  for (const child of [].concat(children)) {
    if (child == null) continue;
    node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return node;
}

/* -------------------------------------------------------------------------- */
/* Tela 1 — Início / consentimento                                            */
/* -------------------------------------------------------------------------- */

/**
 * @param {{onStart:(info:{sessionCode:string})=>void, onClearHistory:()=>void, historyCount:number}} cb
 */
export function renderStartScreen(cb) {
  const screen = el('div', { class: 'screen' });

  screen.appendChild(el('h1', { class: 'app-title', text: 'Olhar em Leitura' }));
  screen.appendChild(
    el('p', {
      class: 'app-subtitle',
      text: 'Protótipo de rastreamento ocular por webcam para análise de comportamento visual durante a leitura',
    }),
  );

  const what = el('div', { class: 'card' }, [
    el('h2', { text: 'O que esta ferramenta mede' }),
    el('ul', { class: 'clean' }, [
      el('li', {
        text: 'A posição estimada do olhar na tela durante a leitura de um texto.',
      }),
      el('li', {
        text: 'Se o olhar está dentro ou fora de uma área de leitura delimitada.',
      }),
      el('li', {
        text: 'Episódios de afastamento visual e o retorno à área de leitura, além de períodos de perda de rastreamento.',
      }),
    ]),
    el('h2', { text: 'O que esta ferramenta NÃO mede' }),
    el('ul', { class: 'clean' }, [
      el('li', { text: 'Não mede atenção, foco, distração, fadiga ou emoções.' }),
      el('li', {
        text: 'Não emite diagnóstico de qualquer condição clínica ou de aprendizagem.',
      }),
      el('li', { text: 'Não atribui notas de concentração nem índices de distração.' }),
    ]),
    el('div', {
      class: 'notice',
      text: 'Este protótipo não é um instrumento clínico nem um diagnóstico de atenção. Os resultados são estimativas geométricas da posição do olhar e devem ser interpretados com cautela.',
    }),
  ]);
  screen.appendChild(what);

  const privacy = el('div', { class: 'card' }, [
    el('h2', { text: 'Privacidade' }),
    el('ul', { class: 'clean' }, [
      el('li', {
        text: 'A imagem da webcam é processada apenas no seu navegador.',
      }),
      el('li', {
        text: 'O vídeo não é gravado nem enviado para nenhum servidor.',
      }),
      el('li', {
        text: 'Apenas os dados de posição do olhar (dados comportamentais) são usados, e só ficam no seu computador.',
      }),
      el('li', { text: 'O microfone nunca é solicitado.' }),
    ]),
  ]);
  screen.appendChild(privacy);

  const form = el('div', { class: 'card' });
  const codeField = el('label', { class: 'field' }, [
    el('span', { text: 'Código da sessão/participante (opcional)' }),
  ]);
  const codeInput = el('input', {
    type: 'text',
    placeholder: 'ex.: P01',
    maxlength: '40',
    'aria-describedby': 'code-hint',
  });
  codeField.appendChild(codeInput);
  codeField.appendChild(
    el('span', {
      id: 'code-hint',
      class: 'small muted',
      text: 'Não peça nome, e-mail ou CPF. Recomendamos um código anônimo como P01.',
    }),
  );
  form.appendChild(codeField);

  const consent = el('label', { class: 'consent' });
  const consentBox = el('input', { type: 'checkbox' });
  consent.appendChild(consentBox);
  consent.appendChild(
    el('span', {
      text: 'Li os avisos acima e autorizo a ativação da webcam neste navegador para a estimativa do olhar durante a leitura.',
    }),
  );
  form.appendChild(consent);

  const startBtn = el('button', {
    class: 'btn',
    disabled: 'true',
    type: 'button',
    text: 'Começar',
  });
  consentBox.addEventListener('change', () => {
    if (consentBox.checked) startBtn.removeAttribute('disabled');
    else startBtn.setAttribute('disabled', 'true');
  });
  startBtn.addEventListener('click', () => {
    if (!consentBox.checked) return;
    cb.onStart({ sessionCode: codeInput.value.trim() });
  });
  form.appendChild(el('div', { class: 'btn-row' }, [startBtn]));
  screen.appendChild(form);

  // Histórico local (apenas resumos) e opção de apagar.
  const histCount = cb.historyCount ?? 0;
  const histCard = el('div', { class: 'card' }, [
    el('h2', { text: 'Histórico local' }),
    el('p', {
      class: 'small muted',
      text: `Apenas resumos das sessões anteriores ficam salvos neste navegador (sem vídeo e sem coordenadas brutas). Sessões salvas: ${histCount}.`,
    }),
  ]);
  const clearBtn = el('button', {
    class: 'btn btn--ghost small',
    type: 'button',
    text: 'Apagar histórico local',
    onclick: () => {
      if (typeof cb.onClearHistory === 'function') cb.onClearHistory();
      const p = histCard.querySelector('p');
      if (p) p.textContent = 'Histórico local apagado. Sessões salvas: 0.';
    },
  });
  histCard.appendChild(el('div', { class: 'btn-row' }, [clearBtn]));
  screen.appendChild(histCard);

  return screen;
}

/* -------------------------------------------------------------------------- */
/* Tela 2 — Escolha do modo                                                   */
/* -------------------------------------------------------------------------- */

/**
 * @param {{onChooseMode:(mode:'A'|'B')=>void, onBack:()=>void}} cb
 */
export function renderModeScreen(cb) {
  const screen = el('div', { class: 'screen' });
  screen.appendChild(el('h1', { class: 'app-title', text: 'Escolha o modo' }));
  screen.appendChild(
    el('p', {
      class: 'muted',
      text: 'Os dois modos funcionam inteiramente no navegador e começam com uma calibração.',
    }),
  );

  const grid = el('div', { class: 'mode-grid' });

  const modeA = el('div', { class: 'card mode-card' }, [
    el('h2', { text: 'Modo A — Teste de leitura' }),
    el('p', {
      text: 'Texto pré-carregado, calibração, leitura em área delimitada e, ao final, de 3 a 5 perguntas de compreensão. O relatório ocular e o resultado de compreensão aparecem em seções separadas.',
    }),
    el('button', {
      class: 'btn',
      type: 'button',
      text: 'Usar o Modo A',
      onclick: () => cb.onChooseMode('A'),
    }),
  ]);

  const modeB = el('div', { class: 'card mode-card' }, [
    el('h2', { text: 'Modo B — Sessão prolongada / leitura livre' }),
    el('p', {
      text: 'Cole um texto próprio ou escolha um pré-carregado, defina a duração, calibre e inicie a sessão. É possível pausar e encerrar a qualquer momento.',
    }),
    el('div', {
      class: 'notice notice--info',
      text: 'O Modo B não acompanha a pessoa em aplicativos externos nem em outras abas: ele apenas estima o olhar enquanto esta página estiver em primeiro plano.',
    }),
    el('button', {
      class: 'btn',
      type: 'button',
      text: 'Usar o Modo B',
      onclick: () => cb.onChooseMode('B'),
    }),
  ]);

  grid.appendChild(modeA);
  grid.appendChild(modeB);
  screen.appendChild(grid);

  screen.appendChild(
    el('div', { class: 'btn-row' }, [
      el('button', {
        class: 'btn btn--ghost',
        type: 'button',
        text: 'Voltar ao início',
        onclick: cb.onBack,
      }),
    ]),
  );

  return screen;
}

/* -------------------------------------------------------------------------- */
/* Tela 2b — Configuração do Modo B                                           */
/* -------------------------------------------------------------------------- */

/**
 * @param {{onContinue:(cfg:{source:'preloaded'|'custom',textId:string|null,customText:string,durationMin:number})=>void, onBack:()=>void}} cb
 */
export function renderModeBConfigScreen(cb) {
  const screen = el('div', { class: 'screen' });
  screen.appendChild(el('h1', { class: 'app-title', text: 'Modo B — Configuração' }));

  const card = el('div', { class: 'card' });

  // Escolha do texto pré-carregado.
  const selectField = el('label', { class: 'field' }, [
    el('span', { text: 'Texto pré-carregado' }),
  ]);
  const select = el('select');
  for (const t of READING_TEXTS) {
    select.appendChild(el('option', { value: t.id, text: `${t.title} (~${t.wordCount} palavras)` }));
  }
  selectField.appendChild(select);
  card.appendChild(selectField);

  // Texto próprio.
  const customField = el('label', { class: 'field' }, [
    el('span', { text: 'Ou cole um texto próprio (opcional)' }),
  ]);
  const textarea = el('textarea', {
    placeholder: 'Cole aqui o texto que deseja ler...',
    maxlength: String(MAX_CUSTOM_TEXT_CHARS),
  });
  customField.appendChild(textarea);
  const counter = el('span', {
    class: 'small muted',
    text: `Limite de ${MAX_CUSTOM_TEXT_CHARS.toLocaleString('pt-BR')} caracteres. Se este campo for preenchido, ele tem prioridade sobre o texto pré-carregado.`,
  });
  textarea.addEventListener('input', () => {
    counter.textContent = `${textarea.value.length.toLocaleString('pt-BR')} de ${MAX_CUSTOM_TEXT_CHARS.toLocaleString('pt-BR')} caracteres.`;
  });
  customField.appendChild(counter);
  card.appendChild(customField);

  // Duração.
  const durField = el('label', { class: 'field' }, [
    el('span', { text: 'Duração da sessão' }),
  ]);
  const durSelect = el('select');
  for (const min of [5, 10, 15, 20, 30]) {
    const opt = el('option', { value: String(min), text: `${min} minutos` });
    if (min === 15) opt.setAttribute('selected', 'true');
    durSelect.appendChild(opt);
  }
  durField.appendChild(durSelect);
  card.appendChild(durField);

  card.appendChild(
    el('div', {
      class: 'notice notice--info',
      text: 'Lembrete: o Modo B não segue a pessoa para outros aplicativos ou abas. Mantenha esta página em primeiro plano durante a sessão.',
    }),
  );

  screen.appendChild(card);

  screen.appendChild(
    el('div', { class: 'btn-row' }, [
      el('button', {
        class: 'btn',
        type: 'button',
        text: 'Continuar para a calibração',
        onclick: () => {
          const customText = textarea.value.trim();
          cb.onContinue({
            source: customText ? 'custom' : 'preloaded',
            textId: select.value,
            customText,
            durationMin: parseInt(durSelect.value, 10) || 15,
          });
        },
      }),
      el('button', {
        class: 'btn btn--ghost',
        type: 'button',
        text: 'Voltar',
        onclick: cb.onBack,
      }),
    ]),
  );

  return screen;
}

/* -------------------------------------------------------------------------- */
/* Tela 3 — Preparação e calibração                                           */
/* -------------------------------------------------------------------------- */

/**
 * Tela de preparação (instruções + prévia). A calibração em si usa uma camada
 * de pontos criada dinamicamente pelo app.js.
 *
 * @param {{onStartCalibration:()=>void, onToggleWebcam:(show:boolean)=>void, onBack:()=>void}} cb
 */
export function renderPrepScreen(cb) {
  const screen = el('div', { class: 'screen' });
  screen.appendChild(el('h1', { class: 'app-title', text: 'Preparação e calibração' }));

  screen.appendChild(
    el('div', { class: 'card' }, [
      el('h2', { text: 'Antes de começar' }),
      el('ul', { class: 'clean' }, [
        el('li', { text: 'Fique de frente para a câmera, com o rosto bem enquadrado.' }),
        el('li', { text: 'Procure iluminação uniforme, evitando luz forte atrás de você.' }),
        el('li', { text: 'Verifique se a lente da câmera está limpa.' }),
        el('li', { text: 'Evite mover a cabeça durante a calibração e a leitura.' }),
        el('li', { text: 'Permita o uso da webcam quando o navegador solicitar.' }),
        el('li', { text: 'Mantenha o navegador em primeiro plano durante toda a sessão.' }),
      ]),
    ]),
  );

  const webcamCard = el('div', { class: 'card' });
  webcamCard.appendChild(el('h2', { text: 'Prévia da webcam' }));
  webcamCard.appendChild(
    el('p', { class: 'muted small', text: 'A prévia é opcional e o vídeo não é gravado.' }),
  );
  const toggle = el('label', { class: 'consent' });
  const toggleBox = el('input', { type: 'checkbox' });
  toggle.appendChild(toggleBox);
  toggle.appendChild(el('span', { text: 'Mostrar prévia da webcam' }));
  toggleBox.addEventListener('change', () => cb.onToggleWebcam(toggleBox.checked));
  webcamCard.appendChild(toggle);
  screen.appendChild(webcamCard);

  screen.appendChild(
    el('div', {
      class: 'notice',
      text: 'Nota ética: testes com participantes devem ser discutidos com o(a) orientador(a) e seguir as exigências institucionais e éticas aplicáveis. O aceite do checkbox na tela inicial não substitui a aprovação ética do estudo.',
    }),
  );

  screen.appendChild(
    el('div', { class: 'card' }, [
      el('h2', { text: 'Calibração' }),
      el('p', {
        text: 'A calibração tem 9 pontos: olhe para cada ponto e clique nele. Em seguida, uma verificação com 5 alvos (sem clique) estima o erro em pixels.',
      }),
      el('div', { class: 'btn-row' }, [
        el('button', {
          class: 'btn',
          type: 'button',
          text: 'Iniciar calibração',
          onclick: cb.onStartCalibration,
        }),
        el('button', {
          class: 'btn btn--ghost',
          type: 'button',
          text: 'Voltar',
          onclick: cb.onBack,
        }),
      ]),
    ]),
  );

  // Área onde o app pode exibir status/erros de inicialização da câmera.
  screen.appendChild(el('div', { id: 'prep-status', class: 'small muted' }));

  return screen;
}

/**
 * Resultado da verificação (erro mediano) com oferta não bloqueante de
 * recalibrar.
 *
 * @param {{medianErrorPx:number|null, evaluation:{warn:boolean,message:string|null}}} result
 * @param {{onContinue:()=>void, onRecalibrate:()=>void}} cb
 * @returns {HTMLElement}
 */
export function renderVerificationResult(result, cb) {
  const wrap = el('div', { class: 'card' });
  wrap.appendChild(el('h2', { text: 'Verificação da calibração' }));

  const errText =
    result.medianErrorPx == null
      ? 'não foi possível estimar'
      : `${Math.round(result.medianErrorPx)} px`;
  wrap.appendChild(
    el('p', {}, [
      el('strong', { text: errText }),
      ` — erro mediano estimado nesta verificação.`,
    ]),
  );

  if (result.evaluation && result.evaluation.warn) {
    wrap.appendChild(el('div', { class: 'notice', text: result.evaluation.message }));
  } else {
    wrap.appendChild(
      el('p', { class: 'muted small', text: 'Precisão dentro do esperado para este protótipo.' }),
    );
  }

  wrap.appendChild(
    el('div', { class: 'btn-row' }, [
      el('button', {
        class: 'btn',
        type: 'button',
        text: 'Continuar para a leitura',
        onclick: cb.onContinue,
      }),
      el('button', {
        class: 'btn btn--ghost',
        type: 'button',
        text: 'Refazer calibração',
        onclick: cb.onRecalibrate,
      }),
    ]),
  );

  return wrap;
}

/* -------------------------------------------------------------------------- */
/* Tela 4 — Execução da leitura                                               */
/* -------------------------------------------------------------------------- */

/**
 * @param {Object} opts
 * @param {'A'|'B'} opts.mode
 * @param {string} opts.title
 * @param {string[]} opts.paragraphs
 * @param {{fontSize?:string, contrast?:string, debugPoints?:boolean}} opts.prefs
 * @param {Object} cb callbacks: onFinish, onPauseToggle, onStopCamera,
 *   onToggleDebug, onToggleWebcam, onFontChange, onContrastChange, onReadingAreaReady
 * @returns {{element:HTMLElement, refs:Object}}
 */
export function renderReadingScreen(opts, cb) {
  const prefs = opts.prefs ?? {};
  const container = el('div', {
    class: prefs.contrast === 'high' ? 'contrast-high webcam-hidden' : 'webcam-hidden',
  });

  // Banner de câmera ativa + controle para encerrar a câmera.
  const cameraBanner = el('div', { class: 'camera-banner' }, [
    el('span', { class: 'dot' }),
    el('span', { text: 'Câmera ativa — o vídeo não é gravado nem enviado.' }),
    el('span', { class: 'spacer', style: 'flex:1' }),
    el('button', {
      class: 'btn btn--danger small',
      type: 'button',
      text: 'Encerrar câmera',
      onclick: cb.onStopCamera,
    }),
  ]);
  container.appendChild(cameraBanner);

  // Barra superior discreta.
  const elapsedSpan = el('span', { text: formatDuration(0) });
  const stateDot = el('span', { class: 'tracking-dot' });
  const stateLabel = el('span', { text: 'aguardando' });
  const pauseBtn = el('button', {
    class: 'btn btn--ghost small',
    type: 'button',
    text: 'Pausar',
    onclick: () => cb.onPauseToggle(),
  });
  const finishBtn = el('button', {
    class: 'btn small',
    type: 'button',
    text: opts.mode === 'A' ? 'Finalizar leitura' : 'Encerrar sessão',
    onclick: () => cb.onFinish(),
  });

  const topbar = el('div', { class: 'reading-topbar' }, [
    el('span', {}, ['Tempo decorrido: ', elapsedSpan]),
    el('span', { class: 'tracking-state' }, [stateDot, stateLabel]),
    el('span', { class: 'spacer', style: 'flex:1' }),
    pauseBtn,
    finishBtn,
  ]);
  container.appendChild(topbar);

  // Controles (fonte, contraste, depuração, prévia). NÃO alteram coordenadas.
  const fontSelect = el('select');
  for (const [val, label] of [
    ['small', 'Fonte pequena'],
    ['medium', 'Fonte média'],
    ['large', 'Fonte grande'],
  ]) {
    const o = el('option', { value: val, text: label });
    if ((prefs.fontSize ?? 'medium') === val) o.setAttribute('selected', 'true');
    fontSelect.appendChild(o);
  }
  fontSelect.addEventListener('change', () => cb.onFontChange(fontSelect.value));

  const contrastBox = el('input', { type: 'checkbox' });
  if (prefs.contrast === 'high') contrastBox.setAttribute('checked', 'true');
  contrastBox.addEventListener('change', () => cb.onContrastChange(contrastBox.checked));

  const debugBox = el('input', { type: 'checkbox' });
  if (prefs.debugPoints) debugBox.setAttribute('checked', 'true');
  debugBox.addEventListener('change', () => cb.onToggleDebug(debugBox.checked));

  const webcamBox = el('input', { type: 'checkbox' });
  webcamBox.addEventListener('change', () => {
    cb.onToggleWebcam(webcamBox.checked);
    container.classList.toggle('webcam-hidden', !webcamBox.checked);
  });

  const controls = el('div', { class: 'reading-controls' }, [
    fontSelect,
    el('label', {}, [contrastBox, ' Alto contraste']),
    el('label', {}, [debugBox, ' Mostrar ponto do olhar (depuração)']),
    el('label', {}, [webcamBox, ' Mostrar prévia da webcam']),
  ]);

  // Área de leitura (AOI) com rolagem interna estável.
  const readingArea = el('div', {
    class: 'reading-area',
    'aria-label': 'Área de leitura',
  });
  for (const p of opts.paragraphs ?? []) {
    readingArea.appendChild(el('p', { text: p }));
  }

  const wrap = el('div', { class: 'reading-wrap' }, [
    el('h2', { text: opts.title }),
    controls,
    readingArea,
  ]);
  container.appendChild(wrap);

  // Aplica a escala de fonte sem mexer na geometria da AOI.
  applyFontScale(container, prefs.fontSize ?? 'medium');
  fontSelect.addEventListener('change', () => applyFontScale(container, fontSelect.value));
  contrastBox.addEventListener('change', () =>
    container.classList.toggle('contrast-high', contrastBox.checked),
  );

  const refs = {
    readingArea,
    setElapsed(ms) {
      elapsedSpan.textContent = formatDuration(ms);
    },
    setTrackingState(state) {
      // state: 'valid' | 'missing' | 'paused' | 'waiting'
      stateDot.className =
        'tracking-dot' +
        (state === 'valid' ? ' is-valid' : state === 'paused' ? ' is-paused' : '');
      const labels = {
        valid: 'rastreando',
        missing: 'sinal fraco / perda',
        paused: 'pausado',
        waiting: 'aguardando',
      };
      stateLabel.textContent = labels[state] ?? state;
    },
    setPauseLabel(label) {
      pauseBtn.textContent = label;
    },
  };

  return { element: container, refs };
}

/** Converte a preferência de fonte em uma escala CSS (não afeta coordenadas). */
function applyFontScale(container, size) {
  const scale = size === 'small' ? 0.9 : size === 'large' ? 1.2 : 1;
  container.style.setProperty('--reading-font-scale', String(scale));
}

/* -------------------------------------------------------------------------- */
/* Tela 5 — Resultado                                                         */
/* -------------------------------------------------------------------------- */

function metricCard(label, value, unit) {
  return el('div', { class: 'metric' }, [
    el('span', { class: 'label', text: label }),
    el('span', {}, [
      el('span', { class: 'value', text: value }),
      unit ? el('span', { class: 'unit', text: unit }) : null,
    ]),
  ]);
}

function pct(n) {
  return Number.isFinite(n) ? `${n.toFixed(1)}%` : '—';
}

/**
 * Monta a tela de resultado com todos os indicadores, visualizações e botões.
 *
 * @param {Object} data
 * @param {Object} data.metrics saída de computeMetrics
 * @param {Array} data.episodes episódios detectados
 * @param {Array} data.classifiedFeed feed classificado (para a linha do tempo)
 * @param {Array} data.samples amostras (para heatmap/trajetória)
 * @param {Array} data.trackingLossPeriods
 * @param {Object|null} data.verification resultado da verificação (erro px)
 * @param {Object|null} data.quizResult resultado da compreensão (Modo A)
 * @param {{viewportWidth:number,viewportHeight:number,readingRect?:Object}} data.geometry
 * @param {{onDownloadCsv:()=>void,onDownloadJson:()=>void,onNewSession:()=>void,onHome:()=>void}} cb
 * @returns {HTMLElement}
 */
export function renderResultScreen(data, cb) {
  const m = data.metrics ?? {};
  const screen = el('div', { class: 'screen screen--wide' });
  screen.appendChild(el('h1', { class: 'app-title', text: 'Resultado da sessão' }));

  // Aviso de qualidade dos dados.
  const coverageWarn = m.coverageWarning || m.insufficientData;
  if (coverageWarn) {
    const parts = [];
    if (m.insufficientData) {
      parts.push('Dados insuficientes: houve poucas amostras válidas para estimativas confiáveis.');
    }
    if (m.coverageWarning) {
      parts.push(
        `Cobertura de rastreamento abaixo de 70% (${pct((m.trackingCoverage ?? 0) * 100)}). Os indicadores devem ser lidos com cautela.`,
      );
    }
    screen.appendChild(el('div', { class: 'notice', text: parts.join(' ') }));
  }
  screen.appendChild(
    el('div', {
      class: 'notice notice--info small',
      text: 'Todos os valores são estimativas geométricas da posição do olhar. Eles não indicam atenção, foco, distração ou qualquer condição clínica.',
    }),
  );

  // Cartões de indicadores (seções 5/7).
  const cards = el('div', { class: 'cards' });
  cards.appendChild(metricCard('Duração ativa', formatDuration(m.activeDurationMs ?? 0)));
  cards.appendChild(metricCard('Amostras válidas (cobertura)', pct((m.trackingCoverage ?? 0) * 100)));

  if (!m.insufficientData) {
    cards.appendChild(metricCard('Tempo dentro da área', pct(m.percentInside)));
    cards.appendChild(metricCard('Tempo fora da área', pct(m.percentOutside)));
    cards.appendChild(metricCard('Episódios de afastamento', String(m.confirmedEpisodeCount ?? 0)));
    cards.appendChild(metricCard('Duração média do episódio', formatDuration(m.meanEpisodeMs ?? 0)));
    cards.appendChild(metricCard('Duração mediana do episódio', formatDuration(m.medianEpisodeMs ?? 0)));
    cards.appendChild(metricCard('Maior episódio', formatDuration(m.longestEpisodeMs ?? 0)));
    cards.appendChild(metricCard('Latência média de retorno', formatDuration(m.meanReturnLatencyMs ?? 0)));
  }
  cards.appendChild(
    metricCard('Períodos de perda de rastreamento', String((data.trackingLossPeriods ?? []).length)),
  );
  screen.appendChild(cards);

  // Períodos de perda listados separadamente.
  const losses = data.trackingLossPeriods ?? [];
  if (losses.length > 0) {
    const list = el('ul', { class: 'clean small muted' });
    losses.slice(0, 12).forEach((lp) => {
      const dur = lp.endElapsedMs != null ? lp.endElapsedMs - lp.startElapsedMs : null;
      list.appendChild(
        el('li', {
          text: `Início em ${formatDuration(lp.startElapsedMs)}${dur != null ? `, duração ${formatDuration(dur)}` : ' (até o fim da sessão)'} — ${lp.reason}`,
        }),
      );
    });
    screen.appendChild(
      el('div', { class: 'card' }, [
        el('h3', { text: 'Períodos de perda de rastreamento' }),
        list,
      ]),
    );
  }

  // (10) Linha do tempo dentro/fora.
  const timelineBox = el('div', { class: 'viz' }, [
    el('h3', { text: 'Linha do tempo (dentro / fora / perda / pausa)' }),
  ]);
  const timelineHost = el('div');
  timelineBox.appendChild(timelineHost);
  timelineBox.appendChild(buildTimelineLegend());
  screen.appendChild(timelineBox);
  renderTimeline(timelineHost, data.classifiedFeed ?? [], {
    totalMs: m.activeDurationMs ?? 0,
    width: 960,
    height: 46,
  });

  // (11) Mapa de ocupação / heatmap (aproximado).
  const heatBox = el('div', { class: 'viz' }, [
    el('h3', { text: 'Mapa de ocupação (aproximado)' }),
    el('p', { class: 'small muted', text: 'Densidade aproximada das amostras válidas sobre a tela. Representação simplificada.' }),
  ]);
  const heatCanvas = el('canvas', { width: '960', height: '540' });
  heatBox.appendChild(heatCanvas);
  screen.appendChild(heatBox);
  renderHeatmap(heatCanvas, data.samples ?? [], {
    viewportWidth: data.geometry?.viewportWidth,
    viewportHeight: data.geometry?.viewportHeight,
    readingRect: data.geometry?.readingRect,
  });

  // (12) Trajetória aproximada quando a qualidade permite.
  const trajBox = el('div', { class: 'viz' }, [
    el('h3', { text: 'Trajetória aproximada' }),
  ]);
  const runs = buildTrajectorySegments(data.samples ?? []);
  const hasTrajectory = !m.insufficientData && runs.some((r) => r.length >= 2);
  if (hasTrajectory) {
    trajBox.appendChild(
      el('p', { class: 'small muted', text: 'Linhas ligam amostras válidas; as lacunas indicam perda de dados e não são preenchidas.' }),
    );
    const trajCanvas = el('canvas', { width: '960', height: '540' });
    trajBox.appendChild(trajCanvas);
    screen.appendChild(trajBox);
    renderTrajectory(trajCanvas, data.samples ?? [], {
      viewportWidth: data.geometry?.viewportWidth,
      viewportHeight: data.geometry?.viewportHeight,
      readingRect: data.geometry?.readingRect,
    });
  } else {
    trajBox.appendChild(
      el('p', { class: 'muted', text: 'Qualidade dos dados insuficiente para exibir a trajetória.' }),
    );
    screen.appendChild(trajBox);
  }

  // Verificação da calibração (erro px) — contexto.
  if (data.verification && data.verification.medianErrorPx != null) {
    screen.appendChild(
      el('div', { class: 'card small muted' }, [
        `Erro mediano estimado na verificação da calibração: ${Math.round(
          data.verification.medianErrorPx,
        )} px.`,
      ]),
    );
  }

  // Bloco SEPARADO de compreensão (Modo A). Nunca misturado às métricas oculares.
  if (data.quizResult) {
    const q = data.quizResult;
    const quizBox = el('div', { class: 'card' });
    quizBox.appendChild(el('h2', { text: 'Resultado complementar de compreensão' }));
    quizBox.appendChild(
      el('p', {}, [
        el('strong', { text: `${q.correct} de ${q.total} corretas` }),
        ` (${pct((q.total ? q.correct / q.total : 0) * 100)}).`,
      ]),
    );
    quizBox.appendChild(
      el('p', {
        class: 'small muted',
        text: 'Este resultado de compreensão é independente dos indicadores oculares e não é combinado com eles.',
      }),
    );
    for (const d of q.details ?? []) {
      const qEl = el('div', { class: 'quiz-question' }, [
        el('div', { class: 'prompt', text: d.prompt }),
      ]);
      for (const opt of d.options) {
        let cls = 'quiz-option';
        if (opt.id === d.correctId) cls += ' correct';
        else if (opt.id === d.chosenId) cls += ' chosen-wrong';
        const mark = opt.id === d.correctId ? '✓ ' : opt.id === d.chosenId ? '✗ ' : '';
        qEl.appendChild(el('div', { class: cls, text: `${mark}${opt.text}` }));
      }
      qEl.appendChild(el('div', { class: 'small muted', text: d.explanation }));
      quizBox.appendChild(qEl);
    }
    screen.appendChild(quizBox);
  }

  // Botões de ação.
  screen.appendChild(
    el('div', { class: 'btn-row' }, [
      el('button', { class: 'btn', type: 'button', text: 'Baixar dados brutos (.csv)', onclick: cb.onDownloadCsv }),
      el('button', { class: 'btn', type: 'button', text: 'Baixar relatório da sessão (.json)', onclick: cb.onDownloadJson }),
      el('button', { class: 'btn btn--ghost', type: 'button', text: 'Nova sessão', onclick: cb.onNewSession }),
      el('button', { class: 'btn btn--ghost', type: 'button', text: 'Voltar ao início', onclick: cb.onHome }),
    ]),
  );

  return screen;
}

function buildTimelineLegend() {
  const legend = el('div', { class: 'legend' });
  const items = [
    ['#3b7d4f', 'dentro da área'],
    ['#b5852a', 'fora da área'],
    ['#9aa0ad', 'perda de rastreamento'],
    ['#6a5a8f', 'pausa'],
  ];
  for (const [color, label] of items) {
    legend.appendChild(
      el('span', { class: 'chip' }, [
        el('span', { class: 'swatch', style: `background:${color}` }),
        label,
      ]),
    );
  }
  return legend;
}

/* -------------------------------------------------------------------------- */
/* Questionário (Modo A) — aparece apenas após o fim da leitura               */
/* -------------------------------------------------------------------------- */

/**
 * @param {{title:string, questions:Array}} text
 * @param {{onSubmit:(result:Object)=>void}} cb
 */
export function renderQuizScreen(text, cb) {
  const screen = el('div', { class: 'screen' });
  screen.appendChild(el('h1', { class: 'app-title', text: 'Perguntas de compreensão' }));
  screen.appendChild(
    el('p', {
      class: 'muted',
      text: 'Estas perguntas avaliam a compreensão do texto lido. O resultado é apresentado em um bloco separado e não se mistura com os indicadores oculares.',
    }),
  );

  const form = el('form');
  const chosen = {};

  (text.questions ?? []).forEach((q, idx) => {
    const qBox = el('div', { class: 'card quiz-question' }, [
      el('div', { class: 'prompt', text: `${idx + 1}. ${q.prompt}` }),
    ]);
    for (const opt of q.options) {
      const id = `q-${q.id}-${opt.id}`;
      const radio = el('input', { type: 'radio', name: `q-${q.id}`, id, value: opt.id });
      radio.addEventListener('change', () => {
        chosen[q.id] = opt.id;
      });
      qBox.appendChild(
        el('label', { class: 'quiz-option', for: id }, [radio, ' ', opt.text]),
      );
    }
    form.appendChild(qBox);
  });

  const submit = el('button', { class: 'btn', type: 'button', text: 'Enviar respostas e ver o resultado' });
  submit.addEventListener('click', () => {
    const questions = text.questions ?? [];
    let correct = 0;
    const details = questions.map((q) => {
      const chosenId = chosen[q.id] ?? null;
      if (chosenId === q.correctId) correct += 1;
      return {
        id: q.id,
        prompt: q.prompt,
        options: q.options,
        correctId: q.correctId,
        chosenId,
        explanation: q.explanation,
        type: q.type,
      };
    });
    cb.onSubmit({ total: questions.length, correct, details });
  });

  form.appendChild(el('div', { class: 'btn-row' }, [submit]));
  screen.appendChild(form);
  return screen;
}

export { el };
