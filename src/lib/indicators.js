// ─────────────────────────────────────────────────────────────────────────────
// TOZY.AI — Technical Indicators Library
// All functions accept data = [{ time, open, high, low, close, volume }, ...]
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Simple Moving Average of close prices.
 * @param {Array} data  OHLCV array
 * @param {number} period  Lookback window
 * @returns {Array<{time, value}>}
 */
export function sma(data, period) {
  if (!data || data.length < period || period <= 0) return [];

  const result = [];
  let sum = 0;

  // Seed the running sum with the first `period` closes
  for (let i = 0; i < period; i++) {
    sum += data[i].close;
  }
  result.push({ time: data[period - 1].time, value: sum / period });

  // Slide the window
  for (let i = period; i < data.length; i++) {
    sum += data[i].close - data[i - period].close;
    result.push({ time: data[i].time, value: sum / period });
  }

  return result;
}

/**
 * Exponential Moving Average of close prices.
 * First value is the SMA of the first `period` closes; subsequent values use
 * the standard EMA formula with multiplier k = 2 / (period + 1).
 * @param {Array} data  OHLCV array
 * @param {number} period  Lookback window
 * @returns {Array<{time, value}>}
 */
export function ema(data, period) {
  if (!data || data.length < period || period <= 0) return [];

  const k = 2 / (period + 1);
  const result = [];

  // Seed: SMA of first `period` closes
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i].close;
  }
  let prevEma = sum / period;
  result.push({ time: data[period - 1].time, value: prevEma });

  // EMA from period onward
  for (let i = period; i < data.length; i++) {
    prevEma = data[i].close * k + prevEma * (1 - k);
    result.push({ time: data[i].time, value: prevEma });
  }

  return result;
}

/**
 * Bollinger Bands (middle = SMA, upper/lower = middle ± stdDev × σ).
 * @param {Array}  data     OHLCV array
 * @param {number} period   SMA period (default 20)
 * @param {number} stdDev   Standard-deviation multiplier (default 2)
 * @returns {Array<{time, upper, middle, lower}>}
 */
export function bollingerBands(data, period = 20, stdDev = 2) {
  if (!data || data.length < period || period <= 0) return [];

  const result = [];

  for (let i = period - 1; i < data.length; i++) {
    // Compute SMA over the window ending at i
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sum += data[j].close;
    }
    const mid = sum / period;

    // Compute population standard deviation over the same window
    let sqSum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const diff = data[j].close - mid;
      sqSum += diff * diff;
    }
    const sigma = Math.sqrt(sqSum / period);

    result.push({
      time: data[i].time,
      upper: mid + stdDev * sigma,
      middle: mid,
      lower: mid - stdDev * sigma,
    });
  }

  return result;
}

/**
 * Relative Strength Index (Wilder's smoothing method).
 * @param {Array}  data    OHLCV array
 * @param {number} period  RSI period (default 14)
 * @returns {Array<{time, value}>}  Values in [0, 100]
 */
export function rsi(data, period = 14) {
  if (!data || data.length < period + 1 || period <= 0) return [];

  const result = [];

  // Calculate initial average gain / loss over the first `period` changes
  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const change = data[i].close - data[i - 1].close;
    if (change > 0) avgGain += change;
    else avgLoss += Math.abs(change);
  }
  avgGain /= period;
  avgLoss /= period;

  // First RSI value
  const rs0 = avgLoss === 0 ? Infinity : avgGain / avgLoss;
  result.push({
    time: data[period].time,
    value: avgLoss === 0 ? 100 : 100 - 100 / (1 + rs0),
  });

  // Wilder's smoothing for subsequent values
  for (let i = period + 1; i < data.length; i++) {
    const change = data[i].close - data[i - 1].close;
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    const rs = avgLoss === 0 ? Infinity : avgGain / avgLoss;
    result.push({
      time: data[i].time,
      value: avgLoss === 0 ? 100 : 100 - 100 / (1 + rs),
    });
  }

  return result;
}

/**
 * MACD (Moving Average Convergence Divergence).
 * @param {Array}  data    OHLCV array
 * @param {number} fast    Fast EMA period (default 12)
 * @param {number} slow    Slow EMA period (default 26)
 * @param {number} signal  Signal EMA period (default 9)
 * @returns {Array<{time, macd, signal, histogram}>}
 */
export function macd(data, fast = 12, slow = 26, signal = 9) {
  if (!data || data.length < slow || fast <= 0 || slow <= 0 || signal <= 0) {
    return [];
  }

  const fastEma = ema(data, fast);
  const slowEma = ema(data, slow);

  // Align: both EMA arrays have different start offsets.
  // fastEma starts at index (fast-1), slowEma starts at index (slow-1).
  // The MACD line begins where slowEma begins.
  const fastOffset = slow - fast; // how many slowEma entries are ahead

  const macdLine = [];
  for (let i = 0; i < slowEma.length; i++) {
    const fastVal = fastEma[i + fastOffset];
    const slowVal = slowEma[i];
    macdLine.push({
      time: slowVal.time,
      value: fastVal.value - slowVal.value,
    });
  }

  if (macdLine.length < signal) return [];

  // Signal line = EMA of the MACD values
  const kSig = 2 / (signal + 1);
  let sigSum = 0;
  for (let i = 0; i < signal; i++) {
    sigSum += macdLine[i].value;
  }
  let sigEma = sigSum / signal;

  const result = [];
  result.push({
    time: macdLine[signal - 1].time,
    macd: macdLine[signal - 1].value,
    signal: sigEma,
    histogram: macdLine[signal - 1].value - sigEma,
  });

  for (let i = signal; i < macdLine.length; i++) {
    sigEma = macdLine[i].value * kSig + sigEma * (1 - kSig);
    result.push({
      time: macdLine[i].time,
      macd: macdLine[i].value,
      signal: sigEma,
      histogram: macdLine[i].value - sigEma,
    });
  }

  return result;
}

/**
 * Volume-Weighted Average Price.
 * Cumulative (typical price × volume) / cumulative volume.
 * @param {Array} data  OHLCV array
 * @returns {Array<{time, value}>}
 */
export function vwap(data) {
  if (!data || data.length === 0) return [];

  const result = [];
  let cumTPV = 0; // cumulative (typical price × volume)
  let cumVol = 0; // cumulative volume

  for (let i = 0; i < data.length; i++) {
    const tp = (data[i].high + data[i].low + data[i].close) / 3;
    cumTPV += tp * data[i].volume;
    cumVol += data[i].volume;

    result.push({
      time: data[i].time,
      value: cumVol === 0 ? 0 : cumTPV / cumVol,
    });
  }

  return result;
}

/**
 * Average True Range (Wilder's smoothing).
 * @param {Array}  data    OHLCV array
 * @param {number} period  ATR period (default 14)
 * @returns {Array<{time, value}>}
 */
export function atr(data, period = 14) {
  if (!data || data.length < period + 1 || period <= 0) return [];

  const result = [];

  // True Range calculation helper
  const trueRange = (i) => {
    const high = data[i].high;
    const low = data[i].low;
    const prevClose = data[i - 1].close;
    return Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
  };

  // First ATR = simple average of the first `period` true ranges
  let atrVal = 0;
  for (let i = 1; i <= period; i++) {
    atrVal += trueRange(i);
  }
  atrVal /= period;
  result.push({ time: data[period].time, value: atrVal });

  // Wilder's smoothing for subsequent values
  for (let i = period + 1; i < data.length; i++) {
    atrVal = (atrVal * (period - 1) + trueRange(i)) / period;
    result.push({ time: data[i].time, value: atrVal });
  }

  return result;
}

/**
 * Heikin-Ashi candlestick transformation.
 *   HA Close = (O + H + L + C) / 4
 *   HA Open  = (prev HA Open + prev HA Close) / 2   (first bar: (O + C) / 2)
 *   HA High  = max(H, HA Open, HA Close)
 *   HA Low   = min(L, HA Open, HA Close)
 * @param {Array} data  OHLCV array
 * @returns {Array<{time, open, high, low, close}>}
 */
export function heikinAshi(data) {
  if (!data || data.length === 0) return [];

  const result = [];

  // First bar
  const haClose0 = (data[0].open + data[0].high + data[0].low + data[0].close) / 4;
  const haOpen0 = (data[0].open + data[0].close) / 2;
  const haHigh0 = Math.max(data[0].high, haOpen0, haClose0);
  const haLow0 = Math.min(data[0].low, haOpen0, haClose0);

  result.push({
    time: data[0].time,
    open: haOpen0,
    high: haHigh0,
    low: haLow0,
    close: haClose0,
  });

  // Subsequent bars
  for (let i = 1; i < data.length; i++) {
    const prev = result[i - 1];
    const haClose = (data[i].open + data[i].high + data[i].low + data[i].close) / 4;
    const haOpen = (prev.open + prev.close) / 2;
    const haHigh = Math.max(data[i].high, haOpen, haClose);
    const haLow = Math.min(data[i].low, haOpen, haClose);

    result.push({
      time: data[i].time,
      open: haOpen,
      high: haHigh,
      low: haLow,
      close: haClose,
    });
  }

  return result;
}
