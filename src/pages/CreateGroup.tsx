import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  ArrowRight,
  BadgeCheck,
  HandCoins,
  Image as ImageIcon,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useChamaState } from "@/hooks/useChamaState";

export default function CreateGroup() {
  const navigate = useNavigate();
  const { createGroup, groupTypes } = useChamaState();
  const [groupType, setGroupType] = useState(groupTypes[0].id);
  const selectedType =
    groupTypes.find(item => item.id === groupType) || groupTypes[0];

  const [name, setName] = useState("");
  const [description, setDescription] = useState(
    selectedType.defaultDescription
  );
  const [monthlyContribution, setMonthlyContribution] = useState(
    String(selectedType.defaultContribution)
  );
  const [meetingDay, setMeetingDay] = useState(selectedType.defaultMeetingDay);
  const [payoutStyle, setPayoutStyle] = useState(
    selectedType.defaultPayoutStyle
  );
  const [profileImage, setProfileImage] = useState("");
  const [rulesText, setRulesText] = useState(selectedType.rules.join("\n"));

  useEffect(() => {
    setDescription(selectedType.defaultDescription);
    setMonthlyContribution(String(selectedType.defaultContribution));
    setMeetingDay(selectedType.defaultMeetingDay);
    setPayoutStyle(selectedType.defaultPayoutStyle);
    setRulesText(selectedType.rules.join("\n"));
  }, [selectedType]);

  const ruleList = useMemo(
    () =>
      rulesText
        .split("\n")
        .map(rule => rule.trim())
        .filter(Boolean),
    [rulesText]
  );

  const handleCreate = () => {
    if (!name.trim()) return;

    createGroup({
      name: name.trim(),
      groupType,
      description: description.trim() || selectedType.defaultDescription,
      monthlyContribution: Number(monthlyContribution) || 0,
      meetingDay,
      payoutStyle,
      profileImage: profileImage.trim() || undefined,
      rules: ruleList,
    });

    navigate("/app/dashboard");
  };

  return (
    <div className="max-w-6xl mx-auto grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="rounded-[32px] bg-white border border-border p-8 md:p-10 card-shadow">
        <p className="text-sm uppercase tracking-[0.18em] text-sky-600">
          Create your group
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-slate-900">
          Choose the kind of chama you are starting.
        </h1>
        <p className="mt-4 text-slate-600 leading-8">
          Start by choosing the group type, then we shape the contribution
          setup, payout style, and suggested rules around that model.
        </p>

        <div className="mt-8">
          <Label>Group type</Label>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {groupTypes.map(type => (
              <button
                key={type.id}
                type="button"
                onClick={() => setGroupType(type.id)}
                className={`rounded-[26px] border p-5 text-left transition-all ${
                  groupType === type.id
                    ? "border-sky-200 bg-sky-50 shadow-sm"
                    : "border-border bg-white hover:bg-slate-50"
                }`}
              >
                <p className="text-lg font-semibold text-slate-900">
                  {type.label}
                </p>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  {type.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 space-y-5">
          <div>
            <Label htmlFor="group-name">Group name</Label>
            <Input
              id="group-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Example: Mombasa Women Chama"
            />
          </div>
          <div>
            <Label htmlFor="group-image">Profile picture URL (optional)</Label>
            <Input
              id="group-image"
              value={profileImage}
              onChange={e => setProfileImage(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div>
            <Label htmlFor="group-description">What is the group about?</Label>
            <Textarea
              id="group-description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Tell members what this chama is for."
            />
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <Label htmlFor="group-amount">
                {selectedType.contributionLabel}
              </Label>
              <Input
                id="group-amount"
                type="number"
                value={monthlyContribution}
                onChange={e => setMonthlyContribution(e.target.value)}
                placeholder={String(selectedType.defaultContribution)}
              />
            </div>
            <div>
              <Label htmlFor="meeting-day">Meeting day</Label>
              <Input
                id="meeting-day"
                value={meetingDay}
                onChange={e => setMeetingDay(e.target.value)}
                placeholder={selectedType.defaultMeetingDay}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="payout-style">How the group uses funds</Label>
            <Input
              id="payout-style"
              value={payoutStyle}
              onChange={e => setPayoutStyle(e.target.value)}
              placeholder={selectedType.defaultPayoutStyle}
            />
          </div>
          <div>
            <Label htmlFor="group-rules">Rules and bylaws</Label>
            <Textarea
              id="group-rules"
              value={rulesText}
              onChange={e => setRulesText(e.target.value)}
              className="min-h-[180px]"
              placeholder="Write one rule per line"
            />
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-4">
          <Button onClick={handleCreate} className="rounded-full px-6 gap-2">
            Create group
            <ArrowRight className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            className="rounded-full px-6"
            onClick={() => navigate("/app/dashboard")}
          >
            Back
          </Button>
        </div>
      </section>

      <section className="space-y-6">
        <div className="rounded-[32px] bg-slate-900 text-white p-8">
          <div className="w-14 h-14 rounded-3xl bg-white/10 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="mt-6 text-2xl font-semibold">{selectedType.label}</h2>
          <div className="mt-4 space-y-3 text-sm leading-7 text-white/75">
            {selectedType.guidance.map(item => (
              <p key={item}>{item}</p>
            ))}
          </div>
        </div>

        <div className="rounded-[32px] bg-white border border-border p-8 card-shadow">
          <div className="flex items-center gap-3 text-sky-700">
            <HandCoins className="w-5 h-5" />
            <p className="font-semibold">Preview</p>
          </div>
          <div className="mt-5 rounded-[24px] gradient-hero border border-sky-100 p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-3xl bg-white text-sky-700 flex items-center justify-center overflow-hidden">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt={name || "Group"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="w-6 h-6" />
                )}
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-sky-600">
                  {selectedType.shortLabel}
                </p>
                <p className="text-lg font-semibold text-slate-900">
                  {name || "Your group name"}
                </p>
                <p className="text-sm text-slate-600">
                  {description || "Your group description will appear here."}
                </p>
              </div>
            </div>
            <div className="mt-6 grid gap-3 text-sm text-slate-700">
              <p>
                {selectedType.contributionLabel}: KES{" "}
                {monthlyContribution || "0"}
              </p>
              <p>Meeting day: {meetingDay}</p>
              <p>Funding model: {payoutStyle}</p>
            </div>
            <div className="mt-5 space-y-2">
              {ruleList.slice(0, 4).map(rule => (
                <div
                  key={rule}
                  className="flex items-start gap-2 text-sm text-slate-600"
                >
                  <BadgeCheck className="w-4 h-4 text-sky-700 mt-0.5 shrink-0" />
                  <span>{rule}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-[32px] bg-white border border-border p-8 card-shadow">
          <p className="text-sm uppercase tracking-[0.18em] text-sky-600">
            Starting advice
          </p>
          <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
            <p>
              Have clear bylaws for contributions, loans, penalties, and exits.
            </p>
            <p>
              Choose trustworthy leadership like chairperson, treasurer, and
              secretary.
            </p>
            <p>
              Keep transparent records and agree on the group goals from the
              start.
            </p>
            <p>
              Open a proper group bank, SACCO, or mobile money structure for
              accountability.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
