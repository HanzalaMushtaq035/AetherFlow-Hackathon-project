"use client";

import { motion } from "framer-motion";
import { ProviderCard } from "@/components/provider";
import { useStore, Provider } from "@/store/useStore";
import { useRouter } from "next/navigation";
import { ArrowLeft, Sparkles, Filter, Wrench } from "lucide-react";
import Link from "next/link";

export default function ProvidersPage() {
  const router = useRouter();
  const { providers, setSelectedProvider, setWorkflowStatus } = useStore();

  const handleSelect = (provider: Provider) => {
    setSelectedProvider(provider);
    setWorkflowStatus("MATCHED");
    router.push("/booking");
  };

  return (
    <div className="pt-16 pb-28 px-4 min-h-screen bg-[#050505]">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/orchestration">
            <div className="p-2 rounded-xl bg-surface-container hover:bg-white/5 transition-colors cursor-pointer">
              <ArrowLeft className="w-5 h-5 text-on-surface-variant" />
            </div>
          </Link>
          <h1 className="text-lg font-bold text-white tracking-tight">Best Matches</h1>
        </div>
        <div className="flex gap-2">
          <button className="p-2 rounded-xl bg-surface-container hover:bg-white/5 transition-colors">
            <Filter className="w-4 h-4 text-on-surface-variant" />
          </button>
        </div>
      </div>

      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4 px-1">
          <Sparkles className="w-3 h-3 text-primary-fixed-dim opacity-60" />
          <span className="font-label-mono text-[9px] text-primary-fixed-dim uppercase tracking-[0.2em] opacity-60">
            AI Priority Ranking
          </span>
        </div>
        
        {providers.length === 0 ? (
          <div className="p-8 rounded-2xl border border-white/5 bg-[#111] text-center my-6">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Wrench className="w-6 h-6 text-primary-fixed-dim" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">No candidates in transaction</h3>
            <p className="text-[11px] text-on-surface-variant/50 max-w-[240px] mx-auto mb-4">
              Initiate a new request protocol first to search and rank technicians.
            </p>
            <Link href="/request">
              <span className="inline-block text-[10px] uppercase font-mono tracking-wider font-bold bg-primary text-black px-4 py-2 rounded-xl cursor-pointer">
                Start Request
              </span>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {providers.map((provider, i) => (
              <motion.div
                key={`${provider.id}-${i}`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <ProviderCard 
                  provider={provider} 
                  onSelect={handleSelect}
                />
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {providers.length > 0 && (
        <div className="text-center opacity-30">
          <p className="text-[8px] text-on-surface-variant font-label-mono uppercase tracking-widest">
            Scanning provider candidate grid...
          </p>
        </div>
      )}
    </div>
  );
}
