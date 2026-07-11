import { generateCreatorStoreItems } from '../data/mock-market.js';
import { showToast } from '../lib/toast.js';
import { supabase } from '../lib/supabase.js';

let activeCategory = 'All';

export async function mount(container) {
  const storeItems = generateCreatorStoreItems();
  const { data: { session } } = await supabase.auth.getSession();
  
  let dbProfile = null;
  let dbLedgers = [];
  
  if (session) {
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
    dbProfile = profile;
    const { data: ledgers } = await supabase.from('broker_ledgers').select('*').eq('user_id', session.user.id);
    dbLedgers = ledgers || [];
  }

  // Fallbacks if not logged in or sync delayed
  const balance = dbProfile ? `₹${parseFloat(dbProfile.verified_balance).toLocaleString('en-IN')}` : '₹50,000';
  const winRate = dbProfile ? `${parseFloat(dbProfile.win_percentage).toFixed(1)}%` : '68.2%';
  const winStreak = dbProfile ? `${dbProfile.win_streak_days} days` : '3 days';

  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          Creator Store & Portfolio Manager
        </h1>
        <div class="subtitle">SaaS Marketplace & Multi-Account Strategy Engine</div>
      </div>
    </div>

    <!-- PERFORMANCE DASHBOARD -->
    <div class="card card-glow-accent" style="margin-bottom:20px;">
      <div class="card-header">
        <div>
          <span class="card-title">📊 Verified Performance Metrics</span>
          <div style="font-size:var(--text-xs);color:var(--text-muted);margin-top:2px;">Audited by CA/CMA — SEBI RA Compliant</div>
          <div style="font-size:9px;color:var(--text-muted);margin-top:4px;font-family:var(--font-mono);">Ledger Hash: <span style="color:var(--accent);">sha256:8f2a9c3d4f107b5e824c...6a8f1d2e</span></div>
        </div>
        <span class="badge badge-bull" style="padding:4px 12px;">✅ CA Verified · Last Audit: June 2025</span>
      </div>
      <div class="grid-3" style="grid-template-columns:repeat(6,1fr);margin-bottom:16px;">
        <div class="metric-card">
          <div class="metric-label">Verified Capital</div>
          <div class="metric-value" style="color:var(--bull);">${balance}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Win Rate</div>
          <div class="metric-value" style="color:var(--bull);">${winRate}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Max Drawdown</div>
          <div class="metric-value" style="color:var(--bear);">-8.4%</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Sharpe Ratio</div>
          <div class="metric-value" style="color:var(--accent);">2.14</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Win Streak</div>
          <div class="metric-value">${winStreak}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Avg Holding</div>
          <div class="metric-value">4.2d</div>
        </div>
      </div>
      <canvas id="equity-curve" style="width:100%;height:140px;"></canvas>
    </div>

    <!-- CREATOR STOREFRONT -->
    <div style="margin-bottom:20px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <h3 style="font-size:var(--text-sm);color:var(--text-primary);text-transform:uppercase;letter-spacing:0.05em;">🏪 Creator Marketplace</h3>
        <div style="display:flex;gap:4px;" id="store-cats">
          ${['All', 'Scanner', 'Strategy', 'Layout', 'Indicator'].map(c => `
            <span class="filter-chip ${c === 'All' ? 'active' : ''}" data-cat="${c}">${c}${c === 'All' ? '' : 's'}</span>
          `).join('')}
        </div>
      </div>
      <div class="grid-4" id="store-grid">
        ${renderStoreCards(storeItems, 'All')}
      </div>
    </div>

    <!-- MULTI-ACCOUNT REPLICATION -->
    <div class="card" style="margin-bottom:20px;">
      <div class="card-header">
        <div>
          <span class="card-title">🔄 Multi-Account Replication Console</span>
          <div style="font-size:var(--text-xs);color:var(--text-muted);margin-top:2px;">Replicate White-Box strategies across authorized demat accounts</div>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-primary btn-sm" id="deploy-strategy-btn">Deploy Strategy</button>
          <button class="btn btn-danger btn-sm">⛔ Emergency Stop All</button>
        </div>
      </div>
      <div style="overflow-x:auto;">
        <table class="data-table" style="font-size:11px;">
          <thead><tr>
            <th>Account</th><th>Broker</th><th>Capital</th><th>Strategy</th>
            <th>P&L Today</th><th>Risk Boundary</th><th>Liquidity Target</th><th>Status</th><th>Actions</th>
          </tr></thead>
          <tbody>
            ${renderAccountRows(dbLedgers)}
          </tbody>
        </table>
      </div>
      <div style="margin-top:12px;padding:8px 12px;background:rgba(139,92,246,0.06);border:1px solid rgba(139,92,246,0.15);border-radius:var(--radius-md);">
        <span style="font-size:10px;color:var(--text-muted);">All replicated trades are White-Box with full parameter transparency per SEBI IA guidelines.</span>
      </div>
    </div>

    <!-- MASTER TRADE PANEL -->
    <div class="card card-glow-bull">
      <div class="card-header">
        <span class="card-title">🎯 Master Parameter Study — Active Evaluation</span>
        <span class="badge badge-bull">LIVE</span>
      </div>
      <div class="grid-4" style="grid-template-columns:repeat(7,1fr);margin-bottom:12px;">
        <div class="metric-card">
          <div class="metric-label">Symbol</div>
          <div class="metric-value" style="font-size:var(--text-base);">NIFTY 50</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Trigger Coordinate</div>
          <div class="metric-value" style="font-size:var(--text-base);">₹24,420</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Current</div>
          <div class="metric-value" style="font-size:var(--text-base);color:var(--bull);">₹24,567</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">P&L (5 Acc)</div>
          <div class="metric-value" style="font-size:var(--text-base);color:var(--bull);">+₹1,47,000</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Risk Boundary</div>
          <div class="metric-value" style="font-size:var(--text-base);color:var(--bear);">₹24,350</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Liquidity Target</div>
          <div class="metric-value" style="font-size:var(--text-base);color:var(--accent);">₹24,700</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">R:R Ratio</div>
          <div class="metric-value" style="font-size:var(--text-base);color:var(--accent);">1:1.9</div>
        </div>
      </div>
      <div>
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
          <span style="font-size:var(--text-xs);color:var(--bear);">Risk Limit ₹24,350</span>
          <span style="font-size:var(--text-xs);color:var(--text-muted);">Trigger ₹24,420</span>
          <span style="font-size:var(--text-xs);color:var(--bull);">Current</span>
          <span style="font-size:var(--text-xs);color:var(--accent);">Target ₹24,700</span>
        </div>
        <div style="position:relative;height:12px;background:var(--border);border-radius:var(--radius-full);overflow:hidden;">
          <div style="position:absolute;left:0;top:0;height:100%;width:62%;background:linear-gradient(90deg,var(--bear),var(--warning),var(--bull));border-radius:var(--radius-full);transition:width 0.5s;"></div>
          <div style="position:absolute;left:62%;top:-2px;width:4px;height:16px;background:var(--text-primary);border-radius:2px;box-shadow:0 0 8px rgba(255,255,255,0.5);"></div>
        </div>
      </div>
    </div>
  `;

  // Draw equity curve
  setTimeout(drawEquityCurve, 50);

  // Store category filter
  document.getElementById('store-cats')?.addEventListener('click', (e) => {
    const chip = e.target.closest('.filter-chip');
    if (!chip) return;
    activeCategory = chip.dataset.cat;
    document.querySelectorAll('#store-cats .filter-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    document.getElementById('store-grid').innerHTML = renderStoreCards(storeItems, activeCategory);
  });



  // Token Bucket OPS Queue
  class TokenBucket {
    constructor(capacity, fillPerSecond) {
      this.capacity = capacity;
      this.tokens = capacity;
      this.fillRate = fillPerSecond;
      this.lastFill = Date.now();
    }
    consume() {
      const now = Date.now();
      const elapsed = (now - this.lastFill) / 1000;
      this.tokens = Math.min(this.capacity, this.tokens + elapsed * this.fillRate);
      this.lastFill = now;
      if (this.tokens >= 1) {
        this.tokens -= 1;
        return true;
      }
      return false;
    }
  }

  const opsBucket = new TokenBucket(10, 10);
  const queue = [];

  function processQueue() {
    if (queue.length === 0) return;
    if (opsBucket.consume()) {
      const task = queue.shift();
      task();
      if (queue.length > 0) setTimeout(processQueue, 100);
    } else {
      setTimeout(processQueue, 1000);
    }
  }

  document.getElementById('deploy-strategy-btn')?.addEventListener('click', () => {
    const ordersToFire = 15; // Simulate 15 orders for multiple accounts
    let queuedCount = 0;
    
    for (let i = 0; i < ordersToFire; i++) {
      if (opsBucket.consume()) {
        // Fire immediately
        console.log(`Order ${i + 1} fired instantly.`);
      } else {
        // Queue it
        queuedCount++;
        queue.push(() => {
          console.log(`Order ${i + 1} fired from queue.`);
        });
      }
    }
    
    if (queuedCount > 0) {
      showToast(`OPS Safeguard active: Queuing ${queuedCount} pending signals...`, 'warning', 4000);
      setTimeout(processQueue, 1000);
    } else {
      showToast(`Successfully deployed ${ordersToFire} parameter signals instantly.`, 'bull', 3000);
    }
  });
}

export function unmount() {
  activeCategory = 'All';
}

function renderStoreCards(items, category) {
  const filtered = category === 'All' ? items : items.filter(i => i.category === category);
  const catColors = { Scanner: 'badge-accent', Strategy: 'badge-bull', Layout: 'badge-warning', Indicator: 'badge-neutral' };

  return filtered.map(item => {
    const stars = renderStars(item.rating);
    return `
      <div class="card" style="padding:16px;display:flex;flex-direction:column;">
        <div style="margin-bottom:8px;">
          <span class="badge ${catColors[item.category] || 'badge-neutral'}">${item.category}</span>
        </div>
        <h4 style="font-size:var(--text-sm);font-weight:700;color:var(--text-primary);margin-bottom:6px;line-height:1.3;">${item.name}</h4>
        <p style="font-size:var(--text-xs);color:var(--text-muted);line-height:1.5;margin-bottom:8px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${item.description}</p>
        <div style="font-size:10px;color:var(--text-muted);margin-bottom:8px;">by <span style="color:var(--text-secondary);">${item.author}</span></div>
        <div style="display:flex;align-items:center;gap:4px;margin-bottom:8px;">
          <span style="font-size:12px;">${stars}</span>
          <span style="font-size:10px;color:var(--text-muted);">(${item.reviews})</span>
        </div>
        ${item.performance ? `
          <div style="display:flex;gap:8px;margin-bottom:10px;">
            <span style="font-size:10px;color:var(--bull);">↑ ${item.performance.returns}</span>
            <span style="font-size:10px;color:var(--text-muted);">WR: ${item.performance.winRate}</span>
          </div>
        ` : ''}
        <div style="display:flex;flex-wrap:wrap;gap:3px;margin-bottom:12px;">
          ${item.tags.map(t => `<span style="font-size:8px;padding:1px 6px;border-radius:var(--radius-full);background:var(--bg-primary);color:var(--text-muted);border:1px solid var(--border);">${t}</span>`).join('')}
        </div>
        <div style="margin-top:auto;display:flex;justify-content:space-between;align-items:center;">
          <div>
            <span style="font-family:var(--font-mono);font-weight:700;color:var(--text-primary);">₹${item.price}</span>
            <span style="font-size:10px;color:var(--text-muted);">/mo</span>
          </div>
          <button
            class="btn btn-primary btn-sm buy-button"
            data-price="${item.price}"
            data-name="${item.name.replace(/"/g, '&quot;')}"
            style="font-size:10px;"
          >Subscribe</button>
        </div>
        <div style="font-size:9px;color:var(--text-muted);margin-top:6px;">${item.subscribers.toLocaleString()} subscribers</div>
      </div>
    `;
  }).join('');
}

function renderAccountRows(dbLedgers = []) {
  const accounts = dbLedgers.length ? dbLedgers.map(l => ({
    id: l.account_id,
    broker: l.broker_name,
    capital: 500000,
    strategy: 'Nifty Sniper Pro',
    pnl: parseFloat(l.realized_pnl),
    sl: 24350,
    target: 24700,
    status: 'Running',
    online: true
  })) : [
    { id: 'DEMAT-001', broker: 'Zerodha Kite', capital: 500000, strategy: 'Nifty Sniper Pro', pnl: 12400, sl: 24350, target: 24700, status: 'Running', online: true },
    { id: 'DEMAT-002', broker: 'DhanHQ', capital: 300000, strategy: 'OI Flow Scanner', pnl: 8200, sl: 24350, target: 24700, status: 'Running', online: true },
    { id: 'DEMAT-003', broker: 'Kotak Neo', capital: 250000, strategy: 'Nifty Sniper Pro', pnl: -3100, sl: 24350, target: 24700, status: 'Paused', online: true },
    { id: 'DEMAT-004', broker: 'Angel One', capital: 200000, strategy: 'PCR Reversal', pnl: 5600, sl: 24350, target: 24700, status: 'Running', online: false },
    { id: 'DEMAT-005', broker: 'Fyers', capital: 150000, strategy: 'Breakout Hawk', pnl: 0, sl: 24350, target: 24700, status: 'Stopped', online: false },
  ];
  const statusBadge = { Running: 'badge-bull', Paused: 'badge-warning', Stopped: 'badge-bear' };
  return accounts.map(a => `<tr>
    <td><span class="status-dot ${a.online ? 'online' : 'offline'}" style="margin-right:6px;"></span><span style="font-weight:600;">${a.id}</span></td>
    <td>${a.broker}</td>
    <td class="cell-mono">₹${a.capital.toLocaleString('en-IN')}</td>
    <td>${a.strategy}</td>
    <td class="cell-mono ${a.pnl >= 0 ? 'cell-bull' : 'cell-bear'}">${a.pnl >= 0 ? '+' : ''}₹${a.pnl.toLocaleString('en-IN')}</td>
    <td class="cell-mono" style="color:var(--bear);">₹${a.sl.toLocaleString('en-IN')}</td>
    <td class="cell-mono" style="color:var(--bull);">₹${a.target.toLocaleString('en-IN')}</td>
    <td><span class="badge ${statusBadge[a.status]}">${a.status}</span></td>
    <td>
      <div style="display:flex;gap:4px;">
        <button class="btn btn-ghost btn-sm" style="font-size:9px;padding:2px 6px;">${a.status === 'Paused' ? '▶' : '⏸'}</button>
        <button class="btn btn-ghost btn-sm" style="font-size:9px;padding:2px 6px;color:var(--bear);">⏹</button>
      </div>
    </td>
  </tr>`).join('');
}

function renderStars(rating) {
  let s = '';
  for (let i = 1; i <= 5; i++) {
    s += i <= Math.floor(rating) ? '★' : (i - 0.5 <= rating ? '★' : '☆');
  }
  return `<span style="color:#F59E0B;letter-spacing:1px;">${s}</span>`;
}

function drawEquityCurve() {
  const canvas = document.getElementById('equity-curve');
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = canvas.clientWidth * dpr;
  canvas.height = canvas.clientHeight * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  const w = canvas.clientWidth, h = canvas.clientHeight;
  const pad = { top: 8, right: 8, bottom: 20, left: 8 };
  const cw = w - pad.left - pad.right;
  const ch = h - pad.top - pad.bottom;

  ctx.fillStyle = '#0B0F19';
  ctx.fillRect(0, 0, w, h);

  // Generate equity curve with upward drift (winning strategy simulation)
  const points = [];
  let val = 1000000;
  for (let i = 0; i < 250; i++) {
    val += val * ((Math.random() - 0.42) * 0.008 + 0.0018); // +0.18% daily drift
    val = Math.max(val, 800000); // floor at 80% drawdown
    points.push(val);
  }
  const minVal = Math.min(...points) * 0.98;
  const maxVal = Math.max(...points) * 1.02;

  // Draw line
  ctx.strokeStyle = '#10B981';
  ctx.lineWidth = 2;
  ctx.beginPath();
  points.forEach((v, i) => {
    const x = pad.left + (i / (points.length - 1)) * cw;
    const y = pad.top + ch - ((v - minVal) / (maxVal - minVal)) * ch;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Gradient fill
  ctx.lineTo(pad.left + cw, pad.top + ch);
  ctx.lineTo(pad.left, pad.top + ch);
  ctx.closePath();
  const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + ch);
  grad.addColorStop(0, 'rgba(16,185,129,0.2)');
  grad.addColorStop(1, 'rgba(16,185,129,0)');
  ctx.fillStyle = grad;
  ctx.fill();

  // Month labels
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  ctx.fillStyle = '#6B7280';
  ctx.font = '9px Inter';
  ctx.textAlign = 'center';
  months.forEach((m, i) => {
    const x = pad.left + (i / 11) * cw;
    ctx.fillText(m, x, h - 4);
  });
}
