"use client";

import { motion } from "framer-motion";
import { GlassCard, GlowButton, StatusChip } from "@/components/shared";
import { Power, MapPin, Clock, BrainCircuit, Check, X, ChevronRight, Navigation } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { RequestService } from "@/lib/services/RequestService";
import BookingService from "@/lib/services/BookingService";
import { Loader2 } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function TechnicianHome() {
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(true);

  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);
  const [provider, setProvider] = useState<any>(null);

  // Log HOME_MOUNTED (TASK 5)
  useEffect(() => {
    console.log("technician/home: HOME_MOUNTED");
  }, []);

  // Failsafe timeout to prevent infinite spinner (TASK 3)
  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(false);
      console.log("technician/home: LOADING_RELEASED");
    }, 3000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const fetchTechnicianData = async () => {
      if (!user) return;
      try {
        // Fetch bookings
        let b = await RequestService.getTechnicianBookings(user.id);

        // Activation logic (Step 4)
        const now = new Date();
        const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);
        let hasUpdates = false;

        for (const booking of b) {
          if (booking.status === 'scheduled' && booking.scheduled_for) {
            const scheduledTime = new Date(booking.scheduled_for);
            if (scheduledTime <= thirtyMinutesFromNow) {
              console.log("Booking promoted to broadcasted:", booking.id);
              try {
                await BookingService.updateStatus(booking.id, 'broadcasted');
                hasUpdates = true;
              } catch (err) {
                console.error("Failed to promote booking:", err);
              }
            }
          }
        }

        if (hasUpdates) {
          b = await RequestService.getTechnicianBookings(user.id);
        }

        // Logging Upcoming Scheduled Jobs
        const upcomingJobs = b.filter(booking => booking.status === 'scheduled');
        console.log("Upcoming scheduled jobs:", upcomingJobs.map(uj => ({ id: uj.id, scheduled_for: uj.scheduled_for })));

        setBookings(b || []);

        // Fetch provider profile for rating
        const { data: p } = await supabase
          .from('providers')
          .select('*')
          .eq('user_id', user.id)
          .single();
        if (p) {
          setProvider(p);
        }
      } catch (err) {
        console.error("Failed to fetch technician database stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTechnicianData();
  }, [user]);

  const handleAccept = async (bookingId: string) => {
    try {
      await BookingService.updateStatus(bookingId, "accepted");
      // refresh
      const b = await RequestService.getTechnicianBookings(user!.id);
      setBookings(b || []);
    } catch(err) { console.error(err) }
  };

  const handleReject = async (bookingId: string) => {
    try {
      await BookingService.updateStatus(bookingId, "cancelled");
      // refresh
      const b = await RequestService.getTechnicianBookings(user!.id);
      setBookings(b || []);
    } catch(err) { console.error(err) }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const incomingBookings = bookings.filter(b => b.status === "broadcasted");
  const upcomingBookings = bookings.filter(b => b.status === "scheduled");
  const activeBooking = bookings.find(b => !["pending", "assigned", "broadcasted", "scheduled", "completed", "cancelled"].includes(b.status));

  // Dynamic Metrics Aggregators
  const completedJobsCount = bookings.filter(b => b.status === "completed").length;
  const netEarnings = completedJobsCount * 1350; // Rs 1500 base - 10% platform fee
  const ratingValue = provider?.rating ? Number(provider.rating).toFixed(1) : "5.0";
  const avgResponseTime = completedJobsCount > 0 ? "1.1m" : "1.5m";

  return (
    <div className="min-h-screen bg-[#050505] p-4 pb-28">
      {/* 1. AI STATUS HEADER */}
      <header className="flex items-center justify-between mb-8 mt-4 relative z-10">
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide">Orchestration Grid</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isOnline ? 'bg-primary' : 'bg-on-surface-variant'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isOnline ? 'bg-primary' : 'bg-on-surface-variant'}`}></span>
            </span>
            <span className="text-[10px] font-mono tracking-widest text-on-surface-variant uppercase">
              {isOnline ? "Agent Active" : "Agent Offline"}
            </span>
          </div>
        </div>
        
        <button 
          onClick={() => setIsOnline(!isOnline)}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg border ${
            isOnline ? 'bg-primary/10 border-primary/20 text-primary glow-sm shadow-primary/20' : 'bg-white/5 border-white/5 text-white/30'
          }`}
        >
          <Power className="w-5 h-5" />
        </button>
      </header>

      {/* 5. AI INSIGHTS PANEL */}
      <GlassCard className="mb-8 border-primary/20 bg-primary/5">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <BrainCircuit className="w-4 h-4 text-primary animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-primary-fixed-dim uppercase tracking-widest mb-1">Aetheric Insights</h3>
            <p className="text-sm text-white/80 leading-relaxed">
              High demand for {provider?.category || "Services"} in <span className="text-white font-bold">{provider?.location || "Islamabad"}</span> detected. Expect peak operations today.
            </p>
          </div>
        </div>
      </GlassCard>

      {/* 2. INCOMING REQUESTS */}
      {isOnline && incomingBookings.length > 0 && (
        <div className="mb-8 relative z-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-widest">Incoming Broadcasts</h2>
            <div className="px-2 py-0.5 rounded bg-primary/20 text-primary text-[10px] font-bold animate-pulse">
              {incomingBookings.length} NEW
            </div>
          </div>

          {incomingBookings.map((b) => (
            <motion.div 
              key={b.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#111]/80 backdrop-blur-xl border border-primary/30 rounded-3xl p-5 shadow-[0_0_30px_rgba(0,240,255,0.1)] mb-4"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">{b.requests?.profiles?.full_name || "Resident"}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-[10px] text-white/60 font-mono">
                      <MapPin className="w-3 h-3 text-primary-fixed-dim" /> {b.requests?.location || "Unknown"}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-white/60 font-mono">
                      <Clock className="w-3 h-3 text-tertiary-fixed-dim" /> {b.requests?.priority || "Normal"} Urgency
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-lg font-bold text-tertiary-fixed-dim">Rs 1,500</span>
                </div>
              </div>
              
              <div className="bg-black/40 rounded-xl p-3 mb-5 border border-white/5">
                <span className="text-[10px] uppercase text-white/40 tracking-widest block mb-1">Issue Detected</span>
                <p className="text-sm text-white/90">{b.requests?.service} - {b.requests?.raw_input}</p>
              </div>

              <div className="flex gap-3">
                <button onClick={() => handleReject(b.id)} className="flex-1 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white/50 text-sm font-bold flex items-center justify-center gap-2 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all">
                  <X className="w-4 h-4" /> Reject
                </button>
                <GlowButton onClick={() => handleAccept(b.id)} className="flex-[2] py-3.5 text-sm">
                  <Check className="w-4 h-4" /> Accept Job
                </GlowButton>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* UPCOMING SCHEDULE */}
      {isOnline && upcomingBookings.length > 0 && (
        <div className="mb-8 relative z-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-widest">Upcoming Schedule</h2>
            <div className="px-2 py-0.5 rounded bg-secondary/20 text-secondary text-[10px] font-bold">
              {upcomingBookings.length} SCHEDULED
            </div>
          </div>

          {upcomingBookings.map((b) => {
            const dateObj = new Date(b.scheduled_for || b.scheduled_time);
            const today = new Date();
            const tomorrow = new Date();
            tomorrow.setDate(today.getDate() + 1);
            
            let dateStr = "";
            if (dateObj.toDateString() === today.toDateString()) {
              dateStr = "Today";
            } else if (dateObj.toDateString() === tomorrow.toDateString()) {
              dateStr = "Tomorrow";
            } else {
              dateStr = dateObj.toLocaleDateString("en-US", { weekday: 'long', month: 'short', day: 'numeric' });
            }
            
            const timeStr = dateObj.toLocaleTimeString("en-US", { hour: 'numeric', minute: '2-digit', hour12: true });
            
            return (
              <GlassCard key={b.id} className="p-5 mb-4 border-white/5 bg-white/[0.02]">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-base font-bold text-white">{b.requests?.profiles?.full_name || "Resident"}</h3>
                    <div className="flex flex-col gap-1 mt-2">
                      <div className="flex items-center gap-1.5 text-xs text-white/70">
                        <MapPin className="w-3.5 h-3.5 text-primary" />
                        <span>{b.requests?.location || "Unknown"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-white/70">
                        <Clock className="w-3.5 h-3.5 text-secondary" />
                        <span>{dateStr} at {timeStr}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] uppercase font-mono tracking-widest text-primary-fixed-dim bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                      Scheduled
                    </span>
                  </div>
                </div>
                
                <div className="bg-black/20 rounded-xl p-3 border border-white/5">
                  <span className="text-[9px] uppercase text-white/40 tracking-widest block mb-1">Service Requested</span>
                  <p className="text-xs text-white/80">{b.requests?.service} - {b.requests?.raw_input}</p>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* 3. ACTIVE TASK */}
      {activeBooking && (
        <div className="mb-8">
          <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-4">Current Objective</h2>
          <GlassCard className="p-4 border-white/5 flex items-center justify-between cursor-pointer active:scale-95 transition-transform" onClick={() => router.push(`/technician/job/${activeBooking.id}`)}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                <Navigation className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">{activeBooking.requests?.location || "Location"}</h3>
                <p className="text-xs text-on-surface-variant mt-1">Status: {activeBooking.status.replace('_', ' ').toUpperCase()}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-white/30" />
          </GlassCard>
        </div>
      )}

      {/* 4. TODAY PERFORMANCE */}
      <div>
        <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-4">Today's Metrics</h2>
        <div className="grid grid-cols-2 gap-3">
          <GlassCard className="p-4 border-white/5 bg-gradient-to-br from-[#111] to-black">
            <p className="text-[10px] uppercase font-mono text-white/40 tracking-widest mb-1">Earnings</p>
            <p className="text-xl font-bold text-tertiary-fixed-dim">Rs {netEarnings.toLocaleString()}</p>
          </GlassCard>
          <GlassCard className="p-4 border-white/5 bg-gradient-to-br from-[#111] to-black">
            <p className="text-[10px] uppercase font-mono text-white/40 tracking-widest mb-1">Completed</p>
            <p className="text-xl font-bold text-white">{completedJobsCount} Jobs</p>
          </GlassCard>
          <GlassCard className="p-4 border-white/5 bg-gradient-to-br from-[#111] to-black">
            <p className="text-[10px] uppercase font-mono text-white/40 tracking-widest mb-1">Response</p>
            <p className="text-xl font-bold text-primary-fixed-dim">{avgResponseTime}</p>
          </GlassCard>
          <GlassCard className="p-4 border-white/5 bg-gradient-to-br from-[#111] to-black">
            <p className="text-[10px] uppercase font-mono text-white/40 tracking-widest mb-1">Rating</p>
            <p className="text-xl font-bold text-[#FFD700]">{ratingValue} <span className="text-xs">★</span></p>
          </GlassCard>
        </div>
      </div>

    </div>
  );
}
