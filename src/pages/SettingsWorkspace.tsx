import { useEffect, useState } from "react";
import {
  Building2,
  Check,
  LockKeyhole,
  Settings,
  UserRound,
  ShieldCheck,
  Save,
  Crown,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import { getSupabaseClient } from "@/lib/supabase";

export default function SettingsWorkspace() {
  const { user } = useAuth();
  const utils = trpc.useContext();
  
  const { data: myGroups } = trpc.group.listMyGroups.useQuery();
  const adminGroups = myGroups?.filter(g => g.createdBy === user?.id) || [];

  const updateUserMutation = trpc.user.update.useMutation({
    onSuccess: () => {
      utils.user.getProfile.invalidate();
      setAccountMessage("Your personal account settings were updated.");
    },
    onError: (err) => setAccountMessage(err.message),
  });

  const updateGroupMutation = trpc.group.update.useMutation({
    onSuccess: () => {
      utils.group.listMyGroups.invalidate();
      setGroupMessage("Group settings updated successfully.");
    },
    onError: (err) => setGroupMessage(err.message),
  });

  const [displayName, setDisplayName] = useState(user?.full_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [newPassword, setNewPassword] = useState("");
  const [accountMessage, setAccountMessage] = useState("");

  const [selectedGroupId, setSelectedGroupId] = useState("");
  const selectedGroup = adminGroups.find(group => group.id === selectedGroupId) || null;

  const [groupDescription, setGroupDescription] = useState("");
  const [groupMeetingDay, setGroupMeetingDay] = useState("");
  const [groupContribution, setGroupContribution] = useState("");
  
  useEffect(() => {
    setDisplayName(user?.full_name || "");
    setEmail(user?.email || "");
  }, [user]);

  useEffect(() => {
    if (adminGroups.length > 0 && !selectedGroupId) {
      setSelectedGroupId(adminGroups[0].id);
    }
  }, [adminGroups, selectedGroupId]);

  useEffect(() => {
    if (!selectedGroup) return;
    setGroupDescription(selectedGroup.description || "");
    setGroupMeetingDay(String(selectedGroup.contributionDay || "1"));
    setGroupContribution(String(selectedGroup.contributionAmount || "0"));
  }, [selectedGroup]);

  const handleSaveAccount = async () => {
    const supabase = getSupabaseClient();
    
    // Update Auth (Email/Password) if needed
    if (email !== user?.email || newPassword) {
      const payload: any = {};
      if (email !== user?.email) payload.email = email;
      if (newPassword) payload.password = newPassword;
      
      const { error } = await supabase.auth.updateUser(payload);
      if (error) {
        setAccountMessage(error.message);
        return;
      }
    }

    // Update Profile in users table
    updateUserMutation.mutate({
      fullName: displayName,
    });
  };

  const handleSaveGroup = () => {
    if (!selectedGroup) return;

    updateGroupMutation.mutate({
      id: selectedGroup.id,
      description: groupDescription,
      contributionAmount: Number(groupContribution),
      contributionDay: Number(groupMeetingDay),
    });
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-8">
      {/* 1. Hero Banner */}
      <div className="relative rounded-[32px] overflow-hidden card-shadow bg-card border border-border">
        <div className="absolute inset-0 amibank-gradient opacity-10 dark:opacity-[0.15]"></div>
        <div className="relative p-8 md:p-10 flex flex-col lg:flex-row gap-8 items-start lg:items-center">
          <div className="w-24 h-24 rounded-[24px] overflow-hidden bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-xl border-[4px] border-background/50">
            <UserRound className="w-10 h-10" />
          </div>
          
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-3 tracking-tight">Account Settings</h1>
            <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed font-medium">
              Manage your personal security details and control the configurations for any chamas you actively manage.
            </p>
          </div>

          <div className="bg-background/80 backdrop-blur-xl rounded-[28px] p-7 border border-border w-full lg:w-auto shadow-sm min-w-[280px]">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Your Profile</p>
            <p className="text-2xl font-extrabold text-foreground truncate">{displayName || "User"}</p>
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground bg-secondary/80 px-3 py-2 mt-3 rounded-xl border border-border/50 truncate">
               <LockKeyhole className="w-3.5 h-3.5 text-primary" />
               {email || "No email linked"}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-8">
          <div className="rounded-[32px] bg-card border border-border p-7 card-shadow">
            <div className="flex items-center gap-3 text-primary mb-6">
              <ShieldCheck className="w-6 h-6" />
              <h2 className="text-2xl font-bold text-foreground">Personal Details</h2>
            </div>
            
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <Label htmlFor="display-name" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Full Name</Label>
                <Input
                  id="display-name"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className="rounded-[14px] h-11 mt-1"
                />
              </div>
              <div>
                <Label htmlFor="account-email" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email Address</Label>
                <Input
                  id="account-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="rounded-[14px] h-11 mt-1"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="new-password" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Leave empty to keep current password"
                  className="rounded-[14px] h-11 mt-1"
                />
              </div>
            </div>
            
            <div className="mt-6 flex flex-col sm:flex-row items-center gap-4">
              <Button
                className="w-full sm:w-auto rounded-[14px] font-bold h-11 px-8"
                onClick={handleSaveAccount}
                disabled={updateUserMutation.isLoading}
              >
                {updateUserMutation.isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Personal Changes"}
              </Button>
              {accountMessage && (
                <div className="text-sm font-bold text-primary bg-primary/10 px-4 py-2.5 rounded-xl">
                  {accountMessage}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[32px] bg-card border border-border p-7 card-shadow">
            <div className="flex items-center gap-3 text-primary mb-6">
              <Settings className="w-6 h-6" />
              <h2 className="text-2xl font-bold text-foreground">Group Admin Controls</h2>
            </div>
            
            {selectedGroup ? (
              <div className="space-y-5">
                <div className="p-4 bg-secondary/50 rounded-[20px] border border-border flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-muted-foreground">Currently editing:</span>
                  <span className="text-sm font-extrabold text-foreground px-3 py-1 bg-background rounded-full border border-border shadow-sm">{selectedGroup.name}</span>
                </div>

                <div>
                  <Label htmlFor="group-description" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Group Description</Label>
                  <Textarea
                    id="group-description"
                    value={groupDescription}
                    onChange={e => setGroupDescription(e.target.value)}
                    className="min-h-[100px] rounded-[16px] mt-1"
                  />
                </div>
                
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <Label htmlFor="group-meeting-day" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Contribution Day (1-31)</Label>
                    <Input
                      id="group-meeting-day"
                      type="number"
                      value={groupMeetingDay}
                      onChange={e => setGroupMeetingDay(e.target.value)}
                      className="rounded-[14px] h-11 mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="group-contribution" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Contribution Amount (KES)</Label>
                    <Input
                      id="group-contribution"
                      type="number"
                      value={groupContribution}
                      onChange={e => setGroupContribution(e.target.value)}
                      className="rounded-[14px] h-11 mt-1"
                    />
                  </div>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row items-center gap-4">
                  <Button
                    className="w-full sm:w-auto rounded-[14px] font-bold h-11 px-8 gap-2 bg-orange-500 hover:bg-orange-600 text-white"
                    onClick={handleSaveGroup}
                    disabled={updateGroupMutation.isLoading}
                  >
                    {updateGroupMutation.isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Group Settings
                  </Button>
                  {updateGroupMutation.isLoading && <p className="text-sm font-bold text-orange-500">Updating...</p>}
                </div>
              </div>
            ) : (
              <div className="rounded-[24px] bg-secondary/50 px-8 py-10 text-center border border-border/50">
                <Building2 className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="font-bold text-foreground">No Group Selected</p>
                <p className="text-xs font-medium text-muted-foreground mt-2 max-w-sm mx-auto">Select a group you manage from the sidebar to change its configuration.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          <div className="rounded-[32px] bg-card border border-border p-7 card-shadow">
            <div className="flex items-center gap-3 text-primary mb-6">
              <Crown className="w-5 h-5" />
              <h3 className="text-lg font-bold text-foreground">Groups You Manage</h3>
            </div>
            <div className="space-y-3">
              {adminGroups.length > 0 ? (
                adminGroups.map(group => (
                  <button
                    key={group.id}
                    onClick={() => {
                      setSelectedGroupId(group.id);
                      setAccountMessage("");
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-[16px] transition-all border ${
                      selectedGroupId === group.id
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-border bg-background hover:bg-secondary/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-[10px] flex items-center justify-center font-bold text-xs shrink-0 ${
                        selectedGroupId === group.id ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                      }`}>
                        {group.name.charAt(0)}
                      </div>
                      <div className="text-left min-w-0">
                        <p className={`text-sm font-bold truncate max-w-[120px] ${selectedGroupId === group.id ? "text-primary" : "text-foreground"}`}>{group.name}</p>
                      </div>
                    </div>
                    {selectedGroupId === group.id && <Check className="w-4 h-4 text-primary shrink-0" />}
                  </button>
                ))
              ) : (
                <div className="rounded-[20px] bg-secondary/50 p-5 text-center">
                  <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                    You are not an admin of any group yet.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
