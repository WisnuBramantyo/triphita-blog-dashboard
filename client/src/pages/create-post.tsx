// Import wouter's useLocation hook for programmatic navigation
// wouter is a lightweight router alternative to React Router
import { useLocation } from "wouter";

// Import the sidebar navigation component that appears on the left side
import Sidebar from "@/components/sidebar";

// Import the main form component that handles all post creation logic
import PostForm from "@/components/post-form";

/**
 * CreatePost Component - Page for creating new blog posts
 * 
 * This component serves as the main page container for creating new blog posts.
 * It provides the layout structure and handles navigation after successful post creation.
 * 
 * Key Features:
 * - Full-page layout with sidebar navigation
 * - Header section with page title and description
 * - Scrollable content area to accommodate long forms
 * - Success callback handling for navigation
 */
export default function CreatePost() {
  // useLocation hook from wouter for programmatic navigation
  // We only need setLocation (second element), hence the comma notation
  // This allows us to navigate programmatically after form submission
  const [, setLocation] = useLocation();

  /**
   * Success callback handler
   * Called when the post is successfully created/saved
   * Redirects user back to the dashboard (home page)
   * This function is passed down to the PostForm component
   */
  const handleSuccess = () => {
    // Navigate to the root path ("/") which is the dashboard
    setLocation("/");
  };

  return (
    // Main container - uses flexbox layout with full screen height
    // h-screen = 100vh, bg-gray-50 = light gray background
    <div className="flex h-screen bg-gray-50">
      {/* Left sidebar navigation - fixed width, always visible */}
      <Sidebar />
      
      {/* Main content area - uses flex column layout */}
      {/* flex-1 makes it take remaining width after sidebar */}
      {/* flex flex-col = vertical flexbox layout */}
      {/* overflow-hidden prevents content from spilling outside */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Fixed header section - always visible at top */}
        {/* bg-white = white background, shadow-sm = subtle shadow */}
        {/* border-b border-gray-200 = bottom border */}
        {/* px-6 py-4 = horizontal and vertical padding */}
        {/* flex-shrink-0 = prevents header from shrinking */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex-shrink-0">
          {/* Header content container with flexbox layout */}
          <div className="flex items-center justify-between">
            {/* Left side of header - title and description */}
            <div>
              {/* Main page title - large, bold, dark gray text */}
              <h2 className="text-2xl font-bold text-gray-800">Create New Post</h2>
              {/* Subtitle - smaller, medium gray text */}
              <p className="text-gray-600">Write and publish your blog post</p>
            </div>
            {/* Right side of header - currently empty but available for future features */}
          </div>
        </header>

        {/* Scrollable content area - takes remaining height after header */}
        {/* flex-1 makes it take remaining height, overflow-y-auto enables vertical scrolling */}
        {/* p-6 = padding on all sides for content spacing */}
        <div className="flex-1 p-6 overflow-y-auto">
          {/* PostForm component handles all form logic and submission */}
          {/* onSuccess prop receives our navigation callback */}
          <PostForm onSuccess={handleSuccess} />
        </div>
      </main>
    </div>
  );
}
