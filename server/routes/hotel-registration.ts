import express from "express";
import bcryptjs from "bcryptjs";
import crypto from "crypto";
import { z } from "zod";
import { db } from "../db";
import { users, emailVerifications, hotels } from "@shared/schema";
import { eq } from "drizzle-orm";
import { Resend } from 'resend';

const router = express.Router();
const resend = new Resend(process.env.RESEND_API_KEY);

// Schema per la registrazione hotel
const registerHotelSchema = z.object({
  email: z.string().email("Email non valida").max(254, "Email troppo lunga"),
  password: z.string()
    .min(8, "Minimo 8 caratteri")
    .max(128, "Password troppo lunga")
    .refine(val => /[A-Z]/.test(val), "Almeno una lettera maiuscola")
    .refine(val => /[a-z]/.test(val), "Almeno una lettera minuscola")
    .refine(val => /\d/.test(val), "Almeno un numero")
    .refine(val => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(val), "Almeno un carattere speciale (!@#$%^&*)"),
});

// Schema per la verifica email
const verifyEmailSchema = z.object({
  token: z.string().min(1, "Token richiesto"),
});

// Registrazione hotel - Step 1
router.post("/register-hotel", async (req, res) => {
  try {
    const { email, password } = registerHotelSchema.parse({
      email: req.body.email?.trim().toLowerCase(),
      password: req.body.password
    });

    // Controlla se l'utente esiste già
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Un account con questa email esiste già",
      });
    }

    // Hash della password
    const passwordHash = await bcryptjs.hash(password, 12);

    // Genera token di verifica
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 ore

    // Crea utente (non ancora verificato)
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        passwordHash,
        role: "hotel_manager",
        isEmailVerified: false,
        isActive: false,
      })
      .returning();

    // Salva token di verifica
    await db.insert(emailVerifications).values({
      userId: newUser.id,
      token: verificationToken,
      expiresAt,
    });

    // Invia email di verifica - URL deve puntare al frontend
    const baseUrl = process.env.REPLIT_DOMAINS 
      ? `https://${process.env.REPLIT_DOMAINS}` 
      : 'http://localhost:5000';
    
    const verificationUrl = `${baseUrl}/registration-confirmed/${verificationToken}`;

    try {
      const emailResult = await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: email,
        subject: 'Conferma il tuo account Landeo',
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #92400e, #a16207); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Landeo</h1>
            <p style="color: #fef3c7; margin: 5px 0;">AI per l'Ospitalità Italiana</p>
          </div>
          
          <div style="padding: 30px; background: #fafafa;">
            <h2 style="color: #92400e;">Benvenuto in Landeo!</h2>
            
            <p>Grazie per aver scelto la nostra piattaforma per trasformare l'esperienza dei tuoi ospiti.</p>
            
            <p>Per completare la registrazione e configurare il tuo hotel, clicca sul pulsante qui sotto:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background: linear-gradient(135deg, #92400e, #a16207); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        font-weight: bold;
                        display: inline-block;">
                Conferma Account e Configura Hotel
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              Se il pulsante non funziona, copia e incolla questo link nel tuo browser:<br>
              <a href="${verificationUrl}" style="color: #92400e;">${verificationUrl}</a>
            </p>
            
            <p style="color: #666; font-size: 14px;">
              Questo link è valido per 24 ore. Se non confermi entro questo tempo, dovrai registrarti nuovamente.
            </p>
          </div>
          
          <div style="padding: 20px; text-align: center; background: #f3f4f6; color: #666;">
            <p style="margin: 0; font-size: 12px;">
              © 2025 AiTour. Tutti i diritti riservati.
            </p>
          </div>
        </div>
      `,
      });

      console.log("Email di verifica inviata con successo:", {
        id: emailResult.data?.id,
        to: email,
        from: 'onboarding@resend.dev'
      });

    } catch (emailError) {
      console.error("Errore invio email:", emailError);
      
      // Non bloccare la registrazione se l'email fallisce
      // L'utente può comunque usare il link dai log del server
    }

    res.json({
      success: true,
      message: "Registrazione completata. Controlla la tua email per confermare l'account."
    });

  } catch (error) {
    console.error("Errore registrazione hotel:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Dati non validi",
        errors: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      message: "Errore interno del server",
    });
  }
});

// Verifica email - Step 2
router.post("/verify-email", async (req, res) => {
  try {
    const { token } = verifyEmailSchema.parse(req.body);

    // Trova il token di verifica
    const verification = await db
      .select({
        userId: emailVerifications.userId,
        expiresAt: emailVerifications.expiresAt,
      })
      .from(emailVerifications)
      .where(eq(emailVerifications.token, token))
      .limit(1);

    if (verification.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Token di verifica non valido",
      });
    }

    const { userId, expiresAt } = verification[0];

    // Controlla se il token è scaduto
    if (new Date() > expiresAt) {
      return res.status(400).json({
        success: false,
        message: "Token di verifica scaduto",
      });
    }

    // Ottieni i dati utente
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utente non trovato",
      });
    }

    // Attiva l'utente
    await db
      .update(users)
      .set({
        isEmailVerified: true,
        isActive: true,
        emailVerifiedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // Crea record hotel con la password dell'utente
    
    const [hotelRecord] = await db.insert(hotels).values({
      email: user.email,
      password: user.passwordHash,
      name: `Hotel di ${user.email.split('@')[0]}`,
      address: "",
      city: "",
      region: "",
      postalCode: "",
      phone: "",
      website: "",
      description: "",
      services: [],
      credits: 5,
      creditsUsed: 0,
      totalCredits: 5,
      isActive: true,
    }).returning();
    
    // Hotel record created successfully

    // Rimuovi il token usato
    await db
      .delete(emailVerifications)
      .where(eq(emailVerifications.token, token));

    res.json({
      success: true,
      message: "Email verificata con successo. Ora puoi configurare il tuo hotel.",
    });

  } catch (error) {
    console.error("Errore verifica email:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Token non valido",
      });
    }

    res.status(500).json({
      success: false,
      message: "Errore interno del server",
    });
  }
});

// Debug endpoint rimosso per sicurezza

export default router;