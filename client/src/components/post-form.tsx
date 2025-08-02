import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import RichTextEditor from "./rich-text-editor";
import type { BlogPost } from "@shared/schema";

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

type PostFormData = z.infer<typeof postSchema>;

interface PostFormProps {
  post?: BlogPost;
  onSuccess?: () => void;
}

export default function PostForm({ post, onSuccess }: PostFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tagsInput, setTagsInput] = useState(post?.tags?.join(", ") || "");

  const form = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: post?.title || "",
      content: post?.content || "",
      excerpt: post?.excerpt || "",
      category: post?.category || "",
      status: post?.status as "draft" | "published" | "scheduled" || "draft",
      featuredImage: post?.featuredImage || "",
      metaDescription: post?.metaDescription || "",
      tags: post?.tags || [],
      publishDate: post?.publishDate ? new Date(post.publishDate).toISOString().slice(0, 16) : "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: PostFormData) => apiRequest("POST", "/api/blog-posts", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blog-posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/blog-posts/stats"] });
      toast({ title: "Success", description: "Blog post created successfully!" });
      onSuccess?.();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create blog post" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: PostFormData) => apiRequest("PATCH", `/api/blog-posts/${post?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blog-posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/blog-posts/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/blog-posts", post?.id] });
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
                  <SelectItem value="sustainability">Sustainability</SelectItem>
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
