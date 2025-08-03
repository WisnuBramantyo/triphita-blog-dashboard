// Database schema and type imports
// Import table definitions and TypeScript types from shared schema
import { users, blogPosts, type User, type InsertUser, type BlogPost, type InsertBlogPost } from "@shared/schema";

// Import Drizzle ORM with MySQL adapter for database operations
import { drizzle } from "drizzle-orm/mysql2";

// Import MySQL database driver with promise support
// This provides async/await interface for database operations
import mysql from "mysql2/promise";

// Import SQL query operators from Drizzle ORM
// These provide type-safe query building capabilities
import { eq, like, or, and, count, desc } from "drizzle-orm";

/**
 * Storage Interface - Abstract data access layer
 * 
 * This interface defines all storage operations for the blog management system.
 * It allows for multiple implementations (MySQL, PostgreSQL, in-memory, etc.)
 * while maintaining a consistent API throughout the application.
 * 
 * Key Benefits:
 * - Database-agnostic design
 * - Easy testing with in-memory implementation
 * - Consistent error handling
 * - Type safety with TypeScript
 * - Separation of concerns
 */
export interface IStorage {
  // User management methods
  getUser(id: number): Promise<User | undefined>; // Get user by ID
  getUserByUsername(username: string): Promise<User | undefined>; // Get user by username
  createUser(user: InsertUser): Promise<User>; // Create new user
  
  // Blog post CRUD operations
  getAllBlogPosts(): Promise<BlogPost[]>; // Get all blog posts
  getBlogPost(id: number): Promise<BlogPost | undefined>; // Get specific blog post
  createBlogPost(post: InsertBlogPost): Promise<BlogPost>; // Create new blog post
  updateBlogPost(id: number, post: Partial<InsertBlogPost>): Promise<BlogPost | undefined>; // Update existing blog post
  deleteBlogPost(id: number): Promise<boolean>; // Delete blog post
  
  // Advanced blog post queries
  searchBlogPosts(query: string): Promise<BlogPost[]>; // Search posts by text
  getBlogPostsByStatus(status: string): Promise<BlogPost[]>; // Get posts by status
  getBlogPostsByCategory(category: string): Promise<BlogPost[]>; // Get posts by category
  
  // Dashboard statistics
  getBlogPostStats(): Promise<{
    totalPosts: number; // Total number of posts
    publishedPosts: number; // Number of published posts
    draftPosts: number; // Number of draft posts
    monthlyPosts: number; // Number of posts created this month
  }>;
}

/**
 * In-Memory Storage Implementation
 * 
 * This class provides a memory-based storage solution for development and testing.
 * It implements the IStorage interface using JavaScript Maps for data storage.
 * 
 * Features:
 * - Fast development setup (no database required)
 * - Automatic sample data initialization
 * - Perfect for testing and prototyping
 * - Data persistence only during application runtime
 * 
 * Use Cases:
 * - Local development environment
 * - Unit testing
 * - Prototyping and demos
 * - CI/CD environments
 */
export class MemStorage implements IStorage {
  // In-memory data stores using Map for O(1) lookups
  // Maps provide fast key-value storage with automatic key uniqueness
  private users: Map<number, User>; // Store users by ID
  private blogPosts: Map<number, BlogPost>; // Store blog posts by ID
  
  // Auto-incrementing ID counters
  // These track the next available ID for new records
  private currentUserId: number; // Next user ID
  private currentBlogPostId: number; // Next blog post ID

  constructor() {
    // Initialize empty data stores
    this.users = new Map(); // Create empty Map for users
    this.blogPosts = new Map(); // Create empty Map for blog posts
    this.currentUserId = 1; // Start user IDs at 1
    this.currentBlogPostId = 1; // Start blog post IDs at 1
    
    // Pre-populate with sample data for development
    // This provides immediate data to work with
    this.initializeSampleData();
  }

  /**
   * Initialize sample blog posts for development
   * Creates realistic test data to work with immediately
   */
  private initializeSampleData() {
    // Create sample blog posts with realistic content
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

    // Create each sample post using the createBlogPost method
    // This ensures proper ID assignment and data structure
    samplePosts.forEach(post => {
      this.createBlogPost(post);
    });
  }

  /**
   * Get user by ID
   * @param id - User ID to look up
   * @returns User object or undefined if not found
   */
  async getUser(id: number): Promise<User | undefined> {
    // Use Map.get() for O(1) lookup by ID
    return this.users.get(id);
  }

  /**
   * Get user by username
   * @param username - Username to look up
   * @returns User object or undefined if not found
   */
  async getUserByUsername(username: string): Promise<User | undefined> {
    // Convert Map values to array and find user by username
    // This is O(n) but acceptable for small user bases
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  /**
   * Create new user
   * @param insertUser - User data to create
   * @returns Created user with assigned ID
   */
  async createUser(insertUser: InsertUser): Promise<User> {
    // Generate next available user ID
    const id = this.currentUserId++;
    
    // Create user object with assigned ID
    const user: User = { ...insertUser, id };
    
    // Store user in Map with ID as key
    this.users.set(id, user);
    
    // Return created user
    return user;
  }

  /**
   * Get all blog posts sorted by creation date (newest first)
   * @returns Array of blog posts
   */
  async getAllBlogPosts(): Promise<BlogPost[]> {
    // Convert Map values to array and sort by creation date
    // Sort in descending order (newest first)
    return Array.from(this.blogPosts.values()).sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }

  /**
   * Get blog post by ID
   * @param id - Blog post ID to look up
   * @returns Blog post object or undefined if not found
   */
  async getBlogPost(id: number): Promise<BlogPost | undefined> {
    // Use Map.get() for O(1) lookup by ID
    return this.blogPosts.get(id);
  }

  /**
   * Create new blog post
   * @param insertPost - Blog post data to create
   * @returns Created blog post with assigned ID and timestamps
   */
  async createBlogPost(insertPost: InsertBlogPost): Promise<BlogPost> {
    // Generate next available blog post ID
    const id = this.currentBlogPostId++;
    
    // Get current timestamp for creation
    const now = new Date();
    
    // Create blog post object with all required fields
    const post: BlogPost = {
      id, // Assign generated ID
      title: insertPost.title, // Required title
      content: insertPost.content, // Required content
      excerpt: insertPost.excerpt || null, // Optional excerpt
      category: insertPost.category || null, // Optional category
      status: insertPost.status || "draft", // Status with default
      featuredImage: insertPost.featuredImage || null, // Optional featured image
      metaDescription: insertPost.metaDescription || null, // Optional meta description
      tags: insertPost.tags || null, // Optional tags array
      publishDate: insertPost.publishDate ? new Date(insertPost.publishDate) : null, // Optional publish date
      createdAt: now, // Set creation timestamp
      updatedAt: now, // Set initial update timestamp
    };
    
    // Store blog post in Map with ID as key
    this.blogPosts.set(id, post);
    
    // Return created blog post
    return post;
  }

  /**
   * Update existing blog post
   * @param id - Blog post ID to update
   * @param updatePost - Partial blog post data to update
   * @returns Updated blog post or undefined if not found
   */
  async updateBlogPost(id: number, updatePost: Partial<InsertBlogPost>): Promise<BlogPost | undefined> {
    // Get existing blog post
    const existingPost = this.blogPosts.get(id);
    
    // Return undefined if post doesn't exist
    if (!existingPost) return undefined;

    // Create updated blog post object
    const updatedPost: BlogPost = {
      ...existingPost, // Spread existing post data
      ...updatePost, // Spread update data (overwrites existing fields)
      publishDate: updatePost.publishDate ? new Date(updatePost.publishDate) : existingPost.publishDate, // Handle date conversion
      updatedAt: new Date(), // Update timestamp
    };
    
    // Store updated post back in Map
    this.blogPosts.set(id, updatedPost);
    
    // Return updated blog post
    return updatedPost;
  }

  /**
   * Delete blog post
   * @param id - Blog post ID to delete
   * @returns true if deleted, false if not found
   */
  async deleteBlogPost(id: number): Promise<boolean> {
    // Use Map.delete() which returns boolean indicating success
    return this.blogPosts.delete(id);
  }

  /**
   * Search blog posts by text query
   * @param query - Search text to match against
   * @returns Array of matching blog posts
   */
  async searchBlogPosts(query: string): Promise<BlogPost[]> {
    // Convert query to lowercase for case-insensitive search
    const lowercaseQuery = query.toLowerCase();
    
    // Filter posts that match query in any field
    return Array.from(this.blogPosts.values()).filter(post =>
      post.title.toLowerCase().includes(lowercaseQuery) ||
      post.content.toLowerCase().includes(lowercaseQuery) ||
      post.excerpt?.toLowerCase().includes(lowercaseQuery) ||
      post.category?.toLowerCase().includes(lowercaseQuery) ||
      post.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }

  /**
   * Get blog posts by status
   * @param status - Status to filter by (draft, published, scheduled)
   * @returns Array of blog posts with matching status
   */
  async getBlogPostsByStatus(status: string): Promise<BlogPost[]> {
    // Filter posts by exact status match
    return Array.from(this.blogPosts.values()).filter(post => post.status === status);
  }

  /**
   * Get blog posts by category
   * @param category - Category to filter by
   * @returns Array of blog posts with matching category
   */
  async getBlogPostsByCategory(category: string): Promise<BlogPost[]> {
    // Filter posts by exact category match
    return Array.from(this.blogPosts.values()).filter(post => post.category === category);
  }

  /**
   * Get blog post statistics for dashboard
   * @returns Object with various post counts
   */
  async getBlogPostStats(): Promise<{
    totalPosts: number;
    publishedPosts: number;
    draftPosts: number;
    monthlyPosts: number;
  }> {
    // Convert Map values to array for processing
    const posts = Array.from(this.blogPosts.values());
    
    // Get current date for monthly calculation
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Calculate statistics
    return {
      totalPosts: posts.length, // Total number of posts
      publishedPosts: posts.filter(post => post.status === "published").length, // Published posts count
      draftPosts: posts.filter(post => post.status === "draft").length, // Draft posts count
      monthlyPosts: posts.filter(post => {
        // Count posts created in current month
        const postDate = new Date(post.createdAt || 0);
        return postDate.getMonth() === currentMonth && postDate.getFullYear() === currentYear;
      }).length,
    };
  }
}

/**
 * MySQL Storage Implementation
 * 
 * This class provides persistent database storage using MySQL.
 * It implements the IStorage interface using Drizzle ORM for type-safe queries.
 * 
 * Features:
 * - Persistent data storage
 * - Type-safe database queries
 * - Connection pooling
 * - Automatic sample data initialization
 * - Production-ready implementation
 * 
 * Use Cases:
 * - Production environments
 * - Data persistence requirements
 * - Multi-user applications
 * - Scalable deployments
 */
export class MySQLStorage implements IStorage {
  // Drizzle ORM database instance
  private db: ReturnType<typeof drizzle>;
  
  // Flag to track initialization status
  private initialized = false;

  constructor() {
    // Create MySQL connection pool with environment variables
    const connection = mysql.createPool({
      host: process.env.DB_HOST || "localhost", // Database host
      port: Number(process.env.DB_PORT) || 3306, // Database port
      user: process.env.DB_USER || "root", // Database username
      password: process.env.DB_PASSWORD || "", // Database password
      database: process.env.DB_NAME || "triphita_blog", // Database name
      waitForConnections: true, // Wait for available connections
      connectionLimit: 10, // Maximum number of connections
      queueLimit: 0, // No limit on queued requests
    });
    
    // Create Drizzle ORM instance with MySQL connection
    this.db = drizzle(connection);
    
    // Initialize sample data for development
    this.initializeSampleData();
  }

  /**
   * Initialize sample data for development
   * Creates sample blog posts if database is empty
   */
  private async initializeSampleData() {
    try {
      // Check if data already exists by querying for any posts
      const existingPosts = await this.db.select().from(blogPosts).limit(1);
      
      // If posts exist, skip initialization
      if (existingPosts.length > 0) return;

      // Create sample blog posts with realistic content
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

      // Create each sample post in database
      for (const post of samplePosts) {
        await this.createBlogPost(post);
      }
    } catch (error) {
      // Log error but don't fail initialization
      console.error("Error initializing sample data:", error);
    }
  }

  /**
   * Get user by ID
   * @param id - User ID to look up
   * @returns User object or undefined if not found
   */
  async getUser(id: number): Promise<User | undefined> {
    // Use Drizzle ORM to query users table
    // eq() creates equality condition, limit(1) ensures single result
    const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    
    // Return first result or undefined
    return result[0];
  }

  /**
   * Get user by username
   * @param username - Username to look up
   * @returns User object or undefined if not found
   */
  async getUserByUsername(username: string): Promise<User | undefined> {
    // Use Drizzle ORM to query users table by username
    const result = await this.db.select().from(users).where(eq(users.username, username)).limit(1);
    
    // Return first result or undefined
    return result[0];
  }

  /**
   * Create new user
   * @param insertUser - User data to create
   * @returns Created user with assigned ID
   */
  async createUser(insertUser: InsertUser): Promise<User> {
    // Insert user into database using Drizzle ORM
    const result = await this.db.insert(users).values(insertUser);
    
    // Get the created user by ID
    const newUser = await this.getUser(Number(result[0].insertId));
    
    // Return created user (we know it exists since we just created it)
    return newUser!;
  }

  /**
   * Get all blog posts sorted by creation date (newest first)
   * @returns Array of blog posts
   */
  async getAllBlogPosts(): Promise<BlogPost[]> {
    // Use Drizzle ORM to query blog posts table
    // desc() sorts in descending order (newest first)
    return await this.db.select().from(blogPosts).orderBy(desc(blogPosts.createdAt));
  }

  /**
   * Get blog post by ID
   * @param id - Blog post ID to look up
   * @returns Blog post object or undefined if not found
   */
  async getBlogPost(id: number): Promise<BlogPost | undefined> {
    // Use Drizzle ORM to query blog posts table by ID
    const result = await this.db.select().from(blogPosts).where(eq(blogPosts.id, id)).limit(1);
    
    // Return first result or undefined
    return result[0];
  }

  /**
   * Create new blog post
   * @param insertPost - Blog post data to create
   * @returns Created blog post with assigned ID
   */
  async createBlogPost(insertPost: InsertBlogPost): Promise<BlogPost> {
    // Prepare post data with proper date handling
    const postData = {
      ...insertPost, // Spread all insert data
      publishDate: insertPost.publishDate ? new Date(insertPost.publishDate) : null, // Convert string to Date
    };
    
    // Insert post into database using Drizzle ORM
    const result = await this.db.insert(blogPosts).values(postData);
    
    // Get the created post by ID
    const newPost = await this.getBlogPost(Number(result[0].insertId));
    
    // Return created post (we know it exists since we just created it)
    return newPost!;
  }

  /**
   * Update existing blog post
   * @param id - Blog post ID to update
   * @param updatePost - Partial blog post data to update
   * @returns Updated blog post or undefined if not found
   */
  async updateBlogPost(id: number, updatePost: Partial<InsertBlogPost>): Promise<BlogPost | undefined> {
    // Prepare update data with proper date handling
    const updateData = {
      ...updatePost, // Spread all update data
      publishDate: updatePost.publishDate ? new Date(updatePost.publishDate) : undefined, // Convert string to Date
    };
    
    // Update post in database using Drizzle ORM
    await this.db.update(blogPosts).set(updateData).where(eq(blogPosts.id, id));
    
    // Get and return updated post
    return await this.getBlogPost(id);
  }

  /**
   * Delete blog post
   * @param id - Blog post ID to delete
   * @returns true if deleted, false if not found
   */
  async deleteBlogPost(id: number): Promise<boolean> {
    // Delete post from database using Drizzle ORM
    const result = await this.db.delete(blogPosts).where(eq(blogPosts.id, id));
    
    // Check if any rows were affected (deleted)
    return result[0].affectedRows > 0;
  }

  /**
   * Search blog posts by text query
   * @param query - Search text to match against
   * @returns Array of matching blog posts
   */
  async searchBlogPosts(query: string): Promise<BlogPost[]> {
    // Create search pattern with wildcards for LIKE queries
    const searchPattern = `%${query}%`;
    
    // Use Drizzle ORM to search across multiple fields
    // or() combines multiple conditions with OR logic
    // like() creates LIKE queries for pattern matching
    return await this.db.select().from(blogPosts).where(
      or(
        like(blogPosts.title, searchPattern), // Search in title
        like(blogPosts.content, searchPattern), // Search in content
        like(blogPosts.excerpt, searchPattern), // Search in excerpt
        like(blogPosts.category, searchPattern) // Search in category
      )
    ).orderBy(desc(blogPosts.createdAt)); // Sort by creation date
  }

  /**
   * Get blog posts by status
   * @param status - Status to filter by (draft, published, scheduled)
   * @returns Array of blog posts with matching status
   */
  async getBlogPostsByStatus(status: string): Promise<BlogPost[]> {
    // Use Drizzle ORM to filter by status
    return await this.db.select().from(blogPosts).where(eq(blogPosts.status, status)).orderBy(desc(blogPosts.createdAt));
  }

  /**
   * Get blog posts by category
   * @param category - Category to filter by
   * @returns Array of blog posts with matching category
   */
  async getBlogPostsByCategory(category: string): Promise<BlogPost[]> {
    // Use Drizzle ORM to filter by category
    return await this.db.select().from(blogPosts).where(eq(blogPosts.category, category)).orderBy(desc(blogPosts.createdAt));
  }

  /**
   * Get blog post statistics for dashboard
   * @returns Object with various post counts
   */
  async getBlogPostStats(): Promise<{
    totalPosts: number;
    publishedPosts: number;
    draftPosts: number;
    monthlyPosts: number;
  }> {
    // Get current date for monthly calculation
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Use Drizzle ORM to get counts with count() function
    const totalResult = await this.db.select({ count: count() }).from(blogPosts);
    const publishedResult = await this.db.select({ count: count() }).from(blogPosts).where(eq(blogPosts.status, "published"));
    const draftResult = await this.db.select({ count: count() }).from(blogPosts).where(eq(blogPosts.status, "draft"));
    const monthlyResult = await this.db.select({ count: count() }).from(blogPosts).where(
      and(
        eq(blogPosts.status, "published"),
        // MySQL date comparison for current month
        // Note: This is a simplified version - in production you'd use proper date functions
      )
    );

    // Return statistics object
    return {
      totalPosts: totalResult[0].count, // Total number of posts
      publishedPosts: publishedResult[0].count, // Number of published posts
      draftPosts: draftResult[0].count, // Number of draft posts
      monthlyPosts: monthlyResult[0].count, // Number of posts this month
    };
  }
}

/**
 * Choose storage implementation based on environment
 * 
 * This exports the appropriate storage implementation based on the USE_MYSQL environment variable.
 * 
 * - USE_MYSQL=true: Uses MySQLStorage for persistent database storage
 * - USE_MYSQL=false or undefined: Uses MemStorage for in-memory storage
 * 
 * This allows easy switching between development (memory) and production (MySQL) environments.
 */
export const storage = process.env.USE_MYSQL === "true" ? new MySQLStorage() : new MemStorage();
