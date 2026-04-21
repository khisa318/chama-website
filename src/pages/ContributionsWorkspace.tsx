import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChamaState } from "@/hooks/useChamaState";

export default function ContributionsWorkspace() {
  const { memberGroups } = useChamaState();
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [amount, setAmount] = useState("");

  const handleSubmit = () => {
    if (!selectedGroup || !amount) {
      alert("Please select a group and enter an amount");
      return;
    }
    alert(`Contribution of KES ${amount} submitted for group ${selectedGroup}`);
    setAmount("");
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground">Contributions</h1>
          <p className="text-muted-foreground mt-1">Manage and track your group contributions.</p>
        </div>
        <Button className="rounded-[16px] font-bold gap-2" disabled>
          <Plus className="w-4 h-4" />
          Add Contribution
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Form */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-[24px] p-6 border border-border shadow-sm">
            <h2 className="text-lg font-bold text-foreground mb-4">New Contribution</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold text-foreground mb-2 block">Select Group</label>
                <select 
                  value={selectedGroup || ""} 
                  onChange={(e) => setSelectedGroup(Number(e.target.value))}
                  className="w-full h-10 rounded-[12px] border border-border px-3 text-foreground bg-background"
                >
                  <option value="">Choose a group...</option>
                  {memberGroups.map(group => (
                    <option key={group.id} value={group.id}>{group.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-sm font-bold text-foreground mb-2 block">Amount (KES)</label>
                <Input 
                  type="number" 
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="h-10 rounded-[12px]"
                />
              </div>

              <Button onClick={handleSubmit} className="w-full rounded-[12px] font-bold">
                Submit Contribution
              </Button>
            </div>
          </div>
        </div>

        {/* History */}
        <div className="lg:col-span-2">
          <div className="bg-card rounded-[24px] p-6 border border-border shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">Contribution History</h2>
              <Input 
                placeholder="Search..." 
                className="w-48 h-10 rounded-[12px]"
              />
            </div>
            
            <div className="text-center py-12 text-muted-foreground">
              <p>No contributions yet</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
