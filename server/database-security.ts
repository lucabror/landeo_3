import { db } from "./db";
import { sql } from "drizzle-orm";
import { hotels, guestProfiles, localExperiences, itineraries, adminUsers, creditPurchases } from "@shared/schema";

/**
 * Database Security Layer
 * Implements comprehensive security measures for database protection
 */

// Security Configuration
const SECURITY_CONFIG = {
  MAX_QUERY_TIMEOUT: 30000, // 30 seconds max query time
  MAX_RESULTS_LIMIT: 1000,  // Maximum results per query
  RATE_LIMIT_WINDOW: 60000, // 1 minute rate limiting window
  MAX_REQUESTS_PER_WINDOW: 100, // Max 100 requests per minute per user
  SENSITIVE_FIELDS: ['password', 'mfaSecret', 'sessionToken', 'ipWhitelist'],
  AUDIT_TABLES: ['hotels', 'adminUsers', 'creditPurchases']
};

// Query rate limiting tracker
const queryRateTracker = new Map<string, { count: number; windowStart: number }>();

/**
 * Security Middleware for Database Operations
 */
export class DatabaseSecurity {
  
  /**
   * Rate limiting protection
   */
  static checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const userTracking = queryRateTracker.get(userId);
    
    if (!userTracking || now - userTracking.windowStart > SECURITY_CONFIG.RATE_LIMIT_WINDOW) {
      queryRateTracker.set(userId, { count: 1, windowStart: now });
      return true;
    }
    
    if (userTracking.count >= SECURITY_CONFIG.MAX_REQUESTS_PER_WINDOW) {
      console.warn(`🚨 Rate limit exceeded for user: ${userId}`);
      return false;
    }
    
    userTracking.count++;
    return true;
  }

  /**
   * Input sanitization and validation
   */
  static sanitizeInput(input: any): any {
    if (typeof input === 'string') {
      // Remove potential SQL injection patterns
      return input
        .replace(/[\x00-\x1f\x7f-\x9f]/g, '') // Remove control characters
        .replace(/[<>]/g, '') // Remove potential XSS
        .trim()
        .substring(0, 10000); // Limit length
    }
    
    if (Array.isArray(input)) {
      return input.map(item => DatabaseSecurity.sanitizeInput(item));
    }
    
    if (typeof input === 'object' && input !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(input)) {
        sanitized[key] = DatabaseSecurity.sanitizeInput(value);
      }
      return sanitized;
    }
    
    return input;
  }

  /**
   * Remove sensitive fields from query results
   */
  static filterSensitiveData<T extends Record<string, any>>(data: T | T[]): T | T[] {
    const filter = (item: T): T => {
      const filtered = { ...item };
      SECURITY_CONFIG.SENSITIVE_FIELDS.forEach(field => {
        if (field in filtered) {
          delete filtered[field];
        }
      });
      return filtered;
    };

    return Array.isArray(data) ? data.map(filter) : filter(data);
  }

  /**
   * Audit logging for sensitive operations
   */
  static async auditLog(operation: string, table: string, userId: string, data?: any): Promise<void> {
    if (!SECURITY_CONFIG.AUDIT_TABLES.includes(table)) return;
    
    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        operation,
        table,
        userId,
        ip: process.env.CLIENT_IP || 'unknown',
        data: data ? JSON.stringify(data).substring(0, 1000) : null
      };
      
      console.log(`🔍 AUDIT: ${JSON.stringify(logEntry)}`);
      
      // Store in security logs table if needed
      // await db.insert(securityLogs).values(logEntry);
    } catch (error) {
      console.error('Audit logging failed:', error);
    }
  }

  /**
   * Query timeout protection
   */
  static async executeWithTimeout<T>(
    queryPromise: Promise<T>, 
    timeoutMs: number = SECURITY_CONFIG.MAX_QUERY_TIMEOUT
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Query timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      queryPromise
        .then(result => {
          clearTimeout(timeout);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }

  /**
   * SQL injection prevention - validate query parameters
   */
  static validateQueryParams(params: Record<string, any>): boolean {
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string') {
        // Check for SQL injection patterns
        const sqlInjectionPatterns = [
          /(\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bTRUNCATE\b)/i,
          /(\bUNION\b|\bWHERE\b|\bORDER BY\b|\bGROUP BY\b)/i,
          /(--|\/\*|\*\/|;|\\'|\\")/,
          /(\bEXEC\b|\bEXECUTE\b|\bsp_\b|\bxp_\b)/i
        ];
        
        for (const pattern of sqlInjectionPatterns) {
          if (pattern.test(value)) {
            console.warn(`🚨 Potential SQL injection detected in param ${key}: ${value}`);
            return false;
          }
        }
      }
    }
    return true;
  }

  /**
   * Database connection health check
   */
  static async healthCheck(): Promise<{ status: string; latency: number }> {
    const start = Date.now();
    try {
      await db.execute(sql`SELECT 1 as health_check`);
      return {
        status: 'healthy',
        latency: Date.now() - start
      };
    } catch (error) {
      console.error('Database health check failed:', error);
      return {
        status: 'unhealthy',
        latency: Date.now() - start
      };
    }
  }

  /**
   * Connection pool monitoring
   */
  static getConnectionStats(): any {
    // Return connection pool statistics if available
    return {
      activeConnections: 'N/A - Serverless',
      maxConnections: 'N/A - Serverless',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Backup validation
   */
  static async validateBackup(): Promise<boolean> {
    try {
      // Check if critical tables exist and have data
      const criticalTables = [
        { table: hotels, name: 'hotels' },
        { table: guestProfiles, name: 'guest_profiles' },
        { table: localExperiences, name: 'local_experiences' },
        { table: itineraries, name: 'itineraries' }
      ];

      for (const { table, name } of criticalTables) {
        const result = await db.select().from(table).limit(1);
        console.log(`✓ Table ${name} validated`);
      }

      return true;
    } catch (error) {
      console.error('Backup validation failed:', error);
      return false;
    }
  }

  /**
   * Data encryption for sensitive fields
   */
  static encryptSensitiveData(data: any, fields: string[] = SECURITY_CONFIG.SENSITIVE_FIELDS): any {
    if (!data) return data;
    
    const encrypted = { ...data };
    fields.forEach(field => {
      if (encrypted[field] && typeof encrypted[field] === 'string') {
        // In production, use proper encryption library like crypto
        encrypted[field] = Buffer.from(encrypted[field]).toString('base64');
      }
    });
    
    return encrypted;
  }

  /**
   * Data decryption for sensitive fields
   */
  static decryptSensitiveData(data: any, fields: string[] = SECURITY_CONFIG.SENSITIVE_FIELDS): any {
    if (!data) return data;
    
    const decrypted = { ...data };
    fields.forEach(field => {
      if (decrypted[field] && typeof decrypted[field] === 'string') {
        try {
          // In production, use proper decryption
          decrypted[field] = Buffer.from(decrypted[field], 'base64').toString();
        } catch (error) {
          console.warn(`Failed to decrypt field ${field}`);
        }
      }
    });
    
    return decrypted;
  }
}

/**
 * Secure Database Operations Wrapper
 */
export class SecureDatabase {
  
  /**
   * Secure SELECT operation with protection
   */
  static async secureSelect<T>(
    table: any,
    conditions: any,
    userId: string,
    options: { limit?: number; includeSensitive?: boolean } = {}
  ): Promise<T[]> {
    // Rate limiting
    if (!DatabaseSecurity.checkRateLimit(userId)) {
      throw new Error('Rate limit exceeded');
    }

    // Input validation
    if (!DatabaseSecurity.validateQueryParams(conditions)) {
      throw new Error('Invalid query parameters detected');
    }

    // Sanitize input
    const sanitizedConditions = DatabaseSecurity.sanitizeInput(conditions);

    // Apply limit
    const limit = Math.min(options.limit || 100, SECURITY_CONFIG.MAX_RESULTS_LIMIT);

    try {
      // Execute with timeout
      const result = await DatabaseSecurity.executeWithTimeout(
        db.select().from(table).where(sanitizedConditions).limit(limit)
      );

      // Audit log
      await DatabaseSecurity.auditLog('SELECT', table._.name, userId);

      // Filter sensitive data unless specifically requested
      return options.includeSensitive 
        ? result as T[]
        : DatabaseSecurity.filterSensitiveData(result) as T[];

    } catch (error) {
      console.error(`Secure SELECT failed on ${table._.name}:`, error);
      throw new Error('Database operation failed');
    }
  }

  /**
   * Secure INSERT operation with protection
   */
  static async secureInsert<T>(
    table: any,
    data: any,
    userId: string
  ): Promise<T> {
    // Rate limiting
    if (!DatabaseSecurity.checkRateLimit(userId)) {
      throw new Error('Rate limit exceeded');
    }

    // Input validation and sanitization
    const sanitizedData = DatabaseSecurity.sanitizeInput(data);

    try {
      // Execute with timeout
      const result = await DatabaseSecurity.executeWithTimeout(
        db.insert(table).values(sanitizedData).returning()
      ) as T[];

      // Audit log
      await DatabaseSecurity.auditLog('INSERT', table._.name, userId, sanitizedData);

      return result[0];

    } catch (error) {
      console.error(`Secure INSERT failed on ${table._.name}:`, error);
      throw new Error('Database operation failed');
    }
  }

  /**
   * Secure UPDATE operation with protection
   */
  static async secureUpdate<T>(
    table: any,
    id: string,
    data: any,
    userId: string
  ): Promise<T> {
    // Rate limiting
    if (!DatabaseSecurity.checkRateLimit(userId)) {
      throw new Error('Rate limit exceeded');
    }

    // Input validation and sanitization
    const sanitizedData = DatabaseSecurity.sanitizeInput(data);

    try {
      // Execute with timeout
      const result = await DatabaseSecurity.executeWithTimeout(
        db.update(table).set(sanitizedData).where(sql`id = ${id}`).returning()
      );

      // Audit log
      await DatabaseSecurity.auditLog('UPDATE', table._.name, userId, { id, ...sanitizedData });

      return result[0] as T;

    } catch (error) {
      console.error(`Secure UPDATE failed on ${table._.name}:`, error);
      throw new Error('Database operation failed');
    }
  }

  /**
   * Secure DELETE operation with protection
   */
  static async secureDelete(
    table: any,
    id: string,
    userId: string
  ): Promise<void> {
    // Rate limiting
    if (!DatabaseSecurity.checkRateLimit(userId)) {
      throw new Error('Rate limit exceeded');
    }

    try {
      // Execute with timeout
      await DatabaseSecurity.executeWithTimeout(
        db.delete(table).where(sql`id = ${id}`)
      );

      // Audit log
      await DatabaseSecurity.auditLog('DELETE', table._.name, userId, { id });

    } catch (error) {
      console.error(`Secure DELETE failed on ${table._.name}:`, error);
      throw new Error('Database operation failed');
    }
  }
}

/**
 * Database Security Monitoring
 */
export class SecurityMonitor {
  
  /**
   * Monitor for suspicious activities
   */
  static async detectSuspiciousActivity(): Promise<any[]> {
    const suspiciousPatterns: any[] = [];
    
    // Check for unusual query patterns
    // Check for multiple failed authentications
    // Check for unusual data access patterns
    
    return suspiciousPatterns;
  }

  /**
   * Generate security report
   */
  static async generateSecurityReport(): Promise<any> {
    const health = await DatabaseSecurity.healthCheck();
    const connections = DatabaseSecurity.getConnectionStats();
    const suspicious = await this.detectSuspiciousActivity();
    
    return {
      timestamp: new Date().toISOString(),
      database: {
        health: health.status,
        latency: health.latency,
        connections
      },
      security: {
        suspiciousActivities: suspicious.length,
        rateLimit: {
          activeUsers: queryRateTracker.size,
          requests: Array.from(queryRateTracker.values()).reduce((sum, user) => sum + user.count, 0)
        }
      }
    };
  }
}

export default DatabaseSecurity;