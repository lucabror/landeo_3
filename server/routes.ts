import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
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
import { generateItinerary } from "./services/openai";
import { generateQRCode } from "./services/qr";
import { generateItineraryPDF } from "./services/pdf";
import { enrichHotelData, isValidItalianLocation } from "./services/geocoding";
import { findLocalAttractions, attractionToLocalExperience } from "./services/attractions";
import { sendGuestPreferencesEmail, sendCreditPurchaseInstructions, sendItineraryPDF } from "./services/email";
import { generateGuestSpecificItinerary } from "./services/itinerary-generator";
import { calculateExperienceMatches } from "./services/preference-matcher";
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
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
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
  app.post("/api/hotels/geocode", async (req, res) => {
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

  // Check if hotel configuration is complete
  app.get("/api/hotels/:id/setup-status", async (req, res) => {
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

  app.post("/api/hotels", async (req, res) => {
    try {
      const validatedData = insertHotelSchema.parse(req.body);
      const hotel = await storage.createHotel(validatedData);
      res.status(201).json(hotel);
    } catch (error) {
      res.status(400).json({ message: "Invalid hotel data", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.put("/api/hotels/:id", async (req, res) => {
    try {
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
  app.get("/api/hotels/:hotelId/guest-profiles", async (req, res) => {
    try {
      const profiles = await storage.getGuestProfilesByHotel(req.params.hotelId);
      res.json(profiles);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch guest profiles" });
    }
  });

  app.get("/api/guest-profiles/:id", async (req, res) => {
    try {
      const profile = await storage.getGuestProfile(req.params.id);
      if (!profile) {
        return res.status(404).json({ message: "Guest profile not found" });
      }
      res.json(profile);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch guest profile" });
    }
  });

  app.post("/api/guest-profiles", async (req, res) => {
    try {
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

  app.put("/api/guest-profiles/:id", async (req, res) => {
    try {
      const validatedData = insertGuestProfileSchema.partial().parse(req.body);
      const profile = await storage.updateGuestProfile(req.params.id, validatedData);
      res.json(profile);
    } catch (error) {
      res.status(400).json({ message: "Invalid guest profile data", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.delete("/api/guest-profiles/:id", async (req, res) => {
    try {
      await storage.deleteGuestProfile(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete guest profile" });
    }
  });

  // Get itineraries for specific guest profile
  app.get("/api/guest-profiles/:id/itinerary", async (req, res) => {
    try {
      const itineraries = await storage.getItinerariesByGuestProfile(req.params.id);
      res.json(itineraries);
    } catch (error) {
      console.error('Error fetching guest itineraries:', error);
      res.status(500).json({ message: "Failed to fetch itineraries" });
    }
  });

  // Generate itinerary for specific guest profile
  app.post("/api/guest-profiles/:id/generate-itinerary", async (req, res) => {
    try {
      const guestProfile = await storage.getGuestProfile(req.params.id);
      if (!guestProfile) {
        return res.status(404).json({ message: "Guest profile not found" });
      }

      if (!guestProfile.preferencesCompleted) {
        return res.status(400).json({ message: "Guest preferences must be completed before generating itinerary" });
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

      const localExperiences = await storage.getLocalExperiencesByHotel(guestProfile.hotelId);

      // Keep existing itineraries but create new one (for chronological view)
      // No longer delete existing itineraries to maintain history

      // Generate new itinerary using AI
      const itinerary = await generateGuestSpecificItinerary(hotel, guestProfile, localExperiences);
      
      // DEDUCT 1 CREDIT FROM HOTEL AFTER SUCCESSFUL GENERATION
      const updatedCredits = hotel.credits - 1;
      const updatedCreditsUsed = (hotel.creditsUsed || 0) + 1;
      
      await storage.updateHotel(hotel.id, { 
        credits: updatedCredits,
        creditsUsed: updatedCreditsUsed
      });

      console.log(`🎯 CREDITO SCALATO: Hotel ${hotel.name} - Crediti rimanenti: ${updatedCredits} (utilizzati: ${updatedCreditsUsed})`);
      
      res.json({
        ...itinerary,
        creditInfo: {
          creditsDeducted: 1,
          creditsRemaining: updatedCredits,
          creditsUsed: updatedCreditsUsed
        }
      });
    } catch (error) {
      console.error('Error generating itinerary:', error);
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

  // Generate full itinerary PDF for download
  app.get("/api/itinerary/:uniqueUrl/download-pdf", async (req, res) => {
    try {
      const itinerary = await storage.getItineraryByUniqueUrl(req.params.uniqueUrl);
      if (!itinerary) {
        return res.status(404).json({ message: "Itinerary not found" });
      }

      const hotel = await storage.getHotel(itinerary.hotelId);
      const guestProfile = await storage.getGuestProfile(itinerary.guestProfileId);

      // Generate elegant PDF with full itinerary
      const doc = new PDFDocument({ 
        margin: 40,
        size: 'A4',
        info: {
          Title: itinerary.title,
          Author: hotel?.name || 'Hotel',
          Subject: 'Itinerario Personalizzato',
          Creator: 'Sistema Gestione Itinerari'
        }
      });
      
      // Set headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Itinerario-${itinerary.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf"`);
      
      doc.pipe(res);

      // Color palette - elegant and soft tones
      const colors = {
        primary: '#8B4513',      // Saddle brown
        secondary: '#DAA520',    // Goldenrod
        accent: '#9ACD32',       // Yellow green
        lightGold: '#F5DEB3',    // Wheat
        lightBrown: '#F4A460',   // Sandy brown
        lightGreen: '#E0F2E7',   // Light mint
        darkText: '#2C2C2C',     // Dark gray
        lightText: '#666666',    // Medium gray
        background: '#FAFAFA'    // Off-white
      };

      let yPos = 60;

      // Header section with elegant styling
      doc.rect(0, 0, doc.page.width, 120).fill(colors.primary);
      
      // Hotel name and title
      doc.fillColor('white')
         .fontSize(28)
         .font('Helvetica-Bold')
         .text(hotel?.name || 'Hotel', 60, 30, { width: doc.page.width - 120, align: 'center' });
      
      doc.fontSize(16)
         .font('Helvetica')
         .text(`${hotel?.city || ''}, ${hotel?.region || ''}`, 60, 65, { width: doc.page.width - 120, align: 'center' });
      
      yPos = 150;

      // Itinerary title with decorative border
      doc.rect(40, yPos - 10, doc.page.width - 80, 50)
         .fill(colors.lightGold)
         .stroke(colors.secondary)
         .lineWidth(2);
      
      doc.fillColor(colors.darkText)
         .fontSize(22)
         .font('Helvetica-Bold')
         .text(itinerary.title, 60, yPos + 8, { width: doc.page.width - 120, align: 'center' });
      
      yPos += 80;

      // Guest information in elegant boxes
      const boxHeight = 25;
      const boxSpacing = 5;
      
      // Create guest info boxes
      const guestInfo = [
        { label: 'Ospite', value: guestProfile?.referenceName || 'N/A' },
        { label: 'Persone', value: guestProfile?.numberOfPeople?.toString() || 'N/A' },
        { label: 'Check-in', value: guestProfile?.checkInDate ? new Date(guestProfile.checkInDate).toLocaleDateString('it-IT') : 'N/A' },
        { label: 'Check-out', value: guestProfile?.checkOutDate ? new Date(guestProfile.checkOutDate).toLocaleDateString('it-IT') : 'N/A' }
      ];

      guestInfo.forEach((info, index) => {
        const boxY = yPos + (index * (boxHeight + boxSpacing));
        
        // Alternate colors for visual appeal
        const bgColor = index % 2 === 0 ? colors.lightGreen : colors.lightGold;
        
        doc.rect(40, boxY, doc.page.width - 80, boxHeight)
           .fill(bgColor)
           .stroke(colors.secondary)
           .lineWidth(1);
        
        doc.fillColor(colors.darkText)
           .fontSize(12)
           .font('Helvetica-Bold')
           .text(info.label + ':', 60, boxY + 6);
        
        doc.font('Helvetica')
           .text(info.value, 150, boxY + 6);
      });
      
      yPos += (guestInfo.length * (boxHeight + boxSpacing)) + 30;

      // Description section with elegant styling
      if (itinerary.description) {
        if (yPos > 650) {
          doc.addPage();
          yPos = 60;
        }
        
        doc.rect(40, yPos - 5, doc.page.width - 80, 2)
           .fill(colors.secondary);
        
        doc.fillColor(colors.darkText)
           .fontSize(16)
           .font('Helvetica-Bold')
           .text('Descrizione', 40, yPos + 10);
        
        yPos += 35;
        
        doc.rect(40, yPos - 10, doc.page.width - 80, 60)
           .fill(colors.background)
           .stroke(colors.lightBrown)
           .lineWidth(1);
        
        doc.fillColor(colors.lightText)
           .fontSize(11)
           .font('Helvetica')
           .text(itinerary.description, 55, yPos, { width: doc.page.width - 110, align: 'justify' });
        
        yPos += 70;
      }

      // Days section with enhanced styling
      if (itinerary.days && Array.isArray(itinerary.days)) {
        itinerary.days.forEach((day: any, dayIndex: number) => {
          if (yPos > 600) {
            doc.addPage();
            yPos = 60;
          }
          
          // Day header with gradient-like effect
          doc.rect(40, yPos, doc.page.width - 80, 35)
             .fill(colors.primary);
          
          doc.rect(40, yPos + 35, doc.page.width - 80, 5)
             .fill(colors.secondary);
          
          const dayText = `Giorno ${day.day}`;
          const dateText = new Date(day.date).toLocaleDateString('it-IT', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });
          
          doc.fillColor('white')
             .fontSize(16)
             .font('Helvetica-Bold')
             .text(dayText, 60, yPos + 8);
          
          doc.fontSize(12)
             .font('Helvetica')
             .text(dateText, 60, yPos + 24);
          
          yPos += 50;
          
          // Activities with elegant card design
          if (day.activities && Array.isArray(day.activities)) {
            day.activities.forEach((activity: any, actIndex: number) => {
              const activityHeight = 120; // Estimate height needed
              
              if (yPos + activityHeight > 750) {
                doc.addPage();
                yPos = 60;
              }
              
              // Activity card background
              const cardColor = actIndex % 3 === 0 ? colors.lightGreen : 
                               actIndex % 3 === 1 ? colors.lightGold : colors.background;
              
              doc.rect(60, yPos, doc.page.width - 120, 100)
                 .fill(cardColor)
                 .stroke(colors.lightBrown)
                 .lineWidth(1);
              
              // Time badge
              doc.rect(80, yPos + 10, 60, 20)
                 .fill(colors.secondary)
                 .stroke(colors.primary)
                 .lineWidth(1);
              
              doc.fillColor('white')
                 .fontSize(10)
                 .font('Helvetica-Bold')
                 .text(activity.time || '---', 85, yPos + 16);
              
              // Activity title
              doc.fillColor(colors.darkText)
                 .fontSize(14)
                 .font('Helvetica-Bold')
                 .text(activity.activity || 'Attivita', 160, yPos + 15, { width: doc.page.width - 220 });
              
              let actYPos = yPos + 35;
              
              // Location with icon-like prefix
              if (activity.location) {
                doc.fillColor(colors.primary)
                   .fontSize(10)
                   .font('Helvetica-Bold')
                   .text('LUOGO:', 80, actYPos);
                
                doc.fillColor(colors.lightText)
                   .font('Helvetica')
                   .text(activity.location, 125, actYPos, { width: doc.page.width - 185 });
                
                actYPos += 15;
              }
              
              // Description
              if (activity.description) {
                doc.fillColor(colors.lightText)
                   .fontSize(9)
                   .font('Helvetica')
                   .text(activity.description, 80, actYPos, { width: doc.page.width - 140 });
                
                actYPos += 20;
              }
              
              // Duration and notes in a single line if space allows
              const infoLine = [];
              if (activity.duration) infoLine.push(`Durata: ${activity.duration}`);
              if (activity.notes) infoLine.push(`Note: ${activity.notes}`);
              
              if (infoLine.length > 0) {
                doc.fillColor(colors.secondary)
                   .fontSize(8)
                   .font('Helvetica-Oblique')
                   .text(infoLine.join(' • '), 80, actYPos);
              }
              
              yPos += 110;
            });
          }
          
          yPos += 20; // Space between days
        });
      }

      // Elegant footer
      if (yPos > 700) {
        doc.addPage();
        yPos = 60;
      }
      
      // Footer separator
      doc.rect(40, doc.page.height - 100, doc.page.width - 80, 2)
         .fill(colors.secondary);
      
      doc.fillColor(colors.lightText)
         .fontSize(9)
         .font('Helvetica-Oblique')
         .text('Generato automaticamente dal sistema di gestione itinerari', 
               40, doc.page.height - 80, { width: doc.page.width - 80, align: 'center' });
      
      doc.text(`Data di generazione: ${new Date().toLocaleDateString('it-IT')}`, 
               40, doc.page.height - 65, { width: doc.page.width - 80, align: 'center' });

      doc.end();
    } catch (error) {
      console.error('Error generating itinerary PDF:', error);
      res.status(500).json({ message: "Failed to generate itinerary PDF" });
    }
  });

  // Generate and send itinerary PDF via email
  app.post("/api/itinerary/:uniqueUrl/email-pdf", async (req, res) => {
    try {
      const { recipientEmail, recipientName } = req.body;
      
      const itinerary = await storage.getItineraryByUniqueUrl(req.params.uniqueUrl);
      if (!itinerary) {
        return res.status(404).json({ message: "Itinerary not found" });
      }

      const hotel = await storage.getHotel(itinerary.hotelId);
      const guestProfile = await storage.getGuestProfile(itinerary.guestProfileId);

      // Generate elegant PDF with full itinerary (same design as download endpoint)
      const doc = new PDFDocument({ 
        margin: 40,
        size: 'A4',
        info: {
          Title: itinerary.title,
          Author: hotel?.name || 'Hotel',
          Subject: 'Itinerario Personalizzato',
          Creator: 'Sistema Gestione Itinerari'
        }
      });
      
      // Create PDF buffer
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      
      await new Promise<void>((resolve) => {
        doc.on('end', resolve);
        
        // Color palette - elegant tones matching landing page
        const colors = {
          primary: '#B45309',      // Amber-700 (elegant warm tone)
          secondary: '#92400E',    // Amber-800 (deeper warm tone)  
          accent: '#F3F4F6',       // Stone-100 (very light background)
          lightAccent: '#FAFAF9',  // Stone-50 (almost white)
          textDark: '#1F2937',     // Gray-800 (elegant dark text)
          textLight: '#6B7280',    // Gray-500 (subtle text)
          border: '#E5E7EB',       // Gray-200 (light borders)
          gold: '#FBBF24'          // Amber-400 (soft gold accents)
        };

        let yPos = 60;

        // Elegant header with subtle design
        doc.rect(0, 0, doc.page.width, 100).fill(colors.lightAccent);
        doc.rect(0, 0, doc.page.width, 4).fill(colors.primary);
        
        // Hotel name and title
        doc.fillColor(colors.primary)
           .fontSize(24)
           .font('Helvetica-Bold')
           .text(hotel?.name || 'Hotel', 60, 25, { width: doc.page.width - 120, align: 'center' });
        
        doc.fontSize(12)
           .font('Helvetica')
           .fillColor(colors.textLight)
           .text(`${hotel?.city || ''}, ${hotel?.region || ''}`, 60, 50, { width: doc.page.width - 120, align: 'center' });
        
        yPos = 125;

        // Itinerary title with elegant styling
        doc.rect(40, yPos - 5, doc.page.width - 80, 40)
           .fill(colors.accent)
           .stroke(colors.border)
           .lineWidth(1);
        
        doc.fillColor(colors.textDark)
           .fontSize(18)
           .font('Helvetica-Bold')
           .text(itinerary.title, 60, yPos + 10, { width: doc.page.width - 120, align: 'center' });
        
        // Decorative line under title
        doc.rect(60, yPos + 30, doc.page.width - 120, 2).fill(colors.gold);
        
        yPos += 80;

        // Guest information in elegant boxes
        const boxHeight = 25;
        const boxSpacing = 5;
        
        // Create guest info boxes
        const guestInfo = [
          { label: 'Ospite', value: recipientName || guestProfile?.referenceName || 'N/A' },
          { label: 'Persone', value: guestProfile?.numberOfPeople?.toString() || 'N/A' },
          { label: 'Check-in', value: guestProfile?.checkInDate ? new Date(guestProfile.checkInDate).toLocaleDateString('it-IT') : 'N/A' },
          { label: 'Check-out', value: guestProfile?.checkOutDate ? new Date(guestProfile.checkOutDate).toLocaleDateString('it-IT') : 'N/A' }
        ];

        guestInfo.forEach((info, index) => {
          const boxY = yPos + (index * (boxHeight + boxSpacing));
          
          // Alternate colors for visual appeal
          const bgColor = index % 2 === 0 ? colors.accent : colors.lightAccent;
          
          doc.rect(40, boxY, doc.page.width - 80, boxHeight)
             .fill(bgColor)
             .stroke(colors.border)
             .lineWidth(1);
          
          doc.fillColor(colors.textDark)
             .fontSize(11)
             .font('Helvetica-Bold')
             .text(info.label + ':', 60, boxY + 6);
          
          doc.font('Helvetica')
             .fillColor(colors.textLight)
             .text(info.value, 150, boxY + 6);
        });
        
        yPos += (guestInfo.length * (boxHeight + boxSpacing)) + 30;

        // Description section with elegant styling
        if (itinerary.description) {
          if (yPos > 650) {
            doc.addPage();
            yPos = 60;
          }
          
          doc.rect(40, yPos - 5, doc.page.width - 80, 2)
             .fill(colors.gold);
          
          doc.fillColor(colors.textDark)
             .fontSize(16)
             .font('Helvetica-Bold')
             .text('Descrizione', 40, yPos + 10);
          
          yPos += 35;
          
          doc.rect(40, yPos - 10, doc.page.width - 80, 60)
             .fill(colors.lightAccent)
             .stroke(colors.border)
             .lineWidth(1);
          
          doc.fillColor(colors.textLight)
             .fontSize(11)
             .font('Helvetica')
             .text(itinerary.description, 55, yPos, { width: doc.page.width - 110, align: 'justify' });
          
          yPos += 70;
        }

        // Days section with enhanced styling
        if (itinerary.days && Array.isArray(itinerary.days)) {
          itinerary.days.forEach((day: any, dayIndex: number) => {
            if (yPos > 600) {
              doc.addPage();
              yPos = 60;
            }
            
            // Day header with gradient-like effect
            doc.rect(40, yPos, doc.page.width - 80, 35)
               .fill(colors.primary);
            
            doc.rect(40, yPos + 35, doc.page.width - 80, 3)
               .fill(colors.gold);
            
            const dayText = `Giorno ${day.day}`;
            const dateText = new Date(day.date).toLocaleDateString('it-IT', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            });
            
            doc.fillColor('white')
               .fontSize(16)
               .font('Helvetica-Bold')
               .text(dayText, 60, yPos + 8);
            
            doc.fontSize(12)
               .font('Helvetica')
               .text(dateText, 60, yPos + 24);
            
            yPos += 50;
            
            // Activities with elegant card design
            if (day.activities && Array.isArray(day.activities)) {
              day.activities.forEach((activity: any, actIndex: number) => {
                const activityHeight = 120; // Estimate height needed
                
                if (yPos + activityHeight > 750) {
                  doc.addPage();
                  yPos = 60;
                }
                
                // Activity card background
                const cardColor = actIndex % 3 === 0 ? colors.lightGreen : 
                                 actIndex % 3 === 1 ? colors.lightGold : colors.background;
                
                doc.rect(60, yPos, doc.page.width - 120, 100)
                   .fill(cardColor)
                   .stroke(colors.lightBrown)
                   .lineWidth(1);
                
                // Time badge
                doc.rect(80, yPos + 10, 60, 20)
                   .fill(colors.secondary)
                   .stroke(colors.primary)
                   .lineWidth(1);
                
                doc.fillColor('white')
                   .fontSize(10)
                   .font('Helvetica-Bold')
                   .text(activity.time || '---', 85, yPos + 16);
                
                // Activity title
                doc.fillColor(colors.darkText)
                   .fontSize(14)
                   .font('Helvetica-Bold')
                   .text(activity.activity || 'Attivita', 160, yPos + 15, { width: doc.page.width - 220 });
                
                let actYPos = yPos + 35;
                
                // Location with icon-like prefix
                if (activity.location) {
                  doc.fillColor(colors.primary)
                     .fontSize(10)
                     .font('Helvetica-Bold')
                     .text('LUOGO:', 80, actYPos);
                  
                  doc.fillColor(colors.lightText)
                     .font('Helvetica')
                     .text(activity.location, 125, actYPos, { width: doc.page.width - 185 });
                  
                  actYPos += 15;
                }
                
                // Description
                if (activity.description) {
                  doc.fillColor(colors.lightText)
                     .fontSize(9)
                     .font('Helvetica')
                     .text(activity.description, 80, actYPos, { width: doc.page.width - 140 });
                  
                  actYPos += 20;
                }
                
                // Duration and notes in a single line if space allows
                const infoLine = [];
                if (activity.duration) infoLine.push(`Durata: ${activity.duration}`);
                if (activity.notes) infoLine.push(`Note: ${activity.notes}`);
                
                if (infoLine.length > 0) {
                  doc.fillColor(colors.secondary)
                     .fontSize(8)
                     .font('Helvetica-Oblique')
                     .text(infoLine.join(' • '), 80, actYPos);
                }
                
                yPos += 110;
              });
            }
            
            yPos += 20; // Space between days
          });
        }

        // Elegant footer
        if (yPos > 700) {
          doc.addPage();
          yPos = 60;
        }
        
        // Footer separator
        doc.rect(40, doc.page.height - 100, doc.page.width - 80, 2)
           .fill(colors.secondary);
        
        doc.fillColor(colors.lightText)
           .fontSize(9)
           .font('Helvetica-Oblique')
           .text('Generato automaticamente dal sistema di gestione itinerari', 
                 40, doc.page.height - 80, { width: doc.page.width - 80, align: 'center' });
        
        doc.text(`Data di generazione: ${new Date().toLocaleDateString('it-IT')}`, 
                 40, doc.page.height - 65, { width: doc.page.width - 80, align: 'center' });

        doc.end();
      });

      const pdfBuffer = Buffer.concat(chunks);

      // Send email with PDF attachment using email service
      const emailResult = await sendItineraryPDF(
        hotel!,
        guestProfile,
        itinerary,
        pdfBuffer,
        recipientEmail,
        recipientName || guestProfile?.referenceName || 'Ospite'
      );

      if (emailResult.success) {
        res.json({ 
          success: true, 
          message: "Email inviata con successo",
        });
      } else {
        console.error('Email sending failed:', emailResult.error);
        res.status(500).json({ 
          message: "Errore nell'invio email", 
          error: emailResult.error 
        });
      }
    } catch (error) {
      console.error('Error sending email PDF:', error);
      res.status(500).json({ message: "Failed to send email" });
    }
  });

  // Re-send preferences email
  app.post("/api/hotels/:hotelId/guest-profiles/:profileId/resend-email", async (req, res) => {
    try {
      const profile = await storage.getGuestProfile(req.params.profileId);
      if (!profile) {
        return res.status(404).json({ message: "Guest profile not found" });
      }
      
      const hotel = await storage.getHotel(req.params.hotelId);
      if (!hotel) {
        return res.status(404).json({ message: "Hotel not found" });
      }

      if (!profile.email) {
        return res.status(400).json({ message: "No email address for this guest" });
      }

      // Crea sempre un nuovo token per il re-invio
      const token = randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
      
      try {
        await storage.createGuestPreferencesToken({
          token,
          guestProfileId: profile.id,
          emailSent: false,
          completed: false,
          expiresAt
        });
      } catch (tokenError) {
        console.error('Error creating token:', tokenError);
        return res.status(500).json({ message: "Error creating preferences token" });
      }
      
      // Invia email
      try {
        const emailResult = await sendGuestPreferencesEmail(hotel, profile, token);
        
        if (emailResult.success) {
          await storage.updateGuestPreferencesToken(token, { emailSent: true });
          res.json({ 
            message: "Email re-inviata con successo",
            email: profile.email
          });
        } else {
          const errorMessage = emailResult.error?.includes('Domain not verified') 
            ? "Per inviare email è necessario verificare un dominio in Resend. Contatta l'amministratore del sistema."
            : "Errore nell'invio dell'email: " + emailResult.error;
          
          res.status(500).json({ message: errorMessage });
        }
      } catch (emailError) {
        console.error('Error sending email:', emailError);
        res.status(500).json({ message: "Error sending email: " + (emailError as Error).message });
      }
      
    } catch (error) {
      console.error('Error resending email:', error);
      res.status(500).json({ message: "Failed to resend email: " + (error as Error).message });
    }
  });

  // Generate AI attractions for hotel
  app.post("/api/hotels/:hotelId/generate-attractions", async (req, res) => {
    try {
      const hotel = await storage.getHotel(req.params.hotelId);
      if (!hotel) {
        return res.status(404).json({ message: "Hotel non trovato" });
      }

      console.log(`Generating attractions for hotel: ${hotel.name} in ${hotel.city}, ${hotel.region}`);
      
      const attractionsResult = await findLocalAttractions(
        hotel.city, 
        hotel.region, 
        { latitude: hotel.latitude || '', longitude: hotel.longitude || '' }
      );

      // Salva le attrazioni come "pending" per l'approvazione
      const pendingAttractions = [];
      for (const attraction of attractionsResult.attractions) {
        const pendingAttraction = {
          hotelId: req.params.hotelId,
          name: attraction.name,
          description: attraction.description,
          category: attraction.category,
          location: attraction.location,
          duration: attraction.recommendedDuration,
          priceRange: attraction.priceRange,
          highlights: attraction.highlights,
          attractionType: attraction.type,
          estimatedDistance: attraction.estimatedDistance,
          bestTimeToVisit: attraction.bestTimeToVisit,
          searchArea: attractionsResult.searchArea,
          approved: false,
          rejected: false
        };
        
        const saved = await storage.createPendingAttraction(pendingAttraction);
        pendingAttractions.push(saved);
      }

      res.json({
        message: `Trovate ${attractionsResult.totalFound} attrazioni per ${attractionsResult.searchArea}`,
        searchArea: attractionsResult.searchArea,
        totalFound: attractionsResult.totalFound,
        pendingAttractions: pendingAttractions
      });

    } catch (error) {
      console.error('Error generating attractions:', error);
      res.status(500).json({ 
        message: "Errore nella generazione delle attrazioni: " + (error as Error).message 
      });
    }
  });

  // Get pending attractions for approval
  app.get("/api/hotels/:hotelId/pending-attractions", async (req, res) => {
    try {
      const pendingAttractions = await storage.getPendingAttractions(req.params.hotelId);
      res.json(pendingAttractions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pending attractions" });
    }
  });

  // Approve pending attraction
  app.post("/api/hotels/:hotelId/pending-attractions/:attractionId/approve", async (req, res) => {
    try {
      const pendingAttraction = await storage.getPendingAttraction(req.params.attractionId);
      if (!pendingAttraction) {
        return res.status(404).json({ message: "Attrazione non trovata" });
      }

      // Mappa la categoria dell'attrazione pending a una categoria standardizzata
      function mapToStandardCategory(category: string, attractionType: string, name: string, description: string): string {
        const text = (category + " " + attractionType + " " + name + " " + description).toLowerCase();
        
        // Divertimento
        if (text.includes("parco divertimenti") || text.includes("luna park") || 
            text.includes("videogiochi") || text.includes("giochi")) {
          return "divertimento";
        }
        
        // Gastronomia/Degustazione (priorità alta per ristoranti)
        if (text.includes("restaurant") || text.includes("ristorante") || text.includes("cucina") || 
            text.includes("trattoria") || text.includes("osteria") || text.includes("pizzeria") ||
            text.includes("food") || text.includes("gastronomia") || text.includes("cucina tradizionale")) {
          return "gastronomia";
        }
        
        if (text.includes("vino") || text.includes("cantina") || text.includes("degustazione") || 
            text.includes("enogastronomia") || text.includes("vigneto") || text.includes("chianti") ||
            text.includes("tasting") || text.includes("wine")) {
          return "degustazione";
        }
        
        // Cultura/Storia/Arte
        if (text.includes("museo") || text.includes("galleria") || text.includes("palazzo") || 
            text.includes("monument") || text.includes("chiesa") || text.includes("cattedrale") ||
            text.includes("basilica") || text.includes("archeologico") || text.includes("storico") ||
            text.includes("residenza storica") || text.includes("villa storica") || 
            text.includes("arte") || text.includes("cultural")) {
          
          if (text.includes("storia") || text.includes("storico") || text.includes("archeologico") ||
              text.includes("antico") || text.includes("romano") || text.includes("medievale") ||
              text.includes("residenza storica")) {
            return "storia";
          }
          return "cultura";
        }
        
        // Natura
        if (text.includes("nature") || text.includes("parco") || text.includes("giardino") || 
            text.includes("natura") || text.includes("villa") || text.includes("bosco") || 
            text.includes("lago") || text.includes("montagna") || text.includes("collina") ||
            text.includes("lago naturale") || text.includes("parco naturale")) {
          return "natura";
        }
        
        // Avventura/Sport
        if (text.includes("sport") || text.includes("avventura") || text.includes("outdoor") ||
            text.includes("bicicletta") || text.includes("bike") || text.includes("trekking")) {
          return "avventura";
        }
        
        // Relax
        if (text.includes("spa") || text.includes("terme") || text.includes("relax") || 
            text.includes("benessere") || text.includes("wellness")) {
          return "relax";
        }
        
        // Famiglia
        if (text.includes("famiglia") || text.includes("bambini") || text.includes("kids") || 
            text.includes("family") || text.includes("zoo") || text.includes("acquario")) {
          return "famiglia";
        }
        
        // Shopping
        if (text.includes("shopping") || text.includes("outlet") || text.includes("mercato") || 
            text.includes("negozi") || text.includes("centro commerciale")) {
          return "shopping";
        }
        
        // Default: cultura
        return "cultura";
      }

      // Converte l'attrazione pending in local experience
      const smartCategory = mapToStandardCategory(
        pendingAttraction.category, 
        pendingAttraction.attractionType, 
        pendingAttraction.name, 
        pendingAttraction.description
      );
      

      
      const localExperience = {
        hotelId: req.params.hotelId,
        name: pendingAttraction.name,
        category: smartCategory,
        description: pendingAttraction.description,
        location: pendingAttraction.location,
        distance: pendingAttraction.estimatedDistance,
        duration: pendingAttraction.duration,
        priceRange: pendingAttraction.priceRange,
        contactInfo: {},
        openingHours: '',
        seasonality: '',
        targetAudience: [],
        rating: '',
        imageUrl: '',
        isActive: true,
        aiGenerated: true,
        attractionType: pendingAttraction.attractionType,
        estimatedDistance: pendingAttraction.estimatedDistance,
        bestTimeToVisit: pendingAttraction.bestTimeToVisit,
        highlights: pendingAttraction.highlights
      };

      const savedExperience = await storage.createLocalExperience(localExperience);
      
      // Marca l'attrazione pending come approvata
      await storage.approvePendingAttraction(req.params.attractionId);

      res.json({
        message: "Attrazione approvata e aggiunta alle esperienze locali",
        localExperience: savedExperience
      });

    } catch (error) {
      console.error('Error approving attraction:', error);
      res.status(500).json({ message: "Errore nell'approvazione dell'attrazione" });
    }
  });

  // Reject pending attraction
  app.post("/api/hotels/:hotelId/pending-attractions/:attractionId/reject", async (req, res) => {
    try {
      await storage.rejectPendingAttraction(req.params.attractionId);
      res.json({ message: "Attrazione rifiutata" });
    } catch (error) {
      res.status(500).json({ message: "Errore nel rifiuto dell'attrazione" });
    }
  });

  // Local Experiences
  app.get("/api/hotels/:hotelId/local-experiences", async (req, res) => {
    try {
      // Use getAllLocalExperiencesByHotel to show both active and inactive for management
      const experiences = await storage.getAllLocalExperiencesByHotel(req.params.hotelId);
      res.json(experiences);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch local experiences" });
    }
  });

  // Get local experiences with preference matching for specific guest
  app.get("/api/hotels/:hotelId/local-experiences/matches/:guestId", async (req, res) => {
    try {
      const experiences = await storage.getAllLocalExperiencesByHotel(req.params.hotelId);
      const guestProfile = await storage.getGuestProfile(req.params.guestId);
      
      if (!guestProfile) {
        return res.status(404).json({ message: "Guest profile not found" });
      }
      
      const matches = calculateExperienceMatches(guestProfile, experiences);
      res.json({
        guestProfile: {
          id: guestProfile.id,
          referenceName: guestProfile.referenceName,  
          preferences: guestProfile.preferences || [],
          type: guestProfile.type
        },
        matches
      });
    } catch (error) {
      console.error('Error calculating experience matches:', error);
      res.status(500).json({ message: "Failed to calculate experience matches" });
    }
  });

  app.get("/api/local-experiences/:id", async (req, res) => {
    try {
      const experience = await storage.getLocalExperience(req.params.id);
      if (!experience) {
        return res.status(404).json({ message: "Local experience not found" });
      }
      res.json(experience);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch local experience" });
    }
  });

  app.post("/api/local-experiences", async (req, res) => {
    try {
      const validatedData = insertLocalExperienceSchema.parse(req.body);
      const experience = await storage.createLocalExperience(validatedData);
      res.status(201).json(experience);
    } catch (error) {
      res.status(400).json({ message: "Invalid local experience data", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.put("/api/local-experiences/:id", async (req, res) => {
    try {
      const validatedData = insertLocalExperienceSchema.partial().parse(req.body);
      const experience = await storage.updateLocalExperience(req.params.id, validatedData);
      res.json(experience);
    } catch (error) {
      res.status(400).json({ message: "Invalid local experience data", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.delete("/api/local-experiences/:id", async (req, res) => {
    try {
      await storage.deleteLocalExperience(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete local experience" });
    }
  });

  // Itineraries
  app.get("/api/hotels/:hotelId/itineraries", async (req, res) => {
    try {
      const itineraries = await storage.getItinerariesByHotel(req.params.hotelId);
      res.json(itineraries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch itineraries" });
    }
  });

  app.get("/api/itineraries/:id", async (req, res) => {
    try {
      const itinerary = await storage.getItinerary(req.params.id);
      if (!itinerary) {
        return res.status(404).json({ message: "Itinerary not found" });
      }
      res.json(itinerary);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch itinerary" });
    }
  });

  app.get("/api/itinerary/:uniqueUrl", async (req, res) => {
    try {
      const itinerary = await storage.getItineraryByUrl(req.params.uniqueUrl);
      if (!itinerary) {
        return res.status(404).json({ message: "Itinerary not found" });
      }
      res.json(itinerary);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch itinerary" });
    }
  });

  app.post("/api/itineraries/generate", async (req, res) => {
    try {
      const { guestProfileId, hotelId, days } = req.body;
      
      // Get guest profile and hotel
      const guestProfile = await storage.getGuestProfile(guestProfileId);
      const hotel = await storage.getHotel(hotelId);
      const experiences = await storage.getLocalExperiencesByHotel(hotelId);
      
      if (!guestProfile || !hotel) {
        return res.status(404).json({ message: "Guest profile or hotel not found" });
      }

      // CHECK CREDITS BEFORE GENERATION
      if (hotel.credits <= 0) {
        return res.status(402).json({ 
          message: "Credits insufficient", 
          details: "L'hotel non ha crediti sufficienti per generare un itinerario. Acquista crediti per continuare.",
          creditsAvailable: hotel.credits 
        });
      }

      // Generate AI itinerary
      const aiResponse = await generateItinerary(guestProfile, hotel, experiences, days);
      
      // Create unique URL
      const uniqueUrl = randomUUID();
      
      // Create itinerary
      const itineraryData = {
        hotelId,
        guestProfileId,
        title: aiResponse.title,
        description: aiResponse.description,
        days: aiResponse.days,
        status: "active" as const,
        uniqueUrl,
        aiPrompt: aiResponse.prompt,
        aiResponse: aiResponse,
      };
      
      const itinerary = await storage.createItinerary(itineraryData);
      
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

  app.post("/api/itineraries/:id/pdf", async (req, res) => {
    try {
      const itinerary = await storage.getItinerary(req.params.id);
      const hotel = await storage.getHotel(itinerary?.hotelId || "");
      const guestProfile = await storage.getGuestProfile(itinerary?.guestProfileId || "");
      
      if (!itinerary || !hotel || !guestProfile) {
        return res.status(404).json({ message: "Required data not found" });
      }

      const pdfUrl = await generateItineraryPDF(itinerary, hotel, guestProfile);
      
      // Update itinerary with PDF URL
      const updatedItinerary = await storage.updateItinerary(itinerary.id, { pdfUrl });
      
      res.json({ pdfUrl });
    } catch (error) {
      console.error("Error generating PDF:", error);
      res.status(500).json({ message: "Failed to generate PDF", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.delete("/api/itineraries/:id", async (req, res) => {
    try {
      await storage.deleteItinerary(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete itinerary" });
    }
  });

  // Guest Preferences Routes
  app.get("/api/guest-preferences/:token", async (req, res) => {
    try {
      const tokenData = await storage.getGuestPreferencesToken(req.params.token);
      if (!tokenData) {
        return res.status(404).json({ message: "Token non valido o scaduto" });
      }
      
      if (tokenData.expiresAt < new Date()) {
        return res.status(410).json({ message: "Token scaduto" });
      }
      
      if (tokenData.completed) {
        return res.status(410).json({ message: "Preferenze già completate" });
      }
      
      const guestProfile = await storage.getGuestProfile(tokenData.guestProfileId);
      if (!guestProfile) {
        return res.status(404).json({ message: "Profilo ospite non trovato" });
      }
      
      const hotel = await storage.getHotel(guestProfile.hotelId);
      if (!hotel) {
        return res.status(404).json({ message: "Hotel non trovato" });
      }
      
      res.json({
        guestProfile: {
          referenceName: guestProfile.referenceName,
          checkInDate: guestProfile.checkInDate,
          checkOutDate: guestProfile.checkOutDate,
          numberOfPeople: guestProfile.numberOfPeople,
          type: guestProfile.type
        },
        hotel: {
          name: hotel.name,
          city: hotel.city,
          region: hotel.region
        },
        token: req.params.token
      });
    } catch (error) {
      res.status(500).json({ message: "Errore nel recupero dati" });
    }
  });

  app.post("/api/guest-preferences/:token", async (req, res) => {
    try {
      const tokenData = await storage.getGuestPreferencesToken(req.params.token);
      if (!tokenData) {
        return res.status(404).json({ message: "Token non valido" });
      }
      
      if (tokenData.expiresAt < new Date()) {
        return res.status(410).json({ message: "Token scaduto" });
      }
      
      if (tokenData.completed) {
        return res.status(410).json({ message: "Preferenze già completate" });
      }
      
      const validatedPreferences = guestPreferencesSchema.parse(req.body);
      
      // Componi array delle preferenze complete
      const allPreferences = [
        ...validatedPreferences.preferences,
        ...(validatedPreferences.otherPreferences ? [validatedPreferences.otherPreferences] : []),
        ...(validatedPreferences.specialInterests ? [validatedPreferences.specialInterests] : [])
      ].filter(Boolean);
      
      // Aggiungi restrizioni alimentari e bisogni di mobilità alle richieste speciali
      let specialRequests = "";
      if (validatedPreferences.dietaryRestrictions?.length) {
        specialRequests += `Restrizioni alimentari: ${validatedPreferences.dietaryRestrictions.join(", ")}. `;
      }
      if (validatedPreferences.mobilityNeeds?.length) {
        specialRequests += `Esigenze di mobilità: ${validatedPreferences.mobilityNeeds.join(", ")}. `;
      }
      
      // Aggiorna il profilo ospite con le preferenze usando query diretta
      await storage.db.update(guestProfiles)
        .set({
          preferences: allPreferences,
          specialRequests: specialRequests.trim() || undefined,
          preferencesCompleted: true
        })
        .where(eq(guestProfiles.id, tokenData.guestProfileId));
      
      // Marca il token come completato
      await storage.updateGuestPreferencesToken(req.params.token, { completed: true });
      
      res.json({ message: "Preferenze salvate con successo!" });
    } catch (error) {
      res.status(400).json({ 
        message: "Errore nel salvataggio delle preferenze", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Dashboard stats
  app.get("/api/hotels/:hotelId/stats", async (req, res) => {
    try {
      const stats = await storage.getHotelStats(req.params.hotelId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch hotel stats" });
    }
  });

  // Credit System Routes
  
  // Get hotel credit info
  app.get("/api/hotels/:hotelId/credits", async (req, res) => {
    try {
      const credits = await storage.getHotelCredits(req.params.hotelId);
      res.json(credits);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch credits" });
    }
  });

  // Purchase credits
  app.post("/api/hotels/:hotelId/purchase-credits", async (req, res) => {
    try {
      const { packageType, packagePrice, creditsAmount } = req.body;
      
      // Get hotel information for email
      const hotel = await storage.getHotel(req.params.hotelId);
      if (!hotel) {
        return res.status(404).json({ message: "Hotel not found" });
      }
      
      const purchase = await storage.createCreditPurchase({
        hotelId: req.params.hotelId,
        packageType,
        packagePrice,
        creditsAmount,
        status: "pending",
        bankTransferConfirmed: false
      });

      // Send credit purchase instructions email
      try {
        const emailResult = await sendCreditPurchaseInstructions(
          hotel,
          packageType,
          packagePrice,
          creditsAmount,
          purchase.id
        );

        if (!emailResult.success) {
          console.warn('Failed to send credit purchase email:', emailResult.error);
          // Don't fail the entire request if email fails
        } else {
          console.log('Credit purchase instructions email sent successfully');
        }
      } catch (emailError) {
        console.error('Error sending credit purchase email:', emailError);
        // Don't fail the entire request if email fails
      }

      res.status(201).json(purchase);
    } catch (error) {
      console.error('Error creating credit purchase:', error);
      res.status(500).json({ message: "Failed to create credit purchase" });
    }
  });

  // Get hotel credit purchases
  app.get("/api/hotels/:hotelId/credit-purchases", async (req, res) => {
    try {
      const purchases = await storage.getCreditPurchasesByHotel(req.params.hotelId);
      res.json(purchases);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch credit purchases" });
    }
  });

  // Auth routes
  // Admin profile routes
  app.get("/api/admin/profile/:adminId", async (req, res) => {
    try {
      const admin = await storage.getAdministrator(req.params.adminId);
      if (!admin) {
        return res.status(404).json({ message: "Administrator not found" });
      }
      
      res.json({
        id: admin.id,
        email: admin.email,
        createdAt: admin.createdAt
      });
    } catch (error) {
      console.error('Get admin profile error:', error);
      res.status(500).json({ message: "Failed to get admin profile" });
    }
  });

  app.post("/api/admin/:adminId/update-email", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email || !email.includes('@')) {
        return res.status(400).json({ message: "Valid email required" });
      }
      
      await storage.updateAdministratorEmail(req.params.adminId, email);
      res.json({ message: "Email updated successfully" });
    } catch (error) {
      console.error('Update admin email error:', error);
      res.status(500).json({ message: "Failed to update email" });
    }
  });

  app.post("/api/admin/:adminId/update-password", async (req, res) => {
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
  app.get("/api/admin/hotels", async (req, res) => {
    try {
      const hotels = await storage.getAllHotelsForAdmin();
      res.json(hotels);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch hotels" });
    }
  });

  // Get pending credit purchases
  app.get("/api/admin/pending-purchases", async (req, res) => {
    try {
      const purchases = await storage.getPendingCreditPurchases();
      res.json(purchases);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pending purchases" });
    }
  });

  // Approve credit purchase
  app.post("/api/admin/purchases/:purchaseId/approve", async (req, res) => {
    try {
      const { adminEmail, notes } = req.body;
      await storage.approveCreditPurchase(req.params.purchaseId, adminEmail, notes);
      res.json({ message: "Purchase approved successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to approve purchase" });
    }
  });

  // Reject credit purchase
  app.post("/api/admin/purchases/:purchaseId/reject", async (req, res) => {
    try {
      const { adminEmail, notes } = req.body;
      await storage.rejectCreditPurchase(req.params.purchaseId, adminEmail, notes);
      res.json({ message: "Purchase rejected successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to reject purchase" });
    }
  });

  // Manually adjust hotel credits
  app.post("/api/admin/hotels/:hotelId/adjust-credits", async (req, res) => {
    try {
      const { amount, description, adminEmail } = req.body;
      await storage.adjustHotelCredits(req.params.hotelId, amount, description, adminEmail);
      res.json({ message: "Credits adjusted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to adjust credits" });
    }
  });

  // Modify guest profile creation to use credits
  app.post("/api/guest-profiles", async (req, res) => {
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

      // Use 1 credit
      await storage.useCredits(
        validatedData.hotelId, 
        1, 
        `Inserimento ospite: ${profile.referenceName}`, 
        profile.id
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
  app.delete("/api/admin/hotels/:hotelId", async (req, res) => {
    try {
      const { adminEmail } = req.body;
      
      // Verify admin credentials
      if (adminEmail !== "itinera1prova@gmail.com") {
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
