import { Router } from 'express';
import { z } from 'zod';
import { body, validationResult } from 'express-validator';
import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import { db } from '../db';
import { hotels, adminUsers } from '@shared/schema';
import { eq, and, gt } from 'drizzle-orm';
import {
  hashPassword,
  verifyPassword,
  createSecuritySession,
  validateSession,
  invalidateSession,
  checkAccountLockout,
  incrementLoginAttempts,
  resetLoginAttempts,
  setupGoogleAuthenticator,
  enableGoogleAuthenticator,
  verifyGoogleAuthenticatorCode,
  markSessionMfaVerified,
  logSecurityEvent,
  requireAuth,
  createRateLimiter,
} from '../services/security';

const router = Router();

// Rate limiting for auth endpoints
const loginLimiter = createRateLimiter(15 * 60 * 1000, 3); // 3 attempts per 15 minutes (ridotto da 5)
const mfaLimiter = createRateLimiter(5 * 60 * 1000, 3); // 3 attempts per 5 minutes (ridotto da 10)

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('Email non valida'),
  password: z.string().min(1, 'Password richiesta'),
});

const mfaVerifySchema = z.object({
  sessionToken: z.string(),
  code: z.string().length(6, 'Il codice deve essere di 6 cifre'),
});

const setupPasswordSchema = z.object({
  hotelId: z.string().uuid('ID hotel non valido'),
  password: z.string()
    .min(12, 'La password deve essere di almeno 12 caratteri')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
           'La password deve contenere almeno: 1 minuscola, 1 maiuscola, 1 numero, 1 carattere speciale'),
});

// Hotel manager login
router.post('/login/hotel', loginLimiter, async (req, res) => {
  try {
    const validation = z.object({
      email: z.string().email('Email non valida'),
      password: z.string().min(1, 'Password richiesta'),
    }).safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Dati non validi', 
        details: validation.error.errors 
      });
    }

    const { email, password } = validation.data;
    const ipAddress = req.ip || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';

    // Find hotel by email
    const [hotel] = await db
      .select()
      .from(hotels)
      .where(eq(hotels.email, email));

    if (!hotel) {
      await logSecurityEvent(null, 'hotel', 'login_failed', ipAddress, userAgent, { email: email.substring(0, 3) + '***' });
      // Ritardo artificiale per prevenire timing attacks
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
      return res.status(401).json({ error: 'Credenziali non valide' });
    }

    // Check if account is locked
    const isLocked = await checkAccountLockout(hotel.id, 'hotel');
    if (isLocked) {
      await logSecurityEvent(hotel.id, 'hotel', 'login_failed_account_locked', ipAddress, userAgent);
      return res.status(423).json({ error: 'Account temporaneamente bloccato per troppi tentativi' });
    }

    // Check if password is set
    if (!hotel.password) {
      return res.status(400).json({ 
        error: 'Password non configurata',
        requiresSetup: true,
        hotelId: hotel.id
      });
    }

    // Verify password
    const passwordValid = await verifyPassword(password, hotel.password);
    
    if (!passwordValid) {
      await incrementLoginAttempts(hotel.id, 'hotel');
      await logSecurityEvent(hotel.id, 'hotel', 'login_failed', ipAddress, userAgent);
      // Ritardo artificiale per prevenire timing attacks
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
      return res.status(401).json({ error: 'Credenziali non valide' });
    }

    // Create session
    const sessionToken = await createSecuritySession(hotel.id, 'hotel', ipAddress, userAgent);
    
    // Check if MFA is enabled for this hotel
    if (hotel.mfaEnabled) {
      // MFA is required - return session token for MFA verification
      await logSecurityEvent(hotel.id, 'hotel', 'login_requires_mfa', ipAddress, userAgent);
      return res.json({
        success: true,
        requiresMfa: true,
        sessionToken,
        message: 'Inserisci il codice Google Authenticator'
      });
    }
    
    // MFA not enabled - complete login
    await resetLoginAttempts(hotel.id, 'hotel');
    await markSessionMfaVerified(sessionToken);
    await logSecurityEvent(hotel.id, 'hotel', 'login_success', ipAddress, userAgent);

    res.json({
      success: true,
      sessionToken,
      user: {
        id: hotel.id,
        email: hotel.email,
        name: hotel.name,
        type: 'hotel',
        hotelId: hotel.id
      }
    });
  } catch (error) {
    console.error('Hotel login error:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Admin login
router.post('/login/admin', loginLimiter, async (req, res) => {
  try {
    const validation = z.object({
      email: z.string().email('Email non valida'),
      password: z.string().min(1, 'Password richiesta'),
    }).safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Dati non validi', 
        details: validation.error.errors 
      });
    }

    const { email, password } = validation.data;
    const ipAddress = req.ip || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';

    // Find admin by email
    const [admin] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.email, email));
    if (!admin) {
      await logSecurityEvent(null, 'admin', 'login_failed_user_not_found', ipAddress, userAgent, { email });
      return res.status(401).json({ error: 'Credenziali non valide' });
    }

    // Check if account is locked
    const isLocked = await checkAccountLockout(admin.id, 'admin');
    if (isLocked) {
      await logSecurityEvent(admin.id, 'admin', 'login_failed_account_locked', ipAddress, userAgent);
      return res.status(423).json({ error: 'Account temporaneamente bloccato per troppi tentativi' });
    }

    // Verify password - check if admin has password set
    if (!admin.password) {
      return res.status(401).json({ error: 'Account non configurato. Contatta l\'amministratore di sistema.' });
    }
    
    const passwordValid = await verifyPassword(password, admin.password);
    if (!passwordValid) {
      await incrementLoginAttempts(admin.id, 'admin');
      await logSecurityEvent(admin.id, 'admin', 'login_failed_wrong_password', ipAddress, userAgent);
      return res.status(401).json({ error: 'Credenziali non valide' });
    }

    // Create session
    const sessionToken = await createSecuritySession(admin.id, 'admin', ipAddress, userAgent);
    
    // Check if MFA is enabled for this admin
    if (admin.mfaEnabled) {
      // MFA is required - return session token for MFA verification
      await logSecurityEvent(admin.id, 'admin', 'login_requires_mfa', ipAddress, userAgent);
      return res.json({
        success: true,
        requiresMfa: true,
        sessionToken,
        message: 'Inserisci il codice Google Authenticator'
      });
    }
    
    // MFA not enabled - complete login
    await resetLoginAttempts(admin.id, 'admin');
    await markSessionMfaVerified(sessionToken);
    await logSecurityEvent(admin.id, 'admin', 'login_success', ipAddress, userAgent);

    res.json({
      success: true,
      sessionToken,
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        type: 'admin'
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Setup hotel manager password (first time)
router.post('/setup-password', async (req, res) => {
  try {
    const validation = setupPasswordSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Dati non validi', 
        details: validation.error.errors 
      });
    }

    const { hotelId, password } = validation.data;
    const ipAddress = req.ip || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';

    // Check if hotel exists
    const [hotel] = await db
      .select()
      .from(hotels)
      .where(eq(hotels.id, hotelId));

    if (!hotel) {
      return res.status(404).json({ error: 'Hotel non trovato' });
    }

    // Check if password is already set
    if (hotel.password) {
      return res.status(400).json({ error: 'Password già configurata' });
    }

    // Hash and save password
    const hashedPassword = await hashPassword(password);
    await db
      .update(hotels)
      .set({ password: hashedPassword })
      .where(eq(hotels.id, hotelId));

    await logSecurityEvent(hotelId, 'hotel', 'password_setup_success', ipAddress, userAgent);

    res.json({ 
      success: true, 
      message: 'Password configurata con successo' 
    });
  } catch (error) {
    console.error('Password setup error:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Setup Google Authenticator
router.post('/setup-mfa', requireAuth({ userType: 'both' }), async (req, res) => {
  try {
    const { id: userId, type: userType } = (req as any).user;
    const ipAddress = req.ip || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';

    // Get user email
    const table = userType === 'hotel' ? hotels : adminUsers;
    const [user] = await db
      .select()
      .from(table)
      .where(eq(table.id, userId));

    if (!user) {
      return res.status(404).json({ error: 'Utente non trovato' });
    }

    // Setup Google Authenticator
    const { secret, qrCodeDataUrl } = await setupGoogleAuthenticator(
      userId,
      userType,
      user.email
    );

    await logSecurityEvent(userId, userType, 'mfa_setup_initiated', ipAddress, userAgent);

    res.json({
      success: true,
      secret,
      qrCodeDataUrl,
      message: 'Scansiona il codice QR con Google Authenticator'
    });
  } catch (error) {
    console.error('MFA setup error:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Enable Google Authenticator
router.post('/enable-mfa', requireAuth({ userType: 'both' }), async (req, res) => {
  try {
    const { code } = req.body;
    const { id: userId, type: userType } = (req as any).user;
    const ipAddress = req.ip || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';

    if (!code || code.length !== 6) {
      return res.status(400).json({ error: 'Codice di verifica richiesto (6 cifre)' });
    }

    // Enable MFA
    const result = await enableGoogleAuthenticator(userId, userType, code);
    
    if (!result.success) {
      await logSecurityEvent(userId, userType, 'mfa_enable_failed', ipAddress, userAgent, { error: result.error });
      return res.status(400).json({ error: result.error });
    }

    await logSecurityEvent(userId, userType, 'mfa_enabled', ipAddress, userAgent);

    res.json({
      success: true,
      message: 'Google Authenticator configurato con successo'
    });
  } catch (error) {
    console.error('MFA enable error:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Verify MFA code
router.post('/verify-mfa', mfaLimiter, async (req, res) => {
  try {
    const validation = mfaVerifySchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Dati non validi', 
        details: validation.error.errors 
      });
    }

    const { sessionToken, code } = validation.data;
    const ipAddress = req.ip || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';

    // Validate session
    const session = await validateSession(sessionToken);
    if (!session) {
      return res.status(401).json({ error: 'Sessione non valida' });
    }

    if (session.mfaVerified) {
      return res.status(400).json({ error: 'MFA già verificato per questa sessione' });
    }

    // Verify MFA code
    const result = await verifyGoogleAuthenticatorCode(session.userId, session.userType, code);
    
    if (!result.success) {
      await logSecurityEvent(session.userId, session.userType, 'mfa_verify_failed', ipAddress, userAgent, { error: result.error });
      return res.status(400).json({ error: result.error });
    }

    // Mark session as MFA verified
    await markSessionMfaVerified(sessionToken);
    await resetLoginAttempts(session.userId, session.userType);
    
    // Get user info
    const table = session.userType === 'hotel' ? hotels : adminUsers;
    const [user] = await db
      .select()
      .from(table)
      .where(eq(table.id, session.userId));

    await logSecurityEvent(session.userId, session.userType, 'mfa_verify_success', ipAddress, userAgent);

    res.json({
      success: true,
      sessionToken,
      user: {
        id: user!.id,
        email: user!.email,
        name: session.userType === 'hotel' ? (user as any).name : user!.email,
        type: session.userType,
        hotelId: session.userType === 'hotel' ? user!.id : undefined
      }
    });
  } catch (error) {
    console.error('MFA verify error:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Get MFA status
router.get('/mfa-status', requireAuth({ userType: 'both' }), async (req, res) => {
  try {
    const { id: userId, type: userType } = (req as any).user;

    const table = userType === 'hotel' ? hotels : adminUsers;
    const [user] = await db
      .select()
      .from(table)
      .where(eq(table.id, userId));

    if (!user) {
      return res.status(404).json({ error: 'Utente non trovato' });
    }

    res.json({
      mfaEnabled: user.mfaEnabled || false
    });
  } catch (error) {
    console.error('MFA status error:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Disable MFA
router.post('/disable-mfa', requireAuth({ userType: 'both' }), async (req, res) => {
  try {
    const { id: userId, type: userType } = (req as any).user;

    const table = userType === 'hotel' ? hotels : adminUsers;
    
    // Disable MFA for user
    await db
      .update(table)
      .set({ 
        mfaEnabled: false,
        mfaSecret: null 
      })
      .where(eq(table.id, userId));

    const ipAddress = req.ip || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    await logSecurityEvent(userId, userType, 'mfa_disabled', ipAddress, userAgent);

    res.json({ 
      success: true, 
      message: '2FA disattivata con successo' 
    });
  } catch (error) {
    console.error('Disable MFA error:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});



// Logout
router.post('/logout', requireAuth({ userType: 'both' }), async (req, res) => {
  try {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '') || 
                        (req as any).cookies?.sessionToken;
    const { id: userId, type: userType } = (req as any).user;
    const ipAddress = req.ip || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';

    if (sessionToken) {
      await invalidateSession(sessionToken);
    }

    await logSecurityEvent(userId, userType, 'logout_success', ipAddress, userAgent);

    res.json({ success: true, message: 'Logout eseguito con successo' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Get current user info
router.get('/me', requireAuth({ userType: 'both', requireMfa: true }), async (req, res) => {
  try {
    const { id: userId, type: userType } = (req as any).user;

    const table = userType === 'hotel' ? hotels : adminUsers;
    const [user] = await db
      .select()
      .from(table)
      .where(eq(table.id, userId));

    if (!user) {
      return res.status(404).json({ error: 'Utente non trovato' });
    }

    res.json({
      id: user.id,
      email: user.email,
      name: userType === 'hotel' ? (user as any).name : user.email,
      type: userType,
      mfaEnabled: user.mfaEnabled
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

  // Logout endpoint
  router.post('/logout', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(200).json({ message: "Logout completato" });
      }
      
      const sessionToken = authHeader.substring(7);
      
      // Invalidate session on server
      await invalidateSession(sessionToken);
      
      // Log security event
      await logSecurityEvent('logout', null, req.ip || 'unknown', 'successful', 'User logged out');
      
      res.json({ message: "Logout completato con successo" });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ message: "Errore durante il logout" });
    }
  });

// Password reset request
router.post('/forgot-password', async (req, res) => {
  try {
    const { email, userType } = req.body;
    
    if (!email || !userType) {
      return res.status(400).json({ error: 'Email e tipo utente richiesti' });
    }
    
    let user;
    let resetToken;
    let resetExpires;
    
    if (userType === 'hotel') {
      const [hotel] = await db.select().from(hotels).where(eq(hotels.email, email));
      if (!hotel) {
        // Security: don't reveal if email exists
        return res.json({ success: true, message: 'Se l\'email esiste, riceverai le istruzioni per il reset' });
      }
      
      // Generate reset token (valid for 1 hour)
      resetToken = randomBytes(32).toString('hex');
      resetExpires = new Date(Date.now() + 3600000); // 1 hour
      
      await db.update(hotels)
        .set({ 
          sessionToken: resetToken,
          tokenExpiresAt: resetExpires 
        })
        .where(eq(hotels.id, hotel.id));
        
      user = hotel;
    } else if (userType === 'admin') {
      const [admin] = await db.select().from(adminUsers).where(eq(adminUsers.email, email));
      if (!admin) {
        return res.json({ success: true, message: 'Se l\'email esiste, riceverai le istruzioni per il reset' });
      }
      
      resetToken = randomBytes(32).toString('hex');
      resetExpires = new Date(Date.now() + 3600000);
      
      await db.update(adminUsers)
        .set({ 
          sessionToken: resetToken,
          tokenExpiresAt: resetExpires 
        })
        .where(eq(adminUsers.id, admin.id));
        
      user = admin;
    }
    
    // Send reset email during development
    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        
        const baseUrl = process.env.REPLIT_DOMAINS 
          ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` 
          : 'http://localhost:5000';
        const resetUrl = `${baseUrl}/reset-password?token=${resetToken}&type=${userType}`;
        
        await resend.emails.send({
          from: 'delivered@resend.dev',
          to: email,
          subject: 'Reset Password - Itinera Platform (Development)',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #8B4513, #DAA520); padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">🏨 Itinera Platform</h1>
                <p style="color: #F5F5DC; margin: 5px 0 0 0;">Reset Password Richiesto</p>
              </div>
              
              <div style="background: white; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px;">
                <p style="font-size: 16px; color: #2c3e50; margin-bottom: 20px;">
                  Hai richiesto il reset della password per il tuo account Itinera.
                </p>
                
                <p style="font-size: 16px; color: #2c3e50; margin-bottom: 25px;">
                  Clicca il pulsante seguente per impostare una nuova password:
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${resetUrl}" style="background: linear-gradient(135deg, #8B4513, #DAA520); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
                    🔑 Reset Password
                  </a>
                </div>
                
                <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; border-left: 4px solid #DAA520; margin-top: 25px;">
                  <p style="margin: 0; color: #7f8c8d; font-size: 14px;">
                    <strong>⏰ Questo link è valido per 1 ora.</strong><br>
                    Se non hai richiesto il reset, puoi ignorare questa email in sicurezza.
                  </p>
                </div>
                
                <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                  <p style="color: #95a5a6; font-size: 12px; margin: 0;">
                    Ambiente di sviluppo - Futuro dominio: AiTour.it
                  </p>
                </div>
              </div>
            </div>
          `
        });
        
      } catch (emailError) {
        console.error('Errore invio email reset:', emailError);
      }
    }
    
    res.json({ 
      success: true, 
      message: 'Se l\'email esiste, riceverai le istruzioni per il reset entro pochi minuti' 
    });
    
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Password reset confirmation
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password, userType } = req.body;
    
    if (!token || !password || !userType) {
      return res.status(400).json({ error: 'Token, password e tipo utente richiesti' });
    }
    
    if (password.length < 8) {
      return res.status(400).json({ error: 'La password deve essere di almeno 8 caratteri' });
    }
    
    const now = new Date();
    let user;
    
    if (userType === 'hotel') {
      const [hotel] = await db.select().from(hotels)
        .where(and(
          eq(hotels.sessionToken, token),
          gt(hotels.tokenExpiresAt, now)
        ));
        
      if (!hotel) {
        return res.status(400).json({ error: 'Token non valido o scaduto' });
      }
      
      const hashedPassword = await bcrypt.hash(password, 10);
      
      await db.update(hotels)
        .set({ 
          password: hashedPassword,
          sessionToken: null,
          tokenExpiresAt: null,
          loginAttempts: 0,
          lockedUntil: null
        })
        .where(eq(hotels.id, hotel.id));
        
      user = hotel;
    } else if (userType === 'admin') {
      const [admin] = await db.select().from(adminUsers)
        .where(and(
          eq(adminUsers.sessionToken, token),
          gt(adminUsers.tokenExpiresAt, now)
        ));
        
      if (!admin) {
        return res.status(400).json({ error: 'Token non valido o scaduto' });
      }
      
      const hashedPassword = await bcrypt.hash(password, 10);
      
      await db.update(adminUsers)
        .set({ 
          password: hashedPassword
        })
        .where(eq(adminUsers.id, admin.id));
        
      user = admin;
    }
    
    res.json({ 
      success: true, 
      message: 'Password aggiornata con successo. Ora puoi accedere con la nuova password.' 
    });
    
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

export default router;