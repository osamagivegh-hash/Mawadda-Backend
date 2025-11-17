# Search API - Complete Implementation

## Files Created

### 1. Profile Entity (`backend/src/modules/profiles/entities/profile.entity.ts`)
- Matches exact MySQL schema
- All fields: id, user_id, first_name, last_name, gender, date_of_birth, nationality, city, height, education, occupation, religiosity_level, religion, marital_status, marriage_type, polygamy_acceptance, compatibility_test, country_of_residence, about, guardian_name, guardian_contact, photo_url, photo_storage, photo_public_id, is_verified, created_at, updated_at

### 2. Search DTO (`backend/src/modules/search/dto/search-members.dto.ts`)
- All filter fields: minAge, maxAge, minHeight, maxHeight, city, nationality, countryOfResidence, education, occupation, religion, religiosityLevel, maritalStatus, marriageType, polygamyAcceptance, compatibilityTest, hasPhoto, keyword, memberId, gender
- Pagination: page, per_page

### 3. Search Service (`backend/src/modules/search/search.service.ts`)
- QueryBuilder-based dynamic filtering
- Age conversion: minAge/maxAge → date_of_birth boundaries
- All filters applied only if values exist
- Uses getManyAndCount() for pagination
- Returns structured response with meta

### 4. Search Controller (`backend/src/modules/search/search.controller.ts`)
- GET /search route
- JWT authentication
- Accepts all filters via query params
- Always responds with structured JSON

### 5. App Module (`backend/src/app.module.ts`)
- TypeORM configuration
- autoLoadEntities: true
- synchronize: false

### 6. Main.ts (`backend/src/main.ts`)
- CORS: origin: '*'
- All methods allowed
- Authorization header allowed

### 7. Configuration (`backend/src/config/configuration.ts`)
- MySQL connection
- Database: mawaddah_db
- SSL: false (Render)
- autoLoadEntities: true
- synchronize: false

## Example Request

```
GET /api/search?minAge=25&maxAge=35&city=الرياض&page=1&per_page=20
Headers: Authorization: Bearer <token>
```

## Example Response

```json
{
  "status": "success",
  "filters_received": {
    "minAge": 25,
    "maxAge": 35,
    "city": "الرياض",
    "page": 1,
    "per_page": 20
  },
  "data": [
    {
      "user": {
        "id": 1,
        "email": "female1@mawaddah.com",
        "role": "user",
        "status": "active",
        "memberId": "MAW-000001"
      },
      "profile": {
        "id": 1,
        "firstName": "فاطمة",
        "lastName": "أحمد",
        "gender": "female",
        "age": 28,
        "nationality": "السعودية",
        "city": "الرياض",
        "height": 165,
        "education": "بكالوريوس",
        "occupation": "معلمة",
        "religiosityLevel": "ملتزم",
        "religion": "الإسلام",
        "maritalStatus": "عزباء",
        "marriageType": "زواج تقليدي",
        "polygamyAcceptance": "حسب الظروف",
        "compatibilityTest": "نعم",
        "countryOfResidence": "السعودية",
        "about": "مرحبا...",
        "photoUrl": null,
        "dateOfBirth": "1996-03-15",
        "isVerified": false
      }
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 3,
    "per_page": 20,
    "total": 45
  }
}
```

## Debug Logs

### Backend Console
```
SEARCH DTO: { "minAge": 25, "maxAge": 35, "city": "الرياض", "page": 1, "per_page": 20 }
FINAL SQL: SELECT profile.*, user.* FROM profiles profile INNER JOIN users user ON profile.user_id = user.id WHERE user.status = ? AND profile.city = ? AND profile.dateOfBirth >= ? AND profile.dateOfBirth <= ? ORDER BY profile.created_at DESC LIMIT ? OFFSET ?
SQL PARAMETERS: { status: 'active', city: 'الرياض', maxAgeDate: '1989-01-01', minAgeDate: '1999-12-31', skip: 0, take: 20 }
```

### Frontend Console
```
SEARCH REQUEST: { minAge: 25, maxAge: 35, city: "الرياض", page: 1, per_page: 20 }
API RESPONSE: { status: "success", filters_received: {...}, data: [...], meta: {...} }
```

## Environment Variables

```env
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_NAME=mawaddah_db
DB_SSL=false
```

## All Filters Supported

- `minAge` / `maxAge` - Age range (converted to date_of_birth)
- `minHeight` / `maxHeight` - Height range
- `city` - Exact match
- `nationality` - Exact match
- `countryOfResidence` - Exact match
- `education` - Exact match
- `occupation` - Exact match
- `religion` - Exact match
- `religiosityLevel` - Exact match
- `maritalStatus` - Exact match
- `marriageType` - Exact match
- `polygamyAcceptance` - Exact match
- `compatibilityTest` - Exact match
- `hasPhoto` - "true" for profiles with photos
- `keyword` - LIKE search in firstName, lastName, about, city, nationality
- `memberId` - Exact match on user.memberId
- `gender` - Exact match (optional, defaults to opposite of logged-in user)

## Features

✅ QueryBuilder-based dynamic filtering
✅ Age calculation via date_of_birth
✅ Pagination with getManyAndCount()
✅ Always responds (even with empty filters)
✅ CORS enabled for all origins
✅ Full debug logging
✅ Structured JSON response with meta
✅ TypeORM entities matching MySQL schema
✅ SSL disabled for Render compatibility


