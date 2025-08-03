// Import Express types for TypeScript support
import type { Express } from "express";

// Import Node.js HTTP server creation utilities
import { createServer, type Server } from "http";

// Import our storage abstraction layer (MySQL or in-memory)
import { storage } from "./storage";

// Import Zod validation schemas and types from shared schema
import { insertBlogPostSchema, updateBlogPostSchema, type InsertBlogPost } from "@shared/schema";

// Import Zod for runtime validation
import { z } from "zod";

/**
 * API Routes Registration Function
 * 
 * This function sets up all RESTful API endpoints for the blog management system.
 * It handles CRUD operations for blog posts with proper validation, error handling,
 * and filtering capabilities.
 * 
 * Architecture:
 * - Uses storage abstraction layer (MySQL or in-memory)
 * - Validates all input data with Zod schemas
 * - Provides comprehensive error handling
 * - Supports filtering and searching functionality
 * - Returns consistent JSON responses
 * 
 * @param app - Express application instance
 * @returns HTTP server instance
 */
export async function registerRoutes(app: Express): Promise<Server> {
  
  /**
   * GET /api/blog-posts - Retrieve all blog posts with optional filtering
   * 
   * Query Parameters:
   * - search: Text search across title, content, excerpt, category, tags
   * - status: Filter by post status (draft, published, scheduled)
   * - category: Filter by specific category
   * 
   * Response: Array of BlogPost objects
   * 
   * Used by: Dashboard post table, post listing components
   */
  app.get("/api/blog-posts", async (req, res) => {
    try {
      // Extract query parameters for filtering from request URL
      // req.query contains all query string parameters as an object
      const { search, status, category } = req.query;
      
      // Get all posts from storage layer (MySQL or in-memory)
      // This is the first step - fetch all posts from database
      let posts = await storage.getAllBlogPosts();
      
      // Apply search filter - searches across multiple fields
      // Only apply if search parameter is provided
      if (search) {
        const searchQuery = search as string; // Type assertion for TypeScript
        const lowercaseQuery = searchQuery.toLowerCase(); // Case-insensitive search
        
        // Filter posts that match search query in any of these fields:
        // - title: Post title
        // - content: Main post content
        // - excerpt: Brief description
        // - category: Post category
        // - tags: Array of tags (check if any tag matches)
        posts = posts.filter(post =>
          post.title.toLowerCase().includes(lowercaseQuery) ||
          post.content.toLowerCase().includes(lowercaseQuery) ||
          post.excerpt?.toLowerCase().includes(lowercaseQuery) ||
          post.category?.toLowerCase().includes(lowercaseQuery) ||
          post.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery))
        );
      }
      
      // Apply status filter (draft, published, scheduled)
      // Only apply if status parameter is provided and not "all"
      if (status && status !== "all") {
        posts = posts.filter(post => post.status === status);
      }
      
      // Apply category filter
      // Only apply if category parameter is provided and not "all"
      if (category && category !== "all") {
        posts = posts.filter(post => post.category === category);
      }
      
      // Return filtered posts as JSON response
      // Express automatically sets Content-Type to application/json
      res.json(posts);
    } catch (error) {
      // Handle any storage or processing errors
      // Log error for debugging (in production, use proper logging)
      console.error("Error fetching blog posts:", error);
      
      // Return 500 Internal Server Error with error message
      res.status(500).json({ message: "Failed to fetch blog posts" });
    }
  });

  /**
   * GET /api/blog-posts/stats - Get dashboard statistics
   * 
   * Returns aggregated data for dashboard overview:
   * - Total posts count
   * - Published posts count
   * - Draft posts count
   * - Monthly posts count (current month)
   * 
   * Used by: Dashboard overview cards
   */
  app.get("/api/blog-posts/stats", async (req, res) => {
    try {
      // Get statistics from storage layer
      // This calls the storage.getBlogPostStats() method
      const stats = await storage.getBlogPostStats();
      
      // Return statistics as JSON
      res.json(stats);
    } catch (error) {
      // Handle errors and return 500 status
      console.error("Error fetching blog post stats:", error);
      res.status(500).json({ message: "Failed to fetch blog post stats" });
    }
  });

  /**
   * GET /api/blog-posts/:id - Retrieve a specific blog post by ID
   * 
   * Path Parameters:
   * - id: Blog post ID (integer)
   * 
   * Responses:
   * - 200: BlogPost object
   * - 404: Post not found
   * - 500: Server error
   * 
   * Used by: Edit post page, preview page, individual post display
   */
  app.get("/api/blog-posts/:id", async (req, res) => {
    try {
      // Parse ID from URL parameter
      // req.params contains path parameters (like :id)
      const id = parseInt(req.params.id);
      
      // Validate that ID is a valid number
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid post ID" });
      }
      
      // Fetch post from storage layer using the ID
      const post = await storage.getBlogPost(id);
      
      // Return 404 if post doesn't exist
      if (!post) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      
      // Return post data as JSON
      res.json(post);
    } catch (error) {
      // Handle errors and return 500 status
      console.error("Error fetching blog post:", error);
      res.status(500).json({ message: "Failed to fetch blog post" });
    }
  });

  /**
   * POST /api/blog-posts - Create a new blog post
   * 
   * Request Body: InsertBlogPost object (validated with Zod schema)
   * Required fields: title, content
   * Optional fields: excerpt, category, status, featuredImage, metaDescription, tags, publishDate
   * 
   * Process Flow:
   * 1. Validate request data against schema
   * 2. Create post in storage layer
   * 3. Return created post with assigned ID
   * 
   * Responses:
   * - 201: Created BlogPost object
   * - 400: Validation errors
   * - 500: Server error
   * 
   * Used by: Create post form, draft saving
   */
  app.post("/api/blog-posts", async (req, res) => {
    try {
      // Debug logging for development
      // Log the incoming request body to help with debugging
      console.log("Received blog post data:", JSON.stringify(req.body, null, 2));
      
      // Validate request data against Zod schema
      // This ensures type safety and data integrity
      // If validation fails, Zod throws an error with details
      const validatedData = insertBlogPostSchema.parse(req.body);
      
      // Create post using storage layer
      // This will insert the post into MySQL or in-memory storage
      const post = await storage.createBlogPost(validatedData);
      
      // Return created post with 201 status (Created)
      // 201 is the standard HTTP status for successful resource creation
      res.status(201).json(post);
    } catch (error) {
      // Handle validation errors specifically
      // Zod errors contain detailed information about what failed validation
      if (error instanceof z.ZodError) {
        console.log("Validation errors:", error.errors);
        return res.status(400).json({ 
          message: "Invalid data", 
          errors: error.errors 
        });
      }
      
      // Handle storage or other errors
      console.log("Create blog post error:", error);
      res.status(500).json({ message: "Failed to create blog post" });
    }
  });

  /**
   * PATCH /api/blog-posts/:id - Update an existing blog post
   * 
   * Path Parameters:
   * - id: Blog post ID (integer)
   * 
   * Request Body: Partial InsertBlogPost object (validated with Zod schema)
   * All fields are optional for partial updates
   * 
   * Process Flow:
   * 1. Parse and validate post ID
   * 2. Validate request data against update schema
   * 3. Update post in storage layer
   * 4. Return updated post
   * 
   * Responses:
   * - 200: Updated BlogPost object
   * - 400: Validation errors
   * - 404: Post not found
   * - 500: Server error
   * 
   * Used by: Edit post form, status updates
   */
  app.patch("/api/blog-posts/:id", async (req, res) => {
    try {
      // Parse ID from URL parameter
      const id = parseInt(req.params.id);
      
      // Validate that ID is a valid number
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid post ID" });
      }
      
      // Validate request data against update schema
      // updateBlogPostSchema is the same as insertBlogPostSchema but with .partial()
      // This makes all fields optional for PATCH operations
      const validatedData = updateBlogPostSchema.parse(req.body);
      
      // Update post in storage layer
      const post = await storage.updateBlogPost(id, validatedData);
      
      // Return 404 if post doesn't exist
      if (!post) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      
      // Return updated post as JSON
      res.json(post);
    } catch (error) {
      // Handle validation errors
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      
      // Handle other errors
      console.error("Error updating blog post:", error);
      res.status(500).json({ message: "Failed to update blog post" });
    }
  });

  /**
   * DELETE /api/blog-posts/:id - Delete a blog post
   * 
   * Path Parameters:
   * - id: Blog post ID (integer)
   * 
   * Process Flow:
   * 1. Parse and validate post ID
   * 2. Delete post from storage layer
   * 3. Return success message
   * 
   * Responses:
   * - 200: Success message
   * - 404: Post not found
   * - 500: Server error
   * 
   * Used by: Delete post functionality
   */
  app.delete("/api/blog-posts/:id", async (req, res) => {
    try {
      // Parse ID from URL parameter
      const id = parseInt(req.params.id);
      
      // Validate that ID is a valid number
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid post ID" });
      }
      
      // Delete post from storage layer
      // Returns boolean indicating if deletion was successful
      const deleted = await storage.deleteBlogPost(id);
      
      // Return 404 if post doesn't exist
      if (!deleted) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      
      // Return success message
      res.json({ message: "Blog post deleted successfully" });
    } catch (error) {
      // Handle errors
      console.error("Error deleting blog post:", error);
      res.status(500).json({ message: "Failed to delete blog post" });
    }
  });

  // Create HTTP server from Express app
  // This allows us to start the server and listen on a port
  const httpServer = createServer(app);
  
  // Return the server instance
  // This is used by the main server file to start listening
  return httpServer;
}
