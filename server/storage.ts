import { users, blogPosts, type User, type InsertUser, type BlogPost, type InsertBlogPost } from "@shared/schema";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { eq, like, or, and, count, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Blog post methods
  getAllBlogPosts(): Promise<BlogPost[]>;
  getBlogPost(id: number): Promise<BlogPost | undefined>;
  createBlogPost(post: InsertBlogPost): Promise<BlogPost>;
  updateBlogPost(id: number, post: Partial<InsertBlogPost>): Promise<BlogPost | undefined>;
  deleteBlogPost(id: number): Promise<boolean>;
  searchBlogPosts(query: string): Promise<BlogPost[]>;
  getBlogPostsByStatus(status: string): Promise<BlogPost[]>;
  getBlogPostsByCategory(category: string): Promise<BlogPost[]>;
  getBlogPostStats(): Promise<{
    totalPosts: number;
    publishedPosts: number;
    draftPosts: number;
    monthlyPosts: number;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private blogPosts: Map<number, BlogPost>;
  private currentUserId: number;
  private currentBlogPostId: number;

  constructor() {
    this.users = new Map();
    this.blogPosts = new Map();
    this.currentUserId = 1;
    this.currentBlogPostId = 1;
    
    // Initialize with some sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Create sample blog posts
    const samplePosts: InsertBlogPost[] = [
      {
        title: "Ultimate Guide to Hiking in the Swiss Alps",
        content: "Discover breathtaking trails and hidden gems in the Swiss Alps. This comprehensive guide covers everything from beginner-friendly paths to challenging mountain routes.",
        excerpt: "Discover breathtaking trails and hidden gems...",
        category: "Travel",
        status: "published",
        featuredImage: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        metaDescription: "Complete guide to hiking in the Swiss Alps with trail recommendations and tips",
        tags: ["hiking", "switzerland", "alps", "travel"],
        publishDate: "2023-12-15T10:00:00.000Z",
      },
      {
        title: "Food Adventures in Tokyo's Street Markets",
        content: "Explore authentic Japanese cuisine and culture through Tokyo's vibrant street food scene. From traditional ramen to modern fusion dishes.",
        excerpt: "Explore authentic Japanese cuisine and culture...",
        category: "Food",
        status: "draft",
        featuredImage: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        metaDescription: "Discover Tokyo's best street food markets and hidden culinary gems",
        tags: ["food", "tokyo", "japan", "street food"],
        publishDate: "2023-12-12T09:00:00.000Z",
      },
      {
        title: "Hidden Gems of the Greek Islands",
        content: "Discover secluded beaches and ancient ruins away from the tourist crowds. These lesser-known Greek islands offer pristine beauty and rich history.",
        excerpt: "Discover secluded beaches and ancient ruins...",
        category: "Culture",
        status: "published",
        featuredImage: "https://images.unsplash.com/photo-1533105079780-92b9be482077?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        metaDescription: "Explore hidden Greek islands with pristine beaches and ancient history",
        tags: ["greece", "islands", "culture", "travel"],
        publishDate: "2023-12-10T08:00:00.000Z",
      },
    ];

    samplePosts.forEach(post => {
      this.createBlogPost(post);
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getAllBlogPosts(): Promise<BlogPost[]> {
    return Array.from(this.blogPosts.values()).sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }

  async getBlogPost(id: number): Promise<BlogPost | undefined> {
    return this.blogPosts.get(id);
  }

  async createBlogPost(insertPost: InsertBlogPost): Promise<BlogPost> {
    const id = this.currentBlogPostId++;
    const now = new Date();
    const post: BlogPost = {
      id,
      title: insertPost.title,
      content: insertPost.content,
      excerpt: insertPost.excerpt || null,
      category: insertPost.category || null,
      status: insertPost.status || "draft",
      featuredImage: insertPost.featuredImage || null,
      metaDescription: insertPost.metaDescription || null,
      tags: insertPost.tags || null,
      publishDate: insertPost.publishDate ? new Date(insertPost.publishDate) : null,
      createdAt: now,
      updatedAt: now,
    };
    this.blogPosts.set(id, post);
    return post;
  }

  async updateBlogPost(id: number, updatePost: Partial<InsertBlogPost>): Promise<BlogPost | undefined> {
    const existingPost = this.blogPosts.get(id);
    if (!existingPost) return undefined;

    const updatedPost: BlogPost = {
      ...existingPost,
      ...updatePost,
      publishDate: updatePost.publishDate ? new Date(updatePost.publishDate) : existingPost.publishDate,
      updatedAt: new Date(),
    };
    this.blogPosts.set(id, updatedPost);
    return updatedPost;
  }

  async deleteBlogPost(id: number): Promise<boolean> {
    return this.blogPosts.delete(id);
  }

  async searchBlogPosts(query: string): Promise<BlogPost[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.blogPosts.values()).filter(post =>
      post.title.toLowerCase().includes(lowercaseQuery) ||
      post.content.toLowerCase().includes(lowercaseQuery) ||
      post.excerpt?.toLowerCase().includes(lowercaseQuery) ||
      post.category?.toLowerCase().includes(lowercaseQuery) ||
      post.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }

  async getBlogPostsByStatus(status: string): Promise<BlogPost[]> {
    return Array.from(this.blogPosts.values()).filter(post => post.status === status);
  }

  async getBlogPostsByCategory(category: string): Promise<BlogPost[]> {
    return Array.from(this.blogPosts.values()).filter(post => post.category === category);
  }

  async getBlogPostStats(): Promise<{
    totalPosts: number;
    publishedPosts: number;
    draftPosts: number;
    monthlyPosts: number;
  }> {
    const posts = Array.from(this.blogPosts.values());
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return {
      totalPosts: posts.length,
      publishedPosts: posts.filter(post => post.status === "published").length,
      draftPosts: posts.filter(post => post.status === "draft").length,
      monthlyPosts: posts.filter(post => {
        const postDate = new Date(post.createdAt || 0);
        return postDate.getMonth() === currentMonth && postDate.getFullYear() === currentYear;
      }).length,
    };
  }
}

// MySQL Storage Implementation
export class MySQLStorage implements IStorage {
  private db: ReturnType<typeof drizzle>;
  private initialized = false;

  constructor() {
    const connection = mysql.createPool({
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "triphita_blog",
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
    
    this.db = drizzle(connection);
    this.initializeSampleData();
  }

  private async initializeSampleData() {
    try {
      // Check if data already exists
      const existingPosts = await this.db.select().from(blogPosts).limit(1);
      if (existingPosts.length > 0) return;

      // Create sample blog posts
      const samplePosts: InsertBlogPost[] = [
        {
          title: "Ultimate Guide to Hiking in the Swiss Alps",
          content: "Discover breathtaking trails and hidden gems in the Swiss Alps. This comprehensive guide covers everything from beginner-friendly paths to challenging mountain routes.",
          excerpt: "Discover breathtaking trails and hidden gems...",
          category: "Travel",
          status: "published",
          featuredImage: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          metaDescription: "Complete guide to hiking in the Swiss Alps with trail recommendations and tips",
          tags: ["hiking", "switzerland", "alps", "travel"],
          publishDate: "2023-12-15T10:00:00.000Z",
        },
        {
          title: "Food Adventures in Tokyo's Street Markets",
          content: "Explore authentic Japanese cuisine and culture through Tokyo's vibrant street food scene. From traditional ramen to modern fusion dishes.",
          excerpt: "Explore authentic Japanese cuisine and culture...",
          category: "Food",
          status: "draft",
          featuredImage: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          metaDescription: "Discover Tokyo's best street food markets and hidden culinary gems",
          tags: ["food", "tokyo", "japan", "street food"],
          publishDate: "2023-12-12T09:00:00.000Z",
        },
        {
          title: "Hidden Gems of the Greek Islands",
          content: "Discover secluded beaches and ancient ruins away from the tourist crowds. These lesser-known Greek islands offer pristine beauty and rich history.",
          excerpt: "Discover secluded beaches and ancient ruins...",
          category: "Culture",
          status: "published",
          featuredImage: "https://images.unsplash.com/photo-1533105079780-92b9be482077?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          metaDescription: "Explore hidden Greek islands with pristine beaches and ancient history",
          tags: ["greece", "islands", "culture", "travel"],
          publishDate: "2023-12-10T08:00:00.000Z",
        },
      ];

      for (const post of samplePosts) {
        await this.createBlogPost(post);
      }
    } catch (error) {
      console.error("Error initializing sample data:", error);
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await this.db.insert(users).values(insertUser);
    const newUser = await this.getUser(Number(result[0].insertId));
    return newUser!;
  }

  async getAllBlogPosts(): Promise<BlogPost[]> {
    return await this.db.select().from(blogPosts).orderBy(desc(blogPosts.createdAt));
  }

  async getBlogPost(id: number): Promise<BlogPost | undefined> {
    const result = await this.db.select().from(blogPosts).where(eq(blogPosts.id, id)).limit(1);
    return result[0];
  }

  async createBlogPost(insertPost: InsertBlogPost): Promise<BlogPost> {
    const postData = {
      ...insertPost,
      publishDate: insertPost.publishDate ? new Date(insertPost.publishDate) : null,
    };
    
    const result = await this.db.insert(blogPosts).values(postData);
    const newPost = await this.getBlogPost(Number(result[0].insertId));
    return newPost!;
  }

  async updateBlogPost(id: number, updatePost: Partial<InsertBlogPost>): Promise<BlogPost | undefined> {
    const updateData = {
      ...updatePost,
      publishDate: updatePost.publishDate ? new Date(updatePost.publishDate) : undefined,
    };
    
    await this.db.update(blogPosts).set(updateData).where(eq(blogPosts.id, id));
    return await this.getBlogPost(id);
  }

  async deleteBlogPost(id: number): Promise<boolean> {
    const result = await this.db.delete(blogPosts).where(eq(blogPosts.id, id));
    return result[0].affectedRows > 0;
  }

  async searchBlogPosts(query: string): Promise<BlogPost[]> {
    const searchPattern = `%${query}%`;
    return await this.db.select().from(blogPosts).where(
      or(
        like(blogPosts.title, searchPattern),
        like(blogPosts.content, searchPattern),
        like(blogPosts.excerpt, searchPattern),
        like(blogPosts.category, searchPattern)
      )
    ).orderBy(desc(blogPosts.createdAt));
  }

  async getBlogPostsByStatus(status: string): Promise<BlogPost[]> {
    return await this.db.select().from(blogPosts).where(eq(blogPosts.status, status)).orderBy(desc(blogPosts.createdAt));
  }

  async getBlogPostsByCategory(category: string): Promise<BlogPost[]> {
    return await this.db.select().from(blogPosts).where(eq(blogPosts.category, category)).orderBy(desc(blogPosts.createdAt));
  }

  async getBlogPostStats(): Promise<{
    totalPosts: number;
    publishedPosts: number;
    draftPosts: number;
    monthlyPosts: number;
  }> {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const totalResult = await this.db.select({ count: count() }).from(blogPosts);
    const publishedResult = await this.db.select({ count: count() }).from(blogPosts).where(eq(blogPosts.status, "published"));
    const draftResult = await this.db.select({ count: count() }).from(blogPosts).where(eq(blogPosts.status, "draft"));
    const monthlyResult = await this.db.select({ count: count() }).from(blogPosts).where(
      and(
        eq(blogPosts.status, "published"),
        // MySQL date comparison for current month
      )
    );

    return {
      totalPosts: totalResult[0].count,
      publishedPosts: publishedResult[0].count,
      draftPosts: draftResult[0].count,
      monthlyPosts: monthlyResult[0].count,
    };
  }
}

// Choose storage implementation based on environment
export const storage = process.env.USE_MYSQL === "true" ? new MySQLStorage() : new MemStorage();
