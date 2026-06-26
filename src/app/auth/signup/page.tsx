"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { Flame, Mail, Lock, User, ArrowRight, AlertCircle, RefreshCw } from "lucide-react";

export default function SignupPage() {
  const { login } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;

    setError("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error || "Không thể đăng ký tài khoản. Vui lòng kiểm tra lại thông tin.");
        return;
      }

      // Automatically log in on success
      login(data.accessToken, data.refreshToken, data.user);
    } catch (err) {
      console.error(err);
      setLoading(false);
      setError("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Background glows */}
      <div className="absolute top-1/4 left-1/4 h-[500px] w-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 h-[500px] w-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md glass rounded-2xl p-8 relative shadow-2xl bg-[#0c0c0f]/80 border border-zinc-800/80">
        
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 mb-3">
            <Flame className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            Create Account
          </h2>
          <p className="text-xs text-zinc-500 font-semibold tracking-widest uppercase mt-1">
            Get started with Free plan
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-2.5 text-xs text-red-400">
            <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5 pl-1">
              Full Name
            </label>
            <div className="relative flex items-center">
              <User className="absolute left-3.5 h-4.5 w-4.5 text-zinc-500" />
              <input
                type="text"
                required
                placeholder="Nguyen Van A"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#09090b] border border-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg pl-11 pr-4 py-3 text-sm text-white placeholder-zinc-600 transition-all outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5 pl-1">
              Email Address
            </label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3.5 h-4.5 w-4.5 text-zinc-500" />
              <input
                type="email"
                required
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#09090b] border border-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg pl-11 pr-4 py-3 text-sm text-white placeholder-zinc-600 transition-all outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5 pl-1">
              Password
            </label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3.5 h-4.5 w-4.5 text-zinc-500" />
              <input
                type="password"
                required
                placeholder="Minimum 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#09090b] border border-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg pl-11 pr-4 py-3 text-sm text-white placeholder-zinc-600 transition-all outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-semibold text-sm py-3.5 rounded-lg transition-colors flex items-center justify-center gap-2 mt-6 cursor-pointer shadow-md"
          >
            {loading ? (
              <RefreshCw className="h-4.5 w-4.5 animate-spin" />
            ) : (
              <>
                <span>Sign Up</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-zinc-500 border-t border-zinc-900/60 pt-6">
          Đã có tài khoản?{" "}
          <Link href="/auth/login" className="text-blue-500 hover:text-blue-400 font-semibold transition-colors">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
