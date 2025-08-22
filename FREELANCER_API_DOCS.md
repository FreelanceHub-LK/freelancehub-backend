# Freelancer Profile Management API Endpoints

## Overview
These endpoints allow freelancers to manage specific sections of their profile individually, providing granular control and better API design.

## Authentication
All endpoints require JWT authentication. Include the following header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

## Base URL
```
/freelancers/me
```

## Endpoints

### 1. Update Skills
**PUT** `/freelancers/me/skills`

Updates the complete skills array for the freelancer.

**Request Body:**
```json
{
  "skills": ["JavaScript", "React", "Node.js", "TypeScript", "MongoDB"]
}
```

**Validation:**
- `skills`: Array of strings, required, not empty, unique values only

**Response:** Updated freelancer profile

---

### 2. Update Hourly Rate
**PUT** `/freelancers/me/rate`

Updates the freelancer's hourly rate.

**Request Body:**
```json
{
  "hourlyRate": 45.50
}
```

**Validation:**
- `hourlyRate`: Number, required, min: 1, max: 1000, max 2 decimal places

**Response:** Updated freelancer profile

---

### 3. Update Education
**PUT** `/freelancers/me/education`

Updates the freelancer's education information.

**Request Body:**
```json
{
  "education": "Bachelor of Science in Computer Science, Stanford University"
}
```

**Validation:**
- `education`: String, required, not empty, max length: 500 characters

**Response:** Updated freelancer profile

---

### 4. Update Availability
**PUT** `/freelancers/me/availability`

Updates the freelancer's availability status.

**Request Body:**
```json
{
  "isAvailable": true
}
```

**Validation:**
- `isAvailable`: Boolean, required

**Response:** Updated freelancer profile

---

### 5. Update Certifications
**PUT** `/freelancers/me/certifications`

Updates the complete certifications array for the freelancer.

**Request Body:**
```json
{
  "certifications": [
    "AWS Certified Developer",
    "Microsoft Azure Fundamentals",
    "Google Cloud Professional Developer"
  ]
}
```

**Validation:**
- `certifications`: Array of strings, unique values only

**Response:** Updated freelancer profile

---

### 6. Update Portfolio Links
**PUT** `/freelancers/me/portfolio`

Updates the complete portfolio links array for the freelancer.

**Request Body:**
```json
{
  "portfolioLinks": [
    "https://github.com/username/awesome-project",
    "https://myportfolio.dev",
    "https://dribbble.com/username"
  ]
}
```

**Validation:**
- `portfolioLinks`: Array of strings, each must be a valid URL, unique values only

**Response:** Updated freelancer profile

---

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": ["Validation error messages"],
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Freelancer profile not found",
  "error": "Not Found"
}
```

## Benefits of This Design

1. **Granular Control**: Update specific profile sections without affecting others
2. **Better Performance**: Only update what's needed
3. **Improved Security**: Apply different permissions per operation
4. **Clear Validation**: Specific validation rules per endpoint
5. **Atomic Operations**: Reduce risk of partial updates failing
6. **Better UX**: Frontend can update sections independently

## Notes

- All endpoints use PUT method for idempotent operations
- Each endpoint validates only the relevant data
- The complete freelancer profile is returned after successful updates
- Only the authenticated freelancer can update their own profile
- All updates are atomic - either all data is updated successfully or nothing changes
