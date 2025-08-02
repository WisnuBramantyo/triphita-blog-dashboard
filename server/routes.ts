import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBlogPostSchema, updateBlogPostSchema, type InsertBlogPost } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Blog post routes
  app.get("/api/blog-posts", async (req, res) => {
    try {
      const { search, status, category } = req.query;
      
      let posts = await storage.getAllBlogPosts();
      
      // Apply search filter
      if (search) {
        const searchQuery = search as string;
        const lowercaseQuery = searchQuery.toLowerCase();
        posts = posts.filter(post =>
          post.title.toLowerCase().includes(lowercaseQuery) ||
          post.content.toLowerCase().includes(lowercaseQuery) ||
          post.excerpt?.toLowerCase().includes(lowercaseQuery) ||
          post.category?.toLowerCase().includes(lowercaseQuery) ||
          post.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery))
        );
      }
      
      // Apply status filter
      if (status && status !== "all") {
        posts = posts.filter(post => post.status === status);
      }
      
      // Apply category filter
      if (category && category !== "all") {
        posts = posts.filter(post => post.category === category);
      }
      
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch blog posts" });
    }
  });

  app.get("/api/blog-posts/stats", async (req, res) => {
    try {
      const stats = await storage.getBlogPostStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch blog post stats" });
    }
  });

  app.get("/api/blog-posts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const post = await storage.getBlogPost(id);
      
      if (!post) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      
      res.json(post);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch blog post" });
    }
  });

  app.post("/api/blog-posts", async (req, res) => {
    try {
      console.log("Received blog post data:", JSON.stringify(req.body, null, 2));
      const validatedData = insertBlogPostSchema.parse(req.body);
      
      const post = await storage.createBlogPost(validatedData);
      res.status(201).json(post);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.log("Validation errors:", error.errors);
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.log("Create blog post error:", error);
      res.status(500).json({ message: "Failed to create blog post" });
    }
  });

  app.patch("/api/blog-posts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = updateBlogPostSchema.parse(req.body);
      const post = await storage.updateBlogPost(id, validatedData);
      
      if (!post) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      
      res.json(post);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update blog post" });
    }
  });

  app.delete("/api/blog-posts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteBlogPost(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      
      res.json({ message: "Blog post deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete blog post" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
