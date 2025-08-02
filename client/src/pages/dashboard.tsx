import Sidebar from "@/components/sidebar";
import StatsCards from "@/components/stats-cards";
import PostTable from "@/components/post-table";
import { useLocation } from "wouter";

export default function Dashboard() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split("?")[1]);
  const statusFilter = searchParams.get("status") || "all";

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Blog Management</h2>
              <p className="text-gray-600">Manage your blog posts and content</p>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-6 h-full overflow-auto">
          <StatsCards />
          <PostTable statusFilter={statusFilter} />
        </div>
      </main>
    </div>
  );
}
