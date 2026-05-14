import Link from 'next/link';
import AnyaStockLabChart from '@/components/stocks/AnyaStockLabChart';

const WATCHLIST = ['NVDA', 'AVGO', 'AMD', 'TSM', 'ASML', 'AMAT', 'LRCX', 'MU', 'MRVL', 'COHR', 'LITE', 'VRT', 'ANET', 'CRDO'];

export default async function LabSymbolPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const cleanSymbol = symbol.toUpperCase().replace(/[^A-Z0-9.^=-]/g, '') || 'NVDA';

  return (
    <main className="min-h-screen bg-[#05070d] px-4 py-8 text-white md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <nav className="flex flex-wrap gap-2 text-sm">
          {WATCHLIST.map((ticker) => (
            <Link
              key={ticker}
              href={`/lab/${ticker}`}
              className={`rounded-full border px-3 py-1 ${ticker === cleanSymbol ? 'border-emerald-400 bg-emerald-400/15 text-emerald-200' : 'border-white/10 bg-white/[0.03] text-gray-300 hover:border-white/30'}`}
            >
              {ticker}
            </Link>
          ))}
        </nav>
        <AnyaStockLabChart symbol={cleanSymbol} />
      </div>
    </main>
  );
}
