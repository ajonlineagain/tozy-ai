/**
 * TOZY.AI — Page 1: System Dashboard (Executive Cockpit)
 * Market overview, heatmap, momentum scanners, educator mode
 */

import { NSE_FNO_STOCKS, INDICES, generateMomentumScanResults } from '../data/mock-market.js';

let intervals = [];
let vix = 13.45;
let advances = 1247;
let declines = 823;

export function mount(container) {
  const momentum = generateMomentumScanResults();
  const indices = { ...INDICES };

  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="4" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="11" width="7" height="10" rx="1"/></svg>
          System Dashboard
        </h1>
        <div class="subtitle">Executive Cockpit — Real-time Market Intelligence</div>
      </div>
      <div class="page-actions">
        <span class="badge badge-bull" style="padding:4px 12px;"><span class="status-dot online" style="margin-right:6px;"></span> Market Open</span>
      </div>
    </div>

    <!-- MARKET SNAPSHOT RIBBON -->
    <div class="marquee-ribbon" id="market-ribbon">
      <div class="marquee-inner" id="marquee-inner"></div>
    </div>

    <!-- METRICS ROW -->
    <div class="grid-4" style="margin-top:20px;" id="metrics-row"></div>

    <!-- HEATMAP -->
    <div class="card" style="margin-top:20px;padding:16px;">
      <div class="card-header">
        <span class="card-title">🗺️ F&O Heatmap — Open Interest Concentration</span>
        <div style="display:flex;gap:8px;align-items:center;">
          <span class="badge badge-bull">Bullish</span>
          <span class="badge badge-bear">Bearish</span>
          <span style="font-size:var(--text-xs);color:var(--text-muted);">Size = OI Weight</span>
        </div>
      </div>
      <div id="heatmap-grid" style="display:grid;grid-template-columns:repeat(12,1fr);gap:3px;"></div>
    </div>

    <!-- MOMENTUM SCANNERS -->
    <div class="grid-2" style="margin-top:20px;">
      <div class="card card-glow-bull">
        <div class="card-header">
          <span class="card-title">🔥 Top Gainers & Volume Spikes</span>
          <span class="badge badge-bull">${momentum.gainers.length}</span>
        </div>
        <div style="overflow-x:auto;">
          <table class="data-table" id="gainers-table">
            <thead><tr>
              <th>Symbol</th><th>LTP</th><th>Chg%</th><th>Vol Mult.</th>
            </tr></thead>
            <tbody></tbody>
          </table>
        </div>
      </div>
      <div class="card card-glow-bear">
        <div class="card-header">
          <span class="card-title">📉 Top Losers & Short Squeeze</span>
          <span class="badge badge-bear">${momentum.losers.length}</span>
        </div>
        <div style="overflow-x:auto;">
          <table class="data-table" id="losers-table">
            <thead><tr>
              <th>Symbol</th><th>LTP</th><th>Chg%</th><th>Vol Mult.</th>
            </tr></thead>
            <tbody></tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- EDUCATOR MODE -->
    <div class="card" style="margin-top:20px;">
      <div class="card-header">
        <span class="card-title">📢 Educator Mode Feed</span>
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:var(--text-xs);color:var(--text-muted);">Educator Mode</span>
          <input type="checkbox" class="toggle-switch" id="educator-toggle">
        </div>
      </div>
      <div id="educator-warning" style="display:none;padding:8px 12px;background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.2);border-radius:var(--radius-md);margin-bottom:12px;">
        <span style="font-size:var(--text-xs);color:var(--warning);">⚠️ Live data obfuscated — Historical mode active. Shared charts will use data ≥3 months old.</span>
      </div>
      <div class="feed-list">
        ${renderFeedItems()}
      </div>
      <div style="padding:12px 0 0;border-top:1px solid var(--border);margin-top:12px;">
        <span style="font-size:10px;color:var(--text-muted);">Per SEBI guidelines, shared charts use data ≥3 months old when Educator Mode is active to prevent unregistered advisory penalties.</span>
      </div>
    </div>
  `;

  // Render marquee
  renderMarquee(indices);

  // Render metrics
  renderMetrics(indices);

  // Render heatmap
  renderHeatmap();

  // Render scanner tables
  renderScannerTable('gainers-table', momentum.gainers, true);
  renderScannerTable('losers-table', momentum.losers, false);

  // Educator toggle
  const toggle = document.getElementById('educator-toggle');
  const warning = document.getElementById('educator-warning');
  if (toggle) {
    toggle.addEventListener('change', () => {
      warning.style.display = toggle.checked ? 'block' : 'none';
    });
  }

  // Simulate real-time index + VIX + breadth updates
  const iv = setInterval(() => {
    Object.keys(indices).forEach(key => {
      const idx = indices[key];
      const delta = (Math.random() - 0.48) * idx.ltp * 0.0003;
      idx.ltp = +(idx.ltp + delta).toFixed(2);
      idx.changePercent = +((idx.ltp - idx.prevClose) / idx.prevClose * 100).toFixed(2);
      idx.change = idx.changePercent;
    });
    // VIX and breadth drift
    vix = Math.max(9, Math.min(30, vix + (Math.random() - 0.5) * 0.05));
    advances += Math.round((Math.random() - 0.48) * 8);
    declines = Math.max(100, Math.min(2000, 2070 - advances));
    renderMarquee(indices);
    renderMetrics(indices);
  }, 3000);
  intervals.push(iv);
}

export function unmount() {
  intervals.forEach(id => clearInterval(id));
  intervals = [];
}

function renderMarquee(indices) {
  const el = document.getElementById('marquee-inner');
  if (!el) return;
  const items = Object.values(indices).map(idx => {
    const bull = idx.changePercent >= 0;
    const arrow = bull ? '▲' : '▼';
    const cls = bull ? 'bull' : 'bear';
    return `
      <span class="marquee-item">
        <span class="ticker-symbol">${idx.name}</span>
        <span class="ticker-value">${fmt(idx.ltp)}</span>
        <span class="ticker-change ${cls}">${arrow} ${Math.abs(idx.changePercent).toFixed(2)}%</span>
      </span>`;
  }).join('');
  el.innerHTML = items + items;
}

function renderMetrics(indices) {
  const row = document.getElementById('metrics-row');
  if (!row) return;
  const n = indices.nifty50;
  const b = indices.banknifty;
  const nBull = n.changePercent >= 0;
  const bBull = b.changePercent >= 0;
  row.innerHTML = `
    <div class="metric-card">
      <div class="metric-label">NIFTY 50</div>
      <div class="metric-value">${fmt(n.ltp)}</div>
      <div class="metric-change" style="color:var(--${nBull ? 'bull' : 'bear'});">${nBull ? '▲' : '▼'} ${Math.abs(n.changePercent).toFixed(2)}%</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">BANK NIFTY</div>
      <div class="metric-value">${fmt(b.ltp)}</div>
      <div class="metric-change" style="color:var(--${bBull ? 'bull' : 'bear'});">${bBull ? '▲' : '▼'} ${Math.abs(b.changePercent).toFixed(2)}%</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">INDIA VIX</div>
      <div class="metric-value">${vix.toFixed(2)}</div>
      <div class="metric-change" style="color:var(--warning);">▲ ${(Math.random()*0.5).toFixed(2)}%</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">MARKET BREADTH</div>
      <div class="metric-value" style="font-size:var(--text-base);">${advances.toLocaleString('en-IN')} / ${declines.toLocaleString('en-IN')}</div>
      <div class="metric-change" style="color:${advances > declines ? 'var(--bull)' : 'var(--bear)'}">${advances > declines ? 'Advances Lead' : 'Declines Lead'}</div>
    </div>
  `;
}

function renderHeatmap() {
  const grid = document.getElementById('heatmap-grid');
  if (!grid) return;
  const sorted = [...NSE_FNO_STOCKS].sort((a, b) => b.marketCap - a.marketCap);
  grid.innerHTML = sorted.map(stock => {
    const bull = stock.change >= 0;
    const intensity = Math.min(0.55, Math.abs(stock.change) / 4.5);
    const bg = bull
      ? `rgba(16,185,129,${intensity + 0.08})`
      : `rgba(239,68,68,${intensity + 0.08})`;
    const textColor = intensity > 0.25 ? '#F9FAFB' : (bull ? 'var(--bull)' : 'var(--bear)');
    // Fixed 12-col grid: mega-caps span 3 cols + 2 rows, large-caps span 2 cols
    const colSpan = stock.marketCap > 1200000 ? 3 : stock.marketCap > 500000 ? 2 : 1;
    const rowSpan = stock.marketCap > 1200000 ? 2 : 1;
    const minH = stock.marketCap > 1200000 ? '80px' : '52px';
    const fSize = stock.marketCap > 500000 ? '11px' : '9px';
    return `
      <div style="background:${bg};border-radius:6px;padding:8px 6px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;transition:all 0.2s;border:1px solid transparent;grid-column:span ${colSpan};grid-row:span ${rowSpan};min-height:${minH};"
        onmouseenter="this.style.borderColor='var(--accent)';this.style.transform='scale(1.04)';this.style.zIndex='5';"
        onmouseleave="this.style.borderColor='transparent';this.style.transform='scale(1)';this.style.zIndex='1';"
        title="${stock.name}\nLTP: ₹${fmt(stock.ltp)}\nOI: ${fmtNum(stock.oi)}\nVol: ${fmtNum(stock.volume)}">
        <span style="font-weight:700;font-size:${fSize};color:${textColor};line-height:1.2;">${stock.symbol}</span>
        <span style="font-family:var(--font-mono);font-size:${fSize};color:${textColor};margin-top:2px;">${stock.change >= 0 ? '+' : ''}${stock.change.toFixed(1)}%</span>
      </div>`;
  }).join('');
}

function renderScannerTable(id, items, isGainers) {
  const tbody = document.querySelector(`#${id} tbody`);
  if (!tbody) return;
  tbody.innerHTML = items.map(item => {
    const bull = item.change >= 0;
    const arrow = bull ? '▲' : '▼';
    const vmBadge = item.volumeMultiplier >= 3 ? 'badge-warning' : item.volumeMultiplier >= 2 ? 'badge-bull' : 'badge-neutral';
    return `<tr>
      <td style="font-weight:600;">${item.symbol}</td>
      <td class="cell-mono">₹${fmt(item.ltp)}</td>
      <td class="${bull ? 'cell-bull' : 'cell-bear'} cell-mono">${arrow} ${Math.abs(item.change).toFixed(2)}%</td>
      <td><span class="badge ${vmBadge}">${item.volumeMultiplier.toFixed(1)}x</span></td>
    </tr>`;
  }).join('');
}

function renderFeedItems() {
  const feeds = [
    { user: 'QuantTrader_IN', initial: 'Q', time: '2 min ago', text: 'NIFTY showing Double Top at 24,650 resistance on 15m chart. PCR at 1.2 suggests Put writers are confident. Watching for a breakdown below 24,500.', color: 'var(--accent)' },
    { user: 'OptionsGuru', initial: 'O', time: '8 min ago', text: 'Heavy Call writing at 24,700CE strike. OI added: 12.5L contracts. This acts as a strong resistance. Max Pain at 24,500.', color: 'var(--bull)' },
    { user: 'NiftyScalper', initial: 'N', time: '15 min ago', text: 'BANKNIFTY ascending triangle on daily chart. Breakout above 52,200 can track to 52,800. Risk Boundary at 51,800.', color: 'var(--warning)' },
  ];
  return feeds.map(f => `
    <div class="feed-item">
      <div class="feed-header">
        <div class="feed-avatar" style="background:${f.color}20;color:${f.color};">${f.initial}</div>
        <span class="feed-username">${f.user}</span>
        <span class="feed-time">${f.time}</span>
      </div>
      <p style="font-size:var(--text-xs);color:var(--text-secondary);line-height:1.6;margin:0 0 8px;">${f.text}</p>
      <button class="btn btn-outline btn-sm" style="font-size:10px;">📷 Export Screenshot</button>
    </div>
  `).join('');
}

function fmt(n) {
  return Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtNum(n) {
  if (n >= 10000000) return (n / 10000000).toFixed(1) + ' Cr';
  if (n >= 100000) return (n / 100000).toFixed(1) + ' L';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}
