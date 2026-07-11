/**
 * TOZY.AI — Page 2: Advanced Charting Canvas & Visual IDE
 * Multi-format chart engine, MTFA toolbar, script editor
 */

import { generateOHLCV } from '../data/mock-market.js';
import { ChartEngine } from '../lib/chart-engine.js';
import { ema, bollingerBands } from '../lib/indicators.js';

let chart = null;
let resizeObserver = null;
let ohlcvData = null;
let activeTimeframe = 'D';
let activeChartType = 'candle';
let activeOverlays = new Set();
let editorOpen = false;

const TIMEFRAMES = [
  { key: '1m', label: '1m', count: 500, tf: '1min' },
  { key: '5m', label: '5m', count: 400, tf: '5min' },
  { key: '15m', label: '15m', count: 300, tf: '15min' },
  { key: '1H', label: '1H', count: 250, tf: '60min' },
  { key: '4H', label: '4H', count: 200, tf: '4hour' },
  { key: 'D', label: 'D', count: 300, tf: 'daily' },
  { key: 'W', label: 'W', count: 150, tf: 'weekly' },
  { key: 'M', label: 'M', count: 60, tf: 'monthly' },
];

const CHART_TYPES = [
  { key: 'candle', label: 'Candle' },
  { key: 'line', label: 'Line' },
  { key: 'hollow', label: 'Hollow' },
  { key: 'bar', label: 'Bar' },
  { key: 'heikinashi', label: 'H.Ashi' },
];

const INDICATORS = [
  { key: 'sma20', label: 'SMA(20)', color: '#F59E0B', fn: d => { const r = []; const s = d.map(x=>x.close); for(let i=19;i<s.length;i++){ const avg=s.slice(i-19,i+1).reduce((a,b)=>a+b,0)/20; r.push({time:d[i].time,value:avg}); } return r; } },
  { key: 'ema9',   label: 'EMA(9)',   color: '#8B5CF6', fn: d => ema(d, 9) },
  { key: 'ema21',  label: 'EMA(21)',  color: '#EC4899', fn: d => ema(d, 21) },
  { key: 'bb',     label: 'Bollinger', color: '#6366F1', fn: d => bollingerBands(d, 20, 2) },
];

export function mount(container) {
  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2"><path d="M3 3v18h18"/><path d="M7 16l4-8 4 4 5-9"/></svg>
          Advanced Charting
        </h1>
        <div class="subtitle">Technical Analysis Canvas & Visual IDE</div>
      </div>
      <div class="page-actions" style="display:flex;gap:8px;align-items:center;">
        <div style="display:flex;align-items:center;gap:6px;padding:6px 12px;background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-md);">
          <span style="font-size:var(--text-xs);color:var(--text-muted);">Symbol:</span>
          <span style="font-weight:700;color:var(--text-primary);font-size:var(--text-sm);">NIFTY 50</span>
          <span style="color:var(--text-muted);font-size:var(--text-xs);">▼</span>
        </div>
      </div>
    </div>

    <!-- CHART CONTAINER -->
    <div class="card" style="padding:0;overflow:hidden;" id="chart-card">
      <!-- TOOLBAR -->
      <div class="toolbar" style="border-bottom:1px solid var(--border);padding:6px 12px;flex-wrap:wrap;">
        <!-- Chart Type -->
        <div style="display:flex;gap:2px;" id="chart-type-group">
          ${CHART_TYPES.map(t => `
            <button class="btn btn-ghost btn-sm ${t.key === activeChartType ? 'active' : ''}" data-type="${t.key}" style="font-size:11px;${t.key === activeChartType ? 'color:var(--accent);background:var(--accent-bg);' : ''}">${t.label}</button>
          `).join('')}
        </div>
        <div style="width:1px;height:20px;background:var(--border);margin:0 6px;"></div>
        <!-- Timeframe -->
        <div style="display:flex;gap:2px;" id="tf-group">
          ${TIMEFRAMES.map(t => `
            <button class="btn btn-ghost btn-sm ${t.key === activeTimeframe ? 'active' : ''}" data-tf="${t.key}" style="font-size:11px;padding:4px 8px;${t.key === activeTimeframe ? 'color:var(--accent);background:var(--accent-bg);' : ''}">${t.label}</button>
          `).join('')}
        </div>
        <div style="width:1px;height:20px;background:var(--border);margin:0 6px;"></div>
        <!-- Drawing Tools -->
        <div style="display:flex;gap:2px;">
          <button class="btn btn-ghost btn-sm" title="Trendline" style="font-size:13px;">📏</button>
          <button class="btn btn-ghost btn-sm" title="Fibonacci" style="font-size:13px;">📐</button>
          <button class="btn btn-ghost btn-sm" title="S/R Zone" style="font-size:13px;">═</button>
        </div>
        <div style="width:1px;height:20px;background:var(--border);margin:0 6px;"></div>
        <!-- Indicators -->
        <div style="display:flex;gap:2px;align-items:center;" id="indicator-group">
          ${INDICATORS.map(ind => `
            <button class="btn btn-ghost btn-sm" data-ind="${ind.key}" style="font-size:10px;border:1px solid var(--border);" title="Toggle ${ind.label}">${ind.label}</button>
          `).join('')}
          <span class="badge badge-accent" style="margin-left:4px;font-size:9px;" id="overlay-count">0</span>
        </div>
        <div style="flex:1;"></div>
        <!-- MTFA Toggle -->
        <div style="display:flex;align-items:center;gap:6px;">
          <span style="font-size:10px;color:var(--text-muted);">MTFA</span>
          <input type="checkbox" class="toggle-switch" title="Multi-Timeframe Analysis">
        </div>
      </div>

      <!-- OHLCV INFO BAR -->
      <div id="ohlcv-bar" style="padding:4px 12px;font-family:var(--font-mono);font-size:11px;color:var(--text-muted);background:var(--bg-surface);border-bottom:1px solid var(--border);display:flex;gap:16px;">
        <span>O: <span id="info-o">—</span></span>
        <span>H: <span id="info-h">—</span></span>
        <span>L: <span id="info-l">—</span></span>
        <span>C: <span id="info-c">—</span></span>
        <span>V: <span id="info-v">—</span></span>
      </div>

      <!-- CANVAS -->
      <div id="chart-wrapper" style="width:100%;height:62vh;position:relative;background:var(--bg-primary);">
        <canvas id="main-chart" style="width:100%;height:100%;"></canvas>
      </div>
    </div>

    <!-- SCRIPT EDITOR -->
    <div style="margin-top:12px;">
      <button class="btn btn-outline btn-sm" id="toggle-editor" style="font-size:11px;">&lt;/&gt; Script Editor</button>
    </div>
    <div id="editor-panel" style="display:none;margin-top:8px;">
      <div class="code-editor-container">
        <div class="code-editor-header">
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="display:flex;gap:4px;">
              <span style="width:10px;height:10px;border-radius:50%;background:#EF4444;"></span>
              <span style="width:10px;height:10px;border-radius:50%;background:#F59E0B;"></span>
              <span style="width:10px;height:10px;border-radius:50%;background:#10B981;"></span>
            </div>
            <span style="font-size:var(--text-xs);color:var(--text-secondary);">custom_indicator.js</span>
            <span class="badge badge-accent" style="font-size:8px;">JavaScript</span>
          </div>
          <div style="display:flex;gap:4px;">
            <button class="btn btn-success btn-sm" style="font-size:10px;">▶ Run</button>
            <button class="btn btn-ghost btn-sm" style="font-size:10px;" id="close-editor">✕</button>
          </div>
        </div>
        <div class="code-editor-body"><span style="color:var(--text-muted);">  1 │</span> <span style="color:#6B7280;">// TOZY.AI Custom Indicator — EMA Crossover</span>
<span style="color:var(--text-muted);">  2 │</span> <span style="color:#6B7280;">// Supports standard JavaScript + math/stats packages</span>
<span style="color:var(--text-muted);">  3 │</span>
<span style="color:var(--text-muted);">  4 │</span> <span style="color:#C084FC;">function</span> <span style="color:#F9FAFB;">emaSignal</span>(<span style="color:#F59E0B;">data</span>, <span style="color:#F59E0B;">fastPeriod</span> = <span style="color:#10B981;">9</span>, <span style="color:#F59E0B;">slowPeriod</span> = <span style="color:#10B981;">21</span>) {
<span style="color:var(--text-muted);">  5 │</span>   <span style="color:#C084FC;">const</span> fast = <span style="color:#F9FAFB;">ema</span>(data, fastPeriod);
<span style="color:var(--text-muted);">  6 │</span>   <span style="color:#C084FC;">const</span> slow = <span style="color:#F9FAFB;">ema</span>(data, slowPeriod);
<span style="color:var(--text-muted);">  7 │</span>
<span style="color:var(--text-muted);">  8 │</span>   <span style="color:#C084FC;">return</span> fast.<span style="color:#F9FAFB;">map</span>((<span style="color:#F59E0B;">f</span>, <span style="color:#F59E0B;">i</span>) => ({
<span style="color:var(--text-muted);">  9 │</span>     time: f.time,
<span style="color:var(--text-muted);"> 10 │</span>     signal: f.value > slow[i]?.value ? <span style="color:#10B981;">'BUY'</span> : <span style="color:#EF4444;">'SELL'</span>,
<span style="color:var(--text-muted);"> 11 │</span>     strength: Math.<span style="color:#F9FAFB;">abs</span>(f.value - (slow[i]?.value || <span style="color:#10B981;">0</span>))
<span style="color:var(--text-muted);"> 12 │</span>   }));
<span style="color:var(--text-muted);"> 13 │</span> }
<span style="color:var(--text-muted);"> 14 │</span>
<span style="color:var(--text-muted);"> 15 │</span> <span style="color:#6B7280;">// Register with TOZY engine</span>
<span style="color:var(--text-muted);"> 16 │</span> tozy.<span style="color:#F9FAFB;">registerIndicator</span>(<span style="color:#10B981;">'EMA Crossover'</span>, emaSignal);</div>
      </div>
      <div class="tab-bar" style="margin-top:0;border-top:1px solid var(--border);margin-bottom:0;">
        <div class="tab active">Console</div>
        <div class="tab">Debug Log</div>
        <div class="tab">Packages</div>
      </div>
      <div style="background:#0a0e17;padding:8px 12px;font-family:var(--font-mono);font-size:10px;color:var(--text-muted);border:1px solid var(--border);border-top:none;border-radius:0 0 var(--radius-md) var(--radius-md);max-height:80px;overflow-y:auto;">
        <div style="color:var(--bull);">✓ Indicator compiled successfully (2ms)</div>
        <div style="color:var(--text-muted);">[09:31:02] Signal: BUY | Strength: 42.7 | Fast EMA: 24,512.3 | Slow EMA: 24,469.6</div>
        <div style="color:var(--text-muted);">[09:31:02] Applied to 287 candles. 143 BUY signals, 144 SELL signals.</div>
      </div>
    </div>
  `;

  // Initialize chart
  const canvas = document.getElementById('main-chart');
  const wrapper = document.getElementById('chart-wrapper');
  if (canvas && wrapper) {
    canvas.width = wrapper.clientWidth;
    canvas.height = wrapper.clientHeight;
    chart = new ChartEngine(canvas);
    loadData('D');

    // Crosshair data callback with API guard + mousemove fallback
    if (typeof chart.onCrosshairMove === 'function') {
      chart.onCrosshairMove((info) => {
        if (info && info.candle) updateOHLCVBar(info.candle);
      });
    } else {
      // Fallback: show last candle data on mousemove over canvas
      canvas.addEventListener('mousemove', () => {
        if (ohlcvData && ohlcvData.length > 0) {
          updateOHLCVBar(ohlcvData[ohlcvData.length - 1]);
        }
      });
      // Show last candle immediately
      if (ohlcvData && ohlcvData.length > 0) updateOHLCVBar(ohlcvData[ohlcvData.length - 1]);
    }

    // ResizeObserver
    resizeObserver = new ResizeObserver(() => {
      if (chart) chart.resize();
    });
    resizeObserver.observe(wrapper);
  }

  // Chart type buttons
  document.getElementById('chart-type-group')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-type]');
    if (!btn) return;
    activeChartType = btn.dataset.type;
    document.querySelectorAll('#chart-type-group .btn').forEach(b => {
      b.style.color = b.dataset.type === activeChartType ? 'var(--accent)' : '';
      b.style.background = b.dataset.type === activeChartType ? 'var(--accent-bg)' : '';
    });
    if (chart) chart.setChartType(activeChartType);
  });

  // Timeframe buttons
  document.getElementById('tf-group')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-tf]');
    if (!btn) return;
    activeTimeframe = btn.dataset.tf;
    document.querySelectorAll('#tf-group .btn').forEach(b => {
      b.style.color = b.dataset.tf === activeTimeframe ? 'var(--accent)' : '';
      b.style.background = b.dataset.tf === activeTimeframe ? 'var(--accent-bg)' : '';
    });
    loadData(activeTimeframe);
  });

  // Indicator buttons
  document.getElementById('indicator-group')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-ind]');
    if (!btn) return;
    const key = btn.dataset.ind;
    if (activeOverlays.has(key)) {
      activeOverlays.delete(key);
      chart?.removeOverlay(key);
      btn.style.color = '';
      btn.style.background = '';
      btn.style.borderColor = 'var(--border)';
    } else {
      activeOverlays.add(key);
      const ind = INDICATORS.find(i => i.key === key);
      if (ind && ohlcvData && chart) {
        const result = ind.fn(ohlcvData);
        if (key === 'bb') {
          chart.addOverlay('bb-upper', result.map(r => ({ time: r.time, value: r.upper })), '#6366F1', 1);
          chart.addOverlay('bb-lower', result.map(r => ({ time: r.time, value: r.lower })), '#6366F1', 1);
          chart.addOverlay('bb-mid', result.map(r => ({ time: r.time, value: r.middle })), '#6366F180', 1);
        } else {
          chart.addOverlay(key, result, ind.color, 1.5);
        }
      }
      btn.style.color = 'var(--accent)';
      btn.style.background = 'var(--accent-bg)';
      btn.style.borderColor = 'var(--accent)';
    }
    document.getElementById('overlay-count').textContent = activeOverlays.size;
    chart?.render();
  });

  // Editor toggle
  document.getElementById('toggle-editor')?.addEventListener('click', () => {
    editorOpen = !editorOpen;
    document.getElementById('editor-panel').style.display = editorOpen ? 'block' : 'none';
  });
  document.getElementById('close-editor')?.addEventListener('click', () => {
    editorOpen = false;
    document.getElementById('editor-panel').style.display = 'none';
  });
}

export function unmount() {
  if (chart) { chart.destroy(); chart = null; }
  if (resizeObserver) { resizeObserver.disconnect(); resizeObserver = null; }
  activeOverlays.clear();
  editorOpen = false;
}

function loadData(tfKey) {
  const tf = TIMEFRAMES.find(t => t.key === tfKey) || TIMEFRAMES[5];
  ohlcvData = generateOHLCV(24500, tf.count, tf.tf);
  if (chart) {
    chart.clearOverlays();
    activeOverlays.clear();
    document.querySelectorAll('#indicator-group [data-ind]').forEach(b => {
      b.style.color = '';
      b.style.background = '';
      b.style.borderColor = 'var(--border)';
    });
    document.getElementById('overlay-count').textContent = '0';
    chart.setData(ohlcvData);
    chart.setChartType(activeChartType);
  }
}

function updateOHLCVBar(c) {
  const bull = c.close >= c.open;
  const color = bull ? 'var(--bull)' : 'var(--bear)';
  setInfo('info-o', fmt(c.open), color);
  setInfo('info-h', fmt(c.high), color);
  setInfo('info-l', fmt(c.low), color);
  setInfo('info-c', fmt(c.close), color);
  setInfo('info-v', fmtVol(c.volume), 'var(--text-secondary)');
}

function setInfo(id, val, color) {
  const el = document.getElementById(id);
  if (el) { el.textContent = val; el.style.color = color; }
}

function fmt(n) {
  return Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtVol(n) {
  if (n >= 10000000) return (n / 10000000).toFixed(1) + ' Cr';
  if (n >= 100000) return (n / 100000).toFixed(1) + ' L';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}
