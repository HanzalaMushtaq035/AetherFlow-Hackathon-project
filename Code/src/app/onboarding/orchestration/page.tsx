"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { GlowButton } from "@/components/shared";
import { ArrowRight, Network } from "lucide-react";
import { cn } from "@/lib/utils";

export default function OrchestrationOnboarding() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-between py-10 px-4 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full flex-1 flex flex-col items-center justify-center"
      >
        <div className="w-full max-w-[280px] mb-8">
          <div className="relative w-full aspect-square flex flex-col items-center justify-center gap-4">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                className={cn(
                  "w-40 bg-[#111] p-3 rounded-2xl border border-white/5 flex items-center gap-3 shadow-xl",
                  i === 1 && "border-primary/20 bg-primary/[0.03] shadow-primary/5"
                )}
              >
                <div className={cn("w-0.5 h-6 rounded-full", i === 1 ? "bg-primary" : "bg-white/10")} />
                <div className="flex-1">
                  <p className="text-[7px] font-label-mono text-on-surface-variant/40 uppercase tracking-widest">Node 0{i+1}</p>
                  <p className="text-[11px] font-bold text-white tracking-tight">{["Discovery", "Ranking", "Execution"][i]}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="text-center space-y-3 max-w-[260px]">
          <h1 className="text-xl font-bold text-white tracking-tight">
            Multi-Agent Grid
          </h1>
          <p className="text-[11px] text-on-surface-variant/60 leading-relaxed tracking-tight">
            A specialized swarm of AI agents works together to discover and rank optimal candidates in your local sector.
          </p>
        </div>
      </motion.div>

      <div className="w-full space-y-6 flex flex-col items-center">
        <div className="flex gap-1.5">
          <div className="h-1 w-1.5 bg-white/10 rounded-full" />
          <div className="h-1 w-6 bg-primary rounded-full shadow-[0_0_8px_rgba(0,219,233,0.3)]" />
          <div className="h-1 w-1.5 bg-white/10 rounded-full" />
        </div>

        <GlowButton className="w-full py-4.5 font-bold" onClick={() => router.push("/onboarding/automation")}>
          Continue
          <ArrowRight className="w-5 h-5" />
        </GlowButton>
      </div>
    </div>
  );
}
