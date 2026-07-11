/**
 * TOZY.AI — Page 3: Compliance Proxy Terminal
 * Broker integration, Static IP proxy, 2FA portal, OPS safeguard
 */

import { BROKER_LIST } from '../data/mock-market.js';

let intervals = [];

export function mount(container) {
  let opsValue = 2.4;

  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
          Compliance Terminal
        </h1>
        <div class="subtitle">Execution Gateway & Regulatory Compliance Engine</div>
      </div>
      <div class="page-actions">
        <span class="badge badge-bull" style="padding:4px 12px;"><span class="status-dot online" style="margin-right:6px;"></span> SEBI Compliant</span>
      </div>
    </div>

    <div class="panel-stack">
      <!-- BROKER MATRIX -->
      <div>
        <h3 style="font-size:var(--text-sm);color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:12px;">🔗 Broker Integration Matrix</h3>
        <div class="grid-3" id="broker-grid"></div>
      </div>

      <div class="grid-2">
        <!-- STATIC IP PROXY -->
        <div class="card card-glow-accent">
          <div class="card-header">
            <span class="card-title">🔒 Static IP Proxy Tunnel</span>
            <span class="badge badge-bull"><span class="status-dot online" style="margin-right:4px;"></span> Online</span>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="input-group">
              <label class="input-label">Whitelisted IPv4</label>
              <div class="input" style="background:var(--bg-primary);cursor:default;user-select:all;">103.245.87.201</div>
            </div>
            <div class="input-group">
              <label class="input-label">Proxy Region</label>
              <div class="input" style="background:var(--bg-primary);cursor:default;">Mumbai (ap-south-1)</div>
            </div>
            <div class="input-group">
              <label class="input-label">Cloud Provider</label>
              <div class="input" style="background:var(--bg-primary);cursor:default;">AWS EC2 Micro</div>
            </div>
            <div class="input-group">
              <label class="input-label">Tunnel Protocol</label>
              <div class="input" style="background:var(--bg-primary);cursor:default;">WireGuard</div>
            </div>
          </div>
          <div class="input-group" style="margin-top:12px;">
            <label class="input-label">Uptime</label>
            <div style="font-family:var(--font-mono);font-size:var(--text-sm);color:var(--bull);">47d 12h 33m</div>
          </div>
          <div style="margin-top:12px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
              <span style="font-size:var(--text-xs);color:var(--text-muted);">Bandwidth: 45.2 / 100 GB</span>
              <span style="font-size:var(--text-xs);color:var(--text-muted);">45%</span>
            </div>
            <div class="progress-bar"><div class="progress-fill bull" style="width:45%;"></div></div>
          </div>
          <div style="display:flex;gap:8px;margin-top:16px;">
            <button class="btn btn-outline btn-sm">🔄 Rotate IP</button>
            <button class="btn btn-primary btn-sm">Test Connectivity</button>
          </div>
        </div>

        <!-- 2FA PORTAL -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">🕘 Pre-Market Authentication</span>
            <span style="font-size:var(--text-xs);color:var(--text-muted);">Before 9:15 AM IST</span>
          </div>
          ${renderTimeline()}
        </div>
      </div>

      <!-- OPS SAFEGUARD -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">⚡ API Throughput Monitor — 10 OPS Safeguard</span>
          <span class="badge badge-warning">Rate Limited</span>
        </div>
        <div style="display:flex;gap:24px;align-items:center;">
          <!-- GAUGE -->
          <div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0;">
            <div class="gauge-container" style="width:140px;height:140px;">
              <svg class="gauge-svg" width="140" height="140" viewBox="0 0 140 140">
                <circle class="gauge-track" cx="70" cy="70" r="58" stroke-dasharray="273 91" stroke-dashoffset="0"></circle>
                <circle class="gauge-fill" cx="70" cy="70" r="58" id="ops-fill"
                  stroke="var(--bull)" stroke-dasharray="273 91" stroke-dashoffset="273"
                  style="transition:all 0.5s ease;"></circle>
              </svg>
              <div class="gauge-value" id="ops-value" style="font-size:var(--text-2xl);">${opsValue.toFixed(1)}</div>
            </div>
            <div class="gauge-label" style="margin-top:8px;">Orders / Second</div>
            <div style="font-size:10px;color:var(--text-muted);margin-top:2px;">Max: 10 OPS</div>
          </div>

          <!-- STATS + LOG -->
          <div style="flex:1;min-width:0;">
            <div class="grid-3" style="margin-bottom:16px;">
              <div class="metric-card">
                <div class="metric-label">Queue Depth</div>
                <div class="metric-value" style="font-size:var(--text-lg);" id="queue-depth">0</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Burst Buffer</div>
                <div class="metric-value" style="font-size:var(--text-lg);">7/10</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Today's Orders</div>
                <div class="metric-value" style="font-size:var(--text-lg);">147</div>
              </div>
            </div>

            <div style="overflow-x:auto;">
              <table class="data-table" style="font-size:var(--text-xs);">
                <thead><tr><th>Time</th><th>Endpoint</th><th>Status</th><th>Latency</th></tr></thead>
                <tbody>
                  ${renderApiLog()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div style="margin-top:16px;padding:10px 12px;background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2);border-radius:var(--radius-md);">
          <span style="font-size:var(--text-xs);color:var(--warning);">⚠️ Rate limiting active: Max 10 OPS per account to maintain retail classification per SEBI HFT guidelines</span>
        </div>
      </div>
    </div>
  `;

  // Render broker cards
  renderBrokerGrid();

  // Animate OPS gauge
  const iv = setInterval(() => {
    opsValue = Math.max(0.5, Math.min(8, opsValue + (Math.random() - 0.5) * 2));
    updateGauge(opsValue);
  }, 2000);
  intervals.push(iv);
}

export function unmount() {
  intervals.forEach(id => clearInterval(id));
  intervals = [];
}

function renderBrokerGrid() {
  const grid = document.getElementById('broker-grid');
  if (!grid) return;
  grid.innerHTML = BROKER_LIST.map(broker => {
    const isConnected = broker.status === 'connected';
    const isPending = broker.status === 'pending';
    const glowClass = isConnected ? 'card-glow-bull' : broker.status === 'disconnected' ? 'card-glow-bear' : '';
    const statusClass = isConnected ? 'online' : isPending ? 'pending' : 'offline';
    const statusText = isConnected ? 'Connected' : isPending ? 'Authenticating...' : 'Disconnected';
    const statusColor = isConnected ? 'var(--bull)' : isPending ? 'var(--warning)' : 'var(--bear)';
    const latencyColor = broker.latency ? (broker.latency < 15 ? 'var(--bull)' : broker.latency < 30 ? 'var(--warning)' : 'var(--bear)') : 'var(--text-muted)';

    return `
      <div class="card ${glowClass}" style="padding:16px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
          <span style="font-size:28px;">${broker.logo}</span>
          <div>
            <div style="font-weight:600;font-size:var(--text-sm);color:var(--text-primary);">${broker.name}</div>
            <div style="display:flex;align-items:center;gap:4px;margin-top:2px;">
              <span class="status-dot ${statusClass}"></span>
              <span style="font-size:var(--text-xs);color:${statusColor};">${statusText}</span>
            </div>
          </div>
        </div>
        ${broker.latency !== null ? `
          <div style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:8px;">
            Latency: <span style="font-family:var(--font-mono);color:${latencyColor};">${broker.latency}ms</span>
          </div>` : ''}
        <div class="input-group" style="margin-bottom:12px;">
          <label class="input-label">API Key</label>
          <input class="input" type="password" value="${broker.apiKeyConfigured ? '••••••••••••••••' : ''}" placeholder="Enter API Key" style="font-size:var(--text-xs);">
        </div>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-outline btn-sm" style="flex:1;font-size:10px;">Configure</button>
          <button class="btn ${isConnected ? 'btn-success' : 'btn-primary'} btn-sm" style="flex:1;font-size:10px;">
            ${isConnected ? '✓ Connected' : 'Connect'}
          </button>
        </div>
      </div>`;
  }).join('');
}

function renderTimeline() {
  const steps = [
    { status: 'completed', icon: '✓', title: 'System Health Check', desc: 'All services operational', time: '04:30 AM' },
    { status: 'completed', icon: '✓', title: 'Data Feed Connection', desc: 'TrueData WebSocket connected', time: '04:31 AM' },
    { status: 'completed', icon: '✓', title: 'Zerodha Kite 2FA', desc: 'TOTP verified, session valid until 11:00 PM', time: '08:45 AM' },
    { status: 'active', icon: '⟳', title: 'DhanHQ OAuth Flow', desc: 'Awaiting TOTP input...', time: 'Pending' },
    { status: '', icon: '5', title: 'Pre-market Scan', desc: 'Scheduled for 09:00 AM', time: 'Scheduled' },
    { status: '', icon: '6', title: 'Market Ready', desc: 'Final system check', time: '09:14 AM' },
  ];
  return steps.map(s => `
    <div class="timeline-step ${s.status}">
      <div class="timeline-dot">${s.icon}</div>
      <div class="timeline-content">
        <div class="timeline-title">${s.title}</div>
        <div class="timeline-desc">${s.desc}</div>
      </div>
      <div style="font-size:var(--text-xs);color:var(--text-muted);font-family:var(--font-mono);white-space:nowrap;">${s.time}</div>
    </div>
  `).join('');
}

function renderApiLog() {
  const entries = [
    { time: '09:31:15', endpoint: 'orders/place', status: '200 OK', statusClass: 'badge-bull', latency: '12ms' },
    { time: '09:31:14', endpoint: 'orders/place', status: '200 OK', statusClass: 'badge-bull', latency: '14ms' },
    { time: '09:31:12', endpoint: 'positions', status: '200 OK', statusClass: 'badge-bull', latency: '8ms' },
    { time: '09:31:10', endpoint: 'orders/modify', status: '200 OK', statusClass: 'badge-bull', latency: '18ms' },
    { time: '09:31:08', endpoint: 'orders/place', status: '429 Throttled', statusClass: 'badge-warning', latency: '—' },
  ];
  return entries.map(e => `
    <tr>
      <td class="cell-mono">${e.time}</td>
      <td>${e.endpoint}</td>
      <td><span class="badge ${e.statusClass}">${e.status}</span></td>
      <td class="cell-mono">${e.latency}</td>
    </tr>
  `).join('');
}

function updateGauge(value) {
  const fill = document.getElementById('ops-fill');
  const display = document.getElementById('ops-value');
  if (!fill || !display) return;

  // r=58, circumference=364.4, usable arc = 75% = 273.3, remainder=91
  const circumference = 2 * Math.PI * 58;
  const usable = circumference * 0.75;       // 270° arc
  const remainder = circumference - usable;  // dead zone
  const filled = usable * (value / 10);
  const empty = usable - filled;

  // stroke-dasharray: filled segment, then gap to hide rest
  fill.setAttribute('stroke-dasharray', `${filled.toFixed(1)} ${(empty + remainder).toFixed(1)}`);

  let color = 'var(--bull)';
  if (value > 7) color = 'var(--bear)';
  else if (value > 4) color = 'var(--warning)';

  fill.setAttribute('stroke', color);
  display.textContent = value.toFixed(1);
  display.style.color = color;
}
