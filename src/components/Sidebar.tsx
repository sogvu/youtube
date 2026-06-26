"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { 
  LayoutDashboard, 
  Video, 
  TrendingUp, 
  FileText, 
  Sparkles,
  Flame,
  MessageSquare,
  CreditCard,
  LogOut,
  User as UserIcon
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  // Don't render sidebar on login/signup pages
  if (pathname.startsWith("/auth")) {
    return null;
  }

  const menuItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Video Analyzer", href: "/analyze", icon: Video },
    { name: "Trend Center", href: "/trends", icon: TrendingUp },
    { name: "Script Generator", href: "/scripts", icon: FileText },
    { name: "AI Chat Workspace", href: "/chat", icon: MessageSquare },
    { name: "Billing & Plans", href: "/billing", icon: CreditCard }
  ];

  return (
    <aside className="w-64 border-r border-[#1e1e24] bg-[#0c0c0f]/80 backdrop-blur-md flex flex-col justify-between h-screen sticky top-0 text-[#fafafa] select-none z-30">
      <div>
        {/* Logo / Branding */}
        <div className="p-6 border-b border-[#1e1e24] flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Flame className="h-5 w-5 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              AnimalTrend
            </h1>
            <span className="text-[10px] font-semibold tracking-wider text-blue-500 uppercase">
              AI RESEARCHER
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5">
          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-3 mb-2">
            Workspace
          </div>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative ${
                  isActive
                    ? "bg-blue-600/10 text-blue-400 border-l-2 border-blue-500 pl-2.5"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-900/50"
                }`}
              >
                <Icon className={`h-4.5 w-4.5 transition-transform duration-200 group-hover:scale-105 ${
                  isActive ? "text-blue-400" : "text-zinc-400 group-hover:text-zinc-200"
                }`} />
                <span>{item.name}</span>
                {isActive && (
                  <span className="absolute right-3 h-1.5 w-1.5 rounded-full bg-blue-500 animate-ping" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / User Profile Badge */}
      <div className="p-4 border-t border-[#1e1e24] bg-zinc-950/20 space-y-3.5">
        {user && (
          <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/50 border border-zinc-800/80">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="h-8 w-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0">
                <UserIcon className="h-4 w-4 text-blue-400" />
              </div>
              <div className="text-xs overflow-hidden">
                <span className="text-zinc-300 font-bold block truncate">{user.name || "User"}</span>
                <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block bg-blue-600/10 text-blue-400 px-1 py-0.2 rounded w-fit mt-0.5">
                  {user.plan} PLAN
                </span>
              </div>
            </div>
            <button 
              onClick={logout}
              title="Sign Out"
              className="p-1.5 hover:bg-zinc-800 rounded-md text-zinc-500 hover:text-red-400 transition-colors shrink-0 cursor-pointer"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900/40 border border-zinc-800/50">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <div className="text-xs">
            <span className="text-zinc-300 font-semibold block">Gemini 2.0 Flash</span>
            <span className="text-[10px] text-zinc-500">Analysis Engine Active</span>
          </div>
        </div>
        
        <div className="text-center text-[10px] text-zinc-600 flex items-center justify-center gap-1.5">
          <span>AnimalTrend AI v1.0</span>
        </div>
      </div>
    </aside>
  );
}
