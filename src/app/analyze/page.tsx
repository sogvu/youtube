"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { 
  Search, 
  Sparkles, 
  Video, 
  Flame, 
  Play, 
  Clock, 
  Eye, 
  ThumbsUp, 
  MessageSquare, 
  Info, 
  AlertCircle,
  Copy,
  Check,
  TrendingUp,
  Image as ImageIcon,
  Sliders,
  Maximize2,
  FileText,
  Volume2,
  DollarSign,
  Users,
  CheckCircle,
  Activity,
  Calendar,
  Share2,
  Download
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip as ChartTooltip, 
  ResponsiveContainer,
  CartesianGrid
} from "recharts";
import { AnalysisResult } from "../../../../backend/src/services/gemini";

// Helper component to handle Suspense wrapper for useSearchParams
function AnalyzeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { token } = useAuth();
  const pollTimerRef = useRef<any>(null);

  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [report, setReport] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({});

  const q = searchParams.get("q");
  const id = searchParams.get("id");

  // Cleanup polling timer on unmount
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
      }
    };
  }, []);

  // Fetch report when URL query changes
  useEffect(() => {
    if (token) {
      if (q) {
        triggerNewAnalysis(q);
      } else if (id) {
        loadSavedAnalysis(id);
      }
    }
  }, [q, id, token]);

  const triggerNewAnalysis = async (query: string) => {
    if (!token) {
      alert("Please login first to analyze videos.");
      return;
    }

    setLoading(true);
    setReport(null);
    setActiveTab("overview");
    setStatusMessage("Initializing video analysis request...");

    try {
      const response = await fetch("http://localhost:5000/api/analysis", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ urlOrKeyword: query })
      });
      const data = await response.json();
      
      if (!response.ok || data.error) {
        setLoading(false);
        alert("Error: " + (data.error || "Failed to start analysis."));
        return;
      }
      
      // Clean URL params and point to new id
      router.replace(`/analyze?id=${data.id}`);
    } catch (err) {
      console.error(err);
      setLoading(false);
      alert("System failed to connect. Please check if the backend API is running.");
    }
  };

  const loadSavedAnalysis = async (savedId: string) => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }

    if (!token) return;

    setLoading(true);
    setReport(null);
    setStatusMessage("Connecting to analysis server...");

    const poll = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/analysis/${savedId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();

        if (data.error) {
          setLoading(false);
          alert("Error: " + data.error);
          return;
        }

        if (data.status === "PENDING" || data.status === "PROCESSING") {
          setStatusMessage(`Analyzing video in background... Status: ${data.status}`);
          pollTimerRef.current = setTimeout(poll, 2500);
        } else if (data.status === "FAILED") {
          setLoading(false);
          alert("Analysis failed: " + (data.errorMsg || "Unknown error"));
        } else if (data.status === "COMPLETED") {
          setReport(data.analysis);
          setLoading(false);
        }
      } catch (err) {
        console.error("Polling error:", err);
        setLoading(false);
        alert("Failed to connect to server during polling.");
      }
    };

    poll();
  };

  const handleDownload = async (format: string) => {
    if (!id || !token) {
      alert("No report context loaded or authorization token missing.");
      return;
    }
    try {
      const res = await fetch(`http://localhost:5000/api/reports/download/${id}?type=${format}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) {
        alert("Failed to export report in " + format);
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Report_${report?.title.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 30)}.${format.toLowerCase() === "excel" ? "xlsx" : format.toLowerCase()}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Error exporting report: " + err);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    router.push(`/analyze?q=${encodeURIComponent(searchInput.trim())}`);
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStates(prev => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setCopiedStates(prev => ({ ...prev, [key]: false }));
    }, 1500);
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
    if (score >= 70) return "text-amber-400 border-amber-500/30 bg-amber-500/10";
    return "text-rose-400 border-rose-500/30 bg-rose-500/10";
  };

  const getScoreProgressColor = (score: number) => {
    if (score >= 85) return "bg-emerald-500";
    if (score >= 70) return "bg-amber-500";
    return "bg-rose-500";
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(0) + "K";
    return num.toString();
  };

  // Convert retention object into chart array
  const getRetentionData = () => {
    if (!report?.retentionPrediction) return [];
    const rp = report.retentionPrediction;
    return [
      { time: "0-30s", retention: rp["0-30s"] },
      { time: "30-60s", retention: rp["30-60s"] },
      { time: "1-3m", retention: rp["1-3m"] },
      { time: "3-5m", retention: rp["3-5m"] },
      { time: "5-8m", retention: rp["5-8m"] },
      { time: "8-10m", retention: rp["8-10m"] },
      { time: "10m+", retention: rp["10m+"] }
    ];
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-[1600px] mx-auto w-full flex-1 flex flex-col min-h-0">
      {/* Search Header Row */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <Video className="h-8 w-8 text-blue-500" /> Video Analyzer
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Analyze YouTube metrics, transcript pacing, colors, and content structure.
          </p>
        </div>
        
        {/* Simple Input Bar */}
        <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full md:w-[480px]">
          <Search className="absolute left-4.5 h-4.5 w-4.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Link video hoặc từ khóa mới..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            disabled={loading}
            className="w-full bg-[#0c0c0f] border border-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg pl-12 pr-28 py-2 text-xs text-white placeholder-zinc-500 transition-all outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="absolute right-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-[10px] px-3.5 py-1.5 rounded-md transition-colors shadow-sm"
          >
            Research
          </button>
        </form>
      </div>

      {loading && (
        <div className="h-[450px] w-full flex flex-col items-center justify-center p-8 bg-[#0c0c0f] border border-zinc-800 rounded-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 h-40 w-40 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
          <div className="h-12 w-12 rounded-full border-2 border-blue-600/30 border-t-blue-500 animate-spin mb-4" />
          <span className="text-sm font-semibold text-white tracking-wide animate-pulse">
            {statusMessage}
          </span>
          <p className="text-xs text-zinc-500 mt-2">Computing viral metrics and synthesis engines.</p>
        </div>
      )}

      {!loading && !report && (
        <div className="h-[350px] flex flex-col items-center justify-center text-center p-8 border border-dashed border-zinc-800 rounded-xl bg-zinc-950/20">
          <Video className="h-12 w-12 text-zinc-700 mb-3 animate-pulse" />
          <h2 className="text-lg font-bold text-zinc-300">Nền tảng Phân tích Xu hướng Động vật</h2>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm leading-relaxed">
            Hãy dán một đường dẫn YouTube hoặc nhập từ khóa động vật ở góc phải để bắt đầu quét các chỉ số tăng trưởng (CTR, Hook, RPM, Pacing).
          </p>
        </div>
      )}

      {!loading && report && (
        <div className="space-y-6 flex-1 flex flex-col min-h-0">
          
          {/* Summary Banner */}
          <div className="bg-[#0c0c0f] border border-zinc-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex gap-4 items-start">
              <div className="h-16 w-28 bg-zinc-950 rounded-lg border border-zinc-800 overflow-hidden flex-shrink-0 relative flex items-center justify-center">
                <Play className="h-6 w-6 text-blue-500 fill-blue-500 opacity-80" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">
                  Report Loaded
                </span>
                <h2 className="font-extrabold text-white text-lg tracking-tight mt-1 leading-snug">
                  {report.title}
                </h2>
                <div className="flex items-center gap-3 mt-1 text-xs text-zinc-400">
                  <span className="font-semibold text-zinc-300">{report.channelName}</span>
                  <span>•</span>
                  <span>{report.duration}</span>
                  <span>•</span>
                  <span>Uploaded: {report.uploadDate}</span>
                </div>
              </div>
            </div>

            {/* Quick Metrics & Exports */}
            <div className="flex flex-col sm:flex-row items-center gap-5 border-t border-zinc-800/60 md:border-t-0 pt-4 md:pt-0 self-stretch md:self-auto justify-around md:justify-end text-xs">
              <div className="flex gap-5 font-mono">
                <div className="text-center px-4 border-r border-zinc-800/80">
                  <span className="text-zinc-500 block text-[10px] uppercase">Views</span>
                  <span className="font-bold text-white text-sm mt-0.5 block">{formatNumber(report.views)}</span>
                </div>
                <div className="text-center px-4 border-r border-zinc-800/80">
                  <span className="text-zinc-500 block text-[10px] uppercase">Likes</span>
                  <span className="font-bold text-white text-sm mt-0.5 block">{formatNumber(report.likes)}</span>
                </div>
                <div className="text-center px-4">
                  <span className="text-zinc-500 block text-[10px] uppercase">Comments</span>
                  <span className="font-bold text-white text-sm mt-0.5 block">{formatNumber(report.comments)}</span>
                </div>
              </div>
              
              <div className="flex gap-2 border-t sm:border-t-0 sm:border-l border-zinc-800 pt-3 sm:pt-0 sm:pl-4">
                <button
                  onClick={() => handleDownload("PDF")}
                  title="Export PDF Report"
                  className="bg-zinc-900 hover:bg-zinc-800 hover:text-white text-zinc-400 font-bold text-[10px] px-2.5 py-1.5 rounded border border-zinc-800 transition-colors flex items-center gap-1 cursor-pointer animate-in fade-in"
                >
                  <Download className="h-3 w-3 text-blue-400" />
                  <span>PDF</span>
                </button>
                <button
                  onClick={() => handleDownload("EXCEL")}
                  title="Export Excel Report"
                  className="bg-zinc-900 hover:bg-zinc-800 hover:text-white text-zinc-400 font-bold text-[10px] px-2.5 py-1.5 rounded border border-zinc-800 transition-colors flex items-center gap-1 cursor-pointer animate-in fade-in"
                >
                  <Download className="h-3 w-3 text-emerald-400" />
                  <span>XLSX</span>
                </button>
                <button
                  onClick={() => handleDownload("CSV")}
                  title="Export CSV Report"
                  className="bg-zinc-900 hover:bg-zinc-800 hover:text-white text-zinc-400 font-bold text-[10px] px-2.5 py-1.5 rounded border border-zinc-800 transition-colors flex items-center gap-1 cursor-pointer animate-in fade-in"
                >
                  <Download className="h-3 w-3 text-zinc-400" />
                  <span>CSV</span>
                </button>
              </div>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex border-b border-zinc-800 overflow-x-auto flex-shrink-0 text-xs">
            {[
              { id: "overview", name: "Overview & Viral Reasons" },
              { id: "thumbnail", name: "Thumbnail & Title" },
              { id: "hook", name: "Hook & Flow" },
              { id: "editing", name: "Editing & Audio" },
              { id: "seo", name: "SEO & RPM Analysis" },
              { id: "audience", name: "Audience & Retention" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3.5 px-4 font-bold border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>

          {/* Tab Content Panels */}
          <div className="flex-1 min-h-0 overflow-y-auto pr-1 pb-10">
            
            {/* 1. OVERVIEW & VIRAL REASONS */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                
                {/* Score Indicators Row */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {[
                    { label: "Thumbnail Score", score: report.thumbnailAnalysis.score },
                    { label: "Title Score", score: report.titleAnalysis.score },
                    { label: "Hook Score", score: report.hookAnalysis.score },
                    { label: "SEO Score", score: report.seoAnalysis.trendScore },
                    { label: "Overall Viral Score", score: Math.round((report.thumbnailAnalysis.score * 0.3 + report.titleAnalysis.score * 0.2 + report.hookAnalysis.score * 0.4 + report.seoAnalysis.trendScore * 0.1)) }
                  ].map((metric, i) => (
                    <div key={i} className="bg-[#0c0c0f] border border-zinc-800 rounded-xl p-4 flex flex-col justify-between">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{metric.label}</span>
                      <div className="mt-4 flex items-baseline gap-1.5">
                        <span className={`text-2xl font-extrabold px-2.5 py-0.5 rounded border ${getScoreColor(metric.score)}`}>
                          {metric.score}
                        </span>
                        <span className="text-[10px] text-[#52525b] font-mono">/100</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Top 20 Viral Reasons List */}
                <div className="bg-[#0c0c0f] border border-[#1e1e24] rounded-xl p-5 space-y-4">
                  <div>
                    <h3 className="font-bold text-white text-base">Top 20 Viral Reasons Breakdown</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">Identified triggers contributing to retention, clicks, and viewer sharing velocity.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {report.viralReasons.map((item, idx) => (
                      <div key={idx} className="p-3 bg-zinc-900/30 border border-zinc-800/80 rounded-lg flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span className="text-zinc-200 truncate">{idx + 1}. {item.reason}</span>
                            <span className="text-blue-400 font-mono">{item.percentageContribution}%</span>
                          </div>
                          {/* Progress bar */}
                          <div className="w-full bg-zinc-950 h-1.5 rounded-full overflow-hidden mt-1.5 border border-zinc-800/50">
                            <div 
                              className="h-full bg-blue-500 rounded-full" 
                              style={{ width: `${item.percentageContribution * 5}%` }} // Multiply by 5 for visualization since max percentage contribution is lower
                            />
                          </div>
                          <p className="text-[10px] text-zinc-500 mt-1 leading-normal">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 2. THUMBNAIL & TITLE RECOMMENDATIONS */}
            {activeTab === "thumbnail" && (
              <div className="space-y-6">
                
                {/* Visual Thumbnail Score Indicators */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Thumbnail Analysis */}
                  <div className="bg-[#0c0c0f] border border-zinc-800 rounded-xl p-5 space-y-4">
                    <h3 className="font-bold text-white text-base flex items-center gap-1.5">
                      <ImageIcon className="h-4.5 w-4.5 text-blue-500" /> Visual Thumbnail Metrics
                    </h3>
                    <div className="space-y-3.5 text-xs text-zinc-300">
                      <div className="grid grid-cols-2 py-1.5 border-b border-zinc-800/40">
                        <span className="text-zinc-500 font-medium">CTR Prediction</span>
                        <span className="font-bold text-white text-right">{report.thumbnailAnalysis.ctrPrediction}% (Average)</span>
                      </div>
                      <div className="grid grid-cols-2 py-1.5 border-b border-zinc-800/40">
                        <span className="text-zinc-500 font-medium">Visual Emotion Score</span>
                        <span className="font-bold text-white text-right">{report.thumbnailAnalysis.emotionScore}/100</span>
                      </div>
                      <div className="grid grid-cols-2 py-1.5 border-b border-zinc-800/40">
                        <span className="text-zinc-500 font-medium">Click Probability</span>
                        <span className="font-bold text-emerald-400 text-right">{report.thumbnailAnalysis.clickProbability}</span>
                      </div>
                      <div className="grid grid-cols-2 py-1.5 border-b border-zinc-800/40">
                        <span className="text-zinc-500 font-medium">Color Palette</span>
                        <span className="font-semibold text-zinc-200 text-right">{report.thumbnailAnalysis.colors.join(", ")}</span>
                      </div>
                      <div className="grid grid-cols-2 py-1.5 border-b border-zinc-800/40">
                        <span className="text-zinc-500 font-medium">Composition Type</span>
                        <span className="font-semibold text-zinc-200 text-right">{report.thumbnailAnalysis.composition}</span>
                      </div>
                      <div className="grid grid-cols-2 py-1.5 border-b border-zinc-800/40">
                        <span className="text-zinc-500 font-medium">Zoom Level / Face</span>
                        <span className="font-semibold text-zinc-200 text-right">{report.thumbnailAnalysis.zoomLevel} / {report.thumbnailAnalysis.humanFace ? "With human face" : "Animal only"}</span>
                      </div>
                      <div className="pt-1.5">
                        <span className="text-zinc-500 font-medium block">Visual Hook Details</span>
                        <p className="text-zinc-300 italic mt-1 leading-normal bg-zinc-950/40 p-2.5 rounded border border-zinc-900">{report.thumbnailAnalysis.visualHook}</p>
                      </div>
                    </div>
                  </div>

                  {/* Title Analysis */}
                  <div className="bg-[#0c0c0f] border border-zinc-800 rounded-xl p-5 space-y-4">
                    <h3 className="font-bold text-white text-base flex items-center gap-1.5">
                      <Sliders className="h-4.5 w-4.5 text-blue-500" /> Title Analytics & Curiosity Loops
                    </h3>
                    <div className="space-y-3.5 text-xs text-zinc-300">
                      <div className="grid grid-cols-2 py-1.5 border-b border-zinc-800/40">
                        <span className="text-zinc-500 font-medium">Title Score</span>
                        <span className="font-bold text-white text-right">{report.titleAnalysis.score}/100</span>
                      </div>
                      <div className="grid grid-cols-2 py-1.5 border-b border-zinc-800/40">
                        <span className="text-zinc-500 font-medium">Character Length</span>
                        <span className="font-bold text-white text-right">{report.titleAnalysis.length} chars</span>
                      </div>
                      <div className="grid grid-cols-2 py-1.5 border-b border-zinc-800/40">
                        <span className="text-zinc-500 font-medium">Keywords Detected</span>
                        <span className="font-semibold text-zinc-200 text-right">{report.titleAnalysis.keywordsDetected.join(", ")}</span>
                      </div>
                      <div className="grid grid-cols-2 py-1.5 border-b border-zinc-800/40">
                        <span className="text-zinc-500 font-medium">Curiosity Trigger</span>
                        <span className="font-bold text-emerald-400 text-right">{report.titleAnalysis.curiosityTrigger ? "Yes" : "No"}</span>
                      </div>
                      <div className="grid grid-cols-2 py-1.5 border-b border-zinc-800/40">
                        <span className="text-zinc-500 font-medium">Emotional Word Sync</span>
                        <span className="font-bold text-emerald-400 text-right">{report.titleAnalysis.emotionalTrigger ? "Yes" : "No"}</span>
                      </div>
                      <div className="grid grid-cols-2 py-1.5 border-b border-zinc-800/40">
                        <span className="text-zinc-500 font-medium">Viral Potential Rating</span>
                        <span className="font-bold text-emerald-400 text-right">{report.titleAnalysis.viralPotential}</span>
                      </div>
                      <div className="pt-1.5">
                        <span className="text-zinc-500 font-medium block">Title Optimization Feedback</span>
                        <p className="text-zinc-300 italic mt-1 leading-normal bg-zinc-950/40 p-2.5 rounded border border-zinc-900">{report.titleAnalysis.feedback}</p>
                      </div>
                    </div>
                  </div>

                </div>

                {/* 30 Titles Recommendations Grid */}
                <div className="bg-[#0c0c0f] border border-[#1e1e24] rounded-xl p-5 space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-white text-base">30 AI Suggested Titles</h3>
                      <p className="text-xs text-zinc-500 mt-0.5">Optimized for high emotional index and click curiosity. Click copy icon to clipboard.</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {report.recommendations.titles.map((title, index) => (
                      <div 
                        key={index} 
                        className="p-3 bg-zinc-900/20 hover:bg-zinc-900/60 border border-zinc-800 rounded-lg flex items-center justify-between gap-4 text-xs text-zinc-300"
                      >
                        <span className="truncate pr-4 font-medium"><span className="text-zinc-500 mr-2">{index+1}.</span>{title}</span>
                        <button
                          onClick={() => handleCopy(title, `title-${index}`)}
                          className="p-1.5 text-zinc-500 hover:text-white rounded border border-zinc-800 hover:border-zinc-700 bg-zinc-950/30 flex-shrink-0 transition-colors"
                        >
                          {copiedStates[`title-${index}`] ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 20 Thumbnail Ideas Cards */}
                <div className="bg-[#0c0c0f] border border-[#1e1e24] rounded-xl p-5 space-y-4">
                  <div>
                    <h3 className="font-bold text-white text-base">20 Visual Thumbnail Directives</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">Structured composition templates specifying angle, expression, color schemes, and texts.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    {report.recommendations.thumbnailIdeas.map((idea, index) => (
                      <div 
                        key={index} 
                        className="bg-zinc-900/20 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between space-y-3.5 text-xs"
                      >
                        <div className="flex justify-between items-start border-b border-zinc-800 pb-2">
                          <span className="font-bold text-blue-400">IDEA #{index+1}</span>
                          <span className="px-2 py-0.5 rounded font-mono text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            CTR Boost
                          </span>
                        </div>
                        <div className="space-y-1.5 text-zinc-300 flex-1">
                          <p><strong className="text-zinc-500">Layout:</strong> {idea.layout}</p>
                          <p><strong className="text-zinc-500">Angle:</strong> {idea.cameraAngle}</p>
                          <p><strong className="text-zinc-500">Colors:</strong> {idea.colorPalette}</p>
                          <p><strong className="text-zinc-500">Expression:</strong> {idea.animalExpression}</p>
                        </div>
                        <div className="bg-zinc-950 p-2 rounded border border-zinc-900 text-center font-bold text-yellow-400 text-xs">
                          {idea.textOverlay || "NO TEXT"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* 3. HOOK & STORY FLOW */}
            {activeTab === "hook" && (
              <div className="space-y-6">
                
                {/* Hook Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-[#0c0c0f] border border-zinc-800 rounded-xl p-5 space-y-3">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Intro Hook Score</span>
                    <span className="text-3xl font-extrabold text-white">{report.hookAnalysis.score}/100</span>
                    <p className="text-xs text-zinc-400 leading-normal pt-1.5">{report.hookAnalysis.viewerRetention}</p>
                  </div>
                  <div className="bg-[#0c0c0f] border border-zinc-800 rounded-xl p-5 space-y-3">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">First 30s Drop Prediction</span>
                    <span className="text-3xl font-extrabold text-rose-400">{report.hookAnalysis.dropRatePrediction.split(" ")[0]} Loss</span>
                    <p className="text-xs text-zinc-400 leading-normal pt-1.5">{report.hookAnalysis.dropRatePrediction}</p>
                  </div>
                  <div className="bg-[#0c0c0f] border border-zinc-800 rounded-xl p-5 space-y-3">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Hook Strength Factor</span>
                    <span className="text-3xl font-extrabold text-emerald-400">{report.hookAnalysis.hookStrength}</span>
                    <div className="flex gap-2 text-[10px] text-zinc-500 font-mono mt-2 pt-1 border-t border-zinc-850">
                      <span>0-5s: {report.hookAnalysis.retention0to5s}%</span>
                      <span>0-10s: {report.hookAnalysis.retention0to10s}%</span>
                      <span>0-30s: {report.hookAnalysis.retention0to30s}%</span>
                    </div>
                  </div>
                </div>

                {/* Story Flow Pacing Annotations */}
                <div className="bg-[#0c0c0f] border border-[#1e1e24] rounded-xl p-5 space-y-4">
                  <h3 className="font-bold text-white text-base">Transcript Pacing & Story Flow</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-zinc-300 pb-2 border-b border-zinc-800/60">
                    <div>
                      <p className="py-1.5"><strong className="text-zinc-500">Pacing Speed:</strong> {report.storyFlow.pacing}</p>
                      <p className="py-1.5"><strong className="text-zinc-500">Cut Frequency:</strong> {report.storyFlow.cutFrequency}</p>
                    </div>
                    <div>
                      <p className="py-1.5"><strong className="text-zinc-500">Video Climax:</strong> Peak retention expected at {report.storyFlow.climaxTime}</p>
                      <p className="py-1.5"><strong className="text-zinc-500">Pause Breaks:</strong> {report.storyFlow.pauseIntervals}</p>
                    </div>
                  </div>

                  {/* Flow Segments Timeline */}
                  <div className="space-y-3 mt-4">
                    <span className="text-xs font-bold text-zinc-400 block mb-2">Segment Timeline Breakdown</span>
                    {report.storyFlow.segments.map((seg, idx) => (
                      <div key={idx} className="p-3 bg-zinc-900/20 border border-zinc-800 rounded-lg flex items-start gap-4 text-xs">
                        <span className="px-2 py-0.5 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded font-mono font-bold text-[10px] flex-shrink-0 self-center">
                          {seg.timeRange}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between font-bold text-zinc-200">
                            <span>{seg.segmentType}</span>
                            <span className="text-[10px] text-zinc-500 font-mono">Impact: {seg.impactScore}/100</span>
                          </div>
                          <p className="text-[10px] text-zinc-500 mt-1">{seg.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* 4. EDITING & AUDIO */}
            {activeTab === "editing" && (
              <div className="space-y-6">
                
                {/* Grid of details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Editing style */}
                  <div className="bg-[#0c0c0f] border border-zinc-800 rounded-xl p-5 space-y-4">
                    <h3 className="font-bold text-white text-sm flex items-center gap-1.5 border-b border-zinc-800 pb-2.5">
                      <FileText className="h-4 w-4 text-blue-500" /> Editing Indicators
                    </h3>
                    <div className="space-y-3.5 text-xs text-zinc-300">
                      <div>
                        <span className="text-zinc-500 block">Cut Pacing</span>
                        <span className="font-semibold text-zinc-200 mt-0.5 block">{report.editingAnalysis.cutSpeed}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block">Camera Zoom Techniques</span>
                        <span className="font-semibold text-zinc-200 mt-0.5 block">{report.editingAnalysis.zoomUsage}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block">Replays & Slow-motion</span>
                        <span className="font-semibold text-zinc-200 mt-0.5 block">{report.editingAnalysis.replayUsage} / {report.editingAnalysis.slowMotion}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block">Effects & Transitions</span>
                        <span className="font-semibold text-zinc-200 mt-0.5 block">{report.editingAnalysis.effects} / {report.editingAnalysis.transitions}</span>
                      </div>
                    </div>
                  </div>

                  {/* Audio details */}
                  <div className="bg-[#0c0c0f] border border-zinc-800 rounded-xl p-5 space-y-4">
                    <h3 className="font-bold text-white text-sm flex items-center gap-1.5 border-b border-zinc-800 pb-2.5">
                      <Volume2 className="h-4 w-4 text-blue-500" /> Audio Analysis
                    </h3>
                    <div className="space-y-3.5 text-xs text-zinc-300">
                      <div>
                        <span className="text-zinc-500 block">Music Mood & Sync</span>
                        <span className="font-semibold text-zinc-200 mt-0.5 block">{report.audioAnalysis.bgMusicMood}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block">Meme Sound FX Rate</span>
                        <span className="font-semibold text-zinc-200 mt-0.5 block">{report.audioAnalysis.memeSoundFrequency}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block">Audio Gain Balance</span>
                        <span className="font-semibold text-zinc-200 mt-0.5 block">{report.audioAnalysis.volumeBalance}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block">Animal Sound Ratio / Laugh tracks</span>
                        <span className="font-semibold text-zinc-200 mt-0.5 block">{report.audioAnalysis.animalSoundsPercentage}% sound share / {report.audioAnalysis.laughterTrack ? "laughter sync active" : "no laugh tracks"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Subtitle details */}
                  <div className="bg-[#0c0c0f] border border-zinc-800 rounded-xl p-5 space-y-4">
                    <h3 className="font-bold text-white text-sm flex items-center gap-1.5 border-b border-zinc-800 pb-2.5">
                      <Sparkles className="h-4 w-4 text-blue-500" /> Subtitle Styling
                    </h3>
                    <div className="space-y-3.5 text-xs text-zinc-300 font-mono">
                      <div>
                        <span className="text-zinc-500 font-sans block">Primary Typography Font</span>
                        <span className="font-bold text-white mt-0.5 block">{report.subtitleAnalysis.fontName}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 font-sans block">Font Size / Placement</span>
                        <span className="font-semibold text-zinc-200 mt-0.5 block">{report.subtitleAnalysis.fontSize} / {report.subtitleAnalysis.position}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 font-sans block">Primary Font Colors</span>
                        <span className="font-semibold text-zinc-200 mt-0.5 block">{report.subtitleAnalysis.textColor}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 font-sans block">Subtitle Pop Speed</span>
                        <span className="font-semibold text-zinc-200 mt-0.5 block">{report.subtitleAnalysis.appearanceSpeed}</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* 5. SEO & RPM ANALYSIS */}
            {activeTab === "seo" && (
              <div className="space-y-6">
                
                {/* CPM prediction row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* RPM predictions */}
                  <div className="bg-[#0c0c0f] border border-zinc-800 rounded-xl p-5 space-y-4">
                    <h3 className="font-bold text-white text-base flex items-center gap-1.5">
                      <DollarSign className="h-4.5 w-4.5 text-emerald-400" /> RPM & Revenue Predictions
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-xs text-zinc-300">
                      <div className="bg-zinc-900/30 p-3 rounded-lg border border-zinc-800/80">
                        <span className="text-zinc-500">Estimated RPM</span>
                        <span className="font-extrabold text-white text-lg block mt-1">${report.rpmPrediction.estimatedRpm}</span>
                      </div>
                      <div className="bg-zinc-900/30 p-3 rounded-lg border border-zinc-800/80">
                        <span className="text-zinc-500">Estimated CPM</span>
                        <span className="font-extrabold text-white text-lg block mt-1">${report.rpmPrediction.estimatedCpm}</span>
                      </div>
                      <div className="bg-[#10b981]/5 p-3 rounded-lg border border-[#10b981]/10 col-span-2">
                        <span className="text-zinc-400 block font-medium">Expected Revenue based on Views</span>
                        <span className="font-black text-emerald-400 text-2xl block mt-1">${report.rpmPrediction.expectedRevenue.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="pt-2 text-[10px] space-y-2 border-t border-zinc-850 text-zinc-400">
                      <div className="flex justify-between"><span>Advertiser Friendly Status:</span> <span className="text-emerald-400 font-bold">{report.rpmPrediction.advertiserFriendly ? "Approved" : "Unfriendly"}</span></div>
                      <div className="flex justify-between"><span>Kids Safe Category:</span> <span className="text-emerald-400 font-bold">{report.rpmPrediction.kidsFriendly ? "Yes" : "No"}</span></div>
                      <div className="flex justify-between"><span>High CPM Tier-1 Audience:</span> <span className="text-white font-mono">{report.rpmPrediction.tier1Percent}% USA/UK share</span></div>
                    </div>
                  </div>

                  {/* SEO Keyword Density */}
                  <div className="bg-[#0c0c0f] border border-zinc-800 rounded-xl p-5 space-y-4 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-white text-base flex items-center gap-1.5">
                        <Activity className="h-4.5 w-4.5 text-blue-500" /> Search Optimization & Metadata
                      </h3>
                      <p className="text-xs text-zinc-500 mt-0.5">Title and Description compliance values.</p>
                    </div>

                    <div className="space-y-3.5 text-xs text-zinc-300">
                      <div className="grid grid-cols-2 py-1 border-b border-zinc-800/40">
                        <span className="text-zinc-500">Keyword Density Profile</span>
                        <span className="font-bold text-white text-right">{report.seoAnalysis.keywordDensity}</span>
                      </div>
                      <div className="grid grid-cols-2 py-1 border-b border-zinc-800/40">
                        <span className="text-zinc-500">Search Volume Index</span>
                        <span className="font-bold text-emerald-400 text-right">{report.seoAnalysis.searchVolume}</span>
                      </div>
                      <div className="grid grid-cols-2 py-1 border-b border-zinc-800/40">
                        <span className="text-zinc-500">Competition Index</span>
                        <span className="font-bold text-amber-500 text-right">{report.seoAnalysis.competition}</span>
                      </div>
                      <div className="grid grid-cols-2 py-1">
                        <span className="text-zinc-500">Trend velocity</span>
                        <span className="font-bold text-emerald-400 text-right">{report.seoAnalysis.trendScore}/100</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* 50 SEO Keywords Tag Cloud */}
                <div className="bg-[#0c0c0f] border border-[#1e1e24] rounded-xl p-5 space-y-4">
                  <h3 className="font-bold text-white text-base">50 Tag Keywords Suggestions</h3>
                  <div className="flex flex-wrap gap-2">
                    {report.recommendations.seoKeywords.map((tag, idx) => (
                      <span 
                        key={idx}
                        onClick={() => handleCopy(tag, `tag-${idx}`)}
                        className="px-2.5 py-1 text-xs bg-zinc-900 border border-zinc-800 rounded-md hover:border-zinc-600 hover:text-white cursor-pointer transition-colors flex items-center gap-1 text-zinc-300 font-mono"
                      >
                        {tag} {copiedStates[`tag-${idx}`] ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3 text-zinc-600" />}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Youtube description & metadata copy areas */}
                <div className="bg-[#0c0c0f] border border-zinc-800 rounded-xl p-5 space-y-4">
                  <h3 className="font-bold text-white text-base">Description & Chapters copy blocks</h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
                    {/* Description */}
                    <div className="space-y-1.5 relative">
                      <span className="font-bold text-zinc-500">Formatted Description Template</span>
                      <textarea
                        readOnly
                        value={report.recommendations.youtubeDescription}
                        className="w-full h-40 bg-zinc-950/80 border border-zinc-800 rounded-lg p-3 text-zinc-300 font-mono text-[10px] resize-none outline-none leading-relaxed"
                      />
                      <button
                        onClick={() => handleCopy(report.recommendations.youtubeDescription, "desc")}
                        className="absolute right-3.5 top-8 p-1.5 text-zinc-400 hover:text-white border border-zinc-800 bg-zinc-900/60 rounded transition-colors"
                      >
                        {copiedStates["desc"] ? "Copied!" : "Copy Desc"}
                      </button>
                    </div>

                    {/* Chapter & Pinned comment */}
                    <div className="space-y-4">
                      <div className="space-y-1.5 relative">
                        <span className="font-bold text-zinc-500">Pinned Comment Blueprint</span>
                        <textarea
                          readOnly
                          value={report.recommendations.pinnedComment}
                          className="w-full h-16 bg-zinc-950/80 border border-zinc-800 rounded-lg p-3 text-zinc-300 font-mono text-[10px] resize-none outline-none"
                        />
                        <button
                          onClick={() => handleCopy(report.recommendations.pinnedComment, "pinned")}
                          className="absolute right-3.5 top-8 p-1.5 text-zinc-400 hover:text-white border border-zinc-800 bg-zinc-900/60 rounded transition-colors"
                        >
                          {copiedStates["pinned"] ? "Copied!" : "Copy"}
                        </button>
                      </div>

                      <div className="space-y-1 bg-zinc-900/10 p-3 rounded-lg border border-zinc-850">
                        <span className="font-bold text-zinc-500 block mb-1">Hashtags</span>
                        <div className="flex flex-wrap gap-1.5">
                          {report.recommendations.hashtags.map((h, idx) => (
                            <span key={idx} className="font-mono text-blue-400 font-medium">{h}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* 6. AUDIENCE & RETENTION */}
            {activeTab === "audience" && (
              <div className="space-y-6">
                
                {/* Retention Curve Plot */}
                <div className="bg-[#0c0c0f] border border-[#1e1e24] rounded-xl p-5 flex flex-col">
                  <div>
                    <h3 className="font-bold text-white text-base">Predicted Viewer Retention Curve</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">Simulated benchmark of timeline drop-offs based on transcript complexity. Categories: {report.retentionPrediction.overallTrend}</p>
                  </div>

                  <div className="h-[260px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={getRetentionData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e1e24" />
                        <XAxis dataKey="time" stroke="#71717a" fontSize={11} tickLine={false} />
                        <YAxis stroke="#71717a" fontSize={11} tickLine={false} domain={[0, 100]} />
                        <ChartTooltip 
                          contentStyle={{ 
                            backgroundColor: "#0c0c0f", 
                            borderColor: "#1e1e24", 
                            color: "#fafafa",
                            borderRadius: "8px"
                          }} 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="retention" 
                          stroke="#2563eb" 
                          strokeWidth={2.5}
                          dot={{ fill: "#3b82f6", r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Demographics Split */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Geographic & language */}
                  <div className="bg-[#0c0c0f] border border-zinc-800 rounded-xl p-5 space-y-4">
                    <h3 className="font-bold text-white text-sm flex items-center gap-1.5 border-b border-zinc-800 pb-2.5">
                      <Users className="h-4.5 w-4.5 text-blue-500" /> Geographic & Demographics Profile
                    </h3>
                    <div className="space-y-4 text-xs">
                      <div>
                        <span className="text-zinc-500 block mb-1">Top Countries (Audience share)</span>
                        <div className="space-y-1.5">
                          {report.audienceAnalysis.topCountries.map((c, i) => (
                            <div key={i} className="flex justify-between items-center text-zinc-300 font-mono">
                              <span>{c.country}</span>
                              <span className="font-bold text-white">{c.percentage}%</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-zinc-850 pt-3">
                        <span className="text-zinc-500 block mb-1.5">Gender Distribution</span>
                        <div className="flex justify-between text-zinc-300 font-mono">
                          <span>Female: <strong className="text-white">{report.audienceAnalysis.genderDistribution.female}%</strong></span>
                          <span>Male: <strong className="text-white">{report.audienceAnalysis.genderDistribution.male}%</strong></span>
                          <span>Other: <strong className="text-white">{report.audienceAnalysis.genderDistribution.other}%</strong></span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Device & Upload sugerence */}
                  <div className="bg-[#0c0c0f] border border-zinc-800 rounded-xl p-5 space-y-4">
                    <h3 className="font-bold text-white text-sm flex items-center gap-1.5 border-b border-zinc-800 pb-2.5">
                      <Calendar className="h-4.5 w-4.5 text-blue-500" /> Upload Suggestion & Device share
                    </h3>
                    <div className="space-y-3.5 text-xs text-zinc-300">
                      <div>
                        <span className="text-zinc-500 block">Best Day to Upload</span>
                        <span className="font-bold text-emerald-400 mt-0.5 block">{report.uploadTimeAnalysis.bestDay}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block">Best Hours (Peak CTR window)</span>
                        <span className="font-bold text-emerald-400 mt-0.5 block">{report.uploadTimeAnalysis.bestHour}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block">Suggested Schedule Strategy</span>
                        <span className="font-semibold text-zinc-200 mt-0.5 block leading-relaxed">{report.uploadTimeAnalysis.suggestedSchedule}</span>
                      </div>
                      <div className="border-t border-zinc-850 pt-3">
                        <span className="text-zinc-500 block mb-1">Device Stats (Percentage views)</span>
                        <div className="flex justify-between font-mono text-[11px] text-zinc-400">
                          {report.audienceAnalysis.deviceStats.map((d, i) => (
                            <span key={i}>{d.device}: <strong className="text-white">{d.percentage}%</strong></span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* 50 Similar Viral Videos Comparator List */}
                <div className="bg-[#0c0c0f] border border-[#1e1e24] rounded-xl p-5 space-y-4">
                  <h3 className="font-bold text-white text-base">Similar Viral Competitors</h3>
                  <div className="space-y-2.5">
                    {report.similarVideos.map((video, idx) => (
                      <div 
                        key={idx} 
                        className="p-3 bg-zinc-900/20 hover:bg-zinc-900/60 border border-zinc-850 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex gap-3 items-center min-w-0">
                          <div className="h-9 w-14 bg-zinc-950 border border-zinc-800 rounded flex-shrink-0 flex items-center justify-center">
                            <Play className="h-4 w-4 text-blue-500 fill-blue-500 opacity-60" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-zinc-200 truncate pr-4">{video.title}</h4>
                            <span className="text-[10px] text-zinc-500 font-mono block mt-0.5">Length: {video.length} | Uploaded: {video.uploadDate}</span>
                          </div>
                        </div>
                        <div className="flex gap-5 font-mono text-[11px] text-zinc-400 self-end md:self-auto flex-shrink-0 border-t border-zinc-800/60 md:border-t-0 pt-2 md:pt-0">
                          <span>Views: <strong className="text-white">{formatNumber(video.views)}</strong></span>
                          <span>Likes: <strong className="text-white">{formatNumber(video.likes)}</strong></span>
                          <span>CTR: <strong className="text-emerald-400 font-bold">{video.ctr}%</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}

export default function VideoAnalyzer() {
  return (
    <Suspense fallback={
      <div className="p-8 text-center text-zinc-500 animate-pulse">
        Loading analyzer components...
      </div>
    }>
      <AnalyzeContent />
    </Suspense>
  );
}
