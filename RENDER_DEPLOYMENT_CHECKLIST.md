# Render Deployment Checklist

## Build Status: ✅ Build Successful

## Deployment Status: ⚠️ Deployment Stopped After Build

## Required Environment Variables (Set in Render Dashboard)

### Database (MySQL - REQUIRED)
```
DB_HOST=your-mysql-host.region.rds.amazonaws.com
DB_PORT=3306
DB_USERNAME=your-username
DB_PASSWORD=your-password
DB_NAME=mawaddah_db
DB_SSL=false
```

### Application (REQUIRED)
```
PORT=3000
NODE_ENV=production
GLOBAL_PREFIX=api
JWT_SECRET=your-secret-minimum-32-characters-long
JWT_EXPIRES_IN=1d
BCRYPT_SALT_ROUNDS=10
```

### CORS (Optional)
```
CORS_ORIGINS=
FRONTEND_URL=https://your-frontend.onrender.com
```

### Cloudinary (Optional)
```
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

## Build Command
```
npm install && npm run build
```

## Start Command
```
npm run start:prod
```

## Common Deployment Issues

### 1. Deployment Stops After Build
**Cause:** App fails to start (usually database connection)
**Fix:**
- Check Render logs for error messages
- Verify all DB_* environment variables are set
- Ensure database is accessible from Render
- Check if port is correct (Render sets PORT automatically)

### 2. Database Connection Failed
**Symptoms:**
- `Error: connect ECONNREFUSED`
- `ER_ACCESS_DENIED_ERROR`
- Deployment stops immediately after build

**Fix:**
- Verify DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD
- Ensure database allows connections from Render IPs
- Check database firewall/security groups
- Verify DB_NAME exists: `CREATE DATABASE mawaddah_db;`

### 3. Missing Environment Variables
**Symptoms:**
- `Joi validation error`
- App crashes on startup

**Fix:**
- Set all required variables in Render dashboard
- DB_USERNAME, DB_PASSWORD, DB_NAME are required
- JWT_SECRET must be set (minimum 16 characters)

### 4. Port Already in Use
**Symptoms:**
- `EADDRINUSE: address already in use`

**Fix:**
- Render automatically sets PORT env var
- App uses `process.env.PORT` or defaults to 3000
- Should work automatically

## Check Application Logs

After deployment, check Render logs:
```
Render Dashboard → Your Service → Logs
```

Look for:
- `>>> Starting NestJS application...`
- `>>> Application is running on: http://localhost:PORT/api`
- `>>> Server started successfully!`

If you see errors:
- `>>> FATAL ERROR during application startup:` - Check database config
- Connection refused - Check DB_HOST and network access
- Access denied - Check DB_USERNAME and DB_PASSWORD

## Health Check Endpoint

Add a simple health check:
```
GET /api/health
```

Should return: `{ status: 'ok' }`

## Next Steps After Deployment

1. Run migrations:
   ```bash
   npm run migration:run
   ```

2. Seed database:
   ```bash
   npm run seed
   ```

3. Test search endpoint:
   ```
   GET /api/search?minAge=25&maxAge=35&page=1&per_page=20
   Headers: Authorization: Bearer <token>
   ```

## Verification

✅ Build completes successfully
✅ Environment variables set
✅ Database connection works
✅ Application starts on PORT
✅ Logs show "Server started successfully"
✅ Health endpoint responds

If deployment still stops, check Render logs for the exact error message.


