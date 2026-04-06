import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

/**
 * Post blog data to Laravel website API
 * This function sends blog posts to your Laravel website's API endpoint
 * 
 * @param blogData - The blog post data to send
 * @param isEdit - Whether this is an edit operation (true) or create (false)
 * @param postSlug - The slug of the post being edited (only needed for edits)
 * @returns Promise with the API response
 */
export async function postToBlogWebsite(blogData: any, isEdit: boolean = false, postSlug?: string) {
  // Import the config dynamically to avoid circular dependencies
  const { getBlogsApiUrl } = await import('./config');
  let apiUrl = getBlogsApiUrl();
  
  // Use PUT for edits, POST for creates
  let method = 'POST';
  
  // For edits, try to find the existing post if slug is not provided
  if (isEdit && !postSlug) {
    console.log('No Laravel post slug found, searching for existing post by title...');
    try {
      // Try to find existing post by fetching all posts and matching by title
      const searchResponse = await fetch(apiUrl);
      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        const posts = searchData.data?.data || searchData.data || searchData;
        const existingPost = Array.isArray(posts) 
          ? posts.find((p: any) => p.title === blogData.title || p.title?.toLowerCase() === blogData.title?.toLowerCase())
          : null;
        
        if (existingPost && existingPost.slug) {
          postSlug = existingPost.slug;
          console.log(`Found existing Laravel post with slug: ${postSlug}`);
        }
      }
    } catch (e) {
      console.warn('Could not search for existing post:', e);
    }
  }
  
  // For edits, append the post slug to the URL and use PUT method
  if (isEdit && postSlug) {
    apiUrl = `${apiUrl}/${postSlug}`;
    method = 'PUT';
    console.log(`Updating post with Laravel slug ${postSlug}`);
  } else if (isEdit && !postSlug) {
    console.log('No Laravel post slug found, creating new post instead of updating');
  } else {
    console.log('Creating new post');
  }
  
  // Transform the data to match your API's expected format
  const apiData: any = {
    title: blogData.title,
    content: blogData.content,
    status: blogData.status,
  };
  
  // Only include optional fields if they have values
  if (blogData.excerpt) apiData.excerpt = blogData.excerpt;
  if (blogData.category) apiData.category = blogData.category;
  if (blogData.featuredImage) apiData.featured_image = blogData.featuredImage; // Note: snake_case for API
  if (blogData.metaDescription) apiData.meta_description = blogData.metaDescription; // Note: snake_case for API
  if (blogData.tags && blogData.tags.length > 0) apiData.tags = blogData.tags;
  if (blogData.publishDate) apiData.publish_date = blogData.publishDate; // Note: snake_case for API
  
  console.log('Calling Laravel API:', apiUrl);
  console.log('Method:', method);
  console.log('Data:', apiData);
  
  const res = await fetch(apiUrl, {
    method: method,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(apiData)
  });

  // Read response body once (can only be read once)
  const responseText = await res.text();
  console.log('Laravel API response status:', res.status);
  console.log('Laravel API response:', responseText);

  if (!res.ok) {
    // Try to parse as JSON first, fallback to text if it fails
    let errorMessage = `HTTP ${res.status} Error`;
    
    try {
      const errorJson = JSON.parse(responseText);
      errorMessage = errorJson.message || errorJson.error || errorMessage;
    } catch {
      errorMessage = responseText.substring(0, 200);
    }
    
    console.error('Laravel API error:', errorMessage);
    throw new Error(errorMessage);
  }

  // Parse response as JSON
  let response;
  try {
    response = JSON.parse(responseText);
  } catch (e) {
    console.error('Failed to parse Laravel API response as JSON:', e);
    throw new Error('Invalid JSON response from Laravel API');
  }
  
  // Return the Laravel post ID and slug for both creates and updates
  if (response.data && response.data.id) {
    return { 
      ...response, 
      laravelPostId: response.data.id,
      laravelPostSlug: response.data.slug
    };
  }
  
  return response;
}

/** Combines React Query cancellation with a hard timeout so hung APIs do not load forever. */
export function mergeQueryFetchSignal(
  querySignal: AbortSignal | undefined,
  timeoutMs: number,
): AbortSignal | undefined {
  const hasTimeout = typeof AbortSignal !== "undefined" && "timeout" in AbortSignal;
  const hasAny = typeof AbortSignal !== "undefined" && "any" in AbortSignal;
  if (hasTimeout && hasAny) {
    const timeoutSig = AbortSignal.timeout(timeoutMs);
    if (querySignal) {
      return AbortSignal.any([querySignal, timeoutSig]);
    }
    return timeoutSig;
  }
  return querySignal;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey, signal }) => {
    const url = queryKey.join("/") as string;
    const res = await fetch(url, {
      credentials: "include",
      signal: mergeQueryFetchSignal(signal, 30_000),
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true, // Refetch when window regains focus (helps see new posts from Postman)
      staleTime: 30000, // Consider data stale after 30 seconds (allows manual refresh to work)
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
