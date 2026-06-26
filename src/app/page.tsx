"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { 
  Search, 
  Flame, 
  Video, 
  TrendingUp, 
  Image as ImageIcon,
  DollarSign,
  ArrowRight,
  Play,
  Clock,
  ExternalLink,
  ChevronRight,
  Eye,
  MessageSquare,
  ThumbsUp
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from "recharts";

interface TrendItem {
  id: string;
  animal: string;
  score: number;
  status: string;
  growthRate: number;
}

interface AnalysisHistoryItem {
  id: string;
  url: string;
  title: string;
  channelName: string;
  duration: string;
  views: number;
  likes: number;
  comments: number;
  uploadDate: string;
  createdAt: string;
}

export default function Dashboard() {
  const router = useRouter();
  const { token, user } = useAuth();
  const [searchInput, setSearchInput] = useState("");
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loadingTrends, setLoadingTrends] = useState(true);

  // Fetch data on load
  useEffect(() => {
    fetch("http://localhost:5000/api/trends")
      .then(res => res.json())
      .then(data => {
        setTrends(data);
        setLoadingTrends(false);
      })
      .catch(err => {
        console.error("Error fetching trends:", err);
        setLoadingTrends(false);
      });

    if (token) {
      setLoadingHistory(true);
      fetch("http://localhost:5000/api/analysis", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setHistory(data);
          }
          setLoadingHistory(false);
        })
        .catch(err => {
          console.error("Error fetching history:", err);
          setLoadingHistory(false);
        });
    } else {
      setLoadingHistory(false);
    }
  }, [token]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    // Route to analyzer page with query parameters
    router.push(`/analyze?q=${encodeURIComponent(searchInput.trim())}`);
  };

  const getStatusColor = (status: string) => {
    if (status === "UP") return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
    if (status === "DOWN") return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
    return "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20";
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(0) + "K";
    return num.toString();
  };

  // ECharts default standard 500-level palette requested by references
  const colorsArray = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1"];

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-[1600px] mx-auto w-full">
      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Creator Dashboard
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Discover rising animal trends, analyze CTR/Thumbnail potential, and plan your next viral compilation.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 self-start">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-zinc-400">Database Connection Active ({user?.plan || "FREE"} Plan)</span>
        </div>
      </div>

      {/* Main Search Hook */}
      <div className="glass rounded-xl p-6 md:p-8 shadow-xl relative overflow-hidden border border-[#1e1e24] bg-[#0c0c0f]">
        <div className="absolute top-0 right-0 h-40 w-40 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-400 flex items-center gap-1.5 mb-2">
            <Flame className="h-4.5 w-4.5 text-amber-500 animate-bounce" /> Animal Trend Analyzer
          </span>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Nghiên cứu Video hoặc Từ khóa Động vật
          </h2>
          <p className="text-sm text-zinc-400 mt-1.5 mb-6">
            Nhập link YouTube video động vật (Funny Cats, Dog compilation...) hoặc từ khóa để phân tích Thumbnail, Title, Hook và nhận gợi ý 30 tiêu đề mới + kịch bản chi tiết.
          </p>
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <Search className="absolute left-4 h-5 w-5 text-zinc-500" />
            <input
              type="text"
              placeholder="Ví dụ: Funny Cats, Cute Baby Animals, https://www.youtube.com/watch?v=..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-[#09090b] border border-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg pl-12 pr-32 py-3.5 text-sm text-white placeholder-zinc-500 transition-all outline-none"
            />
            <button
              type="submit"
              className="absolute right-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs px-4 py-2.5 rounded-md transition-colors flex items-center gap-1.5 shadow-sm"
            >
              Analyze <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-[#0c0c0f] border border-zinc-800 rounded-xl p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-medium text-zinc-400">Rising Animal Topic</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Hot
            </span>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-extrabold text-white tracking-tight">
              {trends.length > 0 ? trends[0].animal : "Orange Cats"}
            </span>
            <span className="text-xs text-zinc-400 block mt-1 flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
              Growth score: {trends.length > 0 ? trends[0].score : 98}% (+24.5%)
            </span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-[#0c0c0f] border border-zinc-800 rounded-xl p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-medium text-zinc-400">Avg Thumbnail Score</span>
            <ImageIcon className="h-4.5 w-4.5 text-blue-500" />
          </div>
          <div className="mt-4">
            <span className="text-2xl font-extrabold text-white tracking-tight">84.2/100</span>
            <span className="text-xs text-zinc-400 block mt-1">Highly Click-Optimized</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-[#0c0c0f] border border-zinc-800 rounded-xl p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-medium text-zinc-400">Estimated RPM (Tier 1)</span>
            <DollarSign className="h-4.5 w-4.5 text-emerald-500" />
          </div>
          <div className="mt-4">
            <span className="text-2xl font-extrabold text-white tracking-tight">$2.45 - $3.80</span>
            <span className="text-xs text-zinc-400 block mt-1">USA Audience Dominance</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-[#0c0c0f] border border-zinc-800 rounded-xl p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-medium text-zinc-400">Active Viral Threshold</span>
            <Flame className="h-4.5 w-4.5 text-amber-500" />
          </div>
          <div className="mt-4">
            <span className="text-2xl font-extrabold text-white tracking-tight">Extreme</span>
            <span className="text-xs text-zinc-400 block mt-1">High retention category</span>
          </div>
        </div>
      </div>

      {/* Analytics Main Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Trend Growth Chart Card (Left 7 Cols) */}
        <div className="lg:col-span-7 bg-[#0c0c0f] border border-[#1e1e24] rounded-xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-white text-base">Trending Animal Scores</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Real-time interest tracker index across YouTube</p>
            </div>
            <span className="text-xs text-blue-500 font-medium flex items-center gap-1">
              Active Trends <ChevronRight className="h-3.5 w-3.5" />
            </span>
          </div>
          
          <div className="h-[320px] w-full mt-2">
            {loadingTrends ? (
              <div className="h-full w-full flex items-center justify-center text-zinc-500 text-sm animate-pulse">
                Loading trend visualization...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis 
                    dataKey="animal" 
                    stroke="#52525b" 
                    fontSize={11}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="#52525b" 
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: "#0c0c0f", 
                      borderColor: "#1e1e24", 
                      borderRadius: "8px",
                      color: "#fafafa" 
                    }}
                    cursor={{ fill: "rgba(38, 38, 38, 0.4)" }}
                  />
                  <Bar dataKey="score" radius={[4, 4, 0, 0]} maxBarSize={32}>
                    {trends.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colorsArray[index % colorsArray.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Recent Analyzed Reports Card (Right 5 Cols) */}
        <div className="lg:col-span-5 bg-[#0c0c0f] border border-[#1e1e24] rounded-xl p-5 flex flex-col h-[420px]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-white text-base">Recent Analyses</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Quick access to previously run research reports</p>
            </div>
            <Clock className="h-4.5 w-4.5 text-zinc-500" />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {loadingHistory ? (
              <div className="h-full w-full flex items-center justify-center text-zinc-500 text-sm animate-pulse">
                Loading history...
              </div>
            ) : history.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-zinc-800 rounded-lg">
                <Video className="h-8 w-8 text-zinc-600 mb-2" />
                <span className="text-zinc-500 text-xs font-medium">Chưa có video nào được phân tích</span>
                <span className="text-[10px] text-zinc-600 mt-1 max-w-[200px]">Hãy nhập link YouTube bên trên để bắt đầu nghiên cứu</span>
              </div>
            ) : (
              history.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => router.push(`/analyze?id=${item.id}`)}
                  className="p-3 bg-zinc-900/40 hover:bg-zinc-900/90 border border-zinc-800/80 rounded-lg transition-all cursor-pointer flex gap-3 items-start group"
                >
                  <div className="h-10 w-16 bg-zinc-950 rounded border border-zinc-800/60 overflow-hidden flex-shrink-0 relative flex items-center justify-center">
                    <Play className="h-4.5 w-4.5 text-blue-500 fill-blue-500 opacity-60 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-zinc-200 truncate group-hover:text-white transition-colors">
                      {item.title}
                    </h4>
                    <span className="text-[10px] text-zinc-500 mt-0.5 block truncate">
                      {item.channelName} • {item.duration}
                    </span>
                    <div className="flex items-center gap-3 mt-1.5 text-[9px] text-zinc-500 font-mono">
                      <span className="flex items-center gap-1"><Eye className="h-2.5 w-2.5" /> {formatNumber(item.views)}</span>
                      <span className="flex items-center gap-1"><ThumbsUp className="h-2.5 w-2.5" /> {formatNumber(item.likes)}</span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-zinc-400 self-center transition-colors flex-shrink-0" />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
