-- Migration: Add Laravel integration fields to blog_posts table
-- Run this SQL to add laravel_post_id and laravel_post_slug columns

USE triphita_blog;

-- Add Laravel post ID column (nullable, unique)
-- Note: If column already exists, you'll get an error - that's okay, just ignore it
ALTER TABLE blog_posts 
ADD COLUMN laravel_post_id INT UNIQUE;

-- Add Laravel post slug column (nullable, unique, max 255 chars)
-- Note: If column already exists, you'll get an error - that's okay, just ignore it
ALTER TABLE blog_posts 
ADD COLUMN laravel_post_slug VARCHAR(255) UNIQUE;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_laravel_post_id ON blog_posts(laravel_post_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_laravel_post_slug ON blog_posts(laravel_post_slug);

