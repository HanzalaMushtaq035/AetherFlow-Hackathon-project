"use client";

import { motion, AnimatePresence } from "framer-motion";
import { User, Settings, Shield, Bell, Languages, LogOut, ChevronRight, Cpu, Loader2, Save, X } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createBrowserClient } from '@supabase/ssr';
import { GlassCard, GlowButton } from "@/components/shared";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ProfilePage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [avatar, setAvatar] = useState("");
  const [password, setPassword] = useState("");
  
  const [biometricsEnabled, setBiometricsEnabled] = useState(true);
  const [aiLanguage, setAiLanguage] = useState("English");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [agentPreferences, setAgentPreferences] = useState("speed");
  const [encryptionEnabled, setEncryptionEnabled] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        setProfile(data);
        setFullName(data.full_name || "");
        setPhone(data.phone || "");
        setCity(data.city || "Islamabad");
        setAvatar(data.avatar || "");
        
        // Load local storage preferences safely
        if (typeof window !== "undefined") {
          const savedLang = localStorage.getItem(`pref_lang_${user.id}`);
          if (savedLang) setAiLanguage(savedLang);
          
          const savedBiometrics = localStorage.getItem(`pref_bio_${user.id}`);
          if (savedBiometrics) setBiometricsEnabled(savedBiometrics === "true");
          
          const savedNotif = localStorage.getItem(`pref_notif_${user.id}`);
          if (savedNotif) setNotificationsEnabled(savedNotif === "true");
          
          const savedAgent = localStorage.getItem(`pref_agent_${user.id}`);
          if (savedAgent) setAgentPreferences(savedAgent);
          
          const savedEnc = localStorage.getItem(`pref_enc_${user.id}`);
          if (savedEnc) setEncryptionEnabled(savedEnc === "true");
        }
      } catch (err) {
        console.error("Failed to load profile from table:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleSavePreferences = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // 1. Update database profiles table
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

      // 2. Update local state
      setProfile((prev: any) => ({
        ...prev,
        full_name: fullName,
        phone: phone,
        city: city,
        avatar: avatar
      }));

      // 3. Persist advanced preferences in localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem(`pref_lang_${user.id}`, aiLanguage);
        localStorage.setItem(`pref_bio_${user.id}`, String(biometricsEnabled));
        localStorage.setItem(`pref_notif_${user.id}`, String(notificationsEnabled));
        localStorage.setItem(`pref_agent_${user.id}`, agentPreferences);
        localStorage.setItem(`pref_enc_${user.id}`, String(encryptionEnabled));
        if (password) {
          localStorage.setItem(`pref_pass_${user.id}`, password);
        }
      }

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setIsEditing(null);
      }, 1000);
    } catch (err) {
      console.error("Failed to save profile details:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/auth/login");
  };

  const displayName = profile?.full_name || user?.user_metadata?.full_name || "Alpha User";
  const displayRole = profile?.role || "Resident";

  const menuItems = [
    { key: "Identity", icon: User, label: "Identity & Security", sub: `${phone || "Biometrics, Password"}` },
    { key: "Language", icon: Languages, label: "AI Language", sub: `Language: ${aiLanguage}` },
    { key: "Notifications", icon: Bell, label: "Neural Notifications", sub: `AI Broadcasts: ${notificationsEnabled ? "ON" : "OFF"}` },
    { key: "Preferences", icon: Cpu, label: "Agent Preferences", sub: `Optimized for ${agentPreferences}` },
    { key: "Privacy", icon: Shield, label: "Privacy Core", sub: `Mode: ${encryptionEnabled ? "Quantum Encrypted" : "Standard"}` },
  ];

  return (
    <div className="pt-16 pb-28 px-4 min-h-screen bg-[#050505] text-white">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-bold tracking-tight">Identity Workspace</h1>
        <Settings className="w-4 h-4 text-on-surface-variant/20 animate-spin-slow" />
      </div>

      {/* Profile Header */}
      <section className="flex flex-col items-center mb-8">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-primary/5 border border-primary/20 flex items-center justify-center overflow-hidden">
            {avatar ? (
              <img src={avatar} className="w-full h-full object-cover" alt="Profile" />
            ) : (
              <User className="w-10 h-10 text-primary-fixed-dim" />
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 bg-primary text-black rounded-lg p-1 border-2 border-[#050505]">
            <Cpu className="w-2.5 h-2.5" />
          </div>
        </div>
        
        {loading ? (
          <div className="mt-4 flex justify-center">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
          </div>
        ) : (
          <div className="mt-4 text-center">
            <h2 className="text-lg font-bold tracking-tight">{displayName}</h2>
            <div className="flex flex-col items-center gap-1 mt-1">
              <span className="text-[9px] font-label-mono text-primary-fixed-dim uppercase tracking-[0.2em] opacity-60">
                Node: {user?.id?.substring(0, 8).toUpperCase() || "AF-2901-X"}
              </span>
              <span className="text-[8px] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-white/50 uppercase tracking-widest font-mono">
                Role: {displayRole}
              </span>
            </div>
          </div>
        )}
      </section>

      {/* Menu List */}
      <section className="space-y-3 relative">
        {menuItems.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => setIsEditing(item.key)}
            className="cursor-pointer"
          >
            <div className="p-3.5 flex items-center justify-between rounded-2xl bg-[#111] border border-white/5 hover:border-primary/20 active:scale-[0.98] transition-all">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-xl bg-white/5 text-primary-fixed-dim">
                  <item.icon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[13px] font-bold tracking-tight">{item.label}</h3>
                  <p className="text-[9px] text-on-surface-variant/40">{item.sub}</p>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-on-surface-variant/20" />
            </div>
          </motion.div>
        ))}

        <motion.button
          onClick={handleLogout}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="w-full p-4 flex items-center justify-center gap-2 text-red-500/60 mt-4 active:scale-95 transition-transform"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-widest">Terminate Session</span>
        </motion.button>
      </section>

      {/* Interactive Settings Modals */}
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
                  Adjust Preferences: {isEditing}
                </h3>
                <button 
                  onClick={() => setIsEditing(null)} 
                  className="p-1.5 rounded-full bg-white/5 text-white/60 hover:bg-white/10"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Identity & Security Form */}
              {isEditing === "Identity" && (
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
                    <label className="text-[10px] uppercase font-mono tracking-wider opacity-60">Node City</label>
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
                  <div>
                    <label className="text-[10px] uppercase font-mono tracking-wider opacity-60">Node Password</label>
                    <input 
                      type="password" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full mt-1 bg-[#1a1a1a] border border-white/5 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-primary/20"
                    />
                  </div>
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-xs font-bold text-white">Biometric Login Trigger</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={biometricsEnabled} onChange={() => setBiometricsEnabled(!biometricsEnabled)} />
                      <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>
              )}

              {/* Language Form */}
              {isEditing === "Language" && (
                <div className="space-y-4">
                  <p className="text-xs text-white/60">Choose your conversational agentic interface language:</p>
                  <div className="grid grid-cols-3 gap-2">
                    {["English", "Urdu", "Roman Urdu"].map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setAiLanguage(lang)}
                        className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                          aiLanguage === lang ? "bg-primary text-black border-primary" : "bg-[#1a1a1a] border-white/5 text-white"
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Notifications Form */}
              {isEditing === "Notifications" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                    <div>
                      <h4 className="text-xs font-bold text-white">AI Broadcast Tunnels</h4>
                      <p className="text-[9px] text-white/50 mt-0.5">Toggle push broadcasts from AI Orchestration center.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={notificationsEnabled} onChange={() => setNotificationsEnabled(!notificationsEnabled)} />
                      <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>
              )}

              {/* Preferences Form */}
              {isEditing === "Preferences" && (
                <div className="space-y-4">
                  <p className="text-xs text-white/60">Select computational priority profile for discovery loops:</p>
                  <div className="grid grid-cols-3 gap-2">
                    {["speed", "balanced", "quality"].map((pref) => (
                      <button
                        key={pref}
                        onClick={() => setAgentPreferences(pref)}
                        className={`p-3 rounded-xl border text-xs font-bold uppercase transition-all ${
                          agentPreferences === pref ? "bg-primary text-black border-primary" : "bg-[#1a1a1a] border-white/5 text-white"
                        }`}
                      >
                        {pref}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Privacy Form */}
              {isEditing === "Privacy" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                    <div>
                      <h4 className="text-xs font-bold text-white">Quantum Encryption Tunnel</h4>
                      <p className="text-[9px] text-white/50 mt-0.5">End-to-end data encryption across agent nodes.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={encryptionEnabled} onChange={() => setEncryptionEnabled(!encryptionEnabled)} />
                      <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>
              )}

              {/* Save / Cancel buttons */}
              <div className="flex gap-3 pt-4">
                <GlowButton 
                  onClick={() => setIsEditing(null)} 
                  variant="outline" 
                  className="flex-1 py-3 text-xs"
                >
                  Cancel
                </GlowButton>
                <GlowButton 
                  onClick={handleSavePreferences} 
                  disabled={saving}
                  className="flex-1 py-3 text-xs bg-primary text-black flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : saveSuccess ? (
                    "Saved successfully!"
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Save Preferences
                    </>
                  )}
                </GlowButton>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* App Version */}
      <div className="text-center mt-10 opacity-20">
        <p className="text-[7px] text-on-surface-variant font-label-mono uppercase tracking-[0.3em]">
          Core v2.4.0 // Build 992
        </p>
      </div>
    </div>
  );
}
