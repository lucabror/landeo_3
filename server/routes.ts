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
  insertPendingAttractionSchema
} from "@shared/schema";
import { generateItinerary } from "./services/openai";
import { generateQRCode } from "./services/qr";
import { generateItineraryPDF } from "./services/pdf";
import { enrichHotelData, isValidItalianLocation } from "./services/geocoding";
import { findLocalAttractions, attractionToLocalExperience } from "./services/attractions";
import { randomUUID } from "crypto";

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
      const experiences = await storage.getLocalExperiencesByHotel(req.params.hotelId);
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

  // Dashboard stats
  app.get("/api/hotels/:hotelId/stats", async (req, res) => {
    try {
      const stats = await storage.getHotelStats(req.params.hotelId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch hotel stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
