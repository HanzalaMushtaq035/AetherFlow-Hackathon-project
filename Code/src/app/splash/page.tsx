"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { motion } from "framer-motion";
import { AIOrb } from "@/components/ai";

export default function SplashPage() {
  const router = useRouter();

  useEffect(() => {
    const hasOpened = localStorage.getItem("aetherflow_first_open");
    
    if (hasOpened) {
      // Skip splash
      const state = useAuthStore.getState();
      if (state.user && state.role) {
        router.replace(state.role === "technician" ? "/technician/home" : "/home");
      } else {
        router.replace("/auth/login");
      }
      return;
    }

    localStorage.setItem("aetherflow_first_open", "true");

    const timer = setTimeout(() => {
      router.push("/onboarding");
    }, 3500);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary-fixed-dim/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-secondary/5 rounded-full blur-[120px]" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="flex flex-col items-center gap-12"
      >
        <div className="w-24 h-24 relative">
          <motion.img 
            src="/logo.png" 
            alt="Logo" 
            className="w-full h-full object-contain"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ repeat: Infinity, duration: 3 }}
          />
        </div>
        
        <div className="relative">
          <AIOrb size="lg" status="thinking" />
          <div className="absolute inset-0 bg-primary/5 blur-[80px] rounded-full -z-10" />
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="text-center"
        >
          <h1 className="font-headline-lg-mobile text-2xl text-white font-bold tracking-[0.2em] uppercase opacity-90 mb-3">AetherFlow</h1>
          <div className="flex items-center justify-center gap-2">
            <div className="h-[1px] w-4 bg-primary/20" />
            <p className="font-label-mono text-[9px] text-primary-fixed-dim uppercase tracking-[0.4em]">Orchestrating Reality</p>
            <div className="h-[1px] w-4 bg-primary/20" />
          </div>
        </motion.div>
      </motion.div>

      <motion.div 
        className="absolute bottom-12 flex flex-col items-center gap-2 opacity-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ delay: 2 }}
      >
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-primary-fixed-dim"
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
            />
          ))}
        </div>
        <span className="font-label-mono text-[8px] uppercase tracking-widest">Initialising Protocol v2.4</span>
      </motion.div>
    </div>
  );
}
