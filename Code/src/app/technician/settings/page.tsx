"use client";

import { motion, AnimatePresence } from "framer-motion";
import { GlassCard, GlowButton } from "@/components/shared";
import { User, ShieldCheck, MapPin, Wrench, Star, Phone, LogOut, CheckCircle, Bell, Clock, SunMoon, Lock, ChevronRight, Activity, ChevronLeft, Save, X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useState, useEffect } from "react";
import { createBrowserClient } from '@supabase/ssr';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function TechnicianSettings() {
  const router = useRouter();
  const { logout, user } = useAuthStore();
  
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  
  // Toggles
  const [notifications, setNotifications] = useState(true);
  const [locationSharing, setLocationSharing] = useState(true);
  const [isAvailable, setIsAvailable] = useState(true);

  // Form states
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [avatar, setAvatar] = useState("");
  const [password, setPassword] = useState("");
  const [biometricsEnabled, setBiometricsEnabled] = useState(true);
  
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        // Fetch profiles
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!error && data) {
          setProfile(data);
          setFullName(data.full_name || "");
          setPhone(data.phone || "");
          setCity(data.city || "Islamabad");
          setAvatar(data.avatar || "");
        }

        // Fetch local settings state
        if (typeof window !== "undefined") {
          const savedAvail = localStorage.getItem(`tech_avail_${user.id}`);
          if (savedAvail) setIsAvailable(savedAvail === "true");

          const savedNotif = localStorage.getItem(`tech_notif_${user.id}`);
          if (savedNotif) setNotifications(savedNotif === "true");

          const savedLoc = localStorage.getItem(`tech_loc_${user.id}`);
          if (savedLoc) setLocationSharing(savedLoc === "true");

          const savedBio = localStorage.getItem(`tech_bio_${user.id}`);
          if (savedBio) setBiometricsEnabled(savedBio === "true");
        }
      } catch (err) {
        console.error("Failed to load technician configurations:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [user]);

  // Handle immediate toggle changes
  const handleToggleChange = async (type: string, val: boolean) => {
    if (!user) return;
    if (type === "availability") {
      setIsAvailable(val);
      localStorage.setItem(`tech_avail_${user.id}`, String(val));
    } else if (type === "notifications") {
      setNotifications(val);
      localStorage.setItem(`tech_notif_${user.id}`, String(val));
    } else if (type === "location") {
      setLocationSharing(val);
      localStorage.setItem(`tech_loc_${user.id}`, String(val));
    }
  };

  const handleSaveProfileData = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // 1. Save to Supabase profiles
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone: phone,
          city: city,
          avatar: avatar
        })
        .eq('id', user.id);

      if (error) throw error;

      // 2. Persist configurations locally
      if (typeof window !== "undefined") {
        localStorage.setItem(`tech_bio_${user.id}`, String(biometricsEnabled));
        if (password) {
          localStorage.setItem(`tech_pass_${user.id}`, password);
        }
      }

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setIsEditing(null);
      }, 1000);
    } catch (err) {
      console.error("Failed to save technician configurations:", err);
    } finally {
      setSaving(false);
    }
  };

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

  return (
    <div className="min-h-screen bg-[#050505] p-4 pb-28 pt-8 text-white">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 relative z-10">
        <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold tracking-widest uppercase">
          Agent <span className="text-primary-fixed-dim">Preferences</span>
        </h1>
        <div className="w-10 h-10" />
      </div>

      <div className="space-y-6 relative z-10">
        
        {/* Verification Status */}
        <GlassCard className="p-4 border-primary/20 bg-primary/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-primary glow-text" />
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest">Neural Identity</h3>
              <p className="text-[10px] text-white/50 font-mono mt-0.5">Verified & Active</p>
            </div>
          </div>
          <CheckCircle className="w-5 h-5 text-primary" />
        </GlassCard>

        {/* Quick Toggles */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold text-white/50 uppercase tracking-widest pl-2 mb-2">Operations</h2>
          
          <GlassCard className="p-4 border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="w-4 h-4 text-primary-fixed-dim" />
              <span className="text-sm font-bold">Availability Status</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={isAvailable} onChange={(e) => handleToggleChange("availability", e.target.checked)} />
              <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </GlassCard>

          <GlassCard className="p-4 border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-4 h-4 text-primary-fixed-dim" />
              <span className="text-sm font-bold">AI Broadcasts</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={notifications} onChange={(e) => handleToggleChange("notifications", e.target.checked)} />
              <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </GlassCard>

          <GlassCard className="p-4 border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-primary-fixed-dim" />
              <span className="text-sm font-bold">Location Telemetry</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={locationSharing} onChange={(e) => handleToggleChange("location", e.target.checked)} />
              <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </GlassCard>
        </div>

        {/* Profile Details */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold text-white/50 uppercase tracking-widest pl-2 mb-2">Agent Details</h2>
          
          <GlassCard onClick={() => setIsEditing("ProfileData")} className="p-4 border-white/5 flex items-center justify-between active:scale-95 transition-transform cursor-pointer hover:border-primary/20">
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-white/60" />
              <div>
                <p className="text-sm font-bold">Profile Data</p>
                <p className="text-[10px] text-white/40 font-mono mt-0.5">{fullName || "Alpha Agent"} • {phone || "No phone"}</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-white/30" />
          </GlassCard>

          <GlassCard className="p-4 border-white/5 flex items-center justify-between opacity-50">
            <div className="flex items-center gap-3">
              <Wrench className="w-4 h-4 text-white/60" />
              <div>
                <p className="text-sm font-bold">Service Protocol</p>
                <p className="text-[10px] text-white/40 font-mono mt-0.5">Category & Specialization</p>
              </div>
            </div>
            <Lock className="w-4 h-4 text-white/30" />
          </GlassCard>

          <GlassCard className="p-4 border-white/5 flex items-center justify-between opacity-50">
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-white/60" />
              <div>
                <p className="text-sm font-bold">Working Hours</p>
                <p className="text-[10px] text-white/40 font-mono mt-0.5">09:00 AM - 06:00 PM</p>
              </div>
            </div>
            <Lock className="w-4 h-4 text-white/30" />
          </GlassCard>
        </div>

        {/* System & Security */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold text-white/50 uppercase tracking-widest pl-2 mb-2">System</h2>

          <GlassCard onClick={() => setIsEditing("Security")} className="p-4 border-white/5 flex items-center justify-between active:scale-95 transition-transform cursor-pointer hover:border-primary/20">
            <div className="flex items-center gap-3">
              <Lock className="w-4 h-4 text-white/60" />
              <span className="text-sm font-bold">Security & Passkeys</span>
            </div>
            <ChevronRight className="w-4 h-4 text-white/30" />
          </GlassCard>
        </div>

        {/* Logout */}
        <div className="pt-4">
          <GlassCard 
            onClick={handleLogout}
            className="p-4 border-red-500/20 bg-red-500/5 flex items-center justify-center gap-2 cursor-pointer hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4 text-red-400" />
            <span className="text-sm font-bold text-red-400 uppercase tracking-widest">Terminate Session</span>
          </GlassCard>
        </div>
        
      </div>

      {/* Edit Overlay drawer */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-end justify-center z-50 p-4">
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="w-full max-w-md bg-[#111] border border-white/10 rounded-t-3xl p-6 space-y-6 pb-12 shadow-2xl"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-primary-fixed-dim">
                  Update Agent: {isEditing === "ProfileData" ? "Profile Data" : "Security & Passkeys"}
                </h3>
                <button 
                  onClick={() => setIsEditing(null)} 
                  className="p-1.5 rounded-full bg-white/5 text-white/60 hover:bg-white/10"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {isEditing === "ProfileData" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] uppercase font-mono tracking-wider opacity-60">Full Name</label>
                    <input 
                      type="text" 
                      value={fullName} 
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full mt-1 bg-[#1a1a1a] border border-white/5 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-primary/20"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-mono tracking-wider opacity-60">Contact Phone</label>
                    <input 
                      type="text" 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full mt-1 bg-[#1a1a1a] border border-white/5 rounded-xl p-3 text-sm text-white font-mono focus:outline-none focus:border-primary/20"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-mono tracking-wider opacity-60">Node Sector City</label>
                    <input 
                      type="text" 
                      value={city} 
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full mt-1 bg-[#1a1a1a] border border-white/5 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-primary/20"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-mono tracking-wider opacity-60">Avatar URL</label>
                    <input 
                      type="text" 
                      value={avatar} 
                      onChange={(e) => setAvatar(e.target.value)}
                      className="w-full mt-1 bg-[#1a1a1a] border border-white/5 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-primary/20"
                    />
                  </div>
                </div>
              )}

              {isEditing === "Security" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] uppercase font-mono tracking-wider opacity-60">Passkey / Password</label>
                    <input 
                      type="password" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full mt-1 bg-[#1a1a1a] border border-white/5 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-primary/20"
                    />
                  </div>
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-xs font-bold text-white">Biometric Credentials Login</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={biometricsEnabled} onChange={() => setBiometricsEnabled(!biometricsEnabled)} />
                      <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <GlowButton 
                  onClick={() => setIsEditing(null)} 
                  variant="outline" 
                  className="flex-1 py-3 text-xs"
                >
                  Cancel
                </GlowButton>
                <GlowButton 
                  onClick={handleSaveProfileData} 
                  disabled={saving}
                  className="flex-1 py-3 text-xs bg-primary text-black flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : saveSuccess ? (
                    "Saved successfully!"
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Save
                    </>
                  )}
                </GlowButton>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
