# Email Features Documentation

## Overview

ShieldAuth now includes comprehensive email functionality for user authentication and security:

- **Email Verification**: Required during signup process
- **Password Reset**: Secure password reset via email
- **Email Templates**: Professional HTML email templates
- **Token Management**: Secure token generation and validation

## Features Implemented

### 1. Email Verification

- **Automatic sending** during user registration
- **24-hour token expiry** for security
- **Resend functionality** for expired tokens
- **Professional email templates** with branding

### 2. Password Reset

- **Secure token generation** with 1-hour expiry
- **Email enumeration protection** (always returns success)
- **Password confirmation** before reset
- **Confirmation emails** after successful reset

### 3. Email Service

- **SendGrid integration** for reliable delivery
- **HTML and text email templates**
- **Error handling** and logging
- **Configurable sender information**

## Configuration

### Environment Variables

Add these to your `.env` file:

```env
# SendGrid Configuration
SENDGRID_API_KEY="your-sendgrid-api-key-here"
SENDGRID_FROM_EMAIL="noreply@yourdomain.com"
SENDGRID_FROM_NAME="ShieldAuth"

# Application URL (for email links)
PUBLIC_APP_URL="http://localhost:5173"
```

### SendGrid Setup

1. **Create SendGrid Account**: Sign up at [sendgrid.com](https://sendgrid.com)
2. **Generate API Key**:
   - Go to Settings → API Keys
   - Create a new API key with "Mail Send" permissions
3. **Verify Sender**:
   - Go to Settings → Sender Authentication
   - Verify your domain or single sender email
4. **Update Environment**: Add your API key to `.env`

## API Endpoints

### Email Verification

#### `POST /api/auth/verify-email`

Verify email with token from email link.

**Request:**

```json
{
  "token": "verification-token-from-email"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

#### `POST /api/auth/resend-verification`

Resend verification email.

**Request:**

```json
{
  "email": "user@example.com"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Verification email sent successfully"
}
```

### Password Reset

#### `POST /api/auth/forgot-password`

Request password reset email.

**Request:**

```json
{
  "email": "user@example.com"
}
```

**Response:**

```json
{
  "success": true,
  "message": "If an account with that email exists, a password reset link has been sent"
}
```

#### `POST /api/auth/reset-password`

Reset password with token.

**Request:**

```json
{
  "token": "reset-token-from-email",
  "password": "new-password"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

## User Interface

### Pages Created

1. **`/auth/verify-email`** - Email verification page
2. **`/auth/forgot-password`** - Password reset request page
3. **`/auth/reset-password`** - Password reset form page

### Updated Pages

1. **`/login`** - Added "Forgot Password" link
2. **`/register`** - Now sends verification email automatically

## Database Schema

### New Table: `verification_tokens`

```sql
CREATE TABLE "verification_tokens" (
  "identifier" varchar(255) NOT NULL,
  "token" varchar(255) NOT NULL,
  "expires" timestamp NOT NULL,
  "type" varchar(50) NOT NULL, -- 'email_verification' or 'password_reset'
  "user_id" varchar(255) NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
```

### Updated Table: `users`

- `emailVerified` now defaults to `null` (requires verification)
- Added `isEmailVerified` boolean field for easier checking

## Security Features

### Token Security

- **Cryptographically secure tokens** using nanoid
- **Time-based expiry** (24h for verification, 1h for reset)
- **Single-use tokens** (consumed after use)
- **Automatic cleanup** of expired tokens

### Email Security

- **Email enumeration protection** (always returns success)
- **Rate limiting** through token expiry
- **Secure token transmission** via HTTPS
- **No sensitive data** in email content

### Password Security

- **Minimum 8 characters** requirement
- **Bcrypt hashing** with salt rounds of 12
- **Password confirmation** before reset
- **Immediate invalidation** of reset tokens

## Email Templates

### Verification Email

- **Professional design** with ShieldAuth branding
- **Clear call-to-action** button
- **Fallback text link** for accessibility
- **Security warnings** about link expiry

### Password Reset Email

- **Security-focused design** with red branding
- **Clear instructions** and warnings
- **Short expiry time** (1 hour)
- **Confirmation of action** required

### Reset Confirmation Email

- **Success confirmation** with green branding
- **Security notice** about unauthorized changes
- **Next steps** guidance

## Usage Examples

### Registration Flow

1. User submits registration form
2. System creates user with `emailVerified: null`
3. Verification email sent automatically
4. User clicks link in email
5. Email verified, user can login

### Password Reset Flow

1. User clicks "Forgot Password" on login page
2. User enters email address
3. Reset email sent (if account exists)
4. User clicks link in email
5. User enters new password
6. Password updated, confirmation email sent

## Error Handling

### Common Error Scenarios

- **Invalid/expired tokens** - Clear error messages
- **Email delivery failures** - Graceful degradation
- **Network errors** - User-friendly messages
- **Validation errors** - Specific field feedback

### Logging

- **Email send attempts** logged to console
- **Token validation** errors logged
- **Database errors** captured and logged
- **Security events** tracked

## Testing

### Manual Testing

1. **Register new user** - Check verification email
2. **Click verification link** - Verify account activation
3. **Request password reset** - Check reset email
4. **Use reset link** - Verify password change
5. **Test expired tokens** - Verify error handling

### Email Testing

- Use SendGrid's **test mode** for development
- Check **spam folders** during testing
- Verify **email templates** render correctly
- Test **mobile email clients**

## Troubleshooting

### Common Issues

#### Emails Not Sending

- Check SendGrid API key configuration
- Verify sender email is authenticated
- Check console logs for errors
- Ensure network connectivity

#### Tokens Not Working

- Check token expiry times
- Verify database connection
- Check token format and length
- Ensure proper URL encoding

#### Database Errors

- Run `npm run db:push` to update schema
- Check database connection string
- Verify table permissions
- Check for migration conflicts

## Future Enhancements

### Planned Features

- **Email templates customization** via admin panel
- **Multiple email providers** support
- **Email analytics** and tracking
- **Bulk email operations** for admin users
- **Email preferences** for users

### Security Improvements

- **Rate limiting** for email requests
- **IP-based restrictions** for reset requests
- **Email verification** for password changes
- **Two-factor authentication** integration

## Support

For issues or questions about email features:

1. Check the console logs for error messages
2. Verify SendGrid configuration
3. Test with a simple email first
4. Check database schema is up to date
5. Review environment variables

## Dependencies Added

```json
{
  "@sendgrid/mail": "^8.x.x"
}
```

Make sure to run `npm install` after pulling the latest changes.
