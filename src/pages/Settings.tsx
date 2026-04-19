import { useAuth } from "@/hooks/useAuth";
import {
  User,
  Lock,
  Bell,
  Moon,
  Globe,
  DollarSign,
  HelpCircle,
  FileText,
  Shield,
  LogOut,
  ChevronRight,
  HandCoins,
} from "lucide-react";
import { Link } from "react-router";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export default function Settings() {
  const { user, logout } = useAuth();

  const sections = [
    {
      title: "Account",
      items: [
        { icon: User, label: "Edit Profile", description: user?.email, action: "chevron" },
        { icon: Lock, label: "Change Password", description: "Last changed 3 months ago", action: "chevron" },
        { icon: Shield, label: "Security", description: "PIN & Biometric", action: "chevron" },
      ],
    },
    {
      title: "Preferences",
      items: [
        { icon: Bell, label: "Notifications", action: "switch", defaultOn: true },
        { icon: Moon, label: "Dark Mode", action: "switch", defaultOn: false },
        { icon: DollarSign, label: "Currency", description: "USD ($)", action: "chevron" },
        { icon: Globe, label: "Language", description: "English", action: "chevron" },
      ],
    },
    {
      title: "Support",
      items: [
        { icon: HelpCircle, label: "Help Center", action: "chevron" },
        {
          icon: HandCoins,
          label: "Contact / Feedback",
          description: "Share your thoughts",
          action: "link",
          to: "/contact",
        },
        { icon: FileText, label: "Terms of Service", action: "chevron" },
      ],
    },
  ];

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Profile Header */}
      <div className="flex items-center gap-4 p-5 gradient-hero rounded-2xl card-shadow-lg">
        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-white text-2xl font-bold border-2 border-white/30">
          {user?.name?.charAt(0)?.toUpperCase() || "U"}
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">{user?.name || "User"}</h2>
          <p className="text-white/70 text-sm">{user?.email}</p>
          <span className="inline-block mt-1 px-2 py-0.5 bg-white/20 rounded-full text-white text-xs">
            {user?.role === "admin" ? "Administrator" : "Member"}
          </span>
        </div>
      </div>

      {/* Settings Sections */}
      {sections.map((section) => (
        <div key={section.title}>
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3 px-1">
            {section.title}
          </h3>
          <div className="bg-white rounded-xl card-shadow border border-border/50 divide-y divide-border/50">
            {section.items.map((item) => {
              const Icon = item.icon;
              const content = (
                <div className="flex items-center gap-3 p-4">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <Icon className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    {item.description && (
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    )}
                  </div>
                  {item.action === "switch" && (
                    <Switch defaultChecked={item.defaultOn} />
                  )}
                  {item.action === "chevron" && (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                  {item.action === "link" && (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              );

              if (item.action === "link" && "to" in item) {
                return (
                  <Link key={item.label} to={item.to!}>
                    {content}
                  </Link>
                );
              }

              return <div key={item.label}>{content}</div>;
            })}
          </div>
        </div>
      ))}

      {/* Logout */}
      <button
        onClick={logout}
        className="w-full flex items-center gap-3 p-4 bg-red-50 rounded-xl text-red-600 hover:bg-red-100 transition-colors"
      >
        <LogOut className="w-5 h-5" />
        <span className="font-medium">Log Out</span>
      </button>
    </div>
  );
}
