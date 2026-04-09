# API DOCUMENTATION

## Overview

VERP provides REST API endpoints for managing academic operations. All requests and responses use JSON format.

## Authentication

Most endpoints require authentication via session token (stored in HTTP-only cookies). Session tokens are obtained after login.

## Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    // response
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "status": 400
}
```

## Endpoints

### 1. POST /api/auth/[...all]

Authentication operations (sign up, sign in, sign out) via Better Auth.

**Required Role:** Public

**Request Body (Sign In):**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "name": "John Doe",
      "emailVerified": true
    },
    "session": {
      "token": "session-token"
    }
  }
}
```

**Error Codes:**
- `400` - Invalid request data
- `401` - Invalid credentials
- `409` - Email already registered (on sign up)

### 2. GET /api/me

Retrieve current authenticated user's profile.

**Required Role:** Authenticated

**Request Body:** None

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "faculty",
    "department": "Computer Science",
    "emailVerified": true
  }
}
```

**Error Codes:**
- `401` - Unauthorized (no session)

### 3. POST /api/marks

Save or update marks for multiple students in a course offering.

**Required Role:** Faculty, Admin

**Request Body:**
```json
{
  "courseOfferingId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "marks": [
    {
      "studentId": "student-uuid-1",
      "isa": 15,
      "mse1": 25,
      "mse2": null,
      "ese": 35
    },
    {
      "studentId": "student-uuid-2",
      "isa": 12,
      "mse1": 20,
      "mse2": null,
      "ese": 30
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "saved": 2
  }
}
```

**Error Codes:**
- `400` - Invalid marks data
- `401` - Unauthorized
- `403` - Forbidden (student role or marks locked)
- `500` - Internal server error

### 4. PATCH /api/offerings/[id]/assign-faculty

Assign a faculty member to a course offering.

**Required Role:** Admin

**URL Parameters:**
- `id` - Course offering UUID

**Request Body:**
```json
{
  "facultyId": "faculty-uuid"
}
```

**Response (200 OK):**
```json
{
  "success": true
}
```

**Error Codes:**
- `400` - Invalid faculty ID
- `403` - Forbidden (not admin)
- `404` - Course offering or faculty not found

### 5. POST /api/offerings/[id]/enroll

Enroll a student in a course offering.

**Required Role:** Faculty, Admin (not Student)

**URL Parameters:**
- `id` - Course offering UUID

**Request Body:**
```json
{
  "studentId": "student-uuid"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "enrollment-uuid",
    "courseOfferingId": "offering-uuid",
    "studentId": "student-uuid",
    "createdAt": "2026-04-09T10:00:00Z"
  }
}
```

**Error Codes:**
- `400` - Invalid student ID
- `403` - Forbidden (student role)
- `404` - Course offering or student not found
- `409` - Student already enrolled

### 6. DELETE /api/offerings/[id]/enroll

Remove a student's enrollment from a course offering.

**Required Role:** Faculty, Admin (not Student)

**URL Parameters:**
- `id` - Course offering UUID

**Request Body:**
```json
{
  "studentId": "student-uuid"
}
```

**Response (200 OK):**
```json
{
  "success": true
}
```

**Error Codes:**
- `400` - Invalid student ID
- `403` - Forbidden (student role)
- `404` - Course offering, student, or enrollment not found

### 7. POST /api/offerings/[id]/batches

Create a new batch within a course offering.

**Required Role:** Faculty, Admin (not Student)

**URL Parameters:**
- `id` - Course offering UUID

**Request Body:**
```json
{
  "name": "Batch A"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "batch-uuid",
    "courseOfferingId": "offering-uuid",
    "name": "Batch A",
    "createdAt": "2026-04-09T10:00:00Z"
  }
}
```

**Error Codes:**
- `400` - Invalid batch name
- `403` - Forbidden (student role)
- `404` - Course offering not found
- `409` - Batch name already exists for this offering

### 8. PATCH /api/offerings/[id]/batches

Assign a student to a batch within a course offering.

**Required Role:** Faculty, Admin (not Student)

**URL Parameters:**
- `id` - Course offering UUID

**Request Body:**
```json
{
  "batchId": "batch-uuid",
  "studentId": "student-uuid"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "assignment-uuid",
    "batchId": "batch-uuid",
    "studentId": "student-uuid",
    "createdAt": "2026-04-09T10:00:00Z"
  }
}
```

**Error Codes:**
- `400` - Invalid batch or student ID
- `403` - Forbidden (student role)
- `404` - Batch, course offering, or student not found
- `409` - Student already assigned to this batch

### 9. POST /api/offerings/[id]/lock

Lock or unlock marks entry for a specific component in a course offering.

**Required Role:** Faculty, Admin

**URL Parameters:**
- `id` - Course offering UUID

**Request Body:**
```json
{
  "component": "isa",
  "lock": true
}
```

**Component Values:** `"isa"`, `"mse"`, `"ese"`, `"all"`

**Response (200 OK):**
```json
{
  "success": true
}
```

**Error Codes:**
- `400` - Invalid component or lock value
- `403` - Forbidden (student role, or trying to unlock as non-admin)
- `404` - Course offering not found

### 10. GET /api/offerings/[id]/lock

Get the current lock status for all mark components in a course offering.

**Required Role:** Authenticated

**URL Parameters:**
- `id` - Course offering UUID

**Request Body:** None

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "isa": false,
    "mse": true,
    "ese": false,
    "all": false
  }
}
```

**Error Codes:**
- `401` - Unauthorized
- `404` - Course offering not found

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad Request (invalid data) |
| 401 | Unauthorized (no session) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 409 | Conflict (duplicate or constraint violation) |
| 500 | Internal Server Error |

## Common Notes

- All timestamps are in ISO 8601 format with timezone
- UUIDs are 36-character strings with hyphens
- Session tokens are automatically sent in request cookies
- Mark components (isa, mse1, mse2, ese) are optional/nullable
- All mark values must be non-negative integers within course limits
