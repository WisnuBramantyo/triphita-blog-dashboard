import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, CheckCircle, Edit, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { mergeQueryFetchSignal } from "@/lib/queryClient";

type BlogStats = {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  monthlyPosts: number;
};

export default function StatsCards() {
  const { data: stats, isPending, isError, error, refetch } = useQuery({
    queryKey: ["/api/blog-posts/stats"],
    queryFn: async ({ signal }) => {
      const res = await fetch("/api/blog-posts/stats", {
        credentials: "include",
        signal: mergeQueryFetchSignal(signal, 30_000),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Failed to load stats (${res.status})`);
      }
      return res.json() as Promise<BlogStats>;
    },
  });

  if (isError) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
          <span>
            {error instanceof Error ? error.message : "Could not load statistics."}
          </span>
          <button
            type="button"
            className="text-sm underline font-medium"
            onClick={() => void refetch()}
          >
            Retry
          </button>
        </AlertDescription>
      </Alert>
    );
  }

  if (isPending) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-16" />
                </div>
                <Skeleton className="h-12 w-12 rounded-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statsData = [
    {
      title: "Total Posts",
      value: stats?.totalPosts || 0,
      icon: FileText,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Published",
      value: stats?.publishedPosts || 0,
      icon: CheckCircle,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      title: "Drafts",
      value: stats?.draftPosts || 0,
      icon: Edit,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      title: "This Month",
      value: stats?.monthlyPosts || 0,
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
      {statsData.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
