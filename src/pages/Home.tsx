import { Link } from "react-router";
import {
  ArrowRight,
  CreditCard,
  FolderKanban,
  HandCoins,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const highlights = [
  {
    icon: Users,
    title: "Organise members clearly",
    text: "Create a chama, become the admin, and define how members join and contribute.",
  },
  {
    icon: HandCoins,
    title: "Track monthly rules",
    text: "Set contribution amounts like KES 300 per member and keep expectations visible.",
  },
  {
    icon: CreditCard,
    title: "Run the group professionally",
    text: "Use a cleaner dashboard, loans view, settings area, and community cards to guide people.",
  },
];

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen text-foreground">
      <section className="gradient-hero border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-6 md:px-10">
          <header className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-3xl gradient-accent flex items-center justify-center text-white shadow-lg">
                <HandCoins className="w-5 h-5" />
              </div>
              <div>
                <p className="text-lg font-semibold">Khisa's Kitty</p>
                <p className="text-xs text-muted-foreground">
                  Savings groups built with clarity
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Login
              </Link>
              <Link to={isAuthenticated ? "/app/dashboard" : "/login"}>
                <Button className="rounded-full px-5">
                  {isAuthenticated ? "Open app" : "Get started"}
                </Button>
              </Link>
            </div>
          </header>

          <div className="grid gap-12 py-16 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-card/80 px-4 py-2 text-sm text-sky-700 border border-border">
                <ShieldCheck className="w-4 h-4" />
                Designed for chama groups and member trust
              </p>
              <h1 className="mt-6 text-xl md:text-6xl font-semibold leading-tight tracking-tight text-slate-950">
                The first thing visitors see should explain the whole website
                clearly.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
                Khisa's Kitty helps people create or join savings groups, define
                contribution rules, manage members, review loans, and browse the
                wider community through a more professional white-and-blue
                experience.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link to={isAuthenticated ? "/app/dashboard" : "/login"}>
                  <Button size="lg" className="rounded-full px-6 gap-2">
                    Get started
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <a href="#how-it-works">
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-full px-6"
                  >
                    See how it works
                  </Button>
                </a>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -top-10 right-0 h-28 w-28 rounded-full bg-sky-200/50 blur-3xl" />
              <div className="absolute bottom-0 left-0 h-28 w-28 rounded-full bg-blue-200/40 blur-3xl" />
              <div className="relative rounded-[36px] bg-card border border-border p-6 card-shadow-lg">
                <div className="rounded-[28px] bg-slate-950 text-white p-6">
                  <p className="text-sm text-white/60">Sample active group</p>
                  <h2 className="mt-3 text-xl font-semibold">
                    Blue Coast Chama
                  </h2>
                  <div className="mt-6 grid gap-3 text-sm">
                    <div className="flex items-center justify-between rounded-2xl bg-card/8 px-4 py-3">
                      <span>Contribution per member</span>
                      <span>KES 300</span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl bg-card/8 px-4 py-3">
                      <span>Members inside</span>
                      <span>12 / 20</span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl bg-card/8 px-4 py-3">
                      <span>Join code</span>
                      <span>BLUE300</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div className="rounded-[24px] bg-secondary p-5">
                    <p className="text-sm text-sky-700">Create a group</p>
                    <p className="mt-3 text-muted-foreground leading-7">
                      Choose the name, profile image, and exact rules you want
                      members to follow.
                    </p>
                  </div>
                  <div className="rounded-[24px] bg-blue-50 p-5">
                    <p className="text-sm text-blue-700">Join a group</p>
                    <p className="mt-3 text-muted-foreground leading-7">
                      Use a join code or discover groups through the organised
                      community cards.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="max-w-7xl mx-auto px-6 py-16 md:px-10"
      >
        <div className="max-w-2xl">
          <p className="text-sm uppercase tracking-[0.18em] text-sky-600">
            What the website helps you do
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-foreground">
            From first visit to active chama membership
          </h2>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {highlights.map(item => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="rounded-[30px] bg-card border border-border p-7 card-shadow hover-lift"
              >
                <div className="w-12 h-12 rounded-2xl bg-secondary text-sky-700 flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="mt-5 text-2xl font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-3 text-muted-foreground leading-7">{item.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-2 pb-16 md:px-10">
        <div className="rounded-[36px] bg-card border border-border p-8 md:p-10 card-shadow">
          <div className="max-w-3xl">
            <p className="text-sm uppercase tracking-[0.18em] text-sky-600">
              How the journey works
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-foreground">
              A clearer path from website visitor to active chama member
            </h2>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            <div className="rounded-[28px] gradient-accent-soft border border-border p-6">
              <div className="w-12 h-12 rounded-2xl bg-card text-sky-700 flex items-center justify-center shadow-sm">
                <HandCoins className="w-5 h-5" />
              </div>
              <p className="mt-5 text-sm font-semibold text-sky-700">
                1. Understand the website
              </p>
              <p className="mt-3 text-muted-foreground leading-7">
                Visitors land on a page that explains savings groups,
                contribution rules, loans, members, and the value of the
                platform in plain language.
              </p>
            </div>

            <div className="rounded-[28px] bg-slate-950 p-6 text-white">
              <div className="w-12 h-12 rounded-2xl bg-card/10 text-white flex items-center justify-center">
                <FolderKanban className="w-5 h-5" />
              </div>
              <p className="mt-5 text-sm font-semibold text-white/80">
                2. Create account or log in
              </p>
              <p className="mt-3 text-white/70 leading-7">
                Once they are ready, users enter a focused access page and move
                straight into the product flow without confusing technical
                wording.
              </p>
            </div>

            <div className="rounded-[28px] bg-blue-50 p-6 border border-blue-100">
              <div className="w-12 h-12 rounded-2xl bg-card text-blue-700 flex items-center justify-center shadow-sm">
                <Search className="w-5 h-5" />
              </div>
              <p className="mt-5 text-sm font-semibold text-blue-700">
                3. Create or join a group
              </p>
              <p className="mt-3 text-muted-foreground leading-7">
                After login, users choose whether to create a chama as the admin
                or browse organised community cards and invite codes to join
                one.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 pb-20 md:px-10">
        <div className="rounded-[36px] bg-slate-900 text-white p-8 md:p-10">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="max-w-2xl">
              <p className="text-sm uppercase tracking-[0.18em] text-white/60">
                Inside the app
              </p>
              <h2 className="mt-3 text-2xl font-semibold">
                A proper workspace for modern chama groups
              </h2>
              <p className="mt-4 text-white/70 leading-8">
                The app is structured around a professional sidebar with
                dashboard, community, loans, members, and settings so people
                always know where to go next.
              </p>
            </div>
            <Link to={isAuthenticated ? "/app/dashboard" : "/login"}>
              <Button
                size="lg"
                className="rounded-full bg-card text-foreground hover:bg-card/90 px-6"
              >
                Enter the workspace
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
