"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/shared";
import { Wallet, TrendingUp, BarChart3, ArrowUpRight, ArrowDownRight, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { RequestService } from "@/lib/services/RequestService";

export default function TechnicianEarnings() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [completedBookings, setCompletedBookings] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({
    balance: 0,
    todayEarnings: 0,
    totalJobs: 0
  });
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    const fetchEarnings = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const bookings = await RequestService.getTechnicianBookings(user.id);
        const completed = bookings.filter(b => b.status === "completed");
        setCompletedBookings(completed);

        let balance = 0;
        let todayEarnings = 0;
        const txLog: any[] = [];
        const todayStr = new Date().toDateString();

        completed.forEach((b, idx) => {
          // Parse price or default to 1500
          const rawPrice = b.requests?.price || "Rs 1500";
          const numericPrice = parseInt(rawPrice.replace(/[^0-9]/g, ""), 10) || 1500;
          const platformFee = Math.round(numericPrice * 0.1);
          const netEarnings = numericPrice - platformFee;

          balance += netEarnings;

          const jobDate = new Date(b.scheduled_time || b.created_at);
          if (jobDate.toDateString() === todayStr) {
            todayEarnings += netEarnings;
          }

          // Add credit transaction
          txLog.push({
            id: `credit-${b.id}`,
            title: `${b.requests?.service || "Task Completion"} - ${b.requests?.location || "Sector"}`,
            date: jobDate.toLocaleString(),
            amount: `+Rs ${numericPrice.toLocaleString()}`,
            type: "credit",
            timestamp: jobDate.getTime()
          });

          // Add platform fee debit transaction
          txLog.push({
            id: `debit-${b.id}`,
            title: "Platform Allocation Fee (10%)",
            date: jobDate.toLocaleString(),
            amount: `-Rs ${platformFee.toLocaleString()}`,
            type: "debit",
            timestamp: jobDate.getTime() - 1000 // slightly older
          });
        });

        // Sort transaction log descending
        txLog.sort((a, b) => b.timestamp - a.timestamp);

        setMetrics({
          balance,
          todayEarnings,
          totalJobs: completed.length
        });
        setTransactions(txLog);
      } catch (err) {
        console.error("Failed to fetch financial grid metrics:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEarnings();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] p-4 pb-28 pt-8 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-tertiary/10 rounded-full blur-[100px] pointer-events-none" />

      <h1 className="text-2xl font-bold text-white tracking-widest uppercase mb-6 flex items-center gap-3">
        Financial <span className="text-tertiary-fixed-dim">Grid</span>
      </h1>

      {/* Main Balance Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <GlassCard className="p-6 border-tertiary/20 bg-gradient-to-br from-tertiary/10 to-transparent mb-6 shadow-[0_0_30px_rgba(150,255,150,0.05)]">
          <div className="flex justify-between items-start mb-2">
            <h2 className="text-xs font-bold text-tertiary uppercase tracking-widest flex items-center gap-2">
              <Wallet className="w-4 h-4" /> Available Balance
            </h2>
            <span className="px-2 py-1 rounded bg-tertiary/20 text-tertiary text-[9px] font-mono tracking-widest uppercase">Real-time</span>
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight my-2">Rs {metrics.balance.toLocaleString()}</h1>
          
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/10">
            <TrendingUp className="w-4 h-4 text-tertiary" />
            <p className="text-xs text-white/60">Operational efficiency payouts active.</p>
          </div>
        </GlassCard>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <GlassCard className="p-4 border-white/5">
            <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Today</p>
            <p className="text-lg font-bold text-white">Rs {metrics.todayEarnings.toLocaleString()}</p>
          </GlassCard>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <GlassCard className="p-4 border-white/5">
            <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Jobs Done</p>
            <p className="text-lg font-bold text-white">{metrics.totalJobs}</p>
          </GlassCard>
        </motion.div>
      </div>

      {/* Transactions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest">Transaction Log</h3>
          <BarChart3 className="w-4 h-4 text-white/30" />
        </div>
        
        {transactions.length === 0 ? (
          <div className="p-4 rounded-2xl border border-white/5 bg-[#111] text-center">
            <p className="text-xs text-on-surface-variant/60 font-mono">No financial transactions recorded.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx, idx) => (
              <motion.div key={`${tx.id}-${idx}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * idx }}>
                <GlassCard className="p-4 border-white/5 flex items-center justify-between hover:bg-white/[0.02] transition-all">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${tx.type === 'credit' ? 'bg-tertiary/10 text-tertiary' : 'bg-white/5 text-white/50'}`}>
                      {tx.type === 'credit' ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white truncate max-w-[200px]">{tx.title}</h4>
                      <p className="text-[10px] font-mono text-white/40 mt-1">{tx.date}</p>
                    </div>
                  </div>
                  <span className={`font-bold font-mono text-sm shrink-0 ${tx.type === 'credit' ? 'text-tertiary-fixed-dim' : 'text-white/50'}`}>
                    {tx.amount}
                  </span>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
