import { mysqlTable, bigint, varchar, text, decimal, date, timestamp, int, boolean, uniqueIndex } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

export const users = mysqlTable('users', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  unionId: varchar('union_id', { length: 255 }).unique(),
  name: varchar('name', { length: 255 }),
  email: varchar('email', { length: 255 }),
  avatar: text('avatar'),
  role: varchar('role', { length: 50 }).default('user'),
  createdAt: timestamp('created_at').defaultNow(),
  lastSignInAt: timestamp('last_sign_in_at'),
});

export const groups = mysqlTable('groups', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  balance: decimal('balance', { precision: 12, scale: 2 }).default('0'),
  monthlyContribution: decimal('monthly_contribution', { precision: 10, scale: 2 }).default('0'),
  createdBy: bigint('created_by', { mode: 'number' }).references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow(),
});

export const groupMembers = mysqlTable('group_members', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  groupId: bigint('group_id', { mode: 'number' }).notNull().references(() => groups.id, { onDelete: 'cascade' }),
  userId: bigint('user_id', { mode: 'number' }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 50 }).default('member'),
  contributionStatus: varchar('contribution_status', { length: 50 }).default('pending'),
  totalContributed: decimal('total_contributed', { precision: 12, scale: 2 }).default('0'),
  joinedAt: timestamp('joined_at').defaultNow(),
}, (table) => ({
  uniqueGroupUser: uniqueIndex('unique_group_user').on(table.groupId, table.userId),
}));

export const contributions = mysqlTable('contributions', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  groupId: bigint('group_id', { mode: 'number' }).notNull().references(() => groups.id, { onDelete: 'cascade' }),
  memberId: bigint('member_id', { mode: 'number' }).notNull().references(() => groupMembers.id, { onDelete: 'cascade' }),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  date: timestamp('date').notNull(),
  paymentMethod: varchar('payment_method', { length: 50 }).default('cash'),
  notes: text('notes'),
  status: varchar('status', { length: 50 }).default('completed'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const transactions = mysqlTable('transactions', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  groupId: bigint('group_id', { mode: 'number' }).notNull().references(() => groups.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }).notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 255 }),
  date: timestamp('date').notNull(),
  status: varchar('status', { length: 50 }).default('completed'),
  createdBy: bigint('created_by', { mode: 'number' }).references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow(),
});

export const loans = mysqlTable('loans', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  groupId: bigint('group_id', { mode: 'number' }).notNull().references(() => groups.id, { onDelete: 'cascade' }),
  requesterId: bigint('requester_id', { mode: 'number' }).notNull().references(() => groupMembers.id, { onDelete: 'cascade' }),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  purpose: text('purpose'),
  repaymentPeriod: int('repayment_period').default(6),
  interestRate: decimal('interest_rate', { precision: 5, scale: 2 }).default('5'),
  status: varchar('status', { length: 50 }).default('pending'),
  remainingBalance: decimal('remaining_balance', { precision: 10, scale: 2 }),
  nextPaymentDate: timestamp('next_payment_date'),
  approvedBy: bigint('approved_by', { mode: 'number' }).references(() => users.id, { onDelete: 'set null' }),
  approvedAt: timestamp('approved_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const expenses = mysqlTable('expenses', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  groupId: bigint('group_id', { mode: 'number' }).notNull().references(() => groups.id, { onDelete: 'cascade' }),
  description: text('description').notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  category: varchar('category', { length: 50 }).default('other'),
  date: timestamp('date').notNull(),
  receiptUrl: text('receipt_url'),
  createdBy: bigint('created_by', { mode: 'number' }).references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow(),
});

export const notifications = mysqlTable('notifications', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  userId: bigint('user_id', { mode: 'number' }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  groupId: bigint('group_id', { mode: 'number' }).references(() => groups.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message'),
  read: boolean('read').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const messages = mysqlTable('messages', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  userId: bigint('user_id', { mode: 'number' }).references(() => users.id, { onDelete: 'cascade' }),
  userName: varchar('user_name', { length: 255 }).notNull(),
  userAvatar: text('user_avatar'),
  content: text('content').notNull(),
  likes: int('likes').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

export const contacts = mysqlTable('contacts', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  subject: varchar('subject', { length: 255 }).notNull(),
  message: text('message').notNull(),
  status: varchar('status', { length: 50 }).default('new'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const groupMessages = mysqlTable('group_messages', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  groupId: bigint('group_id', { mode: 'number' }).notNull().references(() => groups.id, { onDelete: 'cascade' }),
  userId: bigint('user_id', { mode: 'number' }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  userName: varchar('user_name', { length: 255 }).notNull(),
  userAvatar: text('user_avatar'),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  groups: many(groups),
  groupMembers: many(groupMembers),
  contributions: many(contributions),
  transactions: many(transactions),
  loans: many(loans),
  expenses: many(expenses),
  notifications: many(notifications),
  messages: many(messages),
  groupMessages: many(groupMessages),
  welfareClaims: many(welfareClaims),
  auditLogs: many(auditLogs),
  userPreferences: many(userPreferences),
}));

export const groupsRelations = relations(groups, ({ one, many }) => ({
  createdBy: one(users, { fields: [groups.createdBy], references: [users.id] }),
  members: many(groupMembers),
  contributions: many(contributions),
  transactions: many(transactions),
  loans: many(loans),
  expenses: many(expenses),
  notifications: many(notifications),
  groupMessages: many(groupMessages),
  welfareClaims: many(welfareClaims),
  rotations: many(rotations),
  events: many(events),
  investments: many(investments),
  auditLogs: many(auditLogs),
  rolePermissions: many(rolePermissions),
  bills: many(bills),
  mpesaTransactions: many(mpesaTransactions),
}));

export const groupMembersRelations = relations(groupMembers, ({ one, many }) => ({
  group: one(groups, { fields: [groupMembers.groupId], references: [groups.id] }),
  user: one(users, { fields: [groupMembers.userId], references: [users.id] }),
  contributions: many(contributions),
  loans: many(loans),
}));

export const contributionsRelations = relations(contributions, ({ one }) => ({
  group: one(groups, { fields: [contributions.groupId], references: [groups.id] }),
  member: one(groupMembers, { fields: [contributions.memberId], references: [groupMembers.id] }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  group: one(groups, { fields: [transactions.groupId], references: [groups.id] }),
  createdBy: one(users, { fields: [transactions.createdBy], references: [users.id] }),
}));

export const loansRelations = relations(loans, ({ one }) => ({
  group: one(groups, { fields: [loans.groupId], references: [groups.id] }),
  requester: one(groupMembers, { fields: [loans.requesterId], references: [groupMembers.id] }),
  approvedBy: one(users, { fields: [loans.approvedBy], references: [users.id] }),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  group: one(groups, { fields: [expenses.groupId], references: [groups.id] }),
  createdBy: one(users, { fields: [expenses.createdBy], references: [users.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
  group: one(groups, { fields: [notifications.groupId], references: [groups.id] }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  user: one(users, { fields: [messages.userId], references: [users.id] }),
}));

export const contactsRelations = relations(contacts, ({}) => ({}));

export const groupMessagesRelations = relations(groupMessages, ({ one }) => ({
  group: one(groups, { fields: [groupMessages.groupId], references: [groupMessages.id] }),
  user: one(users, { fields: [groupMessages.userId], references: [users.id] }),
}));

// NEW TABLES FOR ENHANCED FEATURES

// Welfare Claims System
export const welfareClaims = mysqlTable('welfare_claims', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  groupId: bigint('group_id', { mode: 'number' }).notNull().references(() => groups.id, { onDelete: 'cascade' }),
  memberId: bigint('member_id', { mode: 'number' }).notNull().references(() => groupMembers.id, { onDelete: 'cascade' }),
  claimType: varchar('claim_type', { length: 50 }).notNull(), // 'medical', 'burial', 'graduation', 'emergency', 'other'
  description: text('description').notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  status: varchar('status', { length: 50 }).default('pending'), // 'pending', 'approved', 'rejected', 'paid'
  documentUrl: text('document_url'), // receipt/proof upload
  approvedBy: bigint('approved_by', { mode: 'number' }).references(() => users.id, { onDelete: 'set null' }),
  approvedAt: timestamp('approved_at'),
  rejectionReason: text('rejection_reason'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').onUpdateNow(),
});

// Merry-Go-Round Rotations
export const rotations = mysqlTable('rotations', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  groupId: bigint('group_id', { mode: 'number' }).notNull().references(() => groups.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  rotationAmount: decimal('rotation_amount', { precision: 10, scale: 2 }).notNull(),
  frequency: varchar('frequency', { length: 50 }).notNull(), // 'weekly', 'biweekly', 'monthly'
  startDate: timestamp('start_date').notNull(),
  status: varchar('status', { length: 50 }).default('active'), // 'active', 'completed', 'paused'
  createdBy: bigint('created_by', { mode: 'number' }).references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow(),
});

// Rotation Schedule (tracks who gets paid when)
export const rotationSchedule = mysqlTable('rotation_schedule', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  rotationId: bigint('rotation_id', { mode: 'number' }).notNull().references(() => rotations.id, { onDelete: 'cascade' }),
  memberId: bigint('member_id', { mode: 'number' }).notNull().references(() => groupMembers.id, { onDelete: 'cascade' }),
  sequenceNumber: int('sequence_number').notNull(),
  payoutDate: timestamp('payout_date'),
  payoutAmount: decimal('payout_amount', { precision: 10, scale: 2 }),
  status: varchar('status', { length: 50 }).default('pending'), // 'pending', 'completed'
  createdAt: timestamp('created_at').defaultNow(),
});

// Events & Announcements
export const events = mysqlTable('events', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  groupId: bigint('group_id', { mode: 'number' }).notNull().references(() => groups.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  eventType: varchar('event_type', { length: 50 }).notNull(), // 'meeting', 'announcement', 'celebration', 'training'
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date'),
  location: varchar('location', { length: 255 }),
  imageUrl: text('image_url'),
  status: varchar('status', { length: 50 }).default('scheduled'), // 'scheduled', 'ongoing', 'completed', 'cancelled'
  createdBy: bigint('created_by', { mode: 'number' }).references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').onUpdateNow(),
});

// Event RSVPs
export const eventRsvps = mysqlTable('event_rsvps', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  eventId: bigint('event_id', { mode: 'number' }).notNull().references(() => events.id, { onDelete: 'cascade' }),
  memberId: bigint('member_id', { mode: 'number' }).notNull().references(() => groupMembers.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 50 }).notNull(), // 'attending', 'not_attending', 'maybe'
  guestCount: int('guest_count').default(0),
  notes: text('notes'),
  rsvpedAt: timestamp('rsvped_at').defaultNow(),
});

// Investments Tracking
export const investments = mysqlTable('investments', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  groupId: bigint('group_id', { mode: 'number' }).notNull().references(() => groups.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  investmentType: varchar('investment_type', { length: 50 }).notNull(), // 'property', 'bonds', 'stocks', 'business', 'other'
  purchaseAmount: decimal('purchase_amount', { precision: 12, scale: 2 }).notNull(),
  currentValue: decimal('current_value', { precision: 12, scale: 2 }),
  purchaseDate: timestamp('purchase_date').notNull(),
  maturityDate: timestamp('maturity_date'),
  status: varchar('status', { length: 50 }).default('active'), // 'active', 'matured', 'liquidated'
  expectedReturn: decimal('expected_return', { precision: 5, scale: 2 }),
  actualReturn: decimal('actual_return', { precision: 12, scale: 2 }),
  notes: text('notes'),
  createdBy: bigint('created_by', { mode: 'number' }).references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').onUpdateNow(),
});

// Audit Trail
export const auditLogs = mysqlTable('audit_logs', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  groupId: bigint('group_id', { mode: 'number' }).references(() => groups.id, { onDelete: 'cascade' }),
  userId: bigint('user_id', { mode: 'number' }).references(() => users.id, { onDelete: 'set null' }),
  action: varchar('action', { length: 255 }).notNull(), // 'approved_loan', 'created_contribution', 'approved_welfare'
  entityType: varchar('entity_type', { length: 50 }).notNull(), // 'loan', 'contribution', 'welfare', 'transaction'
  entityId: bigint('entity_id', { mode: 'number' }),
  oldValue: text('old_value'),
  newValue: text('new_value'),
  details: text('details'),
  ipAddress: varchar('ip_address', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow(),
});

// Role-Based Permissions
export const rolePermissions = mysqlTable('role_permissions', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  groupId: bigint('group_id', { mode: 'number' }).notNull().references(() => groups.id, { onDelete: 'cascade' }),
  roleName: varchar('role_name', { length: 50 }).notNull(), // 'treasurer', 'secretary', 'chairperson', 'member', 'custom'
  permissions: text('permissions').notNull(), // JSON array of permissions
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').onUpdateNow(),
});

// Bills (for auto-billing system)
export const bills = mysqlTable('bills', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  groupId: bigint('group_id', { mode: 'number' }).notNull().references(() => groups.id, { onDelete: 'cascade' }),
  billMonth: date('bill_month').notNull(),
  billAmount: decimal('bill_amount', { precision: 10, scale: 2 }).notNull(),
  billType: varchar('bill_type', { length: 50 }).notNull(), // 'contribution', 'fine', 'loan', 'other'
  description: text('description'),
  dueDate: date('due_date'),
  status: varchar('status', { length: 50 }).default('pending'), // 'pending', 'partially_paid', 'paid', 'overdue'
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').onUpdateNow(),
});

// Bill Payment Records
export const billPayments = mysqlTable('bill_payments', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  billId: bigint('bill_id', { mode: 'number' }).notNull().references(() => bills.id, { onDelete: 'cascade' }),
  memberId: bigint('member_id', { mode: 'number' }).notNull().references(() => groupMembers.id, { onDelete: 'cascade' }),
  amountPaid: decimal('amount_paid', { precision: 10, scale: 2 }).notNull(),
  paymentMethod: varchar('payment_method', { length: 50 }).default('cash'), // 'cash', 'mpesa', 'bank'
  mpesaRef: varchar('mpesa_ref', { length: 255 }),
  paidAt: timestamp('paid_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
});

// M-Pesa Integration / Payment Tracking
export const mpesaTransactions = mysqlTable('mpesa_transactions', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  groupId: bigint('group_id', { mode: 'number' }).references(() => groups.id, { onDelete: 'cascade' }),
  memberId: bigint('member_id', { mode: 'number' }).references(() => groupMembers.id, { onDelete: 'cascade' }),
  mpesaRef: varchar('mpesa_ref', { length: 255 }).unique(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  phoneNumber: varchar('phone_number', { length: 20 }).notNull(),
  transactionType: varchar('transaction_type', { length: 50 }).notNull(), // 'contribution', 'repayment', 'payout'
  status: varchar('status', { length: 50 }).default('pending'), // 'pending', 'matched', 'completed'
  transactionDate: timestamp('transaction_date').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// User Preferences (for dark mode and other UI settings)
export const userPreferences = mysqlTable('user_preferences', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  userId: bigint('user_id', { mode: 'number' }).notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  darkMode: boolean('dark_mode').default(false),
  emailNotifications: boolean('email_notifications').default(true),
  smsNotifications: boolean('sms_notifications').default(true),
  language: varchar('language', { length: 10 }).default('en'),
  theme: varchar('theme', { length: 50 }).default('light'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').onUpdateNow(),
});

// Relations for new tables
export const welfareClaimsRelations = relations(welfareClaims, ({ one }) => ({
  group: one(groups, { fields: [welfareClaims.groupId], references: [groups.id] }),
  member: one(groupMembers, { fields: [welfareClaims.memberId], references: [groupMembers.id] }),
  approvedBy: one(users, { fields: [welfareClaims.approvedBy], references: [users.id] }),
}));

export const rotationsRelations = relations(rotations, ({ one, many }) => ({
  group: one(groups, { fields: [rotations.groupId], references: [groups.id] }),
  createdBy: one(users, { fields: [rotations.createdBy], references: [users.id] }),
  schedule: many(rotationSchedule),
}));

export const rotationScheduleRelations = relations(rotationSchedule, ({ one }) => ({
  rotation: one(rotations, { fields: [rotationSchedule.rotationId], references: [rotations.id] }),
  member: one(groupMembers, { fields: [rotationSchedule.memberId], references: [groupMembers.id] }),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  group: one(groups, { fields: [events.groupId], references: [groups.id] }),
  createdBy: one(users, { fields: [events.createdBy], references: [users.id] }),
  rsvps: many(eventRsvps),
}));

export const eventRsvpsRelations = relations(eventRsvps, ({ one }) => ({
  event: one(events, { fields: [eventRsvps.eventId], references: [events.id] }),
  member: one(groupMembers, { fields: [eventRsvps.memberId], references: [groupMembers.id] }),
}));

export const investmentsRelations = relations(investments, ({ one }) => ({
  group: one(groups, { fields: [investments.groupId], references: [groups.id] }),
  createdBy: one(users, { fields: [investments.createdBy], references: [users.id] }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  group: one(groups, { fields: [auditLogs.groupId], references: [groups.id] }),
  user: one(users, { fields: [auditLogs.userId], references: [users.id] }),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  group: one(groups, { fields: [rolePermissions.groupId], references: [groups.id] }),
}));

export const billsRelations = relations(bills, ({ one, many }) => ({
  group: one(groups, { fields: [bills.groupId], references: [groups.id] }),
  payments: many(billPayments),
}));

export const billPaymentsRelations = relations(billPayments, ({ one }) => ({
  bill: one(bills, { fields: [billPayments.billId], references: [bills.id] }),
  member: one(groupMembers, { fields: [billPayments.memberId], references: [groupMembers.id] }),
}));

export const mpesaTransactionsRelations = relations(mpesaTransactions, ({ one }) => ({
  group: one(groups, { fields: [mpesaTransactions.groupId], references: [groups.id] }),
  member: one(groupMembers, { fields: [mpesaTransactions.memberId], references: [groupMembers.id] }),
}));

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(users, { fields: [userPreferences.userId], references: [users.id] }),
}));