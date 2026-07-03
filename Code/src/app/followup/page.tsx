"use client";

import { motion } from "framer-motion";
import { GlassCard, GlowButton } from "@/components/shared";
import { Star, ThumbsUp, ThumbsDown, ArrowLeft, Send, Loader2, AlertCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { AIOrb } from "@/components/ai";
import Link from "next/link";
import { useStore } from "@/store/useStore";
import { useEffect, useState, Suspense } from "react";
import { RequestService } from "@/lib/services/RequestService";

function FollowupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentBookingId } = useStore();
  const bookingId = searchParams.get("bookingId") || currentBookingId;

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState(5);
  const [sentiment, setSentiment] = useState<"satisfied" | "issues">("satisfied");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!bookingId) {
      setLoading(false);
      return;
    }
    const fetchBooking = async () => {
      try {
        const b = await RequestService.getBookingById(bookingId);
        if (b) {
          setBooking(b);
        }
      } catch (err) {
        console.error("Failed to load audit booking:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [bookingId]);

  const handleSubmit = async () => {
    if (!bookingId) {
      setError("No operational session mapped to insert followups.");
      return;
    }
    setSubmitting(true);
    try {
      const msg = `Rating: ${rating} ★ • Sentiment: ${sentiment.toUpperCase()} • Feedback: ${feedback || "None"}`;
      await RequestService.createFollowup(bookingId, msg);
      
      // Update provider rating dynamically if we want to simulate operational integrity
      router.push("/home");
    } catch (err: any) {
      setError("Failed to submit feedback: " + err.message);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[480px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="pt-16 pb-28 px-4 min-h-screen bg-[#050505] flex flex-col justify-center items-center">
        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
          <AlertCircle className="w-6 h-6 text-red-400" />
        </div>
        <h2 className="text-base font-bold text-white mb-2">No active audit session</h2>
        <p className="text-[11px] text-on-surface-variant/60 text-center max-w-[260px] mb-6">
          There is no completed booking requiring a neural feedback review.
        </p>
        <Link href="/home">
          <span className="inline-block text-[10px] uppercase font-mono tracking-wider font-bold bg-primary text-black px-4 py-2 rounded-xl cursor-pointer">
            Return Home
          </span>
        </Link>
      </div>
    );
  }

  const providerName = booking?.providers?.profiles?.full_name || "the Agent";

  return (
    <div className="pt-16 pb-28 px-4 min-h-screen bg-[#050505]">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/activity">
          <div className="p-2 rounded-xl bg-surface-container hover:bg-white/5 transition-colors cursor-pointer">
            <ArrowLeft className="w-5 h-5 text-on-surface-variant" />
          </div>
        </Link>
        <h1 className="text-lg font-bold text-white tracking-tight">Audit Report</h1>
      </div>

      <section className="flex flex-col items-center mb-10">
        <AIOrb size="md" status="thinking" />
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 bg-[#111] border border-white/5 rounded-2xl p-5 text-center shadow-xl w-full"
        >
          <p className="text-xs text-white/80 leading-relaxed tracking-tight">
            "I noticed {providerName} completed the task. Was everything satisfactory, or should I initiate a dispute protocol?"
          </p>
        </motion.div>
      </section>

      <section className="space-y-6">
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => setSentiment("satisfied")}
            className={`flex flex-col items-center justify-center gap-3 p-5 rounded-2xl transition-all border ${
              sentiment === "satisfied" ? "bg-primary/5 border-primary/20" : "bg-[#111] border-white/5"
            }`}
          >
            <ThumbsUp className={`w-6 h-6 ${sentiment === "satisfied" ? "text-primary-fixed-dim" : "text-on-surface-variant/40"}`} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Satisfied</span>
          </button>
          <button 
            onClick={() => setSentiment("issues")}
            className={`flex flex-col items-center justify-center gap-3 p-5 rounded-2xl transition-all border ${
              sentiment === "issues" ? "bg-red-500/5 border-red-500/20" : "bg-[#111] border-white/5"
            }`}
          >
            <ThumbsDown className={`w-6 h-6 ${sentiment === "issues" ? "text-red-400" : "text-on-surface-variant/40"}`} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Issues</span>
          </button>
        </div>

        <div className="space-y-3">
          <h3 className="font-label-mono text-[9px] text-on-surface-variant/40 uppercase tracking-widest ml-1">Rating</h3>
          <div className="flex justify-between px-6 bg-[#111] p-4 rounded-2xl border border-white/5">
            {[1, 2, 3, 4, 5].map((star) => (
              <button 
                key={star} 
                onClick={() => setRating(star)} 
                className="active:scale-110 transition-transform"
              >
                <Star className={`w-6 h-6 ${star <= rating ? "text-[#FFD700] fill-[#FFD700]" : "text-white/5"}`} />
              </button>
            ))}
          </div>
        </div>

        <div className="bg-[#111] rounded-2xl p-1.5 pl-5 flex items-center border border-white/5">
          <input 
            type="text" 
            placeholder="Feedback..." 
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="bg-transparent border-none outline-none flex-1 text-sm text-white"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
            <p className="text-red-400 text-xs font-mono">{error}</p>
          </div>
        )}

        <div className="pt-4">
          <GlowButton className="w-full py-4.5 font-bold disabled:opacity-50" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Securing Audit..." : "Complete Audit"}
          </GlowButton>
        </div>
      </section>
    </div>
  );
}

export default function FollowupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <FollowupContent />
    </Suspense>
  );
}
