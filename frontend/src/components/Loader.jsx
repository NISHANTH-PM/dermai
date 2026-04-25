function Loader({ progress = 0 }) {
  return (
    <div className="animate-slide-up space-y-4 rounded-2xl border border-slate-200/60 bg-white/90 p-5 shadow-lg card-shadow-lg backdrop-blur-sm">
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
            <svg className="h-6 w-6 text-white animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <div className="absolute inset-0 rounded-xl bg-indigo-400/30 animate-pulse-ring" />
        </div>
        <div className="flex-1 space-y-1.5">
          <p className="text-sm font-semibold text-slate-700">Analyzing image...</p>
          <p className="text-xs text-slate-400">Running AI screening model</p>
        </div>
        <div className="text-right">
          <span className="text-lg font-bold text-indigo-600">{Math.round(progress)}%</span>
        </div>
      </div>
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 animate-shimmer" />
        <div
          className="relative h-full rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-200 ease-out shadow-lg shadow-indigo-500/30"
          style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
        >
          <div className="absolute -right-1 -top-0.5 h-3 w-3 rounded-full bg-white shadow-sm animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export default Loader;
