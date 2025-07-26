import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { 
  insertHotelSchema, 
  insertGuestProfileSchema, 
  insertLocalExperienceSchema,
  insertItinerarySchema,
  insertPendingAttractionSchema,
  guestPreferencesSchema
} from "@shared/schema";
import { generateItinerary } from "./services/openai";
import { generateQRCode } from "./services/qr";
import { generateItineraryPDF } from "./services/pdf";
import { enrichHotelData, isValidItalianLocation } from "./services/geocoding";
import { findLocalAttractions, attractionToLocalExperience } from "./services/attractions";
import { sendGuestPreferencesEmail, sendCreditPurchaseInstructions, sendItineraryPDF } from "./services/email";
import { generateGuestSpecificItinerary } from "./services/itinerary-generator";
import { randomUUID } from "crypto";
import QRCode from "qrcode";
import PDFDocument from "pdfkit";
import { Resend } from "resend";

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
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/jpg') {
      cb(null, true);
    } else {
      cb(new Error('Solo file PNG e JPG sono consentiti'));
    }
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
        message: error.message || "Errore durante il caricamento del logo" 
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
      const validatedData = insertHotelSchema.partial().parse(req.body);
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

      const localExperiences = await storage.getLocalExperiencesByHotel(guestProfile.hotelId);

      // Keep existing itineraries but create new one (for chronological view)
      // No longer delete existing itineraries to maintain history

      // Generate new itinerary using AI
      const itinerary = await generateGuestSpecificItinerary(hotel, guestProfile, localExperiences);
      
      res.json(itinerary);
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
        ...itinerary,
        days: updatedDays
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

      // Generate PDF with full itinerary
      const doc = new PDFDocument();
      
      // Create PDF buffer
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      
      await new Promise<void>((resolve) => {
        doc.on('end', resolve);
        
        // Header
        doc.fontSize(20).text(itinerary.title, 50, 50);
        doc.fontSize(12).text(`${hotel?.name} - ${hotel?.city}, ${hotel?.region}`, 50, 80);
        
        // Guest info
        doc.fontSize(14).text(`Ospite: ${recipientName || guestProfile?.referenceName}`, 50, 120);
        doc.text(`Periodo: ${guestProfile?.checkInDate ? new Date(guestProfile.checkInDate).toLocaleDateString('it-IT') : 'N/A'} - ${guestProfile?.checkOutDate ? new Date(guestProfile.checkOutDate).toLocaleDateString('it-IT') : 'N/A'}`, 50, 140);
        doc.text(`Persone: ${guestProfile?.numberOfPeople}`, 50, 160);

        // Description
        if (itinerary.description) {
          doc.text(`\nDescrizione: ${itinerary.description}`, 50, 190);
        }

        let yPosition = 220;
        
        // Days
        if (itinerary.days && Array.isArray(itinerary.days)) {
          itinerary.days.forEach((day: any) => {
            if (yPosition > 700) {
              doc.addPage();
              yPosition = 50;
            }
            
            doc.fontSize(16).text(`Giorno ${day.day} - ${new Date(day.date).toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, 50, yPosition);
            yPosition += 25;
            
            if (day.activities && Array.isArray(day.activities)) {
              day.activities.forEach((activity: any) => {
                if (yPosition > 700) {
                  doc.addPage();
                  yPosition = 50;
                }
                
                doc.fontSize(12).text(`${activity.time} - ${activity.activity}`, 60, yPosition);
                yPosition += 15;
                
                if (activity.location) {
                  doc.fontSize(10).text(`📍 ${activity.location}`, 70, yPosition);
                  yPosition += 12;
                }
                
                if (activity.description) {
                  doc.fontSize(10).text(activity.description, 70, yPosition);
                  yPosition += 12;
                }
                
                if (activity.duration) {
                  doc.fontSize(9).text(`Durata: ${activity.duration}`, 70, yPosition);
                  yPosition += 10;
                }
                
                if (activity.notes) {
                  doc.fontSize(9).text(`Note: ${activity.notes}`, 70, yPosition);
                  yPosition += 10;
                }
                
                yPosition += 5;
              });
            }
            
            yPosition += 15;
          });
        }

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
        { latitude: hotel.latitude, longitude: hotel.longitude }
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
        message: "Errore nella generazione delle attrazioni: " + error.message 
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

      // Converte l'attrazione pending in local experience
      const localExperience = {
        hotelId: req.params.hotelId,
        name: pendingAttraction.name,
        category: pendingAttraction.category,
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
      
      res.status(201).json(updatedItinerary);
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
      
      // Aggiorna il profilo ospite con le preferenze
      await storage.updateGuestProfile(tokenData.guestProfileId, {
        preferences: allPreferences,
        specialRequests: specialRequests.trim() || undefined,
        preferencesCompleted: true
      });
      
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
