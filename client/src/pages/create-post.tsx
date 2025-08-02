import { useLocation } from "wouter";
import Sidebar from "@/components/sidebar";
import PostForm from "@/components/post-form";

export default function CreatePost() {
  const [, setLocation] = useLocation();

  const handleSuccess = () => {
    setLocation("/");
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Create New Post</h2>
              <p className="text-gray-600">Write and publish your blog post</p>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <PostForm onSuccess={handleSuccess} />
        </div>
      </main>
    </div>
  );
}
