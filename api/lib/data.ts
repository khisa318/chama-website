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
    id: row.id as string,
    name: (row.name as string) ?? "",
    description: (row.description as string | null) ?? "",
    type: (row.type as string) ?? "savings",
    inviteCode: (row.invite_code as string | null) ?? null,
    contributionAmount: Number(row.contribution_amount ?? 0),
    contributionFrequency: (row.contribution_frequency as string) ?? "monthly",
    contributionDay: row.contribution_day as number | null,
    loanInterestRate: Number(row.loan_interest_rate ?? 0),
    maxLoanMultiplier: Number(row.max_loan_multiplier ?? 3),
    loanRepaymentMonths: row.loan_repayment_months as number ?? 12,
    createdAt: row.created_at as string,
    createdBy: row.created_by as string | null,
  };
}

export function mapGroupMember(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    groupId: row.group_id as string,
    userId: row.user_id as string | null,
    role: row.role as string,
    status: (row.status as string) ?? "active",
    joinedAt: row.joined_at as string,
    // Joined profile data if available
    fullName: (row.full_name as string | null) ?? null,
    email: (row.email as string | null) ?? null,
    avatarUrl: (row.avatar_url as string | null) ?? null,
    phone: (row.phone as string | null) ?? null,
  };
}

export function mapContribution(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    groupId: row.group_id as string,
    userId: row.user_id as string,
    amount: Number(row.amount ?? 0),
    monthYear: row.month_year as string,
    paymentMethod: row.payment_method as string,
    mpesaCode: (row.mpesa_code as string | null) ?? null,
    status: row.status as string,
    recordedBy: (row.recorded_by as string | null) ?? null,
    paidAt: (row.paid_at as string | null) ?? null,
    createdAt: row.created_at as string,
  };
}

export function mapLoan(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    groupId: row.group_id as string,
    borrowerId: row.borrower_id as string,
    amount: Number(row.amount ?? 0),
    interestRate: Number(row.interest_rate ?? 0),
    repaymentMonths: row.repayment_months as number,
    purpose: (row.purpose as string | null) ?? null,
    status: row.status as string,
    disbursedAt: (row.disbursed_at as string | null) ?? null,
    approvedBy: (row.approved_by as string | null) ?? null,
    createdAt: row.created_at as string,
  };
}

export function mapLoanRepayment(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    loanId: row.loan_id as string,
    monthNumber: row.month_number as number,
    dueDate: row.due_date as string,
    principal: Number(row.principal ?? 0),
    interest: Number(row.interest ?? 0),
    totalDue: Number(row.total_due ?? 0),
    amountPaid: Number(row.amount_paid ?? 0),
    mpesaCode: (row.mpesa_code as string | null) ?? null,
    status: row.status as string,
    paidAt: (row.paid_at as string | null) ?? null,
  };
}

export function mapInvestment(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    groupId: row.group_id as string,
    name: row.name as string,
    type: row.type as string,
    institution: (row.institution as string | null) ?? null,
    amountInvested: Number(row.amount_invested ?? 0),
    currentValue: Number(row.current_value ?? 0),
    purchaseDate: (row.purchase_date as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    createdBy: (row.created_by as string | null) ?? null,
    createdAt: row.created_at as string,
  };
}

export function mapWelfareClaim(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    groupId: row.group_id as string,
    claimantId: row.claimant_id as string,
    type: row.type as string,
    amountRequested: Number(row.amount_requested ?? 0),
    amountApproved: Number(row.amount_approved ?? 0),
    status: row.status as string,
    description: (row.description as string | null) ?? null,
    documentUrl: (row.document_url as string | null) ?? null,
    reviewedBy: (row.reviewed_by as string | null) ?? null,
    createdAt: row.created_at as string,
  };
}

export function mapPost(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    groupId: row.group_id as string,
    authorId: row.author_id as string,
    type: row.type as string,
    title: row.title as string,
    content: (row.content as string | null) ?? null,
    createdAt: row.created_at as string,
    // Joined profile data
    authorName: (row.author_name as string | null) ?? null,
    authorAvatar: (row.author_avatar as string | null) ?? null,
  };
}

export function mapNotification(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    type: row.type as string,
    title: row.title as string,
    message: (row.message as string | null) ?? null,
    data: (row.data as Record<string, unknown> | null) ?? null,
    read: Boolean(row.read),
    createdAt: row.created_at as string,
  };
}

export function mapAuditLog(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    groupId: row.group_id as string,
    actorId: (row.actor_id as string | null) ?? null,
    action: row.action as string,
    targetType: (row.target_type as string | null) ?? null,
    targetId: (row.target_id as string | null) ?? null,
    details: (row.details as Record<string, unknown> | null) ?? null,
    createdAt: row.created_at as string,
  };
}

export function mapUser(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    fullName: row.full_name as string,
    email: row.email as string,
    phone: (row.phone as string | null) ?? null,
    avatarUrl: (row.avatar_url as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export interface MpesaTransaction {
  id: string;
  mpesaCode: string;
  amount: number;
  phoneNumber: string;
  fullName: string | null;
  transactionType: string;
  status: "pending" | "matched" | "failed";
  metadata: any;
  createdAt: string;
}

export function mapMpesaTransaction(row: any): MpesaTransaction {
  return {
    id: row.id,
    mpesaCode: row.mpesa_code,
    amount: Number(row.amount),
    phoneNumber: row.phone_number,
    fullName: row.full_name,
    transactionType: row.transaction_type,
    status: row.status,
    metadata: row.metadata,
    createdAt: row.created_at,
  };
}

