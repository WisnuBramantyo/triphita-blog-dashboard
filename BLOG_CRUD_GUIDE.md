# Blog CRUD Postman Collection Guide

## File Created
- `Blog_CRUD.postman_collection.json` - Postman collection with Create, Edit, and Delete operations

## How to Import

1. Open Postman
2. Click **Import** button (top left)
3. Drag and drop `Blog_CRUD.postman_collection.json`
4. Click **Import**

## Collection Contents

### 📝 Create Operations
- **Create Blog Post** - Full example with all fields
- **Create Blog Post (Minimal)** - Only required fields (title, content, status)

### ✏️ Edit Operations
- **Edit Blog Post (Full Update)** - Update all fields
- **Edit Blog Post (Partial Update)** - Update only specific fields

### 🗑️ Delete Operations
- **Delete Blog Post** - Delete by slug

### 📖 Read Operations (Bonus)
- **Get Blog Post by Slug** - Get single post
- **Get All Blog Posts** - List all posts

## Collection Variables

The collection includes these variables:

- `base_url` - Default: `http://127.0.0.1:8000`
- `blog_slug` - Automatically set when you create a post
- `blog_id` - Automatically set when you create a post

## Quick Start Workflow

### 1. Create a Post
1. Run **"Create Blog Post"** request
2. The slug will be automatically saved to `{{blog_slug}}` variable
3. Check the response to see the created post

### 2. Edit the Post
1. Run **"Edit Blog Post (Partial Update)"** or **"Edit Blog Post (Full Update)"**
2. It will automatically use the slug from step 1
3. Modify the JSON body to change what you want

### 3. Delete the Post
1. Run **"Delete Blog Post"** request
2. It will automatically use the slug from step 1
3. The post will be deleted from Laravel

## Example Workflow

```bash
# 1. Create
POST http://127.0.0.1:8000/api/v1/blogs
→ Saves slug to {{blog_slug}}

# 2. Edit
PUT http://127.0.0.1:8000/api/v1/blogs/{{blog_slug}}
→ Uses saved slug

# 3. Delete
DELETE http://127.0.0.1:8000/api/v1/blogs/{{blog_slug}}
→ Uses saved slug
```

## Request Examples

### Create (POST)
```json
{
  "title": "My Blog Post",
  "content": "Blog content here",
  "excerpt": "Brief description",
  "category": "travel",
  "status": "published",
  "featured_image": "https://example.com/image.jpg",
  "meta_description": "SEO description",
  "tags": ["travel", "adventure"],
  "publish_date": "2025-01-15T10:00:00.000Z"
}
```

### Edit (PUT)
```json
{
  "title": "Updated Title",
  "content": "Updated content",
  "status": "published"
}
```

### Delete (DELETE)
- No body needed
- Uses slug from URL: `/api/v1/blogs/{slug}`

## Features

### ✨ Auto-Slug Detection
The "Create Blog Post" request automatically:
- Extracts the `slug` from the response
- Stores it in `blog_slug` variable
- Makes it available for Edit/Delete requests

### 🔄 Manual Slug Setup
If you want to edit/delete an existing post:
1. Click on collection name → **Variables** tab
2. Set `blog_slug` to your post's slug (e.g., `my-blog-post`)
3. Click **Save**

## Status Values
- `"draft"` - Post is saved but not published
- `"published"` - Post is live and visible
- `"scheduled"` - Post is scheduled for future

## Category Values
- `"travel"`
- `"food"`
- `"culture"`
- `"lifestyle"`
- `"adventure"`

## Troubleshooting

### Variables Not Working
- Make sure you've saved the collection after editing variables
- Check that variable names match exactly: `{{base_url}}`, `{{blog_slug}}`

### Slug Not Auto-Setting
- Make sure your Laravel API returns the slug in `data.slug`
- Check the response format matches: `{"data": {"slug": "..."}}`

### 404 Errors
- Verify the slug exists in your Laravel database
- Check that you're using the correct slug (not the ID)

### 500 Errors
- Verify your Laravel server is running
- Check that the Laravel controller generates slugs automatically
- Check Laravel logs: `storage/logs/laravel.log`

## Tips

1. **Test Sequence**: Create → Edit → Delete
2. **Use Variables**: The collection automatically manages slugs for you
3. **Check Responses**: Always check the API response to see what was created/updated
4. **Error Messages**: Read error messages in the response body for debugging

Enjoy testing! 🚀


