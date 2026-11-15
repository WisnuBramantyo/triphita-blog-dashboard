/**
 * Laravel API Synchronization Helper
 * 
 * This module handles sending blog posts to the Laravel website API
 * when posts are created or updated via the dashboard API.
 */

const LARAVEL_API_URL = process.env.LARAVEL_API_URL || 'http://127.0.0.1:8000';
const LARAVEL_API_ENDPOINT = '/api/v1/blogs';

/**
 * Transform dashboard post data to Laravel API format
 */
function transformToLaravelFormat(postData: any): any {
  const apiData: any = {
    title: postData.title,
    content: postData.content,
    status: postData.status || 'published',
  };
  
  // Only include optional fields if they have values
  if (postData.excerpt) apiData.excerpt = postData.excerpt;
  if (postData.category) apiData.category = postData.category;
  if (postData.featuredImage) apiData.featured_image = postData.featuredImage; // snake_case for API
  if (postData.metaDescription) apiData.meta_description = postData.metaDescription; // snake_case for API
  if (postData.tags && Array.isArray(postData.tags) && postData.tags.length > 0) {
    apiData.tags = postData.tags;
  }
  if (postData.publishDate) {
    // Convert to ISO string if it's a Date object
    apiData.publish_date = postData.publishDate instanceof Date 
      ? postData.publishDate.toISOString() 
      : postData.publishDate;
  }
  
  return apiData;
}

/**
 * Send blog post to Laravel API
 * 
 * @param postData - Blog post data from dashboard
 * @param isEdit - Whether this is an edit operation
 * @param postSlug - Laravel post slug (for updates)
 * @returns Laravel API response with id and slug
 */
export async function syncToLaravel(
  postData: any,
  isEdit: boolean = false,
  postSlug?: string
): Promise<{ laravelPostId?: number; laravelPostSlug?: string }> {
  const apiUrl = `${LARAVEL_API_URL}${LARAVEL_API_ENDPOINT}`;
  let url = apiUrl;
  let method = 'POST';
  
  // For edits, use PUT with slug
  if (isEdit && postSlug) {
    url = `${apiUrl}/${postSlug}`;
    method = 'PUT';
    console.log(`[Laravel Sync] Updating post with slug: ${postSlug}`);
  } else if (isEdit && !postSlug) {
    // Try to find existing post by title
    console.log('[Laravel Sync] No slug found, searching for existing post...');
    try {
      const searchResponse = await fetch(apiUrl);
      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        const posts = searchData.data?.data || searchData.data || searchData;
        const existingPost = Array.isArray(posts)
          ? posts.find((p: any) => 
              p.title === postData.title || 
              p.title?.toLowerCase() === postData.title?.toLowerCase()
            )
          : null;
        
        if (existingPost && existingPost.slug) {
          postSlug = existingPost.slug;
          url = `${apiUrl}/${postSlug}`;
          method = 'PUT';
          console.log(`[Laravel Sync] Found existing post with slug: ${postSlug}`);
        }
      }
    } catch (e) {
      console.warn('[Laravel Sync] Could not search for existing post:', e);
    }
  } else {
    console.log('[Laravel Sync] Creating new post');
  }
  
  const apiData = transformToLaravelFormat(postData);
  
  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(apiData),
    });
    
    const responseText = await response.text();
    
    if (!response.ok) {
      console.error(`[Laravel Sync] Error ${response.status}:`, responseText);
      throw new Error(`Laravel API error: ${response.status} - ${responseText.substring(0, 200)}`);
    }
    
    const result = JSON.parse(responseText);
    const laravelData = result.data || result;
    
    return {
      laravelPostId: laravelData.id,
      laravelPostSlug: laravelData.slug,
    };
  } catch (error) {
    console.error('[Laravel Sync] Failed to sync to Laravel:', error);
    throw error;
  }
}


