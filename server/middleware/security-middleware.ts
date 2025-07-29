import type { Request, Response, NextFunction } from "express";
import { DatabaseSecurity, SecurityMonitor } from "../database-security";
import rateLimit from "express-rate-limit";

// Enhanced rate limiting with security features
export const securityRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later.",
    type: "RATE_LIMIT_EXCEEDED",
    retryAfter: "15 minutes"
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/api/health';
  },
  handler: (req, res) => {
    console.warn(`🚨 Rate limit reached for IP: ${req.ip} on path: ${req.path}`);
    res.status(429).json({
      error: "Too many requests from this IP, please try again later.",
      type: "RATE_LIMIT_EXCEEDED",
      retryAfter: "15 minutes"
    });
  }
});

// Stricter rate limiting for authentication endpoints
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per 15 minutes
  message: {
    error: "Too many login attempts, please try again later.",
    type: "AUTH_RATE_LIMIT_EXCEEDED",
    retryAfter: "15 minutes"
  },
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    console.warn(`🚨 Auth rate limit reached for IP: ${req.ip}`);
    res.status(429).json({
      error: "Too many login attempts, please try again later.",
      type: "AUTH_RATE_LIMIT_EXCEEDED",
      retryAfter: "15 minutes"
    });
  }
});

/**
 * Database security middleware
 */
export function databaseSecurityMiddleware(req: Request, res: Response, next: NextFunction) {
  const userId = (req as any).user?.id || 'anonymous';
  const userType = (req as any).user?.type || 'unknown';
  
  // Check rate limits
  if (!DatabaseSecurity.checkRateLimit(userId)) {
    return res.status(429).json({
      error: "Database rate limit exceeded",
      type: "DB_RATE_LIMIT_EXCEEDED",
      retryAfter: "1 minute"
    });
  }

  // Log database access
  console.log(`🔒 DB Access: ${userId} (${userType}) - ${req.method} ${req.path}`);
  
  // Add security context to request
  (req as any).security = {
    userId,
    userType,
    timestamp: Date.now()
  };

  next();
}

/**
 * Input validation middleware
 */
export function inputValidationMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    // Validate and sanitize request body
    if (req.body) {
      req.body = DatabaseSecurity.sanitizeInput(req.body);
    }

    // Validate query parameters
    if (req.query) {
      if (!DatabaseSecurity.validateQueryParams(req.query as Record<string, any>)) {
        return res.status(400).json({
          error: "Invalid query parameters detected",
          type: "INVALID_INPUT"
        });
      }
      req.query = DatabaseSecurity.sanitizeInput(req.query);
    }

    // Validate URL parameters
    if (req.params) {
      req.params = DatabaseSecurity.sanitizeInput(req.params);
    }

    next();
  } catch (error) {
    console.error('Input validation failed:', error);
    return res.status(400).json({
      error: "Input validation failed",
      type: "VALIDATION_ERROR"
    });
  }
}

/**
 * Security headers middleware
 */
export function securityHeadersMiddleware(req: Request, res: Response, next: NextFunction) {
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'");
  
  next();
}

/**
 * Database health monitoring middleware
 */
export function healthMonitoringMiddleware(req: Request, res: Response, next: NextFunction) {
  // Monitor database health every 100 requests
  if (Math.random() < 0.01) {
    DatabaseSecurity.healthCheck()
      .then(health => {
        if (health.status !== 'healthy') {
          console.warn(`⚠️ Database health check failed: ${JSON.stringify(health)}`);
        }
      })
      .catch(error => {
        console.error('Health check error:', error);
      });
  }
  
  next();
}

/**
 * Audit logging middleware
 */
export function auditMiddleware(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  const userId = (req as any).user?.id || 'anonymous';
  
  // Log request
  const logData = {
    method: req.method,
    path: req.path,
    userId,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  };

  // Intercept response to log completion
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - startTime;
    console.log(`📋 Audit: ${req.method} ${req.path} - ${res.statusCode} (${duration}ms) - User: ${userId}`);
    
    // Log sensitive operations
    if (req.method !== 'GET' && res.statusCode < 400) {
      DatabaseSecurity.auditLog(req.method, req.path, userId, {
        duration,
        statusCode: res.statusCode
      }).catch(error => {
        console.error('Audit logging failed:', error);
      });
    }
    
    return originalSend.call(this, data);
  };
  
  next();
}

/**
 * Error handling middleware for security
 */
export function securityErrorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  console.error('Security error:', err);
  
  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const errorResponse = {
    error: isDevelopment ? err.message : "An error occurred",
    type: "SECURITY_ERROR",
    requestId: req.get('X-Request-ID') || 'unknown'
  };

  // Log security incidents
  DatabaseSecurity.auditLog('ERROR', 'security', (req as any).user?.id || 'anonymous', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  }).catch(console.error);

  res.status(500).json(errorResponse);
}

/**
 * Combined security middleware stack
 */
export function securityMiddlewareStack() {
  return [
    securityHeadersMiddleware,
    inputValidationMiddleware,
    databaseSecurityMiddleware,
    healthMonitoringMiddleware,
    auditMiddleware
  ];
}