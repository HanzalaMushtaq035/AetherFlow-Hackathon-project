"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { AgentStatus, AgentState, TraceLog } from "@/store/useStore";
import { 
  CheckCircle2, 
  Clock, 
  Loader2, 
  PlayCircle, 
  Search, 
  BarChart4, 
  CalendarCheck2, 
  Activity, 
  Terminal,
  Zap
} from "lucide-react";

// --- AI Orb ---
export function AIOrb({ size = "md", status = "idle" }: { size?: "sm" | "md" | "lg"; status?: "idle" | "listening" | "thinking" }) {
  const sizes = {
    sm: "w-16 h-16",
    md: "w-32 h-32",
    lg: "w-42 h-42",
  };

  return (
    <div className="relative group flex items-center justify-center">
      <motion.div
        className={`${sizes[size]} rounded-full orb-gradient flex items-center justify-center cursor-pointer transition-transform duration-500 hover:scale-110`}
        animate={
          status === "thinking" 
            ? { scale: [1, 1.05, 1], filter: ["brightness(1)", "brightness(1.2)", "brightness(1)"] } 
            : status === "listening" 
            ? { scale: [1, 1.02, 1] } 
            : {}
        }
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
      >
        <div className="w-[85%] h-[85%] rounded-full border border-white/10 flex items-center justify-center overflow-hidden relative">
          <motion.div 
            className="absolute inset-0 bg-[linear-gradient(45deg,transparent_45%,rgba(255,255,255,0.1)_50%,transparent_55%)] bg-[length:200%_200%]"
            animate={{ backgroundPosition: ["0% 0%", "200% 200%"] }}
            transition={{ repeat: Infinity, duration: 5, ease: "linear" }}
          />
        </div>
      </motion.div>
    </div>
  );
}

// --- Agent Node ---
const agentIcons = {
  "Intent Agent": Search,
  "Location Agent": Activity,
  "Provider Agent": Search,
  "Ranking Agent": BarChart4,
  "Booking Agent": CalendarCheck2,
  "Assignment Agent": CheckCircle2,
  "Trace Agent": Terminal,
};

export function AgentNode({ name, status, progress, description, index }: AgentState & { index: number }) {
  const Icon = (agentIcons as any)[name] || Activity;
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        "glass-card rounded-xl p-4 flex items-center gap-4 relative overflow-hidden transition-all duration-300 w-full",
        status === "ACTIVE" || status === "RUNNING" ? "border-primary-fixed-dim/40 glow-sm" : "opacity-60"
      )}
    >
      <div className={cn(
        "luminous-bar shrink-0 self-stretch",
        status === "COMPLETED" ? "bg-tertiary-fixed-dim" : 
        status === "ACTIVE" || status === "RUNNING" ? "bg-primary-fixed-dim" : "bg-outline-variant"
      )} />
      
      <div className="flex-1">
        <div className="flex justify-between items-center mb-1">
          <span className="font-label-mono text-[10px] text-primary-fixed-dim uppercase tracking-widest">
            Agent 0{index + 1}
          </span>
          {status === "RUNNING" && <Loader2 className="w-3 h-3 animate-spin text-primary-fixed-dim" />}
        </div>
        <h3 className="font-headline-md text-sm text-white">{name}</h3>
        <p className="text-[10px] text-on-surface-variant/70 font-body-md truncate">{description}</p>
      </div>
    </motion.div>
  );
}

// --- Workflow Graph ---
export function WorkflowGraph({ agents }: { agents: AgentState[] }) {
  return (
    <div className="flex flex-col gap-4 w-full max-w-lg">
      {agents.map((agent, i) => (
        <div key={agent.id} className="flex flex-col items-center gap-2 w-full">
          <AgentNode {...agent} index={i} />
          {i < agents.length - 1 && (
            <motion.div 
              className="h-6 w-px bg-gradient-to-b from-primary-fixed-dim/50 to-transparent"
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// --- Trace Card ---
export function TraceCard({ log }: { log: TraceLog }) {
  const colors = {
    INFO: "text-primary-fixed-dim",
    SUCCESS: "text-tertiary-fixed-dim",
    WARNING: "text-secondary",
    ERROR: "text-error",
  };

  return (
    <div className="flex gap-3 text-[11px] font-label-mono leading-relaxed py-1">
      <span className="text-on-surface-variant/40 shrink-0">[{log.timestamp}]</span>
      <div className="flex flex-wrap gap-1">
        <span className={cn("font-bold uppercase", (colors as any)[log.type])}>[{log.agent}]</span>
        <span className="text-on-surface-variant">{log.message}</span>
      </div>
    </div>
  );
}

// --- Execution Timeline ---
export function ExecutionTimeline({ steps }: { steps: any[] }) {
  return (
    <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-white/5">
      {steps.map((step, i) => (
        <div key={i} className="flex gap-6 items-start relative">
          <div className={cn(
            "w-6 h-6 rounded-full border-2 z-10 flex items-center justify-center bg-background",
            step.completed ? "border-primary-fixed-dim bg-primary/10" : "border-white/10"
          )}>
            {step.completed && <div className="w-2 h-2 rounded-full bg-primary-fixed-dim shadow-[0_0_8px_#00dbe9]" />}
          </div>
          <div>
            <h4 className={cn("text-xs font-bold uppercase tracking-wider", step.completed ? "text-white" : "text-on-surface-variant/40")}>
              {step.label}
            </h4>
            <p className="text-[10px] text-on-surface-variant/60">{step.time}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
