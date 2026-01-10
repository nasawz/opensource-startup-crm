# Authentication System

## Overview

BottleCRM supports two authentication methods: **Google OAuth** and **Email/Password**. Users can choose to sign in using their Google account or register with their email and password.

## Supported Login Methods

| Method | Status |
|--------|--------|
| Google OAuth | ✅ Supported |
| Email/Password | ✅ Supported |
| Other Social Providers (GitHub, Facebook, etc.) | ❌ Not Supported |

## Authentication Flow

### Google OAuth Login Flow

1. User visits `/login` and clicks the Google sign-in button
2. User is redirected to Google OAuth authorization page
3. Google redirects back to `/login?code=xxx` with authorization code
4. Server exchanges the code for access_token
5. Server retrieves user information from Google
6. User record is created or updated in the database
7. Session cookie is set
8. User is redirected to `/bounce`, then automatically to `/org` (organization selection)

### Email/Password Registration Flow

1. User visits `/register` page
2. User fills in name, email, and password (with confirmation)
3. Password is validated for strength requirements:
   - Minimum 8 characters
   - At least one uppercase letter
   - At least one lowercase letter
   - At least one number
4. Password is hashed using bcrypt (12 rounds)
5. User record is created in the database
6. Session cookie is set
7. User is redirected to `/bounce`, then automatically to `/org` (organization selection)

### Email/Password Login Flow

1. User visits `/login` page
2. User enters email and password
3. Server validates credentials against the database
4. If user has no password (Google OAuth only user), error is shown
5. If credentials are valid, session cookie is set
6. User is redirected to `/bounce`, then automatically to `/org` (organization selection)

## Routes

### Authentication Routes

| Route | Description | Location |
|-------|-------------|----------|
| `/login` | Login page (Email/Password + Google OAuth) | `src/routes/(no-layout)/login/` |
| `/register` | User registration page | `src/routes/(no-layout)/register/` |
| `/bounce` | Temporary redirect page after successful login | `src/routes/(no-layout)/bounce/+page.svelte` |
| `/org` | Organization selection page | `src/routes/(no-layout)/org/` |
| `/org/new` | Create new organization | `src/routes/(no-layout)/org/new/` |

## Implementation Details

### Server-Side Logic

- **Login Handler**: `src/routes/(no-layout)/login/+page.server.js`
- **Authentication Middleware**: `src/hooks.server.js`

### Authentication Middleware (`src/hooks.server.js`)

The middleware handles:

- **Session Validation**: Checks session cookie to verify user identity
- **Organization Access Control**: Validates user belongs to the selected organization
- **Route Protection**:
  - `/app/*` - Requires authentication and organization selection
  - `/admin/*` - Restricted to users with `@micropyramid.com` email domain
  - `/org/*` - Requires authentication

### Database Schema

#### User Table

| Field | Description |
|-------|-------------|
| `id` | Primary key (UUID) |
| `user_id` | User ID (Google ID for OAuth users, UUID for email/password users) |
| `email` | User email address |
| `password` | Hashed password (nullable, null for Google OAuth only users) |
| `name` | User display name |
| `profilePhoto` | Profile picture URL |
| `session_id` | Session management |
| `isActive` | Account status |
| `lastLogin` | Last login timestamp |

#### UserOrganization Table

Manages many-to-many relationship between users and organizations with role-based access control (RBAC).

## Environment Variables

Required for Google OAuth:

```env
GOOGLE_CLIENT_ID="your-google-client-id-here"
GOOGLE_CLIENT_SECRET="your-google-client-secret-here"
GOOGLE_LOGIN_DOMAIN="http://localhost:5173"
```

## Security Features

### Password Security

- **Hashing**: Passwords are hashed using bcrypt with 12 rounds
- **Validation**: Password strength requirements enforced:
  - Minimum 8 characters
  - At least one uppercase letter (A-Z)
  - At least one lowercase letter (a-z)
  - At least one number (0-9)
- **Storage**: Only hashed passwords are stored, never plain text

### Session Management

- Sessions are stored as UUID tokens in cookies
- Session cookies are:
  - HttpOnly (not accessible via JavaScript)
  - Secure (only sent over HTTPS)
  - SameSite: Strict (CSRF protection)
  - Max age: 7 days

### Account Linking

- Users who registered via Google OAuth cannot set a password through the registration form
- Users who registered via email/password can still use Google OAuth if they use the same email
- The system detects and prevents duplicate registrations

## Future Improvements

The following features could be added to enhance the authentication system:

- **Password Reset**: Email-based password recovery flow
- **Email Verification**: Verify email ownership during registration
- **Rate Limiting**: Prevent brute force attacks on login
- **Two-Factor Authentication (2FA)**: Add TOTP-based 2FA
- **Remember Me**: Extended session duration option
- **Account Lockout**: Temporary lockout after failed login attempts

## Limitations

- **No Password Recovery**: Users who forget their password cannot recover it (planned feature)
- **No Email Verification**: Email ownership is not verified during registration
- **Single Session**: Only one active session per user (logging in elsewhere logs out other sessions)
