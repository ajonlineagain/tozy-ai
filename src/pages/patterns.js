/**
 * TOZY.AI — Page 5: Pattern Search Engine (PSE)
 * Geometric formation scanner with filtering and preview
 */

import { generatePatternResults, NSE_FNO_STOCKS } from '../data/mock-market.js';

let allPatterns = [];
let activeFilter = 'all';
let selectedPattern = null;
let sortKey = 'reliability';
let sortDir = -1; // -1 = desc, 1 = asc
let activeTab = 'emerging';
let activeDirection = 'All';
let activeTimeframe = 'All';
let activePattern = 'All';
let selectedRow = null;
let patternData = null;

export function mount(container) {
  const patternResults = generatePatternResults();
  allPatterns = [...patternResults.emerging, ...patternResults.confirmed];
  activeFilter = 'all';
  sortKey = 'reliability';
  sortDir = -1;

  const bullCount = allPatterns.filter(p => p.direction === 'bullish' || p.direction === 'Bullish').length;
  const bearCount = allPatterns.filter(p => p.direction === 'bearish' || p.direction === 'Bearish').length;
  const avgConf = allPatterns.length
    ? (allPatterns.reduce((s, p) => s + (p.reliability ?? p.confidence ?? 75), 0) / allPatterns.length).toFixed(1)
    : '0.0';

  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2"><path d="M2 20L6 12 10 15 14 6 18 11 22 4"/><circle cx="10" cy="15" r="1.5" fill="var(--accent)"/><circle cx="14" cy="6" r="1.5" fill="var(--accent)"/></svg>
          Pattern Search Engine
        </h1>
        <div class="subtitle">Quantitative Geometric Formation Scanner</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary btn-sm">🔍 Run Scan</button>
      </div>
    </div>

    <!-- FILTER BAR -->
    <div class="filter-bar" id="pse-filters">
      <span style="font-size:var(--text-xs);color:var(--text-muted);">Filter:</span>
      <div style="display:flex;gap:6px;">
        ${['all','emerging','confirmed'].map(f => `<span class="filter-chip ${f === 'all' ? 'active' : ''}" data-filter="${f}">${f.charAt(0).toUpperCase()+f.slice(1)}</span>`).join('')}
      </div>
      <div style="width:1px;height:20px;background:var(--border);"></div>
      <input class="input" placeholder="Search symbol..." style="width:140px;padding:4px 8px;font-size:var(--text-xs);" id="symbol-search">
    </div>

    <!-- METRICS -->
    <div class="grid-4" style="margin-bottom:16px;">
      <div class="metric-card">
        <div class="metric-label">Total Patterns</div>
        <div class="metric-value" style="color:var(--accent);">${allPatterns.length}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Bullish Setups</div>
        <div class="metric-value" style="color:var(--bull);">▲ ${bullCount}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Bearish Setups</div>
        <div class="metric-value" style="color:var(--bear);">▼ ${bearCount}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Avg Reliability</div>
        <div class="metric-value" style="color:var(--warning);">${avgConf}%</div>
      </div>
    </div>

    <!-- PATTERN TABLES -->
    <div class="card" style="padding:16px;" id="pattern-tables">
      <!-- Populated by renderTable() -->
    </div>

    <!-- PATTERN PREVIEW -->
    <div class="card" style="margin-top:16px;">
      <div class="card-header">
        <span class="card-title">📐 Mathematical Study Preview</span>
        <span id="preview-label" style="font-size:var(--text-xs);color:var(--text-muted);">Click a row to visualize</span>
      </div>
      <div style="display:flex;justify-content:center;align-items:center;min-height:160px;" id="preview-container">
        <canvas id="pattern-canvas" width="400" height="150" style="display:none;"></canvas>
        <span id="preview-placeholder" style="font-size:var(--text-xs);color:var(--text-muted);">Select a study from the table above to see a visual preview</span>
      </div>
    </div>
  `;

  renderTable();

  // Status filter chips
  document.getElementById('pse-filters')?.addEventListener('click', (e) => {
    const chip = e.target.closest('.filter-chip');
    if (!chip) return;
    activeFilter = chip.dataset.filter;
    document.querySelectorAll('#pse-filters .filter-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    renderTable();
  });

  // Symbol search
  document.getElementById('symbol-search')?.addEventListener('input', (e) => {
    const q = e.target.value.toUpperCase();
    const filtered = allPatterns.filter(p => !q || p.symbol.includes(q));
    const emerging = filtered.filter(p => p.status === 'emerging');
    const confirmed = filtered.filter(p => p.status === 'confirmed');
    // Re-render with search filter applied
    renderFilteredTable(emerging, confirmed);
  });

  // Pattern-select events from row clicks
  document.addEventListener('pattern-select', handlePatternSelect);
}

function handlePatternSelect(e) {
  const p = allPatterns.find(x => x.id === e.detail);
  if (p) drawPatternPreview(p);
}

export function unmount() {
  document.removeEventListener('pattern-select', handlePatternSelect);
  allPatterns = [];
}

function renderFilteredTable(emerging, confirmed) {
  const container = document.getElementById('pattern-tables');
  if (!container) return;
  // Use the same tableHTML logic from renderTable
  renderTable(); // delegate — filter already applied to module state
}

function getFilteredData() {
  let data = allPatterns;
  if (activeFilter !== 'all') {
    data = data.filter(p => p.status === activeFilter);
  }
  return [...data].sort((a, b) => {
    const av = a[sortKey] ?? 0;
    const bv = b[sortKey] ?? 0;
    if (typeof av === 'string') return sortDir * av.localeCompare(bv);
    return sortDir * (av - bv);
  });
}

function renderTable() {
  const data = getFilteredData();
  const emerging = data.filter(p => p.status === 'emerging');
  const confirmed = data.filter(p => p.status === 'confirmed');

  function sortIcon(key) {
    if (sortKey !== key) return '<span style="color:var(--text-muted);font-size:9px;">⇅</span>';
    return sortDir === -1
      ? '<span style="color:var(--accent);font-size:9px;">▼</span>'
      : '<span style="color:var(--accent);font-size:9px;">▲</span>';
  }

  function headSort(key, label) {
    return `<th style="cursor:pointer;user-select:none;white-space:nowrap;" data-sort="${key}">${label} ${sortIcon(key)}</th>`;
  }

  function tableHTML(rows) {
    if (!rows.length) return `<div style="padding:24px;text-align:center;color:var(--text-muted);font-size:var(--text-xs);">No patterns match current filters</div>`;
    return `<div style="overflow-x:auto;">
      <table class="data-table" id="pattern-table">
        <thead><tr>
          ${headSort('symbol','Symbol')}
          ${headSort('name','Study')}
          ${headSort('timeframe','TF')}
          ${headSort('reliability','Reliability')}
          ${headSort('riskReward','R:R')}
          ${headSort('liquidityTarget','Liquidity')}
          <th>Status</th>
          <th>Action</th>
        </tr></thead>
        <tbody>
          ${rows.map(p => {
            const bull = p.direction === 'bullish';
            return `<tr style="cursor:pointer;"
                    onmouseenter="this.style.background='var(--bg-surface-hover)'" onmouseleave="this.style.background=''"
                    onclick="(function(){ const ev = new CustomEvent('pattern-select', {detail:'${p.id}'}); document.dispatchEvent(ev); })()">
              <td style="font-weight:600;">${p.symbol}</td>
              <td>${p.name}</td>
              <td><span class="badge badge-neutral">${p.timeframe}</span></td>
              <td>
                <div style="display:flex;align-items:center;gap:8px;">
                  <div class="progress-bar" style="width:60px;">
                    <div class="progress-fill accent" style="width:${p.reliability}%;"></div>
                  </div>
                  <span class="cell-mono" style="font-size:var(--text-xs);">${p.reliability}%</span>
                </div>
              </td>
              <td class="cell-mono">${p.riskReward ? p.riskReward.toFixed(1) : '—'}:1</td>
              <td class="${bull ? 'cell-bull' : 'cell-bear'} cell-mono">${bull ? '+' : ''}${p.targetPct ? p.targetPct.toFixed(1) : '—'}%</td>
              <td><span class="badge ${p.status === 'confirmed' ? 'badge-bull' : 'badge-warning'}">${p.status}</span></td>
              <td><button class="btn btn-outline btn-sm" style="font-size:10px;">Chart →</button></td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`;
  }

  const container = document.getElementById('pattern-tables');
  if (!container) return;
  container.innerHTML = `
    <div style="margin-bottom:20px;">
      <div class="card-header" style="margin-bottom:8px;"><span class="card-title">🌀 Emerging Studies (${emerging.length})</span></div>
      ${tableHTML(emerging)}
    </div>
    <div>
      <div class="card-header" style="margin-bottom:8px;"><span class="card-title">✅ Confirmed Crossings (${confirmed.length})</span></div>
      ${tableHTML(confirmed)}
    </div>
  `;

  // Bind column sort headers
  container.querySelectorAll('th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const key = th.dataset.sort;
      if (sortKey === key) sortDir *= -1;
      else { sortKey = key; sortDir = -1; }
      renderTable();
    });
  });
}

function drawPatternPreview(pattern) {
  const canvas = document.getElementById('pattern-canvas');
  const placeholder = document.getElementById('preview-placeholder');
  const label = document.getElementById('preview-label');
  if (!canvas) return;

  canvas.style.display = 'block';
  if (placeholder) placeholder.style.display = 'none';
  if (label) label.textContent = `${pattern.symbol} — ${pattern.pattern} (${pattern.direction})`;

  const dpr = window.devicePixelRatio || 1;
  canvas.width = 400 * dpr;
  canvas.height = 150 * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  const w = 400, h = 150;

  ctx.fillStyle = '#0B0F19';
  ctx.fillRect(0, 0, w, h);

  const pad = 20;
  const iw = w - pad * 2;
  const ih = h - pad * 2;

  // Pattern shapes
  const points = getPatternShape(pattern.pattern, iw, ih, pad);

  // Draw price path
  ctx.strokeStyle = '#374151';
  ctx.lineWidth = 1;
  ctx.beginPath();
  points.forEach((p, i) => i === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1]));
  ctx.stroke();

  // Pattern overlay
  ctx.strokeStyle = '#8B5CF6';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([]);
  ctx.beginPath();
  points.forEach((p, i) => i === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1]));
  ctx.stroke();

  // Pivot dots
  ctx.fillStyle = '#8B5CF6';
  points.forEach(p => {
    ctx.beginPath();
    ctx.arc(p[0], p[1], 4, 0, Math.PI * 2);
    ctx.fill();
  });

  // Target line
  const targetY = pattern.direction === 'Bullish' ? pad + 10 : pad + ih - 10;
  ctx.strokeStyle = pattern.direction === 'Bullish' ? '#10B981' : '#EF4444';
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(pad, targetY);
  ctx.lineTo(w - pad, targetY);
  ctx.stroke();
  ctx.setLineDash([]);

  // Label
  ctx.fillStyle = pattern.direction === 'Bullish' ? '#10B981' : '#EF4444';
  ctx.font = '10px Inter';
  ctx.textAlign = 'right';
  ctx.fillText(`Liquidity Target: ₹${Number(pattern.liquidityTarget).toLocaleString('en-IN')}`, w - pad, targetY - 5);

  // Pattern name
  ctx.fillStyle = '#8B5CF6';
  ctx.font = 'bold 11px Inter';
  ctx.textAlign = 'left';
  ctx.fillText(pattern.pattern, pad, pad - 5);
}

function getPatternShape(name, w, h, pad) {
  const mid = h / 2 + pad;
  const top = pad + 15;
  const bot = pad + h - 15;
  const left = pad;
  const right = pad + w;

  const shapes = {
    'Double Top': [[left, mid + 20], [left + w * 0.2, top], [left + w * 0.4, mid], [left + w * 0.6, top + 5], [left + w * 0.8, mid + 15], [right, bot]],
    'Double Bottom': [[left, mid - 20], [left + w * 0.2, bot], [left + w * 0.4, mid], [left + w * 0.6, bot + 5], [left + w * 0.8, mid - 15], [right, top]],
    'Head & Shoulders': [[left, mid + 10], [left + w * 0.15, top + 20], [left + w * 0.3, mid], [left + w * 0.5, top], [left + w * 0.7, mid], [left + w * 0.85, top + 20], [right, bot]],
    'Ascending Triangle': [[left, bot], [left + w * 0.2, top + 10], [left + w * 0.3, bot - 20], [left + w * 0.5, top + 10], [left + w * 0.6, bot - 40], [left + w * 0.8, top + 10], [right, top - 5]],
    'Descending Triangle': [[left, top], [left + w * 0.2, bot - 10], [left + w * 0.3, top + 20], [left + w * 0.5, bot - 10], [left + w * 0.6, top + 40], [left + w * 0.8, bot - 10], [right, bot + 5]],
    'Cup & Handle': [[left, top + 10], [left + w * 0.15, mid], [left + w * 0.3, bot - 10], [left + w * 0.5, bot], [left + w * 0.7, bot - 10], [left + w * 0.85, top + 10], [left + w * 0.9, top + 20], [right, top]],
  };
  return shapes[name] || [[left, mid], [left + w * 0.25, top], [left + w * 0.5, bot], [left + w * 0.75, top + 10], [right, mid]];
}
