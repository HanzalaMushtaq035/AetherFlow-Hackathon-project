"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { GlassCard, StatusChip, GlowButton } from "@/components/shared";
import { Calendar, MapPin, ChevronRight, CheckCircle2, Loader2, Check, X, Navigation, Play, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import BookingService from "@/lib/services/BookingService";
import { createBrowserClient } from "@supabase/ssr";
import { useStore } from "@/store/useStore";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const statusLabels: Record<string, string> = {
  assigned: "Assigned",
  accepted: "Accepted",
  en_route: "En Route",
  arrived: "Arrived",
  working: "Working",
  completed: "Completed",
  cancelled: "Cancelled",
  rejected: "Rejected"
};

export default function TechnicianJobs() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);
  const bookingsRef = useRef(bookings);
  useEffect(() => {
    bookingsRef.current = bookings;
  }, [bookings]);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchBookings = async () => {
    if (!user) return;
    try {
      let providerId = null;

      // 1. Try user_id mapping
      const { data: providerData } = await supabase
        .from('providers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (providerData) {
        providerId = providerData.id;
      } else {
        // Fallback: If auth profile id != provider.user_id,
        // lookup active booking to get the provider_id
        const { data: anyBooking } = await supabase
          .from('bookings')
          .select('provider_id')
          .limit(1);

        if (anyBooking && anyBooking.length > 0) {
          providerId = anyBooking[0].provider_id;
        } else {
          // Fallback 2: Get first registered provider in DB
          const { data: anyProvider } = await supabase
            .from('providers')
            .select('id')
            .limit(1);
          if (anyProvider && anyProvider.length > 0) {
            providerId = anyProvider[0].id;
          }
        }
      }

      if (!providerId) {
        console.warn("No providers or bookings found in database.");
        setLoading(false);
        return;
      }

      const { data: bookingsData, error: bError } = await supabase
        .from('bookings')
        .select('*, requests(*, profiles(*)), providers(*, profiles(*))')
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false });

      if (bError) {
        console.error("Failed to fetch bookings:", bError);
      } else {
        setBookings(bookingsData || []);
      }
    } catch (err) {
      console.error("Failed to fetch bookings", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [user]);

  // MOVEMENT SIMULATION LOOP ON LIST PAGE
  useEffect(() => {
    const { demoMode } = useStore.getState();
    const tickInterval = demoMode ? 2000 : 4000;
    const progressStep = demoMode ? 25 : 10;

    const interval = setInterval(async () => {
      const enRouteBookings = bookingsRef.current.filter(b => b.status === "en_route");
      if (enRouteBookings.length === 0) return;

      for (const booking of enRouteBookings) {
        const currentProgress = booking.route_progress || 0;
        
        if (currentProgress >= 100) {
          try {
            await BookingService.updateStatus(booking.id, "arrived");
            // Fetch fresh records
            await fetchBookings();
          } catch (err) {
            console.error("Auto transition to arrived failed:", err);
          }
          continue;
        }

        const nextProgress = Math.min(100, currentProgress + progressStep);
        
        const getCoordinates = (loc: string) => {
          const norm = (loc || "").toLowerCase();
          if (norm.includes("lahore")) return { lat: 31.5204, lng: 74.3587 };
          if (norm.includes("karachi")) return { lat: 24.8607, lng: 67.0011 };
          if (norm.includes("f6") || norm.includes("f-6")) return { lat: 33.7294, lng: 73.0931 };
          if (norm.includes("g10") || norm.includes("g-10")) return { lat: 33.6844, lng: 73.0479 };
          if (norm.includes("g13") || norm.includes("g-13")) return { lat: 33.6244, lng: 72.9780 };
          return { lat: 33.6844, lng: 73.0479 };
        };

        const requestLoc = booking.requests?.location || 'Islamabad';
        const destCoords = getCoordinates(requestLoc);
        const startLat = destCoords.lat + 0.015;
        const startLng = destCoords.lng + 0.015;
        const destLat = booking.user_lat || destCoords.lat;
        const destLng = booking.user_lng || destCoords.lng;

        const nextLat = startLat + (destLat - startLat) * (nextProgress / 100);
        const nextLng = startLng + (destLng - startLng) * (nextProgress / 100);
        const nextEta = Math.max(0, Math.round(15 * (1 - nextProgress / 100)));

        try {
          await BookingService.updateMovement(
            booking.id,
            nextLat,
            nextLng,
            nextProgress,
            nextEta
          );

          // Update local state
          setBookings(prev => prev.map(b => b.id === booking.id ? {
            ...b,
            route_progress: nextProgress,
            current_lat: nextLat,
            current_lng: nextLng,
            eta_minutes: nextEta
          } : b));
        } catch (err) {
          console.error("Simulation tick failed:", err);
        }
      }
    }, tickInterval);

    return () => clearInterval(interval);
  }, []);

  const handleAction = async (bookingId: string, action: string) => {
    setActionLoadingId(bookingId);
    try {
      if (action === "accepted") {
        // Initialize coordinates dynamically on Accept via BookingService
        await BookingService.updateStatus(bookingId, "accepted");
      } else {
        await BookingService.updateStatus(bookingId, action);
      }
      await fetchBookings();
    } catch (err) {
      console.error(`Failed to trigger action ${action}:`, err);
    } finally {
      setActionLoadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Active operations are those not completed or cancelled/rejected
  const activeJobs = bookings.filter(b => !["completed", "cancelled", "rejected"].includes(b.status));
  const pastJobs = bookings.filter(b => ["completed", "cancelled", "rejected"].includes(b.status));

  return (
    <div className="min-h-screen bg-[#050505] p-4 pb-28 pt-8">
      <h1 className="text-2xl font-bold text-white tracking-widest uppercase mb-6">
        Task <span className="text-primary">Log</span>
      </h1>

      {/* ACTIVE OPERATIONS */}
      <div className="mb-8">
        <h2 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-4">Active Operations</h2>
        <div className="space-y-4">
          {activeJobs.length === 0 ? (
            <p className="text-xs text-white/30 italic">No active operations scheduled.</p>
          ) : (
            activeJobs.map((job, idx) => {
              const isActionLoading = actionLoadingId === job.id;
              return (
                <motion.div key={`${job.id}-${idx}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <GlassCard className="p-5 border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors relative">
                    <div className="flex justify-between items-start mb-3" onClick={() => router.push(`/technician/job/${job.id}`)}>
                      <div className="cursor-pointer flex-1">
                        <h3 className="text-white font-bold text-base">{job.requests?.service || "Aetheric Task"}</h3>
                        <p className="text-xs text-white/70 font-semibold mt-1">Client: {job.requests?.profiles?.full_name || "Resident Client"}</p>
                        <p className="text-[11px] text-white/50 flex items-center gap-1 mt-1 font-mono">
                          <MapPin className="w-3.5 h-3.5 text-primary" /> {job.requests?.location || "Islamabad"}
                        </p>
                      </div>
                      <StatusChip status={statusLabels[job.status] || job.status} type="warning" />
                    </div>

                    {/* Simulation metadata */}
                    {job.status === "en_route" && (
                      <div className="mt-2 mb-4 bg-black/40 border border-primary/20 rounded-xl p-2.5">
                        <div className="flex justify-between text-[10px] font-mono text-primary mb-1">
                          <span>Route Progress</span>
                          <span>{job.route_progress || 0}% • {job.eta_minutes || 0} Mins Left</span>
                        </div>
                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${job.route_progress || 0}%` }} />
                        </div>
                      </div>
                    )}

                    {/* Quick Action Buttons on Card */}
                    <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap gap-2 justify-end">
                      {job.status === "assigned" && (
                        <>
                          <button 
                            disabled={isActionLoading}
                            onClick={() => handleAction(job.id, "cancelled")} 
                            className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold flex items-center gap-1.5 hover:bg-red-500/20 transition-all cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" /> Reject
                          </button>
                          <button 
                            disabled={isActionLoading}
                            onClick={() => handleAction(job.id, "accepted")} 
                            className="px-5 py-2 rounded-xl bg-primary text-black text-xs font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,240,255,0.3)] hover:shadow-[0_0_20px_rgba(0,240,255,0.5)] transition-all cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5 font-bold" /> Accept
                          </button>
                        </>
                      )}

                      {job.status === "accepted" && (
                        <button 
                          disabled={isActionLoading}
                          onClick={() => handleAction(job.id, "en_route")} 
                          className="px-5 py-2 rounded-xl bg-primary text-black text-xs font-bold flex items-center gap-1.5 hover:shadow-[0_0_15px_rgba(0,240,255,0.4)] transition-all cursor-pointer"
                        >
                          <Navigation className="w-3.5 h-3.5 fill-current" /> Start Travel
                        </button>
                      )}

                      {job.status === "en_route" && (
                        <button 
                          disabled={isActionLoading}
                          onClick={() => handleAction(job.id, "arrived")} 
                          className="px-5 py-2 rounded-xl bg-primary text-black text-xs font-bold flex items-center gap-1.5 hover:shadow-[0_0_15px_rgba(0,240,255,0.4)] transition-all cursor-pointer"
                        >
                          <MapPin className="w-3.5 h-3.5 fill-current" /> Arrived
                        </button>
                      )}

                      {job.status === "arrived" && (
                        <button 
                          disabled={isActionLoading}
                          onClick={() => handleAction(job.id, "working")} 
                          className="px-5 py-2 rounded-xl bg-primary text-black text-xs font-bold flex items-center gap-1.5 hover:shadow-[0_0_15px_rgba(0,240,255,0.4)] transition-all cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" /> Start Work
                        </button>
                      )}

                      {job.status === "working" && (
                        <button 
                          disabled={isActionLoading}
                          onClick={() => handleAction(job.id, "completed")} 
                          className="px-5 py-2 rounded-xl bg-tertiary text-black text-xs font-bold flex items-center gap-1.5 hover:shadow-[0_0_15px_rgba(0,240,255,0.4)] transition-all cursor-pointer"
                        >
                          <CheckCircle className="w-3.5 h-3.5 fill-current" /> Complete
                        </button>
                      )}

                      <button 
                        onClick={() => router.push(`/technician/job/${job.id}`)}
                        className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 text-xs font-bold flex items-center hover:bg-white/10 transition-all cursor-pointer"
                      >
                        Details <ChevronRight className="w-3.5 h-3.5 ml-1" />
                      </button>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* COMPLETED HISTORY */}
      <div>
        <h2 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-4">Completed History</h2>
        <div className="space-y-3">
          {pastJobs.length === 0 ? (
            <p className="text-xs text-white/30 italic">No completed operations recorded.</p>
          ) : (
            pastJobs.map((job, idx) => (
              <motion.div key={`${job.id}-${idx}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                <GlassCard className="p-4 border-white/5 flex items-center justify-between cursor-pointer" onClick={() => router.push(`/technician/job/${job.id}`)}>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-tertiary/10 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-tertiary-fixed-dim" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-sm">{job.requests?.service || "Aetheric Task"}</h3>
                      <p className="text-[10px] text-white/40 flex items-center gap-1 mt-1 font-mono">
                        {new Date(job.scheduled_time || job.created_at).toLocaleDateString()} • {job.requests?.location || "Islamabad"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <p className="text-sm font-bold text-white">Rs 1,500</p>
                    <ChevronRight className="w-4 h-4 text-white/20 mt-1" />
                  </div>
                </GlassCard>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
