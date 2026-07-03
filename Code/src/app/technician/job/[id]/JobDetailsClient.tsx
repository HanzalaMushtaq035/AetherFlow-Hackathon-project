"use client";

import { motion } from "framer-motion";
import { GlassCard, GlowButton, StatusChip } from "@/components/shared";
import { MapPin, Phone, MessageSquare, BrainCircuit, Navigation, CheckCircle2, CircleDashed, ChevronLeft, AlertTriangle } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import BookingService from "@/lib/services/BookingService";
import { useStore } from "@/store/useStore";

const statusOrder = [
  "assigned",
  "accepted",
  "en_route",
  "arrived",
  "working",
  "completed"
];

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

export default function TechnicianJobDetailsClient() {
  const router = useRouter();
  const params = useParams();
  const bookingId = params.id as string;
  
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchBooking = async () => {
    try {
      const b = await BookingService.getBookingDetail(bookingId);
      setBooking(b);
    } catch (err) {
      console.error("Failed to load booking details", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (bookingId) {
      fetchBooking();
    }
  }, [bookingId]);

  // Keep booking state ref updated
  const bookingRef = useRef(booking);
  useEffect(() => {
    bookingRef.current = booking;
  }, [booking]);

  // MOVEMENT SIMULATION LOOP
  useEffect(() => {
    if (!bookingId || !booking) return;

    // Simulate movement only while status is accepted or en_route
    const isSimulating = booking.status === "accepted" || booking.status === "en_route";
    if (!isSimulating) return;

    const { demoMode } = useStore.getState();
    const tickInterval = demoMode ? 2000 : 4000;
    const progressStep = demoMode ? 25 : 10;

    // Bearing calculation helper
    const calculateBearing = (lat1: number, lng1: number, lat2: number, lng2: number) => {
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const lat1Rad = lat1 * Math.PI / 180;
      const lat2Rad = lat2 * Math.PI / 180;
      const y = Math.sin(dLng) * Math.cos(lat2Rad);
      const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);
      return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
    };

    const interval = setInterval(async () => {
      const currentBooking = bookingRef.current;
      if (!currentBooking) return;

      const currentProgress = currentBooking.route_progress || 0;
      
      if (currentProgress >= 100) {
        clearInterval(interval);
        // Automatically transition status to arrived
        try {
          const updated = await BookingService.updateStatus(bookingId, "arrived");
          setBooking(updated);
          fetchBooking();
        } catch (err) {
          console.error("Auto transition to arrived failed:", err);
        }
        return;
      }

      // Increment progress dynamically
      const nextProgress = Math.min(100, currentProgress + progressStep);
      
      const getCoordinates = (loc: string) => {
        const norm = (loc || "").toLowerCase();
        if (norm.includes("lahore")) {
          if (norm.includes("pak arab")) return { lat: 31.4283, lng: 74.3721 };
          if (norm.includes("dha")) return { lat: 31.4697, lng: 74.4089 };
          if (norm.includes("johar")) return { lat: 31.4697, lng: 74.2728 };
          return { lat: 31.5204, lng: 74.3587 };
        }
        if (norm.includes("karachi")) {
          if (norm.includes("clifton")) return { lat: 24.8138, lng: 67.0359 };
          if (norm.includes("gulshan")) return { lat: 24.9180, lng: 67.0971 };
          return { lat: 24.8607, lng: 67.0011 };
        }
        if (norm.includes("f6") || norm.includes("f-6")) return { lat: 33.7294, lng: 73.0931 };
        if (norm.includes("g10") || norm.includes("g-10")) return { lat: 33.6844, lng: 73.0479 };
        if (norm.includes("g13") || norm.includes("g-13")) return { lat: 33.6244, lng: 72.9780 };
        if (norm.includes("i8") || norm.includes("i-8")) return { lat: 33.6684, lng: 73.0780 };
        return { lat: 33.6844, lng: 73.0479 };
      };

      const requestLoc = currentBooking.requests?.location || 'Islamabad';
      const destCoords = getCoordinates(requestLoc);
      const startLat = destCoords.lat + 0.015;
      const startLng = destCoords.lng + 0.015;
      const destLat = currentBooking.user_lat || destCoords.lat;
      const destLng = currentBooking.user_lng || destCoords.lng;

      // 1. Vehicle-realistic speeds with traffic variance
      const serviceName = (currentBooking.requests?.service || "").toLowerCase();
      let speedKmh = 35; // default bike (25-40 km/h)
      if (serviceName.includes("ac") || serviceName.includes("carpenter") || serviceName.includes("leakage")) {
        speedKmh = 45; // car (30-60 km/h)
      } else if (serviceName.includes("maid") || serviceName.includes("cleaning") || serviceName.includes("helper")) {
        speedKmh = 4; // walking (3-5 km/h)
      }
      
      const trafficVariance = 0.85 + Math.random() * 0.3; // 85% to 115% speed variance
      const actualSpeed = speedKmh * trafficVariance;

      // 2. Road smoothing perpendicular turning layouts & random micro drift
      const bearing = calculateBearing(startLat, startLng, destLat, destLng);
      const angleRad = (bearing + 90) * Math.PI / 180;
      const wave = Math.sin((nextProgress / 100) * Math.PI * 4); // 2 full street turning patterns
      const amplitude = 0.0008; // perpendicular offset in degrees
      const driftLat = Math.cos(angleRad) * wave * amplitude + (Math.random() - 0.5) * 0.0001;
      const driftLng = Math.sin(angleRad) * wave * amplitude + (Math.random() - 0.5) * 0.0001;

      const nextLat = startLat + (destLat - startLat) * (nextProgress / 100) + driftLat;
      const nextLng = startLng + (destLng - startLng) * (nextProgress / 100) + driftLng;

      // 3. Geodesic distance formula for accurate dynamic ETA calculation
      const earthRadius = 6371; // km
      const dLat = (destLat - nextLat) * Math.PI / 180;
      const dLng = (destLng - nextLng) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(nextLat * Math.PI / 180) * Math.cos(destLat * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const remainingDistanceKm = earthRadius * c;
      
      const nextEta = Math.max(1, Math.round((remainingDistanceKm / actualSpeed) * 60));

      try {
        const updated = await BookingService.updateMovement(
          bookingId,
          nextLat,
          nextLng,
          nextProgress,
          nextEta
        );
        
        // Update local state smoothly
        setBooking(updated);
      } catch (err) {
        console.error("Simulation update tick failed:", err);
      }
    }, tickInterval);

    return () => clearInterval(interval);
  }, [bookingId, booking?.status]);

  const handleUpdateStatus = async (nextStatus: string) => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      const updated = await BookingService.updateStatus(bookingId, nextStatus);
      setBooking(updated);
      await fetchBooking();
      if (nextStatus === "cancelled" || nextStatus === "rejected") {
        router.push("/technician/jobs");
      }
    } catch (err) {
      console.error("Failed to update booking status:", err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white">
        <CircleDashed className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white px-4 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold">Booking Not Found</h2>
        <p className="text-xs text-white/50 mt-2">The requested operational process does not exist or has been deleted.</p>
        <button onClick={() => router.push("/technician/jobs")} className="mt-6 px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
          Go to Job Board
        </button>
      </div>
    );
  }

  const currentStatusIdx = statusOrder.indexOf(booking.status);
  const isCancelled = booking.status === "cancelled" || booking.status === "rejected";

  return (
    <div className="min-h-screen bg-[#050505] pb-28">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5 px-4 py-4 flex items-center justify-between">
        <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-sm font-bold text-white tracking-widest uppercase">Mission Control</h1>
        <div className="w-10" />
      </div>

      <div className="p-4 space-y-6">
        
        {/* Customer Details */}
        <GlassCard className="p-5 border-white/5">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-lg font-bold text-white">{booking.requests?.profiles?.full_name || "Resident Client"}</h2>
              <p className="text-xs text-white/50 mt-1">Request ID: {booking.request_id.split('-')[0]}</p>
            </div>
            <StatusChip status={statusLabels[booking.status] || booking.status} type={booking.status === "completed" ? "success" : isCancelled ? "error" : "warning"} />
          </div>
          
          <div className="flex gap-3">
            <a href={`tel:${booking.requests?.profiles?.phone || "03000000000"}`} className="flex-1 py-3 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary/20 transition-colors">
              <Phone className="w-4 h-4" /> Call
            </a>
            <button className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm font-bold flex items-center justify-center gap-2 hover:bg-white/10 transition-colors">
              <MessageSquare className="w-4 h-4" /> Message
            </button>
          </div>
        </GlassCard>

        {/* Location & Navigation */}
        <GlassCard className="p-0 border-white/5 overflow-hidden relative">
          <div className="h-32 bg-[#111] relative overflow-hidden flex flex-col items-center justify-center">
             <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '20px 20px' }}></div>
             {(booking.status === 'accepted' || booking.status === 'en_route') && (
               <div className="absolute top-2 left-2 bg-black/60 border border-primary/20 rounded-md px-2 py-0.5 text-[9px] font-mono text-primary animate-pulse z-20">
                 Simulating movement... {booking.route_progress || 0}%
               </div>
             )}
             <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2 }} className="w-4 h-4 bg-primary rounded-full relative z-10 shadow-[0_0_15px_rgba(0,240,255,0.8)]"></motion.div>
          </div>
          <div className="p-5 flex items-center justify-between bg-black/60 backdrop-blur-md">
            <div>
              <p className="text-xs text-white/50 uppercase tracking-widest font-mono mb-1">Target Location</p>
              <p className="text-sm text-white font-bold flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" /> {booking.requests?.location || " Islamabad"}
              </p>
            </div>
            <button className="w-12 h-12 rounded-full bg-primary text-black flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.3)]">
              <Navigation className="w-5 h-5 fill-current" />
            </button>
          </div>
        </GlassCard>

        <GlassCard className="p-5 border-primary/20 bg-primary/5">
          <div className="flex items-center gap-2 mb-3">
            <BrainCircuit className="w-4 h-4 text-primary animate-pulse" />
            <h3 className="text-xs font-bold text-primary uppercase tracking-widest">Aetheric Diagnostic</h3>
          </div>
          <p className="text-sm text-white/80 leading-relaxed font-mono">
            {(() => {
              const r = booking.requests?.reasoning;
              if (r && r.trim().startsWith('{')) {
                try {
                  const parsed = JSON.parse(r);
                  return parsed.reasoning || parsed.text_reasoning || r;
                } catch(e) {}
              }
              return r || "Diagnostic details unavailable.";
            })()}
          </p>
          {(() => {
            const r = booking.requests?.reasoning;
            if (r && r.trim().startsWith('{')) {
              try {
                const parsed = JSON.parse(r);
                if (parsed.image_url) {
                  return (
                    <div className="mt-3 rounded-lg overflow-hidden border border-white/10">
                      <img src={parsed.image_url} alt="Uploaded attachment" className="w-full h-32 object-cover" />
                    </div>
                  );
                }
              } catch(e) {}
            }
            return null;
          })()}
        </GlassCard>

        {/* Timeline */}
        {!isCancelled && (
          <div>
            <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-4 pl-2">Operation Timeline</h3>
            <div className="space-y-0 pl-4">
              {statusOrder.map((status, index) => {
                const isCompleted = index < currentStatusIdx;
                const isCurrent = index === currentStatusIdx;
                
                return (
                  <div key={status} className="relative pl-6 pb-6 last:pb-0">
                    {/* Line connecting nodes */}
                    {index !== statusOrder.length - 1 && (
                      <div className={`absolute left-[7px] top-5 bottom-0 w-[2px] rounded-full ${
                        isCompleted ? "bg-primary shadow-[0_0_10px_rgba(0,240,255,0.5)]" : "bg-white/10"
                      }`} />
                    )}
                    
                    {/* Node icon */}
                    <div className="absolute left-0 top-1">
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-primary bg-black rounded-full" />
                      ) : isCurrent ? (
                        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                          <CircleDashed className="w-4 h-4 text-primary animate-spin bg-black rounded-full" />
                        </motion.div>
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-white/20 bg-black" />
                      )}
                    </div>

                    <p className={`text-sm font-bold capitalize ${
                      isCompleted ? "text-white/70" : isCurrent ? "text-primary shadow-text" : "text-white/30"
                    }`}>
                      {statusLabels[status]}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Button Controls */}
        <div className="space-y-3 pt-4">
          {booking.status === "assigned" && (
            <div className="flex gap-4">
              <button 
                onClick={() => handleUpdateStatus("cancelled")}
                disabled={actionLoading}
                className="flex-1 py-4 font-bold text-sm bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl hover:bg-red-500/20 transition-all text-center"
              >
                Reject Job
              </button>
              <GlowButton 
                onClick={() => handleUpdateStatus("accepted")}
                disabled={actionLoading}
                className="flex-[2] py-4 text-sm"
              >
                Accept Job
              </GlowButton>
            </div>
          )}

          {booking.status === "accepted" && (
            <GlowButton 
              onClick={() => handleUpdateStatus("en_route")}
              disabled={actionLoading}
              className="w-full py-4 text-sm"
            >
              Start Travel
            </GlowButton>
          )}

          {booking.status === "en_route" && (
            <GlowButton 
              onClick={() => handleUpdateStatus("arrived")}
              disabled={actionLoading}
              className="w-full py-4 text-sm"
            >
              Arrived
            </GlowButton>
          )}

          {booking.status === "arrived" && (
            <GlowButton 
              onClick={() => handleUpdateStatus("working")}
              disabled={actionLoading}
              className="w-full py-4 text-sm"
            >
              Start Work
            </GlowButton>
          )}

          {booking.status === "working" && (
            <GlowButton 
              onClick={() => handleUpdateStatus("completed")}
              disabled={actionLoading}
              className="w-full py-4 text-sm bg-tertiary text-black"
            >
              Complete
            </GlowButton>
          )}

          {booking.status === "completed" && (
            <div className="p-4 rounded-2xl border border-tertiary/20 bg-tertiary/5 text-center text-tertiary font-mono text-xs">
              OPERATION COMPLETE • LOG PERSISTED SUCCESSFULLY
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}
