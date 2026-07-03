"use client";

import { Home, MessageCircle, LayoutGrid, Activity, User, Briefcase, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

const residentNavItems = [
  { icon: Home, label: "Home", href: "/home" },
  { icon: MessageCircle, label: "Requests", href: "/request" },
  { icon: LayoutGrid, label: "AI Flow", href: "/orchestration" },
  { icon: Activity, label: "Activity", href: "/activity" },
  { icon: User, label: "Profile", href: "/profile" },
];

const techNavItems = [
  { icon: Home, label: "Home", href: "/technician/home" },
  { icon: Briefcase, label: "Jobs", href: "/technician/jobs" },
  { icon: Activity, label: "Activity", href: "/technician/activity" },
  { icon: Wallet, label: "Earnings", href: "/technician/earnings" },
  { icon: User, label: "Profile", href: "/technician/profile" },
];

export function BottomNav() {
  const pathname = usePathname();

  // Hide nav on splash, onboarding, and auth
  if (
    pathname === "/" || 
    pathname === "/splash" || 
    pathname.startsWith("/onboarding") || 
    pathname.startsWith("/auth")
  ) {
    return null;
  }

  const navItems = pathname.startsWith("/technician") ? techNavItems : residentNavItems;

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-[400px] z-50">
      <div className="bg-[#111]/90 backdrop-blur-2xl rounded-3xl h-16 flex justify-around items-center px-4 border border-white/5 shadow-2xl shadow-black/50">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link key={item.href} href={item.href} className="relative flex flex-col items-center justify-center flex-1 active:scale-90 transition-transform">
              <motion.div
                className={cn(
                  "p-2 rounded-2xl transition-all duration-300",
                  isActive ? "text-primary bg-primary/10" : "text-white/20"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive && "glow-primary")} />
              </motion.div>
              <span className={cn(
                "font-label-mono text-[7px] mt-1 uppercase tracking-[0.2em] transition-colors duration-300",
                isActive ? "text-primary" : "text-white/10"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
