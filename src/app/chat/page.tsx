"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/AuthProvider";
import { MessageSquare, Send, Sparkles, User, Database, Flame, Bot, AlertCircle, HelpCircle, Loader2 } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AnalysisItem {
  id: string;
  title: string;
  channelName: string;
}

export default function ChatPage() {
  const { token } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Xin chào! Tớ là trợ lý AnimalTrend AI. Tớ có thể giúp gì cho bạn trong việc tối ưu hóa thumbnail, tiêu đề, kịch bản hoặc phân tích giữ chân người xem video?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [analyses, setAnalyses] = useState<AnalysisItem[]>([]);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string>("");
  const [error, setError] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Load user's analysis history to allow selecting context
  useEffect(() => {
    if (token) {
      fetch("http://localhost:5000/api/analysis", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            // Only take completed analyses
            const completed = data.filter(item => item.status === "COMPLETED");
            setAnalyses(completed);
            if (completed.length > 0) {
              setSelectedAnalysisId(completed[0].id);
            }
          }
        })
        .catch(err => console.error("Error loading analysis list for chat:", err));
    }
  }, [token]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !token || loading) return;

    const userMessage = input.trim();
    setInput("");
    setError("");
    setMessages(prev => [...prev, { role: "user", content: userMessage, timestamp: new Date() }]);
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          message: userMessage,
          analysisId: selectedAnalysisId || undefined
        })
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error || "Gặp sự cố khi gửi tin nhắn cho AI.");
        return;
      }

      setMessages(prev => [...prev, { role: "assistant", content: data.response, timestamp: new Date() }]);
    } catch (err) {
      console.error(err);
      setLoading(false);
      setError("Không thể kết nối với cổng AI. Vui lòng kiểm tra lại mạng.");
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-[#09090b] text-[#fafafa] overflow-hidden select-none">
      
      {/* Top Header Panel */}
      <div className="p-4 border-b border-[#1e1e24] bg-[#0c0c0f]/80 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-10">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2 text-white">
            <MessageSquare className="h-5.5 w-5.5 text-blue-500" /> AI Research Workspace
          </h1>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            Trò chuyện trực tiếp với AI về các chỉ số, kịch bản hoặc đề xuất cải thiện CTR video động vật.
          </p>
        </div>

        {/* Context Selector */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Ngữ cảnh Video:</span>
          {analyses.length > 0 ? (
            <select
              value={selectedAnalysisId}
              onChange={(e) => setSelectedAnalysisId(e.target.value)}
              className="bg-[#09090b] border border-zinc-800 focus:border-blue-500 text-xs text-zinc-300 font-medium rounded-lg p-2 outline-none max-w-[240px] truncate transition-all"
            >
              <option value="">-- Không sử dụng ngữ cảnh --</option>
              {analyses.map(item => (
                <option key={item.id} value={item.id}>
                  {item.title} ({item.channelName})
                </option>
              ))}
            </select>
          ) : (
            <span className="text-[11px] text-zinc-600 italic">
              Chưa có video được phân tích để làm ngữ cảnh.
            </span>
          )}
        </div>
      </div>

      {/* Main Chat Workspace */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 flex flex-col">
        {messages.map((msg, idx) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={idx}
              className={`flex gap-3 max-w-[85%] ${
                isUser ? "self-end flex-row-reverse" : "self-start"
              }`}
            >
              {/* Avatar */}
              <div
                className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 border ${
                  isUser
                    ? "bg-blue-600/10 border-blue-500/20 text-blue-400"
                    : "bg-purple-600/10 border-purple-500/20 text-purple-400"
                }`}
              >
                {isUser ? <User className="h-4.5 w-4.5" /> : <Bot className="h-4.5 w-4.5" />}
              </div>

              {/* Speech bubble */}
              <div
                className={`p-4 rounded-2xl text-sm leading-relaxed border ${
                  isUser
                    ? "bg-blue-600/10 border-blue-500/20 text-blue-100 rounded-tr-none"
                    : "bg-zinc-900/40 border-zinc-800/80 text-zinc-300 rounded-tl-none"
                }`}
              >
                <div className="whitespace-pre-line">{msg.content}</div>
                <div className="mt-2 text-[10px] text-zinc-500 text-right">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-3 max-w-[80%] self-start">
            <div className="h-9 w-9 rounded-full bg-purple-600/10 border border-purple-500/20 flex items-center justify-center shrink-0">
              <Bot className="h-4.5 w-4.5 text-purple-400" />
            </div>
            <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 rounded-tl-none flex items-center gap-2 text-xs text-zinc-400">
              <Loader2 className="h-4 w-4 text-purple-500 animate-spin" />
              <span>AnimalTrend AI đang suy nghĩ...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-start gap-2.5 max-w-md self-center">
            <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Questions panel */}
      {messages.length === 1 && analyses.length > 0 && (
        <div className="px-6 py-2 flex flex-wrap gap-2 justify-center">
          <button 
            onClick={() => setInput("Điểm yếu lớn nhất ở thumbnail này là gì và cách khắc phục?")}
            className="text-xs text-zinc-400 bg-zinc-900/50 hover:bg-zinc-900 hover:text-white px-3 py-1.5 rounded-full border border-zinc-800 transition-colors cursor-pointer"
          >
            Tối ưu Thumbnail?
          </button>
          <button 
            onClick={() => setInput("Hãy viết cho tôi 3 tiêu đề khác giật gân, cuốn hút hơn cho video này")}
            className="text-xs text-zinc-400 bg-zinc-900/50 hover:bg-zinc-900 hover:text-white px-3 py-1.5 rounded-full border border-zinc-800 transition-colors cursor-pointer"
          >
            Đổi tiêu đề cuốn hút?
          </button>
          <button 
            onClick={() => setInput("Đoạn mở đầu (hook) 30s đầu cần thêm những hiệu ứng gì để kéo dài giữ chân khán giả?")}
            className="text-xs text-zinc-400 bg-zinc-900/50 hover:bg-zinc-900 hover:text-white px-3 py-1.5 rounded-full border border-zinc-800 transition-colors cursor-pointer"
          >
            Giữ chân 30 giây đầu?
          </button>
        </div>
      )}

      {/* Bottom Send Input Panel */}
      <div className="p-4 border-t border-[#1e1e24] bg-[#0c0c0f]/80 backdrop-blur-md z-10">
        <form onSubmit={handleSend} className="relative flex items-center max-w-4xl mx-auto w-full">
          <input
            type="text"
            placeholder={
              analyses.length > 0 
                ? "Hỏi về video đã chọn (ví dụ: Viết lại tiêu đề video này)..." 
                : "Nhập tin nhắn của bạn..."
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full bg-[#09090b] border border-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg pl-4 pr-14 py-3.5 text-sm text-white placeholder-zinc-500 transition-all outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="absolute right-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/30 text-white p-2.5 rounded-md transition-colors cursor-pointer shrink-0 shadow-sm"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>

    </div>
  );
}
