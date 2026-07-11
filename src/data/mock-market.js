// ─────────────────────────────────────────────────────────────
//  TOZY.AI — Mock Market Data Module
//  All data is realistic for Indian NSE F&O markets (2025)
// ─────────────────────────────────────────────────────────────

/* ── Helpers ─────────────────────────────────────────────── */

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function randInt(min, max) {
  return Math.floor(rand(min, max + 1));
}

function pick(arr) {
  return arr[randInt(0, arr.length - 1)];
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function normalRandom() {
  // Box-Muller transform
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function formatTime(d) {
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

function formatDate(d) {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

/* ── 1. NSE_FNO_STOCKS ──────────────────────────────────── */

const RAW_STOCKS = [
  { symbol: 'RELIANCE',    name: 'Reliance Industries Ltd',       sector: 'Energy',          ltp: 2950  },
  { symbol: 'TCS',         name: 'Tata Consultancy Services Ltd', sector: 'IT',              ltp: 4100  },
  { symbol: 'HDFCBANK',    name: 'HDFC Bank Ltd',                 sector: 'Banking',         ltp: 1720  },
  { symbol: 'INFY',        name: 'Infosys Ltd',                   sector: 'IT',              ltp: 1650  },
  { symbol: 'ICICIBANK',   name: 'ICICI Bank Ltd',                sector: 'Banking',         ltp: 1280  },
  { symbol: 'SBIN',        name: 'State Bank of India',           sector: 'Banking',         ltp: 820   },
  { symbol: 'BHARTIARTL',  name: 'Bharti Airtel Ltd',             sector: 'Telecom',         ltp: 1740  },
  { symbol: 'ITC',         name: 'ITC Ltd',                       sector: 'FMCG',            ltp: 480   },
  { symbol: 'KOTAKBANK',   name: 'Kotak Mahindra Bank Ltd',       sector: 'Banking',         ltp: 1890  },
  { symbol: 'LT',          name: 'Larsen & Toubro Ltd',           sector: 'Infrastructure',  ltp: 3680  },
  { symbol: 'AXISBANK',    name: 'Axis Bank Ltd',                 sector: 'Banking',         ltp: 1210  },
  { symbol: 'WIPRO',       name: 'Wipro Ltd',                     sector: 'IT',              ltp: 465   },
  { symbol: 'HCLTECH',     name: 'HCL Technologies Ltd',          sector: 'IT',              ltp: 1780  },
  { symbol: 'MARUTI',      name: 'Maruti Suzuki India Ltd',       sector: 'Auto',            ltp: 12850 },
  { symbol: 'TATAMOTORS',  name: 'Tata Motors Ltd',               sector: 'Auto',            ltp: 980   },
  { symbol: 'TATASTEEL',   name: 'Tata Steel Ltd',                sector: 'Metal',           ltp: 170   },
  { symbol: 'SUNPHARMA',   name: 'Sun Pharmaceutical Ind Ltd',    sector: 'Pharma',          ltp: 1850  },
  { symbol: 'BAJFINANCE',  name: 'Bajaj Finance Ltd',             sector: 'Banking',         ltp: 7200  },
  { symbol: 'BAJAJFINSV',  name: 'Bajaj Finserv Ltd',             sector: 'Insurance',       ltp: 1680  },
  { symbol: 'ONGC',        name: 'Oil & Natural Gas Corp Ltd',    sector: 'Energy',          ltp: 280   },
  { symbol: 'NTPC',        name: 'NTPC Ltd',                      sector: 'Energy',          ltp: 385   },
  { symbol: 'POWERGRID',   name: 'Power Grid Corp of India Ltd',  sector: 'Energy',          ltp: 330   },
  { symbol: 'COALINDIA',   name: 'Coal India Ltd',                sector: 'Energy',          ltp: 490   },
  { symbol: 'ADANIENT',    name: 'Adani Enterprises Ltd',         sector: 'Infrastructure',  ltp: 3150  },
  { symbol: 'ADANIPORTS',  name: 'Adani Ports & SEZ Ltd',         sector: 'Infrastructure',  ltp: 1420  },
  { symbol: 'TECHM',       name: 'Tech Mahindra Ltd',             sector: 'IT',              ltp: 1680  },
  { symbol: 'ULTRACEMCO',  name: 'UltraTech Cement Ltd',          sector: 'Cement',          ltp: 11200 },
  { symbol: 'TITAN',       name: 'Titan Company Ltd',             sector: 'FMCG',            ltp: 3650  },
  { symbol: 'ASIANPAINT',  name: 'Asian Paints Ltd',              sector: 'FMCG',            ltp: 2780  },
  { symbol: 'HINDUNILVR',  name: 'Hindustan Unilever Ltd',        sector: 'FMCG',            ltp: 2450  },
  { symbol: 'NESTLEIND',   name: 'Nestle India Ltd',              sector: 'FMCG',            ltp: 2380  },
  { symbol: 'DRREDDY',     name: "Dr. Reddy's Laboratories Ltd",  sector: 'Pharma',          ltp: 6400  },
  { symbol: 'CIPLA',       name: 'Cipla Ltd',                     sector: 'Pharma',          ltp: 1520  },
  { symbol: 'APOLLOHOSP',  name: 'Apollo Hospitals Ent Ltd',      sector: 'Pharma',          ltp: 6800  },
  { symbol: 'DIVISLAB',    name: "Divi's Laboratories Ltd",       sector: 'Pharma',          ltp: 5900  },
  { symbol: 'GRASIM',      name: 'Grasim Industries Ltd',         sector: 'Cement',          ltp: 2780  },
  { symbol: 'HEROMOTOCO',  name: 'Hero MotoCorp Ltd',             sector: 'Auto',            ltp: 5200  },
  { symbol: 'EICHERMOT',   name: 'Eicher Motors Ltd',             sector: 'Auto',            ltp: 4800  },
  { symbol: 'M&M',         name: 'Mahindra & Mahindra Ltd',       sector: 'Auto',            ltp: 2960  },
  { symbol: 'BPCL',        name: 'Bharat Petroleum Corp Ltd',     sector: 'Energy',          ltp: 640   },
  { symbol: 'JSWSTEEL',    name: 'JSW Steel Ltd',                 sector: 'Metal',           ltp: 980   },
  { symbol: 'TATACONSUM',  name: 'Tata Consumer Products Ltd',    sector: 'FMCG',            ltp: 1080  },
  { symbol: 'BRITANNIA',   name: 'Britannia Industries Ltd',      sector: 'FMCG',            ltp: 5600  },
  { symbol: 'INDUSINDBK',  name: 'IndusInd Bank Ltd',             sector: 'Banking',         ltp: 1420  },
  { symbol: 'HINDALCO',    name: 'Hindalco Industries Ltd',       sector: 'Metal',           ltp: 650   },
  { symbol: 'SBILIFE',     name: 'SBI Life Insurance Co Ltd',     sector: 'Insurance',       ltp: 1680  },
  { symbol: 'HDFCLIFE',    name: 'HDFC Life Insurance Co Ltd',    sector: 'Insurance',       ltp: 680   },
  { symbol: 'BAJAJ-AUTO',  name: 'Bajaj Auto Ltd',                sector: 'Auto',            ltp: 9400  },
  { symbol: 'SHRIRAMFIN',  name: 'Shriram Finance Ltd',           sector: 'Banking',         ltp: 2800  },
  { symbol: 'DLF',         name: 'DLF Ltd',                       sector: 'Realty',          ltp: 880   },
];

export const NSE_FNO_STOCKS = RAW_STOCKS.map((s) => {
  const changePct = round2(rand(-4, 4));
  const changeAbs = round2(s.ltp * changePct / 100);
  const ltp       = round2(s.ltp + changeAbs);
  return {
    symbol:    s.symbol,
    name:      s.name,
    sector:    s.sector,
    ltp,
    change:    changePct,
    changeAbs,
    volume:    randInt(500_000, 50_000_000),
    avgVolume: randInt(1_000_000, 30_000_000),
    oi:        randInt(1_000_000, 50_000_000),
    oiChange:  round2(rand(-10, 10)),
    marketCap: randInt(20_000, 1_800_000),
  };
});


/* ── 2. INDICES ──────────────────────────────────────────── */

export const INDICES = {
  nifty50: {
    name:          'NIFTY 50',
    ltp:           24567.80,
    change:        0.45,
    changePercent:  0.45,
    high:          24612,
    low:           24380,
    open:          24410,
    prevClose:     24457,
  },
  banknifty: {
    name:          'BANK NIFTY',
    ltp:           52134.65,
    change:        -0.23,
    changePercent: -0.23,
    high:          52340,
    low:           51890,
    open:          52050,
    prevClose:     52255,
  },
  finnifty: {
    name:          'FINNIFTY',
    ltp:           23845.30,
    change:        0.12,
    changePercent:  0.12,
    high:          23910,
    low:           23750,
    open:          23800,
    prevClose:     23817,
  },
  mcxCrude: {
    name:          'MCX CRUDE',
    ltp:           5834,
    change:        -0.68,
    changePercent: -0.68,
    high:          5892,
    low:           5810,
    open:          5870,
    prevClose:     5874,
  },
};


/* ── 3. generateOHLCV ────────────────────────────────────── */

export function generateOHLCV(basePrice = 24500, count = 500, timeframe = 'daily') {
  const data = [];
  const now  = Date.now();

  const spacingMs = {
    '1m':     60 * 1000,
    '5m':     5  * 60 * 1000,
    '15m':    15 * 60 * 1000,
    '1H':     60 * 60 * 1000,
    '4H':     4  * 60 * 60 * 1000,
    'daily':  24 * 60 * 60 * 1000,
    'weekly': 7  * 24 * 60 * 60 * 1000,
  };

  const spacing    = spacingMs[timeframe] || spacingMs['daily'];
  const volatility = basePrice * 0.012; // ~1.2 % daily vol
  const baseVolume = 8_000_000;
  let prevClose    = basePrice;

  for (let i = count - 1; i >= 0; i--) {
    const time = now - i * spacing;

    // random walk
    const move  = normalRandom() * volatility;
    const close = round2(prevClose + move);
    const gap   = normalRandom() * volatility * 0.15;
    const open  = round2(prevClose + gap);

    const body  = Math.abs(close - open);
    const high  = round2(Math.max(open, close) + Math.abs(normalRandom()) * volatility * 0.4);
    const low   = round2(Math.min(open, close) - Math.abs(normalRandom()) * volatility * 0.4);

    const changePct = Math.abs((close - open) / open);
    const volume    = Math.round(baseVolume * (1 + changePct * 5) * rand(0.6, 1.4));

    data.push({ time, open, high, low, close, volume });
    prevClose = close;
  }

  return data;
}


/* ── 4. generateOptionsChain ─────────────────────────────── */

// Cumulative‑normal approximation (Abramowitz & Stegun)
function cdf(x) {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.SQRT2;
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return 0.5 * (1.0 + sign * y);
}

function bsCall(S, K, T, r, sigma) {
  if (T <= 0) return Math.max(S - K, 0);
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);
  return S * cdf(d1) - K * Math.exp(-r * T) * cdf(d2);
}

function bsPut(S, K, T, r, sigma) {
  if (T <= 0) return Math.max(K - S, 0);
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);
  return K * Math.exp(-r * T) * cdf(-d2) - S * cdf(-d1);
}

function bsGreeks(S, K, T, r, sigma, type) {
  if (T <= 0) {
    const itm = type === 'CE' ? S > K : S < K;
    return { delta: itm ? (type === 'CE' ? 1 : -1) : 0, gamma: 0, theta: 0, vega: 0 };
  }
  const d1  = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
  const d2  = d1 - sigma * Math.sqrt(T);
  const nd1 = Math.exp(-0.5 * d1 * d1) / Math.sqrt(2 * Math.PI);

  const gamma = nd1 / (S * sigma * Math.sqrt(T));
  const vega  = S * nd1 * Math.sqrt(T) / 100; // per 1% move

  if (type === 'CE') {
    return {
      delta: round2(cdf(d1)),
      gamma: round2(gamma),
      theta: round2((-S * nd1 * sigma / (2 * Math.sqrt(T)) - r * K * Math.exp(-r * T) * cdf(d2)) / 365),
      vega:  round2(vega),
    };
  }
  return {
    delta: round2(cdf(d1) - 1),
    gamma: round2(gamma),
    theta: round2((-S * nd1 * sigma / (2 * Math.sqrt(T)) + r * K * Math.exp(-r * T) * cdf(-d2)) / 365),
    vega:  round2(vega),
  };
}

export function generateOptionsChain(underlyingPrice = 24500, expiryDays = 7) {
  const T        = expiryDays / 365;
  const r        = 0.065; // India risk-free ~6.5 %
  const atmStrike = Math.round(underlyingPrice / 50) * 50;
  const strikes   = [];
  const calls     = [];
  const puts      = [];

  for (let i = -10; i <= 10; i++) {
    const strike  = atmStrike + i * 50;
    const moneyness = Math.abs(strike - underlyingPrice) / underlyingPrice;

    // U-shaped IV smile: higher IV far from ATM
    const baseIV  = rand(0.12, 0.16);
    const smile   = moneyness * moneyness * 8;
    const iv      = round2(Math.min(baseIV + smile, 0.35));

    const callLTP = round2(Math.max(bsCall(underlyingPrice, strike, T, r, iv), 0.05));
    const putLTP  = round2(Math.max(bsPut(underlyingPrice, strike, T, r, iv), 0.05));

    const callGreeks = bsGreeks(underlyingPrice, strike, T, r, iv, 'CE');
    const putGreeks  = bsGreeks(underlyingPrice, strike, T, r, iv, 'PE');

    const spreadCall = round2(Math.max(callLTP * rand(0.005, 0.02), 0.05));
    const spreadPut  = round2(Math.max(putLTP  * rand(0.005, 0.02), 0.05));

    strikes.push(strike);

    calls.push({
      strike,
      ltp:      callLTP,
      change:   round2(rand(-15, 15)),
      oi:       randInt(50_000, 5_000_000),
      oiChange: round2(rand(-20, 20)),
      volume:   randInt(5_000, 2_000_000),
      iv:       round2(iv * 100),
      ...callGreeks,
      bid:      round2(Math.max(callLTP - spreadCall, 0.05)),
      ask:      round2(callLTP + spreadCall),
      bidQty:   randInt(50, 5000) * 50,
      askQty:   randInt(50, 5000) * 50,
    });

    puts.push({
      strike,
      ltp:      putLTP,
      change:   round2(rand(-15, 15)),
      oi:       randInt(50_000, 5_000_000),
      oiChange: round2(rand(-20, 20)),
      volume:   randInt(5_000, 2_000_000),
      iv:       round2(iv * 100),
      ...putGreeks,
      bid:      round2(Math.max(putLTP - spreadPut, 0.05)),
      ask:      round2(putLTP + spreadPut),
      bidQty:   randInt(50, 5000) * 50,
      askQty:   randInt(50, 5000) * 50,
    });
  }

  return { calls, puts, strikes };
}


/* ── 5. generateMomentumScanResults ──────────────────────── */

export function generateMomentumScanResults() {
  const enriched = NSE_FNO_STOCKS.map((s) => ({
    ...s,
    volumeMultiplier: round2(rand(1.0, 5.0)),
  }));

  const sorted  = [...enriched].sort((a, b) => b.change - a.change);
  const gainers = sorted.slice(0, 10);
  const losers  = sorted.slice(-10).reverse();           // worst first

  return { gainers, losers };
}


/* ── 6. generateOptionsFlow ──────────────────────────────── */

export function generateOptionsFlow() {
  const flowSymbols   = ['NIFTY', 'BANKNIFTY', 'RELIANCE', 'HDFCBANK', 'INFY', 'TCS', 'ICICIBANK', 'SBIN', 'BAJFINANCE', 'TATAMOTORS'];
  const expiryDate    = new Date(Date.now() + 7 * 86400000);
  const expiryStr     = formatDate(expiryDate);
  const types         = ['CE', 'PE'];

  function makeSweep() {
    const sym      = pick(flowSymbols);
    const isIndex  = sym === 'NIFTY' || sym === 'BANKNIFTY';
    const base     = isIndex ? (sym === 'NIFTY' ? 24500 : 52100) : pick(NSE_FNO_STOCKS.filter(s => s.symbol === sym))?.ltp || 1000;
    const step     = isIndex ? 50 : Math.max(10, Math.round(base * 0.01 / 5) * 5);
    const strike   = Math.round(base / step) * step + pick([-2,-1,0,1,2]) * step;
    const type     = pick(types);
    const contracts = randInt(200, 5000);
    const premium   = round2(rand(20, 600));
    const lotSize   = isIndex ? 25 : 500;
    const totalVal  = round2(contracts * premium * lotSize / 10_000_000); // in Cr

    const now       = new Date();
    now.setMinutes(now.getMinutes() - randInt(0, 120));

    return {
      time:      formatTime(now),
      symbol:    sym,
      strike,
      type,
      expiry:    expiryStr,
      premium,
      contracts,
      totalValue: `${totalVal.toFixed(2)} Cr`,
      sentiment:  type === 'CE' ? (strike < base ? 'Bullish' : 'Bearish') : (strike > base ? 'Bearish' : 'Bullish'),
    };
  }

  const sweeps = Array.from({ length: 20 }, makeSweep);

  // Blocks: larger orders
  const blocks = Array.from({ length: 10 }, () => {
    const s = makeSweep();
    const bigContracts = randInt(3000, 15000);
    const bigPremium   = round2(rand(50, 800));
    const sym          = s.symbol;
    const isIndex      = sym === 'NIFTY' || sym === 'BANKNIFTY';
    const lotSize      = isIndex ? 25 : 500;
    const tv           = round2(bigContracts * bigPremium * lotSize / 10_000_000);
    return { ...s, contracts: bigContracts, premium: bigPremium, totalValue: `${Math.max(tv, 5.01).toFixed(2)} Cr` };
  });

  // OI Build-ups
  const oiBuildups = Array.from({ length: 30 }, () => {
    const sym         = pick(flowSymbols);
    const isIndex     = sym === 'NIFTY' || sym === 'BANKNIFTY';
    const base        = isIndex ? (sym === 'NIFTY' ? 24500 : 52100) : pick(NSE_FNO_STOCKS.filter(s => s.symbol === sym))?.ltp || 1000;
    const step        = isIndex ? 50 : Math.max(10, Math.round(base * 0.01 / 5) * 5);
    const strike      = Math.round(base / step) * step + pick([-3,-2,-1,0,1,2,3]) * step;
    const type        = pick(types);
    const oiChange    = randInt(-500_000, 500_000);
    const priceChange = round2(rand(-50, 50));

    let category;
    if (oiChange > 0 && priceChange > 0)      category = 'Long Build-up';
    else if (oiChange > 0 && priceChange <= 0) category = 'Short Build-up';
    else if (oiChange <= 0 && priceChange > 0) category = 'Short Covering';
    else                                        category = 'Long Unwinding';

    return { symbol: sym, strike, type, oiChange, priceChange, category };
  });

  return { sweeps, blocks, oiBuildups };
}


/* ── 7. generatePatternResults ───────────────────────────── */

const PATTERN_NAMES = [
  'Double Top', 'Head & Shoulders', 'Ascending Triangle',
  'Descending Triangle', 'Symmetrical Wedge', 'Cup & Handle',
  'Channel Up', 'Channel Down',
];

const TIMEFRAMES = ['1H', '4H', 'Daily', 'Weekly'];
const ALGORITHMS = ['Rolling Window', 'Zigzag', 'PIPs'];

const BEARISH_PATTERNS = new Set(['Double Top', 'Head & Shoulders', 'Descending Triangle', 'Channel Down']);

export function generatePatternResults() {
  function makePattern(confirmed) {
    const stock      = pick(NSE_FNO_STOCKS);
    const pattern    = pick(PATTERN_NAMES);
    const direction  = BEARISH_PATTERNS.has(pattern) ? 'Bearish' : 'Bullish';
    const confidence = confirmed ? randInt(85, 98) : randInt(60, 85);
    const multiplier = direction === 'Bullish' ? rand(1.03, 1.12) : rand(0.88, 0.97);
    const liquidityTarget = round2(stock.ltp * multiplier);

    const entry = {
      symbol:       stock.symbol,
      pattern,
      timeframe:    pick(TIMEFRAMES),
      direction,
      confidence,
      liquidityTarget,
      currentPrice: stock.ltp,
      algorithm:    pick(ALGORITHMS),
      studyType:    `${pattern.replace(/\s+/g, '_').toUpperCase()}_CROSS`,
    };

    if (confirmed) {
      const bpMult = direction === 'Bullish' ? rand(0.98, 1.01) : rand(0.99, 1.02);
      entry.riskBoundary = round2(stock.ltp * bpMult);
      const d = new Date();
      d.setDate(d.getDate() - randInt(1, 10));
      entry.breakoutDate = formatDate(d);
    }

    return entry;
  }

  return {
    emerging:  Array.from({ length: 15 }, () => makePattern(false)),
    confirmed: Array.from({ length: 10 }, () => makePattern(true)),
  };
}


/* ── 8. generateCreatorStoreItems ────────────────────────── */

const STORE_ITEMS_RAW = [
  {
    id: 'nifty-sniper-pro',
    name: 'Nifty Sniper Pro',
    description: 'Precision intraday scalping strategy targeting NIFTY 50 with multi-timeframe confirmation, VWAP anchoring, and auto-SL placement. Battle-tested across 3 years of live markets.',
    author: 'QuantVault Labs',
    category: 'Strategy',
    tags: ['intraday', 'scalping', 'nifty', 'vwap'],
    price: 1999,
    performance: { returns: '38%', winRate: '67%', maxDrawdown: '8%', sharpeRatio: '2.4' },
  },
  {
    id: 'oi-flow-scanner-elite',
    name: 'OI Flow Scanner Elite',
    description: 'Institutional-grade Open Interest flow scanner that detects unusual sweeps, block deals, and smart money footprints across NSE F&O in real-time with configurable alerts.',
    author: 'DerivEdge Capital',
    category: 'Scanner',
    tags: ['oi', 'flow', 'institutional', 'scanner'],
    price: 2499,
    performance: { returns: '27%', winRate: '61%', maxDrawdown: '11%', sharpeRatio: '1.9' },
  },
  {
    id: 'pcr-reversal-engine',
    name: 'PCR Reversal Engine',
    description: 'Mean-reversion strategy that triggers entries when Put-Call Ratio hits extreme levels combined with divergence in VIX. Optimised for weekly expiry cycles.',
    author: 'Sigma Derivatives',
    category: 'Strategy',
    tags: ['pcr', 'mean-reversion', 'vix', 'weekly-expiry'],
    price: 1499,
    performance: { returns: '22%', winRate: '58%', maxDrawdown: '13%', sharpeRatio: '1.5' },
  },
  {
    id: 'dark-pool-heatmap',
    name: 'Dark Pool Heatmap',
    description: 'Advanced layout with real-time heatmap overlays for volume profile, OI clusters, and max-pain zones. Drag-and-drop panels with customizable color themes.',
    author: 'NeonGrid Studios',
    category: 'Layout',
    tags: ['heatmap', 'layout', 'volume-profile', 'max-pain'],
    price: 799,
    performance: { returns: '—', winRate: '—', maxDrawdown: '—', sharpeRatio: '—' },
  },
  {
    id: 'momentum-surge-detector',
    name: 'Momentum Surge Detector',
    description: 'Custom indicator combining RSI, ADX, and Supertrend with volume-spike detection to identify explosive breakout setups before they happen.',
    author: 'AlgoTraders India',
    category: 'Indicator',
    tags: ['momentum', 'rsi', 'adx', 'breakout'],
    price: 999,
    performance: { returns: '31%', winRate: '64%', maxDrawdown: '9%', sharpeRatio: '2.1' },
  },
  {
    id: 'iron-condor-autopilot',
    name: 'Iron Condor Autopilot',
    description: 'Automated non-directional options strategy that constructs, monitors, and adjusts Iron Condors based on IV percentile, skew, and theta decay curves.',
    author: 'OptionsNinja',
    category: 'Strategy',
    tags: ['iron-condor', 'non-directional', 'theta', 'automation'],
    price: 2999,
    performance: { returns: '18%', winRate: '72%', maxDrawdown: '5%', sharpeRatio: '2.8' },
  },
  {
    id: 'expiry-day-warrior',
    name: 'Expiry Day Warrior',
    description: 'Aggressive 0DTE strategy exploiting gamma compression and rapid theta burn on expiry days. Includes dynamic position sizing and emergency exit protocols.',
    author: 'ZeroDelta Research',
    category: 'Strategy',
    tags: ['0dte', 'expiry', 'gamma', 'theta-burn'],
    price: 2499,
    performance: { returns: '45%', winRate: '55%', maxDrawdown: '15%', sharpeRatio: '1.8' },
  },
  {
    id: 'market-profile-suite',
    name: 'Market Profile Suite',
    description: 'Comprehensive Market Profile scanner with TPO charts, value area identification, single prints detection, and poor highs/lows alerts across multiple instruments.',
    author: 'AuctionMarket Labs',
    category: 'Scanner',
    tags: ['market-profile', 'tpo', 'value-area', 'auction'],
    price: 1299,
    performance: { returns: '15%', winRate: '59%', maxDrawdown: '10%', sharpeRatio: '1.2' },
  },
];

export function generateCreatorStoreItems() {
  return STORE_ITEMS_RAW.map((item) => ({
    ...item,
    rating:      round2(rand(3.5, 5.0)),
    reviews:     randInt(10, 500),
    subscribers: randInt(50, 5000),
  }));
}


/* ── 9. BROKER_LIST ──────────────────────────────────────── */

export const BROKER_LIST = [
  { id: 'zerodha', name: 'Zerodha Kite Connect',   logo: '🪁', status: 'connected',    latency: 12,   apiKeyConfigured: true  },
  { id: 'dhan',    name: 'DhanHQ',                  logo: '📊', status: 'connected',    latency: 18,   apiKeyConfigured: true  },
  { id: 'fyers',   name: 'Fyers API v3',            logo: '📈', status: 'disconnected', latency: null, apiKeyConfigured: false },
  { id: 'kotak',   name: 'Kotak Neo',               logo: '🏦', status: 'pending',      latency: 25,   apiKeyConfigured: true  },
  { id: 'angel',   name: 'Angel One SmartAPI',      logo: '👼', status: 'disconnected', latency: null, apiKeyConfigured: false },
];


/* ── 10. PCR_HISTORY ─────────────────────────────────────── */

function buildPCRHistory() {
  const points = [];
  let pcr   = 0.95;
  let price  = 24500;
  const now  = Date.now();
  const step = 5 * 60 * 1000; // 5-minute intervals

  for (let i = 49; i >= 0; i--) {
    pcr   += normalRandom() * 0.03;
    pcr    = Math.max(0.7, Math.min(1.3, pcr));
    price += normalRandom() * 25;

    points.push({
      time:       now - i * step,
      pcr:        round2(pcr),
      niftyPrice: round2(price),
    });
  }

  return points;
}

export const PCR_HISTORY = buildPCRHistory();


/* ── 11. MAX_PAIN_DATA ───────────────────────────────────── */

function buildMaxPainData() {
  const maxPainStrike = 24500;
  const atmIndex      = 10; // center of 21 strikes
  const strikeStep    = 50;
  const strikesArr    = [];

  // Generate OI with realistic distribution: calls peak OI above ATM, puts below ATM
  for (let i = 0; i < 21; i++) {
    const strike = maxPainStrike + (i - atmIndex) * strikeStep;
    const distFromATM = Math.abs(i - atmIndex);

    // Call OI peaks at OTM (higher strikes), Put OI peaks at OTM (lower strikes)
    const callOI = Math.round(
      (i >= atmIndex ? rand(2_000_000, 8_000_000) : rand(500_000, 3_000_000)) * Math.exp(-distFromATM * 0.05)
    );
    const putOI = Math.round(
      (i <= atmIndex ? rand(2_000_000, 8_000_000) : rand(500_000, 3_000_000)) * Math.exp(-distFromATM * 0.05)
    );

    strikesArr.push({ strike, callOI, putOI, callPain: 0, putPain: 0, totalPain: 0 });
  }

  // Compute pain at each strike: if underlying expires here, how much do option writers lose?
  for (const target of strikesArr) {
    let callPain = 0;
    let putPain  = 0;

    for (const s of strikesArr) {
      // Call holders gain if target.strike > s.strike
      if (target.strike > s.strike) {
        callPain += s.callOI * (target.strike - s.strike);
      }
      // Put holders gain if target.strike < s.strike
      if (target.strike < s.strike) {
        putPain += s.putOI * (s.strike - target.strike);
      }
    }

    target.callPain  = callPain;
    target.putPain   = putPain;
    target.totalPain = callPain + putPain;
  }

  return { maxPainStrike, strikes: strikesArr };
}

export const MAX_PAIN_DATA = buildMaxPainData();
