export type Candle = {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type PriceLevel = {
  price: number;
  touches: number;
  kind: 'support' | 'resistance';
};

export type AnyaIndicatorResult = {
  symbol: string;
  score: number;
  verdict: 'breakout-watch' | 'constructive' | 'extended-risk' | 'weak';
  currentPrice: number;
  rsi14: number;
  ema20: number;
  ema50: number;
  ema150: number;
  momentum63d: number | null;
  volumeExpansion: number | null;
  supports: PriceLevel[];
  resistances: PriceLevel[];
  notes: string[];
  candles: Array<Candle & { ema20: number | null; ema50: number | null; ema150: number | null; rsi14: number | null }>;
};

function ema(values: number[], span: number): Array<number | null> {
  const alpha = 2 / (span + 1);
  const out: Array<number | null> = [];
  let prev: number | null = null;

  for (const value of values) {
    if (!Number.isFinite(value)) {
      out.push(prev);
      continue;
    }
    prev = prev === null ? value : alpha * value + (1 - alpha) * prev;
    out.push(prev);
  }

  return out;
}

function rsi(values: number[], period = 14): Array<number | null> {
  const out: Array<number | null> = new Array(values.length).fill(null);
  if (values.length <= period) return out;

  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 1; i <= period; i += 1) {
    const delta = values[i] - values[i - 1];
    if (delta >= 0) avgGain += delta;
    else avgLoss += Math.abs(delta);
  }

  avgGain /= period;
  avgLoss /= period;
  out[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

  for (let i = period + 1; i < values.length; i += 1) {
    const delta = values[i] - values[i - 1];
    const gain = Math.max(delta, 0);
    const loss = Math.max(-delta, 0);
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }

  return out;
}

function movingAverage(values: number[], window: number): Array<number | null> {
  const out: Array<number | null> = [];
  let sum = 0;
  for (let i = 0; i < values.length; i += 1) {
    sum += values[i];
    if (i >= window) sum -= values[i - window];
    out.push(i >= window - 1 ? sum / window : null);
  }
  return out;
}

function clusterLevels(candles: Candle[], currentPrice: number): { supports: PriceLevel[]; resistances: PriceLevel[] } {
  const pivots: number[] = [];
  const recent = candles.slice(-252);

  for (let i = 2; i < recent.length - 2; i += 1) {
    const c = recent[i];
    if (c.high > recent[i - 1].high && c.high > recent[i - 2].high && c.high > recent[i + 1].high && c.high > recent[i + 2].high) {
      pivots.push(c.high);
    }
    if (c.low < recent[i - 1].low && c.low < recent[i - 2].low && c.low < recent[i + 1].low && c.low < recent[i + 2].low) {
      pivots.push(c.low);
    }
  }

  const clusters: Array<{ mean: number; values: number[] }> = [];
  for (const value of pivots.slice(-100)) {
    const existing = clusters.find((cluster) => Math.abs(value - cluster.mean) / cluster.mean < 0.018);
    if (existing) {
      existing.values.push(value);
      existing.mean = existing.values.reduce((a, b) => a + b, 0) / existing.values.length;
    } else {
      clusters.push({ mean: value, values: [value] });
    }
  }

  const ranked = clusters
    .map((cluster) => ({ price: cluster.mean, touches: cluster.values.length }))
    .sort((a, b) => b.touches - a.touches);

  const supports = ranked
    .filter((level) => level.price < currentPrice)
    .sort((a, b) => currentPrice - a.price - (currentPrice - b.price))
    .slice(0, 4)
    .map((level) => ({ ...level, kind: 'support' as const }));

  const resistances = ranked
    .filter((level) => level.price > currentPrice)
    .sort((a, b) => a.price - currentPrice - (b.price - currentPrice))
    .slice(0, 4)
    .map((level) => ({ ...level, kind: 'resistance' as const }));

  return { supports, resistances };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function analyzeWithAnyaIndicator(symbol: string, rawCandles: Candle[]): AnyaIndicatorResult {
  const candles = rawCandles.filter((c) => Number.isFinite(c.close) && Number.isFinite(c.high) && Number.isFinite(c.low));
  if (candles.length < 180) {
    throw new Error(`Need at least 180 daily candles; received ${candles.length}`);
  }

  const closes = candles.map((c) => c.close);
  const volumes = candles.map((c) => c.volume || 0);
  const ema20 = ema(closes, 20);
  const ema50 = ema(closes, 50);
  const ema150 = ema(closes, 150);
  const rsi14 = rsi(closes, 14);
  const avgVolume50 = movingAverage(volumes, 50);

  const lastIndex = candles.length - 1;
  const currentPrice = closes[lastIndex];
  const currentEma20 = ema20[lastIndex] ?? currentPrice;
  const currentEma50 = ema50[lastIndex] ?? currentPrice;
  const currentEma150 = ema150[lastIndex] ?? currentPrice;
  const currentRsi = rsi14[lastIndex] ?? 50;

  const momentum63d = closes.length > 64 ? currentPrice / closes[lastIndex - 63] - 1 : null;
  const volumeExpansion = avgVolume50[lastIndex] ? volumes[lastIndex] / (avgVolume50[lastIndex] || 1) - 1 : null;
  const high20 = Math.max(...closes.slice(Math.max(0, lastIndex - 21), lastIndex));
  const high63 = Math.max(...closes.slice(Math.max(0, lastIndex - 64), lastIndex));
  const range40 = closes.slice(Math.max(0, lastIndex - 39));
  const baseTightness = Math.max(...range40) / Math.min(...range40) - 1;

  let score = 0;
  const trend = currentPrice / currentEma150 - 1;
  const extension = currentPrice / currentEma20 - 1;
  const breakoutProximity = currentPrice > high20 ? 1 : clamp(1 - Math.abs(currentPrice / high20 - 1) / 0.08, 0, 1);

  score += clamp(trend / 0.25, -1, 1) * 28;
  score += clamp((momentum63d ?? 0) / 0.25, -1, 1) * 26;
  score += breakoutProximity * 18;
  score += clamp((volumeExpansion ?? 0) / 1.0, -0.5, 1) * 10;
  if (baseTightness < 0.25 && currentPrice > currentEma50) score += 10;
  if (currentPrice > high63) score += 8;
  if (currentRsi > 75) score -= (currentRsi - 75) * 1.25;
  if (extension > 0.18) score -= (extension - 0.18) * 85;
  score = clamp(score, 0, 100);

  const levels = clusterLevels(candles, currentPrice);
  const notes: string[] = [];
  if (currentPrice > currentEma150) notes.push('Price is above EMA150: long-term trend is constructive.');
  else notes.push('Price is below EMA150: long-term trend is weak.');
  if (currentPrice > high20) notes.push('Fresh 20-day breakout condition is active.');
  else notes.push('Not a fresh 20-day breakout; watch nearest resistance.');
  if (currentRsi > 75) notes.push('RSI is hot; entry risk is elevated unless it consolidates.');
  if (volumeExpansion !== null && volumeExpansion > 0.4) notes.push('Volume is materially above the 50-day average.');
  if (baseTightness < 0.25) notes.push('Recent 40-day range is relatively tight; base quality is acceptable.');

  const verdict = score >= 75
    ? currentRsi > 78 || extension > 0.2 ? 'extended-risk' : 'breakout-watch'
    : score >= 55
      ? 'constructive'
      : score >= 35
        ? 'extended-risk'
        : 'weak';

  return {
    symbol: symbol.toUpperCase(),
    score: Math.round(score * 10) / 10,
    verdict,
    currentPrice,
    rsi14: currentRsi,
    ema20: currentEma20,
    ema50: currentEma50,
    ema150: currentEma150,
    momentum63d,
    volumeExpansion,
    supports: levels.supports,
    resistances: levels.resistances,
    notes,
    candles: candles.map((c, i) => ({
      ...c,
      ema20: ema20[i],
      ema50: ema50[i],
      ema150: ema150[i],
      rsi14: rsi14[i],
    })),
  };
}
