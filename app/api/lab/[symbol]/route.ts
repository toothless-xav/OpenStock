import { NextRequest, NextResponse } from 'next/server';
import { analyzeWithAnyaIndicator, type Candle } from '@/lib/stock-lab/anya-indicator';

type YahooChartResponse = {
  chart?: {
    result?: Array<{
      timestamp?: number[];
      indicators?: {
        quote?: Array<{
          open?: Array<number | null>;
          high?: Array<number | null>;
          low?: Array<number | null>;
          close?: Array<number | null>;
          volume?: Array<number | null>;
        }>;
      };
    }>;
    error?: unknown;
  };
};

function cleanSymbol(symbol: string) {
  return symbol.toUpperCase().replace(/[^A-Z0-9.^=-]/g, '').slice(0, 16) || 'NVDA';
}

async function fetchYahooCandles(symbol: string): Promise<Candle[]> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=18mo&interval=1d&includePrePost=false&events=div%2Csplits`;
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 OpenStock-Anya-Lab/0.1',
      Accept: 'application/json',
    },
    next: { revalidate: 900 },
  } as RequestInit & { next: { revalidate: number } });

  if (!response.ok) {
    throw new Error(`Yahoo chart fetch failed: ${response.status}`);
  }

  const data = (await response.json()) as YahooChartResponse;
  const result = data.chart?.result?.[0];
  const quote = result?.indicators?.quote?.[0];
  if (!result?.timestamp || !quote?.close) {
    throw new Error('Yahoo chart response did not include daily candles.');
  }

  return result.timestamp.flatMap((timestamp, i) => {
    const open = quote.open?.[i];
    const high = quote.high?.[i];
    const low = quote.low?.[i];
    const close = quote.close?.[i];
    const volume = quote.volume?.[i] ?? 0;
    if (open === null || high === null || low === null || close === null) return [];
    if (open === undefined || high === undefined || low === undefined || close === undefined) return [];

    return [{
      time: new Date(timestamp * 1000).toISOString().slice(0, 10),
      open,
      high,
      low,
      close,
      volume,
    }];
  });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol: rawSymbol } = await params;
    const symbol = cleanSymbol(rawSymbol);
    const candles = await fetchYahooCandles(symbol);
    const analysis = analyzeWithAnyaIndicator(symbol, candles);
    return NextResponse.json({ source: 'Yahoo Finance chart endpoint', generatedAt: new Date().toISOString(), analysis });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown stock lab error' },
      { status: 500 }
    );
  }
}
