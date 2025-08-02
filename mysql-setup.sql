-- MySQL Database Setup for Triphita Blog Dashboard
-- Run this script to create the database and tables

CREATE DATABASE IF NOT EXISTS triphita_blog;
USE triphita_blog;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  password TEXT NOT NULL
);

-- Blog posts table
CREATE TABLE IF NOT EXISTS blog_posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  category VARCHAR(100),
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  featured_image TEXT,
  meta_description TEXT,
  tags JSON,
  publish_date TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Add indexes for better performance
CREATE INDEX idx_blog_posts_status ON blog_posts(status);
CREATE INDEX idx_blog_posts_category ON blog_posts(category);
CREATE INDEX idx_blog_posts_created_at ON blog_posts(created_at);
CREATE INDEX idx_blog_posts_publish_date ON blog_posts(publish_date);

-- Insert sample data
INSERT INTO blog_posts (title, content, excerpt, category, status, featured_image, meta_description, tags, publish_date) VALUES
(
  'Ultimate Guide to Hiking in the Swiss Alps',
  'Discover breathtaking trails and hidden gems in the Swiss Alps. This comprehensive guide covers everything from beginner-friendly paths to challenging mountain routes.',
  'Discover breathtaking trails and hidden gems...',
  'Travel',
  'published',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600',
  'Complete guide to hiking in the Swiss Alps with trail recommendations and tips',
  '["hiking", "switzerland", "alps", "travel"]',
  '2023-12-15 10:00:00'
),
(
  'Food Adventures in Tokyo''s Street Markets',
  'Explore authentic Japanese cuisine and culture through Tokyo''s vibrant street food scene. From traditional ramen to modern fusion dishes.',
  'Explore authentic Japanese cuisine and culture...',
  'Food',
  'draft',
  'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600',
  'Discover Tokyo''s best street food markets and hidden culinary gems',
  '["food", "tokyo", "japan", "street food"]',
  '2023-12-12 09:00:00'
),
(
  'Hidden Gems of the Greek Islands',
  'Discover secluded beaches and ancient ruins away from the tourist crowds. These lesser-known Greek islands offer pristine beauty and rich history.',
  'Discover secluded beaches and ancient ruins...',
  'Culture',
  'published',
  'https://images.unsplash.com/photo-1533105079780-92b9be482077?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600',
  'Explore hidden Greek islands with pristine beaches and ancient history',
  '["greece", "islands", "culture", "travel"]',
  '2023-12-10 08:00:00'
);