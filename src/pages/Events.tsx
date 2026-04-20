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
import { Calendar, MapPin, Users, Check, X, HelpCircle } from "lucide-react";

export default function Events() {
  const { groupId } = useParams<{ groupId: string }>();
  const [openDialog, setOpenDialog] = useState(false);
  const [openRsvpDialog, setOpenRsvpDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [rsvpStatus, setRsvpStatus] = useState<"attending" | "not_attending" | "maybe">("attending");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    eventType: "meeting",
    startDate: "",
    location: "",
  });

  const groupIdNum = parseInt(groupId || "0");

  // Fetch events
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["events", groupIdNum],
    queryFn: async () => {
      return trpc.event.list.query({ groupId: groupIdNum });
    },
  });

  // Create event mutation
  const { mutate: createEvent, isPending } = useMutation({
    mutationFn: async (data: typeof formData) => {
      return trpc.event.create.mutate({
        groupId: groupIdNum,
        title: data.title,
        description: data.description || undefined,
        eventType: data.eventType as any,
        startDate: new Date(data.startDate),
        location: data.location || undefined,
      });
    },
    onSuccess: () => {
      setOpenDialog(false);
      setFormData({
        title: "",
        description: "",
        eventType: "meeting",
        startDate: "",
        location: "",
      });
    },
  });

  // RSVP mutation
  const { mutate: rsvp, isPending: rsvpPending } = useMutation({
    mutationFn: async () => {
      return trpc.event.rsvp.mutate({
        eventId: selectedEvent.id,
        groupId: groupIdNum,
        status: rsvpStatus,
      });
    },
    onSuccess: () => {
      setOpenRsvpDialog(false);
    },
  });

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case "meeting":
        return "bg-blue-100 text-blue-800";
      case "announcement":
        return "bg-purple-100 text-purple-800";
      case "celebration":
        return "bg-pink-100 text-pink-800";
      case "training":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-8 h-8 text-pink-600" />
              Events & Announcements
            </h1>
            <p className="text-muted-foreground mt-2">
              Organize meetings, celebrations, and keep your group connected
            </p>
          </div>
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button className="bg-pink-600 hover:bg-pink-700">
                Create Event
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Event</DialogTitle>
                <DialogDescription>
                  Schedule a meeting, announcement, or celebration
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Event Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Monthly Group Meeting"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Event details..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="eventType">Event Type</Label>
                  <Select
                    value={formData.eventType}
                    onValueChange={(value) =>
                      setFormData({ ...formData, eventType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="announcement">Announcement</SelectItem>
                      <SelectItem value="celebration">Celebration</SelectItem>
                      <SelectItem value="training">Training</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="startDate">Date & Time</Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="e.g., Community Center"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
                <Button
                  onClick={() => createEvent(formData)}
                  disabled={isPending}
                  className="w-full"
                >
                  {isPending ? "Creating..." : "Create Event"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-3 text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
              <p className="text-muted-foreground mt-4">Loading events...</p>
            </div>
          ) : events.length === 0 ? (
            <Card className="col-span-3">
              <CardContent className="pt-12 pb-12 text-center">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-muted-foreground">No events scheduled yet</p>
              </CardContent>
            </Card>
          ) : (
            events.map((event) => (
              <Card
                key={event.id}
                className="hover:shadow-lg transition-shadow flex flex-col"
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{event.title}</CardTitle>
                      <Badge className={`mt-2 ${getEventColor(event.event_type)}`}>
                        {event.event_type}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  {event.description && (
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                  )}

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      {formatDate(event.start_date)}
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        {event.location}
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t">
                    <Dialog open={openRsvpDialog && selectedEvent?.id === event.id} onOpenChange={setOpenRsvpDialog}>
                      <DialogTrigger asChild>
                        <Button
                          onClick={() => setSelectedEvent(event)}
                          variant="outline"
                          className="w-full"
                        >
                          <Users className="w-4 h-4 mr-2" />
                          RSVP
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>RSVP to {event.title}</DialogTitle>
                          <DialogDescription>
                            Let us know if you can attend
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Button
                              onClick={() => setRsvpStatus("attending")}
                              variant={rsvpStatus === "attending" ? "default" : "outline"}
                              className="w-full justify-start"
                            >
                              <Check className="w-4 h-4 mr-2 text-green-600" />
                              I'm Attending
                            </Button>
                            <Button
                              onClick={() => setRsvpStatus("maybe")}
                              variant={rsvpStatus === "maybe" ? "default" : "outline"}
                              className="w-full justify-start"
                            >
                              <HelpCircle className="w-4 h-4 mr-2 text-yellow-600" />
                              Maybe
                            </Button>
                            <Button
                              onClick={() => setRsvpStatus("not_attending")}
                              variant={rsvpStatus === "not_attending" ? "default" : "outline"}
                              className="w-full justify-start"
                            >
                              <X className="w-4 h-4 mr-2 text-red-600" />
                              Can't Attend
                            </Button>
                          </div>
                          <Button
                            onClick={() => rsvp()}
                            disabled={rsvpPending}
                            className="w-full bg-pink-600 hover:bg-pink-700"
                          >
                            {rsvpPending ? "Updating..." : "Confirm RSVP"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
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
