"use client";

import { motion } from "framer-motion";
import { GlowButton } from "@/components/shared";
import { Mail, Lock, ArrowRight, ArrowLeft, Fingerprint, Activity, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuthStore } from "@/store/authStore";

export default function TechnicianLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading, error } = useAuthStore();

  const [localError, setLocalError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    try {
      await login(email, password);
      const role = useAuthStore.getState().role;
      if (role !== "technician") {
        await useAuthStore.getState().logout();
        setLocalError("Please use Resident Login");
        return;
      }
      router.push("/technician/home");
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

      {/* Background Neural Pulses */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-secondary/5 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full z-10"
      >
        <div className="text-center mb-8 relative">
          <div className="w-20 h-20 mx-auto mb-4 relative flex items-center justify-center">
            {/* AI Verification Pulse */}
            <motion.div 
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }} 
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute inset-0 bg-primary/20 rounded-full blur-xl"
            />
            <Fingerprint className="w-10 h-10 text-primary-fixed-dim relative z-10" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-[0.2em] uppercase opacity-90">
            AetherFlow
          </h1>
          <div className="mt-3 inline-flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-[9px] text-primary-fixed-dim font-label-mono uppercase tracking-widest">
              Technician Portal
            </span>
          </div>
        </div>

        <div className="bg-[#111] p-6 rounded-3xl border border-white/5 shadow-2xl backdrop-blur-xl">
          <div className="mb-6 text-center">
            <h2 className="text-lg font-bold text-white tracking-tight">Agent Sync</h2>
            <p className="text-on-surface-variant/40 text-[11px] mt-1">Authenticate to access the orchestration grid.</p>
            {(localError || error) && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 bg-red-500/10 border border-red-500/20 py-2 px-3 rounded-lg flex items-center justify-center gap-2">
                <Activity className="w-3 h-3 text-red-400" />
                <p className="text-red-400 text-[10px] uppercase tracking-wider font-mono">{localError || error}</p>
              </motion.div>
            )}
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="font-label-mono text-[8px] text-primary-fixed-dim uppercase tracking-widest ml-1 opacity-50">
                Agent Identifier
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
                Neural Key
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

            <div className="pt-4">
              <GlowButton type="submit" disabled={loading} className="w-full py-4 text-sm font-bold disabled:opacity-50 relative overflow-hidden group">
                {loading && (
                  <motion.div 
                    className="absolute inset-0 bg-primary/20"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  {loading ? "Authenticating..." : "Connect to Grid"}
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </span>
              </GlowButton>
            </div>
          </form>

          <div className="mt-8 text-center">
            <p className="text-on-surface-variant/40 text-[10px] font-label-mono uppercase tracking-widest">
              Unregistered Agent?{" "}
              <button 
                type="button" 
                onClick={() => router.push('/auth/signup/technician')} 
                className="text-primary-fixed-dim hover:text-primary transition-colors font-bold ml-1"
              >
                Apply Now
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
