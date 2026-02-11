// /components/Navbar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Flag, Trophy, Info, LogIn } from "lucide-react";

function NavLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon?: React.ReactNode;
}) {
  const pathname = usePathname();
  const active =
    pathname === href || (href !== "/" && pathname?.startsWith(href));

  return (
    <Link
      href={href}
      className={[
        "inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm transition",
        "border border-transparent",
        active
          ? "bg-accent text-accent-foreground border-border shadow-[var(--p1-glow)]"
          : "text-muted-foreground hover:text-foreground hover:bg-card hover:border-border",
      ].join(" ")}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}

export function Navbar() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b border-border bg-background/75 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-semibold tracking-tight"
        >
          <span
            className="h-8 w-8 rounded-xl"
            style={{ background: "var(--p1-gradient)", boxShadow: "var(--p1-glow)" }}
            aria-hidden="true"
          />
          <span>P1 Predictions</span>
        </Link>

        <nav className="hidden md:flex items-center gap-2">
          <NavLink href="/how-it-works" label="How it works" icon={<Info className="h-4 w-4" />} />
          <NavLink href="/predict" label="Predict" icon={<Flag className="h-4 w-4" />} />
          <NavLink href="/leaderboard" label="Leaderboard" icon={<Trophy className="h-4 w-4" />} />
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden sm:inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-sm text-foreground transition hover:bg-accent hover:shadow-[var(--p1-glow)]"
          >
            <LogIn className="h-4 w-4" />
            <span>Login</span>
          </Link>
          <ThemeToggle />
        </div>
      </div>

      {/* simple mobile nav */}
      <div className="md:hidden border-t border-border bg-background/75 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-2 flex items-center gap-2 overflow-x-auto">
          <NavLink href="/how-it-works" label="How it works" icon={<Info className="h-4 w-4" />} />
          <NavLink href="/predict" label="Predict" icon={<Flag className="h-4 w-4" />} />
          <NavLink href="/leaderboard" label="Leaderboard" icon={<Trophy className="h-4 w-4" />} />
        </div>
      </div>
    </header>
  );
}
