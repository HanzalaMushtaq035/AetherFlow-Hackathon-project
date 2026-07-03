"use client";

import { motion } from "framer-motion";
import { GlassCard, GlowButton } from "@/components/shared";
import { User, ShieldCheck, MapPin, Wrench, Star, Phone, LogOut, CheckCircle, Activity, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useEffect, useState } from "react";
import { createBrowserClient } from '@supabase/ssr';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function TechnicianProfile() {
  const router = useRouter();
  const { logout, user } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [provider, setProvider] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTechnicianData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        // Fetch profiles
        const { data: profData, error: profErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profErr) throw profErr;
        setProfile(profData);

        // Fetch providers
        const { data: provData, error: provErr } = await supabase
          .from('providers')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (!provErr) {
          setProvider(provData);
        }
      } catch (err) {
        console.error("Failed to load technician profiles:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTechnicianData();
  }, [user]);

  const handleLogout = async () => {
    await logout();
    router.push("/auth/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const fullName = profile?.full_name || "Alpha Agent";
  const category = provider?.category || "Specialist";
  const rating = provider?.rating ? parseFloat(provider.rating).toFixed(1) : "5.0";
  const completedJobs = provider?.completed_jobs ?? 0;
  const expYears = provider?.experience_years ?? 1;
  const area = provider?.service_area || provider?.city || "Islamabad";
  const phone = profile?.phone || "+92 300 0000000";

  return (
    <div className="min-h-screen bg-[#050505] p-4 pb-28 pt-8">
      <div className="flex justify-between items-start mb-8">
        <h1 className="text-2xl font-bold text-white tracking-widest uppercase">Agent <span className="text-primary-fixed-dim">Profile</span></h1>
        <button onClick={handleLogout} className="w-10 h-10 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center hover:bg-red-500/20 transition-colors">
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Main Profile Info */}
      <GlassCard className="p-6 border-white/5 mb-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-20 h-20 rounded-full bg-black border border-primary/30 p-1 shrink-0">
            <div className="w-full h-full rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
              {profile?.avatar ? (
                <img src={profile.avatar} className="w-full h-full object-cover" alt="Profile" />
              ) : (
                <User className="w-8 h-8 text-primary/50" />
              )}
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              {fullName} <ShieldCheck className="w-4 h-4 text-primary" />
            </h2>
            <p className="text-xs text-white/50 font-mono mt-1 mb-2">ID: {user?.id?.substring(0, 8).toUpperCase()}</p>
            <div className="flex items-center gap-1 bg-primary/20 px-2 py-0.5 rounded border border-primary/30 w-max">
              <CheckCircle className="w-3 h-3 text-primary" />
              <span className="text-[9px] text-primary font-bold uppercase tracking-widest">Verified Agent</span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <GlassCard className="p-3 border-white/5 text-center">
          <Star className="w-5 h-5 text-[#FFD700] mx-auto mb-1" />
          <p className="text-xs font-mono text-white/50 mb-1 uppercase">Rating</p>
          <p className="text-lg font-bold text-white">{rating}</p>
        </GlassCard>
        <GlassCard className="p-3 border-white/5 text-center">
          <Wrench className="w-5 h-5 text-tertiary-fixed-dim mx-auto mb-1" />
          <p className="text-xs font-mono text-white/50 mb-1 uppercase">Jobs</p>
          <p className="text-lg font-bold text-white">{completedJobs}</p>
        </GlassCard>
        <GlassCard className="p-3 border-white/5 text-center">
          <Activity className="w-5 h-5 text-primary-fixed-dim mx-auto mb-1" />
          <p className="text-xs font-mono text-white/50 mb-1 uppercase">Exp.</p>
          <p className="text-lg font-bold text-white">{expYears} Yrs</p>
        </GlassCard>
      </div>

      {/* Details */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-2 pl-1">Neural Profile</h3>
        
        <GlassCard className="p-4 border-white/5 flex items-center justify-between hover:bg-white/[0.01] transition-all">
          <div className="flex items-center gap-3">
            <Wrench className="w-4 h-4 text-white/40" />
            <span className="text-sm text-white">Category</span>
          </div>
          <span className="text-sm font-bold text-primary-fixed-dim">{category}</span>
        </GlassCard>

        <GlassCard className="p-4 border-white/5 flex items-center justify-between hover:bg-white/[0.01] transition-all">
          <div className="flex items-center gap-3">
            <MapPin className="w-4 h-4 text-white/40" />
            <span className="text-sm text-white">Operational Sector</span>
          </div>
          <span className="text-sm font-bold text-white">{area}</span>
        </GlassCard>

        <GlassCard className="p-4 border-white/5 flex items-center justify-between hover:bg-white/[0.01] transition-all">
          <div className="flex items-center gap-3">
            <Phone className="w-4 h-4 text-white/40" />
            <span className="text-sm text-white">Contact Interface</span>
          </div>
          <span className="text-sm font-bold text-white font-mono">{phone}</span>
        </GlassCard>
      </div>

      <div className="mt-8">
        <GlowButton variant="outline" onClick={() => router.push('/technician/settings')} className="w-full py-4 text-sm">
          System Preferences
        </GlowButton>
      </div>
    </div>
  );
}
