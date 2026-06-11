import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  doublePrecision,
} from "drizzle-orm/pg-core";

export const campaignStatusEnum = pgEnum("campaign_status", [
  "pending",
  "approved",
  "rejected",
  "escalated",
]);

export const campaignSourceEnum = pgEnum("campaign_source", [
  "seed",
  "user_submitted",
]);

export const assessmentStageEnum = pgEnum("assessment_stage", [
  "screening",
  "deep_review",
]);

export const evalRunStatusEnum = pgEnum("eval_run_status", [
  "running",
  "complete",
  "failed",
]);

export const donationSourceEnum = pgEnum("donation_source", ["seed", "user"]);

export type OrganizerHistory = {
  prior_campaigns: number;
  account_age_days: number;
  prior_flags: number;
};

export const campaigns = pgTable("campaigns", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  goalAmount: integer("goal_amount").notNull(),
  category: text("category").notNull(),
  organizerName: text("organizer_name").notNull(),
  organizerHistory: jsonb("organizer_history")
    .$type<OrganizerHistory>()
    .notNull(),
  zakatClaimed: boolean("zakat_claimed").notNull().default(false),
  status: campaignStatusEnum("status").notNull().default("pending"),
  source: campaignSourceEnum("source").notNull().default("user_submitted"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const aiAssessments = pgTable("ai_assessments", {
  id: uuid("id").primaryKey().defaultRandom(),
  campaignId: uuid("campaign_id")
    .notNull()
    .references(() => campaigns.id, { onDelete: "cascade" }),
  stage: assessmentStageEnum("stage").notNull(),
  model: text("model").notNull(),
  output: jsonb("output").notNull(),
  inputTokens: integer("input_tokens").notNull(),
  outputTokens: integer("output_tokens").notNull(),
  costUsd: doublePrecision("cost_usd").notNull(),
  latencyMs: integer("latency_ms").notNull(),
  promptVersion: text("prompt_version").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Immutable audit log: rows are only ever inserted, never updated or deleted.
export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  campaignId: uuid("campaign_id")
    .notNull()
    .references(() => campaigns.id, { onDelete: "cascade" }),
  reviewerName: text("reviewer_name").notNull(),
  action: text("action").notNull(), // approve | reject | escalate
  aiRecommendationSnapshot: jsonb("ai_recommendation_snapshot"),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Mock donations. Insert-only for the public flow; "raised" is always a
// derived SUM over these rows — never stored on campaigns. This table is the
// ONLY thing the public donate endpoint writes to.
export const donations = pgTable("donations", {
  id: uuid("id").primaryKey().defaultRandom(),
  campaignId: uuid("campaign_id")
    .notNull()
    .references(() => campaigns.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(), // whole USD, matches campaigns.goalAmount
  donorName: text("donor_name"), // null → displayed as "Anonymous"
  source: donationSourceEnum("source").notNull().default("user"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const evalRuns = pgTable("eval_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  promptVersion: text("prompt_version").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  metrics: jsonb("metrics"),
  status: evalRunStatusEnum("status").notNull().default("running"),
});

// Fixed-window rate limit counters (e.g. "submit:<ip>", "evals:global").
export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
  count: integer("count").notNull().default(0),
});

export type Campaign = typeof campaigns.$inferSelect;
export type NewCampaign = typeof campaigns.$inferInsert;
export type AiAssessment = typeof aiAssessments.$inferSelect;
export type NewAiAssessment = typeof aiAssessments.$inferInsert;
export type Review = typeof reviews.$inferSelect;
export type EvalRun = typeof evalRuns.$inferSelect;
export type Donation = typeof donations.$inferSelect;
export type NewDonation = typeof donations.$inferInsert;
