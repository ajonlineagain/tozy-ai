// ─────────────────────────────────────────────────────────────────────────────
// TOZY.AI — Black-Scholes Options Pricing Engine
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Standard normal cumulative distribution function.
 * Uses the Abramowitz & Stegun rational approximation (formula 26.2.17),
 * accurate to ~7 decimal places.
 * @param {number} x
 * @returns {number}
 */
export function normalCDF(x) {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x);

  const t = 1.0 / (1.0 + p * absX);
  const t2 = t * t;
  const t3 = t2 * t;
  const t4 = t3 * t;
  const t5 = t4 * t;

  const y =
    1.0 -
    (a1 * t + a2 * t2 + a3 * t3 + a4 * t4 + a5 * t5) *
      Math.exp(-absX * absX / 2.0);

  return 0.5 * (1.0 + sign * y);
}

/**
 * Standard normal probability density function.
 * @param {number} x
 * @returns {number}
 */
export function normalPDF(x) {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2.0 * Math.PI);
}

/**
 * Black-Scholes d1.
 * d1 = [ln(S/K) + (r + σ²/2)·T] / (σ·√T)
 * @param {number} S     Spot price
 * @param {number} K     Strike price
 * @param {number} T     Time to expiry (years)
 * @param {number} r     Risk-free rate (annualized, decimal)
 * @param {number} sigma Volatility (annualized, decimal)
 * @returns {number}
 */
export function d1(S, K, T, r, sigma) {
  const sqrtT = Math.sqrt(T);
  return (Math.log(S / K) + (r + (sigma * sigma) / 2.0) * T) / (sigma * sqrtT);
}

/**
 * Black-Scholes d2.
 * d2 = d1 - σ·√T
 * @param {number} S
 * @param {number} K
 * @param {number} T
 * @param {number} r
 * @param {number} sigma
 * @returns {number}
 */
export function d2(S, K, T, r, sigma) {
  return d1(S, K, T, r, sigma) - sigma * Math.sqrt(T);
}

/**
 * Black-Scholes option price.
 *   Call = S·N(d1) - K·e^(-rT)·N(d2)
 *   Put  = K·e^(-rT)·N(-d2) - S·N(-d1)
 * @param {number} S     Spot price
 * @param {number} K     Strike price
 * @param {number} T     Time to expiry (years)
 * @param {number} r     Risk-free rate
 * @param {number} sigma Volatility
 * @param {string} type  'call' | 'put'
 * @returns {number}
 */
export function blackScholesPrice(S, K, T, r, sigma, type) {
  if (T <= 0) {
    // At or past expiry — intrinsic value only
    if (type === 'call') return Math.max(0, S - K);
    return Math.max(0, K - S);
  }
  if (sigma <= 0) {
    // Zero vol — deterministic
    const pv = K * Math.exp(-r * T);
    if (type === 'call') return Math.max(0, S - pv);
    return Math.max(0, pv - S);
  }

  const d1Val = d1(S, K, T, r, sigma);
  const d2Val = d1Val - sigma * Math.sqrt(T);
  const discount = Math.exp(-r * T);

  if (type === 'call') {
    return S * normalCDF(d1Val) - K * discount * normalCDF(d2Val);
  }
  // put
  return K * discount * normalCDF(-d2Val) - S * normalCDF(-d1Val);
}

/**
 * Option Greeks (analytical closed-form).
 * @param {number} S     Spot price
 * @param {number} K     Strike price
 * @param {number} T     Time to expiry (years)
 * @param {number} r     Risk-free rate
 * @param {number} sigma Volatility
 * @param {string} type  'call' | 'put'
 * @returns {{ delta: number, gamma: number, vega: number, theta: number, rho: number }}
 */
export function greeks(S, K, T, r, sigma, type) {
  if (T <= 0 || sigma <= 0) {
    // Degenerate case — return zero greeks
    return { delta: 0, gamma: 0, vega: 0, theta: 0, rho: 0 };
  }

  const sqrtT = Math.sqrt(T);
  const d1Val = d1(S, K, T, r, sigma);
  const d2Val = d1Val - sigma * sqrtT;
  const nd1 = normalPDF(d1Val);
  const discount = Math.exp(-r * T);

  // Gamma (same for calls and puts)
  const gamma = nd1 / (S * sigma * sqrtT);

  // Vega (same for calls and puts, per 1% vol change)
  const vega = (S * nd1 * sqrtT) / 100.0;

  let delta, theta, rho;

  if (type === 'call') {
    delta = normalCDF(d1Val);
    theta =
      ((-S * nd1 * sigma) / (2.0 * sqrtT) -
        r * K * discount * normalCDF(d2Val)) /
      365.0;
    rho = (K * T * discount * normalCDF(d2Val)) / 100.0;
  } else {
    // put
    delta = normalCDF(d1Val) - 1.0;
    theta =
      ((-S * nd1 * sigma) / (2.0 * sqrtT) +
        r * K * discount * normalCDF(-d2Val)) /
      365.0;
    rho = (-K * T * discount * normalCDF(-d2Val)) / 100.0;
  }

  return { delta, gamma, vega, theta, rho };
}

/**
 * Implied volatility via Newton-Raphson iteration.
 * @param {number} marketPrice  Observed option price
 * @param {number} S            Spot price
 * @param {number} K            Strike price
 * @param {number} T            Time to expiry (years)
 * @param {number} r            Risk-free rate
 * @param {string} type         'call' | 'put'
 * @param {number} precision    Convergence threshold (default 0.0001)
 * @returns {number}  Implied vol (decimal), or NaN if no convergence
 */
export function impliedVolatility(
  marketPrice,
  S,
  K,
  T,
  r,
  type,
  precision = 0.0001
) {
  if (T <= 0 || marketPrice <= 0) return NaN;

  let sigma = 0.3; // initial guess
  const maxIter = 100;

  for (let i = 0; i < maxIter; i++) {
    const price = blackScholesPrice(S, K, T, r, sigma, type);
    const diff = price - marketPrice;

    if (Math.abs(diff) < precision) return sigma;

    // Vega in natural units (not per-percent) for the Newton step
    const sqrtT = Math.sqrt(T);
    const d1Val = d1(S, K, T, r, sigma);
    const vegaRaw = S * normalPDF(d1Val) * sqrtT;

    if (vegaRaw < 1e-12) return NaN; // vega ≈ 0 → can't iterate

    sigma -= diff / vegaRaw;

    // Guard against negative / runaway sigma
    if (sigma <= 0) sigma = 0.001;
    if (sigma > 10) return NaN;
  }

  return NaN; // did not converge
}

/**
 * Max Pain calculation.
 * For each candidate expiry price p (from the strikes array), compute
 * total pain = Σ_i [ callOI[i]·max(0, p − strike[i]) + putOI[i]·max(0, strike[i] − p) ].
 * The max-pain strike is the price that minimises total pain.
 *
 * @param {number[]} strikes   Array of strike prices
 * @param {number[]} callOI    Call open interest at each strike
 * @param {number[]} putOI     Put open interest at each strike
 * @returns {{ maxPainStrike: number, painByStrike: Array<{strike: number, pain: number}> }}
 */
export function maxPain(strikes, callOI, putOI) {
  if (
    !strikes ||
    strikes.length === 0 ||
    strikes.length !== callOI.length ||
    strikes.length !== putOI.length
  ) {
    return { maxPainStrike: NaN, painByStrike: [] };
  }

  const painByStrike = [];
  let minPain = Infinity;
  let maxPainStrike = strikes[0];

  for (let p = 0; p < strikes.length; p++) {
    const expiryPrice = strikes[p];
    let totalPain = 0;

    for (let i = 0; i < strikes.length; i++) {
      // Call holders lose money if expiry > strike
      totalPain += callOI[i] * Math.max(0, expiryPrice - strikes[i]);
      // Put holders lose money if expiry < strike
      totalPain += putOI[i] * Math.max(0, strikes[i] - expiryPrice);
    }

    painByStrike.push({ strike: expiryPrice, pain: totalPain });

    if (totalPain < minPain) {
      minPain = totalPain;
      maxPainStrike = expiryPrice;
    }
  }

  return { maxPainStrike, painByStrike };
}

/**
 * Put/Call ratio.
 * @param {number} callVolume  Total call volume
 * @param {number} putVolume   Total put volume
 * @returns {number}
 */
export function putCallRatio(callVolume, putVolume) {
  if (!callVolume || callVolume === 0) return Infinity;
  return putVolume / callVolume;
}
