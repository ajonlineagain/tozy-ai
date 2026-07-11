/**
 * TOZY.AI — Main Application Shell
 * SPA Router, Navigation, and Global State
 */

// ─── Page Imports (lazy) ───
import { mount as mountDashboard, unmount as unmountDashboard } from './pages/dashboard.js';
import { mount as mountCharting, unmount as unmountCharting } from './pages/charting.js';
import { mount as mountCompliance, unmount as unmountCompliance } from './pages/compliance.js';
import { mount as mountDerivatives, unmount as unmountDerivatives } from './pages/derivatives.js';
import { mount as mountPatterns, unmount as unmountPatterns } from './pages/patterns.js';
import { mount as mountStore, unmount as unmountStore } from './pages/store.js';
import { supabase } from './lib/supabase.js';
import { showToast } from './lib/toast.js';

let authSession = null;

// ─── Route Registry ───
const ROUTES = {
  dashboard:   { mount: mountDashboard,   unmount: unmountDashboard,   icon: 'dashboard',   label: 'Dashboard' },
  charting:    { mount: mountCharting,     unmount: unmountCharting,    icon: 'charting',    label: 'Charting' },
  compliance:  { mount: mountCompliance,   unmount: unmountCompliance,  icon: 'compliance',  label: 'Compliance' },
  derivatives: { mount: mountDerivatives,  unmount: unmountDerivatives, icon: 'derivatives', label: 'Derivatives' },
  patterns:    { mount: mountPatterns,     unmount: unmountPatterns,    icon: 'patterns',    label: 'Patterns' },
  store:       { mount: mountStore,        unmount: unmountStore,       icon: 'store',       label: 'Store' },
};

// ─── SVG Icons ───
const ICONS = {
  dashboard: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="4" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="11" width="7" height="10" rx="1"/></svg>`,
  charting: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 16l4-8 4 4 5-9"/></svg>`,
  compliance: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>`,
  derivatives: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/><path d="M8 3.5A9 9 0 0116 3.5"/><path d="M3.5 8A9 9 0 013.5 16"/><path d="M20.5 8A9 9 0 0120.5 16"/></svg>`,
  patterns: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20L6 12 10 15 14 6 18 11 22 4"/><circle cx="6" cy="12" r="1.5" fill="currentColor"/><circle cx="10" cy="15" r="1.5" fill="currentColor"/><circle cx="14" cy="6" r="1.5" fill="currentColor"/><circle cx="18" cy="11" r="1.5" fill="currentColor"/></svg>`,
  store: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  ai: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a4 4 0 014 4c0 1.95-1.4 3.58-3.25 3.93L12 12"/><circle cx="12" cy="17" r="3"/><path d="M5 21a7 7 0 0114 0"/></svg>`,
  watchlist: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/></svg>`,
  settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>`,
};

// ─── Global State ───
const WATCHLIST_BASE = {
  RELIANCE:  2948, TCS:      4105, HDFCBANK:  1722, INFY:      1647,
  ICICIBANK: 1283, SBIN:      818, TATAMOTORS: 982, BAJFINANCE: 7215,
};
const state = {
  currentRoute: null,
  activeTicker: 'NIFTY 50',
  watchlist: Object.entries(WATCHLIST_BASE).map(([sym, base]) => ({
    symbol: sym,
    ltp: base,
    prevClose: base,
    change: 0,
  })),
  rightDrawerTab: 'watchlist',
  aiMessages: [
    { from: 'ai', text: 'Good morning! NIFTY 50 opened gap-up at 24,567. Key coordinate levels: Historical volume boundary 24,380 (PCR 1.2) · Upside liquidity pool 24,650 (Max Pain). Institutional flow shows mathematical convergence with heavy Put-Writer open interest at 24,400.\n\n*This mathematical parameter scan is provided for educational and skill-development purposes only. TOZY.AI does not offer financial advice, trade signals, or buy/sell recommendations. Financial trading involves high capital risk. Please consult a registered financial advisor.*' }
  ],
};

// ─── Live watchlist price simulation ───
setInterval(() => {
  state.watchlist.forEach(item => {
    const delta = (Math.random() - 0.48) * item.prevClose * 0.0006;
    item.ltp = Math.max(item.prevClose * 0.85, item.ltp + delta);
    item.change = ((item.ltp - item.prevClose) / item.prevClose) * 100;
  });
  // Refresh drawer if watchlist is active
  if (state.rightDrawerTab === 'watchlist') renderDrawerContent();
}, 4000);

// ─── App Shell Renderer ───
function renderShell() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="app-shell">
      <!-- LEFT SIDEBAR -->
      <aside class="sidebar-left" id="sidebar-left">
        <div class="logo" id="logo-btn" title="TOZY.AI">
          <svg viewBox="0 0 36 36" width="32" height="32">
            <defs>
              <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#8B5CF6"/>
                <stop offset="100%" stop-color="#10B981"/>
              </linearGradient>
              <filter id="logo-glow">
                <feGaussianBlur stdDeviation="1.5" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>
            <path d="M18 3 L33 30 H3 Z" fill="none" stroke="url(#logo-grad)" stroke-width="2.2" filter="url(#logo-glow)"/>
            <path d="M18 11 L27 27 H9 Z" fill="none" stroke="url(#logo-grad)" stroke-width="1.2" opacity="0.5"/>
            <circle cx="18" cy="21" r="2.5" fill="url(#logo-grad)" filter="url(#logo-glow)"/>
          </svg>
        </div>

        <nav class="nav-group" id="nav-group">
          ${Object.entries(ROUTES).map(([key, route]) => `
            <button class="nav-icon" data-route="${key}" id="nav-${key}" title="${route.label}">
              ${ICONS[route.icon]}
              <span class="nav-tooltip">${route.label}</span>
            </button>
          `).join('')}
        </nav>

        <div class="nav-separator" style="margin-top:auto;"></div>
        <div class="nav-group nav-bottom" style="padding-bottom:12px;">
          <button class="nav-icon" id="nav-settings" title="Settings">
            ${ICONS.settings}
            <span class="nav-tooltip">Settings</span>
          </button>
        </div>
      </aside>

      <!-- MAIN PANEL -->
      <main class="main-panel" id="main-panel">
        <div class="page-container" id="page-container">
          <!-- Page content injected here -->
        </div>
      </main>

      <!-- RIGHT SIDEBAR -->
      <aside class="sidebar-right" id="sidebar-right">
        <div class="drawer-header">
          <span style="font-weight:600;font-size:var(--text-sm);color:var(--text-primary);">TOZY.AI</span>
          <span class="badge badge-accent" style="font-size:9px;">PRO</span>
        </div>
        <div class="drawer-tabs">
          <button class="drawer-tab ${state.rightDrawerTab === 'ai' ? 'active' : ''}" data-drawer="ai">AI Assist</button>
          <button class="drawer-tab ${state.rightDrawerTab === 'watchlist' ? 'active' : ''}" data-drawer="watchlist">Watchlist</button>
          <button class="drawer-tab ${state.rightDrawerTab === 'settings' ? 'active' : ''}" data-drawer="settings">Settings</button>
        </div>
        <div class="drawer-content" id="drawer-content">
          <!-- Drawer content injected here -->
        </div>
      </aside>
    </div>
  `;

  // Bind nav clicks
  document.querySelectorAll('.nav-icon[data-route]').forEach(btn => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.route));
  });

  // Bind drawer tab clicks
  document.querySelectorAll('.drawer-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      state.rightDrawerTab = tab.dataset.drawer;
      document.querySelectorAll('.drawer-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderDrawerContent();
    });
  });

  // Render drawer
  renderDrawerContent();

  // ── Fix 12: Keyboard shortcuts ──────────────────────────
  document.addEventListener('keydown', handleKeyboard);
}

function handleKeyboard(e) {
  // Don't fire when typing in an input
  if (['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)) return;
  const routeKeys = Object.keys(ROUTES);
  const numKey = parseInt(e.key);
  if (numKey >= 1 && numKey <= routeKeys.length) {
    navigateTo(routeKeys[numKey - 1]);
    showToast(`Navigated to ${ROUTES[routeKeys[numKey - 1]].label}`, 'accent');
    return;
  }
  if (e.key === 'w' || e.key === 'W') {
    state.rightDrawerTab = 'watchlist';
    document.querySelectorAll('.drawer-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.drawer === 'watchlist');
    });
    renderDrawerContent();
  }
  if (e.key === 'Escape') {
    const modals = document.querySelectorAll('.modal-overlay');
    modals.forEach(m => m.remove());
  }
}

// ─── Right Drawer Content ───
function renderDrawerContent() {
  const container = document.getElementById('drawer-content');
  if (!container) return;

  switch (state.rightDrawerTab) {
    case 'ai':
      container.innerHTML = renderAIAssistant();
      // Bind AI chat after render
      setTimeout(bindAIChat, 0);
      break;
    case 'watchlist':
      container.innerHTML = renderWatchlist();
      break;
    case 'settings':
      container.innerHTML = renderSettings();
      break;
  }
}

function renderAIAssistant() {
  const msgs = state.aiMessages.map(m => {
    const isAI = m.from === 'ai';
    return `
      <div class="feed-item" style="border-radius:var(--radius-md);background:var(--bg-primary);margin-bottom:8px;">
        <div class="feed-header">
          <div class="feed-avatar" style="background:${isAI ? 'var(--accent-bg)' : 'var(--bull-bg)'};color:${isAI ? 'var(--accent)' : 'var(--bull)'}">${isAI ? 'T' : 'U'}</div>
          <span class="feed-username" style="font-size:var(--text-xs);">${isAI ? 'TOZY AI' : 'You'}</span>
        </div>
        <p style="font-size:var(--text-xs);color:var(--text-secondary);line-height:1.6;margin:4px 0 0;">${m.text}</p>
      </div>`;
  }).join('');

  return `
    <div style="padding:4px 0;display:flex;flex-direction:column;height:100%;">
      <div style="flex:1;overflow-y:auto;padding:0 4px;" id="ai-chat-log">${msgs}</div>
      <div style="padding:8px 4px;border-top:1px solid var(--border);margin-top:8px;">
        <div style="display:flex;gap:6px;">
          <input class="input" id="ai-input" placeholder="Ask TOZY AI..." style="font-size:var(--text-xs);">
          <button class="btn btn-primary btn-sm" style="flex-shrink:0;" id="ai-send">Send</button>
        </div>
        <div style="display:flex;gap:4px;margin-top:8px;flex-wrap:wrap;">
          <button class="btn btn-ghost btn-sm ai-quick" style="font-size:9px;" data-q="Give me a market brief for today">📊 Market Brief</button>
          <button class="btn btn-ghost btn-sm ai-quick" style="font-size:9px;" data-q="What is the current Max Pain level?">🎯 Max Pain</button>
          <button class="btn btn-ghost btn-sm ai-quick" style="font-size:9px;" data-q="Analyse the current PCR reading">📈 PCR Analysis</button>
        </div>
      </div>
    </div>
  `;
}

const DISCLAIMER = '\n\n*This mathematical parameter scan is provided for educational and skill-development purposes only. TOZY.AI does not offer financial advice, trade signals, or buy/sell recommendations. Financial trading involves high capital risk. Please consult a registered financial advisor.*';

const AI_RESPONSES = {
  'Give me a market brief for today': 'NIFTY 50 is trading at 24,567 (+0.45%). Breadth is positive at 1247:823. FII flow shows ₹2,340 Cr volume in index futures. Key parameter watch: RBI policy statement at 2PM IST. Technical alignment remains above the 24,450 risk boundary.' + DISCLAIMER,
  'What is the current Max Pain level?': 'Max Pain for weekly expiry (Jul 17) is at ₹24,500. Total option pain at this strike is ₹3,840 Cr. Current spot (₹24,567) is ₹67 above Max Pain — expecting mathematical gravity/drift toward 24,500 into expiry.' + DISCLAIMER,
  'Analyse the current PCR reading': 'Current PCR is 1.12 (Puts:Calls OI ratio). This rests in the Neutral-to-Positive mathematical zone (1.0–1.2). Historical upper boundary is 1.45. PCR trending up from 0.88 yesterday indicates systemic accumulation on intraday regressions.' + DISCLAIMER,
};

function bindAIChat() {
  const input = document.getElementById('ai-input');
  const sendBtn = document.getElementById('ai-send');
  const log = document.getElementById('ai-chat-log');
  if (!input || !sendBtn || !log) return;

  function sendMessage(q) {
    const text = q || input.value.trim();
    if (!text) return;
    state.aiMessages.push({ from: 'user', text });
    input.value = '';
    const response = AI_RESPONSES[text] ||
      `Analysing "${text}"... The mathematical confluence engine detects a 'High-Confluence Parameter Crossing' forming near the 24,500 coordinate with PCR at 1.12. Historical modeling points to an upside liquidity target of 24,600, given a downside invalidation boundary is maintained at current levels.${DISCLAIMER}`;
    setTimeout(() => {
      state.aiMessages.push({ from: 'ai', text: response });
      renderDrawerContent();
      showToast('AI response ready', 'accent');
    }, 600);
    renderDrawerContent();
  }

  sendBtn.addEventListener('click', () => sendMessage());
  input.addEventListener('keydown', e => { if (e.key === 'Enter') sendMessage(); });
  document.querySelectorAll('.ai-quick').forEach(btn => {
    btn.addEventListener('click', () => sendMessage(btn.dataset.q));
  });
  log.scrollTop = log.scrollHeight;
}

function renderWatchlist() {
  return `
    <div style="padding:4px 0;">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:4px 8px 12px;">
        <span style="font-size:var(--text-xs);color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em;">My Watchlist</span>
        <div style="display:flex;gap:6px;align-items:center;">
          <span style="font-size:9px;color:var(--text-muted);">⌨ W</span>
          <button class="btn btn-ghost btn-sm" style="font-size:9px;">+ Add</button>
        </div>
      </div>
      ${state.watchlist.map(item => `
        <div class="feed-item" style="padding:8px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;"
             title="Chart ${item.symbol}" onclick="window.location.hash='#/charting'">
          <div>
            <div style="font-weight:600;font-size:var(--text-sm);color:var(--text-primary);">${item.symbol}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-family:var(--font-mono);font-size:var(--text-sm);color:var(--text-primary);">₹${item.ltp.toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
            <div style="font-family:var(--font-mono);font-size:var(--text-xs);color:${item.change >= 0 ? 'var(--bull)' : 'var(--bear)'}">
              ${item.change >= 0 ? '▲' : '▼'} ${Math.abs(item.change).toFixed(2)}%
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderSettings() {
  return `
    <div style="padding:8px 4px;">
      <h4 style="font-size:var(--text-xs);color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:16px;">Compliance Settings</h4>

      <div class="input-group" style="margin-bottom:16px;">
        <label class="input-label">Default Exchange</label>
        <select class="input select">
          <option>NSE</option>
          <option>BSE</option>
          <option>MCX</option>
        </select>
      </div>

      <div class="input-group" style="margin-bottom:16px;">
        <label class="input-label">Data Vendor</label>
        <select class="input select">
          <option>TrueData (Empanelled)</option>
          <option>TickData (Empanelled)</option>
        </select>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border);">
        <div>
          <div style="font-size:var(--text-sm);color:var(--text-primary);">Educator Mode</div>
          <div style="font-size:var(--text-xs);color:var(--text-muted);">Obfuscate live prices on export</div>
        </div>
        <input type="checkbox" class="toggle-switch">
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border);">
        <div>
          <div style="font-size:var(--text-sm);color:var(--text-primary);">OPS Safeguard</div>
          <div style="font-size:var(--text-xs);color:var(--text-muted);">Limit to 10 orders/sec</div>
        </div>
        <input type="checkbox" class="toggle-switch" checked>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border);">
        <div>
          <div style="font-size:var(--text-sm);color:var(--text-primary);">Static IP Proxy</div>
          <div style="font-size:var(--text-xs);color:var(--text-muted);">Route via whitelisted IPv4</div>
        </div>
        <input type="checkbox" class="toggle-switch" checked>
      </div>

      <div style="margin-top:20px;padding:12px;background:var(--bg-primary);border-radius:var(--radius-md);border:1px solid var(--border);">
        <div style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:4px;">SEBI Compliance</div>
        <div style="display:flex;align-items:center;gap:6px;">
          <span class="status-dot online"></span>
          <span style="font-size:var(--text-sm);color:var(--bull);">All checks passed</span>
        </div>
      </div>
    </div>
  `;
}

// ─── Router ───
let currentUnmount = null;

function navigateTo(route) {
  if (state.currentRoute === route) return;

  // Unmount current page
  if (currentUnmount) {
    try { currentUnmount(); } catch (e) { console.warn('Unmount error:', e); }
  }

  // Update nav active state
  document.querySelectorAll('.nav-icon[data-route]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.route === route);
  });

  state.currentRoute = route;
  window.location.hash = `#/${route}`;

  // Mount new page
  const container = document.getElementById('page-container');
  if (!container) return;
  container.innerHTML = '';

  const routeConfig = ROUTES[route];
  if (routeConfig) {
    try {
      routeConfig.mount(container);
      currentUnmount = routeConfig.unmount;
      // Fix 13: page-enter animation
      container.classList.remove('page-enter');
      void container.offsetWidth; // force reflow
      container.classList.add('page-enter');
    } catch (e) {
      console.error(`Failed to mount ${route}:`, e);
      container.innerHTML = `
        <div style="text-align:center;padding:60px;">
          <h2 style="color:var(--bear);margin-bottom:8px;">Page Load Error</h2>
          <p style="color:var(--text-muted);font-size:var(--text-sm);">${e.message}</p>
        </div>
      `;
    }
  }

  // Scroll main panel to top
  const mainPanel = document.getElementById('main-panel');
  if (mainPanel) mainPanel.scrollTop = 0;
}

function getRouteFromHash() {
  const hash = window.location.hash.replace('#/', '');
  return ROUTES[hash] ? hash : 'dashboard';
}

// Re-export showToast so any callers that imported it from app.js still work
export { showToast };

// ─── Boot ───
let _initialized = false;
function init() {
  if (_initialized) return;
  _initialized = true;
  renderShell();
  const initialRoute = getRouteFromHash();
  navigateTo(initialRoute);

  // Hash change listener
  window.addEventListener('hashchange', () => {
    const route = getRouteFromHash();
    navigateTo(route);
  });

  // Boot toast
  setTimeout(() => showToast('⟁ TOZY.AI Terminal Ready · Press 1-6 to navigate', 'accent', 5000), 800);

  // Log boot
  console.log(
    '%c⟁ TOZY.AI %cCyberpunk-Quant Terminal v1.0',
    'color:#8B5CF6;font-weight:bold;font-size:14px;',
    'color:#9CA3AF;font-size:11px;'
  );
  console.log('%c⌨ Shortcuts: 1-6 = pages · W = watchlist · Esc = close modal', 'color:#6B7280;font-size:11px;');

  initAuth();
}

// ─── Supabase Auth ───
async function initAuth() {
  const { data } = await supabase.auth.getSession();
  authSession = data.session;
  
  supabase.auth.onAuthStateChange(async (event, session) => {
    authSession = session;
    if (!session) showAuthModal();
    else {
      hideAuthModal();
      await syncUserProfile(session.user);
    }
  });

  if (!authSession) {
    showAuthModal();
  } else {
    syncUserProfile(authSession.user);
  }
}

async function syncUserProfile(user) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      // Create new profile with mock default metrics
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          username: (user.email ? user.email.split('@')[0] : 'user') + Math.floor(Math.random() * 1000),
          full_name: user.user_metadata?.full_name || 'Anonymous Chartist',
          profile_tier: 'Traders',
          verified_balance: 50000.00,
          win_streak_days: 3,
          win_percentage: 62.50
        });
      if (insertError) throw insertError;

      // Also insert a default broker ledger row
      await supabase.from('broker_ledgers').insert({
        user_id: user.id,
        broker_name: 'Zerodha Kite',
        account_id: 'DEMAT-' + Math.floor(100 + Math.random() * 900),
        realized_pnl: 12400.00,
        verification_hash: 'sha256:8f2a9c3d4f107b5e824c6a8f1d2e'
      });

      // And a default technical crossing
      await supabase.from('technical_crossings').insert({
        user_id: user.id,
        ticker_symbol: 'NIFTY 50',
        study_type: 'EMA_200_CROSS',
        direction: 'BULLISH_BIAS',
        risk_boundary: 24350.00,
        liquidity_target: 24700.00
      });
    }
  } catch (e) {
    console.error('Failed to sync user profile:', e);
  }
}

function showAuthModal() {
  if (document.getElementById('auth-modal')) return;
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'auth-modal';
  overlay.innerHTML = `
    <div class="modal-content" style="text-align:center;max-width:400px;border-color:var(--accent);">
      <h2 style="font-size:var(--text-xl);margin-bottom:8px;color:var(--text-primary);">TOZY.AI SECURE GATEWAY</h2>
      <p style="font-size:var(--text-sm);color:var(--text-muted);margin-bottom:24px;">Please complete OAuth broker verification to access mathematical scanners and encrypted ledger tracking.</p>
      <button class="btn btn-primary btn-lg" style="width:100%;justify-content:center;" id="google-login-btn">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" style="margin-right:8px;"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
        Sign in with Google
      </button>
      <div style="margin-top:16px;font-size:var(--text-xs);color:var(--text-muted);text-align:left;">
        <span class="badge badge-neutral">SEBI COMPLIANCE NOTE</span>
        <br>By continuing, you agree to our terms. This is an unregulated educational utility. No financial advice provided.
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  document.getElementById('google-login-btn').addEventListener('click', async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
      });
      if (error) throw error;
    } catch (e) {
      showToast('OAuth Error: ' + e.message, 'bear');
    }
  });
}

function hideAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (modal) modal.remove();
}

// Ensure 8 AM IST Flush
setInterval(() => {
  const now = new Date();
  // Adjust to IST (+5:30)
  const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
  if (istTime.getUTCHours() === 8 && istTime.getUTCMinutes() === 0) {
    if (authSession) {
      supabase.auth.signOut();
      showToast('Daily Pre-Market Authentication Flush (8:00 AM IST). Please re-login to authorize session.', 'bear', 10000);
    }
  }
}, 60000); // Check every minute

// Start app
document.addEventListener('DOMContentLoaded', init);
if (document.readyState !== 'loading') init();
