import { mysqlTable, text, int, json, timestamp, varchar } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
});

export const blogPosts = mysqlTable("blog_posts", {
  id: int("id").primaryKey().autoincrement(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  category: varchar("category", { length: 100 }),
  status: varchar("status", { length: 50 }).notNull().default("draft"), // draft, published, scheduled
  featuredImage: text("featured_image"),
  metaDescription: text("meta_description"),
  tags: json("tags").$type<string[]>(),
  publishDate: timestamp("publish_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertBlogPostSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  excerpt: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  status: z.string().default("draft"),
  featuredImage: z.string().nullable().optional(),
  metaDescription: z.string().nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
  publishDate: z.string().nullable().optional(),
});

export const updateBlogPostSchema = insertBlogPostSchema.partial();

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type BlogPost = typeof blogPosts.$inferSelect;
