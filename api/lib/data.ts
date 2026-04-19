import { TRPCError } from "@trpc/server";

type SupabaseResponse<T> = {
  data: T | null;
  error: { message: string } | null;
};

export function unwrap<T>(result: SupabaseResponse<T>, message?: string): T {
  if (result.error || result.data == null) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: result.error?.message || message || "Database request failed",
    });
  }

  return result.data as NonNullable<T>;
}

export function unwrapList<T>(result: SupabaseResponse<T[]>) {
  if (result.error) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: result.error.message,
    });
  }

  return result.data ?? [];
}

export function mapGroup(row: Record<string, unknown>) {
  return {
    id: row.id as number,
    name: (row.name as string) ?? "",
    description: (row.description as string | null) ?? "",
    balance: Number(row.balance ?? 0),
    monthlyContribution: Number(row.monthly_contribution ?? 0),
    createdAt: row.created_at as string,
    createdBy: row.created_by as string | null,
  };
}

export function mapGroupMember(row: Record<string, unknown>) {
  return {
    id: row.id as number,
    groupId: row.group_id as number,
    userId: row.user_id as string | null,
    role: row.role as string,
    contributionStatus: row.contribution_status as string,
    totalContributed: Number(row.total_contributed ?? 0),
    joinedAt: row.joined_at as string,
    fullName: (row.full_name as string | null) ?? null,
    email: (row.email as string | null) ?? null,
    avatarUrl: (row.avatar_url as string | null) ?? null,
  };
}

export function mapContribution(row: Record<string, unknown>) {
  return {
    id: row.id as number,
    groupId: row.group_id as number,
    memberId: row.member_id as number,
    amount: Number(row.amount ?? 0),
    date: row.date as string,
    paymentMethod: row.payment_method as string,
    notes: (row.notes as string | null) ?? null,
    status: row.status as string,
    createdAt: row.created_at as string,
  };
}

export function mapExpense(row: Record<string, unknown>) {
  return {
    id: row.id as number,
    groupId: row.group_id as number,
    description: row.description as string,
    amount: Number(row.amount ?? 0),
    category: row.category as string,
    date: row.date as string,
    receiptUrl: (row.receipt_url as string | null) ?? null,
    createdBy: (row.created_by as string | null) ?? null,
    createdAt: row.created_at as string,
  };
}

export function mapLoan(row: Record<string, unknown>) {
  return {
    id: row.id as number,
    groupId: row.group_id as number,
    requesterId: row.requester_id as number,
    amount: Number(row.amount ?? 0),
    purpose: (row.purpose as string | null) ?? null,
    repaymentPeriod: row.repayment_period as number,
    interestRate: Number(row.interest_rate ?? 0),
    status: row.status as string,
    remainingBalance: Number(row.remaining_balance ?? 0),
    nextPaymentDate: (row.next_payment_date as string | null) ?? null,
    approvedBy: (row.approved_by as string | null) ?? null,
    approvedAt: (row.approved_at as string | null) ?? null,
    createdAt: row.created_at as string,
  };
}

export function mapTransaction(row: Record<string, unknown>) {
  return {
    id: row.id as number,
    groupId: row.group_id as number,
    type: row.type as string,
    amount: Number(row.amount ?? 0),
    description: (row.description as string | null) ?? null,
    category: (row.category as string | null) ?? null,
    date: row.date as string,
    status: row.status as string,
    createdBy: (row.created_by as string | null) ?? null,
    createdAt: row.created_at as string,
  };
}

export function mapNotification(row: Record<string, unknown>) {
  return {
    id: row.id as number,
    userId: row.user_id as string | null,
    groupId: (row.group_id as number | null) ?? null,
    type: row.type as string,
    title: row.title as string,
    message: (row.message as string | null) ?? null,
    read: Boolean(row.read),
    createdAt: row.created_at as string,
  };
}

export function mapMessage(row: Record<string, unknown>) {
  return {
    id: row.id as number,
    userId: row.user_id as string | null,
    userName: row.user_name as string,
    userAvatar: (row.user_avatar as string | null) ?? null,
    content: row.content as string,
    likes: row.likes as number,
    createdAt: row.created_at as string,
  };
}

export function mapContact(row: Record<string, unknown>) {
  return {
    id: row.id as number,
    name: row.name as string,
    email: row.email as string,
    subject: row.subject as string,
    message: row.message as string,
    status: row.status as string,
    createdAt: row.created_at as string,
  };
}
