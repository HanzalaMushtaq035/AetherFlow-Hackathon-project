"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Star, MapPin, Zap, Verified, ChevronRight } from "lucide-react";
import { GlassCard, GlowButton } from "../shared";
import { Provider } from "@/store/useStore";

export function RatingBadge({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
      <Star className="w-3 h-3 text-primary-fixed-dim fill-primary-fixed-dim" />
      <span className="font-label-mono text-[10px] text-white">{rating}</span>
    </div>
  );
}

export function DistanceChip({ distance }: { distance: string }) {
  return (
    <div className="flex items-center gap-1 bg-primary/5 border border-primary/10 px-2 py-0.5 rounded-full">
      <MapPin className="w-3 h-3 text-primary-fixed-dim" />
      <span className="font-label-mono text-[10px] text-primary-fixed-dim">{distance}</span>
    </div>
  );
}

export function AvailabilityTag({ status }: { status: string }) {
  return (
    <div className="flex items-center gap-1 bg-tertiary/5 border border-tertiary/10 px-2 py-0.5 rounded-full">
      <div className="w-1.5 h-1.5 rounded-full bg-tertiary-fixed-dim animate-pulse" />
      <span className="font-label-mono text-[9px] text-tertiary-fixed-dim uppercase">{status}</span>
    </div>
  );
}

export function ProviderCard({ provider, onSelect }: { provider: Provider; onSelect?: (p: Provider) => void }) {
  return (
    <GlassCard 
      className={cn("p-0 border-transparent hover:border-primary-fixed-dim/30 transition-all cursor-pointer group")}
      onClick={() => onSelect?.(provider)}
    >
      {provider.recommended && (
        <div className="absolute top-0 left-0 w-1 h-full bg-primary-fixed-dim shadow-[0_0_10px_#00dbe9]" />
      )}
      
      <div className="p-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="relative">
            <img 
              src={provider.profiles?.avatar || "https://ui-avatars.com/api/?name=" + (provider.profiles?.full_name || "Agent")} 
              alt={provider.profiles?.full_name || "Agent"}
              className="w-14 h-14 rounded-full object-cover border-2 border-primary-fixed-dim/30"
            />
            {provider.recommended && (
              <div className="absolute -bottom-1 -right-1 bg-primary-fixed-dim text-black rounded-full p-0.5">
                <Verified className="w-3 h-3" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-headline-md text-base text-primary">{provider.profiles?.full_name || "AI Selected Agent"}</h3>
                <p className="text-xs text-on-surface-variant">{provider.specialization}</p>
              </div>
              <div className="text-right">
                <span className="font-headline-md text-sm text-primary">{provider.price}</span>
                <p className="text-[10px] text-on-surface-variant">Est. Quote</p>
              </div>
            </div>
          </div>
        </div>

        {provider.reason && (
          <div className="bg-primary/5 border border-primary-fixed-dim/20 rounded-lg p-2 mb-4 flex items-start gap-2">
            <Zap className="w-3 h-3 text-primary-fixed-dim shrink-0 mt-0.5" />
            <p className="text-[10px] text-primary/90 leading-relaxed">
              <span className="font-bold">AI Insight:</span> {provider.reason}
            </p>
          </div>
        )}

        <div className="flex gap-2 mb-4">
          <RatingBadge rating={provider.rating || 5.0} />
          <DistanceChip distance={provider.distance || "1.2 km"} />
          <AvailabilityTag status={provider.availability} />
        </div>

        <GlowButton className="w-full py-2 text-sm" glow={provider.recommended}>
          Select Agent
          <ChevronRight className="w-4 h-4" />
        </GlowButton>
      </div>
    </GlassCard>
  );
}
