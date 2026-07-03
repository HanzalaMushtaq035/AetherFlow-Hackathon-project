"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/shared";
import { User, Wrench, ArrowRight } from "lucide-react";
import Link from "next/link";
import { AIOrb } from "@/components/ai";

export default function SignupSelectionPage() {
  return (
    <div className="min-h-screen bg-[#050505] flex flex-col px-6 pt-24 pb-12 relative overflow-hidden">
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary-fixed-dim/5 rounded-full blur-[120px]" />
      
      <div className="flex flex-col items-center mb-12">
        <AIOrb size="md" status="idle" />
        <h1 className="text-2xl font-bold text-white mt-8 tracking-tight">Join AetherFlow</h1>
        <p className="text-xs text-on-surface-variant mt-2 font-label-mono uppercase tracking-widest">Select your account type</p>
      </div>

      <div className="space-y-4">
        <Link href="/auth/signup/resident" className="block">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <GlassCard className="p-6 border-white/10 hover:border-primary/30 transition-all group">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <User className="w-6 h-6 text-primary-fixed-dim" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white">Resident</h3>
                  <p className="text-xs text-on-surface-variant mt-1">Book services & manage home</p>
                </div>
                <ArrowRight className="w-5 h-5 text-on-surface-variant group-hover:text-primary-fixed-dim transition-colors" />
              </div>
            </GlassCard>
          </motion.div>
        </Link>

        <Link href="/auth/signup/technician" className="block">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <GlassCard className="p-6 border-white/10 hover:border-tertiary/30 transition-all group">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 rounded-full bg-tertiary/10 flex items-center justify-center group-hover:bg-tertiary/20 transition-colors">
                  <Wrench className="w-6 h-6 text-tertiary-fixed-dim" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white">Technician</h3>
                  <p className="text-xs text-on-surface-variant mt-1">Provide services & earn</p>
                </div>
                <ArrowRight className="w-5 h-5 text-on-surface-variant group-hover:text-tertiary-fixed-dim transition-colors" />
              </div>
            </GlassCard>
          </motion.div>
        </Link>
      </div>
      
      <div className="mt-auto text-center">
        <p className="text-xs text-on-surface-variant">
          Already have an account? <Link href="/auth/login" className="text-primary-fixed-dim font-bold uppercase tracking-wider">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
