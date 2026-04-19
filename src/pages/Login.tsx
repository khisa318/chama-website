import { useState } from "react";
import { Link } from "react-router";
import { getSupabaseClient, syncStoredSupabaseAccessToken } from "@/lib/supabase";
import { getChamaState } from "@/lib/chama";
import {
  HandCoins,
  Mail,
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  Shield,
  TrendingUp,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

export default function Login() {
  const [authTab, setAuthTab] = useState("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regDisplayName, setRegDisplayName] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nextRoute = () => {
    const state = getChamaState();
    return state.onboardingComplete ? "/#/app/dashboard" : "/#/welcome";
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) return;

    setIsSubmitting(true);
    setAuthError(null);

    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) {
        setAuthError(error.message);
        return;
      }

      await syncStoredSupabaseAccessToken();
      window.location.assign(`${window.location.origin}${nextRoute()}`);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Unable to sign in");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regEmail || !regPassword) return;

    setIsSubmitting(true);
    setAuthError(null);

    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.signUp({
        email: regEmail,
        password: regPassword,
        options: {
          data: {
            full_name: regDisplayName || undefined,
          },
          emailRedirectTo: `${window.location.origin}/#/auth/callback`,
        },
      });

      if (error) {
        setAuthError(error.message);
        return;
      }

      await syncStoredSupabaseAccessToken();
      window.location.assign(`${window.location.origin}${nextRoute()}`);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Unable to create account");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOAuth = async () => {
    setAuthError(null);

    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/#/auth/callback`,
        },
      });

      if (error) {
        setAuthError(error.message);
      }
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Unable to start Google sign in");
    }
  };

  return (
    <div className="min-h-screen flex bg-[#f7fbff]">
      <div className="hidden lg:flex lg:w-1/2 gradient-hero flex-col justify-between p-10 relative overflow-hidden border-r border-sky-100">
        <div className="shimmer absolute inset-0" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-3xl gradient-accent flex items-center justify-center shadow-lg">
              <HandCoins className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-slate-900">Khisa's Kitty</span>
          </div>
          <h1 className="text-4xl font-bold text-slate-950 mb-4 leading-tight">
            Create or join a chama
            <br />
            with a clearer member flow.
          </h1>
          <p className="text-slate-600 text-lg max-w-md leading-8">
            After login, you will choose whether to create your own group as the admin
            or join one through community cards and invite codes.
          </p>
        </div>
        <div className="relative z-10 grid grid-cols-3 gap-4">
          {[
            { icon: TrendingUp, label: "Track Savings", desc: "Clean dashboard" },
            { icon: Users, label: "Community", desc: "Find groups easily" },
            { icon: ShieldCheck, label: "Admin control", desc: "Set rules clearly" },
          ].map((feat) => {
            const Icon = feat.icon;
            return (
              <div key={feat.label} className="bg-white rounded-[24px] p-4 border border-sky-100 shadow-sm">
                <Icon className="w-6 h-6 text-sky-700 mb-2" />
                <p className="text-slate-900 font-medium text-sm">{feat.label}</p>
                <p className="text-slate-500 text-xs">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-background">
        <div className="w-full max-w-sm space-y-6">
          <div className="lg:hidden flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-3xl gradient-accent flex items-center justify-center">
              <HandCoins className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">Khisa's Kitty</span>
          </div>

          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground">Get started</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Create an account or log in to continue into your chama setup
            </p>
          </div>

          <button
            onClick={handleOAuth}
            className="flex items-center justify-center gap-2 w-full p-3 rounded-2xl border border-border bg-white hover:bg-sky-50 transition-colors text-sm font-medium"
          >
            <Shield className="w-4 h-4 text-sky-600" />
            Sign in with Google
          </button>

          <div className="relative">
            <Separator />
            <span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-xs text-muted-foreground">
              or continue with email
            </span>
          </div>

          <Tabs value={authTab} onValueChange={setAuthTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="register">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="login-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="login-email"
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="pl-9"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="login-pass">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="login-pass"
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter password"
                      className="pl-9"
                    />
                  </div>
                </div>
                {authError && authTab === "login" && (
                  <p className="text-sm text-destructive">{authError}</p>
                )}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full gradient-accent gap-2 rounded-full"
                >
                  {isSubmitting ? "Signing in..." : "Sign In"}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register" className="mt-4">
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <Label htmlFor="reg-name">Display Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="reg-name"
                      value={regDisplayName}
                      onChange={(e) => setRegDisplayName(e.target.value)}
                      placeholder="Your display name"
                      className="pl-9"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="reg-email">Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="reg-email"
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="pl-9"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="reg-pass">Password *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="reg-pass"
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="pl-9"
                    />
                  </div>
                </div>
                {authError && authTab === "register" && (
                  <p className="text-sm text-destructive">{authError}</p>
                )}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full gradient-accent gap-2 rounded-full"
                >
                  {isSubmitting ? "Creating account..." : "Create Account"}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <p className="text-center text-xs text-muted-foreground">
            By continuing, you move into the create-or-join chama setup flow.
          </p>
          <p className="text-center text-xs text-slate-500">
            <Link to="/" className="text-sky-700 hover:text-sky-800">Back to website overview</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
