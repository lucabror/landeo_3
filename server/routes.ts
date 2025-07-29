import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { createWriteStream, unlinkSync, existsSync, mkdirSync } from "fs";
import { storage } from "./storage";
import authRoutes from "./routes/auth";
import hotelRegistrationRoutes from "./routes/hotel-registration";
import { 
  insertHotelSchema, 
  insertGuestProfileSchema, 
  insertLocalExperienceSchema,
  insertItinerarySchema,
  insertPendingAttractionSchema,
  guestPreferencesSchema,
  guestProfiles
} from "@shared/schema";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { generateItinerary } from "./services/openai";
import { generateQRCode } from "./services/qr";
import { generateItineraryPDF } from "./services/pdf";
import { enrichHotelData, isValidItalianLocation } from "./services/geocoding";
// Attractions service temporaneo rimosso per ricostruzione
import { sendGuestPreferencesEmail, sendCreditPurchaseInstructions, sendItineraryPDF } from "./services/email";
import { generateItinerary } from "./services/openai";
// Preference matcher temporaneamente rimosso per ricostruzione
import { requireAuth } from "./services/security";
import { randomUUID } from "crypto";
import QRCode from "qrcode";
import PDFDocument from "pdfkit";
import { Resend } from "resend";

// Utility per sanitizzazione input
function sanitizeInput(input: string): string {
  if (!input) return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim()
    .substring(0, 10000); // Limita lunghezza per prevenire DoS
}

// Validation per nomi file sicuri
function isValidFilename(filename: string): boolean {
  const invalidChars = /[<>:"/\\|?*\x00-\x1f]/;
  const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i;
  return !invalidChars.test(filename) && 
         !reservedNames.test(filename.split('.')[0]) &&
         filename.length > 0 && 
         filename.length <= 255;
}

// Configurazione multer per upload dei loghi
const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(process.cwd(), 'uploads', 'logos');
    if (!existsSync(uploadsDir)) {
      mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `logo-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const logoUpload = multer({
  storage: logoStorage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB (ridotto da 5MB)
  },
  fileFilter: (req, file, cb) => {
    // Validazione rigorosa del tipo file
    const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png'];
    
    if (!allowedMimes.includes(file.mimetype)) {
      return cb(new Error('Solo file PNG e JPG sono consentiti'));
    }
    
    const fileExtension = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(fileExtension)) {
      return cb(new Error('Estensione file non valida'));
    }
    
    // Controllo dimensione filename per evitare path traversal
    if (file.originalname.includes('..') || file.originalname.includes('/') || file.originalname.includes('\\')) {
      return cb(new Error('Nome file non valido'));
    }
    
    cb(null, true);
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Logo upload endpoint
  app.post("/api/upload/logo", logoUpload.single('logo'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Nessun file caricato" });
      }

      const logoUrl = `/uploads/logos/${req.file.filename}`;
      
      res.json({
        message: "Logo caricato con successo",
        logoUrl: logoUrl,
        filename: req.file.filename
      });
      
    } catch (error) {
      console.error('Logo upload error:', error);
      res.status(500).json({ 
        message: (error as Error).message || "Errore durante il caricamento del logo" 
      });
    }
  });

  // Hotels
  app.get("/api/hotels", async (req, res) => {
    try {
      const hotels = await storage.getHotels();
      res.json(hotels);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch hotels" });
    }
  });

  // Hotel geocoding endpoint
  app.post("/api/hotels/geocode", requireAuth({ userType: 'hotel' }), async (req, res) => {
    try {
      const { name, city, region } = req.body;
      
      if (!name || name.trim() === '') {
        return res.status(400).json({ message: "Nome hotel richiesto" });
      }

      console.log(`Searching for hotel: ${name}`);
      const enrichedData = await enrichHotelData(name, { city, region });
      
      if (!enrichedData) {
        return res.status(404).json({ 
          message: "Hotel non trovato. Verifica il nome e riprova." 
        });
      }

      // Verifica che l'hotel sia in Italia
      if (enrichedData.latitude && enrichedData.longitude && 
          !isValidItalianLocation(enrichedData.latitude, enrichedData.longitude)) {
        return res.status(400).json({ 
          message: "L'hotel deve essere localizzato in Italia" 
        });
      }

      console.log(`Found hotel: ${enrichedData.name} in ${enrichedData.city}, ${enrichedData.region}`);
      res.json(enrichedData);
      
    } catch (error) {
      console.error("Geocoding error:", error);
      res.status(500).json({ 
        message: "Errore nella ricerca dell'hotel. Riprova più tardi." 
      });
    }
  });

  app.get("/api/hotels/:id", requireAuth({ userType: 'hotel' }), async (req, res) => {
    try {
      const hotel = await storage.getHotel(req.params.id);
      if (!hotel) {
        return res.status(404).json({ message: "Hotel not found" });
      }
      
      // Verify user is accessing their own hotel data
      const userId = (req as any).user.id;
      if (hotel.id !== userId) {
        return res.status(403).json({ message: "Hotel Non Trovato" });
      }
      
      res.json(hotel);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch hotel" });
    }
  });

  // Check if hotel configuration is complete
  app.get("/api/hotels/:id/setup-status", requireAuth({ userType: 'hotel' }), async (req, res) => {
    try {
      const hotel = await storage.getHotel(req.params.id);
      if (!hotel) {
        return res.status(404).json({ message: "Hotel not found" });
      }

      // Check if all required fields are filled
      const requiredFields = ['name', 'address', 'city', 'region', 'postalCode', 'phone'];
      const missingFields = requiredFields.filter(field => !hotel[field] || hotel[field].trim() === '');
      
      // Check if services are selected
      if (!hotel.services || !Array.isArray(hotel.services) || hotel.services.length === 0) {
        missingFields.push('services');
      }
      
      const isComplete = missingFields.length === 0;
      
      // Check if local experiences exist (for next phase setup)
      const localExperiences = await storage.getLocalExperiencesByHotel(req.params.id);
      const hasLocalExperiences = localExperiences && localExperiences.length > 0;
      
      res.json({
        isComplete,
        missingFields,
        hasLocalExperiences,
        hotel: {
          name: hotel.name,
          address: hotel.address,
          city: hotel.city,
          region: hotel.region,
          postalCode: hotel.postalCode,
          phone: hotel.phone,
          description: hotel.description,
          website: hotel.website
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to check hotel setup status" });
    }
  });

  app.post("/api/hotels", requireAuth({ userType: 'hotel' }), async (req, res) => {
    try {
      const validatedData = insertHotelSchema.parse(req.body);
      const hotel = await storage.createHotel(validatedData);
      res.status(201).json(hotel);
    } catch (error) {
      res.status(400).json({ message: "Invalid hotel data", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.put("/api/hotels/:id", requireAuth({ userType: 'hotel' }), async (req, res) => {
    try {
      // Verify user is updating their own hotel
      const userId = (req as any).user.id;
      if (req.params.id !== userId) {
        return res.status(403).json({ message: "Hotel Non Trovato" });
      }
      
      // Sanitizza input prima della validazione
      const sanitizedBody = {
        ...req.body,
        name: req.body.name ? sanitizeInput(req.body.name) : undefined,
        address: req.body.address ? sanitizeInput(req.body.address) : undefined,
        city: req.body.city ? sanitizeInput(req.body.city) : undefined,
        region: req.body.region ? sanitizeInput(req.body.region) : undefined,
        phone: req.body.phone ? sanitizeInput(req.body.phone) : undefined,
        email: req.body.email ? req.body.email.trim().toLowerCase() : undefined,
        website: req.body.website ? sanitizeInput(req.body.website) : undefined,
        description: req.body.description ? sanitizeInput(req.body.description) : undefined,
      };

      const validatedData = insertHotelSchema.partial().parse(sanitizedBody);
      const hotel = await storage.updateHotel(req.params.id, validatedData);
      res.json(hotel);
    } catch (error) {
      res.status(400).json({ message: "Invalid hotel data", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Update hotel profile (email/password)
  app.put("/api/hotels/:id/profile", async (req, res) => {
    try {
      const { email, password } = req.body;
      const hotelId = req.params.id;

      const hotel = await storage.getHotel(hotelId);
      if (!hotel) {
        return res.status(404).json({ message: "Hotel not found" });
      }

      // Prepare update data
      const updateData: any = {};
      if (email) {
        updateData.email = email;
      }
      if (password) {
        updateData.password = password;
      }

      const updatedHotel = await storage.updateHotel(hotelId, updateData);
      res.json(updatedHotel);
    } catch (error) {
      console.error("Error updating hotel profile:", error);
      res.status(500).json({ message: "Error updating profile" });
    }
  });

  // Guest Profiles
  app.get("/api/hotels/:hotelId/guest-profiles", requireAuth({ userType: 'hotel' }), async (req, res) => {
    try {
      // Verify user is accessing their own hotel's guest profiles
      const userId = (req as any).user.id;
      if (req.params.hotelId !== userId) {
        return res.status(403).json({ message: "Hotel Non Trovato" });
      }
      
      const profiles = await storage.getGuestProfilesByHotel(req.params.hotelId);
      res.json(profiles);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch guest profiles" });
    }
  });

  app.get("/api/guest-profiles/:id", requireAuth({ userType: 'hotel' }), async (req, res) => {
    try {
      const profile = await storage.getGuestProfile(req.params.id);
      if (!profile) {
        return res.status(404).json({ message: "Guest profile not found" });
      }

      // Verify user can access this guest profile (belongs to their hotel)
      const userId = (req as any).user.id;
      if (profile.hotelId !== userId) {
        return res.status(403).json({ message: "Hotel Non Trovato" });
      }

      res.json(profile);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch guest profile" });
    }
  });

  app.post("/api/guest-profiles", requireAuth({ userType: 'hotel' }), async (req, res) => {
    try {
      // Verify user is creating guest profile for their own hotel
      const userId = (req as any).user.id;
      if (req.body.hotelId !== userId) {
        return res.status(403).json({ message: "Hotel Non Trovato" });
      }
      
      const validatedData = insertGuestProfileSchema.parse(req.body);
      const profile = await storage.createGuestProfile(validatedData);
      
      // Se l'ospite ha un'email, crea token e invia email per preferenze
      if (profile.email) {
        try {
          const hotel = await storage.getHotel(profile.hotelId);
          if (hotel) {
            // Crea token per le preferenze con scadenza 30 giorni
            const token = randomUUID();
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 30);
            
            await storage.createGuestPreferencesToken({
              token,
              guestProfileId: profile.id,
              emailSent: false,
              completed: false,
              expiresAt
            });
            
            // Invia email
            const emailResult = await sendGuestPreferencesEmail(hotel, profile, token);
            
            if (emailResult.success) {
              await storage.updateGuestPreferencesToken(token, { emailSent: true });
              console.log(`Email preferenze inviata a ${profile.email} per ospite ${profile.referenceName}`);
            } else {
              console.warn('Email not sent:', emailResult.error);
            }
          }
        } catch (emailError) {
          console.error('Errore invio email preferenze:', emailError);
          // Non bloccare la creazione del profilo se l'email fallisce
        }
      }
      
      res.status(201).json(profile);
    } catch (error) {
      res.status(400).json({ message: "Invalid guest profile data", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.put("/api/guest-profiles/:id", requireAuth({ userType: 'hotel' }), async (req, res) => {
    try {
      const validatedData = insertGuestProfileSchema.partial().parse(req.body);
      const profile = await storage.updateGuestProfile(req.params.id, validatedData);
      res.json(profile);
    } catch (error) {
      res.status(400).json({ message: "Invalid guest profile data", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.delete("/api/guest-profiles/:id", requireAuth({ userType: 'hotel' }), async (req, res) => {
    try {
      await storage.deleteGuestProfile(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete guest profile" });
    }
  });

  // Resend guest preferences email
  app.post("/api/hotels/:hotelId/guest-profiles/:id/resend-email", requireAuth({ userType: 'hotel' }), async (req, res) => {
    try {
      // Verify user is accessing their own hotel's guest profile
      const userId = (req as any).user.id;
      if (req.params.hotelId !== userId) {
        return res.status(403).json({ message: "Hotel Non Trovato" });
      }

      const profile = await storage.getGuestProfile(req.params.id);
      if (!profile) {
        return res.status(404).json({ message: "Guest profile not found" });
      }

      // Verify the profile belongs to the hotel
      if (profile.hotelId !== req.params.hotelId) {
        return res.status(403).json({ message: "Profile does not belong to this hotel" });
      }

      if (!profile.email) {
        return res.status(400).json({ message: "Guest profile has no email address" });
      }

      const hotel = await storage.getHotel(profile.hotelId);
      if (!hotel) {
        return res.status(404).json({ message: "Hotel not found" });
      }

      try {
        // Create a new token for preferences (in case the old one expired)
        const token = randomUUID();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
        
        await storage.createGuestPreferencesToken({
          token,
          guestProfileId: profile.id,
          emailSent: false,
          completed: false,
          expiresAt
        });
        
        // Send email with new token
        const emailResult = await sendGuestPreferencesEmail(hotel, profile, token);
        
        if (emailResult.success) {
          await storage.updateGuestPreferencesToken(token, { emailSent: true });
          console.log(`Email preferenze re-inviata a ${profile.email} per ospite ${profile.referenceName}`);
          res.json({ message: "Email re-inviata con successo", token });
        } else {
          console.error('Errore reinvio email:', emailResult.error);
          res.status(500).json({ 
            message: "Errore nell'invio dell'email", 
            error: emailResult.error 
          });
        }
      } catch (emailError) {
        console.error('Errore reinvio email preferenze:', emailError);
        res.status(500).json({ 
          message: "Errore nell'invio dell'email", 
          error: emailError instanceof Error ? emailError.message : String(emailError)
        });
      }
    } catch (error) {
      console.error('Error in resend email endpoint:', error);
      res.status(500).json({ message: "Failed to resend email" });
    }
  });

  // Get all itineraries for a hotel
  app.get("/api/hotels/:hotelId/itineraries", requireAuth({ userType: 'hotel' }), async (req, res) => {
    try {
      const { hotelId } = req.params;
      
      // Verify the hotel ID matches the authenticated user's hotel
      if ((req as any).user.type === 'hotel' && (req as any).user.id !== hotelId) {
        return res.status(403).json({ error: 'Non autorizzato per questo hotel' });
      }
      
      const itineraries = await storage.getItinerariesByHotel(hotelId);
      res.json(itineraries);
    } catch (error) {
      console.error('Errore recupero itinerari hotel:', error);
      res.status(500).json({ error: 'Errore interno del server' });
    }
  });

  // Get itineraries for specific guest profile
  app.get("/api/guest-profiles/:id/itinerary", requireAuth({ userType: 'hotel' }), async (req, res) => {
    try {
      // First get guest profile to verify hotel ownership
      const guestProfile = await storage.getGuestProfile(req.params.id);
      if (!guestProfile) {
        return res.status(404).json({ message: "Guest profile not found" });
      }

      // Verify user can access this guest profile (belongs to their hotel)
      const userId = (req as any).user.id;
      if (guestProfile.hotelId !== userId) {
        return res.status(403).json({ message: "Hotel Non Trovato" });
      }

      const itineraries = await storage.getItinerariesByGuestProfile(req.params.id);
      res.json(itineraries);
    } catch (error) {
      console.error('Error fetching guest itineraries:', error);
      res.status(500).json({ message: "Failed to fetch itineraries" });
    }
  });

  // Delete itinerary
  app.delete("/api/itineraries/:id", requireAuth({ userType: 'hotel' }), async (req, res) => {
    try {
      const itinerary = await storage.getItinerary(req.params.id);
      if (!itinerary) {
        return res.status(404).json({ message: "Itinerary not found" });
      }

      // Verify user can delete this itinerary (belongs to their hotel)
      const userId = (req as any).user.id;
      if (itinerary.hotelId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this itinerary" });
      }

      await storage.deleteItinerary(req.params.id);
      
      console.log(`🗑️ Itinerary deleted: ${itinerary.title} (ID: ${req.params.id})`);
      res.json({ message: "Itinerary deleted successfully" });
    } catch (error) {
      console.error('Error deleting itinerary:', error);
      res.status(500).json({ message: "Failed to delete itinerary" });
    }
  });

  // Generate itinerary for specific guest profile
  app.post("/api/guest-profiles/:id/generate-itinerary", requireAuth({ userType: 'hotel' }), async (req, res) => {
    try {
      console.log(`🚀 INIZIO GENERAZIONE ITINERARIO per guest profile ${req.params.id}`);
      
      const guestProfile = await storage.getGuestProfile(req.params.id);
      if (!guestProfile) {
        console.log(`❌ Guest profile ${req.params.id} non trovato`);
        return res.status(404).json({ message: "Guest profile not found" });
      }
      console.log(`✅ Guest profile trovato: ${guestProfile.referenceName}`);
      
      // Verify user is generating itinerary for their own hotel's guest
      const userId = (req as any).user.id;
      if (guestProfile.hotelId !== userId) {
        console.log(`❌ Hotel mismatch: ${guestProfile.hotelId} !== ${userId}`);
        return res.status(403).json({ message: "Hotel Non Trovato" });
      }

      if (!guestProfile.preferencesCompleted) {
        console.log(`❌ Preferenze non completate per ${guestProfile.referenceName}`);
        return res.status(400).json({ message: "Guest preferences must be completed before generating itinerary" });
      }
      console.log(`✅ Preferenze completate per ${guestProfile.referenceName}`);

      const hotel = await storage.getHotel(guestProfile.hotelId);
      if (!hotel) {
        console.log(`❌ Hotel ${guestProfile.hotelId} non trovato`);
        return res.status(404).json({ message: "Hotel not found" });
      }
      console.log(`✅ Hotel trovato: ${hotel.name} (Crediti: ${hotel.credits})`);

      // CHECK CREDITS BEFORE GENERATION
      if (hotel.credits <= 0) {
        console.log(`❌ Crediti insufficienti: ${hotel.credits}`);
        return res.status(402).json({ 
          message: "Credits insufficient", 
          details: "L'hotel non ha crediti sufficienti per generare un itinerario. Acquista crediti per continuare.",
          creditsAvailable: hotel.credits 
        });
      }

      // For AI generation, get only ACTIVE experiences
      const localExperiences = await storage.getLocalExperiencesByHotel(guestProfile.hotelId, true);
      console.log(`✅ Esperienze locali caricate: ${localExperiences.length} attive`);

      if (localExperiences.length === 0) {
        console.log(`❌ Nessuna esperienza locale attiva trovata per hotel ${hotel.name}`);
        return res.status(400).json({ 
          message: "No local experiences found", 
          details: "L'hotel deve avere almeno una esperienza locale attiva per generare itinerari." 
        });
      }

      // Generate new itinerary using AI
      const stayDuration = Math.ceil(
        (new Date(guestProfile.checkOutDate).getTime() - new Date(guestProfile.checkInDate).getTime()) 
        / (1000 * 60 * 60 * 24)
      );
      console.log(`🧠 Chiamata AI per generazione itinerario (${stayDuration} giorni)...`);
      
      const aiItinerary = await generateItinerary(guestProfile, hotel, localExperiences, stayDuration);
      console.log(`✅ AI ha generato itinerario: "${aiItinerary.title}" con ${aiItinerary.days?.length || 0} giorni`);
      
      // CREATE AND SAVE ITINERARY IN DATABASE
      const crypto = require('crypto');
      const uniqueUrl = crypto.randomBytes(16).toString('hex');
      
      const itineraryData = {
        hotelId: guestProfile.hotelId,
        guestProfileId: guestProfile.id,
        title: aiItinerary.title,
        description: aiItinerary.description,
        days: aiItinerary.days,
        status: "active" as const,
        uniqueUrl: uniqueUrl,
        aiPrompt: aiItinerary.prompt,
        aiResponse: aiItinerary
      };
      
      console.log(`💾 Tentativo di salvare itinerario nel database...`);
      const savedItinerary = await storage.createItinerary(itineraryData);
      console.log(`✅ ITINERARIO SALVATO: ${savedItinerary.title} (ID: ${savedItinerary.id}) per ospite ${guestProfile.referenceName}`);
      
      // DEDUCT 1 CREDIT FROM HOTEL AFTER SUCCESSFUL GENERATION
      const updatedCredits = hotel.credits - 1;
      const updatedCreditsUsed = (hotel.creditsUsed || 0) + 1;
      
      console.log(`💳 Aggiornamento crediti hotel...`);
      await storage.updateHotel(hotel.id, { 
        credits: updatedCredits,
        creditsUsed: updatedCreditsUsed
      });

      console.log(`🎯 CREDITO SCALATO: Hotel ${hotel.name} - Crediti rimanenti: ${updatedCredits} (utilizzati: ${updatedCreditsUsed})`);
      
      res.json({
        ...savedItinerary,
        creditInfo: {
          creditsDeducted: 1,
          creditsRemaining: updatedCredits,
          creditsUsed: updatedCreditsUsed
        }
      });
    } catch (error) {
      console.error('❌ ERRORE GENERAZIONE ITINERARIO:', error);
      console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
      res.status(500).json({ message: "Failed to generate itinerary", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Get public itinerary by unique URL
  app.get("/api/itinerary/:uniqueUrl", async (req, res) => {
    try {
      const itinerary = await storage.getItineraryByUniqueUrl(req.params.uniqueUrl);
      if (!itinerary) {
        return res.status(404).json({ message: "Itinerary not found" });
      }

      // Get associated hotel and guest profile info for display
      const hotel = await storage.getHotel(itinerary.hotelId);
      const guestProfile = await storage.getGuestProfile(itinerary.guestProfileId);

      // Check if the stay has ended (QR code should be disabled after checkout)
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today for comparison
      const checkoutDate = guestProfile?.checkOutDate ? new Date(guestProfile.checkOutDate) : null;
      const isExpired = checkoutDate && today > checkoutDate;

      // Check if this is a manager request
      const isManagerRequest = req.headers['x-manager-request'] === 'true' || 
                              req.query.manager === 'true' ||
                              req.headers.referer?.includes('/guest-profiles');

      // If accessing via QR code (no manager params) and stay has expired, return expired message
      if (isExpired && !isManagerRequest) {
        return res.status(410).json({ 
          message: "Itinerary expired",
          details: "Questo itinerario non è più accessibile in quanto il soggiorno è terminato.",
          expiredDate: checkoutDate?.toISOString(),
          hotel: hotel ? {
            name: hotel.name,
            city: hotel.city,
            region: hotel.region,
            logoUrl: hotel.logoUrl
          } : null
        });
      }

      res.json({
        ...itinerary,
        hotel: hotel ? {
          name: hotel.name,
          city: hotel.city,
          region: hotel.region,
          logoUrl: hotel.logoUrl
        } : null,
        guestProfile: guestProfile ? {
          referenceName: guestProfile.referenceName,
          type: guestProfile.type,
          numberOfPeople: guestProfile.numberOfPeople,
          checkInDate: guestProfile.checkInDate,
          checkOutDate: guestProfile.checkOutDate
        } : null,
        isExpired: isExpired
      });
    } catch (error) {
      console.error('Error fetching public itinerary:', error);
      res.status(500).json({ message: "Failed to fetch itinerary" });
    }
  });

  // Update a specific day in an itinerary (Manager only)
  app.patch("/api/itinerary/:uniqueUrl/day/:dayNumber", async (req, res) => {
    try {
      // Check if request comes from manager interface
      const isManagerRequest = req.headers['x-manager-request'] === 'true' || 
                              req.query.manager === 'true' ||
                              req.headers.referer?.includes('/guest-profiles');
      
      if (!isManagerRequest) {
        return res.status(403).json({ message: "Access denied. Manager privileges required." });
      }

      const { uniqueUrl, dayNumber } = req.params;
      const { activities } = req.body;

      const itinerary = await storage.getItineraryByUniqueUrl(uniqueUrl);
      if (!itinerary) {
        return res.status(404).json({ message: "Itinerary not found" });
      }

      // Update the specific day's activities
      const updatedDays = (itinerary.days || []).map((day: any) => {
        if (day.day === parseInt(dayNumber)) {
          return { ...day, activities };
        }
        return day;
      });

      const updatedItinerary = await storage.updateItinerary(itinerary.id, {
        days: updatedDays,
        aiResponse: itinerary.aiResponse as any
      });

      res.json(updatedItinerary);
    } catch (error) {
      console.error('Error updating itinerary day:', error);
      res.status(500).json({ message: "Failed to update itinerary day" });
    }
  });

  // Generate QR Code PDF for itinerary
  app.get("/api/itinerary/:uniqueUrl/qr-pdf", async (req, res) => {
    try {
      const itinerary = await storage.getItineraryByUniqueUrl(req.params.uniqueUrl);
      if (!itinerary) {
        return res.status(404).json({ message: "Itinerary not found" });
      }

      const hotel = await storage.getHotel(itinerary.hotelId);
      const guestProfile = await storage.getGuestProfile(itinerary.guestProfileId);

      // Check if the stay has ended (QR code should not be generated after checkout)
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      const checkoutDate = guestProfile?.checkOutDate ? new Date(guestProfile.checkOutDate) : null;
      const isExpired = checkoutDate && today > checkoutDate;

      if (isExpired) {
        return res.status(410).json({ 
          message: "QR Code expired",
          details: "Il QR Code non è più disponibile in quanto il soggiorno è terminato."
        });
      }

      // Generate PDF with QR code
      const doc = new PDFDocument();
      
      // Set headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="QR-Itinerario-${guestProfile?.referenceName || 'Guest'}.pdf"`);
      
      doc.pipe(res);

      // Header with hotel info
      if (hotel?.logoUrl) {
        // Add logo if available (would need to fetch and add image)
        doc.fontSize(20).text(hotel.name, 50, 50);
      } else {
        doc.fontSize(20).text(hotel?.name || 'Hotel', 50, 50);
      }
      
      doc.fontSize(12).text(`${hotel?.city}, ${hotel?.region}`, 50, 80);
      
      // Title
      doc.fontSize(18).text('QR Code Itinerario', 50, 120);
      
      // Guest info
      doc.fontSize(14).text(`Ospite: ${guestProfile?.referenceName}`, 50, 160);
      doc.text(`Periodo: ${guestProfile?.checkInDate ? new Date(guestProfile.checkInDate).toLocaleDateString('it-IT') : 'N/A'} - ${guestProfile?.checkOutDate ? new Date(guestProfile.checkOutDate).toLocaleDateString('it-IT') : 'N/A'}`, 50, 180);
      doc.text(`Titolo: ${itinerary.title}`, 50, 200);

      // Generate QR code
      const itineraryUrl = `${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'http://localhost:5000'}/itinerary/${itinerary.uniqueUrl}`;
      const qrCodeDataUrl = await QRCode.toDataURL(itineraryUrl, { width: 200 });
      
      // Add QR code to PDF
      const qrCodeBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');
      doc.image(qrCodeBuffer, 50, 240, { width: 200 });
      
      // Instructions
      doc.fontSize(12).text('Scansiona questo QR code per accedere al tuo itinerario personalizzato', 50, 460);
      doc.text(`Oppure visita: ${itineraryUrl}`, 50, 480);
      
      // Footer
      doc.fontSize(10).text('Generato automaticamente dal sistema di gestione itinerari', 50, 520);
      doc.text(`Data di generazione: ${new Date().toLocaleDateString('it-IT')}`, 50, 535);

      doc.end();
    } catch (error) {
      console.error('Error generating QR PDF:', error);
      res.status(500).json({ message: "Failed to generate QR PDF" });
    }
  });

  // Generate full itinerary PDF for download using elegant spa-style PDF service
  app.get("/api/itinerary/:uniqueUrl/download-pdf", async (req, res) => {
    try {
      const itinerary = await storage.getItineraryByUniqueUrl(req.params.uniqueUrl);
      if (!itinerary) {
        return res.status(404).json({ message: "Itinerary not found" });
      }

      const hotel = await storage.getHotel(itinerary.hotelId);
      const guestProfile = await storage.getGuestProfile(itinerary.guestProfileId);
      
      if (!hotel || !guestProfile) {
        return res.status(404).json({ message: "Required data not found" });
      }

      // Use the elegant spa-style PDF service which includes source labels
      const pdfPath = await generateItineraryPDF(itinerary, hotel, guestProfile);
      
      // Set headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Itinerario-${guestProfile.referenceName || 'Guest'}.pdf"`);
      
      // Send the file
      res.sendFile(pdfPath, { root: process.cwd() });
    } catch (error) {
      console.error('Error generating itinerary PDF:', error);
      res.status(500).json({ message: "Failed to generate itinerary PDF" });
    }
  });

  // Generate and send itinerary PDF via email using elegant spa-style PDF service
  app.post("/api/itinerary/:uniqueUrl/email-pdf", async (req, res) => {
    try {
      const { recipientEmail, recipientName } = req.body;
      
      console.log('📧 EMAIL PDF REQUEST:', { recipientEmail, recipientName, uniqueUrl: req.params.uniqueUrl });
      
      // Validate required fields
      if (!recipientEmail || !recipientName) {
        console.log('❌ Missing required fields:', { recipientEmail: !!recipientEmail, recipientName: !!recipientName });
        return res.status(400).json({ message: "Email destinatario e nome sono obbligatori" });
      }
      
      // Check RESEND_API_KEY
      if (!process.env.RESEND_API_KEY) {
        console.log('❌ RESEND_API_KEY non configurata');
        return res.status(500).json({ message: "Servizio email non configurato" });
      }
      
      const itinerary = await storage.getItineraryByUniqueUrl(req.params.uniqueUrl);
      if (!itinerary) {
        console.log('❌ Itinerary non trovato:', req.params.uniqueUrl);
        return res.status(404).json({ message: "Itinerary not found" });
      }
      console.log('✅ Itinerary trovato:', itinerary.title);

      const hotel = await storage.getHotel(itinerary.hotelId);
      const guestProfile = await storage.getGuestProfile(itinerary.guestProfileId);
      
      if (!hotel || !guestProfile) {
        console.log('❌ Dati mancanti:', { hotel: !!hotel, guestProfile: !!guestProfile });
        return res.status(404).json({ message: "Required data not found" });
      }
      console.log('✅ Hotel e guest profile trovati:', { hotel: hotel.name, guest: guestProfile.referenceName });

      // Generate PDF and get buffer directly
      console.log('📄 Generazione PDF in corso...');
      const pdfPath = await generateItineraryPDF(itinerary, hotel, guestProfile);
      console.log('✅ PDF generato:', pdfPath);
      
      // Read PDF file as buffer for email attachment
      console.log('📖 Lettura file PDF...');
      const pdfBuffer = await fs.readFile(pdfPath);
      console.log('✅ PDF letto, dimensione:', pdfBuffer.length, 'bytes');

      // Send PDF via email with correct parameter order
      console.log('📤 Invio email in corso...');
      const emailResult = await sendItineraryPDF(hotel, guestProfile, itinerary, pdfBuffer, recipientEmail, recipientName);
      console.log('📧 Risultato invio email:', emailResult);
      
      if (!emailResult.success) {
        console.log('❌ Invio email fallito:', emailResult.error);
        return res.status(500).json({ message: emailResult.error || "Failed to send email" });
      }
      
      console.log('✅ Email inviata con successo!');
      res.json({ message: "PDF inviato con successo via email" });
    } catch (error) {
      console.error('❌ ERRORE EMAIL PDF:', error);
      res.status(500).json({ 
        message: "Failed to send PDF via email",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Guest profile routes

  app.get("/api/guest-profiles/:hotelId", async (req, res) => {
    try {
      const guestProfiles = await storage.getGuestProfilesByHotel(req.params.hotelId);
      res.json(guestProfiles);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch guest profiles" });
    }
  });

  app.get("/api/guest-profile/:id", requireAuth({ userType: 'hotel' }), async (req, res) => {
    try {
      const guestProfile = await storage.getGuestProfile(req.params.id);
      if (!guestProfile) {
        return res.status(404).json({ message: "Guest profile not found" });
      }

      // Verify user can access this guest profile (belongs to their hotel)
      const userId = (req as any).user.id;
      if (guestProfile.hotelId !== userId) {
        return res.status(403).json({ message: "Hotel Non Trovato" });
      }

      res.json(guestProfile);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch guest profile" });
    }
  });

  app.post("/api/guest-profiles/:id/generate-itinerary", async (req, res) => {
    try {
      const guestProfile = await storage.getGuestProfile(req.params.id);
      if (!guestProfile) {
        return res.status(404).json({ message: "Guest profile not found" });
      }
      
      // Check if guest has completed preferences
      if (!guestProfile.preferencesCompleted) {
        return res.status(400).json({ 
          message: "Guest preferences not completed",
          details: "L'ospite deve completare le preferenze prima di generare l'itinerario"
        });
      }

      const hotel = await storage.getHotel(guestProfile.hotelId);
      if (!hotel) {
        return res.status(404).json({ message: "Hotel not found" });
      }

      // CHECK CREDITS BEFORE GENERATION
      if (hotel.credits <= 0) {
        return res.status(402).json({ 
          message: "Credits insufficient", 
          details: "L'hotel non ha crediti sufficienti per generare un itinerario. Acquista crediti per continuare.",
          creditsAvailable: hotel.credits 
        });
      }

      const experiences = await storage.getLocalExperiencesByHotel(guestProfile.hotelId);
      
      // Generate guest-specific itinerary with preference matching
      const stayDuration = Math.ceil(
        (new Date(guestProfile.checkOutDate).getTime() - new Date(guestProfile.checkInDate).getTime()) 
        / (1000 * 60 * 60 * 24)
      );
      const itineraryData = await generateItinerary(guestProfile, hotel, experiences, stayDuration);
      
      // Create unique URL
      const uniqueUrl = randomUUID();
      
      // Create itinerary
      const newItinerary = {
        hotelId: guestProfile.hotelId,
        guestProfileId: guestProfile.id,
        title: itineraryData.title,
        description: itineraryData.description,
        days: itineraryData.days,
        status: "active" as const,
        uniqueUrl,
        aiPrompt: itineraryData.prompt,
        aiResponse: itineraryData,
      };
      
      const itinerary = await storage.createItinerary(newItinerary);
      
      // Generate QR Code
      const qrCodeUrl = await generateQRCode(uniqueUrl, hotel);
      
      // Update itinerary with QR code URL
      const updatedItinerary = await storage.updateItinerary(itinerary.id, { qrCodeUrl });
      
      // DEDUCT 1 CREDIT FROM HOTEL AFTER SUCCESSFUL GENERATION
      const updatedCredits = hotel.credits - 1;
      const updatedCreditsUsed = (hotel.creditsUsed || 0) + 1;
      
      await storage.updateHotel(hotel.id, { 
        credits: updatedCredits,
        creditsUsed: updatedCreditsUsed
      });

      console.log(`💳 CREDITO SCALATO: Hotel ${hotel.name} - Crediti rimanenti: ${updatedCredits} (utilizzati: ${updatedCreditsUsed})`);
      
      res.status(201).json({
        ...updatedItinerary,
        creditInfo: {
          creditsDeducted: 1,
          creditsRemaining: updatedCredits,
          creditsUsed: updatedCreditsUsed
        }
      });
    } catch (error) {
      console.error("Error generating itinerary:", error);
      res.status(500).json({ message: "Failed to generate itinerary", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.put("/api/guest-profiles/:id", async (req, res) => {
    try {
      const validatedData = insertGuestProfileSchema.omit({ id: true }).parse(req.body);
      const guestProfile = await storage.updateGuestProfile(req.params.id, validatedData);
      res.json(guestProfile);
    } catch (error) {
      res.status(400).json({ message: "Invalid guest profile data" });
    }
  });

  app.delete("/api/guest-profiles/:id", async (req, res) => {
    try {
      await storage.deleteGuestProfile(req.params.id);
      res.json({ message: "Guest profile deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete guest profile" });
    }
  });

  // Guest preferences endpoint
  app.get("/api/guest-preferences/:token", async (req, res) => {
    try {
      console.log(`Looking for guest profile with token: ${req.params.token}`);
      const guestProfile = await storage.getGuestProfileByToken(req.params.token);
      console.log(`Guest profile found:`, guestProfile ? 'YES' : 'NO');
      
      if (!guestProfile) {
        return res.status(404).json({ message: "Guest profile not found" });
      }
      
      // Check if token has expired (24 hours)
      const tokenDate = new Date(guestProfile.tokenGeneratedAt!);
      const now = new Date();
      const hoursDiff = (now.getTime() - tokenDate.getTime()) / (1000 * 60 * 60);
      
      console.log(`Token age: ${hoursDiff} hours`);
      
      if (hoursDiff > 24) {
        return res.status(410).json({ message: "Token expired", details: "Il link è scaduto. Contatta l'hotel per un nuovo link." });
      }
      
      // Structure the response to match frontend expectations
      const responseData = {
        guestProfile: {
          id: guestProfile.id,
          hotelId: guestProfile.hotelId,
          type: guestProfile.type,
          numberOfPeople: guestProfile.numberOfPeople,
          referenceName: guestProfile.referenceName,
          email: guestProfile.email,
          emailLanguage: guestProfile.emailLanguage,
          ages: guestProfile.ages,
          preferences: guestProfile.preferences,
          specialRequests: guestProfile.specialRequests,
          checkInDate: guestProfile.checkInDate,
          checkOutDate: guestProfile.checkOutDate,
          roomNumber: guestProfile.roomNumber,
          preferencesCompleted: guestProfile.preferencesCompleted,
          createdAt: guestProfile.createdAt,
        },
        hotel: guestProfile.hotel
      };
      
      res.json(responseData);
    } catch (error) {
      console.error("Error in guest preferences endpoint:", error);
      res.status(500).json({ message: "Failed to fetch guest profile" });
    }
  });

  app.post("/api/guest-preferences/:token", async (req, res) => {
    try {
      const validatedData = guestPreferencesSchema.parse(req.body);
      
      // Find guest profile by token
      const guestProfile = await storage.getGuestProfileByToken(req.params.token);
      if (!guestProfile) {
        return res.status(404).json({ message: "Guest profile not found" });
      }
      
      // Check if token has expired (24 hours)
      const tokenDate = new Date(guestProfile.tokenGeneratedAt!);
      const now = new Date();
      const hoursDiff = (now.getTime() - tokenDate.getTime()) / (1000 * 60 * 60);
      
      if (hoursDiff > 24) {
        return res.status(410).json({ message: "Token expired", details: "Il link è scaduto. Contatta l'hotel per un nuovo link." });
      }
      
      // Update guest profile with preferences using direct SQL query to include preferencesCompleted
      await db.update(guestProfiles)
        .set({
          preferences: validatedData.preferences, // CRITICAL: Save the main preferences array
          specialRequests: validatedData.specialInterests || validatedData.otherPreferences || "",
          preferencesCompleted: true // This is the key field that was missing
        })
        .where(eq(guestProfiles.id, guestProfile.id));
      
      res.json({ message: "Preferences saved successfully" });
    } catch (error) {
      console.error("Error saving guest preferences:", error);
      res.status(400).json({ 
        message: "Invalid preferences data",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Local experiences routes

  // Get local experiences by hotel - Main endpoint
  app.get("/api/hotels/:hotelId/local-experiences", async (req, res) => {
    try {
      // For management interface, return ALL experiences (active and inactive)
      const experiences = await storage.getLocalExperiencesByHotel(req.params.hotelId, false);
      res.json(experiences);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch local experiences" });
    }
  });

  // Legacy endpoint for compatibility
  app.get("/api/local-experiences/:hotelId", async (req, res) => {
    try {
      // For management interface, return ALL experiences (active and inactive)
      const experiences = await storage.getLocalExperiencesByHotel(req.params.hotelId, false);
      res.json(experiences);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch local experiences" });
    }
  });

  app.post("/api/local-experiences", async (req, res) => {
    try {
      const validatedData = insertLocalExperienceSchema.parse(req.body);
      const experience = await storage.createLocalExperience(validatedData);
      res.status(201).json(experience);
    } catch (error) {
      res.status(400).json({ message: "Invalid local experience data" });
    }
  });

  app.put("/api/local-experiences/:id", async (req, res) => {
    try {
      // For partial updates (like toggle), use partial validation
      const validatedData = insertLocalExperienceSchema.omit({ id: true }).partial().parse(req.body);
      const experience = await storage.updateLocalExperience(req.params.id, validatedData);
      res.json(experience);
    } catch (error) {
      console.error('Local experience update error:', error);
      res.status(400).json({ 
        message: "Invalid local experience data",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.delete("/api/local-experiences/:id", async (req, res) => {
    try {
      await storage.deleteLocalExperience(req.params.id);
      res.json({ message: "Local experience deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete local experience" });
    }
  });

  // Delete all local experiences for a hotel
  app.delete("/api/hotels/:hotelId/local-experiences", async (req, res) => {
    try {
      await storage.deleteAllLocalExperiences(req.params.hotelId);
      res.json({ message: "All local experiences deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete all local experiences" });
    }
  });

  // AI generation for local experiences
  app.post("/api/hotels/:hotelId/local-experiences/generate", async (req, res) => {
    try {
      const hotelId = req.params.hotelId;

      console.log(`🏨 Ricerca hotel con ID: ${hotelId}`);
      const hotel = await storage.getHotel(hotelId);
      if (!hotel) {
        console.error(`❌ Hotel non trovato: ${hotelId}`);
        return res.status(404).json({ error: "Hotel non trovato" });
      }
      
      console.log(`✅ Hotel trovato: ${hotel.name}`);

      if (!hotel.postalCode) {
        console.error(`❌ CAP mancante per hotel: ${hotel.name}`);
        return res.status(400).json({ 
          error: "CAP dell'hotel non configurato. Completa i dati dell'hotel prima di generare le esperienze." 
        });
      }

      console.log(`Generazione esperienze AI per hotel ${hotel.name} (CAP: ${hotel.postalCode})`);
      
      // Importa il servizio generazione attrazioni
      const { generateLocalExperiences } = await import("./services/attractions");
      const experiences = await generateLocalExperiences(hotel);
      
      if (experiences.length === 0) {
        return res.status(400).json({ 
          error: "Nessuna esperienza generata. Verifica la configurazione dell'hotel." 
        });
      }

      // Salva le esperienze nel database
      const savedExperiences = [];
      for (const experience of experiences) {
        const saved = await storage.createLocalExperience(experience);
        savedExperiences.push(saved);
      }

      console.log(`✓ Generate e salvate ${savedExperiences.length} esperienze locali`);
      
      res.json({ 
        success: true, 
        count: savedExperiences.length,
        experiences: savedExperiences 
      });

    } catch (error) {
      console.error("Errore generazione esperienze AI:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Errore nella generazione delle esperienze" 
      });
    }
  });

  // Advanced geolocation analysis endpoint
  app.get("/api/hotels/:hotelId/geolocation/analysis", async (req, res) => {
    try {
      const hotelId = req.params.hotelId;

      console.log(`🌍 Analisi geolocalizzazione per hotel ID: ${hotelId}`);
      const hotel = await storage.getHotel(hotelId);
      if (!hotel) {
        console.error(`❌ Hotel non trovato per analisi: ${hotelId}`);
        return res.status(404).json({ error: "Hotel non trovato" });
      }
      
      console.log(`✅ Hotel trovato per analisi: ${hotel.name}`);

      console.log(`🌍 Analisi geolocalizzazione per hotel ${hotel.name}`);
      
      // Import geolocation service
      const { getRecommendedSearchAreas } = await import("./services/attractions");
      const { GeolocationService } = await import("./services/geolocation");
      
      const searchAreas = await getRecommendedSearchAreas(hotel);
      const locationContext = await GeolocationService.getLocationContext(
        hotel.postalCode!,
        hotel.city,
        hotel.region
      );

      res.json({
        hotel: {
          name: hotel.name,
          postalCode: hotel.postalCode,
          city: hotel.city,
          region: hotel.region,
          currentCoordinates: hotel.latitude && hotel.longitude ? {
            latitude: parseFloat(hotel.latitude),
            longitude: parseFloat(hotel.longitude)
          } : null
        },
        geolocation: {
          ...locationContext,
          searchAreas,
          recommendedRadius: "50km",
          geoStatus: locationContext.coordinates ? "available" : "needs_geocoding"
        },
        suggestions: {
          updateCoordinates: !hotel.latitude || !hotel.longitude,
          enhanceLocalExperiences: true,
          precisionLevel: locationContext.coordinates ? "high" : "postal_code_only"
        }
      });

    } catch (error) {
      console.error("Errore analisi geolocalizzazione:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Errore nell'analisi geolocalizzazione" 
      });
    }
  });

  // Update hotel coordinates endpoint
  app.post("/api/hotels/:hotelId/geolocation/update", async (req, res) => {
    try {
      const hotelId = req.params.hotelId;

      const hotel = await storage.getHotel(hotelId);
      if (!hotel) {
        return res.status(404).json({ error: "Hotel non trovato" });
      }

      console.log(`📍 Aggiornamento coordinate per hotel ${hotel.name}`);
      
      const { GeolocationService } = await import("./services/geolocation");
      
      const coordinates = await GeolocationService.getCoordinatesFromPostalCode(
        hotel.postalCode!,
        hotel.city,
        hotel.region
      );

      if (!coordinates) {
        return res.status(400).json({ 
          error: "Impossibile determinare le coordinate per questo hotel" 
        });
      }

      // Update hotel with new coordinates
      const updatedHotel = await storage.updateHotel(hotelId, {
        latitude: coordinates.latitude.toString(),
        longitude: coordinates.longitude.toString()
      });

      console.log(`✅ Coordinate aggiornate: ${coordinates.latitude}, ${coordinates.longitude}`);

      res.json({
        success: true,
        coordinates,
        hotel: updatedHotel,
        message: "Coordinate aggiornate con successo"
      });

    } catch (error) {
      console.error("Errore aggiornamento coordinate:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Errore nell'aggiornamento coordinate" 
      });
    }
  });

  // Local experience matching with guest preferences
  app.get("/api/hotels/:hotelId/local-experiences/matches/:guestId", async (req, res) => {
    try {
      console.log(`Calculating matches for hotel ${req.params.hotelId}, guest ${req.params.guestId}`);
      
      // For matching, get ALL experiences (both active and inactive)
      const experiences = await storage.getLocalExperiencesByHotel(req.params.hotelId, false);
      console.log(`Found ${experiences.length} experiences for hotel`);
      
      const guestProfile = await storage.getGuestProfile(req.params.guestId);
      console.log(`Guest profile found:`, guestProfile ? 'YES' : 'NO');
      
      if (!guestProfile) {
        return res.status(404).json({ message: "Guest profile not found" });
      }

      console.log(`Guest preferences:`, guestProfile.preferences);

      // Fixed parameter order: guestProfile first, then experiences
      // Matching temporaneamente disabilitato durante ricostruzione
      const matches = { matches: [], coverage: 0 };
      console.log(`Calculated ${matches.length} matches`);
      
      res.json({ matches });
    } catch (error) {
      console.error('Error calculating experience matches:', error);
      res.status(500).json({ message: "Failed to calculate experience matches", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Hotel management routes

  app.get("/api/hotels/:id", async (req, res) => {
    try {
      const hotel = await storage.getHotel(req.params.id);
      if (!hotel) {
        return res.status(404).json({ message: "Hotel not found" });
      }
      res.json(hotel);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch hotel" });
    }
  });

  app.put("/api/hotels/:id", async (req, res) => {
    try {
      const validatedData = insertHotelSchema.omit({ id: true, password: true, mfaSecret: true, mfaEnabled: true, credits: true, creditsUsed: true }).parse(req.body);
      const hotel = await storage.updateHotel(req.params.id, validatedData);
      res.json(hotel);
    } catch (error) {
      console.error('Hotel update error:', error);
      res.status(400).json({ message: "Invalid hotel data" });
    }
  });

  app.get("/api/hotels/:id/setup-status", async (req, res) => {
    try {
      const hotel = await storage.getHotel(req.params.id);
      if (!hotel) {
        return res.status(404).json({ message: "Hotel not found" });
      }

      const requiredFields = ['name', 'address', 'city', 'region', 'postalCode', 'phone'];
      const missingFields = requiredFields.filter(field => !hotel[field]);
      const isSetupComplete = missingFields.length === 0;

      // Check if hotel has generated local experiences
      const experiences = await storage.getLocalExperiencesByHotel(hotel.id);
      const hasGeneratedExperiences = experiences.length > 0;

      res.json({ 
        isSetupComplete,
        missingFields,
        hasGeneratedExperiences,
        setupInProgress: !isSetupComplete || !hasGeneratedExperiences
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to check setup status" });
    }
  });

  app.get("/api/hotels/:id/credits", async (req, res) => {
    try {
      const credits = await storage.getHotelCredits(req.params.id);
      res.json(credits);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch hotel credits" });
    }
  });

  app.post("/api/hotels/:id/purchase-credits", async (req, res) => {
    try {
      console.log('💳 CREDIT PURCHASE REQUEST:', { 
        hotelId: req.params.id, 
        body: req.body 
      });
      
      const { packageType, packagePrice, creditsAmount } = req.body;
      const hotel = await storage.getHotel(req.params.id);
      
      if (!hotel) {
        console.log('❌ Hotel not found:', req.params.id);
        return res.status(404).json({ message: "Hotel not found" });
      }

      console.log('🏨 Hotel found:', hotel.name);

      const purchaseData = {
        hotelId: req.params.id,
        packageType,
        packagePrice,
        creditsAmount,
        status: "pending" as const
      };
      
      console.log('📦 Creating purchase with data:', purchaseData);
      const purchase = await storage.createCreditPurchase(purchaseData);
      console.log('✅ Purchase created:', purchase.id);

      // Send bank transfer instructions via email
      console.log('📧 Sending email instructions...');
      try {
        await sendCreditPurchaseInstructions(
          hotel,
          packageType,
          packagePrice,
          creditsAmount,
          purchase.id
        );
        console.log('✅ Email sent successfully');
      } catch (emailError) {
        console.log('⚠️ Email failed but purchase created:', emailError);
      }

      res.status(201).json(purchase);
    } catch (error) {
      console.error('❌ CREDIT PURCHASE ERROR:', error);
      res.status(500).json({ message: "Failed to create credit purchase" });
    }
  });

  // Confirm bank transfer by hotel
  app.post("/api/hotels/:hotelId/purchases/:purchaseId/confirm-transfer", requireAuth({ userType: 'hotel' }), async (req, res) => {
    try {
      await storage.confirmBankTransfer(req.params.purchaseId);
      res.json({ message: "Bank transfer confirmed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to confirm bank transfer" });
    }
  });

  // Get hotel's credit purchases
  app.get("/api/hotels/:hotelId/purchases", requireAuth({ userType: 'hotel' }), async (req, res) => {
    try {
      const purchases = await storage.getCreditPurchasesByHotel(req.params.hotelId);
      res.json(purchases);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch purchases" });
    }
  });

  // Admin: Get all credit purchases for a specific hotel
  app.get("/api/admin/hotels/:hotelId/purchases", requireAuth({ userType: 'admin' }), async (req, res) => {
    try {
      const purchases = await storage.getAllCreditPurchasesByHotel(req.params.hotelId);
      res.json(purchases);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch hotel credit purchases" });
    }
  });

  // Hotel logo upload
  app.post("/api/hotels/:id/logo", logoUpload.single('logo'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No logo file provided" });
      }

      const logoUrl = `/uploads/logos/${req.file.filename}`;
      const hotel = await storage.updateHotel(req.params.id, { logoUrl });
      
      res.json({ logoUrl });
    } catch (error) {
      res.status(500).json({ message: "Failed to upload logo" });
    }
  });

  app.delete("/api/hotels/:id/logo", async (req, res) => {
    try {
      const hotel = await storage.getHotel(req.params.id);
      if (!hotel) {
        return res.status(404).json({ message: "Hotel not found" });
      }

      // Delete file if it exists
      if (hotel.logoUrl) {
        const filePath = path.join(process.cwd(), 'uploads', 'logos', path.basename(hotel.logoUrl));
        try {
          await fs.unlink(filePath);
        } catch (error) {
          console.log('File already deleted or does not exist');
        }
      }

      // Update hotel record
      const updatedHotel = await storage.updateHotel(req.params.id, { logoUrl: null });
      res.json(updatedHotel);
    } catch (error) {
      res.status(500).json({ message: "Failed to delete logo" });
    }
  });

  // Hotel statistics
  app.get("/api/hotels/:id/stats", async (req, res) => {
    try {
      const stats = await storage.getHotelStats(req.params.id);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch hotel statistics" });
    }
  });

  // Password management
  app.post("/api/hotels/:hotelId/setup-password", async (req, res) => {
    try {
      const { password } = req.body;
      
      if (!password || password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      
      await storage.updateHotelPassword(req.params.hotelId, password);
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error('Update hotel password error:', error);
      res.status(500).json({ message: "Failed to update password" });
    }
  });

  app.post("/api/admin/:adminId/setup-password", async (req, res) => {
    try {
      const { password } = req.body;
      
      if (!password || password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      
      await storage.updateAdministratorPassword(req.params.adminId, password);
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error('Update admin password error:', error);
      res.status(500).json({ message: "Failed to update password" });
    }
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/auth', hotelRegistrationRoutes);

  // Email verification redirect route (browser access)
  app.get('/verify-email/:token', async (req, res) => {
    try {
      // Redirect to frontend with token
      res.redirect(`/verify-email/${req.params.token}`);
    } catch (error) {
      console.error('Verification redirect error:', error);
      res.redirect('/hotel-register?error=verification_failed');
    }
  });

  // Admin Routes

  // Admin authentication
  app.get("/api/admin/auth/:email", async (req, res) => {
    try {
      const admin = await storage.getAdminUser(req.params.email);
      if (!admin) {
        return res.status(404).json({ message: "Admin not found" });
      }
      res.json(admin);
    } catch (error) {
      res.status(500).json({ message: "Authentication failed" });
    }
  });

  // Get all hotels for admin
  app.get("/api/admin/hotels", requireAuth({ userType: 'admin' }), async (req, res) => {
    try {
      const hotels = await storage.getAllHotelsForAdmin();
      res.json(hotels);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch hotels" });
    }
  });

  // Get pending credit purchases
  app.get("/api/admin/pending-purchases", requireAuth({ userType: 'admin' }), async (req, res) => {
    try {
      const purchases = await storage.getPendingCreditPurchases();
      res.json(purchases);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pending purchases" });
    }
  });

  // Approve credit purchase
  app.post("/api/admin/purchases/:purchaseId/approve", requireAuth({ userType: 'admin' }), async (req, res) => {
    try {
      const { adminEmail, notes } = req.body;
      await storage.approveCreditPurchase(req.params.purchaseId, adminEmail, notes);
      res.json({ message: "Purchase approved successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to approve purchase" });
    }
  });

  // Reject credit purchase
  app.post("/api/admin/purchases/:purchaseId/reject", requireAuth({ userType: 'admin' }), async (req, res) => {
    try {
      const { adminEmail, notes } = req.body;
      await storage.rejectCreditPurchase(req.params.purchaseId, adminEmail, notes);
      res.json({ message: "Purchase rejected successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to reject purchase" });
    }
  });

  // Manually adjust hotel credits
  app.post("/api/admin/hotels/:hotelId/adjust-credits", requireAuth({ userType: 'admin' }), async (req, res) => {
    try {
      const { amount, description, adminEmail } = req.body;
      await storage.adjustHotelCredits(req.params.hotelId, amount, description, adminEmail);
      res.json({ message: "Credits adjusted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to adjust credits" });
    }
  });

  // Modify guest profile creation to use credits
  app.post("/api/guest-profiles", requireAuth({ userType: 'hotel' }), async (req, res) => {
    try {
      const validatedData = insertGuestProfileSchema.parse(req.body);
      
      // Check if hotel has enough credits
      const credits = await storage.getHotelCredits(validatedData.hotelId);
      if (credits.credits < 1) {
        return res.status(402).json({ 
          message: "Crediti insufficienti. Acquista più crediti per inserire nuovi ospiti.",
          code: "INSUFFICIENT_CREDITS" 
        });
      }

      // Create guest profile
      const profile = await storage.createGuestProfile(validatedData);
      
      // Send preferences email if requested
      if (validatedData.sendPreferencesEmail && validatedData.email) {
        const hotel = await storage.getHotel(validatedData.hotelId);
        if (hotel) {
          await sendGuestPreferencesEmail(
            validatedData.email,
            validatedData.referenceName,
            hotel.name,
            profile.preferencesToken!
          );
        }
      }

      // Send QR email using the new API if hotel has credits for itinerary generation
      if (credits.credits >= 2) { // Need at least 1 more credit for itinerary generation
        console.log('Guest profile created with sufficient credits for itinerary generation');
      }

      // Log the new guest profile creation
      console.log(
        `👤 NUOVO OSPITE: ${profile.referenceName} creato per hotel ID ${profile.hotelId} (Guest Profile ID: ${profile.id})`
      );

      // Return profile with anonymized guest profile ID for external systems
      const anonymizedProfile = {
        ...profile,
        id: profile.id.slice(0, 8) + '...' // Partial ID for logs/debugging
      };

      console.log(
        `📧 Profilo ospite creato: ${anonymizedProfile.referenceName} (${anonymizedProfile.id})`
      );
      
      // Send confirmation for actual creation including real profile ID
      console.log(
        `✅ PROFILO CREATO: Guest Profile ${profile.referenceName} salvato nel database con ID completo: ${
          profile.id
        }`
      );

      res.status(201).json(profile);
    } catch (error) {
      res.status(400).json({ 
        message: "Invalid guest profile data", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Admin endpoint to delete a hotel completely
  app.delete("/api/admin/hotels/:hotelId", requireAuth({ userType: 'admin' }), async (req, res) => {
    try {
      const { adminEmail } = req.body;
      
      // Verify admin credentials using environment variable
      const expectedAdminEmail = process.env.VITE_ADMIN_EMAIL || process.env.ADMIN_EMAIL;
      if (!expectedAdminEmail || adminEmail !== expectedAdminEmail) {
        return res.status(401).json({ message: "Non autorizzato" });
      }

      const hotelId = req.params.hotelId;
      
      // Check if hotel exists
      const hotel = await storage.getHotel(hotelId);
      if (!hotel) {
        return res.status(404).json({ message: "Hotel non trovato" });
      }

      // Delete the hotel and all related data
      await storage.deleteHotel(hotelId);

      res.json({ 
        message: `Hotel "${hotel.name}" e tutti i dati correlati sono stati eliminati con successo`,
        deletedHotel: hotel.name
      });

    } catch (error) {
      console.error('Error deleting hotel:', error);
      res.status(500).json({ 
        message: "Errore durante l'eliminazione dell'hotel",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

