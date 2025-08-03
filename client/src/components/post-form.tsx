// React and form handling imports
import { useState } from "react"; // React hook for local component state
import { useForm } from "react-hook-form"; // Powerful form library with validation
import { zodResolver } from "@hookform/resolvers/zod"; // Zod validation integration for react-hook-form
import { useMutation, useQueryClient } from "@tanstack/react-query"; // For API mutations and cache management
import { z } from "zod"; // Runtime type checking and validation

// UI component imports from shadcn/ui - pre-built, accessible components
import { Button } from "@/components/ui/button"; // Reusable button component
import { Input } from "@/components/ui/input"; // Text input component
import { Label } from "@/components/ui/label"; // Form label component
import { Textarea } from "@/components/ui/textarea"; // Multi-line text input
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Dropdown select component
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Card container component

// Custom hooks and utilities
import { useToast } from "@/hooks/use-toast"; // Toast notification system
import { apiRequest } from "@/lib/queryClient"; // Centralized API request helper
import RichTextEditor from "./rich-text-editor"; // WYSIWYG editor component
import type { BlogPost } from "@shared/schema"; // Shared type definitions

/**
 * Zod validation schema for blog post form data
 * This ensures type safety and validation both on frontend and backend
 * 
 * Features:
 * - Required fields: title, content
 * - Optional fields: excerpt, category, featuredImage, metaDescription, tags, publishDate
 * - Status enum with three possible values
 * - Automatic validation error messages
 */
const postSchema = z.object({
  title: z.string().min(1, "Title is required"), // Must be non-empty string
  content: z.string().min(1, "Content is required"), // Must be non-empty string
  excerpt: z.string().optional(), // Optional string field
  category: z.string().optional(), // Optional string field
  status: z.enum(["draft", "published", "scheduled"]).default("draft"), // Must be one of these values
  featuredImage: z.string().optional(), // Optional URL string
  metaDescription: z.string().optional(), // Optional SEO description
  tags: z.array(z.string()).optional(), // Optional array of strings
  publishDate: z.string().optional(), // Optional date string
});

// Infer TypeScript type from Zod schema - ensures consistency
// This creates a type that matches the validation schema exactly
type PostFormData = z.infer<typeof postSchema>;

/**
 * Props interface for PostForm component
 * Supports both create and edit modes
 */
interface PostFormProps {
  post?: BlogPost; // If provided, form operates in edit mode
  onSuccess?: () => void; // Callback after successful save/update
}

/**
 * PostForm Component - Core form for creating and editing blog posts
 * 
 * This component handles both create and edit modes based on whether a 'post' prop is provided.
 * It manages form state, validation, API calls, and user feedback.
 * 
 * Key Features:
 * - Dual mode: Create new posts or edit existing ones
 * - Two submission options: Save as Draft or Publish
 * - Real-time validation with Zod schema
 * - Automatic cache invalidation after successful operations
 * - Toast notifications for user feedback
 * - Rich text editor for content creation
 * - Tag management with comma-separated input
 * - Image URL support for featured images
 * - SEO meta description field
 * - Publish date scheduling
 */
export default function PostForm({ post, onSuccess }: PostFormProps) {
  // Initialize toast notifications for user feedback
  // useToast provides a function to show success/error messages
  const { toast } = useToast();
  
  // React Query client for cache management
  // This allows us to invalidate cached data after mutations
  const queryClient = useQueryClient();
  
  // Local state for tag input (comma-separated string format for user convenience)
  // Users can type "tag1, tag2, tag3" and we'll parse it into an array
  const [tagsInput, setTagsInput] = useState(post?.tags?.join(", ") || "");

  /**
   * React Hook Form setup with Zod validation
   * Handles form state, validation, and submission
   */
  const form = useForm<PostFormData>({
    resolver: zodResolver(postSchema), // Integrate Zod validation
    defaultValues: {
      // Pre-populate form with existing post data (edit mode) or empty values (create mode)
      title: post?.title || "", // Post title or empty string
      content: post?.content || "", // Post content or empty string
      excerpt: post?.excerpt || "", // Post excerpt or empty string
      category: post?.category || "", // Post category or empty string
      status: post?.status as "draft" | "published" | "scheduled" || "draft", // Post status with type assertion
      featuredImage: post?.featuredImage || "", // Featured image URL or empty string
      metaDescription: post?.metaDescription || "", // SEO description or empty string
      tags: post?.tags || [], // Tags array or empty array
      // Convert Date to datetime-local input format (YYYY-MM-DDTHH:MM)
      publishDate: post?.publishDate ? new Date(post.publishDate).toISOString().slice(0, 16) : "",
    },
  });

  /**
   * React Query mutation for creating new blog posts
   * Handles API call, success/error states, and cache updates
   */
  const createMutation = useMutation({
    // API call function - makes POST request to create endpoint
    // apiRequest is a helper that handles HTTP requests and error handling
    mutationFn: (data: PostFormData) => apiRequest("POST", "/api/blog-posts", data),
    
    // Success callback - runs after successful API response
    onSuccess: () => {
      // Invalidate related queries to refresh UI data
      // This ensures the dashboard shows the new post immediately
      queryClient.invalidateQueries({ queryKey: ["/api/blog-posts"] }); // Refresh post list
      queryClient.invalidateQueries({ queryKey: ["/api/blog-posts/stats"] }); // Refresh dashboard stats
      
      // Show success notification to user
      toast({ title: "Success", description: "Blog post created successfully!" });
      
      // Execute parent component callback (usually navigation)
      // The ?. operator safely calls onSuccess if it exists
      onSuccess?.();
    },
    
    // Error callback - runs if API call fails
    onError: () => {
      // Show error notification to user
      toast({ title: "Error", description: "Failed to create blog post" });
    },
  });

  /**
   * React Query mutation for updating existing blog posts
   * Similar to create but uses PATCH method and updates specific post cache
   */
  const updateMutation = useMutation({
    // API call function - makes PATCH request to update endpoint
    // Uses template literal to include the post ID in the URL
    mutationFn: (data: PostFormData) => apiRequest("PATCH", `/api/blog-posts/${post?.id}`, data),
    
    // Success callback
    onSuccess: () => {
      // Invalidate related queries for UI refresh
      queryClient.invalidateQueries({ queryKey: ["/api/blog-posts"] }); // Refresh post list
      queryClient.invalidateQueries({ queryKey: ["/api/blog-posts/stats"] }); // Refresh stats
      queryClient.invalidateQueries({ queryKey: ["/api/blog-posts", post?.id] }); // Refresh specific post
      
      // User feedback
      toast({ title: "Success", description: "Blog post updated successfully!" });
      onSuccess?.();
    },
    
    // Error callback
    onError: () => {
      toast({ title: "Error", description: "Failed to update blog post" });
    },
  });

  /**
   * Form submission handler for publishing posts
   * Called when user clicks "Publish" button
   */
  const onSubmit = (data: PostFormData) => {
    // Parse tags from comma-separated string into array
    // split(",") splits on commas, map(trim) removes whitespace, filter(Boolean) removes empty strings
    const tags = tagsInput.split(",").map(tag => tag.trim()).filter(Boolean);
    
    // Convert publishDate string to Date object if provided
    // This handles the datetime-local input format
    const publishDate = data.publishDate ? new Date(data.publishDate) : null;
    
    // Prepare form data with processed values
    const formData = { 
      ...data, // Spread all form data
      tags: tags.length > 0 ? tags : undefined, // Use tags array or undefined if empty
      publishDate: publishDate ? publishDate.toISOString() : undefined, // Convert to ISO string or undefined
      status: "published" as const // Force status to published
    };

    // Determine which mutation to use based on whether we're editing or creating
    if (post) {
      // If post exists, we're in edit mode - use update mutation
      updateMutation.mutate(formData);
    } else {
      // If no post, we're in create mode - use create mutation
      createMutation.mutate(formData);
    }
  };

  /**
   * Draft saving handler
   * Called when user clicks "Save as Draft" button
   */
  const handleSaveDraft = () => {
    // Get current form values without triggering validation
    const data = form.getValues();
    
    // Parse tags from comma-separated string
    const tags = tagsInput.split(",").map(tag => tag.trim()).filter(Boolean);
    
    // Convert publishDate string to Date object if provided
    const publishDate = data.publishDate ? new Date(data.publishDate) : null;
    
    // Prepare form data with draft status
    const formData = { 
      ...data, // Spread all form data
      tags: tags.length > 0 ? tags : undefined, // Use tags array or undefined if empty
      publishDate: publishDate ? publishDate.toISOString() : undefined, // Convert to ISO string or undefined
      status: "draft" as const // Force status to draft
    };

    // Use appropriate mutation based on mode
    if (post) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  /**
   * Publish handler
   * Called when user clicks "Publish" button (same as onSubmit)
   */
  const handlePublish = () => {
    // Get current form values
    const data = form.getValues();
    
    // Parse tags from comma-separated string
    const tags = tagsInput.split(",").map(tag => tag.trim()).filter(Boolean);
    
    // Convert publishDate string to Date object if provided
    const publishDate = data.publishDate ? new Date(data.publishDate) : null;
    
    // Prepare form data with published status
    const formData = { 
      ...data, // Spread all form data
      tags: tags.length > 0 ? tags : undefined, // Use tags array or undefined if empty
      publishDate: publishDate ? publishDate.toISOString() : undefined, // Convert to ISO string or undefined
      status: "published" as const // Force status to published
    };

    // Use appropriate mutation based on mode
    if (post) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  // Check if any mutation is currently in progress
  // This disables buttons during API calls to prevent double submissions
  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    // Main form container - card with max width and center alignment
    <Card className="w-full max-w-4xl mx-auto">
      {/* Card header with title */}
      <CardHeader>
        <CardTitle>{post ? "Edit Post" : "Create New Post"}</CardTitle>
      </CardHeader>
      
      {/* Card content - contains the actual form */}
      <CardContent>
        {/* Form element with React Hook Form integration */}
        {/* form.handleSubmit(onSubmit) wraps our submission handler */}
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* First row - Title and Category fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Title field */}
            <div>
              <Label htmlFor="title">Post Title*</Label>
              <Input
                id="title"
                {...form.register("title")} // Register with React Hook Form
                placeholder="Enter post title"
                className="mt-2"
              />
              {/* Display validation error if title field has errors */}
              {form.formState.errors.title && (
                <p className="text-sm text-red-600 mt-1">{form.formState.errors.title.message}</p>
              )}
            </div>
            
            {/* Category dropdown */}
            <div>
              <Label htmlFor="category">Category</Label>
              <Select 
                value={form.watch("category")} // Watch category value for controlled component
                onValueChange={(value) => form.setValue("category", value)} // Update form value
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="travel">Travel</SelectItem>
                  <SelectItem value="food">Food</SelectItem>
                  <SelectItem value="culture">Culture</SelectItem>
                  <SelectItem value="lifestyle">Lifestyle</SelectItem>
                  <SelectItem value="adventure">Adventure</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Second row - Featured Image and Publish Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Featured Image URL field */}
            <div>
              <Label htmlFor="featuredImage">Featured Image URL</Label>
              <Input
                id="featuredImage"
                {...form.register("featuredImage")} // Register with React Hook Form
                placeholder="https://example.com/image.jpg"
                className="mt-2"
              />
            </div>
            
            {/* Publish Date field - datetime-local input type */}
            <div>
              <Label htmlFor="publishDate">Publish Date</Label>
              <Input
                id="publishDate"
                type="datetime-local" // HTML5 datetime input
                {...form.register("publishDate")} // Register with React Hook Form
                className="mt-2"
              />
            </div>
          </div>

          {/* Excerpt field - multi-line text area */}
          <div>
            <Label htmlFor="excerpt">Excerpt</Label>
            <Textarea
              id="excerpt"
              {...form.register("excerpt")} // Register with React Hook Form
              placeholder="Brief description of the post..."
              className="mt-2"
              rows={3} // Set number of visible rows
            />
          </div>

          {/* Content field - Rich Text Editor */}
          <div>
            <Label htmlFor="content">Content*</Label>
            <RichTextEditor
              value={form.watch("content")} // Watch content value
              onChange={(content) => form.setValue("content", content)} // Update form value
              className="mt-2"
            />
            {/* Display validation error if content field has errors */}
            {form.formState.errors.content && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.content.message}</p>
            )}
          </div>

          {/* SEO Meta Description field */}
          <div>
            <Label htmlFor="metaDescription">SEO Meta Description</Label>
            <Textarea
              id="metaDescription"
              {...form.register("metaDescription")} // Register with React Hook Form
              placeholder="Enter meta description for SEO..."
              className="mt-2"
              rows={3} // Set number of visible rows
            />
          </div>

          {/* Tags field - comma-separated input */}
          <div>
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              value={tagsInput} // Use local state for tags input
              onChange={(e) => setTagsInput(e.target.value)} // Update local state
              placeholder="Enter tags separated by commas"
              className="mt-2"
            />
          </div>

          {/* Form action buttons */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t">
            {/* Save as Draft button */}
            <Button
              type="button" // Not a submit button
              variant="outline" // Secondary button style
              onClick={handleSaveDraft} // Call draft save handler
              disabled={isLoading} // Disable during API calls
            >
              Save as Draft
            </Button>
            
            {/* Publish button - triggers form submission */}
            <Button
              type="submit" // Submit button - triggers form.handleSubmit(onSubmit)
              disabled={isLoading} // Disable during API calls
            >
              {isLoading ? "Publishing..." : "Publish"} {/* Show loading text */}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
