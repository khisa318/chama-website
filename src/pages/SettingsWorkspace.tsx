import { useEffect, useState } from "react";
import {
  Building2,
  Check,
  LockKeyhole,
  Settings,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useChamaState } from "@/hooks/useChamaState";
import { getSupabaseClient } from "@/lib/supabase";

export default function SettingsWorkspace() {
  const { user } = useAuth();
  const { adminGroups, updateGroup } = useChamaState();

  const [displayName, setDisplayName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [newPassword, setNewPassword] = useState("");
  const [accountMessage, setAccountMessage] = useState("");

  const [selectedGroupId, setSelectedGroupId] = useState(
    adminGroups[0]?.id || ""
  );
  const selectedGroup =
    adminGroups.find(group => group.id === selectedGroupId) || null;

  const [groupDescription, setGroupDescription] = useState("");
  const [groupMeetingDay, setGroupMeetingDay] = useState("");
  const [groupContribution, setGroupContribution] = useState("");
  const [groupPayoutStyle, setGroupPayoutStyle] = useState("");
  const [groupRules, setGroupRules] = useState("");
  const [groupImage, setGroupImage] = useState("");
  const [groupMessage, setGroupMessage] = useState("");

  useEffect(() => {
    setDisplayName(user?.name || "");
    setEmail(user?.email || "");
  }, [user]);

  useEffect(() => {
    const nextId = adminGroups[0]?.id || "";
    if (!selectedGroupId && nextId) {
      setSelectedGroupId(nextId);
    }
  }, [adminGroups, selectedGroupId]);

  useEffect(() => {
    if (!selectedGroup) return;
    setGroupDescription(selectedGroup.description);
    setGroupMeetingDay(selectedGroup.meetingDay);
    setGroupContribution(String(selectedGroup.monthlyContribution));
    setGroupPayoutStyle(selectedGroup.payoutStyle);
    setGroupRules(selectedGroup.rules.join("\n"));
    setGroupImage(selectedGroup.profileImage || "");
  }, [selectedGroup]);

  const handleSaveAccount = async () => {
    try {
      const supabase = getSupabaseClient();
      const payload: {
        email?: string;
        password?: string;
        data?: { full_name?: string };
      } = {
        data: {
          full_name: displayName.trim() || user?.name || "User",
        },
      };

      if (email.trim() && email.trim() !== user?.email) {
        payload.email = email.trim();
      }

      if (newPassword.trim()) {
        payload.password = newPassword.trim();
      }

      const { error } = await supabase.auth.updateUser(payload);
      if (error) {
        setAccountMessage(error.message);
        return;
      }

      setNewPassword("");
      setAccountMessage("Your personal account settings were updated.");
    } catch (error) {
      setAccountMessage(
        error instanceof Error
          ? error.message
          : "Unable to update your account right now."
      );
    }
  };

  const handleSaveGroup = () => {
    if (!selectedGroup) return;

    updateGroup(selectedGroup.id, {
      description: groupDescription.trim(),
      meetingDay: groupMeetingDay.trim(),
      monthlyContribution:
        Number(groupContribution) || selectedGroup.monthlyContribution,
      payoutStyle: groupPayoutStyle.trim(),
      profileImage: groupImage.trim() || undefined,
      rules: groupRules
        .split("\n")
        .map(rule => rule.trim())
        .filter(Boolean),
    });

    setGroupMessage("Group settings updated successfully.");
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] bg-white border border-border p-8 card-shadow">
        <p className="text-sm uppercase tracking-[0.18em] text-sky-600">
          Settings
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-slate-900">
          Manage your account and group controls
        </h1>
        <p className="mt-4 max-w-3xl text-slate-600 leading-8">
          Update your personal account details here, and if you are a group
          admin, manage your chama rules, contribution settings, and group
          identity in the same workspace.
        </p>
      </section>

      <Tabs defaultValue="account" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 rounded-[20px] bg-white border border-border p-1">
          <TabsTrigger value="account">Personal Account</TabsTrigger>
          <TabsTrigger value="groups">Admin Group Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="account">
          <section className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
            <div className="rounded-[30px] bg-white border border-border p-7 card-shadow space-y-5">
              <div className="flex items-center gap-3 text-sky-700">
                <UserRound className="w-5 h-5" />
                <p className="font-semibold">Personal account</p>
              </div>
              <div>
                <Label htmlFor="display-name">Display name</Label>
                <Input
                  id="display-name"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="account-email">Email address</Label>
                <Input
                  id="account-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Leave empty if you do not want to change it"
                />
              </div>
              {accountMessage && (
                <div className="rounded-2xl bg-sky-50 px-4 py-3 text-sm text-sky-700">
                  {accountMessage}
                </div>
              )}
              <Button
                className="rounded-full px-6"
                onClick={() => void handleSaveAccount()}
              >
                Save personal settings
              </Button>
            </div>

            <div className="rounded-[30px] bg-slate-900 p-7 text-white">
              <div className="flex items-center gap-3">
                <LockKeyhole className="w-5 h-5" />
                <p className="font-semibold">Account control</p>
              </div>
              <div className="mt-5 space-y-4 text-sm leading-7 text-white/75">
                <p>
                  Change the name people see inside groups and community spaces.
                </p>
                <p>
                  Update your email if you want account notices to go somewhere
                  else.
                </p>
                <p>
                  Change your password from here without leaving the workspace.
                </p>
              </div>
            </div>
          </section>
        </TabsContent>

        <TabsContent value="groups">
          <section className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
            <div className="rounded-[30px] bg-white border border-border p-7 card-shadow">
              <div className="flex items-center gap-3 text-sky-700">
                <Building2 className="w-5 h-5" />
                <p className="font-semibold">Groups you manage</p>
              </div>
              <div className="mt-5 space-y-3">
                {adminGroups.length > 0 ? (
                  adminGroups.map(group => (
                    <button
                      key={group.id}
                      onClick={() => {
                        setSelectedGroupId(group.id);
                        setGroupMessage("");
                      }}
                      className={`w-full rounded-[22px] border px-4 py-4 text-left transition-all ${
                        selectedGroupId === group.id
                          ? "border-sky-200 bg-sky-50"
                          : "border-border bg-white hover:bg-slate-50"
                      }`}
                    >
                      <p className="font-medium text-slate-900">{group.name}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {group.memberCount} members
                      </p>
                    </button>
                  ))
                ) : (
                  <div className="rounded-[22px] bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-600">
                    You are not an admin of any group yet. Once you create a
                    group, its admin settings will appear here.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[30px] bg-white border border-border p-7 card-shadow space-y-5">
              <div className="flex items-center gap-3 text-sky-700">
                <Settings className="w-5 h-5" />
                <p className="font-semibold">Group settings</p>
              </div>

              {selectedGroup ? (
                <>
                  <div>
                    <Label htmlFor="group-image">Profile picture URL</Label>
                    <Input
                      id="group-image"
                      value={groupImage}
                      onChange={e => setGroupImage(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="group-description">Description</Label>
                    <Textarea
                      id="group-description"
                      value={groupDescription}
                      onChange={e => setGroupDescription(e.target.value)}
                      className="min-h-[120px]"
                    />
                  </div>
                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <Label htmlFor="group-meeting-day">Meeting day</Label>
                      <Input
                        id="group-meeting-day"
                        value={groupMeetingDay}
                        onChange={e => setGroupMeetingDay(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="group-contribution">
                        Monthly contribution
                      </Label>
                      <Input
                        id="group-contribution"
                        type="number"
                        value={groupContribution}
                        onChange={e => setGroupContribution(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="group-payout-style">Payout style</Label>
                    <Input
                      id="group-payout-style"
                      value={groupPayoutStyle}
                      onChange={e => setGroupPayoutStyle(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="group-rules">Rules</Label>
                    <Textarea
                      id="group-rules"
                      value={groupRules}
                      onChange={e => setGroupRules(e.target.value)}
                      className="min-h-[160px]"
                    />
                  </div>
                  {groupMessage && (
                    <div className="rounded-2xl bg-sky-50 px-4 py-3 text-sm text-sky-700">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4" />
                        {groupMessage}
                      </div>
                    </div>
                  )}
                  <Button
                    className="rounded-full px-6"
                    onClick={handleSaveGroup}
                  >
                    Save group settings
                  </Button>
                </>
              ) : (
                <div className="rounded-[24px] bg-slate-50 px-5 py-5 text-sm leading-7 text-slate-600">
                  Select a group you manage to change its profile picture,
                  rules, contribution amount, and other admin settings.
                </div>
              )}
            </div>
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}
