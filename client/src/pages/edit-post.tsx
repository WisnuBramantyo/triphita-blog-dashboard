import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Sidebar from "@/components/sidebar";
import PostForm from "@/components/post-form";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BlogPost } from "@shared/schema";

export default function EditPost() {
  const [location, setLocation] = useLocation();
  const postId = location.split("/")[2];

  const { data: post, isLoading, error } = useQuery({
    queryKey: ["/api/blog-posts", postId],
    queryFn: async () => {
      const response = await fetch(`/api/blog-posts/${postId}`);
      if (!response.ok) throw new Error("Failed to fetch post");
      return response.json();
    },
  });

  const handleSuccess = () => {
    setLocation("/");
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Edit Post</h2>
                <p className="text-gray-600">Update your blog post</p>
              </div>
            </div>
          </header>
          <div className="flex-1 p-6 overflow-y-auto">
            <Card className="w-full max-w-4xl mx-auto">
              <CardHeader>
                <CardTitle><Skeleton className="h-6 w-32" /></CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Edit Post</h2>
                <p className="text-gray-600">Update your blog post</p>
              </div>
            </div>
          </header>
          <div className="flex-1 p-6 overflow-y-auto">
            <Card className="w-full max-w-4xl mx-auto">
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-red-600">Failed to load blog post</p>
                  <button 
                    onClick={() => setLocation("/")}
                    className="mt-4 text-primary hover:underline"
                  >
                    Go back to dashboard
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Edit Post</h2>
              <p className="text-gray-600">Update your blog post</p>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <PostForm post={post} onSuccess={handleSuccess} />
        </div>
      </main>
    </div>
  );
}
