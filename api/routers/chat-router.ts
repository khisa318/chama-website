import { z } from "zod";
import { createRouter, authedQuery } from "../middleware";

// Simple rule-based AI chat responses
// This can be replaced with a real AI API call
const knowledgeBase: Record<string, string> = {
  greeting:
    "Hello! I'm Khisa, your Kitty savings assistant. How can I help you today?",
  create_group:
    'To create a new savings group, go to the Groups tab and tap "Create Group". You\'ll need to provide a group name, description, and monthly contribution amount. As the creator, you\'ll automatically be the group admin.',
  contribution:
    'To make a contribution, tap "Add Contribution" on the dashboard or go to the Contributions tab. Select your group, enter the amount, choose your payment method, and submit. Your group balance will update automatically.',
  loan:
    'To request a loan, go to the Loans tab and tap "Request Loan". Enter the amount, purpose, and repayment period. Your group admin or treasurer will review and approve it. Interest rates are typically 5-10% depending on your group rules.',
  expense:
    'To record a group expense, go to the Expenses tab and tap "Record Expense". Enter the description, amount, and category (Food, Events, Emergency, Business, etc.). The expense will be deducted from your group balance.',
  invite:
    'To invite someone to your group, go to the Group Detail page, Members tab, and tap "Invite Member". Enter their email or phone number and select their role (Member, Treasurer, or Admin).',
  role:
    "There are three roles in a group: **Admin** - full control over the group, can approve loans and manage members; **Treasurer** - can manage funds, record contributions and expenses; **Member** - can contribute, view balances, and request loans.",
  status:
    "Contribution statuses are: **Paid** - contribution received on time; **Pending** - contribution not yet received; **Late** - contribution overdue. You can check your status in the Contributions tab.",
  security:
    "Your financial data is secured with bank-level encryption. We use JWT tokens for authentication and never store your payment details. You can enable PIN protection in Settings > Security.",
  default:
    "I'm not sure I understand. You can ask me about: creating groups, making contributions, requesting loans, recording expenses, inviting members, understanding roles, or security. How can I help?",
};

function getResponse(message: string): string {
  const lower = message.toLowerCase();

  if (lower.match(/^(hi|hello|hey|greetings)/)) {
    return knowledgeBase.greeting;
  }
  if (lower.includes("create") && lower.includes("group")) {
    return knowledgeBase.create_group;
  }
  if (lower.includes("contribution") || lower.includes("contribute") || lower.includes("pay") || lower.includes("deposit")) {
    return knowledgeBase.contribution;
  }
  if (lower.includes("loan") || lower.includes("borrow") || lower.includes("credit")) {
    return knowledgeBase.loan;
  }
  if (lower.includes("expense") || lower.includes("spend") || lower.includes("cost")) {
    return knowledgeBase.expense;
  }
  if (lower.includes("invite") || lower.includes("add member") || lower.includes("join")) {
    return knowledgeBase.invite;
  }
  if (lower.includes("role") || lower.includes("admin") || lower.includes("treasurer")) {
    return knowledgeBase.role;
  }
  if (lower.includes("status") || lower.includes("pending") || lower.includes("paid")) {
    return knowledgeBase.status;
  }
  if (lower.includes("security") || lower.includes("safe") || lower.includes("protect")) {
    return knowledgeBase.security;
  }
  if (lower.includes("thank")) {
    return "You're welcome! Feel free to ask if you need anything else. Happy saving!";
  }
  if (lower.includes("help")) {
    return "I can help you with: creating groups, making contributions, requesting loans, recording expenses, inviting members, understanding roles, or security questions. What would you like to know?";
  }

  return knowledgeBase.default;
}

export const chatRouter = createRouter({
  sendMessage: authedQuery
    .input(z.object({ message: z.string().min(1).max(1000) }))
    .mutation(async ({ input }) => {
      const reply = getResponse(input.message);
      return { reply };
    }),
});
