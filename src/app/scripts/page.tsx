"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { 
  FileText, 
  Clock, 
  ChevronRight, 
  Sparkles, 
  ArrowRight, 
  Film, 
  Music, 
  Video, 
  Type, 
  Trash2,
  ListRestart
} from "lucide-react";

interface ScriptListItem {
  id: string;
  title: string;
  duration: string;
  topic: string;
  createdAt: string;
}

interface Scene {
  time: string;
  visual: string;
  audio: string;
  subtitle: string;
  editingNote: string;
}

interface Chapter {
  title: string;
  duration: string;
  scenes: Scene[];
}

interface FullScript {
  title: string;
  duration: string;
  topic: string;
  chapters: Chapter[];
}

export default function ScriptGenerator() {
  const { token } = useAuth();
  const [topic, setTopic] = useState("");
  const [duration, setDuration] = useState("10");
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  
  const [scriptsList, setScriptsList] = useState<ScriptListItem[]>([]);
  const [selectedScriptId, setSelectedScriptId] = useState<string | null>(null);
  const [currentScript, setCurrentScript] = useState<FullScript | null>(null);
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(0);

  // Load scripts history on load
  const loadHistory = () => {
    if (!token) return;
    fetch("http://localhost:5000/api/scripts", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setScriptsList(data);
          if (data.length > 0 && !selectedScriptId) {
            // Default load the most recent script
            loadScriptDetails(data[0].id);
          }
        }
      })
      .catch(err => console.error("Error loading scripts history:", err));
  };

  useEffect(() => {
    if (token) {
      loadHistory();
    }
  }, [token]);

  const loadScriptDetails = (id: string) => {
    if (!token) return;
    setSelectedScriptId(id);
    fetch(`http://localhost:5000/api/scripts/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        setCurrentScript(data.script);
        setActiveChapterIndex(0);
      })
      .catch(err => console.error("Error fetching script details:", err));
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || !token) return;

    setLoading(true);
    setCurrentScript(null);
    
    // Animate status updates for premium AI feel
    const statuses = [
      "Analyzing viral topic potential...",
      "Structuring script segments and chapters...",
      "Drafting scene descriptions and comedic cuts...",
      "Writing voiceover dialogues and subtitle overlays...",
      "Finalizing editing markers and ASMR sound indicators..."
    ];
    
    let step = 0;
    setStatusMessage(statuses[0]);
    const interval = setInterval(() => {
      step++;
      if (step < statuses.length) {
        setStatusMessage(statuses[step]);
      }
    }, 1500);

    try {
      const response = await fetch("http://localhost:5000/api/scripts", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ topic, duration })
      });
      const data = await response.json();
      
      clearInterval(interval);
      setLoading(false);
      setTopic("");
      
      if (data.error) {
        alert("Error: " + data.error);
        return;
      }
      
      // Reload list and select the generated script
      loadHistory();
      setSelectedScriptId(data.id);
      setCurrentScript(data.script);
      setActiveChapterIndex(0);
    } catch (err) {
      console.error("Failed to generate script:", err);
      clearInterval(interval);
      setLoading(false);
      alert("System experienced a connection glitch. Please try again.");
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this script?") || !token) return;

    fetch(`http://localhost:5000/api/scripts/${id}`, { 
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(() => {
        if (selectedScriptId === id) {
          setSelectedScriptId(null);
          setCurrentScript(null);
        }
        loadHistory();
      })
      .catch(err => console.error("Error deleting script:", err));
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-[1600px] mx-auto w-full flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
          <FileText className="h-8 w-8 text-blue-500" /> AI Script Generator
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Automatically script 8 to 20 minute compilation videos including scene cues, sound effects, narrations, and editing directions.
        </p>
      </div>

      {/* Generator Input Panel */}
      <div className="glass rounded-xl p-5 border border-zinc-800 bg-[#0c0c0f]">
        <form onSubmit={handleGenerate} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 space-y-1.5 w-full">
            <label className="text-xs font-semibold text-zinc-400">Video Topic or Theme</label>
            <input
              type="text"
              placeholder="e.g. Mischievous Capybaras, Orange Cats Being Silly, Heartwarming Dog Rescues..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={loading}
              className="w-full bg-[#09090b] border border-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-500 transition-all outline-none"
            />
          </div>
          
          <div className="w-full md:w-48 space-y-1.5">
            <label className="text-xs font-semibold text-zinc-400">Target Duration</label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              disabled={loading}
              className="w-full bg-[#09090b] border border-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-4 py-2.5 text-sm text-white transition-all outline-none cursor-pointer"
            >
              <option value="8">8 Minutes</option>
              <option value="10">10 Minutes</option>
              <option value="15">15 Minutes</option>
              <option value="20">20 Minutes</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading || !topic.trim()}
            className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed text-white font-medium text-sm px-6 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? "Generating..." : "Create Script"}{" "}
            <Sparkles className="h-4 w-4 text-amber-400 animate-spin" />
          </button>
        </form>
      </div>

      {/* Main Split Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        
        {/* Left Panel: Saved Scripts History (4 cols) */}
        <div className="lg:col-span-4 bg-[#0c0c0f] border border-[#1e1e24] rounded-xl p-4 flex flex-col h-[550px] min-h-0">
          <h3 className="font-bold text-white text-sm mb-3 flex items-center gap-1.5">
            <ListRestart className="h-4 w-4 text-zinc-400" /> Saved Script Drafts
          </h3>
          
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {scriptsList.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-zinc-800 rounded-lg">
                <FileText className="h-8 w-8 text-zinc-700 mb-2" />
                <span className="text-zinc-500 text-xs font-medium">Chưa có kịch bản nào được lưu</span>
                <span className="text-[10px] text-zinc-600 mt-1 max-w-[180px]">Nhập chủ đề phía trên để tạo kịch bản tự động</span>
              </div>
            ) : (
              scriptsList.map((item) => (
                <div
                  key={item.id}
                  onClick={() => loadScriptDetails(item.id)}
                  className={`p-3 border rounded-lg transition-all cursor-pointer flex justify-between items-start group relative ${
                    selectedScriptId === item.id
                      ? "bg-blue-600/10 border-blue-500/50 text-blue-400"
                      : "bg-zinc-900/30 border-zinc-800/80 hover:bg-zinc-900/60 text-zinc-300"
                  }`}
                >
                  <div className="min-w-0 pr-6">
                    <h4 className="text-xs font-semibold truncate group-hover:text-white transition-colors">
                      {item.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-zinc-500">
                      <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" /> {item.duration}</span>
                      <span>•</span>
                      <span className="truncate max-w-[120px]">{item.topic}</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDelete(item.id, e)}
                    className="opacity-0 group-hover:opacity-100 absolute right-2.5 top-2.5 p-1 text-zinc-500 hover:text-rose-500 rounded transition-opacity"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Panel: Active Script Viewer (8 cols) */}
        <div className="lg:col-span-8 bg-[#0c0c0f] border border-[#1e1e24] rounded-xl flex flex-col h-[550px] overflow-hidden min-h-0 relative">
          
          {loading ? (
            /* Premium Loading Animation */
            <div className="absolute inset-0 bg-[#0c0c0f] flex flex-col items-center justify-center p-8 z-25">
              <div className="h-12 w-12 rounded-full border-2 border-blue-600/30 border-t-blue-500 animate-spin mb-4" />
              <span className="text-sm font-semibold text-white tracking-wide animate-pulse">
                {statusMessage}
              </span>
              <p className="text-xs text-zinc-500 mt-2">Writing compilation blueprint. Please wait a moment.</p>
            </div>
          ) : null}

          {currentScript ? (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Script Title Header */}
              <div className="p-5 border-b border-[#1e1e24] bg-zinc-900/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 flex-shrink-0">
                <div>
                  <h3 className="font-extrabold text-white text-base tracking-tight">{currentScript.title}</h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-zinc-400">
                    <span className="font-semibold text-zinc-300">Topic: {currentScript.topic}</span>
                    <span>•</span>
                    <span>Duration: {currentScript.duration}</span>
                  </div>
                </div>
              </div>

              {/* Chapter Tabs */}
              <div className="px-5 py-2 border-b border-[#1e1e24] bg-zinc-950/20 flex gap-2 overflow-x-auto flex-shrink-0">
                {currentScript.chapters.map((ch, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveChapterIndex(idx)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors flex-shrink-0 ${
                      activeChapterIndex === idx
                        ? "bg-blue-600 text-white"
                        : "bg-zinc-900/60 text-zinc-400 hover:text-white"
                    }`}
                  >
                    Ch.{idx + 1}: {ch.title.split(" (")[0]}
                  </button>
                ))}
              </div>

              {/* Scene Breakdown List */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Film className="h-4 w-4" /> Scene-by-Scene Timeline
                </h4>
                
                {currentScript.chapters[activeChapterIndex]?.scenes.map((scene, sIdx) => (
                  <div 
                    key={sIdx}
                    className="border border-zinc-800 bg-zinc-900/20 rounded-xl p-4 space-y-4 hover:border-zinc-800 transition-colors"
                  >
                    {/* Timestamp & Header */}
                    <div className="flex justify-between items-center border-b border-zinc-800/80 pb-2">
                      <span className="text-xs font-mono font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/10">
                        {scene.time}
                      </span>
                      <span className="text-[10px] font-bold text-zinc-500">SCENE #{sIdx + 1}</span>
                    </div>

                    {/* Content Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      
                      {/* Visual */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                          <Video className="h-3.5 w-3.5 text-blue-500" /> Visual Cue
                        </span>
                        <p className="text-zinc-300 leading-relaxed bg-zinc-950/40 p-2.5 rounded border border-zinc-900">{scene.visual}</p>
                      </div>

                      {/* Audio */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                          <Music className="h-3.5 w-3.5 text-emerald-500" /> Audio & Sound
                        </span>
                        <p className="text-zinc-300 leading-relaxed bg-zinc-950/40 p-2.5 rounded border border-zinc-900">{scene.audio}</p>
                      </div>

                      {/* Subtitle */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                          <Type className="h-3.5 w-3.5 text-purple-500" /> On-Screen Subtitle
                        </span>
                        <p className="text-zinc-200 font-mono font-semibold bg-zinc-950/60 p-2.5 rounded border border-zinc-900">
                          {scene.subtitle}
                        </p>
                      </div>

                      {/* Editing Directions */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                          <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Editing Direction
                        </span>
                        <p className="text-zinc-300 leading-relaxed bg-zinc-950/40 p-2.5 rounded border border-zinc-900">{scene.editingNote}</p>
                      </div>
                      
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <FileText className="h-10 w-10 text-zinc-800 mb-2 animate-bounce" />
              <span className="text-zinc-500 text-sm font-semibold">Chưa chọn kịch bản nào</span>
              <p className="text-xs text-zinc-600 mt-1 max-w-[240px]">
                Chọn một kịch bản từ cột bên trái hoặc tạo một kịch bản mới ở trên.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
