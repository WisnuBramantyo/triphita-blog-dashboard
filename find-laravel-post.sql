-- SQL query to find the blog post in Laravel's database
-- Replace 'your_laravel_database' with your actual Laravel database name
-- (Check Laravel's .env file for DB_DATABASE value)

-- Option 1: If table is named 'blogs'
SELECT * FROM blogs WHERE slug = 'muuuuuaaaaay-2nd-amazing-blog-post';

-- Option 2: If table is named 'blog_posts'  
SELECT * FROM blog_posts WHERE slug = 'muuuuuaaaaay-2nd-amazing-blog-post';

-- Option 3: Search by title
SELECT * FROM blogs WHERE title LIKE '%muuuuuaaaaay%';

-- Option 4: List all blogs to find it
SELECT id, title, slug, created_at FROM blogs ORDER BY id DESC LIMIT 10;


