"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Sparkles, Video, TrendingUp, FileText, MessageSquare, CreditCard, Moon, Sun, X, CornerDownLeft } from "lucide-react";

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isDark, setIsDark] = useState(true);

  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Monitor Cmd+K or Ctrl+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Sync dark class on mount
  useEffect(() => {
    const isCurrentlyDark = document.documentElement.classList.contains("dark");
    setIsDark(isCurrentlyDark);
  }, []);

  // Autofocus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSearch("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const handleToggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      document.documentElement.style.setProperty("--background", "#09090b");
      document.documentElement.style.setProperty("--foreground", "#fafafa");
      document.documentElement.style.setProperty("--card", "#0c0c0f");
    } else {
      document.documentElement.classList.remove("dark");
      // Style overrides for light mode theme
      document.documentElement.style.setProperty("--background", "#f4f4f5");
      document.documentElement.style.setProperty("--foreground", "#09090b");
      document.documentElement.style.setProperty("--card", "#ffffff");
    }
    setIsOpen(false);
  };

  const actions = [
    {
      name: "Phân tích Video mới (Video Analyzer)",
      description: "Nhập link YouTube để phân tích các chỉ số viral",
      icon: Video,
      shortcut: "G A",
      perform: () => {
        router.push("/analyze");
        setIsOpen(false);
      }
    },
    {
      name: "Xem Trung tâm Xu hướng (Trend Center)",
      description: "Tìm kiếm các từ khóa và chủ đề động vật đang lên",
      icon: TrendingUp,
      shortcut: "G T",
      perform: () => {
        router.push("/trends");
        setIsOpen(false);
      }
    },
    {
      name: "Tạo kịch bản AI (Script Generator)",
      description: "Soạn thảo kịch bản và nhịp biên tập tự động",
      icon: FileText,
      shortcut: "G S",
      perform: () => {
        router.push("/scripts");
        setIsOpen(false);
      }
    },
    {
      name: "Trò chuyện trợ lý AI (Chat Workspace)",
      description: "Hỏi đáp AI về thumbnail, hook và CTR",
      icon: MessageSquare,
      shortcut: "G C",
      perform: () => {
        router.push("/chat");
        setIsOpen(false);
      }
    },
    {
      name: "Quản lý Gói & Thanh toán (Billing)",
      description: "Xem hóa đơn hoặc thay đổi gói dịch vụ",
      icon: CreditCard,
      shortcut: "G B",
      perform: () => {
        router.push("/billing");
        setIsOpen(false);
      }
    },
    {
      name: `Chuyển sang Chế độ ${isDark ? "Sáng" : "Tối"} (Toggle Theme)`,
      description: "Thay đổi giao diện hiển thị của hệ thống",
      icon: isDark ? Sun : Moon,
      shortcut: "T T",
      perform: handleToggleTheme
    }
  ];

  // Filter actions based on search
  const filteredActions = actions.filter((act) =>
    act.name.toLowerCase().includes(search.toLowerCase()) ||
    act.description.toLowerCase().includes(search.toLowerCase())
  );

  // Manage keyboard navigation in list
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredActions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredActions.length) % filteredActions.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredActions[selectedIndex]) {
        filteredActions[selectedIndex].perform();
      }
    }
  };

  // Close when clicking outside
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      setIsOpen(false);
    }
  };

  if (!isOpen) {
    // Show shortcut helper toast at the corner of screen for UI elegance
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 glass bg-zinc-950/80 hover:bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer z-50 transition-all duration-200 shadow-xl shadow-black/40 group hover:-translate-y-0.5"
      >
        <Search className="h-3.5 w-3.5" />
        <span>Ấn <kbd className="bg-zinc-800 px-1.5 py-0.5 rounded text-[10px] font-mono border border-zinc-700 ml-0.5">Ctrl K</kbd> để mở phím tắt</span>
      </button>
    );
  }

  return (
    <div 
      onClick={handleOverlayClick}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-[15vh] p-4 select-none animate-in fade-in duration-100"
    >
      <div 
        ref={containerRef}
        className="w-full max-w-xl glass bg-[#0c0c0f]/95 border border-zinc-800/80 rounded-xl overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-150"
      >
        {/* Search Input block */}
        <div className="p-4 border-b border-zinc-800/60 flex items-center gap-3">
          <Search className="h-5 w-5 text-zinc-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Tìm kiếm hành động nhanh..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-sm text-white placeholder-zinc-500 outline-none w-full"
          />
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-zinc-900 rounded text-zinc-500 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Actions list */}
        <div className="max-h-[340px] overflow-y-auto p-2 space-y-0.5">
          {filteredActions.length > 0 ? (
            filteredActions.map((act, index) => {
              const Icon = act.icon;
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={act.name}
                  onClick={() => act.perform()}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between px-3 py-3 rounded-lg cursor-pointer transition-all duration-150 ${
                    isSelected 
                      ? "bg-blue-600/10 border-l-2 border-blue-500 pl-2.5 text-white" 
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-md ${
                      isSelected ? "bg-blue-500/20 text-blue-400" : "bg-zinc-900 text-zinc-500"
                    }`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold block">{act.name}</span>
                      <span className="text-[10px] text-zinc-500 block mt-0.5">{act.description}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    {isSelected && (
                      <span className="text-[10px] text-blue-400/80 font-semibold flex items-center gap-0.5">
                        <span>Select</span>
                        <CornerDownLeft className="h-3 w-3" />
                      </span>
                    )}
                    <span className="bg-zinc-900 border border-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded text-[9px] font-mono tracking-wider">
                      {act.shortcut}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-xs text-zinc-600 flex flex-col items-center justify-center gap-2">
              <Sparkles className="h-6 w-6 text-zinc-700 animate-spin" />
              <span>Không tìm thấy hành động nhanh nào khớp với tìm kiếm.</span>
            </div>
          )}
        </div>

        {/* Footer shortcuts info */}
        <div className="p-3 bg-zinc-950/40 border-t border-zinc-900/60 flex items-center justify-between text-[10px] text-zinc-500">
          <div className="flex items-center gap-3">
            <span><kbd className="bg-zinc-900 px-1 rounded border border-zinc-800">↑↓</kbd> Di chuyển</span>
            <span><kbd className="bg-zinc-900 px-1 rounded border border-zinc-800">Enter</kbd> Chọn</span>
            <span><kbd className="bg-zinc-900 px-1 rounded border border-zinc-800">Esc</kbd> Đóng</span>
          </div>
          <div>
            <span>AnimalTrend Quick Controls</span>
          </div>
        </div>

      </div>
    </div>
  );
}
