import { useState } from "react";
import { Link } from "react-router";
import { trpc } from "@/providers/trpc";
import {
  Mail,
  MessageSquare,
  Send,
  ArrowLeft,
  MapPin,
  Phone,
  Clock,
  CheckCircle,
  HandCoins,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function Contact() {
  const submitContact = trpc.contact.submit.useMutation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) return;
    submitContact.mutate(
      { name: name.trim(), email: email.trim(), subject: subject.trim(), message: message.trim() },
      {
        onSuccess: () => {
          setSubmitted(true);
          setName("");
          setEmail("");
          setSubject("");
          setMessage("");
        },
      },
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link to="/" className="p-2 rounded-lg hover:bg-muted">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center">
            <HandCoins className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Contact & Feedback</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contact Info */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-card rounded-xl card-shadow border border-border p-5 space-y-4">
              <h3 className="font-semibold text-foreground">Get in Touch</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-violet-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-xs text-muted-foreground">support@khisakitty.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Phone className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <p className="text-xs text-muted-foreground">+1 (555) 123-4567</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Hours</p>
                    <p className="text-xs text-muted-foreground">Mon-Fri 9am-6pm</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Public Forum Card */}
            <Link
              to="/forum"
              className="flex items-center gap-4 p-4 bg-gradient-to-r from-violet-500/10 to-blue-500/10 rounded-xl border border-violet-200 hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 rounded-full gradient-accent flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-medium text-foreground">Public Forum</p>
                <p className="text-sm text-muted-foreground">Join the community discussion</p>
              </div>
            </Link>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            {submitted ? (
              <div className="bg-card rounded-xl card-shadow border border-border p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-emerald-500" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Thank You!</h3>
                <p className="text-muted-foreground mb-4">Your feedback has been submitted successfully.</p>
                <Button
                  variant="outline"
                  onClick={() => setSubmitted(false)}
                  className="gap-2"
                >
                  <Send className="w-4 h-4" />
                  Send Another
                </Button>
              </div>
            ) : (
              <div className="bg-card rounded-xl card-shadow border border-border p-6 space-y-4">
                <h3 className="font-semibold text-foreground">Send us a Message</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Name *</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
                  </div>
                  <div>
                    <Label>Email *</Label>
                    <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" type="email" />
                  </div>
                </div>
                <div>
                  <Label>Subject *</Label>
                  <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="What's this about?" />
                </div>
                <div>
                  <Label>Message *</Label>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us more..."
                    rows={5}
                  />
                </div>
                <Button
                  onClick={handleSubmit}
                  disabled={!name.trim() || !email.trim() || !subject.trim() || !message.trim() || submitContact.isPending}
                  className="w-full gradient-accent gap-2"
                >
                  <Send className="w-4 h-4" />
                  {submitContact.isPending ? "Sending..." : "Send Message"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
