import { useState } from "react";
import { Download, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChamaState } from "@/hooks/useChamaState";

export default function ReportsWorkspace() {
  const { memberGroups } = useChamaState();
  const [selectedGroup, setSelectedGroup] = useState<number | null>(memberGroups[0]?.id || null);
  const [reportType, setReportType] = useState("summary");

  const handleDownload = () => {
    alert("Report download started");
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground">Financial Statements</h1>
          <p className="text-muted-foreground mt-1">View and download your detailed financial reports.</p>
        </div>
        <Button onClick={handleDownload} className="rounded-[16px] font-bold gap-2">
          <Download className="w-4 h-4" />
          Download Report
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-[24px] p-6 border border-border shadow-sm">
        <div className="flex items-center gap-4 mb-4">
          <Filter className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-lg font-bold text-foreground">Report Filters</h2>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-bold text-foreground mb-2 block">Select Group</label>
            <select 
              value={selectedGroup || ""} 
              onChange={(e) => setSelectedGroup(Number(e.target.value))}
              className="w-full h-10 rounded-[12px] border border-border px-3 text-foreground bg-background"
            >
              <option value="">All Groups</option>
              {memberGroups.map(group => (
                <option key={group.id} value={group.id}>{group.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-bold text-foreground mb-2 block">Report Type</label>
            <select 
              value={reportType} 
              onChange={(e) => setReportType(e.target.value)}
              className="w-full h-10 rounded-[12px] border border-border px-3 text-foreground bg-background"
            >
              <option value="summary">Summary</option>
              <option value="detailed">Detailed</option>
              <option value="transactions">Transactions</option>
              <option value="contributions">Contributions</option>
              <option value="expenses">Expenses</option>
              <option value="loans">Loans</option>
            </select>
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div className="bg-card rounded-[24px] p-8 border border-border shadow-sm">
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto bg-secondary rounded-2xl flex items-center justify-center mb-4">
            <Download className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">No Report Data Available</h3>
          <p className="text-muted-foreground">Select a group and report type to generate a statement.</p>
        </div>
      </div>
    </div>
  );
}
