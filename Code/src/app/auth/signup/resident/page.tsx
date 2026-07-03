"use client";

import { motion } from "framer-motion";
import { GlowButton, GlassCard } from "@/components/shared";
import { Mail, Lock, ArrowRight, User, Phone, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { RoleHelper, UserRole } from "@/lib/auth/roles";

export default function SignupPage() {
  const router = useRouter();
  
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const role: UserRole = "resident"; 
  const [success, setSuccess] = useState(false);
  
  const { signup, loading, error } = useAuthStore();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signup({ fullName, email, phone, password, role });
      setSuccess(true);
      setTimeout(() => {
        router.push(RoleHelper.getRedirectPath(role));
      }, 1500);
    } catch (err) {
      console.error("Signup failed:", err);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative">
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-secondary/5 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10"
      >
        <div className="text-center mb-8">
          <h1 className="font-headline-lg-mobile text-3xl text-primary-fixed-dim font-bold glow-primary">
            AetherFlow
          </h1>
          <p className="text-on-surface-variant text-sm mt-2 font-label-mono uppercase tracking-widest opacity-60">
            Create Neural Identity
          </p>
        </div>

        <GlassCard className="p-8 border-white/5">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-1">Join the Flow</h2>
            <p className="text-on-surface-variant text-sm">Register your identity to access orchestration.</p>
            {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
            {success && <p className="text-green-400 text-xs mt-2">Identity verified! Redirecting...</p>}
          </div>

          <form onSubmit={handleSignup} className="space-y-6">
            <div className="space-y-2">
              <label className="font-label-mono text-[10px] text-primary-fixed-dim/60 uppercase tracking-widest ml-1">
                Full Name
              </label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/40 group-focus-within:text-primary-fixed-dim transition-colors" />
                <input
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-black/40 border border-outline-variant/30 rounded-xl py-4 pl-12 pr-4 text-white font-body-md focus:outline-none focus:border-primary-fixed-dim focus:ring-1 focus:ring-primary-fixed-dim transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-label-mono text-[10px] text-primary-fixed-dim/60 uppercase tracking-widest ml-1">
                Email Address
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/40 group-focus-within:text-primary-fixed-dim transition-colors" />
                <input
                  type="email"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/40 border border-outline-variant/30 rounded-xl py-4 pl-12 pr-4 text-white font-body-md focus:outline-none focus:border-primary-fixed-dim focus:ring-1 focus:ring-primary-fixed-dim transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-label-mono text-[10px] text-primary-fixed-dim/60 uppercase tracking-widest ml-1">
                Phone Number
              </label>
              <div className="relative group">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/40 group-focus-within:text-primary-fixed-dim transition-colors" />
                <input
                  type="tel"
                  placeholder="+92 300 0000000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-black/40 border border-outline-variant/30 rounded-xl py-4 pl-12 pr-4 text-white font-body-md focus:outline-none focus:border-primary-fixed-dim focus:ring-1 focus:ring-primary-fixed-dim transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-label-mono text-[10px] text-primary-fixed-dim/60 uppercase tracking-widest ml-1">
                Access Key
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/40 group-focus-within:text-primary-fixed-dim transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/40 border border-outline-variant/30 rounded-xl py-4 pl-12 pr-12 text-white font-body-md focus:outline-none focus:border-primary-fixed-dim focus:ring-1 focus:ring-primary-fixed-dim transition-all"
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

            <GlowButton type="submit" disabled={loading || success} className="w-full py-4 mt-2 disabled:opacity-50">
              {loading ? "Creating..." : success ? "Identity Created" : "Create Identity"}
              {!loading && !success && <ArrowRight className="w-5 h-5" />}
            </GlowButton>
          </form>

          <div className="mt-8 text-center">
            <p className="text-on-surface-variant text-xs">
              Already have an identity?{" "}
              <button onClick={() => router.push("/auth/login")} className="text-primary-fixed-dim font-bold hover:underline">
                Login
              </button>
            </p>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
