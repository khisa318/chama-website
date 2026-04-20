import { CreditCard } from "lucide-react";

export default function MyCards() {
  return (
    <div className="space-y-6">
      <div className="rounded-[32px] bg-card border border-border p-8 card-shadow">
        <h1 className="text-2xl font-bold text-foreground">My Cards</h1>
        <p className="mt-4 text-muted-foreground">Manage your virtual and physical cards here.</p>
      </div>
      <div className="flex items-center justify-center h-64 bg-secondary/50 rounded-[32px] border border-dashed border-border/60">
        <div className="text-center">
          <CreditCard className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold text-foreground">No cards linked yet</h2>
          <p className="text-muted-foreground mt-2">Apply for a virtual Amibank card to start spending.</p>
        </div>
      </div>
    </div>
  );
}
