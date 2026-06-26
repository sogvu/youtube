"use client";

import { useState, useEffect } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertTriangle, 
  Sparkles, 
  Flame, 
  BarChart2, 
  Zap, 
  Percent, 
  Calendar,
  Compass
} from "lucide-react";
import { 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar,
  Tooltip
} from "recharts";

interface TrendItem {
  id: string;
  animal: string;
  score: number;
  status: string;
  growthRate: number;
}

interface ForecastItem {
  id: string;
  timeframe: string;
  category: string;
  confidence: number;
  volumePrediction: string;
  description: string;
}

export default function TrendCenter() {
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [forecasts, setForecasts] = useState<ForecastItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch trends and forecasts
    Promise.all([
      fetch("http://localhost:5000/api/trends").then(r => r.json()),
      fetch("http://localhost:5000/api/trends/forecast").then(r => r.json())
    ])
      .then(([trendsData, forecastsData]) => {
        setTrends(trendsData);
        setForecasts(forecastsData);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching trend center data:", err);
        setLoading(false);
      });
  }, []);

  const getStatusIcon = (status: string) => {
    if (status === "UP") return <TrendingUp className="h-4 w-4 text-emerald-400" />;
    if (status === "DOWN") return <TrendingDown className="h-4 w-4 text-rose-400" />;
    return <Minus className="h-4 w-4 text-zinc-400" />;
  };

  const getStatusPill = (status: string, rate: number) => {
    const isUp = status === "UP";
    const isDown = status === "DOWN";
    
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 border ${
        isUp 
          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
          : isDown 
            ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
            : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
      }`}>
        {getStatusIcon(status)}
        {isUp ? "+" : ""}{rate}%
      </span>
    );
  };

  const getTrendWarnings = () => {
    return [
      "🔥 Orange Cats interest score has surged to 98/100. This is the highest volume peak in 6 months.",
      "⚠️ Golden Retriever testing videos (IQ test, obstacle course) show a 45% weekly search index increment.",
      "🚀 Otter ASMR content volume in Tier-1 countries has hit active alert threshold (+31.8% velocity)."
    ];
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-[1600px] mx-auto w-full">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
          <Compass className="h-8 w-8 text-blue-500" /> Animal Trend Center
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Monitor rising search terms, detect high-velocity viral breakout topics, and forecast content trends for the next 90 days.
        </p>
      </div>

      {loading ? (
        <div className="h-[400px] w-full flex items-center justify-center text-zinc-500 text-sm animate-pulse">
          Loading trend center assets...
        </div>
      ) : (
        <>
          {/* Trend Alerts Banner */}
          <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-5 space-y-3">
            <h3 className="text-xs font-bold text-amber-500 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="h-4.5 w-4.5" /> High Velocity Breakout Alerts
            </h3>
            <ul className="space-y-1.5 text-sm text-zinc-300">
              {getTrendWarnings().map((w, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Grid Split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Animals Grid List (Left 7 Cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-base">Popularity Index</h3>
                <span className="text-[10px] text-zinc-500 font-mono">UPDATED: TODAY</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {trends.map((item) => (
                  <div 
                    key={item.id}
                    className="p-5 bg-[#0c0c0f] border border-zinc-800 rounded-xl flex items-center justify-between hover:border-zinc-700 transition-all group"
                  >
                    <div>
                      <h4 className="font-bold text-zinc-200 group-hover:text-white transition-colors">{item.animal}</h4>
                      <div className="mt-2.5 flex items-baseline gap-2">
                        <span className="text-2xl font-extrabold text-white tracking-tight">{item.score}</span>
                        <span className="text-[10px] text-zinc-500 font-mono">/ 100</span>
                      </div>
                    </div>
                    <div>
                      {getStatusPill(item.status, item.growthRate)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Interest Distribution Radar Chart (Right 5 Cols) */}
            <div className="lg:col-span-5 bg-[#0c0c0f] border border-[#1e1e24] rounded-xl p-5 flex flex-col justify-between h-full min-h-[380px]">
              <div>
                <h3 className="font-bold text-white text-base">Distribution Profile</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Visual representation of active niche volume shares</p>
              </div>

              <div className="h-[280px] w-full flex items-center justify-center mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={trends}>
                    <PolarGrid stroke="#1e1e24" />
                    <PolarAngleAxis dataKey="animal" stroke="#a1a1aa" fontSize={10} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#52525b" fontSize={9} />
                    <Radar
                      name="Score"
                      dataKey="score"
                      stroke="#2563eb"
                      fill="#3b82f6"
                      fillOpacity={0.15}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "#0c0c0f", 
                        borderColor: "#1e1e24", 
                        color: "#fafafa" 
                      }} 
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* 7d/30d/90d Trend Forecasts Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-500" />
              <h3 className="font-bold text-white text-lg">Predictive Trend Forecast</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 7-Day Forecast */}
              <div className="bg-[#0c0c0f] border border-zinc-800 rounded-xl p-6 relative overflow-hidden flex flex-col justify-between h-64 hover:border-zinc-700 transition-colors">
                <div className="absolute top-0 right-0 p-3 bg-blue-500/10 text-blue-400 border-l border-b border-zinc-800 rounded-bl-lg font-mono text-[10px] font-bold">
                  7-DAY OUTLOOK
                </div>
                <div>
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest block">Short-Term Catalyst</span>
                  {forecasts.filter(f => f.timeframe === "7d").map((f) => (
                    <div key={f.id} className="mt-4 space-y-2">
                      <h4 className="font-extrabold text-white text-base">{f.category}</h4>
                      <div className="flex items-center gap-2.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
                          <Zap className="h-3 w-3" /> {f.volumePrediction}
                        </span>
                        <span className="text-xs text-zinc-400 flex items-center gap-0.5">
                          Confidence: <span className="text-white font-bold">{f.confidence}%</span>
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed mt-2.5">{f.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 30-Day Forecast */}
              <div className="bg-[#0c0c0f] border border-zinc-800 rounded-xl p-6 relative overflow-hidden flex flex-col justify-between h-64 hover:border-zinc-700 transition-colors">
                <div className="absolute top-0 right-0 p-3 bg-indigo-500/10 text-indigo-400 border-l border-b border-zinc-800 rounded-bl-lg font-mono text-[10px] font-bold">
                  30-DAY OUTLOOK
                </div>
                <div>
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest block">Medium-Term Strategy</span>
                  {forecasts.filter(f => f.timeframe === "30d").map((f) => (
                    <div key={f.id} className="mt-4 space-y-2">
                      <h4 className="font-extrabold text-white text-base">{f.category}</h4>
                      <div className="flex items-center gap-2.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                          <BarChart2 className="h-3 w-3" /> {f.volumePrediction}
                        </span>
                        <span className="text-xs text-zinc-400 flex items-center gap-0.5">
                          Confidence: <span className="text-white font-bold">{f.confidence}%</span>
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed mt-2.5">{f.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 90-Day Forecast */}
              <div className="bg-[#0c0c0f] border border-zinc-800 rounded-xl p-6 relative overflow-hidden flex flex-col justify-between h-64 hover:border-zinc-700 transition-colors">
                <div className="absolute top-0 right-0 p-3 bg-purple-500/10 text-purple-400 border-l border-b border-zinc-800 rounded-bl-lg font-mono text-[10px] font-bold">
                  90-DAY OUTLOOK
                </div>
                <div>
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest block">Long-Term Ingestion</span>
                  {forecasts.filter(f => f.timeframe === "90d").map((f) => (
                    <div key={f.id} className="mt-4 space-y-2">
                      <h4 className="font-extrabold text-white text-base">{f.category}</h4>
                      <div className="flex items-center gap-2.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {f.volumePrediction}
                        </span>
                        <span className="text-xs text-zinc-400 flex items-center gap-0.5">
                          Confidence: <span className="text-white font-bold">{f.confidence}%</span>
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed mt-2.5">{f.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
