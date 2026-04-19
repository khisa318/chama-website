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