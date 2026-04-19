import { authRouter } from "./auth-router";
import { createRouter, publicQuery } from "./middleware";
import { groupRouter } from "./routers/group-router";
import { contributionRouter } from "./routers/contribution-router";
import { transactionRouter } from "./routers/transaction-router";
import { loanRouter } from "./routers/loan-router";
import { expenseRouter } from "./routers/expense-router";
import { notificationRouter } from "./routers/notification-router";
import { messageRouter } from "./routers/message-router";
import { contactRouter } from "./routers/contact-router";
import { reportRouter } from "./routers/report-router";
import { adminRouter } from "./routers/admin-router";
import { chatRouter } from "./routers/chat-router";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  group: groupRouter,
  contribution: contributionRouter,
  transaction: transactionRouter,
  loan: loanRouter,
  expense: expenseRouter,
  notification: notificationRouter,
  message: messageRouter,
  contact: contactRouter,
  report: reportRouter,
  admin: adminRouter,
  chat: chatRouter,
});

export type AppRouter = typeof appRouter;
