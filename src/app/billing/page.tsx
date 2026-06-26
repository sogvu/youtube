"use client";

import { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useSearchParams } from "next/navigation";
import { CreditCard, Check, Shield, Flame, Activity, Sparkles, RefreshCw, AlertCircle, CheckCircle } from "lucide-react";

function BillingContent() {
  const { user, token, updateUserPlan } = useAuth();
  const searchParams = useSearchParams();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const status = searchParams.get("status");

  useEffect(() => {
    if (status === "success") {
      setSuccessMsg("Thanh toán thành công! Gói của bạn đã được kích hoạt.");
      // In production, we'd wait for Stripe webhook. For development, we'll mock update client state:
      updateUserPlan("PRO");
    } else if (status === "cancel") {
      setError("Thanh toán đã bị hủy bỏ.");
    }
  }, [status]);

  const handleCheckout = async (planId: string) => {
    if (planId === "FREE") {
      alert("Bạn đang sử dụng gói này.");
      return;
    }
    if (!token) return;

    setError("");
    setLoadingPlan(planId);

    try {
      const res = await fetch("http://localhost:5000/api/billing/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ planId })
      });

      const data = await res.json();
      setLoadingPlan(null);

      if (!res.ok) {
        setError(data.error || "Không thể khởi tạo phiên thanh toán Stripe Checkout.");
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error(err);
      setLoadingPlan(null);
      setError("Kết nối Stripe thất bại. Vui lòng thử lại.");
    }
  };

  const handleOpenPortal = async () => {
    if (!token) return;
    setPortalLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:5000/api/billing/portal", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      setPortalLoading(false);

      if (!res.ok) {
        setError(data.error || "Không có hồ sơ khách hàng Stripe nào cho gói Free. Vui lòng nâng cấp gói trước.");
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error(err);
      setPortalLoading(false);
      setError("Không thể kết nối đến Stripe Customer Portal.");
    }
  };

  const planFeatures = {
    FREE: [
      "Phân tích tối đa 3 video/tháng",
      "Tạo 1 kịch bản video/tháng",
      "Phân tích kênh đối thủ cơ bản",
      "Engine AI: Gemini 1.5 Flash"
    ],
    PRO: [
      "Phân tích tối đa 30 video/tháng",
      "Tạo 10 kịch bản video/tháng",
      "Phân tích chi tiết Thumbnail & Hook",
      "Xuất báo cáo PDF & Excel",
      "Engine AI: Gemini 2.0 Flash (Ưu tiên)"
    ],
    BUSINESS: [
      "Không giới hạn số lượng phân tích video",
      "Tạo 50 kịch bản video/tháng",
      "Gợi ý nhịp dựng video & ASMR hiệu quả",
      "Ưu tiên xử lý hàng chờ phân tích nhanh",
      "Hỗ trợ kỹ thuật 24/7"
    ],
    ENTERPRISE: [
      "Không giới hạn mọi chỉ số hạn ngạch",
      "Tự động giám sát xu hướng thời gian thực",
      "Tùy chỉnh Prompt AI & fine-tune kịch bản",
      "Dedicated Worker Engine riêng biệt",
      "Hỗ trợ qua Slack riêng tư"
    ]
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-[1400px] mx-auto w-full select-none">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
          <CreditCard className="h-7 w-7 text-blue-500" /> Subscription Billing
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Nâng cấp lên gói cao cấp để mở khóa các phân tích nâng cao, tạo kịch bản chuyên sâu và xuất báo cáo.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-start gap-2.5 max-w-2xl">
          <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-start gap-2.5 max-w-2xl">
          <CheckCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Current Plan Cockpit */}
      {user && (
        <div className="glass rounded-xl p-6 bg-[#0c0c0f] border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-6 max-w-4xl">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center shadow-inner">
              <Shield className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Trạng thái tài khoản</span>
                <span className="text-[10px] bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                  {user.plan} Active
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mt-1">
                Tài khoản: {user.name || "User"} ({user.email})
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                {user.plan === "FREE" 
                  ? "Bạn đang sử dụng gói Miễn phí. Nâng cấp để tăng hạn ngạch nghiên cứu video."
                  : "Gói của bạn sẽ tự động gia hạn thông qua cổng thanh toán Stripe."}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
            {user.plan !== "FREE" && (
              <button
                onClick={handleOpenPortal}
                disabled={portalLoading}
                className="bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white font-semibold text-xs px-4 py-3 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {portalLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <span>Manage Billing Portal</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* FREE */}
        <div className="glass rounded-2xl p-6 bg-[#0c0c0f]/50 border border-zinc-800/80 flex flex-col justify-between relative">
          <div>
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-1">Standard</span>
            <h3 className="text-xl font-bold text-white">Starter Free</h3>
            <div className="mt-4 flex items-baseline text-white">
              <span className="text-3xl font-extrabold tracking-tight">$0</span>
              <span className="ml-1 text-sm font-semibold text-zinc-500">/forever</span>
            </div>
            <p className="text-xs text-zinc-500 mt-2">Dành cho nhà sáng tạo mới bắt đầu hoặc nghiên cứu cơ bản.</p>
            
            <ul className="mt-6 space-y-3 border-t border-zinc-900 pt-6">
              {planFeatures.FREE.map((feat) => (
                <li key={feat} className="flex items-start gap-2.5 text-xs text-zinc-400">
                  <Check className="h-4 w-4 text-zinc-600 shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-8">
            <button
              disabled
              className="w-full bg-zinc-900 text-zinc-500 font-semibold text-xs py-3 rounded-lg border border-zinc-800 cursor-not-allowed"
            >
              Current Active Plan
            </button>
          </div>
        </div>

        {/* PRO */}
        <div className="glass rounded-2xl p-6 bg-[#0c0c0f]/80 border-2 border-blue-500/40 flex flex-col justify-between relative shadow-xl shadow-blue-500/5">
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white font-bold text-[10px] uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
            Popular Choice
          </div>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-widest block mb-1">Creator Pro</span>
              <Sparkles className="h-4.5 w-4.5 text-amber-500 animate-pulse" />
            </div>
            <h3 className="text-xl font-bold text-white">Professional</h3>
            <div className="mt-4 flex items-baseline text-white">
              <span className="text-3xl font-extrabold tracking-tight">$29</span>
              <span className="ml-1 text-sm font-semibold text-zinc-500">/month</span>
            </div>
            <p className="text-xs text-zinc-400 mt-2">Dành cho YouTube Creator bán chuyên nghiệp và chuyên nghiệp.</p>
            
            <ul className="mt-6 space-y-3 border-t border-zinc-900 pt-6">
              {planFeatures.PRO.map((feat) => (
                <li key={feat} className="flex items-start gap-2.5 text-xs text-zinc-300">
                  <Check className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-8">
            <button
              onClick={() => handleCheckout("PRO")}
              disabled={loadingPlan === "PRO" || user?.plan === "PRO" || user?.plan === "BUSINESS"}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/30 text-white font-semibold text-xs py-3 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-blue-500/10"
            >
              {loadingPlan === "PRO" ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : user?.plan === "PRO" || user?.plan === "BUSINESS" ? (
                <span>Current Active Plan</span>
              ) : (
                <span>Upgrade to Pro</span>
              )}
            </button>
          </div>
        </div>

        {/* BUSINESS */}
        <div className="glass rounded-2xl p-6 bg-[#0c0c0f]/50 border border-zinc-800/80 flex flex-col justify-between relative">
          <div>
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-1">Production</span>
            <h3 className="text-xl font-bold text-white">SaaS Business</h3>
            <div className="mt-4 flex items-baseline text-white">
              <span className="text-3xl font-extrabold tracking-tight">$79</span>
              <span className="ml-1 text-sm font-semibold text-zinc-500">/month</span>
            </div>
            <p className="text-xs text-zinc-500 mt-2">Dành cho các đội nhóm sáng tạo hoặc mạng lưới kênh (MCN).</p>
            
            <ul className="mt-6 space-y-3 border-t border-zinc-900 pt-6">
              {planFeatures.BUSINESS.map((feat) => (
                <li key={feat} className="flex items-start gap-2.5 text-xs text-zinc-400">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-8">
            <button
              onClick={() => handleCheckout("BUSINESS")}
              disabled={loadingPlan === "BUSINESS" || user?.plan === "BUSINESS"}
              className="w-full bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-900/50 text-white font-semibold text-xs py-3 rounded-lg transition-colors border border-zinc-800 hover:border-zinc-700 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {loadingPlan === "BUSINESS" ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : user?.plan === "BUSINESS" ? (
                <span>Current Active Plan</span>
              ) : (
                <span>Upgrade to Business</span>
              )}
            </button>
          </div>
        </div>

        {/* ENTERPRISE */}
        <div className="glass rounded-2xl p-6 bg-[#0c0c0f]/50 border border-zinc-800/80 flex flex-col justify-between relative">
          <div>
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-1">Unlimited Custom</span>
            <h3 className="text-xl font-bold text-white">Enterprise Suite</h3>
            <div className="mt-4 flex items-baseline text-white">
              <span className="text-3xl font-extrabold tracking-tight">$299</span>
              <span className="ml-1 text-sm font-semibold text-zinc-500">/month</span>
            </div>
            <p className="text-xs text-zinc-500 mt-2">Dành cho các tổ chức truyền thông lớn đòi hỏi tùy biến cao.</p>
            
            <ul className="mt-6 space-y-3 border-t border-zinc-900 pt-6">
              {planFeatures.ENTERPRISE.map((feat) => (
                <li key={feat} className="flex items-start gap-2.5 text-xs text-zinc-400">
                  <Check className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-8">
            <button
              onClick={() => alert("Vui lòng liên hệ support@animaltrend.ai để thỏa thuận hợp đồng doanh nghiệp.")}
              className="w-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold text-xs py-3 rounded-lg transition-colors border border-zinc-800 hover:border-zinc-700 cursor-pointer text-center block"
            >
              Contact Support
            </button>
          </div>
        </div>

      </div>

      {/* Invoice History list */}
      <div className="glass rounded-xl p-6 bg-[#0c0c0f] border border-zinc-800/80 max-w-4xl">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
          <Activity className="h-4 w-4 text-zinc-500" /> Invoice Payment History
        </h3>
        
        <div className="border border-zinc-900 rounded-lg divide-y divide-zinc-900 overflow-hidden">
          <div className="flex justify-between items-center p-3 text-xs bg-zinc-950/40 text-zinc-500 font-bold uppercase tracking-wider">
            <span>Ngày thanh toán</span>
            <span>Mã giao dịch</span>
            <span>Số tiền</span>
            <span>Trạng thái</span>
          </div>

          {user && user.plan !== "FREE" ? (
            <div className="flex justify-between items-center p-4 text-xs hover:bg-zinc-900/10">
              <span className="text-zinc-400 font-semibold">{new Date().toLocaleDateString("vi-VN")}</span>
              <span className="font-mono text-zinc-500">inv_stripe_comp_{user.id.slice(0, 8)}</span>
              <span className="text-white font-bold">{user.plan === "PRO" ? "$29.00" : "$79.00"}</span>
              <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-bold uppercase text-[9px] border border-emerald-500/15">Paid</span>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-zinc-600">
              Chưa có giao dịch thanh toán nào được thực hiện.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-zinc-400">Loading Billing Workspace...</div>}>
      <BillingContent />
    </Suspense>
  );
}
