import { 
  hotels, 
  guestProfiles, 
  localExperiences, 
  itineraries,
  pendingAttractions,
  guestPreferencesTokens,
  type Hotel, 
  type InsertHotel,
  type GuestProfile,
  type InsertGuestProfile,
  type LocalExperience,
  type InsertLocalExperience,
  type Itinerary,
  type InsertItinerary,
  type PendingAttraction,
  type InsertPendingAttraction,
  type GuestPreferencesToken,
  type InsertGuestPreferencesToken
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  // Hotels
  getHotel(id: string): Promise<Hotel | undefined>;
  createHotel(hotel: InsertHotel): Promise<Hotel>;
  updateHotel(id: string, hotel: Partial<InsertHotel>): Promise<Hotel>;
  getHotels(): Promise<Hotel[]>;

  // Guest Profiles
  getGuestProfile(id: string): Promise<GuestProfile | undefined>;
  createGuestProfile(profile: InsertGuestProfile): Promise<GuestProfile>;
  updateGuestProfile(id: string, profile: Partial<InsertGuestProfile>): Promise<GuestProfile>;
  getGuestProfilesByHotel(hotelId: string): Promise<GuestProfile[]>;
  deleteGuestProfile(id: string): Promise<void>;

  // Local Experiences
  getLocalExperience(id: string): Promise<LocalExperience | undefined>;
  createLocalExperience(experience: InsertLocalExperience): Promise<LocalExperience>;
  updateLocalExperience(id: string, experience: Partial<InsertLocalExperience>): Promise<LocalExperience>;
  getLocalExperiencesByHotel(hotelId: string): Promise<LocalExperience[]>; // Only active experiences
  getAllLocalExperiencesByHotel(hotelId: string): Promise<LocalExperience[]>; // All experiences (active + inactive)
  deleteLocalExperience(id: string): Promise<void>;

  // Itineraries
  getItinerary(id: string): Promise<Itinerary | undefined>;
  getItineraryByUrl(uniqueUrl: string): Promise<Itinerary | undefined>;
  createItinerary(itinerary: InsertItinerary): Promise<Itinerary>;
  updateItinerary(id: string, itinerary: Partial<InsertItinerary>): Promise<Itinerary>;
  getItinerariesByHotel(hotelId: string): Promise<Itinerary[]>;
  deleteItinerary(id: string): Promise<void>;

  // Pending Attractions
  getPendingAttraction(id: string): Promise<PendingAttraction | undefined>;
  createPendingAttraction(attraction: InsertPendingAttraction): Promise<PendingAttraction>;
  getPendingAttractions(hotelId: string): Promise<PendingAttraction[]>;
  approvePendingAttraction(id: string): Promise<void>;
  rejectPendingAttraction(id: string): Promise<void>;

  // Guest Preferences Tokens
  createGuestPreferencesToken(token: InsertGuestPreferencesToken): Promise<GuestPreferencesToken>;
  getGuestPreferencesToken(token: string): Promise<GuestPreferencesToken | undefined>;
  updateGuestPreferencesToken(token: string, data: Partial<InsertGuestPreferencesToken>): Promise<GuestPreferencesToken>;

  // Dashboard stats
  getHotelStats(hotelId: string): Promise<{
    activeGuests: number;
    totalItineraries: number;
    localExperiences: number;
    activeQRCodes: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // Hotels
  async getHotel(id: string): Promise<Hotel | undefined> {
    const [hotel] = await db.select().from(hotels).where(eq(hotels.id, id));
    return hotel || undefined;
  }

  async createHotel(insertHotel: InsertHotel): Promise<Hotel> {
    const [hotel] = await db.insert(hotels).values(insertHotel).returning();
    return hotel;
  }

  async updateHotel(id: string, insertHotel: Partial<InsertHotel>): Promise<Hotel> {
    const [hotel] = await db
      .update(hotels)
      .set(insertHotel)
      .where(eq(hotels.id, id))
      .returning();
    return hotel;
  }

  async getHotels(): Promise<Hotel[]> {
    return await db.select().from(hotels).orderBy(desc(hotels.createdAt));
  }

  // Guest Profiles
  async getGuestProfile(id: string): Promise<GuestProfile | undefined> {
    const [profile] = await db.select().from(guestProfiles).where(eq(guestProfiles.id, id));
    return profile || undefined;
  }

  async createGuestProfile(insertProfile: InsertGuestProfile): Promise<GuestProfile> {
    const [profile] = await db.insert(guestProfiles).values(insertProfile).returning();
    return profile;
  }

  async updateGuestProfile(id: string, insertProfile: Partial<InsertGuestProfile>): Promise<GuestProfile> {
    const updateData = { ...insertProfile };
    if (updateData.ages && Array.isArray(updateData.ages)) {
      updateData.ages = updateData.ages as number[];
    }
    const [profile] = await db
      .update(guestProfiles)
      .set(updateData)
      .where(eq(guestProfiles.id, id))
      .returning();
    return profile;
  }

  async getGuestProfilesByHotel(hotelId: string): Promise<GuestProfile[]> {
    return await db
      .select()
      .from(guestProfiles)
      .where(eq(guestProfiles.hotelId, hotelId))
      .orderBy(desc(guestProfiles.createdAt));
  }

  async deleteGuestProfile(id: string): Promise<void> {
    await db.delete(guestProfiles).where(eq(guestProfiles.id, id));
  }

  // Local Experiences
  async getLocalExperience(id: string): Promise<LocalExperience | undefined> {
    const [experience] = await db.select().from(localExperiences).where(eq(localExperiences.id, id));
    return experience || undefined;
  }

  async createLocalExperience(insertExperience: InsertLocalExperience): Promise<LocalExperience> {
    const [experience] = await db.insert(localExperiences).values(insertExperience).returning();
    return experience;
  }

  async updateLocalExperience(id: string, insertExperience: Partial<InsertLocalExperience>): Promise<LocalExperience> {
    const updateData = { ...insertExperience };
    if (updateData.contactInfo && typeof updateData.contactInfo === 'object') {
      updateData.contactInfo = updateData.contactInfo as { phone?: string; email?: string; website?: string; };
    }
    const [experience] = await db
      .update(localExperiences)
      .set(updateData)
      .where(eq(localExperiences.id, id))
      .returning();
    return experience;
  }

  async getLocalExperiencesByHotel(hotelId: string): Promise<LocalExperience[]> {
    // Returns only ACTIVE experiences for AI itinerary generation
    return await db
      .select()
      .from(localExperiences)
      .where(and(eq(localExperiences.hotelId, hotelId), eq(localExperiences.isActive, true)))
      .orderBy(desc(localExperiences.createdAt));
  }

  async getAllLocalExperiencesByHotel(hotelId: string): Promise<LocalExperience[]> {
    // Returns ALL experiences (active + inactive) for management interface
    return await db
      .select()
      .from(localExperiences)
      .where(eq(localExperiences.hotelId, hotelId))
      .orderBy(desc(localExperiences.createdAt));
  }

  async deleteLocalExperience(id: string): Promise<void> {
    await db.delete(localExperiences).where(eq(localExperiences.id, id));
  }

  // Itineraries
  async getItinerary(id: string): Promise<Itinerary | undefined> {
    const [itinerary] = await db.select().from(itineraries).where(eq(itineraries.id, id));
    return itinerary || undefined;
  }

  async getItineraryByUrl(uniqueUrl: string): Promise<Itinerary | undefined> {
    const [itinerary] = await db.select().from(itineraries).where(eq(itineraries.uniqueUrl, uniqueUrl));
    return itinerary || undefined;
  }

  async createItinerary(insertItinerary: InsertItinerary): Promise<Itinerary> {
    const [itinerary] = await db.insert(itineraries).values(insertItinerary).returning();
    return itinerary;
  }

  async updateItinerary(id: string, insertItinerary: Partial<InsertItinerary>): Promise<Itinerary> {
    const updateData = { ...insertItinerary, updatedAt: new Date() };
    if (updateData.days && Array.isArray(updateData.days)) {
      updateData.days = updateData.days as any[];
    }
    const [itinerary] = await db
      .update(itineraries)
      .set(updateData)
      .where(eq(itineraries.id, id))
      .returning();
    return itinerary;
  }

  async getItinerariesByHotel(hotelId: string): Promise<Itinerary[]> {
    return await db
      .select()
      .from(itineraries)
      .where(eq(itineraries.hotelId, hotelId))
      .orderBy(desc(itineraries.createdAt));
  }

  async deleteItinerary(id: string): Promise<void> {
    await db.delete(itineraries).where(eq(itineraries.id, id));
  }

  // Dashboard stats
  async getHotelStats(hotelId: string): Promise<{
    activeGuests: number;
    totalItineraries: number;
    localExperiences: number;
    activeQRCodes: number;
  }> {
    const now = new Date();
    
    // Active guests (checked in and not yet checked out)
    const activeGuestsResult = await db
      .select()
      .from(guestProfiles)
      .where(
        and(
          eq(guestProfiles.hotelId, hotelId),
          sql`${guestProfiles.checkInDate} <= ${now}`,
          sql`${guestProfiles.checkOutDate} >= ${now}`
        )
      );

    const totalItinerariesResult = await db
      .select()
      .from(itineraries)
      .where(eq(itineraries.hotelId, hotelId));

    const localExperiencesResult = await db
      .select()
      .from(localExperiences)
      .where(and(eq(localExperiences.hotelId, hotelId), eq(localExperiences.isActive, true)));

    const activeQRCodesResult = await db
      .select()
      .from(itineraries)
      .where(
        and(
          eq(itineraries.hotelId, hotelId),
          eq(itineraries.status, "active"),
          sql`${itineraries.qrCodeUrl} IS NOT NULL`
        )
      );

    return {
      activeGuests: activeGuestsResult.length,
      totalItineraries: totalItinerariesResult.length,
      localExperiences: localExperiencesResult.length,
      activeQRCodes: activeQRCodesResult.length,
    };
  }

  // Pending Attractions methods
  async getPendingAttraction(id: string): Promise<PendingAttraction | undefined> {
    const [result] = await db.select().from(pendingAttractions).where(eq(pendingAttractions.id, id));
    return result;
  }

  async createPendingAttraction(attraction: InsertPendingAttraction): Promise<PendingAttraction> {
    const [result] = await db.insert(pendingAttractions).values(attraction).returning();
    return result;
  }

  async getPendingAttractions(hotelId: string): Promise<PendingAttraction[]> {
    return await db.select()
      .from(pendingAttractions)
      .where(and(
        eq(pendingAttractions.hotelId, hotelId),
        eq(pendingAttractions.approved, false),
        eq(pendingAttractions.rejected, false)
      ))
      .orderBy(pendingAttractions.createdAt);
  }

  async approvePendingAttraction(id: string): Promise<void> {
    await db.update(pendingAttractions)
      .set({ 
        approved: true, 
        processedAt: new Date() 
      })
      .where(eq(pendingAttractions.id, id));
  }

  async rejectPendingAttraction(id: string): Promise<void> {
    await db.update(pendingAttractions)
      .set({ 
        rejected: true, 
        processedAt: new Date() 
      })
      .where(eq(pendingAttractions.id, id));
  }

  // Guest Preferences Tokens
  async createGuestPreferencesToken(insertToken: InsertGuestPreferencesToken): Promise<GuestPreferencesToken> {
    const [token] = await db.insert(guestPreferencesTokens).values(insertToken).returning();
    return token;
  }

  async getGuestPreferencesToken(token: string): Promise<GuestPreferencesToken | undefined> {
    const [result] = await db.select().from(guestPreferencesTokens).where(eq(guestPreferencesTokens.token, token));
    return result || undefined;
  }

  async updateGuestPreferencesToken(token: string, insertToken: Partial<InsertGuestPreferencesToken>): Promise<GuestPreferencesToken> {
    const [result] = await db
      .update(guestPreferencesTokens)
      .set(insertToken)
      .where(eq(guestPreferencesTokens.token, token))
      .returning();
    return result;
  }
}

export const storage = new DatabaseStorage();
