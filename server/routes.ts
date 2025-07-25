import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertHotelSchema, 
  insertGuestProfileSchema, 
  insertLocalExperienceSchema,
  insertItinerarySchema
} from "@shared/schema";
import { generateItinerary } from "./services/openai";
import { generateQRCode } from "./services/qr";
import { generateItineraryPDF } from "./services/pdf";
import { randomUUID } from "crypto";

export async function registerRoutes(app: Express): Promise<Server> {
  // Hotels
  app.get("/api/hotels", async (req, res) => {
    try {
      const hotels = await storage.getHotels();
      res.json(hotels);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch hotels" });
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
