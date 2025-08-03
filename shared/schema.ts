/**
 * Database Schema Definitions - Shared between client and server
 * 
 * This file defines the complete database schema using Drizzle ORM and generates
 * TypeScript types and Zod validation schemas for the entire application.
 * 
 * Architecture Benefits:
 * - Single source of truth for data structures
 * - Type safety across frontend and backend
 * - Automatic schema validation
 * - Database-agnostic ORM queries
 * - Runtime type checking with Zod
 */

// Import Drizzle ORM MySQL-specific table and column types
// These provide type-safe database schema definitions
import { mysqlTable, text, int, json, timestamp, varchar } from "drizzle-orm/mysql-core";

// Import Drizzle-Zod integration for automatic schema generation
// This automatically creates Zod validation schemas from Drizzle table definitions
import { createInsertSchema } from "drizzle-zod";

// Import Zod for runtime validation and type inference
import { z } from "zod";

/**
 * Users Table Schema
 * 
 * Stores user authentication and profile information.
 * Currently supports basic username/password authentication.
 * 
 * Fields:
 * - id: Primary key, auto-increment
 * - username: Unique identifier for login (max 255 chars)
 * - password: Hashed password stored as TEXT
 */
export const users = mysqlTable("users", {
  // Primary key with auto-increment - automatically generates unique IDs
  id: int("id").primaryKey().autoincrement(),
  
  // Username field - unique constraint prevents duplicate usernames
  // varchar(255) limits to 255 characters for database efficiency
  username: varchar("username", { length: 255 }).notNull().unique(),
  
  // Password field - stores hashed passwords (never plain text)
  // text() allows unlimited length for hash storage
  password: text("password").notNull(),
});

/**
 * Blog Posts Table Schema
 * 
 * Core table for blog content management with comprehensive metadata support.
 * Optimized for content creation, SEO, and publishing workflows.
 * 
 * Fields:
 * - id: Primary key, auto-increment
 * - title: Post title (TEXT, required)
 * - content: Main post content (TEXT, required) 
 * - excerpt: Brief description for previews (TEXT, optional)
 * - category: Content categorization (max 100 chars, optional)
 * - status: Publishing status (varchar: draft, published, scheduled)
 * - featuredImage: URL to hero image (TEXT, optional)
 * - metaDescription: SEO meta description (TEXT, optional)
 * - tags: Array of tag strings stored as JSON (optional)
 * - publishDate: Scheduled publication date (TIMESTAMP, optional)
 * - createdAt: Record creation timestamp (auto-set)
 * - updatedAt: Last modification timestamp (auto-updated)
 */
export const blogPosts = mysqlTable("blog_posts", {
  // Primary key with auto-increment - automatically generates unique IDs
  id: int("id").primaryKey().autoincrement(),
  
  // Post title - required field for all blog posts
  // text() allows unlimited length for titles
  title: text("title").notNull(),
  
  // Main post content - required field for all blog posts
  // text() allows unlimited length for rich content
  content: text("content").notNull(),
  
  // Brief excerpt for post previews - optional field
  // text() allows unlimited length for excerpts
  excerpt: text("excerpt"),
  
  // Category for content organization - optional field
  // varchar(100) limits to 100 characters for consistency
  category: varchar("category", { length: 100 }),
  
  // Publishing status - required field with default value
  // varchar(50) allows for status values like "draft", "published", "scheduled"
  // .default("draft") sets initial status for new posts
  status: varchar("status", { length: 50 }).notNull().default("draft"),
  
  // Featured image URL - optional field for hero images
  // text() allows unlimited length for URLs
  featuredImage: text("featured_image"),
  
  // SEO meta description - optional field for search engine optimization
  // text() allows unlimited length for descriptions
  metaDescription: text("meta_description"),
  
  // Tags array stored as JSON - optional field for content categorization
  // json() stores JavaScript arrays as JSON in database
  // $type<string[]>() provides TypeScript type safety for the array
  tags: json("tags").$type<string[]>(),
  
  // Scheduled publish date - optional field for future publishing
  // timestamp() stores date and time information
  publishDate: timestamp("publish_date"),
  
  // Record creation timestamp - automatically set when record is created
  // .defaultNow() sets current timestamp when record is inserted
  createdAt: timestamp("created_at").defaultNow(),
  
  // Record update timestamp - automatically updated when record is modified
  // .defaultNow() sets initial timestamp
  // .onUpdateNow() updates timestamp on every record modification
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

/**
 * User Insert Schema - Validation for user creation
 * 
 * Auto-generated from Drizzle schema but limited to only the fields
 * that should be provided during user registration (excludes ID).
 * 
 * This schema validates user data before database insertion.
 */
export const insertUserSchema = createInsertSchema(users).pick({
  username: true, // Include username field
  password: true, // Include password field
  // Note: id is excluded because it's auto-generated
});

/**
 * Blog Post Insert Schema - Validation for post creation/editing
 * 
 * Custom Zod schema that defines validation rules for blog post data.
 * This ensures data integrity and provides user-friendly error messages.
 * 
 * Validation Rules:
 * - title: Required string, minimum 1 character
 * - content: Required string, minimum 1 character
 * - excerpt: Optional string or null
 * - category: Optional string or null
 * - status: String with default value "draft"
 * - featuredImage: Optional URL string or null
 * - metaDescription: Optional SEO description or null
 * - tags: Optional array of strings or null
 * - publishDate: Optional ISO date string or null
 */
export const insertBlogPostSchema = z.object({
  // Title validation - required string with minimum length
  title: z.string().min(1),
  
  // Content validation - required string with minimum length
  content: z.string().min(1),
  
  // Excerpt validation - optional string that can be null
  excerpt: z.string().nullable().optional(),
  
  // Category validation - optional string that can be null
  category: z.string().nullable().optional(),
  
  // Status validation - string with default value "draft"
  status: z.string().default("draft"),
  
  // Featured image validation - optional URL string that can be null
  featuredImage: z.string().nullable().optional(),
  
  // Meta description validation - optional SEO string that can be null
  metaDescription: z.string().nullable().optional(),
  
  // Tags validation - optional array of strings that can be null
  tags: z.array(z.string()).nullable().optional(),
  
  // Publish date validation - optional ISO date string that can be null
  publishDate: z.string().nullable().optional(),
});

/**
 * Blog Post Update Schema - Validation for post updates
 * 
 * Makes all fields optional for PATCH operations, allowing partial updates.
 * Used when editing existing posts where only changed fields are sent.
 * 
 * This is the same as insertBlogPostSchema but with .partial() applied,
 * making all fields optional for update operations.
 */
export const updateBlogPostSchema = insertBlogPostSchema.partial();

// TypeScript type exports inferred from schemas
// These provide compile-time type safety across the application

// User types
export type InsertUser = z.infer<typeof insertUserSchema>;     // User data for creation (username, password)
export type User = typeof users.$inferSelect;                  // Complete user object from DB (includes id)

// Blog post types
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>; // Blog post data for creation (all fields except id)
export type BlogPost = typeof blogPosts.$inferSelect;              // Complete blog post from DB (includes id, timestamps)
