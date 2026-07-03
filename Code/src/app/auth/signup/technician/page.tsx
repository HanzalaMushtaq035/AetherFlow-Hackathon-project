"use client";

import { motion } from "framer-motion";
import { GlowButton, GlassCard } from "@/components/shared";
import { Mail, Lock, ArrowRight, User, Phone, Wrench, MapPin, Award, CheckCircle, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuthStore } from "@/store/authStore";

const CATEGORIES = ["AC Technician", "Electrician", "Plumber", "Tutor", "Beautician", "Cleaner", "Carpenter", "Painter", "Appliance Repair", "Mechanic"];
const SPECIALIZATIONS: Record<string, string[]> = {
  "AC Technician": ["Inverter AC", "HVAC", "Installation", "Gas Charging"],
  "Electrician": ["Wiring", "Solar", "UPS", "Industrial"],
  "Plumber": ["Pipe Leakage", "Bathroom", "Water Tank", "Kitchen"],
  "Tutor": ["Math", "Physics", "IELTS", "Programming"],
  "Beautician": ["Makeup", "Bridal", "Hair Stylist"],
  "Appliance Repair": ["Washing Machine", "Refrigerator", "Microwave"],
};

export default function TechnicianSignupPage() {
  const router = useRouter();
  
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [category, setCategory] = useState("AC Technician");
  const [specialization, setSpecialization] = useState("");
  const [city, setCity] = useState("");
  const [serviceArea, setServiceArea] = useState("");
  const [workingHoursStart, setWorkingHoursStart] = useState("09:00");
  const [workingHoursEnd, setWorkingHoursEnd] = useState("18:00");
  const [experienceYears, setExperienceYears] = useState("1");
  const [serviceRadiusKm, setServiceRadiusKm] = useState("10");
  
  const [step, setStep] = useState(1);
  const [success, setSuccess] = useState(false);
  
  const { signup, loading, error } = useAuthStore();

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signup({ 
        fullName, 
        email, 
        phone, 
        password, 
        role: "technician",
        category,
        location: city,
        city,
        service_area: serviceArea,
        working_hours_start: workingHoursStart,
        working_hours_end: workingHoursEnd,
        specialization,
        experience_years: parseInt(experienceYears, 10),
        service_radius_km: parseInt(serviceRadiusKm, 10),
      });
      setSuccess(true);
      setTimeout(() => {
        router.push("/technician/home");
      }, 1500);
    } catch (err) {
      console.error("Signup failed:", err);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center p-4 relative pt-10 pb-20">
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-secondary/5 rounded-full blur-[120px] pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md z-10">
        <div className="text-center mb-6">
          <h1 className="font-headline-lg-mobile text-2xl text-white font-bold tracking-widest uppercase">
            Agent <span className="text-primary-fixed-dim">Onboarding</span>
          </h1>
          <p className="text-on-surface-variant text-xs mt-2 font-label-mono uppercase tracking-widest opacity-60">
            Join the AetherFlow Grid
          </p>
        </div>

        <GlassCard className="p-6 border-white/5 bg-[#111]/80 backdrop-blur-xl">
          {error && (
            <div className="mb-4 bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
              <p className="text-red-400 text-xs font-mono text-center">{error}</p>
            </div>
          )}

          {success && (
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mb-6 flex flex-col items-center py-6">
                <CheckCircle className="w-16 h-16 text-primary-fixed-dim mb-4" />
                <h3 className="text-white font-bold text-lg">Agent Verified</h3>
                <p className="text-on-surface-variant text-sm mt-1 text-center">Your neural identity is complete. Redirecting to grid...</p>
             </motion.div>
          )}

          {!success && (
            <form onSubmit={step < 3 ? (e) => { e.preventDefault(); handleNext(); } : handleSignup} className="space-y-4">
              
              {step === 1 && (
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="font-label-mono text-[10px] text-primary-fixed-dim/60 uppercase tracking-widest ml-1">Full Name</label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/40 group-focus-within:text-primary-fixed-dim" />
                      <input required type="text" placeholder="John Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-black/40 border border-outline-variant/30 rounded-xl py-3.5 pl-12 pr-4 text-white text-sm focus:outline-none focus:border-primary-fixed-dim" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-label-mono text-[10px] text-primary-fixed-dim/60 uppercase tracking-widest ml-1">Email</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/40 group-focus-within:text-primary-fixed-dim" />
                      <input required type="email" placeholder="agent@aether.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-black/40 border border-outline-variant/30 rounded-xl py-3.5 pl-12 pr-4 text-white text-sm focus:outline-none focus:border-primary-fixed-dim" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-label-mono text-[10px] text-primary-fixed-dim/60 uppercase tracking-widest ml-1">Phone</label>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/40 group-focus-within:text-primary-fixed-dim" />
                      <input required type="tel" placeholder="+92 300 0000000" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-black/40 border border-outline-variant/30 rounded-xl py-3.5 pl-12 pr-4 text-white text-sm focus:outline-none focus:border-primary-fixed-dim" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-label-mono text-[10px] text-primary-fixed-dim/60 uppercase tracking-widest ml-1">Access Key</label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/40 group-focus-within:text-primary-fixed-dim" />
                      <input required type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-black/40 border border-outline-variant/30 rounded-xl py-3.5 pl-12 pr-12 text-white text-sm focus:outline-none focus:border-primary-fixed-dim" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <GlowButton type="submit" className="w-full py-4 mt-2">Next Step <ArrowRight className="w-4 h-4" /></GlowButton>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="font-label-mono text-[10px] text-primary-fixed-dim/60 uppercase tracking-widest ml-1">City</label>
                    <div className="relative group">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/40 group-focus-within:text-primary-fixed-dim" />
                      <input required type="text" placeholder="Islamabad" value={city} onChange={(e) => setCity(e.target.value)} className="w-full bg-black/40 border border-outline-variant/30 rounded-xl py-3.5 pl-12 pr-4 text-white text-sm focus:outline-none focus:border-primary-fixed-dim" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-label-mono text-[10px] text-primary-fixed-dim/60 uppercase tracking-widest ml-1">Service Category</label>
                    <div className="relative group">
                      <Wrench className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/40 group-focus-within:text-primary-fixed-dim" />
                      <select value={category} onChange={(e) => { setCategory(e.target.value); setSpecialization(""); }} className="w-full bg-black/40 border border-outline-variant/30 rounded-xl py-3.5 pl-12 pr-4 text-white text-sm focus:outline-none focus:border-primary-fixed-dim appearance-none">
                        {CATEGORIES.map(c => <option key={c} value={c} className="bg-[#111]">{c}</option>)}
                      </select>
                    </div>
                  </div>
                  
                  {SPECIALIZATIONS[category] && (
                    <div className="space-y-1.5">
                      <label className="font-label-mono text-[10px] text-primary-fixed-dim/60 uppercase tracking-widest ml-1">Specialization</label>
                      <div className="relative group">
                        <Award className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/40 group-focus-within:text-primary-fixed-dim" />
                        <select required value={specialization} onChange={(e) => setSpecialization(e.target.value)} className="w-full bg-black/40 border border-outline-variant/30 rounded-xl py-3.5 pl-12 pr-4 text-white text-sm focus:outline-none focus:border-primary-fixed-dim appearance-none">
                          <option value="" className="bg-[#111]">Select Specialization</option>
                          {SPECIALIZATIONS[category].map(s => <option key={s} value={s} className="bg-[#111]">{s}</option>)}
                        </select>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="font-label-mono text-[10px] text-primary-fixed-dim/60 uppercase tracking-widest ml-1">Experience (Years)</label>
                    <div className="relative group">
                      <Award className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/40 group-focus-within:text-primary-fixed-dim" />
                      <input required type="number" min="0" placeholder="Years of Experience" value={experienceYears} onChange={(e) => setExperienceYears(e.target.value)} className="w-full bg-black/40 border border-outline-variant/30 rounded-xl py-3.5 pl-12 pr-4 text-white text-sm focus:outline-none focus:border-primary-fixed-dim" />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={handleBack} className="w-1/3 py-4 text-sm font-bold text-white/50 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                      Back
                    </button>
                    <GlowButton type="button" onClick={handleNext} className="w-2/3 py-4 text-sm font-bold flex-1">
                      Next Step <ArrowRight className="w-4 h-4 ml-1 inline-block" />
                    </GlowButton>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="font-label-mono text-[10px] text-primary-fixed-dim/60 uppercase tracking-widest ml-1">Service Area</label>
                    <div className="relative group">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/40 group-focus-within:text-primary-fixed-dim" />
                      <input required type="text" placeholder="e.g. F-8, Blue Area" value={serviceArea} onChange={(e) => setServiceArea(e.target.value)} className="w-full bg-black/40 border border-outline-variant/30 rounded-xl py-3.5 pl-12 pr-4 text-white text-sm focus:outline-none focus:border-primary-fixed-dim" />
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="font-label-mono text-[10px] text-primary-fixed-dim/60 uppercase tracking-widest ml-1">Service Radius (km)</label>
                    <div className="relative group">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/40 group-focus-within:text-primary-fixed-dim" />
                      <input required type="number" min="1" placeholder="10" value={serviceRadiusKm} onChange={(e) => setServiceRadiusKm(e.target.value)} className="w-full bg-black/40 border border-outline-variant/30 rounded-xl py-3.5 pl-12 pr-4 text-white text-sm focus:outline-none focus:border-primary-fixed-dim" />
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="space-y-1.5 flex-1">
                      <label className="font-label-mono text-[10px] text-primary-fixed-dim/60 uppercase tracking-widest ml-1">Start Time</label>
                      <input required type="time" value={workingHoursStart} onChange={(e) => setWorkingHoursStart(e.target.value)} className="w-full bg-black/40 border border-outline-variant/30 rounded-xl py-3.5 px-4 text-white text-sm focus:outline-none focus:border-primary-fixed-dim" />
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <label className="font-label-mono text-[10px] text-primary-fixed-dim/60 uppercase tracking-widest ml-1">End Time</label>
                      <input required type="time" value={workingHoursEnd} onChange={(e) => setWorkingHoursEnd(e.target.value)} className="w-full bg-black/40 border border-outline-variant/30 rounded-xl py-3.5 px-4 text-white text-sm focus:outline-none focus:border-primary-fixed-dim" />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={handleBack} className="w-1/3 py-4 text-sm font-bold text-white/50 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                      Back
                    </button>
                    <GlowButton type="submit" disabled={loading} className="w-2/3 py-4 text-sm font-bold disabled:opacity-50 flex-1">
                      {loading ? "Registering..." : "Complete Setup"}
                    </GlowButton>
                  </div>
                </motion.div>
              )}
            </form>
          )}

          {!success && (
            <div className="mt-6 text-center">
              <p className="text-on-surface-variant/50 text-[10px] uppercase font-mono tracking-widest">
                Existing Agent?{" "}
                <button type="button" onClick={() => router.push("/auth/login/technician")} className="text-primary-fixed-dim font-bold hover:text-primary transition-colors">
                  Login
                </button>
              </p>
            </div>
          )}
        </GlassCard>
      </motion.div>
    </div>
  );
}
