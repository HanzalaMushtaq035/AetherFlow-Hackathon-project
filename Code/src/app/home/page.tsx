"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/shared";
import { cn } from "@/lib/utils";
import { AIOrb } from "@/components/ai";
import { 
  Zap, 
  Settings, 
  Wrench, 
  Zap as Electrician, 
  Droplets, 
  BookOpen, 
  Sparkles, 
  Trash2,
  Plus,
  ArrowRight,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { useStore } from "@/store/useStore";
import { useAuthStore } from "@/store/authStore";
import { RequestService } from "@/lib/services/RequestService";
import { useState, useEffect } from "react";

const quickServices = [
  { icon: Wrench, label: "AC Repair", color: "text-blue-400" },
  { icon: Electrician, label: "Electrician", color: "text-yellow-400" },
  { icon: Droplets, label: "Plumber", color: "text-blue-500" },
  { icon: BookOpen, label: "Tutor", color: "text-purple-400" },
  { icon: Sparkles, label: "Beautician", color: "text-pink-400" },
  { icon: Trash2, label: "Cleaner", color: "text-green-400" },
];

export default function HomePage() {
  const { user } = useAuthStore();
  const { setCurrentRequestId, setCurrentBookingId, setSelectedProvider, demoMode, setDemoMode } = useStore();
  const [activeTasks, setActiveTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Log HOME_MOUNTED (TASK 5)
  useEffect(() => {
    console.log("home/page: HOME_MOUNTED");
  }, []);

  // Failsafe timeout to prevent infinite spinner (TASK 3)
  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(false);
      console.log("home/page: LOADING_RELEASED");
    }, 3000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const fetchActiveTasks = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const reqs = await RequestService.getUserRequests(user.id);
        const active = reqs.filter(r => r.status !== 'completed' && r.status !== 'cancelled');
        setActiveTasks(active);
      } catch (err) {
        console.error("Failed to load active tasks:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchActiveTasks();
  }, [user]);

  const handleTaskClick = (task: any) => {
    setCurrentRequestId(task.id);
    const booking = task.bookings?.[0];
    if (booking) {
      setCurrentBookingId(booking.id);
      if (booking.providers) {
        setSelectedProvider(booking.providers);
      }
    }
  };

  return (
    <div className="pt-16 pb-28 px-4 min-h-screen">
      {/* Hero / AI Assistant */}
      <section className="flex flex-col items-center mb-8 relative">
        <AIOrb size="md" status={activeTasks.length > 0 ? "thinking" : "idle"} />
        <div className="mt-4 text-center">
          <h2 className="text-xl font-bold text-white tracking-tight">
            {activeTasks.length > 0 ? "Orchestrating Grid" : "System Ready"}
          </h2>
          <p className="font-label-mono text-[9px] text-primary-fixed-dim uppercase tracking-[0.2em] opacity-60">
            Neural Link: Active
          </p>
        </div>
      </section>

      {/* Main Command Input */}
      <section className="mb-10">
        <Link href="/request">
          <div className="bg-[#1a1a1a] rounded-2xl p-1.5 pl-5 flex items-center border border-white/5 shadow-xl">
            <span className="text-on-surface-variant/40 text-sm flex-1">Command orchestration...</span>
            <div className="w-10 h-10 rounded-xl bg-primary text-black flex items-center justify-center ml-2">
              <Plus className="w-5 h-5" />
            </div>
          </div>
        </Link>
      </section>

      {/* Quick Services Grid */}
      <section className="mb-10">
        <div className="flex justify-between items-center mb-4 px-1">
          <h3 className="font-label-mono text-[10px] text-on-surface-variant uppercase tracking-widest opacity-50">
            Service Grid
          </h3>
          <span className="text-[9px] text-primary-fixed-dim font-bold uppercase">Explore</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {quickServices.map((service, i) => (
            <Link key={service.label} href={`/request?service=${service.label}`} className="block">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex flex-col items-center gap-2 group cursor-pointer"
              >
                <div className="w-full aspect-square rounded-2xl bg-surface-container-high/40 border border-white/5 flex items-center justify-center group-hover:bg-surface-container-high/60 group-hover:border-primary/20 transition-all">
                  <service.icon className={cn("w-6 h-6", service.color)} />
                </div>
                <span className="text-[10px] text-on-surface-variant font-medium">{service.label}</span>
              </motion.div>
            </Link>
          ))}
        </div>
      </section>

      {/* Active Orchestrations */}
      <section>
        <div className="flex justify-between items-center mb-4 px-1">
          <h3 className="font-label-mono text-[10px] text-on-surface-variant uppercase tracking-widest opacity-50">
            Active Tasks
          </h3>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : activeTasks.length === 0 ? (
          <div className="p-4 rounded-2xl border border-white/5 bg-[#111] text-center">
            <p className="text-xs text-on-surface-variant/60 font-mono">No active orchestrations in sector.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeTasks.map((task) => {
              const booking = task.bookings?.[0];
              const targetUrl = booking ? `/tracking?bookingId=${booking.id}` : `/orchestration?requestId=${task.id}`;
              
              return (
                <Link key={task.id} href={targetUrl} onClick={() => handleTaskClick(task)}>
                  <GlassCard className="p-4 flex items-center justify-between border-primary/10 bg-primary/[0.02] hover:bg-primary/[0.04] transition-all cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full border border-primary/20 flex items-center justify-center relative shrink-0">
                        <div className="absolute inset-0 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <Zap className="w-4 h-4 text-primary-fixed-dim" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-white">{task.service}</h4>
                        <p className="text-[9px] text-on-surface-variant opacity-60">
                          Status: {task.status.replace('_', ' ').toUpperCase()} in {task.location || 'Sector'}
                        </p>
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-white/5 ml-2">
                      <ArrowRight className="w-4 h-4 text-primary-fixed-dim" />
                    </div>
                  </GlassCard>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* System Controls */}
      <section className="flex flex-col gap-3 mb-10 mt-12">
        {/* Hackathon Demo Mode Toggle (Module 7) */}
        <GlassCard className={cn(
          "p-4 border transition-all duration-300 relative overflow-hidden cursor-pointer",
          demoMode ? "border-primary/30 bg-primary/[0.03]" : "border-white/5 bg-[#111]"
        )} onClick={() => setDemoMode(!demoMode)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-xl border transition-colors",
                demoMode ? "bg-primary/10 border-primary/30 text-primary animate-pulse" : "bg-white/5 border-white/10 text-white/40"
              )}>
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Hackathon Demo Mode
                </h4>
                <p className="text-[9px] text-on-surface-variant/60 font-body-md">
                  {demoMode ? "Fast-tracking dispatch, automation, and speed." : "Standard real-time operating parameters."}
                </p>
              </div>
            </div>
            <div className={cn(
              "w-10 h-6 rounded-full p-1 transition-colors duration-300 flex items-center relative",
              demoMode ? "bg-primary" : "bg-white/10"
            )}>
              <motion.div 
                className="w-4 h-4 rounded-full bg-black shadow-md"
                layout
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                animate={{ x: demoMode ? 16 : 0 }}
              />
            </div>
          </div>
        </GlassCard>
      </section>
    </div>
  );
}
