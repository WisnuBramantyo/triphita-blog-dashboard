import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";
import { fileURLToPath } from "url";

/**
 * Vite Development Server Integration
 * 
 * This module provides integration between Express.js and Vite development server.
 * It handles both development mode (with hot module replacement) and production mode
 * (serving static files) for the React frontend application.
 */

// Get the directory path for ES modules compatibility
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const viteLogger = createLogger();

/**
 * Custom Logging Function
 * 
 * Provides formatted logging with timestamps and source identification.
 * Used throughout the application for consistent log output.
 * 
 * @param message - The log message to display
 * @param source - The source of the log (defaults to "express")
 */
export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

/**
 * Setup Vite Development Server
 * 
 * Configures and integrates Vite development server with Express.js.
 * This function is called only in development mode and provides:
 * - Hot Module Replacement (HMR) for instant updates
 * - Middleware integration for serving React app
 * - HTML template processing with cache busting
 * 
 * @param app - Express application instance
 * @param server - HTTP server instance for HMR WebSocket
 */
export async function setupVite(app: Express, server: Server) {
  // Configure Vite server options for development mode
  const serverOptions = {
    middlewareMode: true, // Run Vite in middleware mode
    hmr: { server }, // Enable Hot Module Replacement with WebSocket server
    allowedHosts: true as const, // Allow all hosts for development
  };

  // Create and configure Vite development server
  const vite = await createViteServer({
    ...viteConfig, // Spread the main Vite configuration
    configFile: false, // Don't look for vite.config.js since we're passing config directly
    customLogger: {
      ...viteLogger, // Use default Vite logger
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1); // Exit process on Vite errors
      },
    },
    server: serverOptions, // Apply server configuration
    appType: "custom", // Custom app type for Express integration
  });

  // Integrate Vite middleware into Express app
  // This handles all Vite-specific requests (JS, CSS, assets, etc.)
  app.use(vite.middlewares);

  /**
   * Universal Route Handler for SPA
   * 
   * Handles all routes that don't match API endpoints or static files.
   * This enables client-side routing for the React application.
   * 
   * Process:
   * 1. Reads the HTML template from disk
   * 2. Adds cache-busting parameter to main.tsx
   * 3. Transforms the HTML through Vite's build pipeline
   * 4. Serves the processed HTML
   */
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      // Resolve path to the client's index.html template
      const clientTemplate = path.resolve(
        __dirname,
        "..",
        "client",
        "index.html",
      );

      // Always reload the index.html file from disk in case it changes during development
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      
      // Add cache-busting parameter to prevent browser caching of main.tsx
      // This ensures hot reloads work properly during development
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      
      // Transform the HTML template through Vite's build pipeline
      // This processes any Vite-specific syntax and optimizations
      const page = await vite.transformIndexHtml(url, template);
      
      // Serve the processed HTML with proper content type
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      // Fix stack traces for better error reporting in development
      vite.ssrFixStacktrace(e as Error);
      next(e); // Pass error to Express error handler
    }
  });
}

/**
 * Serve Static Files (Production Mode)
 * 
 * Serves the built React application from the dist/public directory.
 * This function is called in production mode after the client has been built.
 * 
 * Features:
 * - Serves static assets (JS, CSS, images) with proper caching
 * - Fallback to index.html for client-side routing
 * - Error handling for missing build directory
 * 
 * @param app - Express application instance
 */
export function serveStatic(app: Express) {
  // Resolve path to the built static files directory
  const distPath = path.resolve(__dirname, "public");

  // Check if the build directory exists
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Serve static files from the dist/public directory
  // This includes all built assets (JS, CSS, images, etc.)
  app.use(express.static(distPath));

  /**
   * SPA Fallback Handler
   * 
   * Handles all routes that don't match static files.
   * Serves index.html for client-side routing to work properly.
   * This enables React Router or similar client-side routing.
   */
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
