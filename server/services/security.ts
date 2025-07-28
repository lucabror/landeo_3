import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import { db } from '../db';
import { hotels, adminUsers, securitySessions, securityLogs } from '@shared/schema';
import { eq, and, lt, gt } from 'drizzle-orm';
import type { Request, Response, NextFunction } from 'express';

// Security configuration
const JWT_SECRET = process.env.JWT_SECRET || (() => {
  throw new Error('JWT_SECRET environment variable is required for production security');
})();
const MFA_ENCRYPTION_KEY = process.env.MFA_ENCRYPTION_KEY || JWT_SECRET; // Use for MFA secret encryption
const SESSION_DURATION = 2 * 60 * 60 * 1000; // 2 hours (ridotto da 8 per sicurezza)
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes

// Logging functions
export async function logSecurityEvent(
  userId: string | null,
  userType: 'hotel' | 'admin',
  action: string,
  ipAddress: string,
  userAgent: string | undefined,
  details?: Record<string, any>
) {
  try {
    await db.insert(securityLogs).values({
      userId,
      userType,
      action,
      ipAddress,
      userAgent: userAgent || 'unknown',
      details: details || {},
    });
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}

// Password security
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// MFA Secret Encryption (Vulnerabilità #23 - MFA Secret Storage)
export function encryptMfaSecret(secret: string): string {
  const cipher = crypto.createCipher('aes-256-cbc', MFA_ENCRYPTION_KEY);
  let encrypted = cipher.update(secret, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

export function decryptMfaSecret(encryptedSecret: string): string {
  try {
    // Se il secret sembra essere già in chiaro (base32), ritornalo direttamente
    if (encryptedSecret && encryptedSecret.length === 32 && /^[A-Z2-7]+$/.test(encryptedSecret)) {
      return encryptedSecret;
    }
    
    const decipher = crypto.createDecipher('aes-256-cbc', MFA_ENCRYPTION_KEY);
    let decrypted = decipher.update(encryptedSecret, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Error decrypting MFA secret:', error);
    // Fallback: se la decrittazione fallisce, prova a usare il secret direttamente
    return encryptedSecret;
  }
}

// JWT token management
export function generateJWT(userId: string, userType: 'hotel' | 'admin'): string {
  return jwt.sign(
    { userId, userType, iat: Date.now() },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

export function verifyJWT(token: string): { userId: string; userType: 'hotel' | 'admin' } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return { userId: decoded.userId, userType: decoded.userType };
  } catch (error) {
    return null;
  }
}

// Session management
export async function createSecuritySession(
  userId: string,
  userType: 'hotel' | 'admin',
  ipAddress: string,
  userAgent: string | undefined
): Promise<string> {
  // Invalidate existing sessions for this user to prevent session fixation
  await db.update(securitySessions)
    .set({ isActive: false })
    .where(
      and(
        eq(securitySessions.userId, userId),
        eq(securitySessions.userType, userType),
        eq(securitySessions.isActive, true)
      )
    );

  const sessionToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_DURATION);

  await db.insert(securitySessions).values({
    userId,
    userType,
    sessionToken,
    ipAddress,
    userAgent: userAgent || 'unknown',
    expiresAt,
    mfaVerified: false,
  });

  // Log security event for monitoring
  await logSecurityEvent(
    userId,
    userType,
    'session_created',
    ipAddress,
    userAgent,
    { sessionToken: sessionToken.substring(0, 8) + '...' }
  );

  return sessionToken;
}

export async function validateSession(sessionToken: string): Promise<{
  userId: string;
  userType: 'hotel' | 'admin';
  mfaVerified: boolean;
} | null> {
  const [session] = await db
    .select()
    .from(securitySessions)
    .where(
      and(
        eq(securitySessions.sessionToken, sessionToken),
        eq(securitySessions.isActive, true),
        gt(securitySessions.expiresAt, new Date())
      )
    );

  return session
    ? {
        userId: session.userId,
        userType: session.userType as 'hotel' | 'admin',
        mfaVerified: session.mfaVerified || false,
      }
    : null;
}

export async function invalidateSession(sessionToken: string): Promise<void> {
  await db
    .update(securitySessions)
    .set({ isActive: false })
    .where(eq(securitySessions.sessionToken, sessionToken));
}

export async function markSessionMfaVerified(sessionToken: string): Promise<void> {
  await db
    .update(securitySessions)
    .set({ mfaVerified: true })
    .where(eq(securitySessions.sessionToken, sessionToken));
}

// Account lockout management
export async function checkAccountLockout(userId: string, userType: 'hotel' | 'admin'): Promise<boolean> {
  const table = userType === 'hotel' ? hotels : adminUsers;
  
  const [user] = await db
    .select()
    .from(table)
    .where(eq(table.id, userId));

  if (!user) return true; // Locked if user doesn't exist

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return true; // Account is locked
  }

  return false;
}

export async function incrementLoginAttempts(userId: string, userType: 'hotel' | 'admin'): Promise<void> {
  const table = userType === 'hotel' ? hotels : adminUsers;
  
  const [user] = await db
    .select()
    .from(table)
    .where(eq(table.id, userId));

  if (!user) return;

  const newAttempts = (user.loginAttempts || 0) + 1;
  const lockUntil = newAttempts >= MAX_LOGIN_ATTEMPTS 
    ? new Date(Date.now() + LOCKOUT_DURATION) 
    : null;

  await db
    .update(table)
    .set({
      loginAttempts: newAttempts,
      lockedUntil: lockUntil,
    })
    .where(eq(table.id, userId));
}

export async function resetLoginAttempts(userId: string, userType: 'hotel' | 'admin'): Promise<void> {
  const table = userType === 'hotel' ? hotels : adminUsers;
  
  await db
    .update(table)
    .set({
      loginAttempts: 0,
      lockedUntil: null,
      lastLogin: new Date(),
    })
    .where(eq(table.id, userId));
}

// Google Authenticator 2FA Setup
export async function setupGoogleAuthenticator(
  userId: string,
  userType: 'hotel' | 'admin',
  userEmail: string
): Promise<{ secret: string; qrCodeDataUrl: string }> {
  const secret = speakeasy.generateSecret({
    name: `Itinera (${userEmail})`,
    issuer: 'Itinera Hotel Management',
    length: 32,
  });

  // Generate QR code
  const qrCodeDataUrl = await qrcode.toDataURL(secret.otpauth_url || '');

  // Store the secret in database (temporaneamente in chiaro per compatibilità)
  const table = userType === 'hotel' ? hotels : adminUsers;
  await db
    .update(table)
    .set({ mfaSecret: secret.base32 })
    .where(eq(table.id, userId));

  return {
    secret: secret.base32,
    qrCodeDataUrl,
  };
}

export async function enableGoogleAuthenticator(
  userId: string,
  userType: 'hotel' | 'admin',
  verificationCode: string
): Promise<{ success: boolean; error?: string }> {
  const table = userType === 'hotel' ? hotels : adminUsers;
  
  const [user] = await db
    .select()
    .from(table)
    .where(eq(table.id, userId));

  if (!user || !user.mfaSecret) {
    return { success: false, error: 'Setup MFA non trovato' };
  }

  // Verify the code (usando secret direttamente per compatibilità)
  const verified = speakeasy.totp.verify({
    secret: user.mfaSecret,
    encoding: 'base32',
    token: verificationCode,
    time: Date.now() / 1000,
    window: 2,
  });

  if (!verified) {
    return { success: false, error: 'Codice di verifica non valido' };
  }

  // Enable MFA
  await db
    .update(table)
    .set({ mfaEnabled: true })
    .where(eq(table.id, userId));

  return { success: true };
}

// Verify Google Authenticator code
export async function verifyGoogleAuthenticatorCode(
  userId: string,
  userType: 'hotel' | 'admin',
  code: string
): Promise<{ success: boolean; error?: string }> {
  const table = userType === 'hotel' ? hotels : adminUsers;
  
  const [user] = await db
    .select()
    .from(table)
    .where(eq(table.id, userId));

  if (!user || !user.mfaSecret || !user.mfaEnabled) {
    return { success: false, error: 'MFA non configurato' };
  }

  // Verify MFA code (usando secret direttamente per compatibilità)
  const verified = speakeasy.totp.verify({
    secret: user.mfaSecret,
    encoding: 'base32',
    token: code,
    time: Date.now() / 1000,
    window: 2, // Allow 2 time steps (±60 seconds)
  });

  if (!verified) {
    return { success: false, error: 'Codice non valido' };
  }

  return { success: true };
}

// IP whitelist validation
export async function validateIpWhitelist(
  userId: string,
  userType: 'hotel' | 'admin',
  ipAddress: string
): Promise<boolean> {
  const table = userType === 'hotel' ? hotels : adminUsers;
  
  const [user] = await db
    .select()
    .from(table)
    .where(eq(table.id, userId));

  if (!user || !user.ipWhitelist || user.ipWhitelist.length === 0) {
    return true; // TEMPORARY FIX: Allow access when no IP whitelist is configured
  }

  return user.ipWhitelist.includes(ipAddress);
}

// Middleware for authentication
export function requireAuth(options: { 
  userType?: 'hotel' | 'admin' | 'both';
  requireMfa?: boolean;
} = {}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sessionToken = req.headers.authorization?.replace('Bearer ', '') || 
                          (req as any).cookies?.sessionToken;

      if (!sessionToken) {
        await logSecurityEvent(
          null,
          'admin',
          'auth_missing_token',
          req.ip || 'unknown',
          req.get('User-Agent')
        );
        return res.status(401).json({ error: 'Token di autenticazione richiesto' });
      }

      const session = await validateSession(sessionToken);
      if (!session) {
        await logSecurityEvent(
          null,
          'admin',
          'auth_invalid_token',
          req.ip || 'unknown',
          req.get('User-Agent')
        );
        return res.status(401).json({ error: 'Token non valido o scaduto' });
      }

      // Check user type
      if (options.userType && options.userType !== 'both' && session.userType !== options.userType) {
        await logSecurityEvent(
          session.userId,
          session.userType,
          'auth_wrong_user_type',
          req.ip || 'unknown',
          req.get('User-Agent')
        );
        return res.status(403).json({ error: 'Tipo di utente non autorizzato' });
      }

      // Check MFA requirement
      if (options.requireMfa && !session.mfaVerified) {
        await logSecurityEvent(
          session.userId,
          session.userType,
          'auth_mfa_required',
          req.ip || 'unknown',
          req.get('User-Agent')
        );
        return res.status(403).json({ error: 'Autenticazione a due fattori richiesta' });
      }

      // Check IP whitelist
      const ipAllowed = await validateIpWhitelist(session.userId, session.userType, req.ip || 'unknown');
      if (!ipAllowed) {
        await logSecurityEvent(
          session.userId,
          session.userType,
          'auth_ip_blocked',
          req.ip || 'unknown',
          req.get('User-Agent')
        );
        return res.status(403).json({ error: 'Indirizzo IP non autorizzato' });
      }

      // Add user info to request
      (req as any).user = {
        id: session.userId,
        type: session.userType,
        mfaVerified: session.mfaVerified,
      };

      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      res.status(500).json({ error: 'Errore interno del server' });
    }
  };
}

// Rate limiting helper
export function createRateLimiter(windowMs: number, max: number) {
  const attempts = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    const record = attempts.get(key);

    if (!record || now > record.resetTime) {
      attempts.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (record.count >= max) {
      return res.status(429).json({ 
        error: 'Troppi tentativi. Riprova più tardi.' 
      });
    }

    record.count++;
    next();
  };
}