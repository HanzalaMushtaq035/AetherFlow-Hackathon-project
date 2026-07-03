"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { GlowButton } from "@/components/shared";
import { ArrowRight, BrainCircuit } from "lucide-react";

export default function IntentOnboarding() {
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
              className="absolute h-[1px] w-[200%] bg-gradient-to-r from-transparent via-primary/30 to-transparent"
              animate={{ y: [-80, 80, -80] }}
              transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
            />
            <div className="flex flex-col gap-3.5 w-full px-4">
              <motion.div 
                initial={{ x: 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="self-end bg-[#111] border border-white/10 rounded-2xl px-4 py-2 rotate-[-2deg] shadow-xl"
              >
                <span className="text-primary-fixed-dim text-xs font-bold tracking-tight">مجھے الیکٹریشن چاہئے</span>
              </motion.div>
              <motion.div 
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="self-start bg-[#111] border border-white/5 rounded-2xl px-4 py-2 rotate-[3deg] shadow-xl"
              >
                <span className="text-on-surface-variant/60 text-xs font-medium">I need help with my tap</span>
              </motion.div>
              <motion.div 
                className="self-center bg-primary/5 border border-primary/20 rounded-full px-5 py-2.5 shadow-2xl flex flex-col items-center"
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ repeat: Infinity, duration: 3 }}
              >
                <span className="font-label-mono text-[7px] text-primary-fixed-dim uppercase tracking-[0.3em] mb-0.5">Intent Lock</span>
                <span className="text-xs text-white font-bold tracking-tight uppercase">Plumbing Protocol</span>
              </motion.div>
            </div>
          </div>
        </div>

        <div className="text-center space-y-3 max-w-[260px]">
          <h1 className="text-xl font-bold text-white tracking-tight">
            Neural Intent
          </h1>
          <p className="text-[11px] text-on-surface-variant/60 leading-relaxed tracking-tight">
            Speak naturally in any language. Our AI extracts intent and context autonomously for precise task routing.
          </p>
        </div>
      </motion.div>

      <div className="w-full space-y-6 flex flex-col items-center">
        <div className="flex gap-1.5">
          <div className="h-1 w-6 bg-primary rounded-full shadow-[0_0_8px_rgba(0,219,233,0.3)]" />
          <div className="h-1 w-1.5 bg-white/10 rounded-full" />
          <div className="h-1 w-1.5 bg-white/10 rounded-full" />
        </div>

        <GlowButton className="w-full py-4.5 font-bold" onClick={() => router.push("/onboarding/orchestration")}>
          Continue
          <ArrowRight className="w-5 h-5" />
        </GlowButton>
      </div>
    </div>
  );
}
