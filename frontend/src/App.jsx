import { useEffect, useMemo, useState } from "react";
import Loader from "./components/Loader";
import ResultCard from "./components/ResultCard";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const canAnalyze = useMemo(() => Boolean(selectedFile) && !loading, [selectedFile, loading]);

  function selectFile(file) {
    if (!file || !file.type.startsWith("image/")) {
      setError("Please choose a valid image file.");
      return;
    }

    setSelectedFile(file);
    setResult(null);
    setShowResult(false);
    setError("");
    setPreviewUrl(URL.createObjectURL(file));
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0];
    selectFile(file);
  }

  function handleDragOver(event) {
    event.preventDefault();
    setDragActive(true);
  }

  function handleDragLeave(event) {
    event.preventDefault();
    setDragActive(false);
  }

  function handleDrop(event) {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    selectFile(file);
  }

  async function analyzeImage() {
    if (!selectedFile) {
      setError("Please upload an image first.");
      return;
    }

    setLoading(true);
    setLoadingProgress(8);
    setShowSuccess(false);
    setError("");
    setResult(null);
    setShowResult(false);

    try {
      const minDelay = new Promise((resolve) => setTimeout(resolve, 1400));
      const formData = new FormData();
      formData.append("image", selectedFile);

      const predictionRequest = fetch(`${API_BASE_URL}/predict`, {
        method: "POST",
        body: formData
      });
      const [response] = await Promise.all([predictionRequest, minDelay]);

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Prediction request failed.");
      }

      setResult(payload);
      setLoadingProgress(100);
      setLoading(false);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setShowResult(true);
      }, 550);
    } catch (requestError) {
      setError(requestError.message || "Unable to analyze image.");
      setShowSuccess(false);
      setLoading(false);
    } finally {
      // Intentionally handled in try/catch to allow success transition.
    }
  }

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    if (!loading) {
      return;
    }

    const interval = setInterval(() => {
      setLoadingProgress((current) => {
        if (current >= 92) {
          return current;
        }

        const step = Math.max(1, (92 - current) * 0.15);
        return Math.min(92, current + step);
      });
    }, 160);

    return () => clearInterval(interval);
  }, [loading]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-indigo-50/30 to-slate-200 px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.08),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(168,85,247,0.06),transparent_50%)] pointer-events-none" />
      <div className="mx-auto max-w-xl space-y-8 relative">
        <header className="space-y-4 text-center animate-slide-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/50 bg-gradient-to-r from-indigo-50/80 to-purple-50/80 px-4 py-1.5 text-xs font-semibold text-indigo-600 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            AI-Powered Analysis
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight">
            <span className="text-gradient">Skin Screening</span>
            <span className="block text-xl font-semibold text-slate-700 mt-1">AI-Powered Analysis</span>
          </h1>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Upload or capture a skin image and receive instant AI-powered screening analysis
          </p>
        </header>

        <section className="space-y-5 rounded-2xl border border-slate-200/60 bg-white/80 p-6 shadow-lg card-shadow-lg backdrop-blur-sm animate-slide-up" style={{animationDelay: '0.1s'}}>
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2" htmlFor="imageUpload">
              <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Upload Image
            </label>
            <span className="text-xs text-slate-400">JPG, PNG, WEBP</span>
          </div>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative rounded-xl border-2 border-dashed p-8 text-center transition-all duration-300 ${
              dragActive
                ? "border-indigo-500 bg-indigo-50/80 scale-[1.02]"
                : "border-slate-200 bg-slate-50/60 hover:border-indigo-300 hover:bg-slate-50"
            }`}
          >
            <div className={`absolute inset-0 rounded-xl bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 transition-opacity ${dragActive ? 'opacity-100' : ''}`} />
            <div className="relative">
              <div className={`mx-auto w-14 h-14 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mb-4 transition-transform ${dragActive ? 'scale-110' : ''}`}>
                <svg className={`w-6 h-6 text-indigo-500 transition-colors ${dragActive ? 'text-indigo-600' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <p className={`text-sm font-medium transition-colors ${dragActive ? 'text-indigo-700' : 'text-slate-600'}`}>
                {dragActive ? 'Drop image here' : 'Drag and drop an image here'}
              </p>
              <p className="text-xs text-slate-400 mt-1">or click the button below to browse</p>
            </div>
          </div>

          <input
            id="imageUpload"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="block w-full cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-gradient-to-r file:from-indigo-600 file:to-purple-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white file:shadow-md file:transition-all file:hover:from-indigo-700 file:hover:to-purple-700 hover:file:shadow-lg"
          />

          {previewUrl ? (
            <div className="group relative overflow-hidden rounded-xl border border-slate-200 shadow-md">
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10" />
              <img src={previewUrl} alt="Selected skin" className="h-72 w-full object-cover transition-transform group-hover:scale-105 duration-500" />
              <div className="absolute bottom-3 left-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/90 backdrop-blur-sm px-3 py-1 text-xs font-medium text-slate-700 shadow-sm">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Image selected
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/40 py-10 text-sm text-slate-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              No image selected yet
            </div>
          )}

          <button
            type="button"
            onClick={analyzeImage}
            disabled={!canAnalyze}
            className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl hover:shadow-indigo-500/25 disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none disabled:hover:scale-100 active:scale-[0.98]"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Running AI Screening...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Run AI Screening
                </>
              )}
            </span>
          </button>
          <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            AI-assisted screening tool, not a final diagnosis
          </div>
        </section>

        {loading && <Loader progress={loadingProgress} />}
        {showSuccess && (
          <div className="animate-slide-up rounded-xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-5 text-center shadow-lg">
            <div className="relative mx-auto flex h-14 w-14 items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-emerald-200 animate-pulse-ring" />
              <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-lg">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <p className="mt-3 text-sm font-semibold text-emerald-700">Analysis Complete</p>
          </div>
        )}
        {error && (
          <div className="animate-slide-up rounded-xl border border-red-200/60 bg-gradient-to-br from-red-50 to-red-100/50 p-4 text-sm text-red-700 shadow-md">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}
        <div
          className={`transition-all duration-500 ${showResult ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none"}`}
        >
          {result && <ResultCard result={result} />}
        </div>
        
        <footer className="text-center text-xs text-slate-400 animate-slide-up" style={{animationDelay: '0.2s'}}>
          <p>Powered by advanced machine learning models</p>
        </footer>
      </div>
    </main>
  );
}

export default App;
