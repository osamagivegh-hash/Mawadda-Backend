# Database Migration & Seeding Guide

## Prerequisites

1. MySQL database server running
2. Database `mawaddah_db` created
3. Environment variables configured in `.env`

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and update:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_NAME=mawaddah_db
DB_SSL=false
```

### 3. Run Migrations

Create database tables:

```bash
npm run migration:run
```

This will:
- Create `users` table
- Create `profiles` table
- Create all indexes and foreign keys

### 4. Seed Database

Add 20 female users with profiles:

```bash
npm run seed
```

Or specifically:

```bash
npm run seed:female
```

## Available Commands

### Migration Commands

```bash
# Generate a new migration (auto-detect changes)
npm run migration:generate src/database/migrations/MigrationName

# Create an empty migration file
npm run migration:create src/database/migrations/MigrationName

# Run all pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Show migration status
npm run migration:show
```

### Seed Commands

```bash
# Seed 20 female users
npm run seed

# Same as above
npm run seed:female
```

## Seeded Data

The seed script creates:

- **20 Female Users** with:
  - Unique email: `female1@mawaddah.com` to `female20@mawaddah.com`
  - Member IDs: `MAW-000001` to `MAW-000020`
  - Password: `password123` (hashed)
  - Status: `ACTIVE`
  - Role: `USER`

- **20 Profiles** with:
  - Arabic names (فاطمة, خديجة, عائشة, etc.)
  - Gender: `female`
  - Ages: 22-35 (random)
  - Random cities, nationalities, education, occupation
  - Random marital status, marriage type, religiosity level
  - Height: 155-175 cm (random)

## Database Schema

### Users Table

- `id` - Primary key (auto-increment)
- `email` - Unique email
- `password` - Hashed password
- `member_id` - Unique member ID (e.g., MAW-000001)
- `role` - Enum: user, consultant, admin, superAdmin
- `status` - Enum: pending, active, suspended
- `profile_id` - Foreign key to profiles.id
- `membership_plan_id` - Default: 'basic'
- `created_at`, `updated_at` - Timestamps

### Profiles Table

- `id` - Primary key (auto-increment)
- `user_id` - Foreign key to users.id (CASCADE delete)
- `first_name`, `last_name` - Arabic names
- `gender` - Enum: male, female
- `date_of_birth` - Date
- `nationality` - String
- `city` - String
- `height` - Integer (cm)
- `education` - String
- `occupation` - String
- `religiosity_level` - String
- `religion` - String (optional)
- `marital_status` - String
- `marriage_type` - String (optional)
- `polygamy_acceptance` - String (optional)
- `compatibility_test` - String (optional)
- `country_of_residence` - String (optional)
- `about` - Text (optional)
- `photo_url`, `photo_storage`, `photo_public_id` - Photo fields
- `is_verified` - Boolean
- `created_at`, `updated_at` - Timestamps

## Troubleshooting

### Migration Errors

1. **Table already exists**: 
   - Drop database: `DROP DATABASE mawaddah_db; CREATE DATABASE mawaddah_db;`
   - Re-run migration

2. **Connection refused**:
   - Check MySQL is running
   - Verify DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD in `.env`

3. **Permission denied**:
   - Grant privileges: `GRANT ALL PRIVILEGES ON mawaddah_db.* TO 'user'@'localhost';`

### Seed Errors

1. **Duplicate entry**:
   - Clear existing data first
   - Or modify seed script to check for existing users

2. **Foreign key constraint**:
   - Ensure migrations ran successfully
   - Check user_id references valid users

## Production Deployment

1. **Never run seeds in production** (or use environment check)
2. **Use migrations** for schema changes
3. **Backup database** before running migrations
4. **Test migrations** on staging first

## Manual Database Creation

If you prefer SQL, run:

```sql
CREATE DATABASE IF NOT EXISTS mawaddah_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mawaddah_db;
```

Then run the migration SQL from `backend/src/database/migrations/1735000000000-CreateInitialTables.ts`


