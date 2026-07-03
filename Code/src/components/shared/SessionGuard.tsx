"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export function SessionGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { session, user, restoreSession, loading } = useAuthStore();
  const [checked, setChecked] = useState(false);
  const validatingRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isPublicRoute = 
    pathname === "/" || 
    pathname === "/splash" || 
    pathname?.startsWith("/onboarding") || 
    pathname?.startsWith("/auth");

  useEffect(() => {
    if (isPublicRoute) {
      setChecked(true);
      return;
    }

    // Prevent re-entrant validation (stops the infinite loop)
    if (validatingRef.current) return;

    const validate = async () => {
      validatingRef.current = true;

      // If protected and no session/user in store, redirect immediately
      if (!session || !user) {
        useAuthStore.setState({ session: null, user: null, role: null, loading: false });
        if (typeof window !== 'undefined') localStorage.removeItem('aetherflow-auth');
        router.replace("/auth/login");
        validatingRef.current = false;
        return;
      }

      // Validate session against Supabase with strict 3-second limit
      try {
        await Promise.race([
          restoreSession(),
          new Promise((_, reject) => setTimeout(() => reject(new Error("SESSION_TIMEOUT")), 3000))
        ]);
        const latestState = useAuthStore.getState();
        if (!latestState.session || !latestState.user) {
          router.replace("/auth/login");
        } else {
          console.log("SessionGuard: SESSION_RESTORED");
          setChecked(true);
        }
      } catch (err: any) {
        console.error("SessionGuard validation failed/timeout:", err);
        if (err?.message === "SESSION_TIMEOUT") {
          console.warn("SessionGuard: SESSION_TIMEOUT");
          useAuthStore.setState({ loading: false });
          console.log("SessionGuard: LOADING_RELEASED");
          setChecked(true);
        } else {
          router.replace("/auth/login");
        }
      } finally {
        validatingRef.current = false;
      }
    };

    validate();
  }, [pathname]); // Only re-validate on route change, NOT on session/user state changes

  // 3-second failsafe: if loading gets stuck, force release (TASK 1)
  useEffect(() => {
    if (!checked && !isPublicRoute) {
      timeoutRef.current = setTimeout(() => {
        const state = useAuthStore.getState();
        if (state.loading) {
          console.warn("SessionGuard: SESSION_TIMEOUT, force-releasing loader.");
          useAuthStore.setState({ loading: false });
          console.log("SessionGuard: LOADING_RELEASED");
        }
        setChecked(true);
      }, 3000);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [checked, isPublicRoute]);

  // Bypass validation entirely for public/auth routes to prevent blocking page renders
  if (isPublicRoute) {
    return <>{children}</>;
  }

  if (!checked || loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
