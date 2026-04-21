import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChamaState } from "@/hooks/useChamaState";

const categories = [
  { id: "food", label: "Food" },
  { id: "events", label: "Events" },
  { id: "emergency", label: "Emergency" },
  { id: "business", label: "Business" },
  { id: "transportation", label: "Transportation" },
  { id: "other", label: "Other" },
];

export default function ExpensesWorkspace() {
  const { memberGroups } = useChamaState();
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("other");

  const handleSubmit = () => {
    if (!selectedGroup || !amount || !description) {
      alert("Please fill in all fields");
      return;
    }
    alert(`Expense of KES ${amount} recorded for group ${selectedGroup}`);
    setAmount("");
    setDescription("");
    setCategory("other");
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground">Expenses</h1>
          <p className="text-muted-foreground mt-1">Track and manage group expenses.</p>
        </div>
        <Button className="rounded-[16px] font-bold gap-2" disabled>
          <Plus className="w-4 h-4" />
          Record Expense
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Form */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-[24px] p-6 border border-border shadow-sm">
            <h2 className="text-lg font-bold text-foreground mb-4">New Expense</h2>
            
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
                <label className="text-sm font-bold text-foreground mb-2 block">Category</label>
                <select 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-10 rounded-[12px] border border-border px-3 text-foreground bg-background"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-sm font-bold text-foreground mb-2 block">Description</label>
                <Input 
                  placeholder="What was this for?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="h-10 rounded-[12px]"
                />
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
                Record Expense
              </Button>
            </div>
          </div>
        </div>

        {/* History */}
        <div className="lg:col-span-2">
          <div className="bg-card rounded-[24px] p-6 border border-border shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">Expense History</h2>
              <Input 
                placeholder="Search..." 
                className="w-48 h-10 rounded-[12px]"
              />
            </div>
            
            <div className="text-center py-12 text-muted-foreground">
              <p>No expenses recorded yet</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
