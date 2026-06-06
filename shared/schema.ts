import { sql } from "drizzle-orm";
import { boolean, integer, jsonb, numeric, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  passwordHash: text("password_hash").notNull(),
  passwordSalt: text("password_salt").notNull(),
  creditBalanceCents: integer("credit_balance_cents").notNull().default(500),
  plan: text("plan").notNull().default("Free plan"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  pinned: boolean("pinned").notNull().default(false),
  archived: boolean("archived").notNull().default(false),
  summary: text("summary").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull().default(""),
  parts: jsonb("parts").notNull().default(sql`'[]'::jsonb`),
  status: text("status").notNull().default("complete"),
  modelId: text("model_id"),
  inputTokens: integer("input_tokens").notNull().default(0),
  outputTokens: integer("output_tokens").notNull().default(0),
  creditUsed: numeric("credit_used", { precision: 12, scale: 4 }).notNull().default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const memories = pgTable("memories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull().default("preference"),
  layer: text("layer").notNull().default("long_term"),
  category: text("category").notNull().default("profile"),
  content: text("content").notNull(),
  keywords: text("keywords").array().notNull().default(sql`ARRAY[]::text[]`),
  importance: integer("importance").notNull().default(3),
  confidence: numeric("confidence", { precision: 4, scale: 2 }).notNull().default("0.80"),
  sourceConversationId: varchar("source_conversation_id").references(() => conversations.id, { onDelete: "set null" }),
  status: text("status").notNull().default("suggested"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  lastAccessedAt: timestamp("last_accessed_at", { withTimezone: true }),
  accessCount: integer("access_count").notNull().default(0),
  dormant: boolean("dormant").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  displayName: true,
  passwordHash: true,
  passwordSalt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

/* ─────────────────────────────────────────────
   Skills
   ───────────────────────────────────────────── */

export const skills = pgTable("skills", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  authorId: varchar("author_id").notNull().default("system"),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  systemPrompt: text("system_prompt").notNull().default(""),
  examples: text("examples").array().notNull().default(sql`ARRAY[]::text[]`),
  tags: text("tags").array().notNull().default(sql`ARRAY[]::text[]`),
  icon: text("icon").notNull().default("Sparkles"),
  iconColor: text("icon_color").notNull().default("#7A42D8"),
  badge: text("badge"),
  status: text("status").notNull().default("published"), // published | pending | hidden
  starCount: integer("star_count").notNull().default(0),
  downloadCount: integer("download_count").notNull().default(0),
  rating: numeric("rating", { precision: 3, scale: 2 }).notNull().default("0"),
  reviewCount: integer("review_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const skillStars = pgTable("skill_stars", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  skillId: varchar("skill_id").notNull().references(() => skills.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const skillComments = pgTable("skill_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  skillId: varchar("skill_id").notNull().references(() => skills.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  rating: integer("rating").notNull().default(5), // 1-5
  helpfulCount: integer("helpful_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSkillSchema = createInsertSchema(skills).pick({
  name: true,
  description: true,
  category: true,
  systemPrompt: true,
  examples: true,
  tags: true,
  icon: true,
  iconColor: true,
});

export type InsertSkill = z.infer<typeof insertSkillSchema>;
export type Skill = typeof skills.$inferSelect;
export type SkillStar = typeof skillStars.$inferSelect;
export type SkillComment = typeof skillComments.$inferSelect;
