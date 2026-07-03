"use client";

import { motion } from "framer-motion";
import { useStore } from "@/store/useStore";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { GlassCard, GlowButton } from "@/components/shared";
import { RequestService } from "@/lib/services/RequestService";
import { CheckCircle2, Calendar, Clock, MapPin, ArrowRight, ShieldCheck, CreditCard, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function BookingPage() {
  const router = useRouter();
  const { selectedProvider, setWorkflowStatus, currentRequestId, extractedData, setCurrentBookingId } = useStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!selectedProvider) {
    return (
      <div className="pt-16 pb-28 px-4 min-h-screen bg-[#050505] flex flex-col justify-center items-center">
        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
          <AlertCircle className="w-6 h-6 text-red-400" />
        </div>
        <h2 className="text-base font-bold text-white mb-2">No selected provider candidate</h2>
        <p className="text-[11px] text-on-surface-variant/60 text-center max-w-[260px] mb-6">
          Please complete the AI recommendation matching process first.
        </p>
        <Link href="/providers">
          <span className="inline-block text-[10px] uppercase font-mono tracking-wider font-bold bg-primary text-black px-4 py-2 rounded-xl cursor-pointer">
            View Matches
          </span>
        </Link>
      </div>
    );
  }

  const handleConfirm = async () => {
    if (!currentRequestId) {
      setError("No active request found.");
      return;
    }
    
    setLoading(true);
    try {
      const booking = await RequestService.createBooking(
        currentRequestId, 
        selectedProvider.id, 
        extractedData.time || new Date().toISOString()
      );
      setCurrentBookingId(booking.id);
      setWorkflowStatus("BOOKED");
      router.push("/tracking");
    } catch (err: any) {
      setError("Failed to secure protocol: " + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="pt-16 pb-28 px-4 min-h-screen bg-[#050505]">
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-16 h-16 rounded-2xl bg-primary/5 border border-primary/20 flex items-center justify-center mx-auto mb-4"
        >
          <CheckCircle2 className="w-8 h-8 text-primary-fixed-dim" />
        </motion.div>
        <h1 className="text-xl font-bold text-white tracking-tight">Review Order</h1>
        <p className="text-[10px] text-on-surface-variant opacity-60">Finalizing autonomous schedule.</p>
      </div>

      <div className="space-y-4">
        {/* Booking Summary */}
        <div className="bg-[#111] p-5 rounded-3xl border border-white/5 space-y-5 shadow-xl">
          <div className="flex items-center gap-4">
            <img 
              src={selectedProvider.profiles?.avatar || "https://ui-avatars.com/api/?name=" + (selectedProvider.profiles?.full_name || "Agent")} 
              className="w-14 h-14 rounded-2xl object-cover border border-white/5"
              alt={selectedProvider.profiles?.full_name || "Agent"}
            />
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">{selectedProvider.profiles?.full_name || "AI Selected Agent"}</h3>
              <p className="text-[10px] text-primary-fixed-dim uppercase tracking-widest">{selectedProvider.specialization || "General Specialist"}</p>
            </div>
          </div>

          <div className="h-[1px] bg-white/5" />

          <div className="space-y-3.5">
            {[
              { icon: Calendar, label: "Schedule", value: "Tomorrow • 10:00 AM" },
              { icon: MapPin, label: "Grid", value: "Sector G-13/1, ISB" },
              { icon: CreditCard, label: "Protocol", value: "Cash on Success" },
            ].map((item, idx) => (
              <div key={`${item.label}-${idx}`} className="flex items-start gap-3.5">
                <item.icon className="w-4 h-4 text-on-surface-variant/20 mt-0.5" />
                <div>
                  <p className="text-[8px] text-on-surface-variant/40 uppercase font-label-mono">{item.label}</p>
                  <p className="text-xs text-white/90 font-medium">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security / Trust Card */}
        <div className="p-3.5 bg-tertiary/5 border border-tertiary/10 rounded-2xl">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-4 h-4 text-tertiary-fixed-dim" />
            <p className="text-[10px] text-tertiary-fixed-dim font-bold uppercase tracking-widest">
              AetherFlow Guarantee Active
            </p>
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="p-4 space-y-2.5">
          <div className="flex justify-between text-xs">
            <span className="text-on-surface-variant/60">Service Unit</span>
            <span className="text-white font-medium">{selectedProvider.price || "Rs 1,500"}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-on-surface-variant/60">Network Fee</span>
            <span className="text-white font-medium">Rs 250</span>
          </div>
          <div className="h-[1px] bg-white/5 my-2" />
          <div className="flex justify-between text-base font-bold">
            <span className="text-white">Final Quote</span>
            <span className="text-primary-fixed-dim">Rs 1,750</span>
          </div>
        </div>

        {error && (
          <div className="p-3 mb-2 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
            <p className="text-red-400 text-xs font-mono">{error}</p>
          </div>
        )}
        
        <div className="pt-4">
          <GlowButton onClick={handleConfirm} disabled={loading} className="w-full py-4.5 text-base font-bold shadow-2xl disabled:opacity-50">
            {loading ? "Securing Protocol..." : "Confirm Protocol"}
            {!loading && <ArrowRight className="w-5 h-5" />}
          </GlowButton>
        </div>
      </div>
    </div>
  );
}
