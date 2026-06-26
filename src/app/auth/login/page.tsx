"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { Flame, Mail, Lock, ShieldCheck, ArrowRight, AlertCircle, RefreshCw } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [twoFactorUserId, setTwoFactorUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setError("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error || "Tài khoản hoặc mật khẩu không hợp lệ.");
        return;
      }

      if (data.twoFactorRequired) {
        setShowTwoFactor(true);
        setTwoFactorUserId(data.userId);
        return;
      }

      // Log in
      login(data.accessToken, data.refreshToken, data.user);
    } catch (err) {
      console.error(err);
      setLoading(false);
      setError("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");
    }
  };

  const handleTwoFactorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!twoFactorCode) return;

    setError("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/auth/verify-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: twoFactorUserId, code: twoFactorCode }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error || "Mã xác thực 2FA không chính xác.");
        return;
      }

      // Log in
      login(data.accessToken, data.refreshToken, data.user);
    } catch (err) {
      console.error(err);
      setLoading(false);
      setError("Không thể xác thực mã 2FA. Vui lòng thử lại.");
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 h-[500px] w-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 h-[500px] w-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md glass rounded-2xl p-8 relative shadow-2xl bg-[#0c0c0f]/80 border border-zinc-800/80">
        
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 mb-3">
            <Flame className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            AnimalTrend AI
          </h2>
          <p className="text-xs text-zinc-500 font-semibold tracking-widest uppercase mt-1">
            SaaS Analytics Platform
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-2.5 text-xs text-red-400">
            <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {!showTwoFactor ? (
          <form onSubmit={handleSubmit} className="space-y-4.5">
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
              <div className="flex justify-between items-center mb-1.5 pl-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Password
                </label>
                <a href="#" className="text-xs text-blue-500 hover:text-blue-400 transition-colors">
                  Forgot?
                </a>
              </div>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 h-4.5 w-4.5 text-zinc-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
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
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleTwoFactorSubmit} className="space-y-5">
            <div className="text-center p-3 rounded-lg bg-blue-500/5 border border-blue-500/10 text-xs text-zinc-400 mb-2">
              Tài khoản của bạn đã được bảo vệ bằng xác thực 2 lớp (2FA). Vui lòng nhập mã bảo mật từ ứng dụng xác thực của bạn.
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5 pl-1">
                2FA Verification Code
              </label>
              <div className="relative flex items-center">
                <ShieldCheck className="absolute left-3.5 h-4.5 w-4.5 text-zinc-500" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="Enter 6-digit code"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ""))}
                  className="w-full bg-[#09090b] border border-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg pl-11 pr-4 py-3 text-sm tracking-[0.2em] font-mono text-center text-white placeholder-zinc-600 transition-all outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowTwoFactor(false)}
                className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 font-semibold text-sm py-3 rounded-lg transition-colors text-center border border-zinc-800"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-semibold text-sm py-3 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-md"
              >
                {loading ? (
                  <RefreshCw className="h-4.5 w-4.5 animate-spin" />
                ) : (
                  <span>Verify</span>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-zinc-500 border-t border-zinc-900/60 pt-6">
          Đăng ký tài khoản mới?{" "}
          <Link href="/auth/signup" className="text-blue-500 hover:text-blue-400 font-semibold transition-colors">
            Sign Up Free
          </Link>
        </div>
      </div>
    </div>
  );
}
