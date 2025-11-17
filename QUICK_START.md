# Quick Start Guide - Database Setup & Seeding

## Step 1: Create MySQL Database

```sql
CREATE DATABASE IF NOT EXISTS mawaddah_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## Step 2: Configure Environment Variables

Create/update `.env` file in `backend/` directory:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_NAME=mawaddah_db
DB_SSL=false
```

## Step 3: Install Dependencies

```bash
npm install
```

## Step 4: Run Migrations (Create Tables)

```bash
npm run migration:run
```

This will create:
- `users` table
- `profiles` table
- All indexes and foreign keys

## Step 5: Seed Database (20 Female Users)

```bash
npm run seed
```

This will create:
- 20 female users with emails: `female1@mawaddah.com` to `female20@mawaddah.com`
- 20 profiles with Arabic names
- All users have password: `password123`
- Member IDs: `MAW-000001` to `MAW-000020`

## Verify Setup

Check your database:

```sql
USE mawaddah_db;
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as total_profiles FROM profiles;
SELECT gender, COUNT(*) FROM profiles GROUP BY gender;
```

Expected results:
- 20 users
- 20 profiles (all female)

## Test Search API

1. Start backend: `npm run start:dev`
2. Login with any seeded user (e.g., `female1@mawaddah.com` / `password123`)
3. Search API: `GET /api/search?minAge=22&maxAge=35`

## Troubleshooting

### Migration fails
- Ensure MySQL is running
- Check database exists: `SHOW DATABASES;`
- Verify credentials in `.env`

### Seed fails
- Ensure migrations ran successfully
- Check database connection
- Verify no duplicate entries (seed checks for existing users)

### Connection issues
- Verify MySQL service is running
- Check firewall settings
- Ensure DB_HOST, DB_PORT are correct


