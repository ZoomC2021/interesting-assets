import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        {/* Logo */}
        <div className="w-14 h-14 bg-primary-600 rounded-xl flex items-center justify-center mx-auto mb-5 shadow-card">
          <span className="text-white font-bold text-xl">R</span>
        </div>

        <h1 className="text-3xl font-bold text-ink mb-3">
          Malaysian REIT Monitor
        </h1>

        <p className="text-base text-muted mb-8">
          Comprehensive monitoring and comparison tool for Malaysian Real Estate Investment Trusts
        </p>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/monitor"
            className="group block bg-surface rounded-xl border border-stroke p-5 hover:border-strokeHover hover:shadow-card transition-all"
          >
            <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center mb-3 group-hover:bg-primary-100 transition-colors">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-ink mb-1">Monitor</h2>
            <p className="text-sm text-muted">
              Browse 10 Malaysian REITs with 30+ metrics, sparklines, and sector benchmarks
            </p>
          </Link>

          <Link
            href="/compare"
            className="group block bg-surface rounded-xl border border-stroke p-5 hover:border-strokeHover hover:shadow-card transition-all"
          >
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center mb-3 group-hover:bg-emerald-100 transition-colors">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-ink mb-1">Compare</h2>
            <p className="text-sm text-muted">
              Side-by-side comparison with KPIs, charts, and risk matrices
            </p>
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-6 flex items-center justify-center gap-6 text-sm text-muted">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
            <span>10 REITs</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
            <span>30+ Metrics</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
            <span>Real-time Benchmarks</span>
          </div>
        </div>
      </div>
    </div>
  );
}
