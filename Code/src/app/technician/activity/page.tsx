"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/shared";
import { Activity, Wrench, Loader2, Calendar } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { RequestService } from "@/lib/services/RequestService";
import TraceService from "@/lib/services/TraceService";

export default function TechnicianActivity() {
  const { user } = useAuthStore();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTechnicianActivity = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const bookings = await RequestService.getTechnicianBookings(user.id);
        if (!bookings || bookings.length === 0) {
          setLogs([]);
          return;
        }

        // Fetch traces for all technician requests
        const allLogs: any[] = [];
        for (const booking of bookings) {
          if (booking.request_id) {
            const traces = await TraceService.getByRequest(booking.request_id);
            traces.forEach((t: any) => {
              allLogs.push({
                id: t.id,
                type: `Grid Trace: ${booking.requests?.service || "Task"}`,
                message: t.action,
                time: new Date(t.created_at).toLocaleString(),
                timestamp: new Date(t.created_at).getTime(),
                icon: Wrench,
                color: "text-primary"
              });
            });
          }
          // Also push the booking creation itself as an activity
          allLogs.push({
            id: `booking-${booking.id}`,
            type: "Job Allocation",
            message: `Allocated to ${booking.requests?.service} at ${booking.requests?.location || " Islamabad"}. Status: ${booking.status.toUpperCase()}`,
            time: new Date(booking.scheduled_time || booking.created_at).toLocaleString(),
            timestamp: new Date(booking.scheduled_time || booking.created_at).getTime(),
            icon: Calendar,
            color: "text-secondary"
          });
        }

        // Sort descending by timestamp
        allLogs.sort((a, b) => b.timestamp - a.timestamp);
        setLogs(allLogs);
      } catch (err) {
        console.error("Failed to load technician activity:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTechnicianActivity();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] p-4 pb-28 pt-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Activity className="w-5 h-5 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-widest uppercase">System <span className="text-primary-fixed-dim">Log</span></h1>
      </div>

      <div className="space-y-4 relative">
        {logs.length > 0 && (
          <div className="absolute left-5 top-5 bottom-5 w-[1px] bg-gradient-to-b from-primary/50 via-white/10 to-transparent" />
        )}
        
        {logs.length === 0 ? (
          <div className="p-4 rounded-2xl border border-white/5 bg-[#111] text-center">
            <p className="text-xs text-on-surface-variant/60 font-mono">No activity logged in operational trace grid.</p>
          </div>
        ) : (
          logs.map((act, i) => {
            const Icon = act.icon;
            return (
              <motion.div 
                key={`${act.id}-${i}`} 
                initial={{ opacity: 0, x: -20 }} 
                animate={{ opacity: 1, x: 0 }} 
                transition={{ delay: i * 0.05 }}
                className="relative pl-12"
              >
                <div className={`absolute left-3.5 top-5 -translate-x-1/2 w-3 h-3 rounded-full bg-[#050505] border-2 shadow-[0_0_10px_currentColor] ${act.color} border-current`} />
                
                <GlassCard className="p-4 border-white/5 hover:bg-[#151515] transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className={`text-[10px] font-bold uppercase tracking-widest ${act.color}`}>{act.type}</h3>
                    <span className="text-[9px] text-white/40 font-mono">{act.time}</span>
                  </div>
                  <p className="text-sm text-white/80">{act.message}</p>
                </GlassCard>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
