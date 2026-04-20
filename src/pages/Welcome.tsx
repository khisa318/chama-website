import { Link, useNavigate } from "react-router";
import { ArrowRight, Search, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChamaState } from "@/hooks/useChamaState";

export default function Welcome() {
  const navigate = useNavigate();
  const { memberGroups, completeOnboarding } = useChamaState();

  if (memberGroups.length > 0) {
    return (
      <div className="max-w-5xl mx-auto space-y-8">
        <section className="rounded-[32px] bg-card p-8 md:p-10 card-shadow border border-border">
          <p className="text-sm uppercase tracking-[0.18em] text-sky-600">
            Welcome back
          </p>
          <h1 className="mt-3 text-2xl font-semibold text-foreground">
            Your chama space is already active.
          </h1>
          <p className="mt-4 max-w-2xl text-muted-foreground leading-8">
            You already belong to at least one group, so you can go straight
            into the app or explore more groups in the community.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Button
              className="rounded-full px-6"
              onClick={() => {
                completeOnboarding();
                navigate("/app/dashboard");
              }}
            >
              Open dashboard
            </Button>
            <Link to="/app/community">
              <Button variant="outline" className="rounded-full px-6">
                Browse community
              </Button>
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <section className="rounded-[36px] bg-card border border-border card-shadow overflow-hidden">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
          <div className="p-8 md:p-12">
            <p className="text-sm uppercase tracking-[0.18em] text-sky-600">
              Step 1 of 1
            </p>
            <h1 className="mt-4 text-2xl md:text-xl font-semibold leading-tight text-foreground">
              Do you want to create a chama group or join one?
            </h1>
            <p className="mt-5 text-lg leading-8 text-muted-foreground max-w-2xl">
              Start your savings circle as the admin, or join an existing one
              using a community listing or a private group code.
            </p>
          </div>
          <div className="gradient-hero p-8 md:p-12 border-t lg:border-t-0 lg:border-l border-border">
            <div className="rounded-[28px] bg-card/80 p-6 border border-border">
              <p className="text-sm font-semibold text-sky-700">
                What happens next
              </p>
              <div className="mt-5 space-y-4 text-sm leading-7 text-muted-foreground">
                <p>1. Choose whether to create or join a chama.</p>
                <p>2. Set your group rules or select a group that fits you.</p>
                <p>
                  3. Move into the app dashboard with members, loans, settings,
                  and community.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Link
          to="/welcome/create"
          className="rounded-[32px] bg-card border border-border p-8 card-shadow hover:shadow-lg transition-all card-enter"
        >
          <div className="w-14 h-14 rounded-3xl gradient-accent flex items-center justify-center text-white">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="mt-6 text-2xl font-semibold text-foreground">
            Create a chama group
          </h2>
          <p className="mt-3 text-muted-foreground leading-7">
            Become the admin, set the group name, define monthly contribution
            rules, upload a profile image if you want, and launch your group
            with a join code.
          </p>
          <div className="mt-8 inline-flex items-center gap-2 text-sky-700 font-medium">
            Start creating
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>

        <Link
          to="/welcome/join"
          className="rounded-[32px] bg-card border border-border p-8 card-shadow hover:shadow-lg transition-all card-enter"
          style={{ animationDelay: "0.08s" }}
        >
          <div className="w-14 h-14 rounded-3xl bg-secondary text-sky-700 flex items-center justify-center">
            <Search className="w-6 h-6" />
          </div>
          <h2 className="mt-6 text-2xl font-semibold text-foreground">
            Join an existing group
          </h2>
          <p className="mt-3 text-muted-foreground leading-7">
            Browse community chama cards or use a specific invite code from a
            group you already know. Join quickly and start contributing.
          </p>
          <div className="mt-8 inline-flex items-center gap-2 text-sky-700 font-medium">
            Find a group
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>
      </section>

      <section className="rounded-[32px] bg-slate-900 text-white p-8 md:p-10">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-card/10 px-4 py-2 text-sm text-white/80">
            <Users className="w-4 h-4" />
            Chama-ready flow
          </div>
          <p className="mt-5 text-2xl font-semibold">
            This onboarding is designed around how real savings groups work.
          </p>
          <p className="mt-4 text-white/70 leading-8">
            Create your own structure if you are starting from scratch, or join
            a living group if the community already exists. Either way, the app
            takes you into a more polished member workspace after this step.
          </p>
        </div>
      </section>
    </div>
  );
}
