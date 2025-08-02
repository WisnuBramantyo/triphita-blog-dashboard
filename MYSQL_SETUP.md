# MySQL Database Setup Guide

Your blog dashboard now supports MySQL database! Here's how to set it up:

## Prerequisites

1. **MySQL Server** installed and running
2. **Node.js 18+** with npm

## MySQL Installation

### macOS (using Homebrew)
```bash
brew install mysql
brew services start mysql
```

### Ubuntu/Debian
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
```

### Windows
Download and install from [MySQL Official Website](https://dev.mysql.com/downloads/mysql/)

## Database Setup

### 1. Create Database and Tables
```bash
mysql -u root -p < mysql-setup.sql
```

Or run manually:
```sql
CREATE DATABASE triphita_blog;
USE triphita_blog;
-- (run the commands from mysql-setup.sql)
```

### 2. Configure Environment Variables

Create a `.env` file in your project root:
```bash
cp .env.example .env
```

Edit `.env` with your MySQL credentials:
```
USE_MYSQL=true
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=triphita_blog
```

### 3. Run the Application
```bash
npm install
npm run dev
```

## Features with MySQL

✅ **Persistent Data**: Your blog posts survive server restarts  
✅ **Performance**: Optimized queries with proper indexing  
✅ **Scalability**: Production-ready database solution  
✅ **Search**: Full-text search across posts  
✅ **Filtering**: Fast category and status filtering  

## Database Schema

### Blog Posts Table
- `id` - Auto-incrementing primary key
- `title` - Post title (required)
- `content` - Post content (required) 
- `excerpt` - Short description
- `category` - Post category (Travel, Food, Culture, etc.)
- `status` - draft, published, or scheduled
- `featured_image` - Image URL
- `meta_description` - SEO description
- `tags` - JSON array of tags
- `publish_date` - When to publish
- `created_at` - Auto-generated creation timestamp
- `updated_at` - Auto-updated modification timestamp

### Users Table
- `id` - Auto-incrementing primary key
- `username` - Unique username
- `password` - Hashed password

## Switching Between Storage Types

### Use MySQL
```bash
# In .env file
USE_MYSQL=true
```

### Use In-Memory Storage (for development)
```bash
# In .env file
USE_MYSQL=false
```

## Performance Optimizations

The setup includes these MySQL optimizations:
- **Indexes** on frequently queried columns (status, category, dates)
- **JSON column** for tags with native MySQL JSON functions
- **Timestamp handling** with automatic updates
- **Connection pooling** through mysql2 driver

## Troubleshooting

### Connection Issues
```bash
# Test MySQL connection
mysql -u root -p -e "SELECT 1"
```

### Permission Issues
```sql
-- Grant privileges (run as MySQL root)
GRANT ALL PRIVILEGES ON triphita_blog.* TO 'your_user'@'localhost';
FLUSH PRIVILEGES;
```

### Port Conflicts
Check if MySQL is running on the correct port:
```bash
sudo netstat -tlnp | grep 3306
```

Your blog dashboard is now ready with MySQL database support! 🚀