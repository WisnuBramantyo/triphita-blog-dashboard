/**
 * Configuration file for external API endpoints
 * Update these values to match your Laravel website configuration
 */

export const config = {
  // Blog website configuration (API endpoint)
  blogWebsite: {
    // Update this URL to match your blog website domain
    baseUrl: 'http://127.0.0.1:8000', // Laravel website URL
    endpoints: {
      blogs: '/api/v1/blogs', // Correct API endpoint - matches your Laravel routes
    }
  },
  
  // Blog dashboard configuration
  dashboard: {
    baseUrl: 'http://localhost:3001',
  }
};

/**
 * Helper function to build blog website URLs
 */
export function getBlogWebsiteUrl(endpoint: string): string {
  return `${config.blogWebsite.baseUrl}${endpoint}`;
}

/**
 * Get the full URL for the blogs API endpoint
 */
export function getBlogsApiUrl(): string {
  return getBlogWebsiteUrl(config.blogWebsite.endpoints.blogs);
}


