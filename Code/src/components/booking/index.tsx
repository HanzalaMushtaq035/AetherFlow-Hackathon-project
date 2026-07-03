"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Calendar, Clock, MapPin, ShieldCheck, CheckCircle2 } from "lucide-react";
import { GlassCard } from "../shared";
import { Provider } from "@/store/useStore";

export function ETAWidget({ time, status = "En Route" }: { time: string, status?: string }) {
  return (
    <div className="flex items-center justify-between p-4 glass-card border-primary/30 glow-sm">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Clock className="w-5 h-5 text-primary-fixed-dim" />
        </div>
        <div>
          <p className="text-[10px] text-on-surface-variant uppercase font-label-mono">Estimated Arrival</p>
          <h3 className="text-lg font-bold text-white">{time}</h3>
        </div>
      </div>
      <span className="text-[10px] text-primary-fixed-dim font-bold uppercase tracking-widest bg-primary/5 px-2 py-1 rounded border border-primary/20">
        {status}
      </span>
    </div>
  );
}

export function BookingCard({ provider, date, location }: { provider: Provider; date: string; location: string }) {
  return (
    <GlassCard className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <img 
          src={provider.profiles?.avatar || "https://ui-avatars.com/api/?name=" + (provider.profiles?.full_name || "Agent")} 
          className="w-16 h-16 rounded-2xl object-cover border border-white/10"
          alt={provider.profiles?.full_name || "Agent"}
        />
        <div>
          <h3 className="text-lg font-bold text-white">{provider.profiles?.full_name || "Agent"}</h3>
          <p className="text-sm text-primary-fixed-dim">{provider.specialization}</p>
        </div>
      </div>

      <div className="h-px bg-white/5" />

      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <Calendar className="w-5 h-5 text-on-surface-variant/60" />
          <div>
            <p className="text-[10px] text-on-surface-variant uppercase font-label-mono">Date & Time</p>
            <p className="text-sm text-white">{date}</p>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <MapPin className="w-5 h-5 text-on-surface-variant/60" />
          <div>
            <p className="text-[10px] text-on-surface-variant uppercase font-label-mono">Service Location</p>
            <p className="text-sm text-white">{location}</p>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

export function ConfirmationCard({ message }: { message: string }) {
  return (
    <div className="text-center py-12">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6"
      >
        <CheckCircle2 className="w-10 h-10 text-primary-fixed-dim" />
      </motion.div>
      <h1 className="text-2xl font-bold text-white mb-2">Success</h1>
      <p className="text-sm text-on-surface-variant">{message}</p>
    </div>
  );
}
