"use client";

import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

export function GlassCard({ children, className, glow, ...props }: GlassCardProps) {
  return (
    <motion.div
      className={cn(
        "glass-card rounded-2xl p-4 overflow-hidden relative",
        glow && "glow-sm",
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

interface GlowButtonProps extends HTMLMotionProps<"button"> {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline";
  className?: string;
  glow?: boolean;
}

export function GlowButton({ children, variant = "primary", className, glow = true, ...props }: GlowButtonProps) {
  const variants = {
    primary: "bg-primary-container text-on-primary-container hover:bg-primary-container/90",
    secondary: "bg-secondary-container text-white hover:bg-secondary-container/90",
    outline: "bg-transparent border border-outline-variant/30 text-primary-fixed-dim hover:bg-white/5",
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "rounded-xl py-4 px-6 font-headline-md flex items-center justify-center gap-2 transition-all",
        variants[variant],
        glow && variant !== "outline" && "shadow-[0_0_20px_rgba(0,240,255,0.3)]",
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}

export function StatusChip({ status, type = "info" }: { status: string, type?: "info" | "success" | "warning" | "error" }) {
  const types = {
    info: "bg-primary/10 text-primary-fixed-dim border-primary/20",
    success: "bg-tertiary/10 text-tertiary-fixed-dim border-tertiary/20",
    warning: "bg-secondary/10 text-secondary border-secondary/20",
    error: "bg-error/10 text-error border-error/20",
  };

  return (
    <span className={cn(
      "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border",
      types[type]
    )}>
      {status}
    </span>
  );
}
