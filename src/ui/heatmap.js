// Mapa de ocupação / "heatmap" simplificado (Canvas 2D nativo).
//
// Distribui as amostras VÁLIDAS em uma grade e colore cada célula conforme a
// densidade de amostras. É uma representação APROXIMADA da ocupação do olhar
// sobre o viewport/área de leitura, rotulada como tal pelo chamador. Não
// representa atenção nem qualquer condição clínica.

/**
 * Constrói a grade de ocupação a partir das amostras válidas.
 *
 * @param {Array<Object>} samples amostras da sessão
 * @param {{viewportWidth:number,viewportHeight:number,cols?:number,rows?:number}} opts
 * @returns {{grid:number[][],cols:number,rows:number,max:number,validCount:number}}
 */
export function buildOccupancyGrid(samples, opts = {}) {
  const vw = opts.viewportWidth || 1280;
  const vh = opts.viewportHeight || 800;
  const cols = opts.cols ?? 24;
  const rows = opts.rows ?? 16;

  const grid = Array.from({ length: rows }, () => new Array(cols).fill(0));
  let max = 0;
  let validCount = 0;

  for (const s of samples ?? []) {
    if (s.trackingStatus !== 'valid') continue;
    const x = Number.isFinite(s.filteredX) ? s.filteredX : s.rawX;
    const y = Number.isFinite(s.filteredY) ? s.filteredY : s.rawY;
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;

    let cx = Math.floor((x / vw) * cols);
    let cy = Math.floor((y / vh) * rows);
    cx = Math.min(cols - 1, Math.max(0, cx));
    cy = Math.min(rows - 1, Math.max(0, cy));

    grid[cy][cx] += 1;
    validCount += 1;
    if (grid[cy][cx] > max) max = grid[cy][cx];
  }

  return { grid, cols, rows, max, validCount };
}

/**
 * Renderiza o mapa de ocupação em um canvas.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {Array<Object>} samples
 * @param {{viewportWidth:number,viewportHeight:number,cols?:number,rows?:number,readingRect?:Object}} opts
 * @returns {{validCount:number,max:number}}
 */
export function renderHeatmap(canvas, samples, opts = {}) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return { validCount: 0, max: 0 };

  const { grid, cols, rows, max, validCount } = buildOccupancyGrid(samples, opts);
  const w = canvas.width;
  const h = canvas.height;
  const cellW = w / cols;
  const cellH = h / rows;

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);

  if (max > 0) {
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        const v = grid[r][c];
        if (v === 0) continue;
        const intensity = v / max; // 0..1
        // Escala de azul para verde (sóbria), opacidade conforme densidade.
        const alpha = 0.15 + intensity * 0.75;
        const red = Math.round(47 + intensity * 20);
        const green = Math.round(74 + intensity * 70);
        const blue = Math.round(122 - intensity * 40);
        ctx.fillStyle = `rgba(${red}, ${green}, ${blue}, ${alpha})`;
        ctx.fillRect(c * cellW, r * cellH, Math.ceil(cellW), Math.ceil(cellH));
      }
    }
  }

  // Contorno da área de leitura, se fornecido.
  if (opts.readingRect) {
    const vw = opts.viewportWidth || 1280;
    const vh = opts.viewportHeight || 800;
    const sx = w / vw;
    const sy = h / vh;
    const rr = opts.readingRect;
    ctx.strokeStyle = 'rgba(31, 36, 48, 0.6)';
    ctx.lineWidth = 1;
    ctx.strokeRect(rr.left * sx, rr.top * sy, (rr.right - rr.left) * sx, (rr.bottom - rr.top) * sy);
  }

  if (max === 0) {
    ctx.fillStyle = '#52596b';
    ctx.font = '13px sans-serif';
    ctx.fillText('Dados insuficientes para o mapa de ocupação.', 10, h / 2);
  }

  return { validCount, max };
}
