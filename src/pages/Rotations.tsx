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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Clock, RotateCw, Pause } from "lucide-react";

export default function Rotations() {
  const { groupId } = useParams<{ groupId: string }>();
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedRotation, setSelectedRotation] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    rotationAmount: "",
    frequency: "monthly",
    startDate: "",
  });

  const groupIdNum = parseInt(groupId || "0");

  // Fetch rotations
  const { data: rotations = [], isLoading } = useQuery({
    queryKey: ["rotations", groupIdNum],
    queryFn: async () => {
      return trpc.rotation.list.query({ groupId: groupIdNum });
    },
  });

  // Create rotation mutation
  const { mutate: createRotation, isPending } = useMutation({
    mutationFn: async (data: typeof formData) => {
      return trpc.rotation.create.mutate({
        groupId: groupIdNum,
        name: data.name,
        description: data.description || undefined,
        rotationAmount: parseFloat(data.rotationAmount),
        frequency: data.frequency as any,
        startDate: new Date(data.startDate),
        memberIds: [], // TODO: Get from UI
      });
    },
    onSuccess: () => {
      setOpenDialog(false);
      setFormData({
        name: "",
        description: "",
        rotationAmount: "",
        frequency: "monthly",
        startDate: "",
      });
    },
  });

  const { mutate: pauseRotation } = useMutation({
    mutationFn: async (id: number) => {
      return trpc.rotation.pauseRotation.mutate({ id, groupId: groupIdNum });
    },
  });

  const { mutate: resumeRotation } = useMutation({
    mutationFn: async (id: number) => {
      return trpc.rotation.resumeRotation.mutate({ id, groupId: groupIdNum });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <RotateCw className="w-4 h-4" />;
      case "paused":
        return <Pause className="w-4 h-4" />;
      case "completed":
        return <CheckCircle2 className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "paused":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <RotateCw className="w-8 h-8 text-blue-600" />
              Merry-Go-Round Rotations
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage automated payout rotations for your group
            </p>
          </div>
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                Create Rotation
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Rotation</DialogTitle>
                <DialogDescription>
                  Set up a new merry-go-round rotation for your group
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Rotation Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Monthly Rotation 2024"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Optional description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="amount">Rotation Amount (KES)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Total amount to rotate"
                    value={formData.rotationAmount}
                    onChange={(e) =>
                      setFormData({ ...formData, rotationAmount: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select
                    value={formData.frequency}
                    onValueChange={(value) =>
                      setFormData({ ...formData, frequency: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Bi-weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                  />
                </div>
                <Button
                  onClick={() => createRotation(formData)}
                  disabled={isPending}
                  className="w-full"
                >
                  {isPending ? "Creating..." : "Create Rotation"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Rotations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {isLoading ? (
            <div className="col-span-2 text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-muted-foreground mt-4">Loading rotations...</p>
            </div>
          ) : rotations.length === 0 ? (
            <Card className="col-span-2">
              <CardContent className="pt-12 pb-12 text-center">
                <RotateCw className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-muted-foreground">No rotations created yet</p>
              </CardContent>
            </Card>
          ) : (
            rotations.map((rotation) => (
              <Card
                key={rotation.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedRotation(rotation)}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{rotation.name}</CardTitle>
                      <CardDescription>{rotation.description}</CardDescription>
                    </div>
                    <Badge className={getStatusColor(rotation.status)}>
                      {getStatusIcon(rotation.status)}
                      <span className="ml-1 capitalize">{rotation.status}</span>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Rotation Amount</p>
                      <p className="text-2xl font-bold text-blue-600">
                        KES {parseFloat(rotation.rotation_amount).toLocaleString()}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Frequency</p>
                        <p className="capitalize font-semibold">{rotation.frequency}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Members</p>
                        <p className="font-semibold">TBD</p>
                      </div>
                    </div>
                    <div className="pt-4 border-t space-y-2">
                      {rotation.status === "active" ? (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            pauseRotation(rotation.id);
                          }}
                          variant="outline"
                          className="w-full"
                        >
                          Pause Rotation
                        </Button>
                      ) : rotation.status === "paused" ? (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            resumeRotation(rotation.id);
                          }}
                          className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                          Resume Rotation
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
