/**
 * TOZY.AI — Page 4: Derivatives Analytics & Options Flow Hub
 * Options chain, PCR/Max Pain charts, flow sweeper
 */

import { generateOptionsChain, generateOptionsFlow, PCR_HISTORY, MAX_PAIN_DATA, INDICES } from '../data/mock-market.js';

let intervals = [];
let pcrCanvas = null;
let mpCanvas = null;

export function mount(container) {
  const spot = INDICES.nifty50.ltp;
  const chain = generateOptionsChain(spot, 7);
  const flow = generateOptionsFlow();
  let activeFlowTab = 'sweeps';

  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
          Derivatives Analytics
        </h1>
        <div class="subtitle">Options Flow Intelligence & Greeks Laboratory</div>
      </div>
    </div>

    <!-- TOOLBAR -->
    <div class="toolbar" style="margin-bottom:16px;">
      <div class="input-group" style="flex-direction:row;align-items:center;gap:6px;margin:0;">
        <label class="input-label" style="margin:0;white-space:nowrap;">Underlying</label>
        <select class="input select" style="width:140px;padding:4px 8px;font-size:var(--text-xs);">
          <option selected>NIFTY 50</option>
          <option>BANKNIFTY</option>
          <option>FINNIFTY</option>
        </select>
      </div>
      <div style="width:1px;height:20px;background:var(--border);margin:0 8px;"></div>
      <div class="tab-bar" style="margin:0;border:none;">
        <div class="tab active" style="padding:6px 12px;font-size:var(--text-xs);">Weekly — Jul 17</div>
        <div class="tab" style="padding:6px 12px;font-size:var(--text-xs);">Monthly — Jul 31</div>
        <div class="tab" style="padding:6px 12px;font-size:var(--text-xs);">Monthly — Aug 28</div>
      </div>
      <div style="flex:1;"></div>
      <div style="font-family:var(--font-mono);font-size:var(--text-sm);">
        Spot: <span style="color:var(--bull);font-weight:700;">₹${fmtP(spot)}</span>
      </div>
    </div>

    <!-- OPTIONS CHAIN -->
    <div class="card" style="padding:0;overflow:hidden;">
      <div style="padding:12px 16px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">
        <span class="card-title">📋 Options Chain — NIFTY 50</span>
        <div style="display:flex;gap:8px;align-items:center;">
          <span class="badge badge-bull">ITM Calls</span>
          <span class="badge badge-bear">ITM Puts</span>
          <span class="badge badge-accent">ATM</span>
        </div>
      </div>
      <div style="overflow-x:auto;max-height:420px;overflow-y:auto;">
        <table class="data-table" style="font-size:11px;min-width:1400px;">
          <thead>
            <tr>
              <th colspan="9" style="text-align:center;background:rgba(16,185,129,0.08);color:var(--bull);border-right:1px solid var(--border);">CALLS</th>
              <th style="text-align:center;background:var(--accent-bg);color:var(--accent);">STRIKE</th>
              <th colspan="9" style="text-align:center;background:rgba(239,68,68,0.08);color:var(--bear);border-left:1px solid var(--border);">PUTS</th>
            </tr>
            <tr>
              <th>OI</th><th>OI Chg</th><th>Vol</th><th>IV%</th><th>LTP</th><th>Δ</th><th>Γ</th><th>Θ</th><th>ν</th>
              <th style="text-align:center;background:var(--bg-primary);">₹</th>
              <th>Δ</th><th>Γ</th><th>Θ</th><th>ν</th><th>LTP</th><th>IV%</th><th>Vol</th><th>OI Chg</th><th>OI</th>
            </tr>
          </thead>
          <tbody>
            ${renderChainRows(chain, spot)}
          </tbody>
        </table>
      </div>
    </div>

    <!-- PCR & MAX PAIN -->
    <div class="grid-2" style="margin-top:16px;">
      <div class="card" style="padding:16px;">
        <div class="card-header">
          <span class="card-title">📊 Put-Call Ratio Trend</span>
          <div>
            <span style="font-family:var(--font-mono);font-size:var(--text-lg);font-weight:700;color:var(--accent);" id="pcr-val">${PCR_HISTORY[PCR_HISTORY.length - 1].pcr.toFixed(2)}</span>
            <span class="badge ${PCR_HISTORY[PCR_HISTORY.length - 1].pcr > 1 ? 'badge-bull' : 'badge-bear'}" style="margin-left:6px;">${PCR_HISTORY[PCR_HISTORY.length - 1].pcr > 1.2 ? 'Oversold' : PCR_HISTORY[PCR_HISTORY.length - 1].pcr < 0.8 ? 'Overbought' : 'Neutral'}</span>
          </div>
        </div>
        <canvas id="pcr-chart" style="width:100%;height:180px;"></canvas>
      </div>
      <div class="card" style="padding:16px;">
        <div class="card-header">
          <span class="card-title">🎯 Max Pain Analysis</span>
          <div>
            <span style="font-family:var(--font-mono);font-size:var(--text-lg);font-weight:700;color:var(--accent);">₹${fmtP(MAX_PAIN_DATA.maxPainStrike)}</span>
            <span class="badge badge-accent" style="margin-left:6px;">Max Pain</span>
          </div>
        </div>
        <canvas id="mp-chart" style="width:100%;height:180px;"></canvas>
      </div>
    </div>

    <!-- OPTIONS FLOW SWEEPER -->
    <div class="card" style="margin-top:16px;padding:0;overflow:hidden;">
      <div style="padding:12px 16px;border-bottom:1px solid var(--border);">
        <span class="card-title">🌊 Options Flow Sweeper</span>
      </div>
      <div class="tab-bar" style="padding:0 16px;margin-bottom:0;" id="flow-tabs">
        <div class="tab active" data-flow="sweeps">Sweeps (${flow.sweeps.length})</div>
        <div class="tab" data-flow="blocks">Blocks (${flow.blocks.length})</div>
        <div class="tab" data-flow="buildups">OI Build-ups (${flow.oiBuildups.length})</div>
      </div>
      <div style="overflow-x:auto;max-height:350px;overflow-y:auto;" id="flow-content">
        ${renderFlowTable('sweeps', flow)}
      </div>
    </div>
  `;

  // Tab switching for flow
  document.getElementById('flow-tabs')?.addEventListener('click', (e) => {
    const tab = e.target.closest('[data-flow]');
    if (!tab) return;
    activeFlowTab = tab.dataset.flow;
    document.querySelectorAll('#flow-tabs .tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('flow-content').innerHTML = renderFlowTable(activeFlowTab, flow);
  });

  // Draw PCR chart and Max Pain — use rAF so canvas has layout dimensions
  requestAnimationFrame(() => {
    drawPCRChart();
    drawMaxPainChart();
  });
}

export function unmount() {
  intervals.forEach(id => clearInterval(id));
  intervals = [];
}

function renderChainRows(chain, spot) {
  const atmStrike = chain.strikes.reduce((prev, curr) =>
    Math.abs(curr - spot) < Math.abs(prev - spot) ? curr : prev
  );
  return chain.strikes.map((strike, i) => {
    const call = chain.calls[i];
    const put = chain.puts[i];
    const isATM = strike === atmStrike;
    const callITM = strike < spot;
    const putITM = strike > spot;
    let rowClass = '';
    if (isATM) rowClass = 'style="background:rgba(139,92,246,0.08);border:1px solid rgba(139,92,246,0.2);"';
    else if (callITM) rowClass = 'class="row-highlight-itm"';

    return `<tr ${rowClass}>
      <td class="cell-mono">${fmtOI(call.oi)}</td>
      <td class="cell-mono ${call.oiChange >= 0 ? 'cell-bull' : 'cell-bear'}">${call.oiChange >= 0 ? '+' : ''}${fmtOI(call.oiChange)}</td>
      <td class="cell-mono">${fmtOI(call.volume)}</td>
      <td class="cell-mono">${call.iv.toFixed(1)}</td>
      <td class="cell-mono" style="font-weight:600;${callITM ? 'color:var(--bull);' : ''}">${call.ltp.toFixed(2)}</td>
      <td class="cell-mono" style="color:var(--text-muted);">${call.delta.toFixed(2)}</td>
      <td class="cell-mono" style="color:var(--text-muted);">${(call.gamma ?? 0).toFixed(4)}</td>
      <td class="cell-mono" style="color:var(--text-muted);">${call.theta.toFixed(2)}</td>
      <td class="cell-mono" style="color:var(--text-muted);">${(call.vega ?? 0).toFixed(2)}</td>
      <td style="text-align:center;font-weight:700;font-family:var(--font-mono);background:var(--bg-primary);${isATM ? 'color:var(--accent);' : ''}">${fmtP(strike)}</td>
      <td class="cell-mono" style="color:var(--text-muted);">${put.delta.toFixed(2)}</td>
      <td class="cell-mono" style="color:var(--text-muted);">${(put.gamma ?? 0).toFixed(4)}</td>
      <td class="cell-mono" style="color:var(--text-muted);">${put.theta.toFixed(2)}</td>
      <td class="cell-mono" style="color:var(--text-muted);">${(put.vega ?? 0).toFixed(2)}</td>
      <td class="cell-mono" style="font-weight:600;${putITM ? 'color:var(--bear);' : ''}">${put.ltp.toFixed(2)}</td>
      <td class="cell-mono">${put.iv.toFixed(1)}</td>
      <td class="cell-mono">${fmtOI(put.volume)}</td>
      <td class="cell-mono ${put.oiChange >= 0 ? 'cell-bull' : 'cell-bear'}">${put.oiChange >= 0 ? '+' : ''}${fmtOI(put.oiChange)}</td>
      <td class="cell-mono">${fmtOI(put.oi)}</td>
    </tr>`;
  }).join('');
}

function renderFlowTable(tab, flow) {
  if (tab === 'sweeps') {
    return `<table class="data-table" style="font-size:11px;">
      <thead><tr><th>Time</th><th>Symbol</th><th>Strike</th><th>Type</th><th>Expiry</th><th>Premium</th><th>Contracts</th><th>Value</th><th>Sentiment</th></tr></thead>
      <tbody>${flow.sweeps.map(s => `<tr>
        <td class="cell-mono">${s.time}</td>
        <td style="font-weight:600;">${s.symbol}</td>
        <td class="cell-mono">${fmtP(s.strike)}</td>
        <td><span class="badge ${s.type === 'CE' ? 'badge-bull' : 'badge-bear'}">${s.type}</span></td>
        <td>${s.expiry}</td>
        <td class="cell-mono">₹${s.premium.toFixed(1)}</td>
        <td class="cell-mono">${s.contracts}</td>
        <td class="cell-mono" style="font-weight:600;">₹${s.totalValue} Cr</td>
        <td><span class="badge ${s.sentiment === 'Bullish' ? 'badge-bull' : 'badge-bear'}">${s.sentiment}</span></td>
      </tr>`).join('')}</tbody>
    </table>`;
  }
  if (tab === 'blocks') {
    return `<table class="data-table" style="font-size:11px;">
      <thead><tr><th>Time</th><th>Symbol</th><th>Strike</th><th>Type</th><th>Premium</th><th>Contracts</th><th>Value</th><th>Sentiment</th><th>Alert</th></tr></thead>
      <tbody>${flow.blocks.map(b => `<tr>
        <td class="cell-mono">${b.time}</td>
        <td style="font-weight:600;">${b.symbol}</td>
        <td class="cell-mono">${fmtP(b.strike)}</td>
        <td><span class="badge ${b.type === 'CE' ? 'badge-bull' : 'badge-bear'}">${b.type}</span></td>
        <td class="cell-mono">₹${b.premium.toFixed(1)}</td>
        <td class="cell-mono">${b.contracts}</td>
        <td class="cell-mono" style="font-weight:700;">₹${b.totalValue} Cr</td>
        <td><span class="badge ${b.sentiment === 'Bullish' ? 'badge-bull' : 'badge-bear'}">${b.sentiment}</span></td>
        <td>${parseFloat(b.totalValue) > 10 ? '<span class="badge badge-warning">🐋 Whale</span>' : ''}</td>
      </tr>`).join('')}</tbody>
    </table>`;
  }
  if (tab === 'buildups') {
    const catBadge = { 'Long Build-up': 'badge-bull', 'Short Build-up': 'badge-bear', 'Short Covering': 'badge-accent', 'Long Unwinding': 'badge-warning' };
    return `<table class="data-table" style="font-size:11px;">
      <thead><tr><th>Symbol</th><th>Strike</th><th>Type</th><th>OI Change</th><th>Price Change</th><th>Category</th></tr></thead>
      <tbody>${flow.oiBuildups.map(o => `<tr>
        <td style="font-weight:600;">${o.symbol}</td>
        <td class="cell-mono">${fmtP(o.strike)}</td>
        <td><span class="badge ${o.type === 'CE' ? 'badge-bull' : 'badge-bear'}">${o.type}</span></td>
        <td class="cell-mono ${o.oiChange >= 0 ? 'cell-bull' : 'cell-bear'}">${o.oiChange >= 0 ? '+' : ''}${fmtOI(o.oiChange)}</td>
        <td class="cell-mono ${o.priceChange >= 0 ? 'cell-bull' : 'cell-bear'}">${o.priceChange >= 0 ? '+' : ''}${o.priceChange.toFixed(1)}%</td>
        <td><span class="badge ${catBadge[o.category] || 'badge-neutral'}">${o.category}</span></td>
      </tr>`).join('')}</tbody>
    </table>`;
  }
  return '';
}

function drawPCRChart() {
  const canvas = document.getElementById('pcr-chart');
  if (!canvas) return;
  const rect = canvas.parentElement;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = canvas.clientWidth * dpr;
  canvas.height = canvas.clientHeight * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  const w = canvas.clientWidth, h = canvas.clientHeight;
  const data = PCR_HISTORY;
  const pad = { top: 10, right: 40, bottom: 20, left: 10 };
  const cw = w - pad.left - pad.right;
  const ch = h - pad.top - pad.bottom;

  ctx.fillStyle = '#0B0F19';
  ctx.fillRect(0, 0, w, h);

  // Reference lines
  [0.7, 1.0, 1.3].forEach(val => {
    const y = pad.top + ch - ((val - 0.5) / 1.0) * ch;
    ctx.strokeStyle = val === 1.0 ? '#374151' : val < 1 ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(w - pad.right, y); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#6B7280';
    ctx.font = '9px Inter';
    ctx.textAlign = 'left';
    ctx.fillText(val.toFixed(1), w - pad.right + 4, y + 3);
  });

  // PCR line
  ctx.strokeStyle = '#8B5CF6';
  ctx.lineWidth = 2;
  ctx.beginPath();
  data.forEach((d, i) => {
    const x = pad.left + (i / (data.length - 1)) * cw;
    const y = pad.top + ch - ((d.pcr - 0.5) / 1.0) * ch;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Gradient fill
  const grad = ctx.createLinearGradient(0, pad.top, 0, h - pad.bottom);
  grad.addColorStop(0, 'rgba(139,92,246,0.15)');
  grad.addColorStop(1, 'rgba(139,92,246,0)');
  ctx.lineTo(pad.left + cw, h - pad.bottom);
  ctx.lineTo(pad.left, h - pad.bottom);
  ctx.fillStyle = grad;
  ctx.fill();
}

function drawMaxPainChart() {
  const canvas = document.getElementById('mp-chart');
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = canvas.clientWidth * dpr;
  canvas.height = canvas.clientHeight * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  const w = canvas.clientWidth, h = canvas.clientHeight;
  const data = MAX_PAIN_DATA.strikes;
  const pad = { top: 10, right: 10, bottom: 28, left: 10 };
  const cw = w - pad.left - pad.right;
  const ch = h - pad.top - pad.bottom;
  const maxPain = Math.max(...data.map(d => d.totalPain));
  const barW = cw / data.length * 0.7;
  const gap = cw / data.length * 0.3;

  ctx.fillStyle = '#0B0F19';
  ctx.fillRect(0, 0, w, h);

  data.forEach((d, i) => {
    const x = pad.left + (i / data.length) * cw + gap / 2;
    const barH = (d.totalPain / maxPain) * ch;
    const y = pad.top + ch - barH;
    const isMax = d.strike === MAX_PAIN_DATA.maxPainStrike;

    // Call pain (red)
    const callH = (d.callPain / maxPain) * ch;
    ctx.fillStyle = 'rgba(239,68,68,0.4)';
    ctx.fillRect(x, pad.top + ch - callH, barW / 2, callH);

    // Put pain (green)
    const putH = (d.putPain / maxPain) * ch;
    ctx.fillStyle = 'rgba(16,185,129,0.4)';
    ctx.fillRect(x + barW / 2, pad.top + ch - putH, barW / 2, putH);

    // Max pain highlight
    if (isMax) {
      ctx.strokeStyle = '#8B5CF6';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(x + barW / 2, pad.top);
      ctx.lineTo(x + barW / 2, pad.top + ch);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#8B5CF6';
      ctx.font = 'bold 10px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('MAX PAIN', x + barW / 2, pad.top - 1);
    }

    // Strike label
    if (i % 3 === 0 || isMax) {
      ctx.fillStyle = isMax ? '#8B5CF6' : '#6B7280';
      ctx.font = '8px JetBrains Mono';
      ctx.textAlign = 'center';
      ctx.fillText(d.strike.toString(), x + barW / 2, h - pad.bottom + 14);
    }
  });
}

function fmtP(n) { return Number(n).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 }); }
function fmtOI(n) {
  if (Math.abs(n) >= 10000000) return (n / 10000000).toFixed(1) + 'Cr';
  if (Math.abs(n) >= 100000) return (n / 100000).toFixed(1) + 'L';
  if (Math.abs(n) >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}
