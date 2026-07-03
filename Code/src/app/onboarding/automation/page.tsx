"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { GlowButton } from "@/components/shared";
import { ArrowRight, Zap } from "lucide-react";

export default function AutomationOnboarding() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-between py-10 px-4 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full flex-1 flex flex-col items-center justify-center"
      >
        <div className="w-full max-w-[280px] mb-8">
          <div className="relative w-full aspect-square flex items-center justify-center">
            <motion.div
              className="w-32 h-32 rounded-full border border-primary/10 flex items-center justify-center"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
            >
              <div className="w-3 h-3 bg-primary rounded-full absolute -top-1.5 shadow-[0_0_10px_#00dbe9]" />
            </motion.div>
            <div className="absolute flex flex-col items-center gap-1">
              <Zap className="w-8 h-8 text-primary opacity-60" />
              <span className="font-label-mono text-[8px] text-primary/40 uppercase tracking-[0.3em]">Autonomic</span>
            </div>
          </div>
        </div>

        <div className="text-center space-y-3 max-w-[260px]">
          <h1 className="text-xl font-bold text-white tracking-tight">
            Full Autonomy
          </h1>
          <p className="text-[11px] text-on-surface-variant/60 leading-relaxed tracking-tight">
            From booking to final audit, your AI agent handles the entire lifecycle automatically. Experience true zero-touch service.
          </p>
        </div>
      </motion.div>

      <div className="w-full space-y-6 flex flex-col items-center">
        <div className="flex gap-1.5">
          <div className="h-1 w-1.5 bg-white/10 rounded-full" />
          <div className="h-1 w-1.5 bg-white/10 rounded-full" />
          <div className="h-1 w-6 bg-primary rounded-full shadow-[0_0_8px_rgba(0,219,233,0.3)]" />
        </div>

        <GlowButton className="w-full py-4.5 font-bold" onClick={() => router.push("/auth/login")}>
          Initiate Core
          <ArrowRight className="w-5 h-5" />
        </GlowButton>
      </div>
    </div>
  );
}
