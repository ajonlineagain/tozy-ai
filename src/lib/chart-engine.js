// ─────────────────────────────────────────────────────────────────────────────
// TOZY.AI — Canvas-Based Charting Engine
// ─────────────────────────────────────────────────────────────────────────────

import { heikinAshi } from './indicators.js';

/**
 * High-performance canvas charting engine with cyberpunk aesthetics.
 * Supports candlestick, line, hollow, bar, and Heikin-Ashi chart types.
 */
export class ChartEngine {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {object} options
   */
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.dpr = window.devicePixelRatio || 1;

    // ── Default cyberpunk colour palette ──────────────────────────────────
    this.colors = {
      bg: options.bg || '#0B0F19',
      grid: options.grid || '#1F2937',
      bull: options.bull || '#10B981',
      bear: options.bear || '#EF4444',
      text: options.text || '#9CA3AF',
      crosshair: options.crosshair || '#6B7280',
      ...options.colors,
    };
    this.font = options.font || '11px Inter, sans-serif';
    this.monoFont = options.monoFont || '11px JetBrains Mono, monospace';

    // ── Layout constants ─────────────────────────────────────────────────
    this.rightAxisWidth = options.rightAxisWidth || 70;
    this.bottomAxisHeight = options.bottomAxisHeight || 24;
    this.volumeHeightRatio = options.volumeHeightRatio || 0.18;

    // ── State ────────────────────────────────────────────────────────────
    this.data = [];
    this.chartType = 'candle'; // 'candle'|'line'|'hollow'|'bar'|'heikinashi'
    this.visibleStart = 0;
    this.visibleEnd = 0;
    this.overlays = new Map(); // name → { data, color, lineWidth }
    this.crosshairPos = null; // { x, y } in CSS pixels
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartVisibleStart = 0;

    // ── Callbacks ────────────────────────────────────────────────────────
    this._onCrosshairMove = null;

    // ── Bound listener references (for removal in destroy) ───────────────
    this._listeners = {};

    // Apply HiDPI scaling and setup
    this._applyDPR();
    this.setupInteraction();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DATA
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Set the full OHLCV dataset and fit all bars into view.
   * @param {Array<{time, open, high, low, close, volume}>} ohlcvData
   */
  setData(ohlcvData) {
    this.data = ohlcvData || [];
    this.fitAll();
  }

  /**
   * Set chart type and re-render.
   * @param {'candle'|'line'|'hollow'|'bar'|'heikinashi'} type
   */
  setChartType(type) {
    this.chartType = type;
    this.render();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VIEWPORT
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Set visible range (clamped to valid bounds).
   * @param {number} start  Start index (inclusive)
   * @param {number} end    End index (exclusive)
   */
  setVisibleRange(start, end) {
    const minBars = 20;
    start = Math.max(0, Math.floor(start));
    end = Math.min(this.data.length, Math.ceil(end));
    if (end - start < minBars) {
      const mid = (start + end) / 2;
      start = Math.max(0, Math.floor(mid - minBars / 2));
      end = Math.min(this.data.length, start + minBars);
      if (end - start < minBars) start = Math.max(0, end - minBars);
    }
    this.visibleStart = start;
    this.visibleEnd = end;
    this.render();
  }

  /** Zoom in — reduce visible range by 20 %, centred. */
  zoomIn() {
    const range = this.visibleEnd - this.visibleStart;
    const shrink = Math.max(Math.round(range * 0.1), 1);
    this.setVisibleRange(this.visibleStart + shrink, this.visibleEnd - shrink);
  }

  /** Zoom out — increase visible range by 20 %, centred. */
  zoomOut() {
    const range = this.visibleEnd - this.visibleStart;
    const grow = Math.max(Math.round(range * 0.1), 1);
    this.setVisibleRange(this.visibleStart - grow, this.visibleEnd + grow);
  }

  /** Pan left by `bars` bars. */
  panLeft(bars = 10) {
    this.setVisibleRange(this.visibleStart - bars, this.visibleEnd - bars);
  }

  /** Pan right by `bars` bars. */
  panRight(bars = 10) {
    this.setVisibleRange(this.visibleStart + bars, this.visibleEnd + bars);
  }

  /** Fit all data into view. */
  fitAll() {
    this.visibleStart = 0;
    this.visibleEnd = this.data.length;
    this.render();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // COORDINATE TRANSFORMS
  // ═══════════════════════════════════════════════════════════════════════════

  /** Usable chart width (pixels, CSS-space). */
  get _chartWidth() {
    return this.canvas.clientWidth - this.rightAxisWidth;
  }

  /** Usable chart height (pixels, CSS-space). */
  get _chartHeight() {
    return this.canvas.clientHeight - this.bottomAxisHeight;
  }

  /** Height of the volume zone (pixels, CSS-space). */
  get _volumeHeight() {
    return this._chartHeight * this.volumeHeightRatio;
  }

  /** Width of a single bar slot (CSS px). */
  get _barSlotWidth() {
    const count = this.visibleEnd - this.visibleStart;
    return count > 0 ? this._chartWidth / count : 1;
  }

  /**
   * Map a price to canvas Y coordinate.
   * @param {number} price
   * @returns {number}
   */
  priceToY(price) {
    const { minPrice, maxPrice } = this._priceRange();
    const range = maxPrice - minPrice || 1;
    return ((maxPrice - price) / range) * (this._chartHeight - this._volumeHeight);
  }

  /**
   * Inverse: canvas Y coordinate to price.
   * @param {number} y
   * @returns {number}
   */
  yToPrice(y) {
    const { minPrice, maxPrice } = this._priceRange();
    const range = maxPrice - minPrice || 1;
    return maxPrice - (y / (this._chartHeight - this._volumeHeight)) * range;
  }

  /**
   * Map data index to canvas X centre of that bar.
   * @param {number} index
   * @returns {number}
   */
  indexToX(index) {
    const slot = this._barSlotWidth;
    return (index - this.visibleStart) * slot + slot / 2;
  }

  /**
   * Inverse: canvas X to nearest data index.
   * @param {number} x
   * @returns {number}
   */
  xToIndex(x) {
    const slot = this._barSlotWidth;
    return Math.round(x / slot - 0.5 + this.visibleStart);
  }

  /** Compute min/max price in visible range with 10 % padding. */
  _priceRange() {
    if (this.data.length === 0) return { minPrice: 0, maxPrice: 1 };

    let min = Infinity;
    let max = -Infinity;
    const start = Math.max(0, this.visibleStart);
    const end = Math.min(this.data.length, this.visibleEnd);

    for (let i = start; i < end; i++) {
      if (this.data[i].low < min) min = this.data[i].low;
      if (this.data[i].high > max) max = this.data[i].high;
    }

    if (min === Infinity) { min = 0; max = 1; }
    const pad = (max - min) * 0.1 || 0.5;
    return { minPrice: min - pad, maxPrice: max + pad };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDERING
  // ═══════════════════════════════════════════════════════════════════════════

  /** Main render loop. */
  render() {
    if (this.data.length === 0) return;
    const ctx = this.ctx;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;

    ctx.save();
    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = this.colors.bg;
    ctx.fillRect(0, 0, w, h);

    this.renderGrid();
    this.renderVolume();

    if (this.chartType === 'line') {
      this.renderLine();
    } else {
      this.renderCandles();
    }

    this.renderOverlays();

    if (this.crosshairPos) {
      this.renderCrosshair(this.crosshairPos.x, this.crosshairPos.y);
    }

    this.renderAxes();
    ctx.restore();
  }

  /** Horizontal price grid lines and vertical time grid lines. */
  renderGrid() {
    const ctx = this.ctx;
    const { minPrice, maxPrice } = this._priceRange();
    const chartH = this._chartHeight - this._volumeHeight;
    const chartW = this._chartWidth;

    ctx.save();
    ctx.strokeStyle = this.colors.grid;
    ctx.lineWidth = 0.5;
    ctx.setLineDash([4, 4]);

    // ── Horizontal price lines ───────────────────────────────────────────
    const priceRange = maxPrice - minPrice;
    const rawStep = priceRange / 6;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const niceFractions = [1, 2, 2.5, 5, 10];
    let step = magnitude;
    for (const f of niceFractions) {
      if (f * magnitude >= rawStep) { step = f * magnitude; break; }
    }

    const firstLine = Math.ceil(minPrice / step) * step;
    for (let price = firstLine; price <= maxPrice; price += step) {
      const y = this.priceToY(price);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(chartW, y);
      ctx.stroke();
    }

    // ── Vertical time lines ──────────────────────────────────────────────
    const visibleBars = this.visibleEnd - this.visibleStart;
    const timeStep = Math.max(1, Math.round(visibleBars / 8));
    for (let i = this.visibleStart; i < this.visibleEnd; i += timeStep) {
      const x = this.indexToX(i);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this._chartHeight);
      ctx.stroke();
    }

    ctx.restore();
  }

  /** Render candlesticks (also handles hollow, bar, heikinashi). */
  renderCandles() {
    const ctx = this.ctx;
    const slot = this._barSlotWidth;
    const bodyWidth = Math.max(1, slot * 0.7);
    const start = Math.max(0, this.visibleStart);
    const end = Math.min(this.data.length, this.visibleEnd);

    let renderData = this.data;
    if (this.chartType === 'heikinashi') {
      renderData = heikinAshi(this.data);
    }

    for (let i = start; i < end; i++) {
      const bar = renderData[i];
      if (!bar) continue;
      const bullish = bar.close >= bar.open;
      const color = bullish ? this.colors.bull : this.colors.bear;
      const x = this.indexToX(i);
      const yHigh = this.priceToY(bar.high);
      const yLow = this.priceToY(bar.low);
      const yOpen = this.priceToY(bar.open);
      const yClose = this.priceToY(bar.close);

      if (this.chartType === 'bar') {
        // ── OHLC bar ──────────────────────────────────────────────────
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.setLineDash([]);

        // Vertical high-low line
        ctx.beginPath();
        ctx.moveTo(x, yHigh);
        ctx.lineTo(x, yLow);
        ctx.stroke();

        // Open tick (left)
        ctx.beginPath();
        ctx.moveTo(x - bodyWidth / 2, yOpen);
        ctx.lineTo(x, yOpen);
        ctx.stroke();

        // Close tick (right)
        ctx.beginPath();
        ctx.moveTo(x, yClose);
        ctx.lineTo(x + bodyWidth / 2, yClose);
        ctx.stroke();
      } else {
        // ── Candlestick / Hollow / Heikin-Ashi ────────────────────────
        // Wick
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(x, yHigh);
        ctx.lineTo(x, yLow);
        ctx.stroke();

        // Body
        const bodyTop = Math.min(yOpen, yClose);
        const bodyH = Math.max(Math.abs(yClose - yOpen), 1);

        if (this.chartType === 'hollow' && bullish) {
          // Hollow candle: stroke-only for bullish
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.5;
          ctx.strokeRect(x - bodyWidth / 2, bodyTop, bodyWidth, bodyH);
        } else {
          // Filled body
          ctx.fillStyle = color;
          ctx.fillRect(x - bodyWidth / 2, bodyTop, bodyWidth, bodyH);
        }
      }
    }
  }

  /** Render a line chart with gradient fill. */
  renderLine() {
    const ctx = this.ctx;
    const start = Math.max(0, this.visibleStart);
    const end = Math.min(this.data.length, this.visibleEnd);
    if (end - start < 2) return;

    const chartH = this._chartHeight;

    // Build path
    ctx.save();
    ctx.beginPath();
    let firstX = 0;
    for (let i = start; i < end; i++) {
      const x = this.indexToX(i);
      const y = this.priceToY(this.data[i].close);
      if (i === start) {
        ctx.moveTo(x, y);
        firstX = x;
      } else {
        ctx.lineTo(x, y);
      }
    }

    // Stroke the line
    ctx.strokeStyle = this.colors.bull;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([]);
    ctx.stroke();

    // Gradient fill below
    const lastX = this.indexToX(end - 1);
    ctx.lineTo(lastX, chartH);
    ctx.lineTo(firstX, chartH);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(0, 0, 0, chartH);
    gradient.addColorStop(0, 'rgba(16, 185, 129, 0.25)');
    gradient.addColorStop(1, 'rgba(16, 185, 129, 0.01)');
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.restore();
  }

  /** Render volume bars in the bottom portion. */
  renderVolume() {
    const ctx = this.ctx;
    const start = Math.max(0, this.visibleStart);
    const end = Math.min(this.data.length, this.visibleEnd);
    if (end <= start) return;

    // Find max volume in visible range
    let maxVol = 0;
    for (let i = start; i < end; i++) {
      if (this.data[i].volume > maxVol) maxVol = this.data[i].volume;
    }
    if (maxVol === 0) return;

    const volZoneTop = this._chartHeight - this._volumeHeight;
    const volH = this._volumeHeight;
    const slot = this._barSlotWidth;
    const barW = Math.max(1, slot * 0.7);

    for (let i = start; i < end; i++) {
      const bar = this.data[i];
      const bullish = bar.close >= bar.open;
      const x = this.indexToX(i);
      const h = (bar.volume / maxVol) * volH;

      ctx.fillStyle = bullish
        ? 'rgba(16, 185, 129, 0.3)'
        : 'rgba(239, 68, 68, 0.3)';
      ctx.fillRect(x - barW / 2, volZoneTop + volH - h, barW, h);
    }
  }

  /** Render crosshair and data tooltip. */
  renderCrosshair(x, y) {
    const ctx = this.ctx;
    const chartW = this._chartWidth;
    const chartH = this._chartHeight;

    // Clamp to chart area
    if (x > chartW || y > chartH) return;

    ctx.save();
    ctx.strokeStyle = this.colors.crosshair;
    ctx.lineWidth = 0.5;
    ctx.setLineDash([3, 3]);

    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(chartW, y);
    ctx.stroke();

    // Vertical line
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, chartH);
    ctx.stroke();

    ctx.setLineDash([]);

    // ── Price label on right axis ────────────────────────────────────────
    const price = this.yToPrice(y);
    const labelText = price.toFixed(2);
    ctx.font = this.monoFont;
    const labelW = ctx.measureText(labelText).width + 12;
    const labelH = 18;
    const labelX = chartW;
    const labelY = y - labelH / 2;

    ctx.fillStyle = '#374151';
    ctx.fillRect(labelX, labelY, labelW, labelH);
    ctx.fillStyle = '#F9FAFB';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(labelText, labelX + 6, y);

    // ── Time label on bottom axis ────────────────────────────────────────
    const idx = this.xToIndex(x);
    if (idx >= 0 && idx < this.data.length) {
      const timeVal = this.data[idx].time;
      const timeStr =
        typeof timeVal === 'number'
          ? new Date(timeVal * 1000).toLocaleDateString()
          : String(timeVal);
      const timeLabelW = ctx.measureText(timeStr).width + 12;
      const timeLabelX = x - timeLabelW / 2;
      const timeLabelY = chartH;

      ctx.fillStyle = '#374151';
      ctx.fillRect(timeLabelX, timeLabelY, timeLabelW, this.bottomAxisHeight);
      ctx.fillStyle = '#F9FAFB';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(timeStr, x, timeLabelY + this.bottomAxisHeight / 2);

      // ── OHLCV data box (top-left) ──────────────────────────────────────
      const bar = this.data[idx];
      if (bar) {
        const lines = [
          `O ${bar.open.toFixed(2)}`,
          `H ${bar.high.toFixed(2)}`,
          `L ${bar.low.toFixed(2)}`,
          `C ${bar.close.toFixed(2)}`,
          `V ${this._formatVolume(bar.volume)}`,
        ];
        ctx.font = this.monoFont;
        const lineH = 16;
        const boxPadding = 8;
        let maxW = 0;
        for (const l of lines) {
          const w = ctx.measureText(l).width;
          if (w > maxW) maxW = w;
        }
        const boxW = maxW + boxPadding * 2;
        const boxH = lines.length * lineH + boxPadding * 2;

        ctx.fillStyle = 'rgba(17, 24, 39, 0.88)';
        ctx.fillRect(8, 8, boxW, boxH);
        ctx.strokeStyle = this.colors.grid;
        ctx.lineWidth = 1;
        ctx.strokeRect(8, 8, boxW, boxH);

        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        const bullish = bar.close >= bar.open;
        for (let li = 0; li < lines.length; li++) {
          const label = lines[li].substring(0, 2);
          const value = lines[li].substring(2);
          ctx.fillStyle = this.colors.text;
          ctx.fillText(label, 8 + boxPadding, 8 + boxPadding + li * lineH);
          ctx.fillStyle = bullish ? this.colors.bull : this.colors.bear;
          ctx.fillText(value, 8 + boxPadding + ctx.measureText(label).width, 8 + boxPadding + li * lineH);
        }
      }

      // Notify crosshair callback
      if (this._onCrosshairMove && idx >= 0 && idx < this.data.length) {
        this._onCrosshairMove({
          index: idx,
          bar: this.data[idx],
          price,
          x,
          y,
        });
      }
    }

    ctx.restore();
  }

  /** Render right-side price axis and bottom time axis. */
  renderAxes() {
    const ctx = this.ctx;
    const chartW = this._chartWidth;
    const chartH = this._chartHeight;
    const { minPrice, maxPrice } = this._priceRange();

    ctx.save();
    ctx.font = this.monoFont;
    ctx.fillStyle = this.colors.text;

    // ── Right axis: price labels ─────────────────────────────────────────
    const priceRange = maxPrice - minPrice;
    const rawStep = priceRange / 6;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const niceFractions = [1, 2, 2.5, 5, 10];
    let step = magnitude;
    for (const f of niceFractions) {
      if (f * magnitude >= rawStep) { step = f * magnitude; break; }
    }

    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const firstLine = Math.ceil(minPrice / step) * step;
    for (let price = firstLine; price <= maxPrice; price += step) {
      const y = this.priceToY(price);
      ctx.fillText(price.toFixed(2), chartW + 6, y);
    }

    // ── Bottom axis: time labels ─────────────────────────────────────────
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const visibleBars = this.visibleEnd - this.visibleStart;
    const timeStep = Math.max(1, Math.round(visibleBars / 8));
    for (let i = this.visibleStart; i < this.visibleEnd; i += timeStep) {
      if (i < 0 || i >= this.data.length) continue;
      const x = this.indexToX(i);
      const timeVal = this.data[i].time;
      const label =
        typeof timeVal === 'number'
          ? new Date(timeVal * 1000).toLocaleDateString('en-IN', {
              month: 'short',
              day: 'numeric',
            })
          : String(timeVal);
      ctx.fillText(label, x, chartH + 4);
    }

    // ── Axis separator lines ─────────────────────────────────────────────
    ctx.strokeStyle = this.colors.grid;
    ctx.lineWidth = 1;
    ctx.setLineDash([]);

    // Right border
    ctx.beginPath();
    ctx.moveTo(chartW, 0);
    ctx.lineTo(chartW, chartH);
    ctx.stroke();

    // Bottom border
    ctx.beginPath();
    ctx.moveTo(0, chartH);
    ctx.lineTo(chartW, chartH);
    ctx.stroke();

    ctx.restore();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // OVERLAYS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Add a named overlay line.
   * @param {string} name       Unique overlay identifier
   * @param {Array<{time, value}>} data  Overlay values
   * @param {string} color      CSS colour
   * @param {number} lineWidth  Width (default 1.5)
   */
  addOverlay(name, data, color, lineWidth = 1.5) {
    this.overlays.set(name, { data, color, lineWidth });
    this.render();
  }

  /** Remove a named overlay. */
  removeOverlay(name) {
    this.overlays.delete(name);
    this.render();
  }

  /** Clear all overlays. */
  clearOverlays() {
    this.overlays.clear();
    this.render();
  }

  /** Render all overlay lines on the chart. */
  renderOverlays() {
    const ctx = this.ctx;

    for (const [, overlay] of this.overlays) {
      const { data: oData, color, lineWidth } = overlay;
      if (!oData || oData.length === 0) continue;

      // Build a time → value map for quick lookup
      const timeMap = new Map();
      for (const pt of oData) {
        timeMap.set(pt.time, pt.value);
      }

      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.setLineDash([]);
      ctx.beginPath();

      let started = false;
      const start = Math.max(0, this.visibleStart);
      const end = Math.min(this.data.length, this.visibleEnd);

      for (let i = start; i < end; i++) {
        const val = timeMap.get(this.data[i].time);
        if (val === undefined) continue;

        const x = this.indexToX(i);
        const y = this.priceToY(val);

        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();
      ctx.restore();
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INTERACTION
  // ═══════════════════════════════════════════════════════════════════════════

  /** Set up mouse and touch event listeners. */
  setupInteraction() {
    const canvas = this.canvas;

    // ── Mouse ────────────────────────────────────────────────────────────
    this._listeners.mousemove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (this.isDragging) {
        const dx = x - this.dragStartX;
        const barsPerPx = (this.visibleEnd - this.visibleStart) / this._chartWidth;
        const barShift = Math.round(-dx * barsPerPx);
        const newStart = this.dragStartVisibleStart + barShift;
        const range = this.visibleEnd - this.visibleStart;
        this.setVisibleRange(newStart, newStart + range);
      } else {
        this.crosshairPos = { x, y };
        this.render();
      }
    };

    this._listeners.mousedown = (e) => {
      const rect = canvas.getBoundingClientRect();
      this.isDragging = true;
      this.dragStartX = e.clientX - rect.left;
      this.dragStartVisibleStart = this.visibleStart;
      canvas.style.cursor = 'grabbing';
    };

    this._listeners.mouseup = () => {
      this.isDragging = false;
      canvas.style.cursor = 'crosshair';
    };

    this._listeners.mouseleave = () => {
      this.crosshairPos = null;
      this.isDragging = false;
      canvas.style.cursor = 'crosshair';
      this.render();
    };

    this._listeners.wheel = (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const range = this.visibleEnd - this.visibleStart;
      const mouseFrac = mouseX / this._chartWidth;

      if (e.deltaY < 0) {
        // Zoom in
        const shrink = Math.max(Math.round(range * 0.1), 1);
        const leftShrink = Math.round(shrink * mouseFrac);
        const rightShrink = shrink - leftShrink;
        this.setVisibleRange(
          this.visibleStart + leftShrink,
          this.visibleEnd - rightShrink
        );
      } else {
        // Zoom out
        const grow = Math.max(Math.round(range * 0.1), 1);
        const leftGrow = Math.round(grow * mouseFrac);
        const rightGrow = grow - leftGrow;
        this.setVisibleRange(
          this.visibleStart - leftGrow,
          this.visibleEnd + rightGrow
        );
      }
    };

    canvas.addEventListener('mousemove', this._listeners.mousemove);
    canvas.addEventListener('mousedown', this._listeners.mousedown);
    canvas.addEventListener('mouseup', this._listeners.mouseup);
    canvas.addEventListener('mouseleave', this._listeners.mouseleave);
    canvas.addEventListener('wheel', this._listeners.wheel, { passive: false });

    // ── Touch ────────────────────────────────────────────────────────────
    let lastTouchX = 0;
    let touchStartRange = 0;
    let lastPinchDist = 0;

    this._listeners.touchstart = (e) => {
      if (e.touches.length === 1) {
        const rect = canvas.getBoundingClientRect();
        lastTouchX = e.touches[0].clientX - rect.left;
        this.dragStartVisibleStart = this.visibleStart;
        touchStartRange = this.visibleEnd - this.visibleStart;
      } else if (e.touches.length === 2) {
        const dx = e.touches[1].clientX - e.touches[0].clientX;
        const dy = e.touches[1].clientY - e.touches[0].clientY;
        lastPinchDist = Math.sqrt(dx * dx + dy * dy);
        touchStartRange = this.visibleEnd - this.visibleStart;
      }
      e.preventDefault();
    };

    this._listeners.touchmove = (e) => {
      if (e.touches.length === 1) {
        const rect = canvas.getBoundingClientRect();
        const x = e.touches[0].clientX - rect.left;
        const dx = x - lastTouchX;
        const barsPerPx = touchStartRange / this._chartWidth;
        const barShift = Math.round(-dx * barsPerPx);
        const newStart = this.dragStartVisibleStart + barShift;
        this.setVisibleRange(newStart, newStart + touchStartRange);

        // Also show crosshair on touch
        const y = e.touches[0].clientY - rect.top;
        this.crosshairPos = { x, y };
      } else if (e.touches.length === 2) {
        const dx = e.touches[1].clientX - e.touches[0].clientX;
        const dy = e.touches[1].clientY - e.touches[0].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const scale = lastPinchDist / dist;
        const newRange = Math.round(touchStartRange * scale);
        const mid = this.visibleStart + (this.visibleEnd - this.visibleStart) / 2;
        this.setVisibleRange(
          Math.round(mid - newRange / 2),
          Math.round(mid + newRange / 2)
        );
      }
      e.preventDefault();
    };

    this._listeners.touchend = (e) => {
      if (e.touches.length === 0) {
        this.crosshairPos = null;
        this.render();
      }
    };

    canvas.addEventListener('touchstart', this._listeners.touchstart, { passive: false });
    canvas.addEventListener('touchmove', this._listeners.touchmove, { passive: false });
    canvas.addEventListener('touchend', this._listeners.touchend);

    // Default cursor
    canvas.style.cursor = 'crosshair';
  }

  /**
   * Register a callback for crosshair movement.
   * @param {Function} callback  Receives { index, bar, price, x, y }
   */
  onCrosshairMove(callback) {
    this._onCrosshairMove = callback;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════════════════════

  /** Apply devicePixelRatio scaling for crisp HiDPI rendering. */
  _applyDPR() {
    const rect = this.canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    this.canvas.width = w * this.dpr;
    this.canvas.height = h * this.dpr;
    this.ctx.scale(this.dpr, this.dpr);

    // Keep the element's CSS dimensions the same
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
  }

  /** Format volume for display (e.g. 1.2M, 350K). */
  _formatVolume(vol) {
    if (vol >= 1e9) return (vol / 1e9).toFixed(1) + 'B';
    if (vol >= 1e7) return (vol / 1e7).toFixed(1) + 'Cr';
    if (vol >= 1e5) return (vol / 1e5).toFixed(1) + 'L';
    if (vol >= 1e3) return (vol / 1e3).toFixed(1) + 'K';
    return String(vol);
  }

  /** Resize the canvas to its parent container and re-render. */
  resize() {
    this._applyDPR();
    this.render();
  }

  /** Remove all event listeners and clean up. */
  destroy() {
    const canvas = this.canvas;
    if (this._listeners.mousemove)
      canvas.removeEventListener('mousemove', this._listeners.mousemove);
    if (this._listeners.mousedown)
      canvas.removeEventListener('mousedown', this._listeners.mousedown);
    if (this._listeners.mouseup)
      canvas.removeEventListener('mouseup', this._listeners.mouseup);
    if (this._listeners.mouseleave)
      canvas.removeEventListener('mouseleave', this._listeners.mouseleave);
    if (this._listeners.wheel)
      canvas.removeEventListener('wheel', this._listeners.wheel);
    if (this._listeners.touchstart)
      canvas.removeEventListener('touchstart', this._listeners.touchstart);
    if (this._listeners.touchmove)
      canvas.removeEventListener('touchmove', this._listeners.touchmove);
    if (this._listeners.touchend)
      canvas.removeEventListener('touchend', this._listeners.touchend);

    this._listeners = {};
    this._onCrosshairMove = null;
  }
}
