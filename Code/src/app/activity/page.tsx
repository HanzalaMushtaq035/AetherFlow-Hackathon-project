"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { History, CheckCircle2, Clock, MapPin, ChevronRight, Zap, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { RequestService } from "@/lib/services/RequestService";

export default function ActivityPage() {
  const { user } = useAuthStore();
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      if (!user) return;
      try {
        const reqs = await RequestService.getUserRequests(user.id);
        const formatted = reqs.map(req => {
          const booking = req.bookings?.[0];
          const providerName = booking?.providers?.profiles?.full_name || "AetherFlow Node";
          const isActive = req.status !== 'completed' && req.status !== 'cancelled';
          return {
            id: req.id,
            service: req.service,
            provider: providerName,
            status: req.status.replace('_', ' ').toUpperCase(),
            date: new Date(req.created_at).toLocaleString(),
            location: req.location || "Remote",
            active: isActive,
          };
        });
        setActivities(formatted);
      } catch (err) {
        console.error("Failed to fetch activities", err);
      } finally {
        setLoading(false);
      }
    };
    fetchActivities();
  }, [user]);

  return (
    <div className="pt-16 pb-28 px-4 min-h-screen bg-[#050505]">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-bold text-white tracking-tight">Timeline</h1>
        <History className="w-4 h-4 text-on-surface-variant/20" />
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center p-8 text-on-surface-variant/50 text-sm">
            No past traces found in grid.
          </div>
        ) : (
          <AnimatePresence>
            {activities.map((activity, i) => (
          <motion.div
            key={`${activity.id}-${i}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Link href={activity.active ? "/tracking" : "/followup"}>
              <div 
                className={cn(
                  "p-4 rounded-2xl border border-white/5 bg-[#111] hover:bg-[#151515] transition-colors cursor-pointer",
                  activity.active && "border-primary/20 bg-primary/[0.03] hover:bg-primary/[0.05] shadow-lg shadow-primary/5"
                )}
              >
                <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-xl",
                    activity.active ? "bg-primary/10 text-primary-fixed-dim" : "bg-white/5 text-on-surface-variant/20"
                  )}>
                    {activity.active ? <Zap className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight">{activity.service}</h3>
                    <p className="text-[10px] text-on-surface-variant/60">{activity.provider}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={cn(
                    "text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-md",
                    activity.active ? "text-primary-fixed-dim bg-primary/5 border border-primary/20" : "text-on-surface-variant/30 bg-white/5"
                  )}>
                    {activity.status}
                  </span>
                  <p className="text-[9px] text-on-surface-variant/40 mt-2">{activity.date}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-on-surface-variant/20" />
                  <span className="text-[9px] text-on-surface-variant/40">{activity.location}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-on-surface-variant/20" />
              </div>
            </div>
            </Link>
          </motion.div>
        ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}


