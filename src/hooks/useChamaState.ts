import { useEffect, useMemo, useState } from "react";
import {
  addChamaMessage,
  CHAMA_GROUP_TYPES,
  completeOnboarding,
  createChamaGroup,
  findChamaByCode,
  getChamaById,
  getChamaState,
  joinChamaGroup,
  recordChamaContribution,
  requestChamaWithdrawal,
  updateChamaGroup,
  type ChamaGroup,
  type ChamaLedgerEntry,
  type ChamaMessage,
  type ChamaPaymentMethod,
} from "@/lib/chama";
import { useAuth } from "@/hooks/useAuth";

export function useChamaState() {
  const [version, setVersion] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    const onFocus = () => setVersion(current => current + 1);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const state = useMemo(() => getChamaState(), [version]);
  const actorName = user?.name || "You";

  return {
    onboardingComplete: state.onboardingComplete,
    groups: state.groups,
    adminGroups: state.groups.filter(group => group.role === "admin"),
    memberGroups: state.groups.filter(
      group => group.role === "admin" || group.role === "member"
    ),
    refresh: () => setVersion(current => current + 1),
    getGroupById: (groupId: string) => getChamaById(groupId),
    completeOnboarding: () => {
      completeOnboarding();
      setVersion(current => current + 1);
    },
    createGroup: (input: {
      name: string;
      groupType: ChamaGroup["groupType"];
      description: string;
      monthlyContribution: number;
      meetingDay: string;
      payoutStyle: string;
      rules: string[];
      profileImage?: string;
    }) => {
      const group = createChamaGroup(input, actorName);
      setVersion(current => current + 1);
      return group;
    },
    joinGroup: (
      groupId: string,
      input: { acceptedTerms: boolean; paymentMethod: ChamaPaymentMethod }
    ) => {
      joinChamaGroup(groupId, actorName, input);
      setVersion(current => current + 1);
    },
    contributeToGroup: (
      groupId: string,
      amount: number,
      method: ChamaPaymentMethod
    ) => {
      recordChamaContribution(groupId, actorName, amount, method);
      setVersion(current => current + 1);
    },
    withdrawFromGroup: (
      groupId: string,
      amount: number,
      method: ChamaPaymentMethod,
      note: string
    ) => {
      requestChamaWithdrawal(groupId, actorName, amount, method, note);
      setVersion(current => current + 1);
    },
    updateGroup: (
      groupId: string,
      input: Partial<
        Pick<
          ChamaGroup,
          | "description"
          | "meetingDay"
          | "monthlyContribution"
          | "payoutStyle"
          | "rules"
          | "profileImage"
        >
      >
    ) => {
      updateChamaGroup(groupId, input);
      setVersion(current => current + 1);
    },
    sendMessage: (
      groupId: string,
      content: string,
      role: "admin" | "member"
    ) => {
      addChamaMessage(groupId, content, actorName, role);
      setVersion(current => current + 1);
    },
    groupTypes: CHAMA_GROUP_TYPES,
    findByCode: (code: string) => findChamaByCode(code),
  };
}

export type { ChamaGroup, ChamaLedgerEntry, ChamaMessage, ChamaPaymentMethod };
