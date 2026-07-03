"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/store/useStore";
import { useAuthStore } from "@/store/authStore";
import { GlassCard, GlowButton } from "@/components/shared";
import { MapPin, Phone, Clock, Shield, Navigation, Loader2, AlertCircle, Terminal, Eye, AlertTriangle } from "lucide-react";
import { RequestService } from "@/lib/services/RequestService";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import TraceService from "@/lib/services/TraceService";
import NarratorService, { NarratorEvent } from "@/lib/services/NarratorService";
import BookingService from "@/lib/services/BookingService";
import { cn } from "@/lib/utils";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const TrackingMap = dynamic(() => import("./TrackingMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#080808] flex items-center justify-center text-white">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  )
});

interface Incident {
  code: 'LOW_PROVIDER_DENSITY' | 'TECHNICIAN_DELAY' | 'BOOKING_RETRY' | 'MAP_SYNC_WARNING' | 'ORCHESTRATION_TIMEOUT';
  severity: 'WARNING' | 'CRITICAL' | 'INFO';
  reason: string;
  metadata: any;
}

function TrackingContent() {
  const { currentBookingId, setCurrentBookingId, demoMode } = useStore();
  const { user } = useAuthStore();
  const searchParams = useSearchParams();
  
  const [resolvedBookingId, setResolvedBookingId] = useState<string | null>(searchParams.get("bookingId") || currentBookingId);
  const [booking, setBooking] = useState<any>(null);
  const [bookingStatus, setBookingStatus] = useState("pending");
  const [eta, setEta] = useState("Waiting for technician");
  const [loading, setLoading] = useState(true);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Live narrative and incidents
  const [commentary, setCommentary] = useState<NarratorEvent[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const commentaryEndRef = useRef<HTMLDivElement>(null);
  const intervalIdRef = useRef<any>(null);

  const handleCancelBooking = async () => {
    if (!resolvedBookingId) return;
    setIsCancelling(true);
    try {
      // 1. Update booking status to cancelled
      await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          technician_status: 'cancelled'
        })
        .eq('id', resolvedBookingId);

      // 2. Update request status to cancelled and insert live trace log
      if (booking?.request_id) {
        await supabase
          .from('requests')
          .update({ status: 'cancelled' })
          .eq('id', booking.request_id);

        await TraceService.create(
          booking.request_id,
          'TRACE_AGENT',
          'RESIDENT_CANCELLED',
          'Resident terminated this service booking protocol.',
          'WARNING'
        );

        await NarratorService.appendEvent(
          booking.request_id,
          "Resident terminated this active service booking protocol.",
          "CANCELLED"
        );
      }

      setBookingStatus('cancelled');
      setBooking((prev: any) => prev ? { ...prev, status: 'cancelled', technician_status: 'cancelled' } : null);
      setShowCancelModal(false);
    } catch (err) {
      console.error("Failed to execute cancellation:", err);
    } finally {
      setIsCancelling(false);
    }
  };

  // Auto-resolve active booking if not provided in URI
  useEffect(() => {
    const resolveActiveBooking = async () => {
      if (resolvedBookingId) {
        setLoading(false);
        return;
      }
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const requests = await RequestService.getUserRequests(user.id);
        const latestWithBooking = requests.find(r => r.bookings && r.bookings.length > 0);
        if (latestWithBooking) {
          const bId = latestWithBooking.bookings[0].id;
          setResolvedBookingId(bId);
          setCurrentBookingId(bId);
        }
      } catch (err) {
        console.error("Failed to restore tracking booking session:", err);
      } finally {
        setLoading(false);
      }
    };
    resolveActiveBooking();
  }, [user, resolvedBookingId]);

  // Dynamic Incident Detection Loop
  const detectIncidents = (b: any, traces: any[]): Incident[] => {
    const activeIncidents: Incident[] = [];

    // 1. LOW_PROVIDER_DENSITY
    const lowDensity = traces.some(t => 
      t.parsedAction?.toLowerCase().includes("low density") || 
      t.reason?.toLowerCase().includes("low density")
    );
    if (lowDensity) {
      activeIncidents.push({
        code: 'LOW_PROVIDER_DENSITY',
        severity: 'WARNING',
        reason: 'Low density of service nodes detected near the target sector.',
        metadata: { providerCount: 1 }
      });
    }

    // 2. TECHNICIAN_DELAY
    if (b.status === 'en_route' && (b.eta_minutes > 12 || b.route_progress < 15)) {
      activeIncidents.push({
        code: 'TECHNICIAN_DELAY',
        severity: 'WARNING',
        reason: 'Technician transit speed reduced due to traffic node anomalies.',
        metadata: { eta: b.eta_minutes }
      });
    }

    // 3. BOOKING_RETRY
    const bookingRetries = traces.filter(t => t.agent === 'BOOKING_AGENT' && t.parsedAction?.toLowerCase().includes("retry"));
    if (bookingRetries.length > 0 || traces.some(t => t.severity === 'WARNING' && t.parsedAction?.includes("retry"))) {
      activeIncidents.push({
        code: 'BOOKING_RETRY',
        severity: 'CRITICAL',
        reason: 'Booking allocation timeout. Initiating secondary server dispatch loop.',
        metadata: { retryCount: bookingRetries.length + 1 }
      });
    }

    // 4. MAP_SYNC_WARNING
    if (!b.current_lat || !b.current_lng || b.current_lat === 0) {
      activeIncidents.push({
        code: 'MAP_SYNC_WARNING',
        severity: 'WARNING',
        reason: 'Temporary satellite telemetry synchronization delay.',
        metadata: { coords: null }
      });
    }

    // 5. ORCHESTRATION_TIMEOUT
    if (b.status === 'pending' && new Date(b.created_at).getTime() < Date.now() - 30000) {
      activeIncidents.push({
        code: 'ORCHESTRATION_TIMEOUT',
        severity: 'CRITICAL',
        reason: 'Consensus timeout inside deep learning pipeline. Refresh safe protocol active.',
        metadata: { activeDurationSec: 30 }
      });
    }

    return activeIncidents;
  };

  // Main polling logic for tracking state
  useEffect(() => {
    if (!resolvedBookingId) return;

    // Check if the current booking has already finished to stop active polling
    const isTerminal = bookingStatus === "completed" || bookingStatus === "cancelled" || bookingStatus === "rejected";

    const fetchBooking = async () => {
      try {
        const b = await RequestService.getBookingById(resolvedBookingId);
        if (b) {
          setBooking(b);
          setBookingStatus(b.status);
          
          if (b.status === "completed") {
            setEta("Completed");
          } else if (b.status === "arrived") {
            setEta("Arrived");
          } else if (b.status === "working") {
            setEta("In Progress");
          } else if (b.status === "en_route") {
            setEta(b.eta_minutes !== undefined && b.eta_minutes !== null ? `${b.eta_minutes} Mins` : "12 Mins");
          } else if (b.status === "accepted") {
            setEta(b.eta_minutes !== undefined && b.eta_minutes !== null ? `${b.eta_minutes} Mins` : "Preparing");
          } else {
            setEta("Confirmed");
          }

          // Dynamic commentary and incidents injection
          const traces = await TraceService.getByRequest(b.request_id);
          const detected = detectIncidents(b, traces);
          setIncidents(detected);

          // Get orchestration session
          const session = await BookingService.getOrchestrationSession(b.request_id);

          // Generate dynamic comments passing the already loaded traces
          await NarratorService.autoNarrate(b.request_id, b, session, traces);
          const events = await NarratorService.getEvents(b.request_id);
          setCommentary(events);

          // Scroll to latest commentary
          setTimeout(() => {
            commentaryEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);

          // Stop active polling immediately upon completion
          if (b.status === "completed" || b.status === "cancelled" || b.status === "rejected") {
            if (intervalIdRef.current) {
              clearInterval(intervalIdRef.current);
              intervalIdRef.current = null;
            }
          }
        }
      } catch (e) {
        console.error("Failed to query live tracking booking details:", e);
      }
    };

    fetchBooking();
    if (isTerminal) {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
      return;
    }

    intervalIdRef.current = setInterval(fetchBooking, 3000);
    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    };
  }, [resolvedBookingId, bookingStatus]);

  // Demo Mode Automation Loop
  const simActiveRef = useRef<string | null>(null);

  useEffect(() => {
    if (!demoMode || !resolvedBookingId || !booking) return;
    
    // Avoid double-running simulation for the same booking
    if (simActiveRef.current === resolvedBookingId) return;
    simActiveRef.current = resolvedBookingId;

    let active = true;

    const runDemoSimulation = async () => {
      console.log("[Demo Simulation] Starting for booking:", resolvedBookingId);
      
      while (active) {
        // Refresh booking details
        let b;
        try {
          b = await RequestService.getBookingById(resolvedBookingId);
          if (!b) break;
        } catch (e) {
          console.error("Simulation failed to fetch booking:", e);
          await new Promise(r => setTimeout(r, 2000));
          continue;
        }

        // Terminal state check
        if (b.status === "completed" || b.status === "cancelled" || b.status === "rejected") {
          console.log("[Demo Simulation] Terminal status reached:", b.status);
          break;
        }

        const status = b.status;
        console.log("[Demo Simulation] Current status:", status);

        if (status === "pending") {
          // Transition pending -> accepted
          console.log("[Demo Simulation] Transitioning pending -> accepted");
          try {
            await BookingService.updateStatus(resolvedBookingId, "accepted");
          } catch (e) {
            console.error("Simulation transition to accepted failed:", e);
          }
          await new Promise(r => setTimeout(r, 2000));
        } else if (status === "accepted") {
          // Transition accepted -> en_route
          console.log("[Demo Simulation] Transitioning accepted -> en_route");
          try {
            await BookingService.updateStatus(resolvedBookingId, "en_route");
          } catch (e) {
            console.error("Simulation transition to en_route failed:", e);
          }
          await new Promise(r => setTimeout(r, 2000));
        } else if (status === "en_route") {
          // Tick movement progress
          const progress = b.route_progress || 0;
          if (progress >= 100) {
            console.log("[Demo Simulation] Transitioning en_route -> arrived");
            try {
              await BookingService.updateStatus(resolvedBookingId, "arrived");
            } catch (e) {
              console.error("Simulation transition to arrived failed:", e);
            }
            await new Promise(r => setTimeout(r, 2000));
          } else {
            // Calculate next position & progress
            const nextProgress = Math.min(100, progress + 20);
            
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

            const requestLoc = b.requests?.location || 'Islamabad';
            const destCoords = getCoordinates(requestLoc);
            const startLat = destCoords.lat + 0.015;
            const startLng = destCoords.lng + 0.015;
            const destLat = b.user_lat || destCoords.lat;
            const destLng = b.user_lng || destCoords.lng;

            // Bearing calculation helper
            const calculateBearing = (lat1: number, lng1: number, lat2: number, lng2: number) => {
              const dLng = (lng2 - lng1) * Math.PI / 180;
              const lat1Rad = lat1 * Math.PI / 180;
              const lat2Rad = lat2 * Math.PI / 180;
              const y = Math.sin(dLng) * Math.cos(lat2Rad);
              const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);
              return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
            };

            const bearing = calculateBearing(startLat, startLng, destLat, destLng);
            const angleRad = (bearing + 90) * Math.PI / 180;
            const wave = Math.sin((nextProgress / 100) * Math.PI * 4);
            const amplitude = 0.0008;
            const driftLat = Math.cos(angleRad) * wave * amplitude + (Math.random() - 0.5) * 0.0001;
            const driftLng = Math.sin(angleRad) * wave * amplitude + (Math.random() - 0.5) * 0.0001;

            const nextLat = startLat + (destLat - startLat) * (nextProgress / 100) + driftLat;
            const nextLng = startLng + (destLng - startLng) * (nextProgress / 100) + driftLng;

            // Calculate dynamic ETA using distance
            const earthRadius = 6371; // km
            const dLat = (destLat - nextLat) * Math.PI / 180;
            const dLng = (destLng - nextLng) * Math.PI / 180;
            const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                      Math.cos(nextLat * Math.PI / 180) * Math.cos(destLat * Math.PI / 180) *
                      Math.sin(dLng/2) * Math.sin(dLng/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            const remainingDistanceKm = earthRadius * c;
            const speedKmh = 45;
            const nextEta = Math.max(1, Math.round((remainingDistanceKm / speedKmh) * 60));

            console.log(`[Demo Simulation] Movement update: progress=${nextProgress}%, eta=${nextEta} mins`);
            try {
              await BookingService.updateMovement(
                resolvedBookingId,
                nextLat,
                nextLng,
                nextProgress,
                nextEta
              );
            } catch (e) {
              console.error("Simulation movement update failed:", e);
            }
            await new Promise(r => setTimeout(r, 2000));
          }
        } else if (status === "arrived") {
          // Transition arrived -> working
          console.log("[Demo Simulation] Transitioning arrived -> working");
          try {
            await BookingService.updateStatus(resolvedBookingId, "working");
          } catch (e) {
            console.error("Simulation transition to working failed:", e);
          }
          await new Promise(r => setTimeout(r, 4000));
        } else if (status === "working") {
          // Transition working -> completed
          console.log("[Demo Simulation] Transitioning working -> completed");
          try {
            await BookingService.updateStatus(resolvedBookingId, "completed");
          } catch (e) {
            console.error("Simulation transition to completed failed:", e);
          }
          await new Promise(r => setTimeout(r, 4000));
        }
      }
    };

    runDemoSimulation();

    return () => {
      active = false;
      simActiveRef.current = null;
    };
  }, [demoMode, resolvedBookingId, booking?.status]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col justify-center items-center px-4">
        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
          <AlertCircle className="w-6 h-6 text-red-400" />
        </div>
        <h2 className="text-base font-bold text-white mb-2">No active tracking session</h2>
        <p className="text-[11px] text-on-surface-variant/60 text-center max-w-[260px] mb-6">
          There is no live operational process currently mapped to your interface.
        </p>
        <Link href="/home">
          <span className="inline-block text-[10px] uppercase font-mono tracking-wider font-bold bg-primary text-black px-4 py-2 rounded-xl cursor-pointer">
            Return Home
          </span>
        </Link>
      </div>
    );
  }

  const providerProfile = booking.providers?.profiles;
  const providerDetails = booking.providers;

  // Coordinate Defaults resolved dynamically to satisfy Section 5 Map Safety
  const resolveCoordinates = (loc: string) => {
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

  const requestCoords = resolveCoordinates(booking.requests?.location || "");
  const userLat = booking.user_lat || requestCoords.lat;
  const userLng = booking.user_lng || requestCoords.lng;
  const techLat = booking.current_lat;
  const techLng = booking.current_lng;
  const progress = booking.route_progress || 0;

  // Live Telemetry Parsing
  let telemetry = { last_seen: new Date().toISOString(), device_status: "active", network_status: "online" };
  try {
    if (booking.travel_status && booking.travel_status.trim().startsWith('{')) {
      telemetry = JSON.parse(booking.travel_status);
    }
  } catch (e) {}

  let telemetryStatus = "online";
  if (telemetry.network_status === "offline") {
    telemetryStatus = "offline";
  } else if (booking.status === "working") {
    telemetryStatus = "working";
  } else if (booking.status === "en_route") {
    telemetryStatus = "moving";
  } else {
    telemetryStatus = "online";
  }

  const dotColors: { [key: string]: string } = {
    online: "bg-green-500 shadow-[0_0_8px_#22c55e]",
    moving: "bg-blue-500 shadow-[0_0_8px_#3b82f6] animate-pulse",
    working: "bg-amber-500 shadow-[0_0_8px_#f59e0b] animate-ping",
    offline: "bg-red-500 shadow-[0_0_8px_#ef4444]"
  };

  return (
    <div className="min-h-screen bg-[#050505] relative overflow-hidden">
      {/* Live Map Background */}
      <div className="absolute inset-0 z-0">
        <TrackingMap
          userLat={userLat}
          userLng={userLng}
          techLat={techLat}
          techLng={techLng}
          techName={providerProfile?.full_name}
        />
      </div>

      {/* Floating Status & Commentary Cards */}
      <div className="absolute top-16 left-4 right-4 z-20 space-y-2">
        
        {/* Floating Status Card */}
        <div className="bg-[#111]/90 backdrop-blur-md p-3.5 flex flex-col gap-2.5 border border-white/5 rounded-2xl shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <Clock className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-[8px] text-on-surface-variant/60 uppercase font-mono">Dynamic ETA</p>
                <h3 className="text-base font-bold text-white tracking-tight">{eta}</h3>
              </div>
            </div>
            <span className="text-[9px] text-primary font-bold uppercase tracking-widest px-2 py-1 rounded-lg bg-primary/5 border border-primary/20">
              {bookingStatus.replace("_", " ").toUpperCase()}
            </span>
          </div>

          {/* Route Progress */}
          {bookingStatus !== "completed" && progress > 0 && (
            <div className="w-full">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[8px] text-white/50 font-mono">Route Progress</span>
                <span className="text-[8px] text-primary font-mono">{progress}%</span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-primary" 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Live Incident Alert Panel */}
        <AnimatePresence>
          {incidents.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 flex gap-2.5 items-start text-amber-400 backdrop-blur-md shadow-lg"
            >
              <AlertTriangle className="w-4 h-4 mt-0.5 animate-bounce flex-shrink-0" />
              <div>
                <h4 className="text-[9px] font-bold uppercase tracking-wider font-mono">
                  Operational Warning: {incidents[0].code}
                </h4>
                <p className="text-[9px] leading-relaxed text-amber-300/80 mt-0.5">
                  {incidents[0].reason}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mission Commentary auto-scrolling terminal (P4) */}
        <div className="bg-[#050505]/95 backdrop-blur-md border border-white/5 p-3 rounded-2xl shadow-2xl flex flex-col h-28">
          <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-white/5">
            <Terminal className="w-3 h-3 text-primary animate-pulse" />
            <h4 className="text-[8px] font-mono uppercase tracking-widest text-white/50 flex-1">
              Mission Commentary
            </h4>
            <span className="text-[7px] font-mono text-primary bg-primary/15 px-1 py-0.5 rounded uppercase tracking-wider">
              Autonomous Narrator
            </span>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar space-y-1.5 text-[8.5px]">
            {commentary.map((evt, i) => (
              <div key={evt.id || i} className="font-mono text-white/70 leading-relaxed">
                <span className="text-primary-fixed-dim/40 mr-1.5">
                  [{new Date(evt.created_at).toLocaleTimeString()}]
                </span>
                <span className="text-white/95">{evt.message}</span>
              </div>
            ))}
            {commentary.length === 0 && (
              <div className="h-full flex items-center justify-center text-white/20 font-mono text-[8px] uppercase tracking-wider">
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5 text-white/10" />
                Booting narrator stream...
              </div>
            )}
            <div ref={commentaryEndRef} />
          </div>
        </div>

      </div>

      {/* Provider Controls */}
      <div className="absolute bottom-24 left-4 right-4 z-20">
        <div className="bg-[#111]/95 backdrop-blur-lg p-5 border border-white/5 rounded-3xl shadow-2xl">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-4">
              <img 
                src={providerProfile?.avatar || "https://ui-avatars.com/api/?name=" + (providerProfile?.full_name || "Agent")} 
                className="w-12 h-12 rounded-2xl object-cover border border-white/10" 
                alt="" 
              />
              <div>
                <h4 className="text-sm font-bold text-white tracking-tight">{providerProfile?.full_name || "AI Selected Agent"}</h4>
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3 h-3 text-primary opacity-70" />
                  <span className="text-[9px] text-on-surface-variant/60">Verified Specialist</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <a href={`tel:${providerProfile?.phone || "030000000"}`} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-colors border border-white/5">
                <Phone className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div className="bg-white/5 rounded-2xl p-3.5 flex justify-between">
            <div className="text-center flex-1">
              <p className="text-[8px] text-on-surface-variant/40 uppercase font-mono mb-1">Rating</p>
              <p className="text-xs font-bold text-white">{(providerDetails?.rating || 5.0).toFixed(1)} ★</p>
            </div>
            <div className="w-[1px] bg-white/10" />
            <div className="text-center flex-1">
              <p className="text-[8px] text-on-surface-variant/40 uppercase font-mono mb-1">Jobs</p>
              <p className="text-xs font-bold text-white">{providerDetails?.completed_jobs || 0}+</p>
            </div>
            <div className="w-[1px] bg-white/10" />
            <div className="text-center flex-1">
              <p className="text-[8px] text-on-surface-variant/40 uppercase font-mono mb-1">Telemetry</p>
              <p className="text-xs font-bold text-white capitalize flex items-center justify-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${dotColors[telemetryStatus]}`} />
                {telemetryStatus}
              </p>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-white/5 flex flex-col gap-2">
            {bookingStatus === "completed" && (
              <Link href={`/followup?bookingId=${booking.id}`} className="w-full">
                <GlowButton className="w-full py-2.5 text-[11px] font-bold uppercase tracking-wider bg-tertiary text-black hover:bg-tertiary/90">
                  Complete Audit Report
                </GlowButton>
              </Link>
            )}
            <Link href={`/trace?requestId=${booking.request_id}`} className="w-full">
              <GlowButton variant="outline" className="w-full py-2.5 text-[11px] font-mono uppercase tracking-wider">
                Analyze AI Execution Logs
              </GlowButton>
            </Link>
            {bookingStatus !== "completed" && bookingStatus !== "cancelled" && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="w-full py-2.5 rounded-xl border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Cancel Booking
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#111] border border-white/10 rounded-3xl p-6 max-w-sm w-full text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4 animate-bounce" />
            <h3 className="text-base font-bold text-white mb-2">Cancel Service Booking?</h3>
            <p className="text-xs text-white/60 mb-6">
              Are you sure you want to terminate this active service request protocol? This will dispatch a cancellation signal to your technician.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-colors cursor-pointer"
              >
                Go Back
              </button>
              <button
                disabled={isCancelling}
                onClick={handleCancelBooking}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-black text-xs font-bold hover:bg-red-600 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isCancelling ? "Cancelling..." : "Confirm Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrackingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <TrackingContent />
    </Suspense>
  );
}
