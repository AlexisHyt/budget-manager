import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  json,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  banned: boolean("banned").default(false),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
  apiKeyEncrypted: text("api_key_encrypted"),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    impersonatedBy: text("impersonated_by"),
    activeOrganizationId: text("active_organization_id"),
    activeTeamId: text("active_team_id"),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

/**
 * Budget Manager tables
 */
export const bankAccounts = pgTable(
  "bank_accounts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: text("color").notNull().default("#3B82F6"),
    balance: integer("balance").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("bank_accounts_user_id_idx").on(table.userId)],
);

export const incomes = pgTable(
  "incomes",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    amount: integer("amount").notNull(),
    frequency: text("frequency").notNull().default("monthly"),
    startDate: timestamp("start_date").notNull(),
    nextDate: timestamp("next_date"),
    bankAccountId: text("bank_account_id").references(() => bankAccounts.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("incomes_user_id_idx").on(table.userId),
    index("incomes_bank_account_id_idx").on(table.bankAccountId),
  ],
);

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    amount: integer("amount").notNull(),
    frequency: text("frequency").notNull().default("monthly"),
    startDate: timestamp("start_date").notNull(),
    endDate: timestamp("end_date"),
    bankAccountId: text("bank_account_id")
      .notNull()
      .references(() => bankAccounts.id, { onDelete: "cascade" }),
    imageUrl: text("image_url"),
    indicator: text("indicator"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("subscriptions_user_id_idx").on(table.userId),
    index("subscriptions_bank_account_id_idx").on(table.bankAccountId),
    index("subscriptions_start_date_idx").on(table.startDate),
  ],
);

export const payments = pgTable(
  "payments",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    amount: integer("amount").notNull(),
    dueDate: timestamp("due_date").notNull(),
    bankAccountId: text("bank_account_id")
      .notNull()
      .references(() => bankAccounts.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("pending"),
    paidDate: timestamp("paid_date"),
    completed: boolean("completed").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("payments_user_id_idx").on(table.userId),
    index("payments_bank_account_id_idx").on(table.bankAccountId),
    index("payments_due_date_idx").on(table.dueDate),
  ],
);

export const tags = pgTable(
  "tags",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: text("color").notNull().default("#6366f1"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("tags_user_id_idx").on(table.userId),
    uniqueIndex("tags_user_id_name_idx").on(table.userId, table.name),
  ],
);

export const subscriptionTags = pgTable(
  "subscription_tags",
  {
    subscriptionId: text("subscription_id")
      .notNull()
      .references(() => subscriptions.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.subscriptionId, table.tagId] }),
    index("subscription_tags_tag_id_idx").on(table.tagId),
  ],
);

export const bankAccountRelations = relations(
  bankAccounts,
  ({ one, many }) => ({
    user: one(user, {
      fields: [bankAccounts.userId],
      references: [user.id],
    }),
    incomes: many(incomes),
    subscriptions: many(subscriptions),
    payments: many(payments),
  }),
);

export const incomesRelations = relations(incomes, ({ one }) => ({
  user: one(user, {
    fields: [incomes.userId],
    references: [user.id],
  }),
  bankAccount: one(bankAccounts, {
    fields: [incomes.bankAccountId],
    references: [bankAccounts.id],
  }),
}));

export const subscriptionsRelations = relations(
  subscriptions,
  ({ one, many }) => ({
    user: one(user, {
      fields: [subscriptions.userId],
      references: [user.id],
    }),
    bankAccount: one(bankAccounts, {
      fields: [subscriptions.bankAccountId],
      references: [bankAccounts.id],
    }),
    subscriptionTags: many(subscriptionTags),
  }),
);

export const tagsRelations = relations(tags, ({ one, many }) => ({
  user: one(user, {
    fields: [tags.userId],
    references: [user.id],
  }),
  subscriptionTags: many(subscriptionTags),
}));

export const subscriptionTagsRelations = relations(
  subscriptionTags,
  ({ one }) => ({
    subscription: one(subscriptions, {
      fields: [subscriptionTags.subscriptionId],
      references: [subscriptions.id],
    }),
    tag: one(tags, {
      fields: [subscriptionTags.tagId],
      references: [tags.id],
    }),
  }),
);

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(user, {
    fields: [payments.userId],
    references: [user.id],
  }),
  bankAccount: one(bankAccounts, {
    fields: [payments.bankAccountId],
    references: [bankAccounts.id],
  }),
}));

export type BankAccount = typeof bankAccounts.$inferSelect;
export type InsertBankAccount = typeof bankAccounts.$inferInsert;

export type Income = typeof incomes.$inferSelect;
export type InsertIncome = typeof incomes.$inferInsert;

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

export type Tag = typeof tags.$inferSelect;
export type InsertTag = typeof tags.$inferInsert;

export type SubscriptionTag = typeof subscriptionTags.$inferSelect;
export type InsertSubscriptionTag = typeof subscriptionTags.$inferInsert;

export type SubscriptionWithTags = Subscription & { tags: Tag[] };
