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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, FileUp, Clock, CheckCircle2, XCircle, DollarSign } from "lucide-react";

export default function Welfare() {
  const { groupId } = useParams<{ groupId: string }>();
  const [openDialog, setOpenDialog] = useState(false);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "paid" | undefined>();
  const [formData, setFormData] = useState({
    claimType: "medical",
    description: "",
    amount: "",
    documentUrl: "",
  });

  const groupIdNum = parseInt(groupId || "0");

  // Fetch welfare claims
  const { data: claims = [], isLoading } = useQuery({
    queryKey: ["welfare", groupIdNum, filter],
    queryFn: async () => {
      return trpc.welfare.list.query({ groupId: groupIdNum, status: filter });
    },
  });

  // Submit claim mutation
  const { mutate: submitClaim, isPending } = useMutation({
    mutationFn: async (data: typeof formData) => {
      return trpc.welfare.submit.mutate({
        groupId: groupIdNum,
        claimType: data.claimType as any,
        description: data.description,
        amount: parseFloat(data.amount),
        documentUrl: data.documentUrl || undefined,
      });
    },
    onSuccess: () => {
      setOpenDialog(false);
      setFormData({ claimType: "medical", description: "", amount: "", documentUrl: "" });
    },
  });

  const { mutate: approveClaim } = useMutation({
    mutationFn: async (id: number) => {
      return trpc.welfare.approve.mutate({ id, groupId: groupIdNum });
    },
  });

  const { mutate: markPaid } = useMutation({
    mutationFn: async (id: number) => {
      return trpc.welfare.markAsPaid.mutate({ id, groupId: groupIdNum });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-blue-100 text-blue-800";
      case "paid":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "approved":
        return <CheckCircle2 className="w-4 h-4" />;
      case "paid":
        return <CheckCircle2 className="w-4 h-4" />;
      case "rejected":
        return <XCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Heart className="w-8 h-8 text-red-500" />
              Welfare Claims
            </h1>
            <p className="text-muted-foreground mt-2">
              Support members through medical, burial, and other welfare needs
            </p>
          </div>
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button className="bg-red-600 hover:bg-red-700">
                Submit Claim
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Submit Welfare Claim</DialogTitle>
                <DialogDescription>
                  Submit a welfare claim for your group support
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="claimType">Claim Type</Label>
                  <Select
                    value={formData.claimType}
                    onValueChange={(value) =>
                      setFormData({ ...formData, claimType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="medical">Medical</SelectItem>
                      <SelectItem value="burial">Burial</SelectItem>
                      <SelectItem value="graduation">Graduation</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your claim..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="amount">Amount (KES)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Enter amount"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="document">Document URL (Optional)</Label>
                  <Input
                    id="document"
                    type="url"
                    placeholder="Upload receipt or proof"
                    value={formData.documentUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, documentUrl: e.target.value })
                    }
                  />
                </div>
                <Button
                  onClick={() => submitClaim(formData)}
                  disabled={isPending}
                  className="w-full"
                >
                  {isPending ? "Submitting..." : "Submit Claim"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filter Tabs */}
        <Tabs
          value={filter || "all"}
          onValueChange={(value) => setFilter(value === "all" ? undefined : (value as any))}
          className="mb-6"
        >
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="paid">Paid</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Claims List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
              <p className="text-muted-foreground mt-4">Loading claims...</p>
            </div>
          ) : claims.length === 0 ? (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-muted-foreground">No welfare claims found</p>
              </CardContent>
            </Card>
          ) : (
            claims.map((claim) => (
              <Card key={claim.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="capitalize">{claim.claim_type} Claim</CardTitle>
                      <CardDescription>{claim.description}</CardDescription>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(claim.status)}>
                        {getStatusIcon(claim.status)}
                        <span className="ml-1 capitalize">{claim.status}</span>
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Amount</p>
                      <p className="text-lg font-bold text-red-600 flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        {claim.amount}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Submitted</p>
                      <p className="text-sm font-semibold">
                        {new Date(claim.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Approved</p>
                      <p className="text-sm font-semibold">
                        {claim.approved_at
                          ? new Date(claim.approved_at).toLocaleDateString()
                          : "Pending"}
                      </p>
                    </div>
                  </div>

                  {claim.document_url && (
                    <div className="mb-4 p-3 bg-blue-50 rounded flex items-center gap-2">
                      <FileUp className="w-4 h-4 text-blue-600" />
                      <a
                        href={claim.document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        View Document
                      </a>
                    </div>
                  )}

                  {claim.rejection_reason && (
                    <div className="mb-4 p-3 bg-red-50 rounded text-sm text-red-700">
                      <p className="font-semibold">Rejection Reason:</p>
                      <p>{claim.rejection_reason}</p>
                    </div>
                  )}

                  {claim.status === "approved" && (
                    <Button
                      onClick={() => markPaid(claim.id)}
                      variant="outline"
                      className="w-full"
                    >
                      Mark as Paid
                    </Button>
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
