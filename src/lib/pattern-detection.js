// ─────────────────────────────────────────────────────────────────────────────
// TOZY.AI — Chart Pattern Detection Library
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Detect local peaks and troughs in a price series using a rolling window.
 * For each index i (windowSize <= i < length − windowSize):
 *   - Peak   if prices[i] >= all prices in [i−w … i+w]
 *   - Trough if prices[i] <= all prices in [i−w … i+w]
 *
 * @param {number[]} prices     Array of prices (typically close prices)
 * @param {number}   windowSize Half-window width (default 5)
 * @returns {{ peaks: Array<{index, price}>, troughs: Array<{index, price}> }}
 */
export function findPeaksTroughs(prices, windowSize = 5) {
  const peaks = [];
  const troughs = [];

  if (!prices || prices.length < windowSize * 2 + 1) {
    return { peaks, troughs };
  }

  for (let i = windowSize; i < prices.length - windowSize; i++) {
    let isPeak = true;
    let isTrough = true;

    for (let j = i - windowSize; j <= i + windowSize; j++) {
      if (j === i) continue;
      if (prices[j] > prices[i]) isPeak = false;
      if (prices[j] < prices[i]) isTrough = false;
      if (!isPeak && !isTrough) break;
    }

    if (isPeak) peaks.push({ index: i, price: prices[i] });
    if (isTrough) troughs.push({ index: i, price: prices[i] });
  }

  return { peaks, troughs };
}

/**
 * ZigZag indicator — identifies significant reversals exceeding a threshold.
 * Tracks direction from the first price point; when price moves `threshold`%
 * from the last confirmed pivot in the opposite direction, the pivot is recorded
 * and the direction switches.
 *
 * @param {number[]} prices     Array of prices
 * @param {number}   threshold  Minimum % reversal to trigger a new pivot (default 5.0)
 * @returns {Array<{index: number, price: number, type: 'peak'|'trough'}>}
 */
export function zigzag(prices, threshold = 5.0) {
  if (!prices || prices.length < 2) return [];

  const result = [];
  const thresholdFrac = threshold / 100.0;

  let lastPivotIndex = 0;
  let lastPivotPrice = prices[0];
  // 1 = looking for peak (trending up), -1 = looking for trough (trending down)
  let direction = 0;

  // Determine initial direction from first two distinct prices
  for (let i = 1; i < prices.length; i++) {
    if (prices[i] > prices[0]) {
      direction = 1;
      break;
    } else if (prices[i] < prices[0]) {
      direction = -1;
      break;
    }
  }
  if (direction === 0) direction = 1; // flat → assume up

  let currentExtreme = lastPivotPrice;
  let currentExtremeIndex = 0;

  for (let i = 1; i < prices.length; i++) {
    if (direction === 1) {
      // Trending up — tracking the running high
      if (prices[i] > currentExtreme) {
        currentExtreme = prices[i];
        currentExtremeIndex = i;
      }
      // Check for reversal from the running high
      const drop = (currentExtreme - prices[i]) / currentExtreme;
      if (drop >= thresholdFrac) {
        // Confirm the running high as a peak
        result.push({
          index: currentExtremeIndex,
          price: currentExtreme,
          type: 'peak',
        });
        lastPivotIndex = currentExtremeIndex;
        lastPivotPrice = currentExtreme;
        // Switch direction — now looking for a trough
        direction = -1;
        currentExtreme = prices[i];
        currentExtremeIndex = i;
      }
    } else {
      // Trending down — tracking the running low
      if (prices[i] < currentExtreme) {
        currentExtreme = prices[i];
        currentExtremeIndex = i;
      }
      // Check for reversal from the running low
      const rise =
        currentExtreme === 0
          ? 0
          : (prices[i] - currentExtreme) / currentExtreme;
      if (rise >= thresholdFrac) {
        // Confirm the running low as a trough
        result.push({
          index: currentExtremeIndex,
          price: currentExtreme,
          type: 'trough',
        });
        lastPivotIndex = currentExtremeIndex;
        lastPivotPrice = currentExtreme;
        // Switch direction — now looking for a peak
        direction = 1;
        currentExtreme = prices[i];
        currentExtremeIndex = i;
      }
    }
  }

  return result;
}

/**
 * Perpendicular distance from a point to a line segment.
 * @param {{ x: number, y: number }} point
 * @param {{ x: number, y: number }} lineStart
 * @param {{ x: number, y: number }} lineEnd
 * @returns {number}
 */
export function perpendicularDistance(point, lineStart, lineEnd) {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const lineLen = Math.sqrt(dx * dx + dy * dy);

  if (lineLen === 0) {
    // Degenerate: line is a point
    const pdx = point.x - lineStart.x;
    const pdy = point.y - lineStart.y;
    return Math.sqrt(pdx * pdx + pdy * pdy);
  }

  // |cross product| / |line length|
  const numerator = Math.abs(
    dy * point.x - dx * point.y + lineEnd.x * lineStart.y - lineEnd.y * lineStart.x
  );
  return numerator / lineLen;
}

/**
 * Find Perceptually Important Points (PIPs) using iterative subdivision.
 * Starts with the first and last point. Iteratively finds the intermediate
 * point with the greatest perpendicular distance from its enclosing segment
 * and adds it if the distance exceeds minDistance% of the price range.
 *
 * @param {number[]} prices       Array of prices
 * @param {number}   maxPoints    Maximum number of PIPs to return (default 10)
 * @param {number}   minDistance   Minimum distance as % of total price range (default 0.5)
 * @returns {Array<{index: number, price: number}>}
 */
export function findPIPs(prices, maxPoints = 10, minDistance = 0.5) {
  if (!prices || prices.length === 0) return [];
  if (prices.length === 1) return [{ index: 0, price: prices[0] }];
  if (prices.length === 2) {
    return [
      { index: 0, price: prices[0] },
      { index: prices.length - 1, price: prices[prices.length - 1] },
    ];
  }

  // Compute price range for threshold
  let minPrice = Infinity;
  let maxPrice = -Infinity;
  for (let i = 0; i < prices.length; i++) {
    if (prices[i] < minPrice) minPrice = prices[i];
    if (prices[i] > maxPrice) maxPrice = prices[i];
  }
  const priceRange = maxPrice - minPrice;
  const minDist = (minDistance / 100.0) * priceRange;

  // Start with endpoints
  const pips = [
    { index: 0, price: prices[0] },
    { index: prices.length - 1, price: prices[prices.length - 1] },
  ];

  while (pips.length < maxPoints) {
    let bestDist = -1;
    let bestIndex = -1;
    let bestInsertPos = -1;

    // For each consecutive pair of retained points, find the max-distance intermediate
    for (let seg = 0; seg < pips.length - 1; seg++) {
      const segStart = pips[seg];
      const segEnd = pips[seg + 1];

      const lineStart = { x: segStart.index, y: segStart.price };
      const lineEnd = { x: segEnd.index, y: segEnd.price };

      for (let i = segStart.index + 1; i < segEnd.index; i++) {
        const dist = perpendicularDistance(
          { x: i, y: prices[i] },
          lineStart,
          lineEnd
        );
        if (dist > bestDist) {
          bestDist = dist;
          bestIndex = i;
          bestInsertPos = seg + 1;
        }
      }
    }

    // No more candidates or distance below threshold
    if (bestIndex === -1 || bestDist < minDist) break;

    // Insert the new PIP in sorted order
    pips.splice(bestInsertPos, 0, {
      index: bestIndex,
      price: prices[bestIndex],
    });
  }

  return pips;
}

// ─────────────────────────────────────────────────────────────────────────────
// Pattern Detection Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compute a simple linear regression slope for an array of {index, price} points.
 * Returns slope normalised to the average price level (dimensionless).
 */
function _slope(points) {
  if (points.length < 2) return 0;
  const n = points.length;
  let sumX = 0,
    sumY = 0,
    sumXY = 0,
    sumX2 = 0;
  for (const p of points) {
    sumX += p.index;
    sumY += p.price;
    sumXY += p.index * p.price;
    sumX2 += p.index * p.index;
  }
  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return 0;
  const rawSlope = (n * sumXY - sumX * sumY) / denom;
  const avgPrice = sumY / n;
  return avgPrice === 0 ? 0 : rawSlope / avgPrice;
}

/**
 * Check whether two values are within `pct`% of each other.
 */
function _within(a, b, pct) {
  const avg = (a + b) / 2;
  if (avg === 0) return a === b;
  return (Math.abs(a - b) / avg) * 100 <= pct;
}

/**
 * Compute confidence as a composite score.
 * Factors: symmetry, number of touches, time span.
 */
function _confidence(symmetryScore, touchCount, duration, dataLen) {
  // Symmetry: 0–1 (1 = perfect symmetry)
  const symWeight = 0.4;
  // Touches: normalised (more is better, cap at 6)
  const touchWeight = 0.3;
  const normTouch = Math.min(touchCount / 6, 1);
  // Duration: patterns spanning ≥10% of data are more significant
  const durWeight = 0.3;
  const normDur = Math.min(duration / (dataLen * 0.25), 1);

  return Math.round(
    (symWeight * symmetryScore + touchWeight * normTouch + durWeight * normDur) * 100
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Pattern Detection
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Detect chart patterns from OHLCV data.
 *
 * @param {Array<{time, open, high, low, close, volume}>} ohlcvData
 * @param {object} options  (reserved for future flags)
 * @returns {Array<{
 *   pattern: string,
 *   direction: 'bullish'|'bearish',
 *   confidence: number,
 *   startIndex: number,
 *   endIndex: number,
 *   targetPrice: number,
 *   pivots: Array<{index, price}>,
 *   neckline?: number
 * }>}
 */
export function detectPatterns(ohlcvData, options = {}) {
  if (!ohlcvData || ohlcvData.length < 20) return [];

  const closes = ohlcvData.map((d) => d.close);
  const { peaks, troughs } = findPeaksTroughs(closes, 5);
  const zzPivots = zigzag(closes, 3);
  const patterns = [];

  // Merge peaks + troughs into a chronological pivot stream
  const allPivots = [];
  for (const p of peaks) allPivots.push({ ...p, type: 'peak' });
  for (const t of troughs) allPivots.push({ ...t, type: 'trough' });
  allPivots.sort((a, b) => a.index - b.index);

  // ── Double Top ─────────────────────────────────────────────────────────
  for (let i = 0; i < peaks.length - 1; i++) {
    const p1 = peaks[i];
    const p2 = peaks[i + 1];
    if (!_within(p1.price, p2.price, 1.5)) continue;

    // Find the trough between the two peaks
    const betweenTroughs = troughs.filter(
      (t) => t.index > p1.index && t.index < p2.index
    );
    if (betweenTroughs.length === 0) continue;
    const neckline = Math.min(...betweenTroughs.map((t) => t.price));
    const peakAvg = (p1.price + p2.price) / 2;
    const target = neckline - (peakAvg - neckline);
    const symmetry = 1 - Math.abs(p1.price - p2.price) / peakAvg;
    const duration = p2.index - p1.index;

    patterns.push({
      pattern: 'Double Top',
      direction: 'bearish',
      confidence: _confidence(symmetry, 3, duration, closes.length),
      startIndex: p1.index,
      endIndex: p2.index,
      targetPrice: target,
      pivots: [p1, betweenTroughs[0], p2],
      neckline,
    });
  }

  // ── Double Bottom ──────────────────────────────────────────────────────
  for (let i = 0; i < troughs.length - 1; i++) {
    const t1 = troughs[i];
    const t2 = troughs[i + 1];
    if (!_within(t1.price, t2.price, 1.5)) continue;

    const betweenPeaks = peaks.filter(
      (p) => p.index > t1.index && p.index < t2.index
    );
    if (betweenPeaks.length === 0) continue;
    const neckline = Math.max(...betweenPeaks.map((p) => p.price));
    const troughAvg = (t1.price + t2.price) / 2;
    const target = neckline + (neckline - troughAvg);
    const symmetry = 1 - Math.abs(t1.price - t2.price) / troughAvg;
    const duration = t2.index - t1.index;

    patterns.push({
      pattern: 'Double Bottom',
      direction: 'bullish',
      confidence: _confidence(symmetry, 3, duration, closes.length),
      startIndex: t1.index,
      endIndex: t2.index,
      targetPrice: target,
      pivots: [t1, betweenPeaks[0], t2],
      neckline,
    });
  }

  // ── Head & Shoulders ───────────────────────────────────────────────────
  for (let i = 0; i < peaks.length - 2; i++) {
    const left = peaks[i];
    const head = peaks[i + 1];
    const right = peaks[i + 2];

    // Head must be the highest; shoulders within 5% of each other
    if (head.price <= left.price || head.price <= right.price) continue;
    if (!_within(left.price, right.price, 5)) continue;

    // Find troughs between shoulders and head
    const leftTrough = troughs.find(
      (t) => t.index > left.index && t.index < head.index
    );
    const rightTrough = troughs.find(
      (t) => t.index > head.index && t.index < right.index
    );
    if (!leftTrough || !rightTrough) continue;

    const neckline = (leftTrough.price + rightTrough.price) / 2;
    const target = neckline - (head.price - neckline);
    const shoulderSym =
      1 - Math.abs(left.price - right.price) / ((left.price + right.price) / 2);
    const troughSym =
      1 -
      Math.abs(leftTrough.price - rightTrough.price) /
        ((leftTrough.price + rightTrough.price) / 2);
    const symmetry = (shoulderSym + troughSym) / 2;
    const duration = right.index - left.index;

    patterns.push({
      pattern: 'Head & Shoulders',
      direction: 'bearish',
      confidence: _confidence(symmetry, 5, duration, closes.length),
      startIndex: left.index,
      endIndex: right.index,
      targetPrice: target,
      pivots: [left, leftTrough, head, rightTrough, right],
      neckline,
    });
  }

  // ── Inverse Head & Shoulders ───────────────────────────────────────────
  for (let i = 0; i < troughs.length - 2; i++) {
    const left = troughs[i];
    const head = troughs[i + 1];
    const right = troughs[i + 2];

    if (head.price >= left.price || head.price >= right.price) continue;
    if (!_within(left.price, right.price, 5)) continue;

    const leftPeak = peaks.find(
      (p) => p.index > left.index && p.index < head.index
    );
    const rightPeak = peaks.find(
      (p) => p.index > head.index && p.index < right.index
    );
    if (!leftPeak || !rightPeak) continue;

    const neckline = (leftPeak.price + rightPeak.price) / 2;
    const target = neckline + (neckline - head.price);
    const shoulderSym =
      1 - Math.abs(left.price - right.price) / ((left.price + right.price) / 2);
    const peakSym =
      1 -
      Math.abs(leftPeak.price - rightPeak.price) /
        ((leftPeak.price + rightPeak.price) / 2);
    const symmetry = (shoulderSym + peakSym) / 2;
    const duration = right.index - left.index;

    patterns.push({
      pattern: 'Inverse Head & Shoulders',
      direction: 'bullish',
      confidence: _confidence(symmetry, 5, duration, closes.length),
      startIndex: left.index,
      endIndex: right.index,
      targetPrice: target,
      pivots: [left, leftPeak, head, rightPeak, right],
      neckline,
    });
  }

  // ── Triangle Detection ─────────────────────────────────────────────────
  // Requires at least 2 peaks and 2 troughs within a window
  const windowSize = Math.min(50, Math.floor(closes.length * 0.4));
  for (let start = 0; start + windowSize <= closes.length; start += Math.floor(windowSize / 2)) {
    const end = start + windowSize;
    const wPeaks = peaks.filter((p) => p.index >= start && p.index < end);
    const wTroughs = troughs.filter((t) => t.index >= start && t.index < end);

    if (wPeaks.length < 2 || wTroughs.length < 2) continue;

    const peakSlope = _slope(wPeaks);
    const troughSlope = _slope(wTroughs);

    const FLAT_THRESHOLD = 0.0002;
    const SLOPE_THRESHOLD = 0.0003;

    let triangleType = null;
    let direction = null;

    if (
      troughSlope > SLOPE_THRESHOLD &&
      Math.abs(peakSlope) < FLAT_THRESHOLD
    ) {
      // Ascending Triangle: troughs rising, peaks flat
      triangleType = 'Ascending Triangle';
      direction = 'bullish';
    } else if (
      peakSlope < -SLOPE_THRESHOLD &&
      Math.abs(troughSlope) < FLAT_THRESHOLD
    ) {
      // Descending Triangle: peaks falling, troughs flat
      triangleType = 'Descending Triangle';
      direction = 'bearish';
    } else if (
      peakSlope < -SLOPE_THRESHOLD &&
      troughSlope > SLOPE_THRESHOLD
    ) {
      // Symmetrical Triangle: converging
      // Direction = trend before pattern
      const preTrend =
        start > 0 ? closes[start] - closes[Math.max(0, start - 10)] : 0;
      triangleType = 'Symmetrical Triangle';
      direction = preTrend >= 0 ? 'bullish' : 'bearish';
    }

    if (triangleType) {
      const allPrices = [...wPeaks, ...wTroughs].map((p) => p.price);
      const height = Math.max(...allPrices) - Math.min(...allPrices);
      const lastClose = closes[end - 1];
      const target =
        direction === 'bullish' ? lastClose + height : lastClose - height;

      // Symmetry based on how well the lines converge or hold
      const convergence = 1 - Math.abs(Math.abs(peakSlope) - Math.abs(troughSlope)) /
        (Math.max(Math.abs(peakSlope), Math.abs(troughSlope)) || 1);

      patterns.push({
        pattern: triangleType,
        direction,
        confidence: _confidence(
          convergence,
          wPeaks.length + wTroughs.length,
          end - start,
          closes.length
        ),
        startIndex: start,
        endIndex: end - 1,
        targetPrice: target,
        pivots: [...wPeaks, ...wTroughs].sort((a, b) => a.index - b.index),
      });
    }
  }

  // ── Cup & Handle ───────────────────────────────────────────────────────
  // Look for U-shaped trough formations (at least 5 troughs forming a curve)
  // followed by a small pullback.
  if (troughs.length >= 5) {
    for (let i = 0; i <= troughs.length - 5; i++) {
      const cupTroughs = troughs.slice(i, i + 5);

      // Check for U-shape: prices should descend then ascend
      const mid = Math.floor(cupTroughs.length / 2);
      let isDescending = true;
      let isAscending = true;

      for (let j = 1; j <= mid; j++) {
        if (cupTroughs[j].price > cupTroughs[j - 1].price) isDescending = false;
      }
      for (let j = mid + 1; j < cupTroughs.length; j++) {
        if (cupTroughs[j].price < cupTroughs[j - 1].price) isAscending = false;
      }

      if (!isDescending || !isAscending) continue;

      // Check that the "cup" has roughly symmetric rims (first and last trough roughly equal)
      const rimSymmetry = _within(
        cupTroughs[0].price,
        cupTroughs[cupTroughs.length - 1].price,
        8
      );
      if (!rimSymmetry) continue;

      // Look for "handle" — a small pullback after the cup
      const cupEnd = cupTroughs[cupTroughs.length - 1].index;
      const handleTroughs = troughs.filter(
        (t) => t.index > cupEnd && t.index < cupEnd + 20
      );

      // Handle should exist and be a minor pullback (not deeper than the cup bottom)
      const cupBottom = cupTroughs[mid].price;
      const cupRim = Math.max(cupTroughs[0].price, cupTroughs[cupTroughs.length - 1].price);

      if (handleTroughs.length > 0) {
        const handleBottom = Math.min(...handleTroughs.map((h) => h.price));
        if (handleBottom < cupBottom) continue; // handle deeper than cup — invalid

        const target = cupRim + (cupRim - cupBottom);
        const rimAvg = (cupTroughs[0].price + cupTroughs[cupTroughs.length - 1].price) / 2;
        const sym = 1 - Math.abs(cupTroughs[0].price - cupTroughs[cupTroughs.length - 1].price) / rimAvg;
        const duration = (handleTroughs[handleTroughs.length - 1]?.index || cupEnd) - cupTroughs[0].index;

        patterns.push({
          pattern: 'Cup & Handle',
          direction: 'bullish',
          confidence: _confidence(
            sym,
            cupTroughs.length + handleTroughs.length,
            duration,
            closes.length
          ),
          startIndex: cupTroughs[0].index,
          endIndex: handleTroughs.length > 0
            ? handleTroughs[handleTroughs.length - 1].index
            : cupEnd,
          targetPrice: target,
          pivots: [...cupTroughs, ...handleTroughs].sort(
            (a, b) => a.index - b.index
          ),
        });
      }
    }
  }

  // Sort by confidence descending
  patterns.sort((a, b) => b.confidence - a.confidence);

  return patterns;
}
