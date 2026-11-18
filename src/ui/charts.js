// Visualizações nativas (SVG / Canvas 2D), sem bibliotecas externas.
//
//   - renderTimeline: linha do tempo de blocos coloridos para os períodos
//     dentro/fora/perda/pausa ao longo da sessão ativa.
//   - renderTrajectory: trajetória aproximada ligando amostras válidas, com
//     redução de pontos e SEM preencher/suavizar as lacunas de perda de dados.
//
// Todas as medidas são geométricas e descritivas. Nada aqui afirma algo sobre
// atenção, foco, distração ou qualquer condição clínica.

const COLORS = {
  inside: '#3b7d4f',
  outside: '#b5852a',
  missing: '#9aa0ad',
  paused: '#6a5a8f',
};

/**
 * Constrói segmentos contíguos (dentro/fora/perda/pausa) a partir do feed
 * classificado ordenado. Marcadores de pausa iniciam um segmento 'paused' até
 * o próximo item do feed.
 *
 * @param {Array<{elapsedMs:number,classification?:string,marker?:string}>} feed
 * @param {number} totalMs duração ativa total
 * @returns {Array<{kind:'inside'|'outside'|'missing'|'paused',startMs:number,endMs:number}>}
 */
export function buildTimelineSegments(feed, totalMs) {
  const items = Array.isArray(feed) ? feed.slice() : [];
  const segments = [];
  if (items.length === 0) return segments;

  function kindOf(entry) {
    if (entry.marker === 'pause' || entry.marker === 'tabHidden') return 'paused';
    switch (entry.classification) {
      case 'inside':
        return 'inside';
      case 'outside':
        return 'outside';
      default:
        return 'missing'; // missing/outlier => perda de rastreamento
    }
  }

  let current = null;
  for (let i = 0; i < items.length; i += 1) {
    const entry = items[i];
    const kind = kindOf(entry);
    const startMs = entry.elapsedMs;
    const endMs =
      i + 1 < items.length ? items[i + 1].elapsedMs : Math.max(startMs, totalMs);

    if (current && current.kind === kind) {
      current.endMs = endMs;
    } else {
      current = { kind, startMs, endMs };
      segments.push(current);
    }
  }
  return segments;
}

/**
 * Renderiza a linha do tempo como SVG dentro do container informado.
 *
 * @param {HTMLElement} container
 * @param {Array<{elapsedMs:number,classification?:string,marker?:string}>} feed
 * @param {{totalMs:number,width?:number,height?:number}} opts
 */
export function renderTimeline(container, feed, opts = {}) {
  const totalMs = Math.max(1, opts.totalMs ?? 0);
  const width = opts.width ?? 720;
  const height = opts.height ?? 44;
  const segments = buildTimelineSegments(feed, totalMs);

  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', String(height));
  svg.setAttribute('role', 'img');
  svg.setAttribute(
    'aria-label',
    'Linha do tempo dos períodos dentro e fora da área de leitura, perdas e pausas.',
  );

  if (segments.length === 0) {
    const text = document.createElementNS(svgNS, 'text');
    text.setAttribute('x', '8');
    text.setAttribute('y', String(height / 2 + 4));
    text.setAttribute('fill', '#52596b');
    text.setAttribute('font-size', '12');
    text.textContent = 'Dados insuficientes para a linha do tempo.';
    svg.appendChild(text);
  } else {
    for (const seg of segments) {
      const x = (seg.startMs / totalMs) * width;
      const w = Math.max(1, ((seg.endMs - seg.startMs) / totalMs) * width);
      const rect = document.createElementNS(svgNS, 'rect');
      rect.setAttribute('x', String(x));
      rect.setAttribute('y', '0');
      rect.setAttribute('width', String(w));
      rect.setAttribute('height', String(height));
      rect.setAttribute('fill', COLORS[seg.kind] ?? COLORS.missing);
      svg.appendChild(rect);
    }
  }

  container.innerHTML = '';
  container.appendChild(svg);
  return svg;
}

/**
 * Reduz uma lista de pontos para no máximo `maxPoints`, preservando a ordem.
 * @param {Array<{x:number,y:number}>} points
 * @param {number} maxPoints
 * @returns {Array<{x:number,y:number}>}
 */
export function reducePoints(points, maxPoints) {
  if (!Array.isArray(points) || points.length <= maxPoints) {
    return Array.isArray(points) ? points.slice() : [];
  }
  const step = Math.ceil(points.length / maxPoints);
  const out = [];
  for (let i = 0; i < points.length; i += step) {
    out.push(points[i]);
  }
  // garante o último ponto
  if (out[out.length - 1] !== points[points.length - 1]) {
    out.push(points[points.length - 1]);
  }
  return out;
}

/**
 * Agrupa amostras em sub-trajetos contínuos de pontos VÁLIDOS. Uma amostra
 * sem coordenada válida (perda) encerra o sub-trajeto atual, criando uma
 * lacuna que NÃO é preenchida nem suavizada.
 *
 * @param {Array<Object>} samples amostras da sessão
 * @returns {Array<Array<{x:number,y:number}>>}
 */
export function buildTrajectorySegments(samples) {
  const out = [];
  let run = [];
  for (const s of samples ?? []) {
    const valid =
      s.trackingStatus === 'valid' &&
      Number.isFinite(s.filteredX ?? s.rawX) &&
      Number.isFinite(s.filteredY ?? s.rawY);
    if (valid) {
      run.push({ x: s.filteredX ?? s.rawX, y: s.filteredY ?? s.rawY });
    } else if (run.length > 0) {
      out.push(run);
      run = [];
    }
  }
  if (run.length > 0) out.push(run);
  return out;
}

/**
 * Renderiza a trajetória aproximada em um canvas, usando as dimensões do
 * viewport registradas na sessão para escalar as coordenadas. Mostra lacunas
 * onde houve perda de dados (sub-trajetos separados). Ligada apenas quando a
 * qualidade dos dados permite (verificação feita pelo chamador).
 *
 * @param {HTMLCanvasElement} canvas
 * @param {Array<Object>} samples
 * @param {{viewportWidth:number,viewportHeight:number,maxPointsPerRun?:number,readingRect?:Object}} opts
 */
export function renderTrajectory(canvas, samples, opts = {}) {
  const vw = opts.viewportWidth || 1280;
  const vh = opts.viewportHeight || 800;
  const maxPointsPerRun = opts.maxPointsPerRun ?? 400;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  const sx = w / vw;
  const sy = h / vh;

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);

  // Contorno da área de leitura, se fornecido.
  if (opts.readingRect) {
    const r = opts.readingRect;
    ctx.strokeStyle = '#2f4a7a';
    ctx.lineWidth = 1;
    ctx.strokeRect(r.left * sx, r.top * sy, (r.right - r.left) * sx, (r.bottom - r.top) * sy);
  }

  const runs = buildTrajectorySegments(samples);
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = 'rgba(47, 74, 122, 0.75)';
  ctx.fillStyle = 'rgba(47, 74, 122, 0.55)';

  for (const run of runs) {
    const pts = reducePoints(run, maxPointsPerRun);
    if (pts.length === 1) {
      ctx.beginPath();
      ctx.arc(pts[0].x * sx, pts[0].y * sy, 1.5, 0, Math.PI * 2);
      ctx.fill();
      continue;
    }
    ctx.beginPath();
    pts.forEach((p, i) => {
      const px = p.x * sx;
      const py = p.y * sy;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();
  }
  return runs.length;
}

export { COLORS };
