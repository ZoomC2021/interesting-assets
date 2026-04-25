import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        {/* Logo */}
        <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center mx-auto mb-4 shadow-card">
          <span className="text-white font-semibold text-body">R</span>
        </div>

        <h1 className="text-metric font-semibold text-ink mb-2">
          Malaysian REIT Monitor
        </h1>

        <p className="text-body-sm text-muted mb-6">
          Comprehensive monitoring and comparison tool for Malaysian Real Estate Investment Trusts
        </p>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/monitor"
            className="group block bg-surface rounded-lg border border-stroke p-4 hover:border-strokeHover hover:shadow-card transition-all"
          >
            <div className="w-8 h-8 bg-accent-soft rounded-md flex items-center justify-center mb-2 group-hover:bg-surfaceAlt transition-colors">
              <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
              </svg>
            </div>
            <h2 className="text-body-sm font-semibold text-ink mb-0.5">Monitor</h2>
            <p className="text-label leading-relaxed">
              Browse 10 Malaysian REITs with 30+ metrics, sparklines, and sector benchmarks
            </p>
          </Link>

          <Link
            href="/compare"
            className="group block bg-surface rounded-lg border border-stroke p-4 hover:border-strokeHover hover:shadow-card transition-all"
          >
            <div className="w-8 h-8 bg-semanticSuccess/10 rounded-md flex items-center justify-center mb-2 group-hover:bg-semanticSuccess/20 transition-colors">
              <svg className="w-5 h-5 text-semanticSuccess" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
            </div>
            <h2 className="text-body-sm font-semibold text-ink mb-0.5">Compare</h2>
            <p className="text-label leading-relaxed">
              Side-by-side comparison with KPIs, charts, and risk matrices
            </p>
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-5 flex items-center justify-center gap-4 text-label text-muted">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-semanticSuccess rounded-full"></span>
            <span>10 REITs</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-accent rounded-full"></span>
            <span>30+ Metrics</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-semanticWarning rounded-full"></span>
            <span>Real-time Benchmarks</span>
          </div>
        </div>
      </div>
    </div>
  );
}
