// import { redirect } from "next/dist/client/components/navigation";

// export default function Home() {
//   return (
//     <main className="min-h-screen flex items-center justify-center bg-black text-white">
//       <h1 className="text-4xl font-bold">P1 Predictions</h1>
//     </main>
//   );
//   // redirect("/login");
// }

// /app/page.tsx
import Link from "next/link";
import { ArrowRight, Sparkles, Trophy, ShieldCheck, Youtube, Instagram, Twitter, Twitch } from "lucide-react";
import CopyEmailButton from "@/components/CopyEmailButton";

const P1_LINKS = {
  youtube: "https://www.youtube.com/@mattp1tommy",
  instagram: "https://www.instagram.com/mattp1tommy/",
  twitter: "https://x.com/MattP1Tommy",
  twitch: "https://www.twitch.tv/mattp1tommy",
};

const CREATOR_CONTACT = {
  name: "Abdul Kalam Syed",
  email: "syedzain10united@email.com",
  website: "https://abdulkalamsyed.com",
};

function GlowBackdrop() {
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-60"
      aria-hidden="true"
    >
      <div
        className="absolute -top-24 left-1/2 h-105 w-105 -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: "var(--p1-gradient)", opacity: 0.18 }}
      />
      <div
        className="absolute top-48 -right-30 h-90 w-90 rounded-full blur-3xl"
        style={{ background: "var(--p1-gradient)", opacity: 0.12 }}
      />
      <div
        className="absolute -bottom-40 -left-40 h-105 w-105 rounded-full blur-3xl"
        style={{ background: "var(--p1-gradient)", opacity: 0.10 }}
      />
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
      {children}
    </span>
  );
}

function Card({
  title,
  desc,
  icon,
}: {
  title: string;
  desc: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div
          className="h-10 w-10 rounded-xl border border-border bg-accent/40 grid place-items-center"
          style={{ boxShadow: "var(--p1-glow)" }}
        >
          {icon}
        </div>
        <div className="font-semibold text-foreground">{title}</div>
      </div>
      <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}

export default function Home() {

  return (
    <main className="relative overflow-hidden bg-background text-foreground">
      <GlowBackdrop />

      {/* HERO */}
      <section className="relative mx-auto max-w-6xl px-4 pt-10 md:pt-16 pb-10">
        <div className="flex flex-col gap-8 md:gap-10">
          <div className="flex flex-wrap items-center gap-2">
            <Pill>
              <Sparkles className="h-4 w-4 text-primary" />
              Fan Built
            </Pill>
            <Pill>
              <Trophy className="h-4 w-4 text-primary" />
              Season + race leaderboards
            </Pill>
            <Pill>
              <ShieldCheck className="h-4 w-4 text-primary" />
              Locks at FP1
            </Pill>
            <Pill>
              <Trophy className="h-4 w-4 text-primary" />
              Season Predictions
            </Pill>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-7">
              <h1 className="text-4xl md:text-5xl font-semibold tracking-tight leading-[1.05]">
                Make your F1 predictions.
                <span className="block text-primary" style={{ textShadow: "var(--p1-glow)" }}>
                  Compete with friends.
                </span>
              </h1>

              <p className="mt-4 text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl">
                A play-along predictions game for the P1 with Matt & Tommy community.
                Lock in picks before FP1, earn points after each race, and climb the leaderboard.
                <span className="block mt-3 text-primary font-semibold">
                  Submit your full 2026 Season Predictions before the season starts.
                </span>
                <span className="block mt-2 text-xs">
                  Play for fun, no money involved, just bragging rights and a chance to show off your F1 knowledge!
                </span>
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  href="/season-prediction"
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-95"
                  style={{ boxShadow: "var(--p1-glow)" }}
                >
                  Start predicting
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  href="/leaderboard"
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-accent/40"
                >
                  View leaderboard
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  href="/how-it-works"
                  className="text-sm font-semibold text-primary hover:opacity-90"
                >
                  How it works →
                </Link>
              </div>

              {/* P1 attribution + socials */}
              <div className="mt-7 rounded-2xl border border-border bg-card/70 p-4">
                <div className="text-sm font-semibold">P1 with Matt &amp; Tommy</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  This fan project is built for the P1 with Matt & Tommy community. Follow the official P1 channels here:
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href={P1_LINKS.youtube}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm hover:bg-accent/40"
                  >
                    <Youtube className="h-4 w-4 text-primary" />
                    YouTube
                  </a>
                  <a
                    href={P1_LINKS.instagram}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm hover:bg-accent/40"
                  >
                    <Instagram className="h-4 w-4 text-primary" />
                    Instagram
                  </a>
                  <a
                    href={P1_LINKS.twitter}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm hover:bg-accent/40"
                  >
                    <Twitter className="h-4 w-4 text-primary" />
                    X / Twitter
                  </a>
                  <a
                    href={P1_LINKS.twitch}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm hover:bg-accent/40"
                  >
                    <Twitch className="h-4 w-4 text-primary" />
                    Twitch
                  </a>
                </div>

                <p className="mt-3 text-xs text-muted-foreground">
                  Not affiliated with Formula 1, F1 teams, or P1 creators. Community-built fan experience.
                </p>
              </div>
            </div>

            {/* Right side “preview” panel */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="text-sm font-semibold">What you can do</div>
                <div className="mt-4 grid gap-3">
                  <div className="rounded-xl border border-border bg-background p-4">
                    <div className="text-sm font-semibold">Pick your calls</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Good surprise, big flop, pole, podium, and winner.
                    </div>
                  </div>
                  <div className="rounded-xl border border-border bg-background p-4">
                    <div className="text-sm font-semibold">Submit before FP1</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Locking rules keep it fair and competitive.
                    </div>
                  </div>
                  <div className="rounded-xl border border-border bg-background p-4">
                    <div className="text-sm font-semibold">Track your rank</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Season standings + race results leaderboard.
                    </div>
                  </div>
                </div>

                <div className="mt-5">
                  <Link
                    href="/signup"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-primary px-4 py-3 text-sm font-semibold text-accent-foreground hover:opacity-95"
                    style={{ boxShadow: "var(--p1-glow)" }}
                  >
                    Create an account
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <div className="mt-2 text-xs text-muted-foreground text-center">
                    Already have an account? <Link className="text-primary" href="/login">Log in</Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="relative mx-auto max-w-6xl px-4 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card
            title="Simple, fast picks"
            desc="Make predictions in a clean flow with quick validation (no duplicate podium picks)."
            icon={<Sparkles className="h-5 w-5 text-primary" />}
          />
          <Card
            title="Race + season scoring"
            desc="See how you stack up after each race and across the season."
            icon={<Trophy className="h-5 w-5 text-primary" />}
          />
          <Card
            title="Fair lock rule"
            desc="Predictions lock at FP1 start time to keep it competitive."
            icon={<ShieldCheck className="h-5 w-5 text-primary" />}
          />
        </div>
      </section>

      {/* FOOTER / CREATOR CTA */}
      <footer className="relative border-t border-border bg-card/40">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-7">
              <div className="text-lg font-semibold">Built by {CREATOR_CONTACT.name}</div>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Want a website like this for your community, content, or audience?
                I build modern, theme-driven web apps with clean UX and accessibility-first defaults.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <CopyEmailButton
                  email={CREATOR_CONTACT.email}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-95"
                  style={{ boxShadow: "var(--p1-glow)" }}
                  label="Contact me"
                />

                <a
                  href={CREATOR_CONTACT.website}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold hover:bg-accent/40"
                >
                  Portfolio
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>

              <p className="mt-4 text-xs text-muted-foreground">
                © {new Date().getFullYear()} {CREATOR_CONTACT.name}. All rights reserved.
              </p>
            </div>

            <div className="md:col-span-5">
              <div className="rounded-2xl border border-border bg-background p-5">
                <div className="text-sm font-semibold">Notes</div>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <li>• Fan-made project for the P1 community.</li>
                  <li>• Not affiliated with Formula 1 or F1 teams.</li>
                  <li>• Suggestions or feature requests: email me.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}