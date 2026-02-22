// /components/Navbar.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Flag, Trophy, Info, LogIn, ChevronDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { User, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";

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
        "whitespace-nowrap shrink-0",
        active
          ? "bg-accent text-accent-foreground border-border shadow-(--p1-glow)"
          : "text-muted-foreground hover:text-foreground hover:bg-card hover:border-border",
      ].join(" ")}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}

function PredictionsDropdown() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);

  const active = useMemo(() => {
    return pathname?.startsWith("/predict") || pathname?.startsWith("/season-prediction");
  }, [pathname]);

  // Track menu position (fixed, relative to viewport)
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);

  function updatePos() {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({
      top: r.bottom + 8,
      left: r.right - 256, // menu width = 256px; right-align to button
      width: 256,
    });
  }

  useEffect(() => {
    if (!open) return;
    updatePos();

    function onScrollOrResize() {
      updatePos();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onMouseDown(e: MouseEvent) {
      const target = e.target as Node;
      const btn = btnRef.current;
      // If click is on the button, let button toggle handle it
      if (btn && btn.contains(target)) return;

      // If click is inside the portal menu, ignore (we close on link click)
      const menu = document.getElementById("predictions-dropdown-menu");
      if (menu && menu.contains(target)) return;

      setOpen(false);
    }

    window.addEventListener("scroll", onScrollOrResize, true); // capture: catch scroll containers too
    window.addEventListener("resize", onScrollOrResize);
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onMouseDown);

    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onMouseDown);
    };
  }, [open]);

  // Close when route changes
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const menu =
    open && pos
      ? createPortal(
          <div
            id="predictions-dropdown-menu"
            role="menu"
            className="fixed z-9999 w-64 overflow-hidden rounded-2xl border border-border bg-background shadow-lg"
            style={{
              top: pos.top,
              left: Math.max(8, pos.left), // keep on-screen
            }}
          >
            <Link
              href="/predict"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block px-4 py-3 text-sm text-foreground hover:bg-accent/40"
            >
              <div className="font-semibold">Race Predictions</div>
              <div className="text-xs text-muted-foreground mt-0.5">Pick for the next race weekend.</div>
            </Link>

            <div className="h-px bg-border" />

            <Link
              href="/season-prediction"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block px-4 py-3 text-sm text-foreground hover:bg-accent/40"
            >
              <div className="font-semibold">Pre-Season Predictions</div>
              <div className="text-xs text-muted-foreground mt-0.5">Lock in season-long picks.</div>
            </Link>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={[
          "inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm transition",
          "border border-transparent",
          "whitespace-nowrap shrink-0",
          active
            ? "bg-accent text-accent-foreground border-border shadow-(--p1-glow)"
            : "text-muted-foreground hover:text-foreground hover:bg-card hover:border-border",
        ].join(" ")}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Flag className="h-4 w-4" />
        <span>Make Predictions</span>
        <ChevronDown className={["h-4 w-4 transition-transform", open ? "rotate-180" : ""].join(" ")} />
      </button>

      {menu}
    </>
  );
}

export function Navbar() {

  const [authed, setAuthed] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data } = await supabase.auth.getUser();
      if (mounted) setAuthed(!!data.user);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(!!session?.user);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function onSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <header data-fixed-header className="fixed top-0 inset-x-0 z-50 border-b border-border bg-background/75 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">

        {/* LOGO */}
        <Link
          href="/"
          className="inline-flex items-center gap-3 font-semibold tracking-tight"
        >
          <div 
            className="relative h-14 w-14"
            style={{ filter: "drop-shadow(0 0 8px hsl(var(--primary) / 0.6))" }}
          >
            <Image
              src="/images/logo/logo.png"
              alt="P1 Predictions Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <span className="text-foreground">P1 Predictions</span>
        </Link>

        {/* DESKTOP NAV */}
        <nav className="hidden md:flex items-center gap-2">
          <NavLink
            href="/how-it-works"
            label="How it works"
            icon={<Info className="h-4 w-4" />}
          />
          
          <PredictionsDropdown />

          <NavLink
            href="/leaderboard"
            label="Leaderboard"
            icon={<Trophy className="h-4 w-4" />}
          />
        </nav>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-2">
          {authed ? <NavLink href="/account" label="Account" icon={<User className="h-4 w-4" />} /> : null}
          
          {authed ? (
            <>
              {/* Mobile: icon-only */}
              <button
                type="button"
                onClick={onSignOut}
                className="inline-flex sm:hidden items-center justify-center h-10 w-10 rounded-full border border-border bg-card text-foreground transition hover:bg-accent hover:shadow-(--p1-glow)"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>

              {/* Desktop: icon + text */}
              <button
                type="button"
                onClick={onSignOut}
                className="hidden sm:inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-sm text-foreground transition hover:bg-accent hover:shadow-(--p1-glow)"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign out</span>
              </button>
            </>
          ) : (
            <>
              {/* Mobile: icon-only */}
              <Link
                href="/login"
                className="inline-flex sm:hidden items-center justify-center h-10 w-10 rounded-full border border-border bg-card text-foreground transition hover:bg-accent hover:shadow-(--p1-glow)"
                aria-label="Login"
                title="Login"
              >
                <LogIn className="h-4 w-4" />
              </Link>

              {/* Desktop: icon + text */}
              <Link
                href="/login"
                className="hidden sm:inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-sm text-foreground transition hover:bg-accent hover:shadow-(--p1-glow)"
              >
                <LogIn className="h-4 w-4" />
                <span>Login</span>
              </Link>
            </>
          )}

          <ThemeToggle />
        </div>
      </div>

      {/* MOBILE NAV */}
      <div className="md:hidden border-t border-border bg-background/75 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-2 flex items-center gap-2 overflow-x-auto">
          <NavLink
            href="/how-it-works"
            label="How it works"
            icon={<Info className="h-4 w-4" />}
          />
          
          <PredictionsDropdown />

          <NavLink
            href="/leaderboard"
            label="Leaderboard"
            icon={<Trophy className="h-4 w-4" />}
          />
        </div>
      </div>
    </header>
  );
}
