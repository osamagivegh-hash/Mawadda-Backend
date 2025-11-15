# Partner Search Fix Summary

## Overview
Fixed the partner search functionality to handle inconsistent gender values (Arabic "أنثى"/"ذكر", corrupted values) and missing dateOfBirth fields in the database.

## Changes Made

### 1. Search Service (`backend/src/modules/search/search.service.ts`)

#### Gender Normalization Layer
- Added `normalizeGender()` and `normalizeInputGender()` methods to convert:
  - Arabic values: "أنثى" → "female", "ذكر" → "male"
  - Corrupted values: "malQ", "مالق", "mAlQ" → "male"
  - Trims whitespace from input

#### Aggregation Pipeline Improvements
1. **Gender Normalization Stage** (using `$addFields`):
   - Normalizes gender values IN THE PIPELINE using nested `$cond` statements
   - Converts Arabic/corrupted values to "male" or "female" before filtering
   - Case-insensitive matching

2. **Age Calculation Stage**:
   - Uses `$dateDiff` to calculate age from `dateOfBirth`
   - Handles both Date objects and string dates (using `$dateFromString`)
   - If `dateOfBirth` is missing, `age` is set to `null`
   - Profiles without `dateOfBirth` are **excluded from age filtering** (via `age: { $ne: null }`)

3. **Mandatory Filters**:
   - **Gender**: Must match normalized gender (case-insensitive regex)
   - **Age**: Must have valid `dateOfBirth` and age within range

4. **Optional Filters** (only applied if provided):
   - city, nationality, education, maritalStatus, countryOfResidence, height, hasPhoto, keyword, memberId

#### Debug Logging
- Logs all filters received
- Logs pipeline steps
- Logs results count after gender match
- Logs results count after age match
- Logs final results count and sample data

### 2. DTO Validation (`backend/src/modules/search/dto/search-members.dto.ts`)

- **Gender**: Changed from `@IsOptional()` to required (`@IsString()` without `@IsOptional()`)
- **Age**: At least one of `minAge` or `maxAge` is required (validated in service/controller)
- All other fields remain optional

### 3. Database Normalization Script (`backend/src/database/normalize-gender-and-dob.ts`)

One-time script to clean up existing data:

#### Features:
- Normalizes all gender values in the database to "male" or "female"
- Handles Arabic values: "أنثى", "أنثي", "ذكر", "ذكور"
- Handles corrupted values containing "mal" or "fem"
- Validates and normalizes `dateOfBirth` fields (converts strings to Date objects)
- Sets invalid values to `null`

#### Running the Script:

**Option 1: Via npm script** (add to `package.json`):
```json
"migration:normalize-gender-dob": "ts-node src/database/normalize-gender-and-dob.ts"
```
Then run: `npm run migration:normalize-gender-dob`

**Option 2: Direct execution**:
```bash
npx ts-node src/database/normalize-gender-and-dob.ts
```

**Option 3: Import and run**:
```typescript
import { normalizeDatabase } from './database/normalize-gender-and-dob';
// ... in your code
await normalizeDatabase(app);
```

⚠️ **WARNING**: This script **MODIFIES** your database. Make a backup first!

## How It Works

### Search Flow:
1. **Input Normalization**: User's gender input is normalized (e.g., "أنثى" → "female")
2. **Pipeline Stage 1**: Gender values in database are normalized using `$addFields`
3. **Pipeline Stage 2**: Age is calculated from `dateOfBirth` using `$dateDiff`
4. **Pipeline Stage 3**: Filter by normalized gender (case-insensitive)
5. **Pipeline Stage 4**: Filter by age range (excludes profiles without `dateOfBirth`)
6. **Pipeline Stage 5**: Apply optional filters (city, nationality, etc.)
7. **Pipeline Stage 6**: Lookup and filter active users only
8. **Pipeline Stage 7**: Project and return results

### Key Features:
- ✅ Handles Arabic gender values ("أنثى", "ذكر")
- ✅ Handles corrupted gender values ("malQ", "مالق", etc.)
- ✅ Excludes profiles without `dateOfBirth` from age filtering
- ✅ Case-insensitive gender matching
- ✅ Comprehensive debug logging
- ✅ Gender and age are mandatory; all other filters optional

## Final Aggregation Pipeline Structure

```javascript
[
  // Step 1: Normalize gender (trim and lowercase)
  { $addFields: { trimmedGender: ... } },
  
  // Step 2: Map to normalized values (Arabic → English, corrupted → clean)
  { $addFields: { normalizedGender: ... } },
  
  // Step 3: Calculate age from dateOfBirth
  { $addFields: { age: { $dateDiff: ... } } },
  
  // Step 4: Match on normalized gender and age (MANDATORY)
  { $match: { 
      normalizedGender: { $regex: '^female$', $options: 'i' },
      age: { $gte: 19, $lte: 40, $ne: null }
  }},
  
  // Step 5: Optional filters...
  
  // Step 6: Lookup users
  { $lookup: { from: 'users', ... } },
  { $unwind: '$user' },
  
  // Step 7: Filter active users
  { $match: { 'user.status': 'active' } },
  
  // Step 8: Project final fields
  { $project: { ... } },
  
  // Step 9: Limit results
  { $limit: 30 }
]
```

## Testing

1. **Test with Arabic gender values**:
   - Search with gender="أنثى" → should match profiles with "أنثى", "أنثي", "female"
   - Search with gender="ذكر" → should match profiles with "ذكر", "ذكور", "male"

2. **Test with corrupted values**:
   - Profiles with "malQ", "مالق" → should match gender="male" searches

3. **Test age filtering**:
   - Profiles without `dateOfBirth` → should NOT appear in results
   - Profiles with `dateOfBirth` → should appear if age is within range

4. **Check debug logs**:
   - Console will show results count after each pipeline stage
   - Review logs to identify where results are filtered out

## Next Steps

1. **Run the normalization script** to clean up existing data:
   ```bash
   npm run migration:normalize-gender-dob
   ```

2. **Test the search** with various gender inputs (English, Arabic, corrupted)

3. **Monitor debug logs** to ensure results are being found at each stage

4. **Remove debug logs** once everything is working (marked with `// DEBUG START` / `// DEBUG END`)

## Files Modified

- ✅ `backend/src/modules/search/search.service.ts` - Complete rewrite with normalization
- ✅ `backend/src/modules/search/dto/search-members.dto.ts` - Made gender required
- ✅ `backend/src/modules/search/search.controller.ts` - Already validates required fields
- ✅ `backend/src/database/normalize-gender-and-dob.ts` - NEW: Database normalization script

## Notes

- The normalization happens in the aggregation pipeline, so it works even if the database hasn't been normalized yet
- However, running the normalization script is recommended for better performance
- The script is safe to run multiple times (idempotent)

