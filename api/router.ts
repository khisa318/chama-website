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
import { welfareRouter } from "./routers/welfare-router";
import { rotationRouter } from "./routers/rotation-router";
import { eventRouter } from "./routers/event-router";
import { investmentRouter } from "./routers/investment-router";
import { auditRouter } from "./routers/audit-router";
import { billRouter } from "./routers/bill-router";
import { permissionRouter } from "./routers/permission-router";
import { preferenceRouter } from "./routers/preference-router";
import { mpesaRouter } from "./routers/mpesa-router";
import { userRouter } from "./routers/user-router";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  user: userRouter,
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
  welfare: welfareRouter,
  rotation: rotationRouter,
  event: eventRouter,
  investment: investmentRouter,
  audit: auditRouter,
  bill: billRouter,
  permission: permissionRouter,
  preference: preferenceRouter,
  mpesa: mpesaRouter,
});

export type AppRouter = typeof appRouter;

