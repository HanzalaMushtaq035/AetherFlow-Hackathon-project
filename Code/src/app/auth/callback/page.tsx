"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/authStore";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !mounted) return;

    const handleCallback = async () => {
      const supabase = createClient();
      try {
        // Exchange or retrieve the active session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (!session) {
          // Fallback check
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          if (userError || !user) {
            throw new Error("No active session found during callback.");
          }
        }

        // Retrieve user details
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Could not fetch user details.");

        // Check if profile exists
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        let role = profile?.role;

        if (profileError) {
          console.error("Profile check error:", profileError);
        }

        // If no profile exists, automatically insert a default resident profile
        if (!profile) {
          role = "resident";
          const fullName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Google User";
          const phone = user.phone || "";

          const { error: insertError } = await supabase
            .from("profiles")
            .upsert({
              id: user.id,
              role: "resident",
              full_name: fullName,
              phone,
            });

          if (insertError) {
            console.error("Failed to insert default profile for Google sign-in:", insertError);
          }
        }

        // Sync local Zustand state with session
        await useAuthStore.getState().restoreSession();

        // Safe redirect depending on role
        if (role === "technician") {
          router.replace("/technician/home");
        } else {
          router.replace("/home");
        }
      } catch (err: any) {
        console.error("OAuth callback processing failed:", err);
        setErrorMsg(err.message || "Identity synchronization failed.");
      }
    };

    handleCallback();
  }, [router, mounted]);

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-[#111] border border-red-500/10 p-8 rounded-3xl max-w-sm w-full">
          <p className="text-red-500 text-sm font-mono uppercase tracking-wider mb-6">
            Access Grid Offline
          </p>
          <p className="text-white/60 text-xs mb-8 font-mono">
            {errorMsg}
          </p>
          <button
            onClick={() => router.push("/auth/login")}
            className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold py-3.5 rounded-xl transition-all uppercase tracking-widest text-[9px] font-mono"
          >
            Return to Portal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6">
      <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mb-6" />
      <p className="text-white/60 text-[9px] font-label-mono uppercase tracking-[0.2em] animate-pulse">
        Synchronizing Identity...
      </p>
    </div>
  );
}
