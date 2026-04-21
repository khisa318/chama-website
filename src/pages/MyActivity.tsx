import { Activity, HandCoins, AlertCircle, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const activities = [
  { id: 1, type: "contribution", title: "Contribution Paid", desc: "KES 5,000 sent to Alpha Circle", date: "Today, 10:42 AM", icon: HandCoins, color: "text-green-600", bg: "bg-green-100" },
  { id: 2, type: "missed", title: "Missed Payment", desc: "KES 2,000 due for Beta Investors", date: "Yesterday, 11:59 PM", icon: AlertCircle, color: "text-red-600", bg: "bg-red-100" },
  { id: 3, type: "loan", title: "Loan Approved", desc: "KES 15,000 disbursed to your wallet", date: "15 Apr, 09:00 AM", icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-100" },
];

export default function MyActivity() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div>
        <h1 className="text-3xl font-extrabold text-foreground">My Activity</h1>
        <p className="text-muted-foreground mt-1">Track your contributions, missed payments, and notifications.</p>
      </div>

      <div className="bg-card rounded-[32px] p-8 border border-border shadow-sm">
        <div className="flex items-center gap-3 mb-8 pb-6 border-b border-border">
          <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
            <Activity className="w-6 h-6 text-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Recent Timeline</h2>
            <p className="text-sm text-muted-foreground">Your last 30 days of activity</p>
          </div>
        </div>

        <div className="space-y-8 relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
          {activities.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={item.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className={`flex items-center justify-center w-12 h-12 rounded-full border-4 border-card ${item.bg} ${item.color} shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-4 rounded-2xl bg-secondary/30 border border-border">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-foreground text-sm">{item.title}</h3>
                    <Badge variant="outline" className="text-[10px] bg-background">{item.type}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{item.desc}</p>
                  <time className="text-xs font-bold text-muted-foreground/60 uppercase tracking-wider">{item.date}</time>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
