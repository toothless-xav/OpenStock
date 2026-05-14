'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createChart, CandlestickSeries, HistogramSeries, LineSeries } from 'lightweight-charts';

type Candle = {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ema20: number | null;
  ema50: number | null;
  ema150: number | null;
  rsi14: number | null;
};

type Level = { price: number; touches: number; kind: 'support' | 'resistance' };

type Analysis = {
  symbol: string;
  score: number;
  verdict: string;
  currentPrice: number;
  rsi14: number;
  ema20: number;
  ema50: number;
  ema150: number;
  momentum63d: number | null;
  volumeExpansion: number | null;
  supports: Level[];
  resistances: Level[];
  notes: string[];
  candles: Candle[];
};

type ApiResponse = {
  source: string;
  generatedAt: string;
  analysis: Analysis;
};

function formatPercent(value: number | null) {
  if (value === null || !Number.isFinite(value)) return 'n/a';
  return `${(value * 100).toFixed(1)}%`;
}

function formatPrice(value: number) {
  return value.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 });
}

export default function AnyaStockLabChart({ symbol }: { symbol: string }) {
  const chartRef = useRef<HTMLDivElement | null>(null);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cleanSymbol = useMemo(() => symbol.toUpperCase(), [symbol]);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    fetch(`/api/lab/${encodeURIComponent(cleanSymbol)}`)
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'Failed to load stock lab data');
        return payload as ApiResponse;
      })
      .then((payload) => {
        if (!cancelled) setData(payload);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unknown error');
      });

    return () => {
      cancelled = true;
    };
  }, [cleanSymbol]);

  useEffect(() => {
    if (!chartRef.current || !data?.analysis.candles.length) return;

    chartRef.current.innerHTML = '';
    const chart = createChart(chartRef.current, {
      height: 620,
      layout: { background: { color: '#0b0f19' }, textColor: '#d1d5db' },
      grid: { vertLines: { color: '#1f2937' }, horzLines: { color: '#1f2937' } },
      rightPriceScale: { borderColor: '#374151' },
      timeScale: { borderColor: '#374151', timeVisible: true },
      crosshair: { mode: 1 },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    candleSeries.setData(data.analysis.candles.map((c) => ({
      time: c.time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    })) as any);

    const addLine = (title: string, color: string, values: Array<{ time: string; value: number | null }>) => {
      const series = chart.addSeries(LineSeries, { color, lineWidth: 2, title });
      series.setData(values.filter((v) => v.value !== null).map((v) => ({ time: v.time, value: v.value as number })) as any);
    };

    addLine('EMA20', '#fbbf24', data.analysis.candles.map((c) => ({ time: c.time, value: c.ema20 })));
    addLine('EMA50', '#60a5fa', data.analysis.candles.map((c) => ({ time: c.time, value: c.ema50 })));
    addLine('EMA150', '#a78bfa', data.analysis.candles.map((c) => ({ time: c.time, value: c.ema150 })));

    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#334155',
      priceFormat: { type: 'volume' },
      priceScaleId: '',
    });
    volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
    volumeSeries.setData(data.analysis.candles.map((c) => ({
      time: c.time,
      value: c.volume,
      color: c.close >= c.open ? 'rgba(34,197,94,0.32)' : 'rgba(239,68,68,0.32)',
    })) as any);

    for (const level of [...data.analysis.supports, ...data.analysis.resistances]) {
      candleSeries.createPriceLine({
        price: level.price,
        color: level.kind === 'support' ? '#22c55e' : '#ef4444',
        lineWidth: 2,
        lineStyle: 2,
        axisLabelVisible: true,
        title: `${level.kind === 'support' ? 'S' : 'R'} ${formatPrice(level.price)} (${level.touches})`,
      });
    }

    chart.timeScale().fitContent();

    const onResize = () => {
      if (chartRef.current) chart.applyOptions({ width: chartRef.current.clientWidth });
    };
    window.addEventListener('resize', onResize);
    onResize();

    return () => {
      window.removeEventListener('resize', onResize);
      chart.remove();
    };
  }, [data]);

  if (error) {
    return <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-red-200">{error}</div>;
  }

  if (!data) {
    return <div className="rounded-xl border border-white/10 bg-black/30 p-6 text-gray-300">Loading Anya Indicator v0 for {cleanSymbol}…</div>;
  }

  const analysis = data.analysis;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-white/10 bg-black/40 p-5 shadow-2xl">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-emerald-300">Anya Strategy Lab</p>
            <h1 className="text-3xl font-bold text-white">{analysis.symbol} — Indicator v0</h1>
            <p className="mt-2 text-sm text-gray-400">Source: {data.source}. Generated: {new Date(data.generatedAt).toLocaleString()}.</p>
          </div>
          <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-5 py-3 text-right">
            <p className="text-sm text-emerald-200">Score</p>
            <p className="text-4xl font-bold text-emerald-300">{analysis.score}</p>
            <p className="text-sm text-gray-300">{analysis.verdict}</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-5">
          <Metric label="Price" value={`$${formatPrice(analysis.currentPrice)}`} />
          <Metric label="RSI14" value={analysis.rsi14.toFixed(1)} />
          <Metric label="63D momentum" value={formatPercent(analysis.momentum63d)} />
          <Metric label="Volume expansion" value={formatPercent(analysis.volumeExpansion)} />
          <Metric label="EMA150 gap" value={formatPercent(analysis.currentPrice / analysis.ema150 - 1)} />
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#0b0f19] p-3 shadow-2xl">
        <div ref={chartRef} className="h-[620px] w-full" />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Panel title="Nearest supports" items={analysis.supports.map((x) => `$${formatPrice(x.price)} — ${x.touches} pivot touches`)} />
        <Panel title="Nearest resistances" items={analysis.resistances.map((x) => `$${formatPrice(x.price)} — ${x.touches} pivot touches`)} />
        <Panel title="Signal notes" items={analysis.notes} />
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function Panel({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-4">
      <h2 className="font-semibold text-white">{title}</h2>
      <ul className="mt-3 space-y-2 text-sm text-gray-300">
        {items.length ? items.map((item, i) => <li key={i}>• {item}</li>) : <li>• None nearby</li>}
      </ul>
    </div>
  );
}
