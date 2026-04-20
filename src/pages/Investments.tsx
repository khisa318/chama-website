import { useState } from "react";
import { useParams } from "react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { trpc } from "@/providers/trpc";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, DollarSign, Calendar, Target, CheckCircle2 } from "lucide-react";

export default function Investments() {
  const { groupId } = useParams<{ groupId: string }>();
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    investmentType: "property",
    purchaseAmount: "",
    purchaseDate: "",
    maturityDate: "",
    expectedReturn: "",
    notes: "",
  });

  const groupIdNum = parseInt(groupId || "0");

  // Fetch investments
  const { data: investments = [], isLoading } = useQuery({
    queryKey: ["investments", groupIdNum],
    queryFn: async () => {
      return trpc.investment.list.query({ groupId: groupIdNum });
    },
  });

  // Fetch portfolio summary
  const { data: portfolioSummary } = useQuery({
    queryKey: ["portfolio-summary", groupIdNum],
    queryFn: async () => {
      return trpc.investment.getPortfolioSummary.query({ groupId: groupIdNum });
    },
  });

  // Create investment mutation
  const { mutate: createInvestment, isPending } = useMutation({
    mutationFn: async (data: typeof formData) => {
      return trpc.investment.create.mutate({
        groupId: groupIdNum,
        name: data.name,
        description: data.description || undefined,
        investmentType: data.investmentType as any,
        purchaseAmount: parseFloat(data.purchaseAmount),
        purchaseDate: new Date(data.purchaseDate),
        maturityDate: data.maturityDate ? new Date(data.maturityDate) : undefined,
        expectedReturn: data.expectedReturn ? parseFloat(data.expectedReturn) : undefined,
        notes: data.notes || undefined,
      });
    },
    onSuccess: () => {
      setOpenDialog(false);
      setFormData({
        name: "",
        description: "",
        investmentType: "property",
        purchaseAmount: "",
        purchaseDate: "",
        maturityDate: "",
        expectedReturn: "",
        notes: "",
      });
    },
  });

  const getInvestmentColor = (type: string) => {
    switch (type) {
      case "property":
        return "bg-blue-100 text-blue-800";
      case "bonds":
        return "bg-green-100 text-green-800";
      case "stocks":
        return "bg-purple-100 text-purple-800";
      case "business":
        return "bg-orange-100 text-orange-800";
      case "other":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "matured":
        return "bg-blue-100 text-blue-800";
      case "liquidated":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-8 h-8 text-green-600" />
              Investments
            </h1>
            <p className="text-muted-foreground mt-2">
              Track your group's investments and monitor returns
            </p>
          </div>
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                Add Investment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Investment</DialogTitle>
                <DialogDescription>
                  Record a new investment for your group
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Investment Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Commercial Property"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Investment details..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="investmentType">Investment Type</Label>
                  <Select
                    value={formData.investmentType}
                    onValueChange={(value) =>
                      setFormData({ ...formData, investmentType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="property">Property</SelectItem>
                      <SelectItem value="bonds">Bonds</SelectItem>
                      <SelectItem value="stocks">Stocks</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="purchaseAmount">Purchase Amount (KES)</Label>
                    <Input
                      id="purchaseAmount"
                      type="number"
                      placeholder="0"
                      value={formData.purchaseAmount}
                      onChange={(e) =>
                        setFormData({ ...formData, purchaseAmount: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="expectedReturn">Expected Return (%)</Label>
                    <Input
                      id="expectedReturn"
                      type="number"
                      placeholder="0"
                      value={formData.expectedReturn}
                      onChange={(e) =>
                        setFormData({ ...formData, expectedReturn: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="purchaseDate">Purchase Date</Label>
                    <Input
                      id="purchaseDate"
                      type="date"
                      value={formData.purchaseDate}
                      onChange={(e) =>
                        setFormData({ ...formData, purchaseDate: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="maturityDate">Maturity Date (Optional)</Label>
                    <Input
                      id="maturityDate"
                      type="date"
                      value={formData.maturityDate}
                      onChange={(e) =>
                        setFormData({ ...formData, maturityDate: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Additional notes..."
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                  />
                </div>
                <Button
                  onClick={() => createInvestment(formData)}
                  disabled={isPending}
                  className="w-full"
                >
                  {isPending ? "Adding..." : "Add Investment"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Portfolio Summary */}
        {portfolioSummary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Invested</p>
                    <p className="text-2xl font-bold text-green-600">
                      KES {portfolioSummary.totalInvested.toLocaleString()}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Current Value</p>
                    <p className="text-2xl font-bold text-blue-600">
                      KES {portfolioSummary.totalCurrentValue.toLocaleString()}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Return</p>
                    <p className={`text-2xl font-bold ${portfolioSummary.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      KES {portfolioSummary.totalReturn.toLocaleString()}
                    </p>
                  </div>
                  {portfolioSummary.totalReturn >= 0 ? (
                    <TrendingUp className="w-8 h-8 text-green-600" />
                  ) : (
                    <TrendingDown className="w-8 h-8 text-red-600" />
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Return %</p>
                    <p className={`text-2xl font-bold ${parseFloat(portfolioSummary.returnPercentage) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {portfolioSummary.returnPercentage}%
                    </p>
                  </div>
                  <Target className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Investments List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              <p className="text-muted-foreground mt-4">Loading investments...</p>
            </div>
          ) : investments.length === 0 ? (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-muted-foreground">No investments recorded yet</p>
              </CardContent>
            </Card>
          ) : (
            investments.map((investment) => (
              <Card key={investment.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{investment.name}</CardTitle>
                      <CardDescription>{investment.description}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getInvestmentColor(investment.investment_type)}>
                        {investment.investment_type}
                      </Badge>
                      <Badge className={getStatusColor(investment.status)}>
                        {investment.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Purchase Amount</p>
                      <p className="text-lg font-bold text-green-600">
                        KES {parseFloat(investment.purchase_amount).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Current Value</p>
                      <p className="text-lg font-bold text-blue-600">
                        KES {parseFloat(investment.current_value || investment.purchase_amount).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Purchase Date</p>
                      <p className="text-sm font-semibold">
                        {new Date(investment.purchase_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Performance</p>
                      <p className={`text-lg font-bold ${parseFloat(investment.performance) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {investment.performance}%
                      </p>
                    </div>
                  </div>

                  {investment.maturity_date && (
                    <div className="mb-4 p-3 bg-blue-50 rounded">
                      <p className="text-sm text-blue-700">
                        <Calendar className="w-4 h-4 inline mr-2" />
                        Maturity Date: {new Date(investment.maturity_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  {investment.notes && (
                    <div className="mb-4 p-3 bg-gray-50 rounded">
                      <p className="text-sm text-muted-foreground">
                        <strong>Notes:</strong> {investment.notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
