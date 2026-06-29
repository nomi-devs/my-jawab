# Admin Module API Documentation

## Overview

The Admin Module provides administrative functionality including admin login, dashboard statistics and management operations for users, posts, comments, topics, communities, and polls. 

**Base URL**: `http://localhost:3000/api`

**Authentication**: 
- The login endpoint (`POST /api/admin/login`) is public and does NOT require authentication
- All other endpoints require:
  1. Valid JWT token in the `Authorization` header (obtained from login)
  2. User role must be `admin` or `sub_admin`

```
Authorization: Bearer <access_token>
```

**Login Flow**:
1. Admin/Sub-admin logs in via `POST /api/admin/login` with email/username and password
2. System validates credentials and role (must be admin or sub_admin)
3. System returns access_token and refresh_token
4. Use access_token in Authorization header for all subsequent requests

---

## Table of Contents

1. [Admin Login](#admin-login)
2. [Admin Logout](#admin-logout)
3. [Password Reset](#password-reset)
4. [Change Password](#change-password)
5. [Dashboard](#dashboard)
   - Get Dashboard Statistics (Enhanced with Trends & Time Range)
6. [Global Search](#global-search)
   - Global Search (Users, Posts, Communities, Topics)
7. [User Management](#user-management)
   - Create User
   - Get Users List (Enhanced Filters)
   - Get User by ID (Enhanced with Statistics)
   - Get User Posts
   - Get User Communities
   - Get User Comments
   - Get User Statistics
   - Update User Status
   - Delete User
8. [Post Management](#post-management)
   - Get Posts List (Enhanced Filters)
   - Get Post by ID (Enhanced with Analytics)
   - Get Post Comments
   - Get Post Analytics
   - Create Post
   - Update Post
   - Update Post Status
   - Delete Post
9. [Comment Management](#comment-management)
   - Get Comments List (Enhanced Filters)
   - Get Comment by ID (Enhanced with Replies)
   - Get Comment Replies
   - Update Comment
   - Delete Comment
10. [Topic Management](#topic-management)
   - Get Topics List (Enhanced Filters)
   - Get Parent Topics
   - Get Topic by ID (Enhanced with Usage Stats)
   - Get Topic Posts
   - Get Topic Communities
   - Get Topic Statistics
   - Create Topic
   - Update Topic
   - Update Topic Status
11. [Community Management](#community-management)
    - Get Communities List (Enhanced Filters)
    - Get Community by ID (Enhanced with Statistics)
    - Get Community Posts
    - Get Community Activity
    - Get Community Statistics
    - Create Community
    - Update Community
    - Update Community Status
    - Delete Community
    - Get Community Members
    - Update Member Role
    - Get Community Topics
    - Add Topic to Community
    - Remove Topic from Community
12. [Poll Management](#poll-management)
    - Get Polls List (Enhanced Filters)
    - Get Poll by ID (Enhanced with Analytics)
    - Get Poll Analytics
    - Get Poll Votes
    - Create Poll
    - Update Poll
    - Delete Poll
13. [Subscription Management](#subscription-management)
    - Get Subscriptions List
    - Get Subscription by ID
    - Create Subscription
    - Update Subscription
    - Delete Subscription
    - Get User Subscriptions List
    - Get User Subscription by ID
    - Update User Subscription Status
14. [Payment Management](#payment-management)
    - Get Payments List
    - Get Payment by ID
    - Create Payment
    - Update Payment Status
15. [Subscription & Payment Notifications](#subscription--payment-notifications)
    - Get Subscription and Payment Notifications
16. [Bulk Operations](#bulk-operations)
    - Bulk Update Users
    - Bulk Update Posts
    - Bulk Approve Comments
    - Bulk Update Communities
    - Bulk Update Topics
17. [Export Functionality](#export-functionality)
    - Export Users
    - Export Posts
    - Export Comments
18. [Privacy Policy Management](#privacy-policy-management)
    - Get Privacy Policy
    - Create Privacy Policy
    - Update Privacy Policy
19. [Support Management](#support-management)
    - Get Support Info
    - Create Support Info
    - Update Support Info
20. [Request/Response Examples](#requestresponse-examples)
21. [Error Handling](#error-handling)

---

## Admin Login

### 1. Admin Login

Login endpoint specifically for admin and sub-admin users. Only users with `admin` or `sub_admin` role can access this endpoint.

**Method**: `POST`  
**Endpoint**: `POST /api/admin/login`

**Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "identifier": "admin@example.com",
  "password": "your_password",
  "device_id": "optional_device_id",
  "device_type": "web",
  "device_token": "optional_device_token"
}
```

**Parameters**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `identifier` | string | Yes | Email or username |
| `password` | string | Yes | User password |
| `device_id` | string | No | Device identifier for tracking |
| `device_type` | string | No | Device type (web, ios, android) |
| `device_token` | string | No | Push notification token |

**Response** (200 OK):
```json
{
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "role": "admin",
    "auth_type": "email",
    "is_active": true,
    "is_verified": true
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600
}
```

**Response Fields**:
- `user`: User object with admin details
- `access_token`: JWT access token for authenticated requests
- `refresh_token`: JWT refresh token for renewing access tokens
- `expires_in`: Token expiration time in seconds (default: 3600 = 1 hour)

**Error Responses**:
- `401 Unauthorized`: Invalid credentials, account inactive, account not verified, or user does not have admin/sub-admin role
  ```json
  {
    "statusCode": 401,
    "message": "Invalid credentials",
    "error": "Unauthorized"
  }
  ```

**Business Rules**:
- Only users with `admin` or `sub_admin` role can login through this endpoint
- User must be active (`is_active = true`)
- User must be verified (`is_verified = true`)
- Password must be correct
- Device information is optional but will be registered/updated if provided

**Security Notes**:
- This endpoint does NOT require authentication (it's the login endpoint)
- All other admin endpoints require the access token returned from this login
- Tokens are stored in the database for validation and revocation
- Cache is invalidated on login to ensure fresh user data

---

## Admin Logout

### 2. Admin Logout

Logout endpoint for admin and sub-admin users. Clears tokens and invalidates cache.

**Method**: `POST`  
**Endpoint**: `POST /api/admin/logout`

**Headers**:
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Response** (200 OK):
```json
{
  "message": "Logged out successfully"
}
```

**Error Responses**:
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: User does not have admin or sub-admin role
- `404 Not Found`: User not found

**Business Rules**:
- Requires valid JWT access token
- User must have `admin` or `sub_admin` role
- Clears access_token and refresh_token from database
- Invalidates user cache
- Token becomes invalid after logout

**Security Notes**:
- This endpoint requires authentication
- After logout, the access token cannot be used for subsequent requests
- Cache is invalidated to ensure user data is fresh on next login

---

## Password Reset

### 3. Forgot Password

Request a password reset code for admin/sub-admin accounts. Only works for users with admin or sub-admin role.

**Method**: `POST`  
**Endpoint**: `POST /api/admin/forgot-password`

**Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "email": "admin@example.com"
}
```

**Parameters**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | Admin email address |

**Response** (200 OK):
```json
{
  "message": "If the email exists, a password reset code has been sent"
}
```

**Error Responses**:
- `400 Bad Request`: Email is required or invalid format

**Business Rules**:
- Only works for users with `admin` or `sub_admin` role
- Generates a 6-digit reset code
- Reset code expires after 1 hour
- Returns generic message for security (doesn't reveal if email exists)
- Reset code is logged to console in development (TODO: send via email in production)

**Security Notes**:
- This endpoint does NOT require authentication
- Generic response message prevents email enumeration attacks
- Reset codes are single-use and time-limited
- Only admin/sub-admin accounts can use this endpoint

---

### 4. Reset Password

Reset password using the reset code received via forgot password.

**Method**: `POST`  
**Endpoint**: `POST /api/admin/reset-password`

**Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "email": "admin@example.com",
  "reset_code": "123456",
  "new_password": "newSecurePassword123"
}
```

**Parameters**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | Admin email address |
| `reset_code` | string | Yes | 6-digit reset code from forgot password |
| `new_password` | string | Yes | New password (minimum 6 characters) |

**Response** (200 OK):
```json
{
  "message": "Password reset successfully"
}
```

**Error Responses**:
- `400 Bad Request`: Invalid or expired reset code
- `400 Bad Request`: New password is too short (minimum 6 characters)
- `404 Not Found`: User not found
- `401 Unauthorized`: User does not have admin or sub-admin role

**Business Rules**:
- Only works for users with `admin` or `sub_admin` role
- Reset code must be valid and not expired (1 hour validity)
- Reset code can only be used once
- New password must be at least 6 characters
- Password is hashed using bcrypt before storage
- Cache is invalidated after password change

**Security Notes**:
- This endpoint does NOT require authentication
- Reset codes are single-use and expire after 1 hour
- Password is securely hashed before storage
- Cache invalidation ensures old tokens become invalid

---

## Change Password

### 5. Change Password

Change password for authenticated admin/sub-admin users. Requires old password for verification.

**Method**: `POST`  
**Endpoint**: `POST /api/admin/change-password`

**Headers**:
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "old_password": "currentPassword123",
  "new_password": "newSecurePassword456"
}
```

**Parameters**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `old_password` | string | Yes | Current password for verification |
| `new_password` | string | Yes | New password (minimum 6 characters) |

**Response** (200 OK):
```json
{
  "message": "Password changed successfully. Please login again."
}
```

**Error Responses**:
- `400 Bad Request`: Password not set (use reset password instead)
- `400 Bad Request`: New password must be different from old password
- `400 Bad Request`: New password is too short (minimum 6 characters)
- `401 Unauthorized`: Invalid old password
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: User does not have admin or sub-admin role
- `404 Not Found`: User not found

**Business Rules**:
- Requires valid JWT access token
- User must have `admin` or `sub_admin` role
- Old password must be verified before allowing change
- New password must be different from old password
- New password must be at least 6 characters
- Password is hashed using bcrypt before storage
- Tokens are cleared after password change (forces re-login)
- Cache is invalidated after password change

**Security Notes**:
- This endpoint requires authentication
- Old password verification prevents unauthorized password changes
- Tokens are invalidated after password change for security
- User must login again after password change
- Password is securely hashed before storage

**Difference from Reset Password**:
- **Change Password**: Requires authentication and old password (for logged-in users)
- **Reset Password**: Uses reset code (for users who forgot their password)

---

## Dashboard

### 6. Get Dashboard Statistics (Enhanced)

Get comprehensive statistics for the admin dashboard with time range support, trends, and engagement metrics.

**Method**: `GET`  
**Endpoint**: `GET /api/admin/dashboard/stats`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Query Parameters**:
| Parameter | Type | Values | Description |
|-----------|------|--------|-------------|
| `time_range` | string | `week`, `month`, `year`, `all` | Time range for statistics (default: `all`). **Note**: When using `time_range`, do not provide `start_date` or `end_date`. |
| `start_date` | string (ISO date) | Date string | Custom start date (must be used with `end_date`). **Note**: When using custom dates, do not provide `time_range`. |
| `end_date` | string (ISO date) | Date string | Custom end date (must be used with `start_date` and must be after `start_date`). **Note**: When using custom dates, do not provide `time_range`. |

**Time Range Options**:
- `week`: Statistics for the last 7 days (including today). Compares with the previous 7-day period for trends.
- `month`: Statistics for the last 30 days (including today). Compares with the previous 30-day period for trends.
- `year`: Statistics for the last 365 days (including today). Compares with the previous 365-day period for trends.
- `all`: All-time statistics (shows current totals, no date filtering). Trends are set to 0 as there's no previous period to compare.

**Custom Date Range**:
- When providing `start_date` and `end_date`, the API calculates statistics for records created within that date range (inclusive).
- The start date is normalized to 00:00:00.000 and the end date to 23:59:59.999 to include the full days.
- Trends are calculated by comparing with an equal-length period immediately before the specified range.

**Example Requests**:
```
# Last 7 days
GET /api/admin/dashboard/stats?time_range=week

# Last 30 days
GET /api/admin/dashboard/stats?time_range=month

# Last 365 days
GET /api/admin/dashboard/stats?time_range=year

# All time
GET /api/admin/dashboard/stats?time_range=all

# Custom date range (January 2024)
GET /api/admin/dashboard/stats?start_date=2024-01-01&end_date=2024-01-31
```

**Response** (200 OK):
```json
{
  "total_users": 1250,
  "active_users": 1100,
  "verified_users": 1050,
  "pro_users": 150,
  "total_posts": 5000,
  "published_posts": 4500,
  "draft_posts": 500,
  "total_comments": 15000,
  "total_topics": 200,
  "active_topics": 180,
  "total_communities": 50,
  "active_communities": 45,
  "total_polls": 300,
  "published_polls": 250,
  "recent_users": 25,
  "recent_posts": 150,
  "daily_active_users": 450,
  "weekly_active_users": 1200,
  "monthly_active_users": 1100,
  "engagement_rate": 12.5,
  "trends": {
    "total_users_change": 5.2,
    "active_users_change": 3.8,
    "verified_users_change": 4.1,
    "pro_users_change": 8.5,
    "total_posts_change": 12.3,
    "published_posts_change": 15.6,
    "draft_posts_change": -5.2,
    "total_comments_change": 18.9,
    "total_topics_change": 2.1,
    "active_topics_change": 1.8,
    "total_communities_change": 10.0,
    "active_communities_change": 11.1,
    "total_polls_change": 25.0,
    "published_polls_change": 30.0
  },
  "top_posts": [
    {
      "id": 123,
      "post_title": "Best Practices for React",
      "like_count": 450,
      "comment_count": 120,
      "user": {
        "id": 5,
        "username": "developer123"
      }
    }
  ],
  "top_users": [
    {
      "id": 5,
      "username": "developer123",
      "email": "dev@example.com",
      "post_count": 45,
      "comment_count": 120
    }
  ],
  "recent_activity": [
    {
      "type": "post",
      "id": 123,
      "title": "New Post Title",
      "user": {
        "id": 5,
        "username": "developer123"
      },
      "created_at": "2024-01-15T10:30:00.000Z"
    },
    {
      "type": "comment",
      "id": 456,
      "content": "Great post!",
      "user": {
        "id": 7,
        "username": "user456"
      },
      "post_id": 123,
      "created_at": "2024-01-15T11:00:00.000Z"
    }
  ],
  "trending_topics": [
    {
      "topic_id": 5,
      "topic_name": "Technology",
      "topic_slug": "technology",
      "usage_count": 450,
      "community_count": 25,
      "post_count": 425
    }
  ]
}
```

**Enhanced Statistics**:
- **Time Range Support**: Filter statistics by week, month, year, or custom date range
- **Trends**: Percentage changes from previous period for all metrics
- **Active Users**: Daily, weekly, and monthly active users (users who created posts/comments/polls)
- **Engagement Rate**: Calculated as (likes + comments) / views * 100
- **Top Posts**: Top 10 posts by engagement (likes + comments) in the period
- **Top Users**: Top 10 users by activity (posts + comments) in the period
- **Recent Activity**: Recent posts and comments feed

**Trend Calculation**:
- Compares current period with previous period of same duration
- Returns percentage change: `((current - previous) / previous) * 100`
- Positive values indicate growth, negative values indicate decline
- If previous period is 0, returns 100% if current > 0, else 0%

**Notes**:
- Requires `admin` or `sub_admin` role
- All statistics are calculated server-side for accuracy
- Trends are calculated automatically based on selected time range
4. Sorts by usage_count (descending), then by community_count, then by post_count
5. Returns top 10 most used topics

**Note**: All statistics now use real data from the database. Trending topics calculation uses actual community and post associations.

**Error Responses**:
- `400 Bad Request`: Cannot use `time_range` together with `start_date`/`end_date`. Use either `time_range` OR custom dates.
- `400 Bad Request`: Both `start_date` and `end_date` are required together when using custom date range.
- `400 Bad Request`: Invalid date format for `start_date` or `end_date`.
- `400 Bad Request`: `end_date` must be after `start_date`.
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: User does not have admin or sub-admin role

---

## Global Search

### 7. Global Search (Users, Posts, Communities, Topics)

Search across all major entities in the system: users, posts, communities, and topics. This endpoint provides a unified search experience for admins.

**Method**: `GET`  
**Endpoint**: `GET /api/admin/search`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | string | Yes | Search keyword (searches in names, titles, slugs, emails, usernames, descriptions, content) |
| `limit` | integer | No | Maximum results per entity type (default: 5, max: 20) |

**Example Requests**:
```
GET /api/admin/search?q=tech
GET /api/admin/search?q=javascript&limit=10
GET /api/admin/search?q=john%20doe&limit=5
```

**Response** (200 OK):
```json
{
  "users": [
    {
      "id": 12,
      "name": "Sarah Wilson",
      "handle": "@sarahw",
      "avatar": "https://example.com/avatar.jpg",
      "role": "user"
    }
  ],
  "posts": [
    {
      "id": 123,
      "title": "Getting Started with React",
      "slug": "getting-started-with-react",
      "status": "published",
      "view_count": 1250,
      "like_count": 45,
      "comment_count": 12,
      "created_at": "2024-01-15T10:30:00.000Z",
      "user": {
        "id": 5,
        "name": "John Doe",
        "handle": "@johndoe"
      }
    }
  ],
  "communities": [
    {
      "id": 5,
      "name": "Tech Enthusiasts",
      "member_count": 125000,
      "slug": "tech-enthusiasts"
    }
  ],
  "topics": [
    {
      "id": 9,
      "name": "#Technology",
      "posts_count": 450000,
      "slug": "technology"
    }
  ],
  "meta": {
    "users": { "count": 1 },
    "posts": { "count": 15 },
    "communities": { "count": 1 },
    "topics": { "count": 1 }
  }
}
```

**Search Fields**:
- **Users**: Searches in `username`, `email`, and `full_name` (from profile)
- **Posts**: Searches in `post_title`, `post_content`, and `post_slug`
- **Communities**: Searches in `community_name`, `community_slug`, and `community_description`
- **Topics**: Searches in `topic_name`, `topic_slug`, and `topic_description`

**Response Details**:
- **Users**: Returns user ID, name, handle (with @ prefix), avatar URL, and role
- **Posts**: Returns post ID, title, slug, status (published/draft), view/like/comment counts, creation date, and author info
- **Communities**: Returns community ID, name, member count, and slug
- **Topics**: Returns topic ID, name, posts count, and slug

**Notes**:
- Search is case-insensitive and uses LIKE pattern matching
- Results are limited per entity type (default: 5, max: 20)
- Posts search includes both published and draft posts
- Users are sorted alphabetically by username
- Posts are sorted by creation date (newest first)
- Communities are sorted by member count (highest first)
- Topics are sorted by posts count (highest first)
- The `meta` object contains total counts for each entity type (not limited)

**Error Responses**:
- `400 Bad Request`: Missing or invalid search query parameter
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: User does not have admin or sub-admin role

**Business Rules**:
- Requires `admin` or `sub_admin` role
- Search query must be at least 1 character (whitespace is trimmed)
- If search query is empty, returns empty arrays for all entity types
- Limit is enforced per entity type, not total results

---

## User Management

### 6. Create User

Create a new user. Admin can create users with email or phone number (one is optional but at least one must be provided).

**Method**: `POST`  
**Endpoint**: `POST /api/admin/users`

**Headers**:
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "phone_number": null,
  "password": "securePassword123",
  "auth_type": "email",
  "role": "user",
  "device_id": "optional_device_id",
  "device_type": "web",
  "device_token": "optional_device_token"
}
```

**Parameters**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `username` | string | Yes | Unique username (max 255 chars) |
| `email` | string | No* | User email address (required if phone_number not provided) |
| `phone_number` | string | No* | User phone number (required if email not provided) |
| `password` | string | No | User password (min 6 chars, required for email/phone auth) |
| `auth_type` | enum | No | `email`, `phone`, `google`, `apple` (auto-determined if not provided) |
| `role` | enum | No | `admin`, `sub_admin`, `pro_user`, `user` (default: user) |
| `device_id` | string | No | Device identifier for tracking |
| `device_type` | string | No | Device type (web, ios, android) |
| `device_token` | string | No | Push notification token |

\* At least one of `email` or `phone_number` must be provided.

**Response** (201 Created):
```json
{
  "id": 1,
  "username": "johndoe",
  "email": "john@example.com",
  "role": "user",
  "auth_type": "email",
  "is_active": false,
  "is_verified": false,
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

**Error Responses**:
- `400 Bad Request`: Invalid input, validation errors, or neither email nor phone_number provided
- `409 Conflict`: User with this email or username already exists
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: User does not have admin or sub-admin role

**Business Rules**:
- At least one of email or phone_number must be provided
- If only email is provided, auth_type defaults to `email`
- If only phone_number is provided, auth_type defaults to `phone` and phone_number is used as username
- If both email and phone_number are provided, auth_type defaults to `email`
- Password is required for email/phone auth types
- Admin and sub_admin roles are automatically set as active and verified
- Regular users are created as inactive and unverified by default
- Device information is optional but will be registered if provided

**Example with Phone Number Only**:
```json
{
  "username": "+1234567890",
  "phone_number": "+1234567890",
  "password": "securePassword123",
  "auth_type": "phone",
  "role": "user"
}
```

---

### 7. Get Users List (Enhanced Filters)

Get paginated list of all users with comprehensive filtering, search, and sorting options.

**Method**: `GET`  
**Endpoint**: `GET /api/admin/users`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Query Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | integer | No | 1 | Page number |
| `limit` | integer | No | 10 | Items per page (max: 100) |
| `search` | string | No | - | Search by username or email |
| `sort_by` | string | No | `created_at` | Sort field: `id`, `username`, `email`, `role`, `is_active`, `is_verified`, `created_at`, `updated_at` |
| `sort_order` | string | No | `DESC` | Sort order: `ASC` or `DESC` |
| `role` | enum | No | - | Filter by role: `all`, `user`, `pro_user`, `admin`, `sub_admin`, `moderator` |
| `is_active` | enum | No | - | Filter by active status: `active` or `inactive` |
| `is_verified` | enum | No | - | Filter by verification status: `verified` or `unverified` |
| `created_from` | string (ISO date) | No | - | Filter users created from this date |
| `created_to` | string (ISO date) | No | - | Filter users created up to this date |
| `user_id` | integer | No | - | Filter by specific user ID |

**Example Requests**:
```
GET /api/admin/users?page=1&limit=20&search=john&sort_by=username&sort_order=ASC
GET /api/admin/users?role=pro_user&is_active=active&is_verified=verified&created_from=2024-01-01&created_to=2024-01-31
```

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": 1,
      "username": "johndoe",
      "email": "john@example.com",
      "role": "user",
      "auth_type": "email",
      "is_active": true,
      "is_verified": true,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 1250,
    "page": 1,
    "limit": 20,
    "total_pages": 63
  }
}
```

---

### 8. Get User by ID

Get detailed information about a specific user including complete profile data from `user_profile` table, follower counts, and activity statistics.

**Method**: `GET`  
**Endpoint**: `GET /api/admin/users/:userId`

**Headers**:
```
Authorization: Bearer <access_token>
```

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | integer | Yes | User ID |

**Response** (200 OK):
```json
{
  "id": 1,
  "username": "johndoe",
  "email": "john@example.com",
  "role": "user",
  "auth_type": "email",
  "is_active": true,
  "is_verified": true,
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z",
  "profile": {
    "id": 1,
    "user_id": 1,
    "full_name": "John Doe",
    "profile_picture": "https://example.com/picture.jpg",
    "profile_background": "https://example.com/background.jpg",
    "tagline": "Software Developer",
    "profile_bio": "Passionate developer with 10+ years of experience",
    "profile_gender": "male",
    "profile_birthday": "1990-01-15",
    "profile_website": "https://johndoe.com",
    "profile_location": "New York, USA",
    "created_by": null,
    "updated_by": null,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  },
  "follower_count": 150,
  "following_count": 75,
  "posts_count": 50,
  "comments_count": 120,
  "communities_count": 5
}
```

**Error Responses**:
- `404 Not Found`: User not found
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: User does not have admin role

---

### 9. Update User

Update user information including username, email, password, role, auth_type, and status fields.

**Method**: `PUT`  
**Endpoint**: `PUT /api/admin/users/:userId`

**Headers**:
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | integer | Yes | User ID |

**Request Body** (all fields optional):
```json
{
  "username": "newusername",
  "email": "newemail@example.com",
  "phone_number": "+1234567890",
  "password": "newSecurePassword123",
  "auth_type": "email",
  "role": "pro_user",
  "is_active": "active",
  "is_verified": "verified"
}
```

**Parameters**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `username` | string | No | New username (must be unique) |
| `email` | string | No* | New email address (must be unique, required if phone_number not provided) |
| `phone_number` | string | No* | New phone number (required if email not provided) |
| `password` | string | No | New password (min 6 chars, clears tokens on update) |
| `auth_type` | enum | No | `email`, `phone`, `google`, `apple` |
| `role` | enum | No | `admin`, `sub_admin`, `pro_user`, `user` |
| `is_active` | enum | No | `active` or `inactive` |
| `is_verified` | enum | No | `verified` or `unverified` |

\* At least one of `email` or `phone_number` must be provided if updating contact info.

**Response** (200 OK):
```json
{
  "message": "User updated successfully",
  "user": {
    "id": 1,
    "username": "newusername",
    "email": "newemail@example.com",
    "role": "pro_user",
    "auth_type": "email",
    "is_active": true,
    "is_verified": true,
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses**:
- `400 Bad Request`: Cannot deactivate your own account
- `400 Bad Request`: Cannot change role of admin accounts
- `404 Not Found`: User not found
- `409 Conflict`: Username or email already taken
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: User does not have admin or sub-admin role

**Business Rules**:
- Admins cannot deactivate their own account
- Admin account roles cannot be changed
- Username and email must be unique
- Password update clears access and refresh tokens (forces re-login)
- At least one of email or phone_number must be provided if updating contact info
- All fields are optional - only provided fields will be updated
- Status fields use text-based values: `active`/`inactive`, `verified`/`unverified`

**Example Requests**:
```json
// Update only username
{
  "username": "newusername"
}

// Update password and status
{
  "password": "newSecurePassword123",
  "is_active": "active",
  "is_verified": "verified"
}

// Update role and email
{
  "email": "newemail@example.com",
  "role": "pro_user"
}
```

---

### 10. Update User Status

Update user's active status, verification status, or role.

**Endpoint**: `PUT /api/admin/users/:userId/status`

**Headers**:
```
Authorization: Bearer <access_token>
```

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | integer | Yes | User ID |

**Request Body** (all fields optional):
```json
{
  "is_active": false,
  "is_verified": true,
  "role": "pro_user"
}
```

**Note**: The `is_active` and `is_verified` fields accept boolean values (`true`/`false`) or string values (`"true"`/`"false"`). The system will automatically convert string values to booleans.

**Parameters**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `is_active` | boolean | No | User active status (accepts `true`/`false` or `"true"`/`"false"` as string) |
| `is_verified` | boolean | No | User verified status (accepts `true`/`false` or `"true"`/`"false"` as string) |
| `role` | enum | No | `admin`, `sub_admin`, `pro_user`, `user` |

**Response** (200 OK):
```json
{
  "message": "User status updated successfully",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "role": "pro_user",
    "is_active": false,
    "is_verified": true
  }
}
```

**Error Responses**:
- `400 Bad Request`: Cannot deactivate your own account
- `400 Bad Request`: Cannot change role of admin accounts
- `404 Not Found`: User not found
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: User does not have admin role

**Business Rules**:
- Admins cannot deactivate their own account
- Admin account roles cannot be changed (only super admin can do this)
- Sub-admins can update user roles except admin role

---

### 11. Delete User

Deactivate a user account (soft delete).

**Method**: `DELETE`  
**Endpoint**: `DELETE /api/admin/users/:userId`

**Headers**:
```
Authorization: Bearer <access_token>
```

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | integer | Yes | User ID |

**Response** (200 OK):
```json
{
  "message": "User deactivated successfully"
}
```

**Error Responses**:
- `400 Bad Request`: Cannot delete your own account
- `400 Bad Request`: Cannot delete admin accounts
- `404 Not Found`: User not found
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: User does not have admin role

**Business Rules**:
- Admins cannot delete their own account
- Admin accounts cannot be deleted
- This is a soft delete (sets `is_active = false`)

---

## Post Management

The admin module now uses the PostService from the Post Module for all post operations, ensuring consistency and code reuse.

### 7. Get Posts List

Get paginated list of all posts with full details including user and topic information.

**Method**: `GET`  
**Endpoint**: `GET /api/admin/posts`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Query Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | integer | No | 1 | Page number |
| `limit` | integer | No | 10 | Items per page (max: 100) |
| `search` | string | No | - | Search in post title, content, or slug |
| `sort_by` | string | No | `created_at` | Sort field: `id`, `post_title`, `like_count`, `comment_count`, `view_count`, `created_at`, `updated_at` |
| `sort_order` | string | No | `DESC` | Sort order: `ASC` or `DESC` |
| `post_status` | enum | No | - | Filter by status: `draft`, `published`, `archived`, `all` |
| `is_featured` | enum | No | - | `featured` or `not_featured` |
| `has_media` | enum | No | - | `with_media` or `without_media` |
| `media_type` | enum | No | - | Filter by media type: `image`, `video`, `audio`, `none` |
| `user_id` | integer | No | - | Filter by specific user ID |
| `topic_id` | integer | No | - | Filter by specific topic ID |
| `created_from` | string (ISO date) | No | - | Filter posts created from this date |
| `created_to` | string (ISO date) | No | - | Filter posts created up to this date |

**Example Requests**:
```
GET /api/admin/posts?page=1&limit=20&search=technology&post_status=published&is_featured=featured
GET /api/admin/posts?user_id=5&topic_id=2&created_from=2024-01-01&created_to=2024-01-31
```

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": 1,
      "user_id": 5,
      "post_slug": "example-post",
      "post_title": "Example Post Title",
      "post_content": "Post content here...",
      "post_image": "https://example.com/image.jpg",
      "post_video": null,
      "post_audio": null,
      "post_link": null,
      "post_status": "published",
      "post_topic_id": 2,
      "post_tags": "tag1,tag2",
      "community_ids": "1,2",
      "view_count": 150,
      "like_count": 25,
      "dislike_count": 2,
      "comment_count": 10,
      "is_featured": false,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z",
      "user": {
        "id": 5,
        "username": "johndoe",
        "email": "john@example.com"
      },
      "topic": {
        "id": 2,
        "topic_slug": "technology",
        "topic_name": "Technology"
      }
    }
  ],
  "meta": {
    "total": 5000,
    "page": 1,
    "limit": 10,
    "total_pages": 500
  }
}
```

**Features**:
- Includes user information for each post
- Includes topic information for each post
- Supports search across title, content, and slug
- Admin can see all posts regardless of status

---

### 8. Get Post by ID

Get detailed information about a specific post.

**Note**: Admin views do NOT increment the post view count. View counts are only incremented when posts are viewed by regular users through the public API endpoints.

**Method**: `GET`  
**Endpoint**: `GET /api/admin/posts/:postId`

**Headers**:
```
Authorization: Bearer <access_token>
```

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `postId` | integer | Yes | Post ID |

**Response** (200 OK):
```json
{
  "id": 1,
  "user_id": 5,
  "post_slug": "example-post",
  "post_title": "Example Post Title",
  "post_content": "Post content here...",
  "post_status": "published",
  "post_topic_id": 2,
  "view_count": 150,
  "like_count": 25,
  "comment_count": 10,
  "user": {
    "id": 5,
    "username": "johndoe",
    "email": "john@example.com"
  },
  "topic": {
    "id": 2,
    "topic_slug": "technology",
    "topic_name": "Technology"
  }
}
```

**Error Responses**:
- `404 Not Found`: Post not found
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: User does not have admin role

---

### 9. Create Post

Create a new post. Admin can create posts on behalf of any user.

**Method**: `POST`  
**Endpoint**: `POST /api/admin/posts`

**Headers**:
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Request Body** (multipart/form-data):
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `post_slug` | string | Yes | Unique post slug (max 255 chars) |
| `post_title` | string | Yes | Post title (max 255 chars) |
| `post_content` | string | Yes | Post content |
| `post_topic_id` | integer | Yes | Topic ID (must exist and be active) |
| `post_status` | enum | No | `draft`, `published`, `archived` (default: draft) |
| `post_tags` | array[string] | No | Array of post tags |
| `community_ids` | array[integer] | No | Array of community IDs |
| `post_image` | string (URL) | No | Post image URL (max 500 chars) |
| `post_video` | string (URL) | No | Post video URL (max 500 chars) |
| `post_audio` | string (URL) | No | Post audio URL (max 500 chars) |
| `post_link` | string (URL) | No | Post link URL (max 500 chars) |
| `is_featured` | boolean | No | Featured status (default: false) |
| `files` | file[] | No | Up to 3 files (images, videos, or audio) |

**Response** (201 Created):
```json
{
  "id": 1,
  "user_id": 1,
  "post_slug": "admin-created-post",
  "post_title": "Admin Created Post",
  "post_content": "Post content here...",
  "post_status": "published",
  "post_topic_id": 2,
  "view_count": 0,
  "like_count": 0,
  "comment_count": 0,
  "is_featured": false,
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

**Error Responses**:
- `400 Bad Request`: Invalid input or validation errors
- `404 Not Found`: Topic not found or inactive
- `409 Conflict`: Post with this slug already exists
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: User does not have admin or sub-admin role

**Business Rules**:
- Admin can create posts without ownership restrictions
- Files are automatically uploaded to Media Service
- Supports up to 3 files per request (50MB max per file)
- Files are categorized as images, videos, or audio based on MIME type

---

### 10. Update Post

Update an existing post. Admin can update any post regardless of ownership.

**Method**: `PUT`  
**Endpoint**: `PUT /api/admin/posts/:postId`

**Headers**:
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `postId` | integer | Yes | Post ID |

**Request Body** (multipart/form-data, all fields optional):
| Field | Type | Description |
|-------|------|-------------|
| `post_slug` | string | Unique post slug (max 255 chars) |
| `post_title` | string | Post title (max 255 chars) |
| `post_content` | string | Post content |
| `post_topic_id` | integer | Topic ID (must exist and be active) |
| `post_status` | enum | `draft`, `published`, `archived` |
| `post_tags` | array[string] | Array of post tags |
| `community_ids` | array[integer] | Array of community IDs |
| `post_image` | string (URL) | Post image URL (max 500 chars) |
| `post_video` | string (URL) | Post video URL (max 500 chars) |
| `post_audio` | string (URL) | Post audio URL (max 500 chars) |
| `post_link` | string (URL) | Post link URL (max 500 chars) |
| `is_featured` | boolean | Featured status |
| `files` | file[] | Up to 3 files (images, videos, or audio) |

**Response** (200 OK):
```json
{
  "id": 1,
  "post_title": "Updated Post Title",
  "post_content": "Updated content...",
  "post_status": "published",
  "user": {
    "id": 5,
    "username": "johndoe"
  },
  "topic": {
    "id": 2,
    "topic_name": "Technology"
  }
}
```

**Error Responses**:
- `404 Not Found`: Post not found
- `400 Bad Request`: Invalid input or validation errors
- `409 Conflict`: Post with this slug already exists
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: User does not have admin or sub-admin role

**Business Rules**:
- Admin can update any post regardless of ownership
- Files are automatically uploaded to Media Service if provided
- Supports up to 3 files per request (50MB max per file)
- If files are uploaded, they override URL-based media fields

---

### 11. Update Post Status

Update post status (draft, published, archived) or featured status.

**Method**: `PUT`  
**Endpoint**: `PUT /api/admin/posts/:postId/status`

**Headers**:
```
Authorization: Bearer <access_token>
```

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `postId` | integer | Yes | Post ID |

**Request Body** (all fields optional):
```json
{
  "post_status": "published",
  "is_featured": true
}
```

**Parameters**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `post_status` | enum | No | `draft`, `published`, `archived` |
| `is_featured` | boolean | No | Featured post status |

**Response** (200 OK):
```json
{
  "message": "Post status updated successfully",
  "post": {
    "id": 1,
    "post_title": "Example Post Title",
    "post_status": "published",
    "user": {
      "id": 5,
      "username": "johndoe"
    },
    "topic": {
      "id": 2,
      "topic_name": "Technology"
    }
  }
}
```

**Error Responses**:
- `404 Not Found`: Post not found
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: User does not have admin role

**Business Rules**:
- Admin can update any post status regardless of ownership
- Valid post statuses: `draft`, `published`, `archived`
- **Note**: Admin views do NOT increment the post view count (view count is only incremented for regular user views)

---

### 12. Delete Post

Delete a post.

**Method**: `DELETE`  
**Endpoint**: `DELETE /api/admin/posts/:postId`

**Headers**:
```
Authorization: Bearer <access_token>
```

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `postId` | integer | Yes | Post ID |

**Response** (200 OK):
```json
{
  "message": "Post deleted successfully"
}
```

**Error Responses**:
- `404 Not Found`: Post not found
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: User does not have admin role

**Business Rules**:
- Admin can delete any post regardless of ownership
- This is a soft delete (sets `post_status = 'archived'`)
- Post data is preserved for audit purposes

---

## Comment Management

The admin module now uses the CommentService from the Comment Module for all comment operations.

### 11. Get Comments List

Get paginated list of all comments with user and post information.

**Method**: `GET`  
**Endpoint**: `GET /api/admin/comments`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Query Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | integer | No | 1 | Page number |
| `limit` | integer | No | 10 | Items per page (max: 100) |
| `search` | string | No | - | Search in comment content |
| `sort_by` | string | No | `created_at` | Sort field: `id`, `like_count`, `replies_count`, `created_at`, `updated_at` |
| `sort_order` | string | No | `DESC` | Sort order: `ASC` or `DESC` |
| `is_approved` | enum | No | - | Filter by approval status: `approved` or `not_approved` |
| `post_id` | integer | No | - | Filter by specific post ID |
| `user_id` | integer | No | - | Filter by specific user ID |
| `has_replies` | enum | No | - | Filter comments with/without replies: `with_replies` or `without_replies` |
| `created_from` | string (ISO date) | No | - | Filter comments created from this date |
| `created_to` | string (ISO date) | No | - | Filter comments created up to this date |

**Example Requests**:
```
GET /api/admin/comments?page=1&limit=20&is_approved=approved&has_replies=with_replies
GET /api/admin/comments?post_id=5&user_id=10&created_from=2024-01-01&created_to=2024-01-31
```

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": 1,
      "post_id": 5,
      "user_id": 10,
      "parent_comment_id": null,
      "comment_content": "This is a great post!",
      "like_count": 5,
      "dislike_count": 0,
      "is_approved": true,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z",
      "user": {
        "id": 10,
        "username": "commenter",
        "email": "commenter@example.com"
      },
      "post": {
        "id": 5,
        "post_slug": "example-post",
        "post_title": "Example Post Title"
      },
      "replies_count": 3
    }
  ],
  "meta": {
    "total": 15000,
    "page": 1,
    "limit": 10,
    "total_pages": 1500
  }
}
```

**Features**:
- Includes user information for each comment
- Includes post information for each comment
- Shows replies count for top-level comments
- Admin can see all comments including unapproved ones

---

### 12. Get Comment by ID

Get detailed information about a specific comment including replies.

**Method**: `GET`  
**Endpoint**: `GET /api/admin/comments/:commentId`

**Headers**:
```
Authorization: Bearer <access_token>
```

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `commentId` | integer | Yes | Comment ID |

**Response** (200 OK):
```json
{
  "id": 1,
  "post_id": 5,
  "user_id": 10,
  "parent_comment_id": null,
  "comment_content": "This is a great post!",
  "like_count": 5,
  "dislike_count": 0,
  "is_approved": true,
  "user": {
    "id": 10,
    "username": "commenter",
    "email": "commenter@example.com"
  },
  "post": {
    "id": 5,
    "post_slug": "example-post",
    "post_title": "Example Post Title"
  },
  "replies": [
    {
      "id": 2,
      "parent_comment_id": 1,
      "comment_content": "I agree!",
      "user": {
        "id": 11,
        "username": "replier"
      }
    }
  ],
  "replies_count": 1
}
```

**Error Responses**:
- `404 Not Found`: Comment not found
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: User does not have admin role

---

### 13. Update Comment

Update a comment (approve/unapprove, edit content). Admin can update any comment regardless of ownership.

**Endpoint**: `PUT /api/admin/comments/:commentId`

**Headers**:
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `commentId` | integer | Yes | Comment ID |

**Request Body** (all fields optional):
```json
{
  "comment_content": "Updated comment content",
  "is_approved": true
}
```

**Parameters**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `comment_content` | string | No | Updated comment content |
| `is_approved` | boolean | No | Approval status |

**Response** (200 OK):
```json
{
  "id": 1,
  "comment_content": "Updated comment content",
  "is_approved": true,
  "user": {
    "id": 10,
    "username": "commenter"
  },
  "post": {
    "id": 5,
    "post_title": "Example Post Title"
  }
}
```

**Error Responses**:
- `404 Not Found`: Comment not found
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: User does not have admin or sub-admin role

**Business Rules**:
- Admin can update any comment regardless of ownership
- Admin can approve/unapprove comments
- Admin can edit comment content
- Changes are tracked with `updated_by` field

---

### 14. Delete Comment

Delete a comment.

**Method**: `DELETE`  
**Endpoint**: `DELETE /api/admin/comments/:commentId`

**Headers**:
```
Authorization: Bearer <access_token>
```

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `commentId` | integer | Yes | Comment ID |

**Response** (200 OK):
```json
{
  "message": "Comment deleted successfully"
}
```

**Error Responses**:
- `404 Not Found`: Comment not found
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: User does not have admin role

**Business Rules**:
- Admin can delete any comment regardless of ownership
- If comment has replies, it's soft deleted (sets `is_approved = false`)
- If comment has no replies, it's hard deleted
- Post comment count is automatically decremented

---

## Topic Management

The admin module now uses the GeneralService from the General Module for all topic operations.

### 14. Get Topics List

Get paginated list of all topics (active and inactive).

**Method**: `GET`  
**Endpoint**: `GET /api/admin/topics`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Query Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | integer | No | 1 | Page number |
| `limit` | integer | No | 10 | Items per page (max: 100) |
| `search` | string | No | - | Search in topic name, slug, or description |
| `sort_by` | string | No | `created_at` | Sort field: `id`, `topic_name`, `topic_slug`, `created_at`, `updated_at` |
| `sort_order` | string | No | `DESC` | Sort order: `ASC` or `DESC` |
| `is_active` | enum | No | - | Filter by active status: `active` or `inactive` |
| `parent_id` | integer | No | - | Filter by parent topic ID (0 = root categories) |
| `type` | enum | No | - | Filter by type: `categories`, `subtopics`, `all` |
| `has_children` | enum | No | - | Filter topics with/without subtopics: `with_children` or `without_children` |
| `created_from` | string (ISO date) | No | - | Filter topics created from this date |
| `created_to` | string (ISO date) | No | - | Filter topics created up to this date |

**Example Requests**:
```
GET /api/admin/topics?page=1&limit=20&is_active=active&type=categories&has_children=with_children
GET /api/admin/topics?parent_id=0&created_from=2024-01-01&created_to=2024-01-31
```

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": 1,
      "parent_id": 0,
      "topic_slug": "technology",
      "topic_name": "Technology",
      "topic_description": "All about technology",
      "topic_image": "https://example.com/image.jpg",
      "is_active": true,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 200,
    "page": 1,
    "limit": 10,
    "total_pages": 20
  }
}
```

**Features**:
- Admin can see all topics (active and inactive)
- Supports hierarchical topics (parent-child relationships)
- Search across name, slug, and description

---

### 15. Create Topic

Create a new topic. Admin can create topics with hierarchical structure.

**Method**: `POST`  
**Endpoint**: `POST /api/admin/topics`

**Headers**:
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Request Body** (multipart/form-data):
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `topic_slug` | string | Yes | Unique topic slug (max 255 chars) |
| `topic_name` | string | Yes | Topic name (max 255 chars) |
| `topic_description` | string | No | Topic description |
| `topic_image` | string (URL) | No | Topic image URL (max 500 chars) |
| `parent_id` | integer | No | Parent topic ID (default: 0 for root topics) |
| `is_active` | enum | No | Active status: `'active'` or `'inactive'` (string, default: `'active'`) |
| `topic_image` | file | No | Topic image file (10MB max) |

**Response** (201 Created):
```json
{
  "id": 4,
  "parent_id": 0,
  "topic_slug": "artificial-intelligence",
  "topic_name": "Artificial Intelligence",
  "topic_description": "AI, machine learning, and deep learning",
  "topic_image": "https://example.com/ai.jpg",
  "is_active": true, // Note: Response returns boolean, but request accepts 'active'/'inactive' string
  "created_at": "2024-01-04T00:00:00.000Z"
}
```

**Error Responses**:
- `400 Bad Request`: Invalid input or validation errors
- `404 Not Found`: Parent topic not found (if parent_id > 0)
- `409 Conflict`: Topic with this slug already exists
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: User does not have admin or sub-admin role

**Business Rules**:
- Admin can create topics without restrictions
- Supports hierarchical topics (parent-child relationships)
- Image is automatically uploaded to Media Service if provided
- Image file size limit: 10MB

---

### 17. Get Topic by ID

Get detailed information about a specific topic including parent and children.

**Method**: `GET`  
**Endpoint**: `GET /api/admin/topics/:topicId`

**Headers**:
```
Authorization: Bearer <access_token>
```

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `topicId` | integer | Yes | Topic ID |

**Response** (200 OK):
```json
{
  "id": 1,
  "parent_id": 0,
  "topic_slug": "technology",
  "topic_name": "Technology",
  "topic_description": "All about technology",
  "topic_image": "https://example.com/image.jpg",
  "is_active": true,
  "parent": null,
  "children": [
    {
      "id": 2,
      "topic_name": "Programming",
      "topic_slug": "programming"
    }
  ]
}
```

**Error Responses**:
- `404 Not Found`: Topic not found
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: User does not have admin role

---

### 18. Update Topic

Update an existing topic. Admin can update any topic.

**Method**: `PUT`  
**Endpoint**: `PUT /api/admin/topics/:topicId`

**Headers**:
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `topicId` | integer | Yes | Topic ID |

**Request Body** (multipart/form-data, all fields optional):
| Field | Type | Description |
|-------|------|-------------|
| `topic_slug` | string | Unique topic slug (max 255 chars) |
| `topic_name` | string | Topic name (max 255 chars) |
| `topic_description` | string | Topic description |
| `topic_image` | string (URL) | Topic image URL (max 500 chars) |
| `parent_id` | integer | Parent topic ID (min: 0) |
| `is_active` | boolean | Active status |
| `topic_image` | file | Topic image file (10MB max) |

**Response** (200 OK):
```json
{
  "id": 1,
  "topic_name": "AI & Machine Learning",
  "topic_description": "Updated description",
  "is_active": true, // Note: Response returns boolean, but request accepts 'active'/'inactive' string
  "parent": null,
  "children": []
}
```

**Error Responses**:
- `404 Not Found`: Topic not found
- `400 Bad Request`: Invalid input, circular reference, or validation errors
- `409 Conflict`: Topic with this slug already exists
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: User does not have admin or sub-admin role

**Business Rules**:
- Admin can update any topic
- Prevents circular references in parent-child relationships
- Image is automatically uploaded to Media Service if provided
- Image file size limit: 10MB

---

### 19. Update Topic Status

Activate or deactivate a topic.

**Method**: `PUT`  
**Endpoint**: `PUT /api/admin/topics/:topicId/status`

**Headers**:
```
Authorization: Bearer <access_token>
```

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `topicId` | integer | Yes | Topic ID |

**Request Body**:
```json
{
  "is_active": "inactive"
}
```

**Parameters**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `is_active` | enum | Yes | Topic active status: `'active'` or `'inactive'` (string, not boolean) |

**Response** (200 OK):
```json
{
  "message": "Topic status updated successfully",
  "topic": {
    "id": 1,
    "topic_name": "Technology",
    "is_active": false, // Note: Response returns boolean, but request accepts 'active'/'inactive' string
    "parent": null,
    "children": []
  }
}
```

**Error Responses**:
- `404 Not Found`: Topic not found
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: User does not have admin role

**Business Rules**:
- Admin can activate/deactivate any topic
- Deactivating a topic affects its visibility in the system
- Topics with active children cannot be deleted (must deactivate children first)
- **Note**: The `is_active` field accepts `'active'` or `'inactive'` strings (not booleans). The API converts these strings to booleans internally for database storage.

---

## Community Management

The admin module now uses the CommunityService from the Community Module for all community operations.

### 17. Get Communities List

Get paginated list of all communities with member and topic counts.

**Method**: `GET`  
**Endpoint**: `GET /api/admin/communities`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Query Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | integer | No | 1 | Page number |
| `limit` | integer | No | 10 | Items per page (max: 100) |
| `search` | string | No | - | Search in community name, slug, or description |
| `sort_by` | string | No | `created_at` | Sort field: `id`, `community_name`, `created_at`, `updated_at` |
| `sort_order` | string | No | `DESC` | Sort order: `ASC` or `DESC` |
| `is_active` | enum | No | - | Filter by active status: `active` or `inactive` |
| `is_private` | enum | No | - | Filter by privacy: `private` or `public` |
| `category_id` | integer | No | - | Filter by category ID |
| `min_members` | integer | No | - | Filter by minimum member count |
| `max_members` | integer | No | - | Filter by maximum member count |
| `created_from` | string (ISO date) | No | - | Filter communities created from this date |
| `created_to` | string (ISO date) | No | - | Filter communities created up to this date |

**Example Requests**:
```
GET /api/admin/communities?page=1&limit=20&is_active=active&is_private=public
GET /api/admin/communities?min_members=10&max_members=100&created_from=2024-01-01&created_to=2024-01-31
```

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": 1,
      "community_slug": "tech-enthusiasts",
      "community_name": "Tech Enthusiasts",
      "community_description": "A community for tech lovers",
      "community_image": "https://example.com/image.jpg",
      "is_active": true,
      "member_count": 150,
      "topic_count": 10,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "total_pages": 5
  }
}
```

**Features**:
- Includes member count for each community
- Includes topic count for each community
- Admin can see all communities (active and inactive)
- Search across name, slug, and description

---

### 19. Create Community

Create a new community. Admin can create communities.

**Endpoint**: `POST /api/admin/communities`

**Headers**:
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Request Body** (multipart/form-data):
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `community_slug` | string | Yes | Unique community slug (max 255 chars) |
| `community_name` | string | Yes | Community name (max 255 chars) |
| `community_description` | string | No | Community description |
| `community_image` | string (URL) | No | Community image URL (max 500 chars) |
| `is_active` | boolean | No | Active status (default: true) |
| `community_image` | file | No | Community image file (10MB max) |

**Response** (201 Created):
```json
{
  "id": 1,
  "community_slug": "tech-enthusiasts",
  "community_name": "Tech Enthusiasts",
  "community_description": "A community for technology lovers",
  "community_image": "https://example.com/tech.jpg",
  "is_active": true,
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

**Error Responses**:
- `400 Bad Request`: Invalid input or validation errors
- `409 Conflict`: Community with this slug already exists
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: User does not have admin or sub-admin role

**Business Rules**:
- Admin can create communities without restrictions
- Image is automatically uploaded to Media Service if provided
- Image file size limit: 10MB
- Admin automatically becomes a community admin member

---

### 20. Get Community by ID

Get detailed information about a specific community.

**Method**: `GET`  
**Endpoint**: `GET /api/admin/communities/:communityId`

**Headers**:
```
Authorization: Bearer <access_token>
```

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `communityId` | integer | Yes | Community ID |

**Response** (200 OK):
```json
{
  "id": 1,
  "community_slug": "tech-enthusiasts",
  "community_name": "Tech Enthusiasts",
  "community_description": "A community for tech lovers",
  "community_image": "https://example.com/image.jpg",
  "is_active": true,
  "member_count": 150,
  "topic_count": 10
}
```

**Error Responses**:
- `404 Not Found`: Community not found
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: User does not have admin role

---

### 21. Update Community

Update an existing community. Admin can update any community regardless of membership.

**Endpoint**: `PUT /api/admin/communities/:communityId`

**Headers**:
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `communityId` | integer | Yes | Community ID |

**Request Body** (multipart/form-data, all fields optional):
| Field | Type | Description |
|-------|------|-------------|
| `community_slug` | string | Unique community slug (max 255 chars) |
| `community_name` | string | Community name (max 255 chars) |
| `community_description` | string | Community description |
| `community_image` | string (URL) | Community image URL (max 500 chars) |
| `is_active` | boolean | Active status |
| `community_image` | file | Community image file (10MB max) |

**Response** (200 OK):
```json
{
  "id": 1,
  "community_name": "Updated Community Name",
  "community_description": "Updated description",
  "is_active": true,
  "member_count": 150,
  "topic_count": 10
}
```

**Error Responses**:
- `404 Not Found`: Community not found
- `400 Bad Request`: Invalid input or validation errors
- `409 Conflict`: Community with this slug already exists
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: User does not have admin or sub-admin role

**Business Rules**:
- Admin can update any community regardless of membership
- Bypasses community admin/moderator role requirements
- Image is automatically uploaded to Media Service if provided
- Image file size limit: 10MB

---

### 22. Update Community Status

Activate or deactivate a community.

**Method**: `PUT`  
**Endpoint**: `PUT /api/admin/communities/:communityId/status`

**Headers**:
```
Authorization: Bearer <access_token>
```

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `communityId` | integer | Yes | Community ID |

**Request Body**:
```json
{
  "is_active": false
}
```

**Parameters**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `is_active` | boolean | Yes | Community active status |

**Response** (200 OK):
```json
{
  "message": "Community status updated successfully",
  "community": {
    "id": 1,
    "community_name": "Tech Enthusiasts",
    "is_active": false,
    "member_count": 150,
    "topic_count": 10
  }
}
```

**Error Responses**:
- `404 Not Found`: Community not found
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: User does not have admin role

**Business Rules**:
- Admin can activate/deactivate any community
- Deactivating a community affects its visibility
- Member and topic counts are preserved

---

### 23. Delete Community

Delete a community (soft delete). Admin can delete any community regardless of membership.

**Endpoint**: `DELETE /api/admin/communities/:communityId`

**Headers**:
```
Authorization: Bearer <access_token>
```

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `communityId` | integer | Yes | Community ID |

**Response** (200 OK):
```json
{
  "message": "Community deleted successfully"
}
```

**Error Responses**:
- `404 Not Found`: Community not found
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: User does not have admin or sub-admin role

**Business Rules**:
- Admin can delete any community regardless of membership
- This is a soft delete (sets `is_active = false`)
- Community data is preserved for audit purposes
- Bypasses community admin role requirements

---

### 24. Get Community Members

Get paginated list of all members in a community.

**Method**: `GET`  
**Endpoint**: `GET /api/admin/communities/:communityId/members`

**Headers**:
```
Authorization: Bearer <access_token>
```

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `communityId` | integer | Yes | Community ID |

**Query Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | integer | No | 1 | Page number |
| `limit` | integer | No | 10 | Items per page (max 100) |
| `sort_by` | string | No | `created_at` | Field to sort by |
| `sort_order` | string | No | `DESC` | `ASC` or `DESC` |

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": 1,
      "community_id": 1,
      "user_id": 5,
      "role": "admin",
      "is_active": true,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z",
      "user": {
        "id": 5,
        "username": "johndoe",
        "email": "john@example.com"
      }
    }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 10,
    "total_pages": 15
  }
}
```

**Error Responses**:
- `404 Not Found`: Community not found
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: User does not have admin or sub-admin role

**Business Rules**:
- Admin can view members of any community
- Shows all active members with their roles
- Includes user information for each member

---

### 25. Update Member Role

Update a member's role in a community. Admin can update member roles in any community.

**Method**: `PUT`  
**Endpoint**: `PUT /api/admin/communities/:communityId/members/:memberId/role`

**Headers**:
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `communityId` | integer | Yes | Community ID |
| `memberId` | integer | Yes | Member user ID |

**Request Body**:
```json
{
  "role": "moderator"
}
```

**Parameters**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `role` | enum | Yes | `admin`, `moderator`, `member` |

**Response** (200 OK):
```json
{
  "id": 1,
  "community_id": 1,
  "user_id": 5,
  "role": "moderator",
  "is_active": true,
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z",
  "user": {
    "id": 5,
    "username": "johndoe",
    "email": "john@example.com"
  }
}
```

**Error Responses**:
- `404 Not Found`: Community or member not found
- `400 Bad Request`: Cannot change role of the only admin
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: User does not have admin or sub-admin role

**Business Rules**:
- Admin can update member roles in any community
- Bypasses community admin role requirements
- Cannot change role of the only admin (must assign another admin first)
- Changes are tracked with `updated_by` field

---

### 26. Get Community Topics

Get all topics associated with a community.

**Method**: `GET`  
**Endpoint**: `GET /api/admin/communities/:communityId/topics`

**Headers**:
```
Authorization: Bearer <access_token>
```

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `communityId` | integer | Yes | Community ID |

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "community_id": 1,
    "topic_id": 5,
    "is_active": true,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z",
    "topic": {
      "id": 5,
      "topic_slug": "technology",
      "topic_name": "Technology",
      "topic_description": "All about technology",
      "topic_image": "https://example.com/image.jpg"
    }
  }
]
```

**Error Responses**:
- `404 Not Found`: Community not found
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: User does not have admin or sub-admin role

**Business Rules**:
- Admin can view topics of any community
- Returns all active topic associations
- Includes full topic information

---

### 27. Add Topic to Community

Add a topic to a community. Admin can add topics to any community.

**Endpoint**: `POST /api/admin/communities/:communityId/topics`

**Headers**:
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `communityId` | integer | Yes | Community ID |

**Request Body**:
```json
{
  "topic_id": 5
}
```

**Parameters**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `topic_id` | integer | Yes | Topic ID (must exist and be active) |

**Response** (201 Created):
```json
{
  "id": 1,
  "community_id": 1,
  "topic_id": 5,
  "is_active": true,
  "topic": {
    "id": 5,
    "topic_slug": "technology",
    "topic_name": "Technology",
    "topic_description": "All about technology",
    "topic_image": "https://example.com/image.jpg"
  }
}
```

**Error Responses**:
- `404 Not Found`: Community or topic not found, or topic is inactive
- `409 Conflict`: Topic is already associated with this community
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: User does not have admin or sub-admin role

**Business Rules**:
- Admin can add topics to any community
- Bypasses community admin/moderator role requirements
- Topic must exist and be active
- If topic was previously associated but inactive, it will be reactivated
- Changes are tracked with `created_by` or `updated_by` field

---

### 28. Remove Topic from Community

Remove a topic from a community. Admin can remove topics from any community.

**Method**: `DELETE`  
**Endpoint**: `DELETE /api/admin/communities/:communityId/topics/:topicId`

**Headers**:
```
Authorization: Bearer <access_token>
```

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `communityId` | integer | Yes | Community ID |
| `topicId` | integer | Yes | Topic ID |

**Response** (200 OK):
```json
{
  "message": "Topic removed from community successfully"
}
```

**Error Responses**:
- `404 Not Found`: Community not found or topic is not associated with this community
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: User does not have admin or sub-admin role

**Business Rules**:
- Admin can remove topics from any community
- Bypasses community admin/moderator role requirements
- This is a soft delete (sets `is_active = false`)
- Topic association data is preserved for audit purposes
- Changes are tracked with `updated_by` field

---

## Poll Management

The admin module now uses the PollService from the Poll Module for all poll operations.

### 20. Get Polls List

Get paginated list of all polls with user and option information.

**Method**: `GET`  
**Endpoint**: `GET /api/admin/polls`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Query Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | integer | No | 1 | Page number |
| `limit` | integer | No | 10 | Items per page (max: 100) |
| `search` | string | No | - | Search in poll title or description |
| `sort_by` | string | No | `created_at` | Sort field: `id`, `poll_title`, `vote_count`, `view_count`, `poll_expires_at`, `created_at`, `updated_at` |
| `sort_order` | string | No | `DESC` | Sort order: `ASC` or `DESC` |
| `poll_status` | enum | No | - | Filter by status: `draft`, `published`, `ended`, `all`, `active` |
| `is_featured` | enum | No | - | `featured` or `not_featured` |
| `is_expired` | enum | No | - | `expired` or `not_expired` |
| `user_id` | integer | No | - | Filter by specific user ID |
| `expires_from` | string (ISO date) | No | - | Filter polls expiring from this date |
| `expires_to` | string (ISO date) | No | - | Filter polls expiring up to this date |
| `created_from` | string (ISO date) | No | - | Filter polls created from this date |
| `created_to` | string (ISO date) | No | - | Filter polls created up to this date |

**Example Requests**:
```
GET /api/admin/polls?page=1&limit=20&poll_status=published&is_featured=featured&is_expired=not_expired
GET /api/admin/polls?user_id=5&expires_from=2024-01-01&expires_to=2024-12-31
```

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": 1,
      "user_id": 5,
      "poll_slug": "favorite-programming-language",
      "poll_title": "What's your favorite programming language?",
      "poll_description": "Let us know your preference",
      "poll_expires_at": "2024-12-31T23:59:59.000Z",
      "poll_status": "published",
      "vote_count": 150,
      "view_count": 500,
      "is_featured": false,
      "is_expired": false,
      "created_at": "2024-01-01T00:00:00.000Z",
      "user": {
        "id": 5,
        "username": "pollcreator",
        "email": "creator@example.com"
      },
      "options": [
        {
          "id": 1,
          "option_text": "JavaScript",
          "vote_count": 60,
          "percentage": 40.0
        },
        {
          "id": 2,
          "option_text": "Python",
          "vote_count": 50,
          "percentage": 33.33
        },
        {
          "id": 3,
          "option_text": "Java",
          "vote_count": 40,
          "percentage": 26.67
        }
      ]
    }
  ],
  "meta": {
    "total": 300,
    "page": 1,
    "limit": 10,
    "total_pages": 30
  }
}
```

**Features**:
- Includes user information for each poll
- Includes poll options with vote counts and percentages
- Shows expiration status
- Admin can see all polls regardless of status

---

### 23. Create Poll

Create a new poll with multiple options. Admin can create polls.

**Method**: `POST`  
**Endpoint**: `POST /api/admin/polls`

**Headers**:
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "poll_slug": "favorite-programming-language-2024",
  "poll_title": "What's your favorite programming language in 2024?",
  "poll_description": "Share your favorite programming language and why you love it.",
  "poll_expires_at": "2024-12-31T23:59:59.000Z",
  "poll_status": "published",
  "community_ids": [1, 2],
  "is_featured": false,
  "options": [
    {
      "option_text": "JavaScript",
      "display_order": 0
    },
    {
      "option_text": "Python",
      "display_order": 1
    }
  ]
}
```

**Parameters**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `poll_slug` | string | Yes | Unique poll slug (max 255 chars) |
| `poll_title` | string | Yes | Poll title (max 255 chars) |
| `poll_description` | string | Yes | Poll description |
| `poll_expires_at` | string (ISO date) | Yes | Poll expiration date (must be in future) |
| `poll_status` | enum | No | `draft`, `published`, `ended` (default: draft) |
| `community_ids` | array[integer] | No | Array of community IDs |
| `is_featured` | boolean | No | Featured poll status (default: false) |
| `options` | array[object] | Yes | Array of poll options (minimum 2) |
| `options[].option_text` | string | Yes | Option text (max 255 chars) |
| `options[].display_order` | integer | No | Display order (default: array index) |

**Response** (201 Created):
```json
{
  "id": 1,
  "user_id": 1,
  "poll_slug": "favorite-programming-language-2024",
  "poll_title": "What's your favorite programming language in 2024?",
  "poll_status": "published",
  "vote_count": 0,
  "view_count": 0,
  "is_featured": false,
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

**Error Responses**:
- `400 Bad Request`: Invalid input, validation errors, or expiration date in past
- `409 Conflict`: Poll with this slug already exists
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: User does not have admin or sub-admin role

**Business Rules**:
- Admin can create polls without restrictions
- Polls must have at least 2 options
- Expiration date must be in the future
- Options are created automatically with the poll

---

### 24. Get Poll by ID

Get detailed information about a specific poll.

**Note**: Admin views do NOT increment the poll view count. View counts are only incremented when polls are viewed by regular users through the public API endpoints.

**Method**: `GET`  
**Endpoint**: `GET /api/admin/polls/:pollId`

**Headers**:
```
Authorization: Bearer <access_token>
```

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `pollId` | integer | Yes | Poll ID |

**Response** (200 OK):
```json
{
  "id": 1,
  "poll_title": "What's your favorite programming language?",
  "poll_description": "Let us know your preference",
  "poll_status": "published",
  "vote_count": 150,
  "view_count": 500,
  "is_expired": false,
  "user": {
    "id": 5,
    "username": "pollcreator"
  },
  "options": [
    {
      "id": 1,
      "option_text": "JavaScript",
      "vote_count": 60,
      "percentage": 40.0
    }
  ]
}
```

**Error Responses**:
- `404 Not Found`: Poll not found
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: User does not have admin role

**Business Rules**:
- **Note**: Admin views do NOT increment the poll view count (view count is only incremented for regular user views)

---

### 25. Update Poll

Update an existing poll. Admin can update any poll regardless of ownership.

**Method**: `PUT`  
**Endpoint**: `PUT /api/admin/polls/:pollId`

**Headers**:
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `pollId` | integer | Yes | Poll ID |

**Request Body** (all fields optional):
```json
{
  "poll_title": "Updated Poll Title",
  "poll_description": "Updated description",
  "poll_expires_at": "2024-12-31T23:59:59.000Z",
  "poll_status": "published",
  "is_featured": true
}
```

**Parameters**:
| Field | Type | Description |
|-------|------|-------------|
| `poll_slug` | string | Unique poll slug (max 255 chars) |
| `poll_title` | string | Poll title (max 255 chars) |
| `poll_description` | string | Poll description |
| `poll_expires_at` | string (ISO date) | Poll expiration date (must be in future) |
| `poll_status` | enum | `draft`, `published`, `ended` |
| `community_ids` | array[integer] | Array of community IDs |
| `is_featured` | boolean | Featured poll status |
| `poll_winner_option_id` | integer | Winner option ID (for ended polls) |

**Response** (200 OK):
```json
{
  "id": 1,
  "poll_title": "Updated Poll Title",
  "poll_status": "published",
  "vote_count": 150,
  "view_count": 500,
  "is_featured": true,
  "user": {
    "id": 5,
    "username": "pollcreator"
  }
}
```

**Error Responses**:
- `404 Not Found`: Poll not found
- `400 Bad Request`: Invalid input, validation errors, or expiration date in past
- `409 Conflict`: Poll with this slug already exists
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: User does not have admin or sub-admin role

**Business Rules**:
- Admin can update any poll regardless of ownership
- Expiration date must be in the future if being updated
- Winner option can be set for ended polls
- Changes are tracked with `updated_by` field

---

### 26. Delete Poll

Delete a poll.

**Method**: `DELETE`  
**Endpoint**: `DELETE /api/admin/polls/:pollId`

**Headers**:
```
Authorization: Bearer <access_token>
```

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `pollId` | integer | Yes | Poll ID |

**Response** (200 OK):
```json
{
  "message": "Poll deleted successfully"
}
```

**Error Responses**:
- `404 Not Found`: Poll not found
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: User does not have admin role

**Business Rules**:
- Admin can delete any poll regardless of ownership
- This is a soft delete (sets `poll_status = 'ended'`)
- Poll data is preserved for audit purposes

---

## Subscription Management

The admin module now uses the SubscriptionService from the Subscription Module for all subscription operations.

### 27. Get Subscriptions List

Get paginated list of all subscriptions (including inactive).

**Method**: `GET`  
**Endpoint**: `GET /api/admin/subscriptions`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Query Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | integer | No | 1 | Page number |
| `limit` | integer | No | 10 | Items per page (max: 100) |
| `search` | string | No | - | Search in subscription name or description |
| `sort_by` | string | No | `created_at` | Sort field: `id`, `subscription_name`, `created_at`, `updated_at` |
| `sort_order` | string | No | `DESC` | Sort order: `ASC` or `DESC` |
| `subscription_type` | enum | No | - | Filter by type: `free`, `pro`, `premium` |
| `is_active` | enum | No | - | Filter by active status: `active` or `inactive` |

**Example Requests**:
```
GET /api/admin/subscriptions?page=1&limit=20&subscription_type=pro&is_active=active
GET /api/admin/subscriptions?search=premium&is_active=active
```

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": 1,
      "subscription_type": "pro",
      "subscription_name": "Pro Plan",
      "subscription_description": "Access to premium features",
      "subscription_price": 29.99,
      "subscription_duration": 30,
      "subscription_duration_type": "days",
      "is_active": true,
      "created_by": 1,
      "updated_by": null,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 5,
    "page": 1,
    "limit": 10,
    "total_pages": 1
  }
}
```

**Features**:
- Admin can see all subscriptions (active and inactive)
- Supports search across name and description
- Filter by subscription type and active status

---

### 28. Get Subscription by ID

Get detailed information about a specific subscription.

**Method**: `GET`  
**Endpoint**: `GET /api/admin/subscriptions/:id`

**Headers**:
```
Authorization: Bearer <access_token>
```

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Subscription ID |

**Response** (200 OK):
```json
{
  "id": 1,
  "subscription_type": "pro",
  "subscription_name": "Pro Plan",
  "subscription_description": "Access to premium features",
  "subscription_price": 29.99,
  "subscription_duration": 30,
  "subscription_duration_type": "days",
  "is_active": true,
  "created_by": 1,
  "updated_by": null,
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

**Error Responses**:
- `404 Not Found`: Subscription not found
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: User does not have admin or sub-admin role

---

### 29. Create Subscription

Create a new subscription plan.

**Method**: `POST`  
**Endpoint**: `POST /api/admin/subscriptions`

**Headers**:
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "subscription_type": "pro",
  "subscription_name": "Pro Plan",
  "subscription_description": "Access to premium features",
  "subscription_price": 29.99,
  "subscription_duration": 30,
  "subscription_duration_type": "days",
  "is_active": true
}
```

**Parameters**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `subscription_type` | enum | Yes | `free`, `pro`, `premium` |
| `subscription_name` | string | Yes | Unique subscription name |
| `subscription_description` | string | No | Subscription description |
| `subscription_price` | number | Yes | Price (decimal) |
| `subscription_duration` | number | Yes | Duration value |
| `subscription_duration_type` | enum | Yes | `days`, `weeks`, `months`, `years` |
| `is_active` | boolean | No | Active status (default: `true`) |

**Response** (201 Created):
```json
{
  "id": 1,
  "subscription_type": "pro",
  "subscription_name": "Pro Plan",
  "subscription_description": "Access to premium features",
  "subscription_price": 29.99,
  "subscription_duration": 30,
  "subscription_duration_type": "days",
  "is_active": true,
  "created_by": 1,
  "updated_by": null,
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

**Error Responses**:
- `409 Conflict`: Subscription name already exists
- `400 Bad Request`: Invalid input data
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: User does not have admin or sub-admin role

**Business Rules**:
- Subscription name must be unique
- Price must be a positive number
- Duration must be a positive integer
- Admin can create subscriptions without restrictions

---

### 30. Update Subscription

Update an existing subscription plan.

**Method**: `PUT`  
**Endpoint**: `PUT /api/admin/subscriptions/:id`

**Headers**:
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Subscription ID |

**Request Body** (all fields optional):
```json
{
  "subscription_type": "premium",
  "subscription_name": "Premium Plan",
  "subscription_description": "Updated description",
  "subscription_price": 49.99,
  "subscription_duration": 60,
  "subscription_duration_type": "days",
  "is_active": true
}
```

**Response** (200 OK):
```json
{
  "id": 1,
  "subscription_type": "premium",
  "subscription_name": "Premium Plan",
  "subscription_description": "Updated description",
  "subscription_price": 49.99,
  "subscription_duration": 60,
  "subscription_duration_type": "days",
  "is_active": true,
  "created_by": 1,
  "updated_by": 1,
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-02T00:00:00.000Z"
}
```

**Error Responses**:
- `404 Not Found`: Subscription not found
- `409 Conflict`: New subscription name already exists
- `400 Bad Request`: Invalid input data
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: User does not have admin or sub-admin role

**Business Rules**:
- Admin can update any subscription
- If subscription name is changed, it must be unique
- Changes are tracked with `updated_by` field

---

### 31. Delete Subscription

Soft delete a subscription (sets `is_active` to `false`).

**Method**: `DELETE`  
**Endpoint**: `DELETE /api/admin/subscriptions/:id`

**Headers**:
```
Authorization: Bearer <access_token>
```

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Subscription ID |

**Response** (200 OK):
```json
{
  "message": "Subscription deleted successfully"
}
```

**Error Responses**:
- `404 Not Found`: Subscription not found
- `400 Bad Request`: Cannot delete subscription with active user subscriptions
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: User does not have admin or sub-admin role

**Business Rules**:
- Admin can delete any subscription
- Cannot delete subscription with active user subscriptions
- This is a soft delete (sets `is_active = false`)
- Subscription data is preserved for audit purposes

---

### 32. Get User Subscriptions List

Get paginated list of all user subscriptions across all users.

**Method**: `GET`  
**Endpoint**: `GET /api/admin/user-subscriptions`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Query Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | integer | No | 1 | Page number |
| `limit` | integer | No | 10 | Items per page (max 100) |
| `search` | string | No | - | Search in subscription name |
| `sort_by` | string | No | `created_at` | Field to sort by |
| `sort_order` | string | No | `DESC` | `ASC` or `DESC` |
| `user_id` | integer | No | - | Filter by user ID |
| `subscription_id` | integer | No | - | Filter by subscription ID |
| `subscription_status` | enum | No | - | Filter by status: `pending`, `active`, `inactive`, `expired` |
| `is_active` | enum | No | - | Filter by active status: `active` or `inactive` |

**Example Requests**:
```
GET /api/admin/user-subscriptions?page=1&limit=20&subscription_status=active&is_active=active
GET /api/admin/user-subscriptions?user_id=5&subscription_id=1&is_active=active
```

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": 1,
      "user_id": 5,
      "subscription_id": 1,
      "subscription_start_date": "2024-01-01T00:00:00.000Z",
      "subscription_end_date": "2024-01-31T23:59:59.000Z",
      "subscription_renewal_type": "auto",
      "subscription_renewal_date": "2024-01-31T00:00:00.000Z",
      "subscription_renewal_amount": 29.99,
      "subscription_renewal_currency": "USD",
      "subscription_renewal_gateway": "stripe",
      "subscription_status": "active",
      "is_active": true,
      "created_at": "2024-01-01T10:00:00.000Z",
      "updated_at": "2024-01-01T10:00:00.000Z",
      "subscription": {
        "id": 1,
        "subscription_type": "pro",
        "subscription_name": "Pro Plan",
        "subscription_price": 29.99
      }
    }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 10,
    "total_pages": 15
  }
}
```

**Features**:
- Admin can see all user subscriptions across all users
- Includes subscription plan details
- Filter by user, subscription, status, and active status

---

### 33. Get User Subscription by ID

Get detailed information about a specific user subscription.

**Method**: `GET`  
**Endpoint**: `GET /api/admin/user-subscriptions/:id`

**Headers**:
```
Authorization: Bearer <access_token>
```

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | User subscription ID |

**Response** (200 OK):
```json
{
  "id": 1,
  "user_id": 5,
  "subscription_id": 1,
  "subscription_start_date": "2024-01-01T00:00:00.000Z",
  "subscription_end_date": "2024-01-31T23:59:59.000Z",
  "subscription_renewal_type": "auto",
  "subscription_renewal_date": "2024-01-31T00:00:00.000Z",
  "subscription_renewal_amount": 29.99,
  "subscription_renewal_currency": "USD",
  "subscription_renewal_gateway": "stripe",
  "subscription_status": "active",
  "is_active": true,
  "created_at": "2024-01-01T10:00:00.000Z",
  "updated_at": "2024-01-01T10:00:00.000Z",
  "subscription": {
    "id": 1,
    "subscription_type": "pro",
    "subscription_name": "Pro Plan",
    "subscription_description": "Access to premium features",
    "subscription_price": 29.99
  }
}
```

**Error Responses**:
- `404 Not Found`: User subscription not found
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: User does not have admin or sub-admin role

---

### 34. Update User Subscription Status

Update the status of a user subscription.

**Method**: `PUT`  
**Endpoint**: `PUT /api/admin/user-subscriptions/:id/status`

**Headers**:
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | User subscription ID |

**Request Body**:
```json
{
  "status": "active"
}
```

**Parameters**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | enum | Yes | `pending`, `active`, `inactive`, `expired` |

**Response** (200 OK):
```json
{
  "id": 1,
  "user_id": 5,
  "subscription_id": 1,
  "subscription_status": "active",
  "is_active": true,
  "subscription": {
    "id": 1,
    "subscription_name": "Pro Plan"
  }
}
```

**Error Responses**:
- `404 Not Found`: User subscription not found
- `400 Bad Request`: Invalid status value
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: User does not have admin or sub-admin role

**Business Rules**:
- Admin can update any user subscription status
- If activating, start date is set if not already set
- Changes are tracked with `updated_by` field

---

## Payment Management

The admin module now uses the SubscriptionService from the Subscription Module for all payment operations.

### 35. Get Payments List

Get paginated list of all payments across all users.

**Method**: `GET`  
**Endpoint**: `GET /api/admin/payments`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Query Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | integer | No | 1 | Page number |
| `limit` | integer | No | 10 | Items per page (max 100) |
| `search` | string | No | - | Search by transaction ID or gateway |
| `sort_by` | string | No | `created_at` | Field to sort by |
| `sort_order` | string | No | `DESC` | `ASC` or `DESC` |
| `user_id` | integer | No | - | Filter by user ID |
| `users_subscriptions_id` | integer | No | - | Filter by user subscription ID |
| `payment_status` | enum | No | - | Filter by status: `pending`, `completed`, `failed` |
| `payment_method` | enum | No | - | Filter by method: `credit_card`, `debit_card`, `paypal`, `bank_transfer`, `cash` |

**Example Requests**:
```
GET /api/admin/payments?page=1&limit=20&payment_status=completed&payment_method=credit_card
GET /api/admin/payments?user_id=5&users_subscriptions_id=1&payment_status=completed
```

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": 1,
      "users_subscriptions_id": 1,
      "user_id": 5,
      "payment_amount": 29.99,
      "payment_status": "completed",
      "payment_method": "credit_card",
      "payment_currency": "USD",
      "payment_gateway": "stripe",
      "payment_transaction_id": "txn_1234567890",
      "created_at": "2024-01-01T10:00:00.000Z",
      "updated_at": "2024-01-01T10:00:00.000Z",
      "user_subscription": {
        "id": 1,
        "subscription_status": "active",
        "subscription": {
          "subscription_name": "Pro Plan"
        }
      }
    }
  ],
  "meta": {
    "total": 500,
    "page": 1,
    "limit": 10,
    "total_pages": 50
  }
}
```

**Features**:
- Admin can see all payments across all users
- Includes user subscription details
- Filter by user, subscription, status, and payment method

---

### 36. Get Payment by ID

Get detailed information about a specific payment.

**Method**: `GET`  
**Endpoint**: `GET /api/admin/payments/:id`

**Headers**:
```
Authorization: Bearer <access_token>
```

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Payment ID |

**Response** (200 OK):
```json
{
  "id": 1,
  "users_subscriptions_id": 1,
  "user_id": 5,
  "payment_amount": 29.99,
  "payment_status": "completed",
  "payment_method": "credit_card",
  "payment_currency": "USD",
  "payment_gateway": "stripe",
  "payment_transaction_id": "txn_1234567890",
  "created_by": 5,
  "updated_by": null,
  "created_at": "2024-01-01T10:00:00.000Z",
  "updated_at": "2024-01-01T10:00:00.000Z",
  "user_subscription": {
    "id": 1,
    "subscription_status": "active",
    "subscription": {
      "subscription_name": "Pro Plan"
    }
  }
}
```

**Error Responses**:
- `404 Not Found`: Payment not found
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: User does not have admin or sub-admin role

---

### 37. Create Payment

Create a payment record (admin can create payments for any user).

**Method**: `POST`  
**Endpoint**: `POST /api/admin/payments`

**Headers**:
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "users_subscriptions_id": 1,
  "payment_amount": 29.99,
  "payment_status": "completed",
  "payment_method": "credit_card",
  "payment_currency": "USD",
  "payment_gateway": "stripe",
  "payment_transaction_id": "txn_1234567890"
}
```

**Parameters**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `users_subscriptions_id` | number | Yes | User subscription ID |
| `payment_amount` | number | Yes | Payment amount |
| `payment_status` | enum | Yes | `pending`, `completed`, `failed` |
| `payment_method` | enum | Yes | `credit_card`, `debit_card`, `paypal`, `bank_transfer`, `cash` |
| `payment_currency` | string | Yes | Currency code (e.g., `USD`, `EUR`) |
| `payment_gateway` | string | Yes | Payment gateway (e.g., `stripe`, `paypal`) |
| `payment_transaction_id` | string | Yes | Unique transaction ID from gateway |

**Response** (201 Created):
```json
{
  "id": 1,
  "users_subscriptions_id": 1,
  "user_id": 5,
  "payment_amount": 29.99,
  "payment_status": "completed",
  "payment_method": "credit_card",
  "payment_currency": "USD",
  "payment_gateway": "stripe",
  "payment_transaction_id": "txn_1234567890",
  "created_by": 1,
  "updated_by": null,
  "created_at": "2024-01-01T10:00:00.000Z",
  "updated_at": "2024-01-01T10:00:00.000Z",
  "user_subscription": {
    "id": 1,
    "subscription_status": "active",
    "subscription": {
      "subscription_name": "Pro Plan"
    }
  }
}
```

**Error Responses**:
- `404 Not Found`: User subscription not found
- `409 Conflict`: Payment already exists for this subscription
- `400 Bad Request`: Invalid input data
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: User does not have admin or sub-admin role

**Business Rules**:
- Admin can create payments for any user subscription
- If payment status is `completed`, the user subscription status is automatically set to `active`
- Only one payment per user subscription is allowed
- Changes are tracked with `created_by` field

---

### 38. Update Payment Status

Update the status of a payment.

**Method**: `PUT`  
**Endpoint**: `PUT /api/admin/payments/:id/status`

**Headers**:
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Payment ID |

**Request Body**:
```json
{
  "status": "completed"
}
```

**Parameters**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | enum | Yes | Payment status: `pending`, `completed`, `failed` |

**Response** (200 OK):
```json
{
  "id": 1,
  "users_subscriptions_id": 1,
  "user_id": 5,
  "payment_amount": 29.99,
  "payment_status": "completed",
  "payment_method": "credit_card",
  "payment_currency": "USD",
  "payment_gateway": "stripe",
  "payment_transaction_id": "txn_1234567890",
  "updated_by": 1,
  "updated_at": "2024-01-02T00:00:00.000Z",
  "user_subscription": {
    "id": 1,
    "subscription_status": "active",
    "subscription": {
      "subscription_name": "Pro Plan"
    }
  }
}
```

**Error Responses**:
- `404 Not Found`: Payment not found
- `400 Bad Request`: Invalid status value
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: User does not have admin or sub-admin role

**Business Rules**:
- Admin can update any payment status
- If status is changed to `completed`, the associated user subscription is automatically activated
- If subscription start date is not set, it's set to the current date when payment is completed
- Changes are tracked with `updated_by` field

---

## Subscription & Payment Notifications

### Get Subscription and Payment Notifications

Get all notifications related to subscriptions and payments. This endpoint filters notifications to only show those that are subscription or payment related.

**Method**: `GET`  
**Endpoint**: `GET /api/admin/notifications/subscription-payment`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Query Parameters**:
| Parameter | Type | Values | Description |
|-----------|------|--------|-------------|
| `page` | integer | 1+ | Page number (default: 1) |
| `limit` | integer | 1-100 | Items per page (default: 10) |
| `is_read` | string | `read`, `unread` | Filter by read status |
| `user_id` | integer | User ID | Filter by specific user |
| `search` | string | Text | Search in title and body |
| `sort_by` | string | `created_at`, `updated_at`, `title`, `is_read` | Sort field (default: `created_at`) |
| `sort_order` | string | `ASC`, `DESC` | Sort order (default: `DESC`) |

**Example Requests**:
```
GET /api/admin/notifications/subscription-payment
GET /api/admin/notifications/subscription-payment?page=1&limit=20
GET /api/admin/notifications/subscription-payment?is_read=unread&user_id=123
GET /api/admin/notifications/subscription-payment?search=expired&sort_by=created_at&sort_order=DESC
```

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": 1,
      "user_id": 123,
      "notification_type": "subscription_expired",
      "title": "Subscription Expired",
      "body": "Your subscription has expired. Please renew to continue using premium features.",
      "data": {
        "subscription_id": 5,
        "user_subscription_id": 10
      },
      "action_url": "/subscriptions/renew",
      "in_app_enabled": true,
      "push_enabled": true,
      "email_enabled": true,
      "is_read": false,
      "read_at": null,
      "push_status": "sent",
      "device_id": 1,
      "device_token": "fcm_token_here",
      "device_type": "android",
      "fcm_message_id": "fcm_123",
      "apns_id": null,
      "push_sent_at": "2024-01-15T10:30:00.000Z",
      "push_delivered_at": "2024-01-15T10:30:05.000Z",
      "push_error_message": null,
      "email_id": 1,
      "email_sent_at": "2024-01-15T10:30:00.000Z",
      "priority": "normal",
      "expires_at": null,
      "created_by": null,
      "updated_by": null,
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
    }
  ],
  "meta": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "total_pages": 5
  }
}
```

**Filter Notes**:
- **Read Status**: Use `is_read=read` for read notifications, `is_read=unread` for unread notifications
- **Notification Types Included**: 
  - Notifications with `notification_type = 'subscription_expired'`
  - Notifications with `subscription_id` in the `data` JSON field
  - Notifications with `payment_id` in the `data` JSON field
  - Notifications with `user_subscription_id` in the `data` JSON field

**Error Responses**:
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: User does not have admin or sub-admin role

**Business Rules**:
- Only shows notifications related to subscriptions and payments
- Admin can view all subscription/payment notifications across all users
- Notifications are filtered by checking both the `notification_type` field and the `data` JSON field for subscription/payment related IDs
- Supports pagination, filtering, and sorting

---

## Request/Response Examples

### cURL Examples

#### Admin Login
```bash
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "admin@example.com",
    "password": "your_password"
  }'
```

#### Admin Logout
```bash
curl -X POST http://localhost:3000/api/admin/logout \
  -H "Authorization: Bearer <access_token>"
```

#### Change Password
```bash
curl -X POST http://localhost:3000/api/admin/change-password \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "old_password": "currentPassword123",
    "new_password": "newSecurePassword456"
  }'
```

#### Get Dashboard Stats
```bash
curl -X GET http://localhost:3000/api/admin/dashboard/stats \
  -H "Authorization: Bearer <access_token>"
```

#### Global Search (users, posts, communities, topics)
```bash
curl -X GET "http://localhost:3000/api/admin/search?q=tech&limit=5" \
  -H "Authorization: Bearer <access_token>"
```
**Query Params**:  
- `q` (required): search keyword (matches name/slug/email/username/title/content)  
- `limit` (optional): per-entity limit (default 5, max 20)  
  
**Response**:
```json
{
  "users": [
    { "id": 12, "name": "Sarah Wilson", "handle": "@sarahw", "avatar": null, "role": "user" }
  ],
  "posts": [
    {
      "id": 123,
      "title": "Getting Started with React",
      "slug": "getting-started-with-react",
      "status": "published",
      "view_count": 1250,
      "like_count": 45,
      "comment_count": 12,
      "created_at": "2024-01-15T10:30:00.000Z",
      "user": {
        "id": 5,
        "name": "John Doe",
        "handle": "@johndoe"
      }
    }
  ],
  "communities": [
    { "id": 5, "name": "Tech Enthusiasts", "member_count": 125000, "slug": "tech-enthusiasts" }
  ],
  "topics": [
    { "id": 9, "name": "#Technology", "posts_count": 450000, "slug": "technology" }
  ],
  "meta": {
    "users": { "count": 1 },
    "posts": { "count": 15 },
    "communities": { "count": 1 },
    "topics": { "count": 1 }
  }
}
```

#### Get Users List
```bash
curl -X GET "http://localhost:3000/api/admin/users?page=1&limit=20&search=john" \
  -H "Authorization: Bearer <access_token>"
```

#### Update User Status
```bash
curl -X PUT http://localhost:3000/api/admin/users/1/status \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "is_active": false,
    "role": "pro_user"
  }'
```

#### Delete User
```bash
curl -X DELETE http://localhost:3000/api/admin/users/1 \
  -H "Authorization: Bearer <access_token>"
```

#### Get Posts List
```bash
curl -X GET "http://localhost:3000/api/admin/posts?page=1&limit=20&search=technology" \
  -H "Authorization: Bearer <access_token>"
```

#### Get Post by ID
```bash
curl -X GET http://localhost:3000/api/admin/posts/1 \
  -H "Authorization: Bearer <access_token>"
```

#### Update Post Status
```bash
curl -X PUT http://localhost:3000/api/admin/posts/1/status \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "post_status": "published"
  }'
```

#### Delete Post
```bash
curl -X DELETE http://localhost:3000/api/admin/posts/1 \
  -H "Authorization: Bearer <access_token>"
```

#### Get Comments List
```bash
curl -X GET "http://localhost:3000/api/admin/comments?page=1&limit=20" \
  -H "Authorization: Bearer <access_token>"
```

#### Get Comment by ID
```bash
curl -X GET http://localhost:3000/api/admin/comments/1 \
  -H "Authorization: Bearer <access_token>"
```

#### Delete Comment
```bash
curl -X DELETE http://localhost:3000/api/admin/comments/1 \
  -H "Authorization: Bearer <access_token>"
```

#### Get Topics List
```bash
curl -X GET "http://localhost:3000/api/admin/topics?page=1&limit=20" \
  -H "Authorization: Bearer <access_token>"
```

#### Get Parent Topics
```bash
curl -X GET "http://localhost:3000/api/admin/parent-topics?page=1&limit=20" \
  -H "Authorization: Bearer <access_token>"
```

#### Get Topic by ID
```bash
curl -X GET http://localhost:3000/api/admin/topics/1 \
  -H "Authorization: Bearer <access_token>"
```

#### Update Topic Status
```bash
curl -X PUT http://localhost:3000/api/admin/topics/1/status \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "is_active": false
  }'
```

#### Get Communities List
```bash
curl -X GET "http://localhost:3000/api/admin/communities?page=1&limit=20" \
  -H "Authorization: Bearer <access_token>"
```

#### Get Community by ID
```bash
curl -X GET http://localhost:3000/api/admin/communities/1 \
  -H "Authorization: Bearer <access_token>"
```

#### Update Community Status
```bash
curl -X PUT http://localhost:3000/api/admin/communities/1/status \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "is_active": false
  }'
```

#### Get Polls List
```bash
curl -X GET "http://localhost:3000/api/admin/polls?page=1&limit=20" \
  -H "Authorization: Bearer <access_token>"
```

#### Get Poll by ID
```bash
curl -X GET http://localhost:3000/api/admin/polls/1 \
  -H "Authorization: Bearer <access_token>"
```

#### Delete Poll
```bash
curl -X DELETE http://localhost:3000/api/admin/polls/1 \
  -H "Authorization: Bearer <access_token>"
```

#### Get Subscriptions List
```bash
curl -X GET "http://localhost:3000/api/admin/subscriptions?page=1&limit=20" \
  -H "Authorization: Bearer <access_token>"
```

#### Create Subscription
```bash
curl -X POST http://localhost:3000/api/admin/subscriptions \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "subscription_type": "pro",
    "subscription_name": "Pro Plan",
    "subscription_description": "Access to premium features",
    "subscription_price": 29.99,
    "subscription_duration": 30,
    "subscription_duration_type": "days",
    "is_active": true
  }'
```

#### Update Subscription
```bash
curl -X PUT http://localhost:3000/api/admin/subscriptions/1 \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "subscription_price": 39.99,
    "is_active": true
  }'
```

#### Get User Subscriptions List
```bash
curl -X GET "http://localhost:3000/api/admin/user-subscriptions?page=1&limit=20&subscription_status=active" \
  -H "Authorization: Bearer <access_token>"
```

#### Update User Subscription Status
```bash
curl -X PUT http://localhost:3000/api/admin/user-subscriptions/1/status \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "active"
  }'
```

#### Get Payments List
```bash
curl -X GET "http://localhost:3000/api/admin/payments?page=1&limit=20&payment_status=completed" \
  -H "Authorization: Bearer <access_token>"
```

#### Create Payment
```bash
curl -X POST http://localhost:3000/api/admin/payments \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "users_subscriptions_id": 1,
    "payment_amount": 29.99,
    "payment_status": "completed",
    "payment_method": "credit_card",
    "payment_currency": "USD",
    "payment_gateway": "stripe",
    "payment_transaction_id": "txn_1234567890"
  }'
```

#### Update Payment Status
```bash
curl -X PUT http://localhost:3000/api/admin/payments/1/status \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed"
  }'
```

### JavaScript/TypeScript Examples

#### Using Fetch API
```javascript
// Admin Login
const loginResponse = await fetch('http://localhost:3000/api/admin/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    identifier: 'admin@example.com',
    password: 'your_password',
  }),
});

const loginData = await loginResponse.json();
const accessToken = loginData.access_token;

// Admin Logout
const logoutResponse = await fetch('http://localhost:3000/api/admin/logout', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
  },
});

// Change Password
const changePasswordResponse = await fetch('http://localhost:3000/api/admin/change-password', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    old_password: 'currentPassword123',
    new_password: 'newSecurePassword456',
  }),
});

// Get Dashboard Stats
const statsResponse = await fetch('http://localhost:3000/api/admin/dashboard/stats', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
  },
});

const stats = await statsResponse.json();

// Get Users List
const usersResponse = await fetch(
  'http://localhost:3000/api/admin/users?page=1&limit=20',
  {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  }
);

const users = await usersResponse.json();

// Update User Status
const updateResponse = await fetch('http://localhost:3000/api/admin/users/1/status', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    is_active: false,
    role: 'pro_user',
  }),
});
```

#### Using Axios
```javascript
import axios from 'axios';

// Admin Login
const loginResponse = await axios.post(
  'http://localhost:3000/api/admin/login',
  {
    identifier: 'admin@example.com',
    password: 'your_password',
  }
);

const accessToken = loginResponse.data.access_token;

// Admin Logout
const logoutResponse = await axios.post(
  'http://localhost:3000/api/admin/logout',
  {},
  {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  }
);

// Change Password
const changePasswordResponse = await axios.post(
  'http://localhost:3000/api/admin/change-password',
  {
    old_password: 'currentPassword123',
    new_password: 'newSecurePassword456',
  },
  {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  }
);

// Get Dashboard Stats
const statsResponse = await axios.get(
  'http://localhost:3000/api/admin/dashboard/stats',
  {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  }
);

// Get Users with Search
const usersResponse = await axios.get(
  'http://localhost:3000/api/admin/users',
  {
    params: {
      page: 1,
      limit: 20,
      search: 'john',
      sort_by: 'created_at',
      sort_order: 'DESC',
    },
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  }
);

// Update User Status
const updateResponse = await axios.put(
  'http://localhost:3000/api/admin/users/1/status',
  {
    is_active: false,
    is_verified: true,
    role: 'pro_user',
  },
  {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  }
);
```

---

## Enhanced Features & New Endpoints

This section documents all the enhanced filtering, sorting, and new detail modal endpoints that have been added to improve the admin panel functionality.

### Enhanced Filter Parameters

All list endpoints now support comprehensive server-side filtering:

#### User List Filters
- `role`: Filter by user role (`all`, `user`, `pro_user`, `admin`, `sub_admin`, `moderator`)
- `is_active`: Filter by active/inactive status (`active` or `inactive`)
- `is_verified`: Filter by verification status (`verified` or `unverified`)
- `created_from` / `created_to`: Date range filtering
- Enhanced sorting: `id`, `username`, `email`, `role`, `is_active`, `is_verified`, `created_at`, `updated_at`

#### Post List Filters
- `post_status`: Filter by status (`draft`, `published`, `archived`, `all`)
- `is_featured`: Filter by featured status (`featured` or `not_featured`)
- `has_media`: Filter posts with/without media (`with_media` or `without_media`)
- `media_type`: Filter by media type (`image`, `video`, `audio`, `none`)
- `user_id`: Filter by specific user ID
- `topic_id`: Filter by specific topic ID
- `created_from` / `created_to`: Date range filtering
- Enhanced sorting: `id`, `post_title`, `like_count`, `comment_count`, `view_count`, `created_at`, `updated_at`

#### Comment List Filters
- `is_approved`: Filter by approval status (`approved` or `not_approved`)
- `post_id`: Filter by specific post ID
- `user_id`: Filter by specific user ID
- `has_replies`: Filter comments with/without replies (`with_replies` or `without_replies`)
- `created_from` / `created_to`: Date range filtering
- Enhanced sorting: `id`, `like_count`, `replies_count`, `created_at`, `updated_at`

#### Topic List Filters
- `is_active`: Filter by active/inactive status (`active` or `inactive`)
- `parent_id`: Filter by parent topic ID (0 = root categories)
- `type`: Filter by type (`categories`, `subtopics`, `all`)
- `has_children`: Filter topics with/without subtopics (`with_children` or `without_children`)
- `created_from` / `created_to`: Date range filtering
- Enhanced sorting: `id`, `topic_name`, `topic_slug`, `created_at`, `updated_at`

#### Community List Filters
- `is_active`: Filter by active/inactive status (`active` or `inactive`)
- `is_private`: Filter by privacy (`private` or `public`)
- `category_id`: Filter by category ID
- `min_members` / `max_members`: Filter by member count range
- `created_from` / `created_to`: Date range filtering
- Enhanced sorting: `id`, `community_name`, `created_at`, `updated_at`

#### Poll List Filters
- `poll_status`: Filter by status (`draft`, `published`, `ended`, `all`, `active`)
- `is_featured`: Filter by featured status (`featured` or `not_featured`)
- `is_expired`: Filter by expiration status (`expired` or `not_expired`)
- `user_id`: Filter by specific user ID
- `expires_from` / `expires_to`: Expiration date range
- `created_from` / `created_to`: Creation date range
- Enhanced sorting: `id`, `poll_title`, `vote_count`, `view_count`, `poll_expires_at`, `created_at`, `updated_at`

### User Detail Modal Endpoints

#### Get User Posts
Get all posts created by a specific user (paginated).

**Method**: `GET`  
**Endpoint**: `GET /api/admin/users/:userId/posts`

**Query Parameters**: Same as standard list endpoints (`page`, `limit`, `search`, `sort_by`, `sort_order`)

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": 123,
      "post_title": "My First Post",
      "post_content": "Content here...",
      "like_count": 45,
      "comment_count": 12,
      "view_count": 200,
      "topic": { "id": 5, "topic_name": "Technology" }
    }
  ],
  "meta": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "total_pages": 5
  }
}
```

#### Get User Communities
Get all communities a user is a member of (paginated).

**Method**: `GET`  
**Endpoint**: `GET /api/admin/users/:userId/communities`

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": 10,
      "community_name": "Tech Enthusiasts",
      "community_slug": "tech-enthusiasts",
      "role": "member",
      "joined_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": { "total": 5, "page": 1, "limit": 10, "total_pages": 1 }
}
```

#### Get User Comments
Get all comments made by a specific user (paginated).

**Method**: `GET`  
**Endpoint**: `GET /api/admin/users/:userId/comments`

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": 456,
      "comment_content": "Great post!",
      "like_count": 10,
      "post": { "id": 123, "post_title": "Post Title" },
      "created_at": "2024-01-15T10:00:00.000Z"
    }
  ],
  "meta": { "total": 25, "page": 1, "limit": 10, "total_pages": 3 }
}
```

#### Get User Statistics
Get comprehensive statistics for a user.

**Method**: `GET`  
**Endpoint**: `GET /api/admin/users/:userId/stats`

**Response** (200 OK):
```json
{
  "posts_count": 50,
  "comments_count": 120,
  "communities_count": 5,
  "polls_count": 3
}
```

### Post Detail Modal Endpoints

#### Get Post Comments
Get all comments on a specific post (paginated, includes replies).

**Method**: `GET`  
**Endpoint**: `GET /api/admin/posts/:postId/comments`

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": 456,
      "comment_content": "Great post!",
      "like_count": 10,
      "user": { "id": 5, "username": "user123" },
      "replies": [
        {
          "id": 789,
          "comment_content": "I agree!",
          "user": { "id": 7, "username": "user456" }
        }
      ],
      "replies_count": 1
    }
  ],
  "meta": { "total": 15, "page": 1, "limit": 10, "total_pages": 2 }
}
```

#### Get Post Analytics
Get detailed analytics for a post.

**Method**: `GET`  
**Endpoint**: `GET /api/admin/posts/:postId/analytics`

**Query Parameters**:
- `time_range` (optional): `week`, `month`, `year`, `all`

**Response** (200 OK):
```json
{
  "engagement_rate": 12.5,
  "trending_score": 8.3,
  "total_interactions": 150,
  "recent_comments": 25
}
```

### Topic Detail Modal Endpoints

#### Get Topic Posts
Get all posts using a specific topic (paginated).

**Method**: `GET`  
**Endpoint**: `GET /api/admin/topics/:topicId/posts`

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": 123,
      "post_title": "Post Title",
      "user": { "id": 5, "username": "user123" },
      "like_count": 45,
      "comment_count": 12
    }
  ],
  "meta": { "total": 200, "page": 1, "limit": 10, "total_pages": 20 }
}
```

#### Get Topic Communities
Get all communities using a specific topic (paginated).

**Method**: `GET`  
**Endpoint**: `GET /api/admin/topics/:topicId/communities`

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": 10,
      "community_name": "Tech Community",
      "community_slug": "tech-community"
    }
  ],
  "meta": { "total": 15, "page": 1, "limit": 10, "total_pages": 2 }
}
```

#### Get Topic Statistics
Get usage statistics for a topic.

**Endpoint**: `GET /api/admin/topics/:topicId/stats`

**Response** (200 OK):
```json
{
  "posts_count": 200,
  "communities_count": 15,
  "usage_count": 215
}
```

### Community Detail Modal Endpoints

#### Get Community Posts
Get all posts in a specific community (paginated).

**Method**: `GET`  
**Endpoint**: `GET /api/admin/communities/:communityId/posts`

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": 123,
      "post_title": "Community Post",
      "user": { "id": 5, "username": "user123" },
      "like_count": 45
    }
  ],
  "meta": { "total": 100, "page": 1, "limit": 10, "total_pages": 10 }
}
```

#### Get Community Activity
Get recent activity in a community (posts and comments).

**Endpoint**: `GET /api/admin/communities/:communityId/activity`

**Response** (200 OK):
```json
{
  "data": [
    {
      "type": "post",
      "id": 123,
      "title": "New Post",
      "user": { "id": 5, "username": "user123" },
      "created_at": "2024-01-15T10:00:00.000Z"
    },
    {
      "type": "comment",
      "id": 456,
      "content": "Great post!",
      "user": { "id": 7, "username": "user456" },
      "post_id": 123,
      "created_at": "2024-01-15T11:00:00.000Z"
    }
  ],
  "meta": { "total": 50, "page": 1, "limit": 20, "total_pages": 3 }
}
```

#### Get Community Statistics
Get comprehensive statistics for a community.

**Method**: `GET`  
**Endpoint**: `GET /api/admin/communities/:communityId/stats`

**Response** (200 OK):
```json
{
  "posts_count": 100,
  "topics_count": 10,
  "members_count": 250
}
```

### Comment Detail Modal Endpoints

#### Get Comment Replies
Get all replies to a specific comment (paginated).

**Endpoint**: `GET /api/admin/comments/:commentId/replies`

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": 789,
      "comment_content": "I agree!",
      "user": { "id": 7, "username": "user456" },
      "created_at": "2024-01-15T12:00:00.000Z"
    }
  ],
  "meta": { "total": 5, "page": 1, "limit": 10, "total_pages": 1 }
}
```

### Poll Detail Modal Endpoints

#### Get Poll Analytics
Get detailed analytics for a poll.

**Method**: `GET`  
**Endpoint**: `GET /api/admin/polls/:pollId/analytics`

**Response** (200 OK):
```json
{
  "total_votes": 500,
  "engagement_rate": 25.5,
  "options": [
    {
      "id": 1,
      "option_text": "Option A",
      "vote_count": 200,
      "percentage": 40.0
    },
    {
      "id": 2,
      "option_text": "Option B",
      "vote_count": 300,
      "percentage": 60.0
    }
  ]
}
```

#### Get Poll Votes
Get detailed vote breakdown (who voted for what).

**Endpoint**: `GET /api/admin/polls/:pollId/votes`

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": 1,
      "user_id": 5,
      "username": "user123",
      "email": "user@example.com",
      "vote_option_id": 1,
      "option_text": "Option A",
      "created_at": "2024-01-15T10:00:00.000Z"
    }
  ],
  "meta": { "total": 500, "page": 1, "limit": 50, "total_pages": 10 }
}
```

### Enhanced Detail Endpoints

All detail endpoints (`GET /api/admin/users/:id`, `GET /api/admin/posts/:id`, etc.) now return enhanced data:

- **User Details**: Includes `posts_count`, `comments_count`, `communities_count`
- **Post Details**: Includes `post_tags` (array), `communities` (array), `engagement_rate`, `trending_score`
- **Topic Details**: Includes `posts_count`, `communities_count`, `usage_count`
- **Comment Details**: Includes `replies` (array), `replies_count`
- **Community Details**: Includes `posts_count`, `topics_count`, `members_count`
- **Poll Details**: Includes `total_votes`, `engagement_rate`

### Bulk Operations

#### Bulk Update Users
Update multiple users at once.

**Method**: `PUT`  
**Endpoint**: `PUT /api/admin/users/bulk-update`

**Request Body**:
```json
{
  "ids": [1, 2, 3, 4, 5],
  "updates": {
    "is_active": true,
    "is_verified": true,
    "role": "pro_user"
  }
}
```

**Response** (200 OK):
```json
{
  "message": "Successfully updated 5 user(s)",
  "updated_count": 5
}
```

**Business Rules**:
- Cannot update admin accounts
- Cannot deactivate own account
- At least one user ID required

#### Bulk Update Posts
Update multiple posts at once.

**Method**: `PUT`  
**Endpoint**: `PUT /api/admin/posts/bulk-update`

**Request Body**:
```json
{
  "ids": [1, 2, 3],
  "updates": {
    "post_status": "published",
    "is_featured": true
  }
}
```

#### Bulk Approve Comments
Approve/unapprove multiple comments at once.

**Method**: `PUT`  
**Endpoint**: `PUT /api/admin/comments/bulk-approve`

**Request Body**:
```json
{
  "ids": [1, 2, 3, 4, 5],
  "updates": {
    "is_approved": true
  }
}
```

#### Bulk Update Communities
Update multiple communities at once.

**Method**: `PUT`  
**Endpoint**: `PUT /api/admin/communities/bulk-update`

**Request Body**:
```json
{
  "ids": [1, 2, 3],
  "updates": {
    "is_active": true
  }
}
```

#### Bulk Update Topics
Update multiple topics at once.

**Method**: `PUT`  
**Endpoint**: `PUT /api/admin/topics/bulk-update`

**Request Body**:
```json
{
  "ids": [1, 2, 3, 4, 5],
  "updates": {
    "is_active": false
  }
}
```

### Export Functionality

#### Export Users
Export users to CSV or JSON format.

**Method**: `GET`  
**Endpoint**: `GET /api/admin/users/export`

**Query Parameters**:
- All standard user list filters apply
- `format`: `csv` or `json` (default: `json`)

**Example**:
```
GET /api/admin/users/export?role=pro_user&is_active=true&format=csv
```

**Response** (200 OK):
- CSV: Returns CSV string with filename
- JSON: Returns JSON array with filename

```json
{
  "data": "[CSV string or JSON array]",
  "format": "csv",
  "filename": "users_export_1705320000000.csv"
}
```

#### Export Posts
Export posts to CSV or JSON format.

**Endpoint**: `GET /api/admin/posts/export`

**Query Parameters**:
- All standard post list filters apply
- `format`: `csv` or `json` (default: `json`)

#### Export Comments
Export comments to CSV or JSON format.

**Method**: `GET`  
**Endpoint**: `GET /api/admin/comments/export`

**Query Parameters**:
- All standard comment list filters apply
- `format`: `csv` or `json` (default: `json`)

**Notes**:
- Export endpoints return all matching records (no pagination)
- CSV format includes headers and comma-separated values
- JSON format returns array of objects
- Filename includes timestamp for uniqueness

---

---

## Notifications & Emails (Admin)

**Note**: The notification, email, and job endpoints are NOT part of the Admin Module. They are separate modules with their own controllers:
- Notifications: `/api/notifications` (see NotificationController)
- Emails: `/api/emails` (see EmailController)  
- Jobs: `/api/jobs` (see JobController)

The Admin Module only includes the subscription-payment notifications endpoint documented above.

---

## Error Handling

### Error Response Format

All errors follow this format:

```json
{
  "statusCode": 400,
  "message": "Error message or array of validation errors",
  "error": "Error type"
}
```

### Common Error Codes

| Status Code | Description | Common Causes |
|-------------|-------------|---------------|
| `400` | Bad Request | Invalid input, validation errors, business rule violations |
| `401` | Unauthorized | Invalid or missing token |
| `403` | Forbidden | User does not have admin or sub-admin role |
| `404` | Not Found | Resource doesn't exist or module not yet implemented |
| `500` | Internal Server Error | Server error |

### Role-Based Access

**Admin Role** (`admin`):
- Full access to all admin endpoints
- Can manage all users except other admins
- Cannot deactivate/delete own account
- Cannot change admin account roles

**Sub-Admin Role** (`sub_admin`):
- Access to all admin endpoints
- Can manage regular users
- Cannot manage admin accounts
- Limited permissions (can be extended)

### Business Rules

1. **Self-Protection**:
   - Admins cannot deactivate their own account
   - Admins cannot delete their own account

2. **Admin Protection**:
   - Admin accounts cannot be deleted
   - Admin account roles cannot be changed (only super admin can do this)

3. **Soft Deletes**:
   - User deletion is soft (sets `is_active = false`)
   - User data is preserved for audit purposes

4. **Pagination**:
   - Default page size: 10
   - Maximum page size: 100
   - Page numbers start at 1

---

## Implementation Status

### Fully Implemented ✅
- Admin login (admin/sub-admin only)
- Admin logout (token invalidation)
- Password reset (forgot password with reset code)
- Change password (requires old password)
- Dashboard statistics (using real data from all modules)
- User management (create, list, view, update status, delete)
- **Post management** (fully integrated with PostService)
  - List posts with pagination and search
  - Get post by ID
  - **Create posts** (with file upload support)
  - **Update posts** (full update with file upload support)
  - Update post status
  - Delete posts (soft delete)
- **Comment management** (fully integrated with CommentService)
  - List comments with pagination and search
  - Get comment by ID
  - **Update comments** (approve/unapprove, edit content)
  - Delete comments (soft/hard delete based on replies)
- **Topic management** (fully integrated with GeneralService)
  - List topics with pagination and search
  - Get topic by ID
  - **Create topics** (with image upload support)
  - **Update topics** (full update with image upload support)
  - Update topic status
- **Community management** (fully integrated with CommunityService)
  - List communities with pagination and search
  - Get community by ID
  - **Create communities** (with image upload support)
  - **Update communities** (full update with image upload support)
  - Update community status
  - **Delete communities** (soft delete)
  - **Get community members** (with pagination)
  - **Update member roles** (admin, moderator, member)
  - **Get community topics**
  - **Add topics to communities**
  - **Remove topics from communities**
- **Poll management** (fully integrated with PollService)
  - List polls with pagination and search
  - Get poll by ID
  - **Create polls** (with options)
  - **Update polls** (full update)
  - Delete polls (soft delete)
- **Subscription management** (fully integrated with SubscriptionService)
  - List subscriptions with pagination and search
  - Get subscription by ID
  - **Create subscriptions** (full CRUD)
  - **Update subscriptions** (full update)
  - Delete subscriptions (soft delete)
  - **Get user subscriptions** (across all users)
  - **Update user subscription status**
- **Payment management** (fully integrated with SubscriptionService)
  - List payments with pagination and search
  - Get payment by ID
  - **Create payments** (for any user)
  - **Update payment status** (with auto-activation)
- Role-based access control
- Full CRUD operations for all resources

### Architecture Improvements
- **Service Reuse**: Admin module now reuses services from other modules instead of duplicating code
- **Consistency**: All CRUD operations use the same business logic as regular user endpoints
- **Maintainability**: Changes in other modules automatically reflect in admin module
- **Complete CRUD**: All operations are fully implemented with proper error handling

---

## Security Considerations

1. **Authentication**: All endpoints require valid JWT token
2. **Authorization**: Only `admin` and `sub_admin` roles can access
3. **Self-Protection**: Admins cannot modify their own accounts
4. **Admin Protection**: Admin accounts have special protection
5. **Audit Trail**: All changes track `updated_by` field
6. **Input Validation**: All inputs are validated using DTOs
7. **Rate Limiting**: Global rate limiting applies to all endpoints

---

**Last Updated**: 2024-01-16  
**Module Version**: 4.0.0

### Recent Updates (v4.0.0)
- ✅ Added subscription management endpoints (CRUD operations)
- ✅ Added user subscription management (list, view, update status)
- ✅ Added payment management endpoints (list, view, create, update status)
- ✅ Integrated SubscriptionService for all subscription and payment operations
- ✅ Complete admin management API for subscriptions and payments

### Recent Updates (v3.0.0)
- ✅ Added POST endpoint for creating users (with email or phone number support)
- ✅ Added POST endpoints for creating posts, topics, communities, and polls
- ✅ Added PUT endpoints for full updates of posts, topics, communities, polls, and comments
- ✅ Integrated file upload support for posts (images, videos, audio)
- ✅ Integrated image upload support for topics and communities
- ✅ Admin can now perform full CRUD operations on all resources
- ✅ Admin bypasses ownership checks for all update operations
- ✅ MediaClientService integration for file uploads
- ✅ Complete admin management API with all CRUD operations

### Recent Updates (v2.0.0)
- ✅ Integrated PostService for post management operations
- ✅ Integrated CommentService for comment management operations
- ✅ Integrated GeneralService for topic management operations
- ✅ Integrated CommunityService for community management operations
- ✅ Integrated PollService for poll management operations
- ✅ Added GET by ID endpoints for posts, comments, topics, communities, and polls
- ✅ Updated dashboard statistics to use real data from all modules
- ✅ All placeholder implementations replaced with actual service calls
- ✅ Improved code reusability and maintainability

### Recent Updates (v3.0.0)
- ✅ Added Privacy Policy module (single-record CRUD with public read endpoint)
- ✅ Added Support module (single-record CRUD with public read endpoint)

