// React and form handling imports
import { useState } from "react";
import { useForm } from "react-hook-form"; // Powerful form library with validation
import { zodResolver } from "@hookform/resolvers/zod"; // Zod validation integration for react-hook-form
import { useMutation, useQueryClient } from "@tanstack/react-query"; // For API mutations and cache management
import { z } from "zod"; // Runtime type checking and validation

// UI component imports from shadcn/ui
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  excerpt: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(["draft", "published", "scheduled"]).default("draft"),
  featuredImage: z.string().optional(),
  metaDescription: z.string().optional(),
  tags: z.array(z.string()).optional(),
  publishDate: z.string().optional(),
});

// Infer TypeScript type from Zod schema - ensures consistency
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
  const { toast } = useToast();
  
  // React Query client for cache management
  const queryClient = useQueryClient();
  
  // Local state for tag input (comma-separated string format for user convenience)
  const [tagsInput, setTagsInput] = useState(post?.tags?.join(", ") || "");

  /**
   * React Hook Form setup with Zod validation
   * Handles form state, validation, and submission
   */
  const form = useForm<PostFormData>({
    resolver: zodResolver(postSchema), // Integrate Zod validation
    defaultValues: {
      // Pre-populate form with existing post data (edit mode) or empty values (create mode)
      title: post?.title || "",
      content: post?.content || "",
      excerpt: post?.excerpt || "",
      category: post?.category || "",
      status: post?.status as "draft" | "published" | "scheduled" || "draft",
      featuredImage: post?.featuredImage || "",
      metaDescription: post?.metaDescription || "",
      tags: post?.tags || [],
      // Convert Date to datetime-local input format
      publishDate: post?.publishDate ? new Date(post.publishDate).toISOString().slice(0, 16) : "",
    },
  });

  /**
   * React Query mutation for creating new blog posts
   * Handles API call, success/error states, and cache updates
   */
  const createMutation = useMutation({
    // API call function - makes POST request to create endpoint
    mutationFn: (data: PostFormData) => apiRequest("POST", "/api/blog-posts", data),
    
    // Success callback - runs after successful API response
    onSuccess: () => {
      // Invalidate related queries to refresh UI data
      queryClient.invalidateQueries({ queryKey: ["/api/blog-posts"] }); // Refresh post list
      queryClient.invalidateQueries({ queryKey: ["/api/blog-posts/stats"] }); // Refresh dashboard stats
      
      // Show success notification
      toast({ title: "Success", description: "Blog post created successfully!" });
      
      // Execute parent component callback (usually navigation)
      onSuccess?.();
    },
    
    // Error callback - runs if API call fails
    onError: () => {
      toast({ title: "Error", description: "Failed to create blog post" });
    },
  });

  /**
   * React Query mutation for updating existing blog posts
   * Similar to create but uses PATCH method and updates specific post cache
   */
  const updateMutation = useMutation({
    // API call function - makes PATCH request to update endpoint
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
    
    onError: () => {
      toast({ title: "Error", description: "Failed to update blog post" });
    },
  });

  const onSubmit = (data: PostFormData) => {
    // Parse tags from comma-separated string
    const tags = tagsInput.split(",").map(tag => tag.trim()).filter(Boolean);
    
    // Convert publishDate string to Date object if provided
    const publishDate = data.publishDate ? new Date(data.publishDate) : null;
    
    const formData = { 
      ...data, 
      tags: tags.length > 0 ? tags : null,
      publishDate,
      status: "published" as const 
    };

    if (post) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleSaveDraft = () => {
    const data = form.getValues();
    const tags = tagsInput.split(",").map(tag => tag.trim()).filter(Boolean);
    const publishDate = data.publishDate ? new Date(data.publishDate) : null;
    
    const formData = { 
      ...data, 
      tags: tags.length > 0 ? tags : null,
      publishDate,
      status: "draft" as const 
    };

    if (post) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const handlePublish = () => {
    const data = form.getValues();
    const tags = tagsInput.split(",").map(tag => tag.trim()).filter(Boolean);
    const publishDate = data.publishDate ? new Date(data.publishDate) : null;
    
    const formData = { 
      ...data, 
      tags: tags.length > 0 ? tags : null,
      publishDate,
      status: "published" as const 
    };

    if (post) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{post ? "Edit Post" : "Create New Post"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="title">Post Title*</Label>
              <Input
                id="title"
                {...form.register("title")}
                placeholder="Enter post title"
                className="mt-2"
              />
              {form.formState.errors.title && (
                <p className="text-sm text-red-600 mt-1">{form.formState.errors.title.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select 
                value={form.watch("category")} 
                onValueChange={(value) => form.setValue("category", value)}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="featuredImage">Featured Image URL</Label>
              <Input
                id="featuredImage"
                {...form.register("featuredImage")}
                placeholder="https://example.com/image.jpg"
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="publishDate">Publish Date</Label>
              <Input
                id="publishDate"
                type="datetime-local"
                {...form.register("publishDate")}
                className="mt-2"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="excerpt">Excerpt</Label>
            <Textarea
              id="excerpt"
              {...form.register("excerpt")}
              placeholder="Brief description of the post..."
              className="mt-2"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="content">Content*</Label>
            <RichTextEditor
              value={form.watch("content")}
              onChange={(content) => form.setValue("content", content)}
              className="mt-2"
            />
            {form.formState.errors.content && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.content.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="metaDescription">SEO Meta Description</Label>
            <Textarea
              id="metaDescription"
              {...form.register("metaDescription")}
              placeholder="Enter meta description for SEO..."
              className="mt-2"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="Enter tags separated by commas"
              className="mt-2"
            />
          </div>

          <div className="flex items-center justify-end space-x-4 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleSaveDraft}
              disabled={isLoading}
            >
              Save as Draft
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "Publishing..." : "Publish"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
