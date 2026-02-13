// export default function Home() {
//   return (
//     <main className="min-h-screen flex items-center justify-center bg-black text-white">
//       <h1 className="text-4xl font-bold">P1 Predictions</h1>
//     </main>
//   );
// }
// /app/(public)/how-it-works/page.tsx
import Link from "next/link";
import { ArrowRight, Flag, Lock, Trophy, Sparkles, AlertTriangle } from "lucide-react";

function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-6">
      <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-2 text-sm md:text-base text-muted-foreground max-w-2xl">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

function Card({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
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
      <div className="mt-3 text-sm text-muted-foreground leading-relaxed">
        {children}
      </div>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground">
      {children}
    </span>
  );
}

export default function HowItWorksPage() {
  return (
    <main className="relative bg-background text-foreground">
      <section className="mx-auto max-w-6xl px-4 py-10 md:py-14">
        <div className="flex flex-wrap gap-2 mb-6">
          <Pill>
            <Flag className="h-4 w-4 text-primary" />
            Pick before FP1
          </Pill>
          <Pill>
            <Trophy className="h-4 w-4 text-primary" />
            Race + season ranks
          </Pill>
          <Pill>
            <Trophy className="h-4 w-4 text-primary" />
            Pre-Season Predictions Coming Soon
          </Pill>
        </div>

        <SectionTitle
          title="How it works"
          subtitle="Make picks for each race, submit before Practice 1 (FP1), then track your points on the leaderboard."
        />

        <div className="flex flex-wrap items-center gap-3 mb-10">
          <Link
            href="/predict"
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
        </div>

        {/* Core flow */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card icon={<Flag className="h-5 w-5 text-primary" />} title="1) Make your picks">
            Each race has a set of questions (Good Surprise, Big Flop, Pole, Podium, Winner).
            You can change your picks anytime until the submission deadline.
          </Card>

          <Card icon={<Lock className="h-5 w-5 text-primary" />} title="2) Submit before FP1">
            Submissions are open until <strong>Practice 1 (FP1)</strong> starts. Once FP1 begins,
            predictions lock automatically and you can’t change them.
          </Card>

          <Card icon={<Trophy className="h-5 w-5 text-primary" />} title="3) Score + rank">
            After results are entered for a race, your picks earn points and the leaderboard updates.
            Season totals are the default view, with a Race tab for per-race standings.
          </Card>
        </div>

        {/* Submission rules */}
        <div className="mt-10">
          <h2 className="text-2xl font-semibold text-foreground">Submission rules</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-3xl">
            These rules keep the game fair and prevent “last-second” edits after meaningful track action starts.
          </p>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card icon={<Lock className="h-5 w-5 text-primary" />} title="Lock timing (FP1 deadline)">
              Your submission deadline is the moment FP1 begins for the selected race.
              If FP1 has started, the app will block submissions and edits.
            </Card>

            <Card icon={<AlertTriangle className="h-5 w-5 text-primary" />} title="Validation checks">
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Podium must be unique:</strong> Winner (P1), P2, and P3 must all be different drivers.</li>
                <li><strong>Good Surprise ≠ Big Flop:</strong> you can’t pick the same driver/team for both.</li>
                <li><strong>Must be logged in:</strong> only authenticated users can submit.</li>
              </ul>
            </Card>
          </div>

          <div className="mt-4 rounded-2xl border border-border bg-card p-5">
            <div className="flex items-start gap-3">
              <div
                className="h-10 w-10 rounded-xl border border-border bg-accent/40 grid place-items-center shrink-0"
                style={{ boxShadow: "var(--p1-glow)" }}
              >
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="font-semibold text-foreground">Editing submissions</div>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  You can freely change picks before FP1. Re-submitting updates your existing entry for that race
                  (one prediction set per user per race). After FP1 starts, submissions are locked.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Scoring */}
        <div className="mt-10">
          <h2 className="text-2xl font-semibold text-foreground">Scoring</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-3xl leading-relaxed">
            Scoring is intentionally simple right now. Every correct driver pick is worth{" "}
            <strong className="text-foreground font-semibold">1 point</strong>. For the two questions that allow{" "}
            <strong className="text-foreground font-semibold">driver or team</strong> picks (Good Surprise and Big Flop),
            a correct <strong className="text-foreground font-semibold">team</strong> pick is worth{" "}
            <strong className="text-foreground font-semibold">2 points</strong>.
          </p>

          <div className="py-4 pb-0 text-lg font-semibold text-foreground">
              Points breakdown
          </div>
          
          <div className="mt-4 rounded-2xl border border-border bg-card overflow-hidden">
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left text-sm text-foreground">
                <thead className="text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Question</th>
                    <th className="px-4 py-3 w-28 text-right font-semibold">Points</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/60 hover:bg-accent/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium">Race Winner (P1)</div>
                      <div className="text-xs text-muted-foreground">Driver pick</div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold">1</td>
                  </tr>

                  <tr className="border-b border-border/60 hover:bg-accent/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium">P2</div>
                      <div className="text-xs text-muted-foreground">Driver pick</div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold">1</td>
                  </tr>

                  <tr className="border-b border-border/60 hover:bg-accent/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium">P3</div>
                      <div className="text-xs text-muted-foreground">Driver pick</div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold">1</td>
                  </tr>

                  <tr className="border-b border-border/60 hover:bg-accent/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium">Pole Position</div>
                      <div className="text-xs text-muted-foreground">Driver pick</div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold">1</td>
                  </tr>

                  <tr className="border-b border-border/60 hover:bg-accent/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium">Good Surprise</div>
                      <div className="text-xs text-muted-foreground">
                        Driver pick = 1 point • Team pick = 2 points
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold">
                      1–2
                    </td>
                  </tr>

                  <tr className="hover:bg-accent/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium">Big Flop</div>
                      <div className="text-xs text-muted-foreground">
                        Driver pick = 1 point • Team pick = 2 points
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold">
                      1–2
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-border bg-card p-5">
            <div className="font-semibold text-foreground">Race results + explanations</div>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              After each race, we’ll publish the official results used for scoring — including the selected{" "}
              <span className="text-foreground font-semibold">Good Surprise</span> and{" "}
              <span className="text-foreground font-semibold">Big Flop</span> — with a short explanation for each.
              This section will be available under the <span className="text-foreground font-semibold">"Race-Verdict" </span> 
              (under work) section on the navigation bar once it’s released.
            </p>
          </div>
        </div>

        {/* Good Surprise + Big Flop definition */}
        <div className="mt-10">
          <h2 className="text-2xl font-semibold text-foreground">
            How “Good Surprise” and “Big Flop” are decided
          </h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-3xl">
            These are intentionally “judgment calls” and are scored after each race based on performance relative
            to expectation. The goal is to reward bold picks, not just picking the fastest car.
          </p>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card icon={<Sparkles className="h-5 w-5 text-primary" />} title="Good Surprise (driver or team)">
              A <strong>Good Surprise</strong> is the driver or team that clearly outperforms expectations for that weekend.
              Examples: unexpected pace, standout race result, big points haul, strong recovery drive, or “best of the rest.”
              <div className="mt-3">
                <strong>How it’s chosen:</strong> the admin selects the Good Surprise after the race based on the weekend story.
              </div>
            </Card>

            <Card icon={<AlertTriangle className="h-5 w-5 text-primary" />} title="Big Flop (driver or team)">
              A <strong>Big Flop</strong> is the driver or team that clearly underperforms expectations for that weekend.
              Examples: major pace deficit, poor execution, avoidable incidents, strategy disaster, or an unexpected scoreless race.
              <div className="mt-3">
                <strong>How it’s chosen:</strong> the admin selects the Big Flop after the race based on the weekend story.
              </div>
            </Card>
          </div>

          <div className="mt-4 rounded-2xl border border-border bg-card p-5">
            <div className="font-semibold text-foreground">Important notes</div>
            <ul className="mt-2 text-sm text-muted-foreground list-disc pl-5 space-y-2">
              <li>
                These picks are <strong>not</strong> purely determined by final position. Context matters (pace, expectation, incidents, reliability).
              </li>
            </ul>
          </div>
        </div>

      </section>
    </main>
  );
}