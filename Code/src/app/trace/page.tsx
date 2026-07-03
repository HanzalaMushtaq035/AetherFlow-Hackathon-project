"use client";

import { useStore } from "@/store/useStore";
import { Terminal, ArrowLeft, Loader2 } from "lucide-react";
import { TraceCard } from "@/components/ai";
import Link from "next/link";
import { motion } from "framer-motion";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import TraceService from "@/lib/services/TraceService";

function TraceContent() {
  const { currentRequestId } = useStore();
  const searchParams = useSearchParams();
  const requestId = searchParams.get("requestId") || currentRequestId;

  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      if (!requestId) {
        setLoading(false);
        return;
      }
      try {
        const traces = await TraceService.getByRequest(requestId);
        const mappedLogs = traces.map((t: any) => ({
          id: t.id,
          timestamp: new Date(t.created_at || Date.now()).toLocaleTimeString(),
          agent: t.agent || "System",
          message: `${t.parsedAction}${t.reason ? ` (${t.reason})` : ''}`,
          type: t.severity || 'INFO'
        }));
        setLogs(mappedLogs);
      } catch (err) {
        console.error("Failed to load live traces:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
    
    // Live update interval
    const interval = setInterval(fetchLogs, 4000);
    return () => clearInterval(interval);
  }, [requestId]);

  return (
    <div className="bg-[#0a0a0a] rounded-2xl border border-white/5 p-5 min-h-[480px] shadow-2xl">
      <div className="flex items-center gap-3 mb-5 border-b border-white/5 pb-4">
        <div className="p-2 rounded-xl bg-primary/5">
          <Terminal className="w-4 h-4 text-primary-fixed-dim" />
        </div>
        <div className="flex-1">
          <h2 className="text-[11px] font-bold text-white uppercase tracking-wider">Reasoning Logs</h2>
          <p className="text-[8px] text-on-surface-variant/40 font-label-mono uppercase tracking-widest">
            {requestId ? `Session: ${requestId.substring(0, 8).toUpperCase()}` : "No Active Session"}
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : logs.length > 0 ? (
          logs.map((log, i) => (
            <motion.div
              key={`${log.id}-${i}`}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <TraceCard log={log} />
            </motion.div>
          ))
        ) : (
          <div className="text-center py-20 opacity-10">
            <Terminal className="w-10 h-10 mx-auto mb-4" />
            <p className="font-label-mono text-[10px] uppercase tracking-widest">
              {requestId ? "Awaiting Logs..." : "Awaiting Protocol Init"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TracePage() {
  return (
    <div className="pt-16 pb-28 px-4 min-h-screen bg-[#050505]">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/activity">
          <div className="p-2 rounded-xl bg-surface-container hover:bg-white/5 transition-colors">
            <ArrowLeft className="w-5 h-5 text-on-surface-variant" />
          </div>
        </Link>
        <h1 className="text-lg font-bold text-white tracking-tight">System Trace</h1>
      </div>

      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[480px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }>
        <TraceContent />
      </Suspense>

      <div className="mt-6">
        <div className="bg-[#111] border border-primary/10 rounded-2xl p-4">
          <h4 className="text-[10px] font-bold text-primary-fixed-dim mb-1.5 uppercase tracking-widest opacity-80">Logic Summary</h4>
          <p className="text-[10px] text-on-surface-variant/60 leading-relaxed tracking-tight">
            The engine evaluates provider reliability, proximity, and historical performance using multi-agent consensus algorithms.
          </p>
        </div>
      </div>
    </div>
  );
}
