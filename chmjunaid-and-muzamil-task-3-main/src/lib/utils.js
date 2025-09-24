// Utility functions for OTP and other common operations

/**
 * Generate a random 6-digit OTP
 * @returns {string} 6-digit OTP
 */
export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Check if OTP is expired
 * @param {Date} otpExpiry - OTP expiry timestamp
 * @returns {boolean} true if expired, false otherwise
 */
export function isOTPExpired(otpExpiry) {
  if (!otpExpiry) return true;
  return new Date() > new Date(otpExpiry);
}

/**
 * Generate OTP expiry time (10 minutes from now)
 * @returns {Date} OTP expiry timestamp
 */
export function generateOTPExpiry() {
  return new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} true if valid, false otherwise
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} Validation result with isValid and errors
 */
export function validatePassword(password) {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Rate limiting utilities
const rateLimitMap = new Map();

/**
 * Simple rate limiter for API endpoints
 * @param {string} key - Unique identifier for the rate limit (e.g., userId + endpoint)
 * @param {number} maxRequests - Maximum requests allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {boolean} - True if request is allowed, false if rate limited
 */
export function checkRateLimit(key, maxRequests = 5, windowMs = 60000) {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  if (!rateLimitMap.has(key)) {
    rateLimitMap.set(key, []);
  }
  
  const requests = rateLimitMap.get(key);
  
  // Remove old requests outside the window
  const validRequests = requests.filter(timestamp => timestamp > windowStart);
  
  if (validRequests.length >= maxRequests) {
    return false; // Rate limited
  }
  
  // Add current request
  validRequests.push(now);
  rateLimitMap.set(key, validRequests);
  
  return true; // Request allowed
}

/**
 * Clean up old rate limit entries to prevent memory leaks
 */
export function cleanupRateLimits() {
  const now = Date.now();
  const maxAge = 5 * 60 * 1000; // 5 minutes
  
  for (const [key, requests] of rateLimitMap.entries()) {
    const validRequests = requests.filter(timestamp => now - timestamp < maxAge);
    if (validRequests.length === 0) {
      rateLimitMap.delete(key);
    } else {
      rateLimitMap.set(key, validRequests);
    }
  }
}

// Clean up rate limits every 5 minutes
setInterval(cleanupRateLimits, 5 * 60 * 1000);

