"use client";

import { motion } from "framer-motion";
import { GlowButton, GlassCard } from "@/components/shared";
import { Mail, Lock, ArrowRight, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { RoleHelper } from "@/lib/auth/roles";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login, loginWithGoogle, loading, error } = useAuthStore();

  const [localError, setLocalError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    try {
      await login(email, password);
      const role = useAuthStore.getState().role;
      if (role !== "resident") {
        await useAuthStore.getState().logout();
        setLocalError("Please use Technician Login");
        return;
      }
      router.push("/home");
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/auth/login");
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Back button */}
      <div className="absolute top-6 left-6 z-30">
        <button 
          onClick={handleBack} 
          aria-label="Go back"
          className="p-2.5 rounded-full bg-white/5 border border-white/5 text-white/60 hover:text-white hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full z-10"
      >
        <div className="text-center mb-10">
          <div className="w-16 h-16 mx-auto mb-5">
            <img src="/logo.png" alt="AetherFlow" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-[0.2em] uppercase opacity-90">
            AetherFlow
          </h1>
          <p className="text-primary-fixed-dim/40 text-[9px] mt-2 font-label-mono uppercase tracking-[0.3em]">
            Secure Neural Access
          </p>
        </div>

        <div className="bg-[#111] p-6 rounded-3xl border border-white/5 shadow-2xl">
          <div className="mb-8 text-center">
            <h2 className="text-lg font-bold text-white tracking-tight">Identity Sync</h2>
            <p className="text-on-surface-variant/40 text-[11px] mt-1">Provide credentials to initiate session.</p>
            {(localError || error) && <p className="text-red-500 text-xs mt-2">{localError || error}</p>}
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="font-label-mono text-[8px] text-primary-fixed-dim uppercase tracking-widest ml-1 opacity-50">
                Identifier
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/20 group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/40 border border-white/5 rounded-xl py-3.5 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-primary/20 focus:ring-1 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-label-mono text-[8px] text-primary-fixed-dim uppercase tracking-widest ml-1 opacity-50">
                Protocol Key
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/20 group-focus-within:text-primary transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/40 border border-white/5 rounded-xl py-3.5 pl-12 pr-12 text-sm text-white focus:outline-none focus:border-primary/20 focus:ring-1 focus:ring-primary/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <GlowButton type="submit" disabled={loading} className="w-full py-4 text-sm font-bold disabled:opacity-50">
                {loading ? "Initiating..." : "Initiate"}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </GlowButton>
            </div>
          </form>

          <div className="mt-8 text-center">
            <p className="text-on-surface-variant/40 text-[10px] font-label-mono uppercase tracking-widest">
              No Identity Found?{" "}
              <button 
                type="button" 
                onClick={() => router.push('/auth/signup')} 
                className="text-primary-fixed-dim hover:text-primary transition-colors font-bold ml-1"
              >
                Create Account
              </button>
            </p>
          </div>
        </div>

        <p className="text-center mt-10 text-on-surface-variant/20 text-[7px] font-label-mono uppercase tracking-[0.3em]">
          Protocol v2.4 // Build 992
        </p>
      </motion.div>
    </div>
  );
}
