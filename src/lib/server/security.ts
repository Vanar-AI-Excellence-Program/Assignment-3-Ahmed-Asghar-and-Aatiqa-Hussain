import type { Response } from '@sveltejs/kit';

export function addSecurityHeaders(response: Response): Response {
    // Security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    
    // Add HSTS header in production
    if (process.env.NODE_ENV === 'production') {
        response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    
    // Add CSP header
    response.headers.set('Content-Security-Policy', 
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: https:; " +
        "font-src 'self'; " +
        "connect-src 'self'; " +
        "frame-ancestors 'none';"
    );
    
    return response;
}

export const COOKIE_SECURITY_CONFIG = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' as const : 'lax' as const,
    path: '/',
    maxAge: 30 * 24 * 60 * 60 // 30 days
};

export function sanitizeError(error: unknown): string {
    if (process.env.NODE_ENV === 'production') {
        return 'An error occurred';
    }
    
    if (error instanceof Error) {
        return error.message;
    }
    
    return 'Unknown error';
}
