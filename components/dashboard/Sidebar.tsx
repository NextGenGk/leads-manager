// components/dashboard/Sidebar.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Mail, Map, Radio, Settings, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserButton } from "@clerk/nextjs";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads",     label: "Leads",     icon: Users           },
  { href: "/outreach",  label: "Outreach",  icon: Mail            },
  { href: "/map",       label: "Map View",  icon: Map             },
  { href: "/scraper",   label: "Scraper",   icon: Radio           },
  { href: "/settings",  label: "Settings",  icon: Settings        },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-56 shrink-0 bg-stone-900 text-stone-100 flex flex-col h-screen">
      <div className="px-5 py-5 border-b border-stone-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center">
            <TrendingUp size={15} className="text-white" />
          </div>
          <div>
            <div className="text-base font-semibold text-white leading-tight">Lead Manager</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link key={href} href={href}
              className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                active ? "bg-stone-700 text-white font-medium" : "text-stone-400 hover:bg-stone-800 hover:text-stone-100")}>
              <Icon size={15} />{label}
            </Link>
          );
        })}
      </nav>
      <div className="px-4 py-4 border-t border-stone-800">
        <div className="flex items-center gap-3">
          <UserButton afterSignOutUrl="/sign-in" />
          <div className="text-xs text-stone-400">
            <div className="text-stone-200 font-medium">Foxy</div>
            <div>FrequnSync Studio</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
