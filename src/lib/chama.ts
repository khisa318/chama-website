export type ChamaRole = "admin" | "member";
export type ChamaGroupType =
  | "savings"
  | "investment"
  | "welfare"
  | "table-banking"
  | "business"
  | "sacco-like"
  | "hybrid";

export type ChamaPaymentMethod = "mpesa" | "bank" | "wallet";
export type ChamaLedgerType =
  | "join_fee"
  | "contribution"
  | "withdrawal"
  | "loan_disbursement";

export type ChamaMember = {
  id: string;
  name: string;
  role: ChamaRole;
  joinedAt: string;
  totalContributed: number;
  contributionStatus: "on-track" | "pending";
  acceptedTerms: boolean;
  joinFeePaid: boolean;
};

export type ChamaLoan = {
  id: string;
  title: string;
  amount: number;
  dueInDays: number;
  status: "available" | "active" | "closed";
};

export type ChamaMessage = {
  id: string;
  userName: string;
  userRole: ChamaRole;
  content: string;
  createdAt: string;
};

export type ChamaLedgerEntry = {
  id: string;
  type: ChamaLedgerType;
  amount: number;
  direction: "in" | "out";
  method: ChamaPaymentMethod;
  actorName: string;
  note: string;
  createdAt: string;
  status: "completed";
};

export type JoinChamaInput = {
  acceptedTerms: boolean;
  paymentMethod: ChamaPaymentMethod;
};

export type CreateChamaInput = {
  name: string;
  groupType: ChamaGroupType;
  description: string;
  monthlyContribution: number;
  meetingDay: string;
  payoutStyle: string;
  rules: string[];
  profileImage?: string;
};

export type ChamaGroup = {
  id: string;
  name: string;
  groupType: ChamaGroupType;
  description: string;
  monthlyContribution: number;
  memberCount: number;
  maxMembers: number;
  joinCode: string;
  profileImage?: string;
  meetingDay: string;
  payoutStyle: string;
  rules: string[];
  status: "open" | "active";
  role?: ChamaRole;
  createdAt: string;
  joinedAt?: string;
  totalContributed: number;
  availableLoanLimit: number;
  walletBalance: number;
  joinFee: number;
  nextContributionDate: string;
  walletTransparency: boolean;
  memberListVisibility: "public" | "members-only";
  members: ChamaMember[];
  loans: ChamaLoan[];
  messages: ChamaMessage[];
  ledger: ChamaLedgerEntry[];
};

export const CHAMA_GROUP_TYPES: {
  id: ChamaGroupType;
  label: string;
  shortLabel: string;
  description: string;
  contributionLabel: string;
  defaultContribution: number;
  defaultMeetingDay: string;
  defaultPayoutStyle: string;
  defaultDescription: string;
  rules: string[];
  guidance: string[];
}[] = [
  {
    id: "savings",
    label: "Savings Chama",
    shortLabel: "Savings",
    description:
      "Members contribute regularly and one member receives the full pool in rotation.",
    contributionLabel: "Regular contribution",
    defaultContribution: 2000,
    defaultMeetingDay: "Monthly",
    defaultPayoutStyle: "Rotating payout",
    defaultDescription:
      "A disciplined savings chama built for predictable rotation and short-term goals.",
    rules: [
      "Each member contributes the agreed amount on time every cycle.",
      "The full pooled amount is given to one member in rotation.",
      "Late contributions attract a penalty agreed by the group.",
    ],
    guidance: [
      "Best for disciplined saving and short-term goals.",
      "Works well when all members want equal turns to access the pool.",
    ],
  },
  {
    id: "investment",
    label: "Investment Chama",
    shortLabel: "Investment",
    description:
      "Members pool funds to invest in land, business, rentals, shares, or other long-term assets.",
    contributionLabel: "Investment contribution",
    defaultContribution: 5000,
    defaultMeetingDay: "Second Saturday",
    defaultPayoutStyle: "Profit share or reinvestment",
    defaultDescription:
      "An investment-focused chama built to grow wealth through shared assets and ventures.",
    rules: [
      "Members approve major investments before funds are committed.",
      "Profits are either shared or reinvested according to group agreement.",
      "All decisions and records must be transparent to every member.",
    ],
    guidance: [
      "Requires stronger governance because the financial risk is higher.",
      "Great for land buying, rentals, stock, and business expansion.",
    ],
  },
  {
    id: "welfare",
    label: "Welfare Chama",
    shortLabel: "Welfare",
    description:
      "Focused on helping members during emergencies and important life events.",
    contributionLabel: "Support contribution",
    defaultContribution: 500,
    defaultMeetingDay: "Last Sunday",
    defaultPayoutStyle: "Emergency support disbursement",
    defaultDescription:
      "A welfare chama designed for social support during emergencies, hospital bills, funerals, and family events.",
    rules: [
      "Members contribute consistently for welfare support.",
      "Funds are released only for agreed social and emergency purposes.",
      "Requests must be documented and approved by group leadership.",
    ],
    guidance: [
      "Best for support and not for profit-making.",
      "Good when members want a dependable emergency safety net.",
    ],
  },
  {
    id: "table-banking",
    label: "Table Banking Chama",
    shortLabel: "Table Banking",
    description:
      "Members save together and borrow from the pooled funds during meetings.",
    contributionLabel: "Meeting contribution",
    defaultContribution: 1000,
    defaultMeetingDay: "Every meeting day",
    defaultPayoutStyle: "Savings plus low-interest lending",
    defaultDescription:
      "A table banking chama that combines regular savings with immediate low-interest member lending.",
    rules: [
      "Members deposit funds during meetings into the common pool.",
      "Members may borrow from the pooled funds at the agreed interest rate.",
      "Interest earned is shared or reinvested by group decision.",
    ],
    guidance: [
      "Very strong for women groups and local business circles.",
      "Balances saving and borrowing in the same structure.",
    ],
  },
  {
    id: "business",
    label: "Business Chama",
    shortLabel: "Business",
    description:
      "Members contribute capital and actively run a shared business together.",
    contributionLabel: "Business capital contribution",
    defaultContribution: 3000,
    defaultMeetingDay: "Weekly operations review",
    defaultPayoutStyle: "Profit share by agreement",
    defaultDescription:
      "A business chama where members contribute capital and run a shared venture together.",
    rules: [
      "Members agree how capital is used in the business.",
      "Profits are shared according to contribution or the signed agreement.",
      "Business expenses and income must be recorded transparently.",
    ],
    guidance: [
      "Best for agribusiness, retail shops, transport, or farming ventures.",
      "Works best when members are active in operations, not only contributors.",
    ],
  },
  {
    id: "sacco-like",
    label: "SACCO-like Chama",
    shortLabel: "SACCO-like",
    description:
      "A more structured savings and credit group with stronger governance and loan access.",
    contributionLabel: "Regular savings deposit",
    defaultContribution: 2500,
    defaultMeetingDay: "First Sunday",
    defaultPayoutStyle: "Structured saving and loan access",
    defaultDescription:
      "An informal SACCO-style chama with regular savings, larger loan access, and stronger governance.",
    rules: [
      "Members save regularly according to the group bylaws.",
      "Loans follow a clear approval process and repayment schedule.",
      "Leadership committees keep records and provide accountability.",
    ],
    guidance: [
      "Best when the group wants more structure than a normal chama.",
      "Ideal for larger groups and long-term stability.",
    ],
  },
  {
    id: "hybrid",
    label: "Savings + Investment Hybrid",
    shortLabel: "Hybrid",
    description:
      "One part of the money rotates to members and another part is invested for long-term growth.",
    contributionLabel: "Combined contribution",
    defaultContribution: 2500,
    defaultMeetingDay: "First Saturday",
    defaultPayoutStyle: "Partial rotation plus group investment",
    defaultDescription:
      "A hybrid chama balancing rotating savings with long-term group investment.",
    rules: [
      "Part of each contribution rotates among members.",
      "Another agreed portion goes into the investment fund.",
      "The split between rotation and investment is reviewed openly.",
    ],
    guidance: [
      "Best when members want both liquidity and long-term growth.",
      "Requires clear records on how much goes to rotation versus investment.",
    ],
  },
];

export type ChamaState = {
  onboardingComplete: boolean;
  groups: ChamaGroup[];
};

const STORAGE_KEY = "khisa_chama_state";
const DEFAULT_JOIN_FEE = 150;

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function makeMember(
  id: string,
  name: string,
  role: ChamaRole,
  joinedAt: string,
  totalContributed: number,
  contributionStatus: "on-track" | "pending" = "on-track",
  acceptedTerms = true,
  joinFeePaid = true
): ChamaMember {
  return {
    id,
    name,
    role,
    joinedAt,
    totalContributed,
    contributionStatus,
    acceptedTerms,
    joinFeePaid,
  };
}

function makeLedgerEntry(
  type: ChamaLedgerType,
  direction: "in" | "out",
  amount: number,
  actorName: string,
  note: string,
  method: ChamaPaymentMethod,
  createdAt: string
): ChamaLedgerEntry {
  return {
    id: makeId("ledger"),
    type,
    amount,
    direction,
    method,
    actorName,
    note,
    createdAt,
    status: "completed",
  };
}

function nextMonthlyDate() {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  date.setDate(5);
  return date.toISOString();
}

function calculateWalletBalance(ledger: ChamaLedgerEntry[]) {
  return ledger.reduce(
    (sum, entry) =>
      sum + (entry.direction === "in" ? entry.amount : -entry.amount),
    0
  );
}

function calculateContributionTotal(ledger: ChamaLedgerEntry[]) {
  return ledger
    .filter(entry => entry.type === "contribution")
    .reduce((sum, entry) => sum + entry.amount, 0);
}

function calculateLoanLimit(group: ChamaGroup) {
  if (group.groupType === "welfare") {
    return Math.round(group.walletBalance * 0.4);
  }
  if (group.groupType === "table-banking" || group.groupType === "sacco-like") {
    return Math.round(group.walletBalance * 0.7);
  }
  return Math.round(group.walletBalance * 0.55);
}

function recalculateGroup(group: ChamaGroup): ChamaGroup {
  const walletBalance = calculateWalletBalance(group.ledger);
  const totalContributed = calculateContributionTotal(group.ledger);
  return {
    ...group,
    walletBalance,
    totalContributed,
    memberCount: group.members.length || group.memberCount,
    availableLoanLimit: Math.max(
      0,
      calculateLoanLimit({ ...group, walletBalance })
    ),
  };
}

const starterGroups: ChamaGroup[] = [
  {
    id: "coast-women-fund",
    name: "Coast Women Fund",
    groupType: "savings",
    description:
      "A disciplined monthly savings circle focused on school fees and emergencies.",
    monthlyContribution: 300,
    memberCount: 4,
    maxMembers: 20,
    joinCode: "CWF300",
    meetingDay: "First Saturday",
    payoutStyle: "Rotational payout",
    rules: [
      "Each member contributes KES 300 by the 5th of every month.",
      "Late contributions attract a small group-decided penalty.",
      "Emergency withdrawals require admin approval.",
    ],
    status: "open",
    createdAt: "2025-09-10T08:00:00.000Z",
    joinedAt: undefined,
    totalContributed: 0,
    availableLoanLimit: 0,
    walletBalance: 0,
    joinFee: DEFAULT_JOIN_FEE,
    nextContributionDate: "2026-05-05T08:00:00.000Z",
    walletTransparency: true,
    memberListVisibility: "members-only",
    members: [
      makeMember("m1", "Amina", "admin", "2025-09-10T08:00:00.000Z", 3600),
      makeMember("m2", "Zawadi", "member", "2025-10-01T08:00:00.000Z", 3300),
      makeMember("m3", "Mercy", "member", "2025-10-18T08:00:00.000Z", 3000),
      makeMember(
        "m4",
        "Janet",
        "member",
        "2025-11-02T08:00:00.000Z",
        2700,
        "pending"
      ),
    ],
    loans: [
      {
        id: "loan-1",
        title: "School fees support",
        amount: 5000,
        dueInDays: 18,
        status: "active",
      },
      {
        id: "loan-2",
        title: "Emergency medical fund",
        amount: 8500,
        dueInDays: 30,
        status: "available",
      },
    ],
    messages: [
      {
        id: "msg-1",
        userName: "Amina",
        userRole: "admin",
        content: "Remember contributions are due by the 5th.",
        createdAt: "2026-04-04T07:00:00.000Z",
      },
      {
        id: "msg-2",
        userName: "Zawadi",
        userRole: "member",
        content: "I have sent my contribution for this month.",
        createdAt: "2026-04-05T12:20:00.000Z",
      },
    ],
    ledger: [
      makeLedgerEntry(
        "join_fee",
        "in",
        150,
        "Amina",
        "Joining fee received",
        "mpesa",
        "2025-09-10T08:00:00.000Z"
      ),
      makeLedgerEntry(
        "join_fee",
        "in",
        150,
        "Zawadi",
        "Joining fee received",
        "mpesa",
        "2025-10-01T08:00:00.000Z"
      ),
      makeLedgerEntry(
        "contribution",
        "in",
        3000,
        "Amina",
        "Contributions received",
        "mpesa",
        "2026-03-05T08:00:00.000Z"
      ),
      makeLedgerEntry(
        "contribution",
        "in",
        2400,
        "Zawadi",
        "Contributions received",
        "mpesa",
        "2026-03-05T08:00:00.000Z"
      ),
      makeLedgerEntry(
        "withdrawal",
        "out",
        1800,
        "Amina",
        "Emergency withdrawal approved",
        "mpesa",
        "2026-04-01T08:00:00.000Z"
      ),
    ],
  },
  {
    id: "blue-harvest-circle",
    name: "Blue Harvest Circle",
    groupType: "investment",
    description: "For business owners building a shared growth and stock fund.",
    monthlyContribution: 500,
    memberCount: 3,
    maxMembers: 12,
    joinCode: "BHC500",
    meetingDay: "Second Sunday",
    payoutStyle: "Quarterly investment pool",
    rules: [
      "Each member contributes KES 500 every month.",
      "Funds prioritize inventory and growth opportunities.",
      "Members review performance every quarter.",
    ],
    status: "open",
    createdAt: "2025-11-16T08:00:00.000Z",
    joinedAt: undefined,
    totalContributed: 0,
    availableLoanLimit: 0,
    walletBalance: 0,
    joinFee: DEFAULT_JOIN_FEE,
    nextContributionDate: "2026-05-10T08:00:00.000Z",
    walletTransparency: true,
    memberListVisibility: "members-only",
    members: [
      makeMember("m5", "Kamau", "admin", "2025-11-16T08:00:00.000Z", 3000),
      makeMember("m6", "Ruth", "member", "2025-12-02T08:00:00.000Z", 2500),
      makeMember("m7", "Brian", "member", "2025-12-19T08:00:00.000Z", 2500),
    ],
    loans: [
      {
        id: "loan-3",
        title: "Stock financing",
        amount: 12000,
        dueInDays: 45,
        status: "available",
      },
    ],
    messages: [
      {
        id: "msg-3",
        userName: "Kamau",
        userRole: "admin",
        content: "We will review shop expansion ideas on Sunday.",
        createdAt: "2026-04-10T16:00:00.000Z",
      },
    ],
    ledger: [
      makeLedgerEntry(
        "join_fee",
        "in",
        150,
        "Kamau",
        "Joining fee received",
        "mpesa",
        "2025-11-16T08:00:00.000Z"
      ),
      makeLedgerEntry(
        "contribution",
        "in",
        7000,
        "Members",
        "Investment contributions received",
        "mpesa",
        "2026-03-12T08:00:00.000Z"
      ),
      makeLedgerEntry(
        "withdrawal",
        "out",
        2500,
        "Kamau",
        "Capital deployed to stock purchase",
        "bank",
        "2026-03-15T08:00:00.000Z"
      ),
    ],
  },
  {
    id: "city-family-chama",
    name: "City Family Chama",
    groupType: "welfare",
    description:
      "A close-knit family group for healthcare, rent support, and celebrations.",
    monthlyContribution: 250,
    memberCount: 3,
    maxMembers: 22,
    joinCode: "CFC250",
    meetingDay: "Last Friday",
    payoutStyle: "Emergency-first allocation",
    rules: [
      "Each member contributes KES 250 by month-end.",
      "Medical emergencies take first priority.",
      "Large requests are reviewed by all senior members.",
    ],
    status: "active",
    createdAt: "2025-06-01T08:00:00.000Z",
    joinedAt: undefined,
    totalContributed: 0,
    availableLoanLimit: 0,
    walletBalance: 0,
    joinFee: DEFAULT_JOIN_FEE,
    nextContributionDate: "2026-04-30T08:00:00.000Z",
    walletTransparency: true,
    memberListVisibility: "members-only",
    members: [
      makeMember("m8", "Esther", "admin", "2025-06-01T08:00:00.000Z", 5000),
      makeMember("m9", "Naomi", "member", "2025-06-15T08:00:00.000Z", 4250),
      makeMember("m10", "Peter", "member", "2025-07-01T08:00:00.000Z", 4000),
    ],
    loans: [
      {
        id: "loan-4",
        title: "Rent support",
        amount: 3000,
        dueInDays: 12,
        status: "active",
      },
      {
        id: "loan-5",
        title: "Emergency support",
        amount: 6200,
        dueInDays: 21,
        status: "available",
      },
    ],
    messages: [
      {
        id: "msg-4",
        userName: "Esther",
        userRole: "admin",
        content: "Family meeting is this Friday evening.",
        createdAt: "2026-04-12T10:30:00.000Z",
      },
    ],
    ledger: [
      makeLedgerEntry(
        "join_fee",
        "in",
        150,
        "Esther",
        "Joining fee received",
        "mpesa",
        "2025-06-01T08:00:00.000Z"
      ),
      makeLedgerEntry(
        "contribution",
        "in",
        5400,
        "Members",
        "Welfare contributions received",
        "mpesa",
        "2026-03-30T08:00:00.000Z"
      ),
      makeLedgerEntry(
        "withdrawal",
        "out",
        2000,
        "Esther",
        "Hospital bill support approved",
        "mpesa",
        "2026-04-02T08:00:00.000Z"
      ),
    ],
  },
].map(recalculateGroup);

function canUseStorage() {
  return typeof window !== "undefined";
}

function cloneStarterGroups() {
  return starterGroups.map(group => ({
    ...group,
    rules: [...group.rules],
    members: group.members.map(member => ({ ...member })),
    loans: group.loans.map(loan => ({ ...loan })),
    messages: group.messages.map(message => ({ ...message })),
    ledger: group.ledger.map(entry => ({ ...entry })),
  }));
}

function normalizeGroup(group: ChamaGroup): ChamaGroup {
  return recalculateGroup({
    ...group,
    groupType: group.groupType || "savings",
    joinFee: Number(group.joinFee || DEFAULT_JOIN_FEE),
    nextContributionDate: group.nextContributionDate || nextMonthlyDate(),
    walletTransparency: group.walletTransparency ?? true,
    memberListVisibility: group.memberListVisibility || "members-only",
    members: (group.members ?? []).map(member => ({
      contributionStatus: "on-track",
      acceptedTerms: true,
      joinFeePaid: true,
      ...member,
      totalContributed: Number(member.totalContributed || 0),
      joinedAt: member.joinedAt || group.createdAt,
    })),
    loans: (group.loans ?? []).map(loan => ({
      ...loan,
      amount: Number(loan.amount || 0),
      dueInDays: Number(loan.dueInDays || 0),
    })),
    messages: group.messages ?? [],
    ledger: (group.ledger ?? []).map(entry => ({
      status: "completed",
      ...entry,
      amount: Number(entry.amount || 0),
    })),
  });
}

function defaultState(): ChamaState {
  return { onboardingComplete: false, groups: cloneStarterGroups() };
}

export function getChamaState(): ChamaState {
  if (!canUseStorage()) {
    return defaultState();
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seeded = defaultState();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }

  try {
    const parsed = JSON.parse(raw) as ChamaState;
    return {
      onboardingComplete: parsed.onboardingComplete ?? false,
      groups: (parsed.groups ?? []).map(normalizeGroup),
    };
  } catch {
    const reset = defaultState();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(reset));
    return reset;
  }
}

export function saveChamaState(state: ChamaState) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function completeOnboarding() {
  const state = getChamaState();
  saveChamaState({ ...state, onboardingComplete: true });
}

export function createChamaGroup(input: CreateChamaInput, actorName = "You") {
  const state = getChamaState();
  const createdAt = new Date().toISOString();
  const joinCode =
    input.name
      .replace(/[^A-Za-z0-9]/g, "")
      .slice(0, 4)
      .toUpperCase()
      .padEnd(4, "X") + Math.floor(100 + Math.random() * 900).toString();

  const group = recalculateGroup({
    id: `${input.name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
    name: input.name,
    groupType: input.groupType,
    description: input.description,
    monthlyContribution: input.monthlyContribution,
    memberCount: 1,
    maxMembers: 30,
    joinCode,
    meetingDay: input.meetingDay,
    payoutStyle: input.payoutStyle,
    profileImage: input.profileImage,
    rules: input.rules,
    status: "active",
    role: "admin",
    createdAt,
    joinedAt: createdAt,
    totalContributed: 0,
    availableLoanLimit: 0,
    walletBalance: 0,
    joinFee: DEFAULT_JOIN_FEE,
    nextContributionDate: nextMonthlyDate(),
    walletTransparency: true,
    memberListVisibility: "members-only",
    members: [makeMember(makeId("member"), actorName, "admin", createdAt, 0)],
    loans: [
      {
        id: makeId("loan"),
        title: "Starter group loan window",
        amount: input.monthlyContribution * 4,
        dueInDays: 30,
        status: "available",
      },
    ],
    messages: [
      {
        id: makeId("msg"),
        userName: actorName,
        userRole: "admin",
        content: `Welcome to ${input.name}. The chama wallet and ledger are now active.`,
        createdAt,
      },
    ],
    ledger: [],
  });

  saveChamaState({
    onboardingComplete: true,
    groups: [group, ...state.groups],
  });

  return group;
}

export function joinChamaGroup(
  groupId: string,
  actorName = "You",
  input: JoinChamaInput
) {
  const state = getChamaState();
  const joinedAt = new Date().toISOString();
  const groups = state.groups.map(group => {
    if (group.id !== groupId || group.role) {
      return group;
    }

    const member = makeMember(
      makeId("member"),
      actorName,
      "member",
      joinedAt,
      0,
      "pending",
      input.acceptedTerms,
      true
    );
    const ledger = [
      ...group.ledger,
      makeLedgerEntry(
        "join_fee",
        "in",
        group.joinFee,
        actorName,
        "KSh 150 joining fee paid",
        input.paymentMethod,
        joinedAt
      ),
    ];

    return recalculateGroup({
      ...group,
      role: "member",
      joinedAt,
      members: [member, ...group.members],
      messages: [
        ...group.messages,
        {
          id: makeId("msg"),
          userName: actorName,
          userRole: "member",
          content: `${actorName} joined the chama after accepting the terms and paying the joining fee.`,
          createdAt: joinedAt,
        },
      ],
      ledger,
    });
  });

  saveChamaState({ onboardingComplete: true, groups });
}

export function recordChamaContribution(
  groupId: string,
  actorName = "You",
  amount: number,
  method: ChamaPaymentMethod
) {
  const state = getChamaState();
  const createdAt = new Date().toISOString();

  const groups = state.groups.map(group => {
    if (group.id !== groupId || !group.role) {
      return group;
    }

    const members = group.members.map(member =>
      member.name === actorName
        ? {
            ...member,
            totalContributed: member.totalContributed + amount,
            contributionStatus: "on-track",
          }
        : member
    );

    return recalculateGroup({
      ...group,
      members,
      nextContributionDate: nextMonthlyDate(),
      ledger: [
        ...group.ledger,
        makeLedgerEntry(
          "contribution",
          "in",
          amount,
          actorName,
          "Member contribution received",
          method,
          createdAt
        ),
      ],
    });
  });

  saveChamaState({ ...state, groups });
}

export function requestChamaWithdrawal(
  groupId: string,
  actorName = "You",
  amount: number,
  method: ChamaPaymentMethod,
  note: string
) {
  const state = getChamaState();
  const createdAt = new Date().toISOString();

  const groups = state.groups.map(group => {
    if (
      group.id !== groupId ||
      group.role !== "admin" ||
      group.walletBalance < amount
    ) {
      return group;
    }

    return recalculateGroup({
      ...group,
      ledger: [
        ...group.ledger,
        makeLedgerEntry(
          "withdrawal",
          "out",
          amount,
          actorName,
          note,
          method,
          createdAt
        ),
      ],
      messages: [
        ...group.messages,
        {
          id: makeId("msg"),
          userName: actorName,
          userRole: "admin",
          content: `Withdrawal of KES ${amount.toLocaleString()} was approved and sent to the selected payout channel.`,
          createdAt,
        },
      ],
    });
  });

  saveChamaState({ ...state, groups });
}

export function updateChamaGroup(
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
) {
  const state = getChamaState();
  const groups = state.groups.map(group =>
    group.id === groupId
      ? recalculateGroup({
          ...group,
          ...input,
          monthlyContribution:
            input.monthlyContribution ?? group.monthlyContribution,
          rules: input.rules ?? group.rules,
        })
      : group
  );

  saveChamaState({ ...state, groups });
}

export function addChamaMessage(
  groupId: string,
  content: string,
  actorName = "You",
  actorRole: ChamaRole = "member"
) {
  const state = getChamaState();
  const createdAt = new Date().toISOString();
  const groups = state.groups.map(group =>
    group.id === groupId
      ? {
          ...group,
          messages: [
            ...group.messages,
            {
              id: makeId("msg"),
              userName: actorName,
              userRole: actorRole,
              content,
              createdAt,
            },
          ],
        }
      : group
  );

  saveChamaState({ ...state, groups });
}

export function findChamaByCode(code: string) {
  const state = getChamaState();
  return (
    state.groups.find(
      group => group.joinCode.toLowerCase() === code.toLowerCase()
    ) ?? null
  );
}

export function getChamaById(groupId: string) {
  const state = getChamaState();
  return state.groups.find(group => group.id === groupId) ?? null;
}
