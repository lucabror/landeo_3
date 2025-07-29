import { 
  hotels, 
  guestProfiles, 
  localExperiences, 
  itineraries,
  pendingAttractions,
  guestPreferencesTokens,
  creditPurchases,
  adminUsers,
  creditTransactions,
  securitySessions,
  securityLogs,
  users,
  emailVerifications,
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
  type InsertGuestPreferencesToken,
  type CreditPurchase,
  type InsertCreditPurchase,
  type AdminUser,
  type InsertAdminUser,
  type CreditTransaction,
  type InsertCreditTransaction
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  // Hotels
  getHotel(id: string): Promise<Hotel | undefined>;
  createHotel(hotel: InsertHotel): Promise<Hotel>;
  updateHotel(id: string, hotel: Partial<InsertHotel>): Promise<Hotel>;
  getHotels(): Promise<Hotel[]>;
  deleteHotel(id: string): Promise<void>;

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
  getItineraryByUniqueUrl(uniqueUrl: string): Promise<Itinerary | undefined>;
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
  getGuestPreferencesTokenByProfileId(guestProfileId: string): Promise<GuestPreferencesToken | undefined>;
  updateGuestPreferencesToken(token: string, data: Partial<InsertGuestPreferencesToken>): Promise<GuestPreferencesToken>;

  // Dashboard stats
  getHotelStats(hotelId: string): Promise<{
    activeGuests: number;
    totalItineraries: number;
    localExperiences: number;
    activeQRCodes: number;
  }>;

  // Credit system methods
  createCreditPurchase(purchase: InsertCreditPurchase): Promise<CreditPurchase>;
  getCreditPurchasesByHotel(hotelId: string): Promise<CreditPurchase[]>;
  getPendingCreditPurchases(): Promise<(CreditPurchase & { hotel: Hotel })[]>;
  approveCreditPurchase(purchaseId: string, adminEmail: string, notes?: string): Promise<void>;
  rejectCreditPurchase(purchaseId: string, adminEmail: string, notes?: string): Promise<void>;
  adjustHotelCredits(hotelId: string, amount: number, description: string, adminEmail: string): Promise<void>;
  useCredits(hotelId: string, amount: number, description: string, guestProfileId?: string): Promise<boolean>;
  getHotelCredits(hotelId: string): Promise<{ credits: number; totalCredits: number; creditsUsed: number }>;
  getCreditTransactions(hotelId: string): Promise<CreditTransaction[]>;

  // Admin methods
  getAdminUser(email: string): Promise<AdminUser | undefined>;
  getAdministrator(id: string): Promise<AdminUser | undefined>;
  createAdminUser(admin: InsertAdminUser): Promise<AdminUser>;
  updateAdministratorEmail(id: string, email: string): Promise<void>;
  updateAdministratorPassword(id: string, password: string): Promise<void>;
  getAllHotelsForAdmin(): Promise<(Hotel & { pendingPurchases: number })[]>;
}

export class DatabaseStorage implements IStorage {
  // Hotels
  async getHotel(id: string): Promise<Hotel | undefined> {
    const [hotel] = await db.select().from(hotels).where(eq(hotels.id, id));
    return hotel || undefined;
  }

  async createHotel(insertHotel: InsertHotel): Promise<Hotel> {
    const [hotel] = await db.insert(hotels).values([insertHotel]).returning();
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

  async deleteHotel(id: string): Promise<void> {
    // First get the hotel to find the associated email
    const [hotel] = await db.select().from(hotels).where(eq(hotels.id, id));
    if (!hotel) {
      throw new Error("Hotel not found");
    }

    // Delete all related data in cascade order
    // 1. Delete all itineraries for this hotel
    await db.delete(itineraries).where(eq(itineraries.hotelId, id));
    
    // 2. Delete all local experiences for this hotel
    await db.delete(localExperiences).where(eq(localExperiences.hotelId, id));
    
    // 3. Delete all pending attractions for this hotel
    await db.delete(pendingAttractions).where(eq(pendingAttractions.hotelId, id));
    
    // 4. Get all guest profiles for this hotel and delete their tokens
    const hotelGuestProfiles = await db
      .select({ id: guestProfiles.id })
      .from(guestProfiles)
      .where(eq(guestProfiles.hotelId, id));
    
    // Delete guest preferences tokens for all guest profiles
    if (hotelGuestProfiles.length > 0) {
      const guestProfileIds = hotelGuestProfiles.map(p => p.id);
      for (const guestProfileId of guestProfileIds) {
        await db.delete(guestPreferencesTokens).where(eq(guestPreferencesTokens.guestProfileId, guestProfileId));
      }
    }
    
    // 5. Delete all guest profiles for this hotel
    await db.delete(guestProfiles).where(eq(guestProfiles.hotelId, id));
    
    // 6. Delete security sessions for the hotel manager (by hotel ID)
    await db.delete(securitySessions).where(eq(securitySessions.userId, id));
    
    // 7. Delete security logs for the hotel manager (by hotel ID)
    await db.delete(securityLogs).where(eq(securityLogs.userId, id));
    
    // 8. Delete email verifications and user account associated with this hotel
    // Find the user with the same email as the hotel
    const userWithEmail = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.email, hotel.email))
      .limit(1);
    
    if (userWithEmail.length > 0) {
      const userId = userWithEmail[0].id;
      console.log(`Deleting user account ${userId} (${userWithEmail[0].email}) associated with hotel ${hotel.name}`);
      
      // Delete all email verifications for this user
      await db.delete(emailVerifications).where(eq(emailVerifications.userId, userId));
      
      // Password reset tokens handling removed as table doesn't exist
      
      // Delete the hotel manager account from users table
      await db.delete(users).where(eq(users.id, userId));
      console.log(`Successfully deleted user account ${userId} for hotel ${hotel.name}`);
    } else {
      console.log(`No user account found with email ${hotel.email} for hotel ${hotel.name}`);
    }
    
    // 9. First get all credit purchases for this hotel
    const hotelCreditPurchases = await db
      .select({ id: creditPurchases.id })
      .from(creditPurchases)
      .where(eq(creditPurchases.hotelId, id));
    
    // 10. Delete credit transactions that reference these purchases
    if (hotelCreditPurchases.length > 0) {
      const purchaseIds = hotelCreditPurchases.map(p => p.id);
      for (const purchaseId of purchaseIds) {
        await db.delete(creditTransactions).where(eq(creditTransactions.relatedPurchaseId, purchaseId));
      }
    }
    
    // 11. Delete remaining credit transactions for this hotel
    await db.delete(creditTransactions).where(eq(creditTransactions.hotelId, id));
    
    // 12. Delete all credit purchases for this hotel (after all transactions are deleted)
    await db.delete(creditPurchases).where(eq(creditPurchases.hotelId, id));
    
    // 13. Finally delete the hotel itself
    await db.delete(hotels).where(eq(hotels.id, id));
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

  async getGuestProfileByToken(token: string): Promise<GuestProfile | undefined> {
    try {
      console.log(`Storage: Looking for token ${token}`);
      // Look in the guestPreferencesTokens table and join with guestProfiles and hotels
      const result = await db
        .select({
          id: guestProfiles.id,
          hotelId: guestProfiles.hotelId,
          type: guestProfiles.type,
          numberOfPeople: guestProfiles.numberOfPeople,
          referenceName: guestProfiles.referenceName,
          email: guestProfiles.email,
          emailLanguage: guestProfiles.emailLanguage,
          ages: guestProfiles.ages,
          preferences: guestProfiles.preferences,
          specialRequests: guestProfiles.specialRequests,
          checkInDate: guestProfiles.checkInDate,
          checkOutDate: guestProfiles.checkOutDate,
          roomNumber: guestProfiles.roomNumber,
          preferencesCompleted: guestProfiles.preferencesCompleted,
          createdAt: guestProfiles.createdAt,
          tokenGeneratedAt: guestPreferencesTokens.createdAt,
          hotel: {
            id: hotels.id,
            name: hotels.name,
            city: hotels.city,
            region: hotels.region,
            address: hotels.address,
            logoUrl: hotels.logoUrl,
          }
        })
        .from(guestPreferencesTokens)
        .innerJoin(guestProfiles, eq(guestPreferencesTokens.guestProfileId, guestProfiles.id))
        .innerJoin(hotels, eq(guestProfiles.hotelId, hotels.id))
        .where(eq(guestPreferencesTokens.token, token))
        .limit(1);
      
      console.log(`Storage: Profile found:`, result.length > 0 ? 'YES' : 'NO');
      return result[0] || undefined;
    } catch (error) {
      console.error('Storage error in getGuestProfileByToken:', error);
      throw error;
    }
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

  async deleteAllLocalExperiences(hotelId: string): Promise<void> {
    await db.delete(localExperiences).where(eq(localExperiences.hotelId, hotelId));
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

  async getItineraryByUniqueUrl(uniqueUrl: string): Promise<Itinerary | undefined> {
    return this.getItineraryByUrl(uniqueUrl);
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

  async getItinerariesByGuestProfile(guestProfileId: string): Promise<Itinerary[]> {
    return await db
      .select()
      .from(itineraries)
      .where(eq(itineraries.guestProfileId, guestProfileId))
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

  async getGuestPreferencesTokenByProfileId(guestProfileId: string): Promise<GuestPreferencesToken | undefined> {
    const [result] = await db.select().from(guestPreferencesTokens)
      .where(eq(guestPreferencesTokens.guestProfileId, guestProfileId))
      .orderBy(desc(guestPreferencesTokens.createdAt))
      .limit(1);
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

  // Credit system implementation
  async createCreditPurchase(purchase: InsertCreditPurchase): Promise<CreditPurchase> {
    const [result] = await db.insert(creditPurchases).values(purchase).returning();
    return result;
  }

  async getCreditPurchasesByHotel(hotelId: string): Promise<CreditPurchase[]> {
    return await db.select()
      .from(creditPurchases)
      .where(eq(creditPurchases.hotelId, hotelId))
      .orderBy(desc(creditPurchases.createdAt));
  }

  async getPendingCreditPurchases(): Promise<(CreditPurchase & { hotel: Hotel })[]> {
    const results = await db.select({
      id: creditPurchases.id,
      hotelId: creditPurchases.hotelId,
      packageType: creditPurchases.packageType,
      packagePrice: creditPurchases.packagePrice,
      creditsAmount: creditPurchases.creditsAmount,
      status: creditPurchases.status,
      bankTransferConfirmed: creditPurchases.bankTransferConfirmed,
      processedAt: creditPurchases.processedAt,
      processedBy: creditPurchases.processedBy,
      notes: creditPurchases.notes,
      createdAt: creditPurchases.createdAt,
      hotel: hotels
    })
    .from(creditPurchases)
    .innerJoin(hotels, eq(creditPurchases.hotelId, hotels.id))
    .where(eq(creditPurchases.status, "pending"))
    .orderBy(desc(creditPurchases.createdAt));
    
    return results.map(result => ({
      ...result,
      hotel: result.hotel
    }));
  }

  async confirmBankTransfer(purchaseId: string): Promise<void> {
    await db.update(creditPurchases)
      .set({ bankTransferConfirmed: true })
      .where(eq(creditPurchases.id, purchaseId));
  }

  async approveCreditPurchase(purchaseId: string, adminEmail: string, notes?: string): Promise<void> {
    const purchase = await db.select().from(creditPurchases).where(eq(creditPurchases.id, purchaseId)).limit(1);
    if (!purchase[0]) throw new Error("Purchase not found");
    
    await db.update(creditPurchases)
      .set({
        status: "approved",
        processedAt: new Date(),
        processedBy: adminEmail,
        notes: notes || ""
      })
      .where(eq(creditPurchases.id, purchaseId));

    await db.update(hotels)
      .set({
        credits: sql`${hotels.credits} + ${purchase[0].creditsAmount}`,
        totalCredits: sql`${hotels.totalCredits} + ${purchase[0].creditsAmount}`
      })
      .where(eq(hotels.id, purchase[0].hotelId));

    await db.insert(creditTransactions).values({
      hotelId: purchase[0].hotelId,
      type: "purchase",
      amount: purchase[0].creditsAmount,
      description: `Acquisto pacchetto ${purchase[0].packageType} - ${purchase[0].creditsAmount} crediti`,
      relatedPurchaseId: purchaseId,
      processedBy: adminEmail
    });
  }

  async rejectCreditPurchase(purchaseId: string, adminEmail: string, notes?: string): Promise<void> {
    await db.update(creditPurchases)
      .set({
        status: "rejected",
        processedAt: new Date(),
        processedBy: adminEmail,
        notes: notes || ""
      })
      .where(eq(creditPurchases.id, purchaseId));
  }

  async adjustHotelCredits(hotelId: string, amount: number, description: string, adminEmail: string): Promise<void> {
    await db.update(hotels)
      .set({
        credits: sql`${hotels.credits} + ${amount}`,
        totalCredits: amount > 0 ? sql`${hotels.totalCredits} + ${amount}` : hotels.totalCredits
      })
      .where(eq(hotels.id, hotelId));

    await db.insert(creditTransactions).values({
      hotelId,
      type: "adjustment",
      amount,
      description,
      processedBy: adminEmail
    });
  }

  async useCredits(hotelId: string, amount: number, description: string, guestProfileId?: string): Promise<boolean> {
    const hotel = await this.getHotel(hotelId);
    if (!hotel || (hotel.credits || 0) < amount) {
      return false;
    }

    await db.update(hotels)
      .set({
        credits: sql`${hotels.credits} - ${amount}`,
        creditsUsed: sql`${hotels.creditsUsed} + ${amount}`
      })
      .where(eq(hotels.id, hotelId));

    await db.insert(creditTransactions).values({
      hotelId,
      type: "usage",
      amount: -amount,
      description,
      relatedGuestProfileId: guestProfileId
    });

    return true;
  }

  async getHotelCredits(hotelId: string): Promise<{ credits: number; totalCredits: number; creditsUsed: number }> {
    const hotel = await this.getHotel(hotelId);
    return {
      credits: hotel?.credits || 0,
      totalCredits: hotel?.totalCredits || 0,
      creditsUsed: hotel?.creditsUsed || 0
    };
  }

  async getCreditTransactions(hotelId: string): Promise<CreditTransaction[]> {
    return await db.select()
      .from(creditTransactions)
      .where(eq(creditTransactions.hotelId, hotelId))
      .orderBy(desc(creditTransactions.createdAt));
  }

  async getAdminUser(email: string): Promise<AdminUser | undefined> {
    const [admin] = await db.select().from(adminUsers).where(eq(adminUsers.email, email));
    return admin || undefined;
  }

  async getAdministrator(id: string): Promise<AdminUser | undefined> {
    const [admin] = await db.select().from(adminUsers).where(eq(adminUsers.id, id));
    return admin || undefined;
  }

  async createAdminUser(admin: InsertAdminUser): Promise<AdminUser> {
    const [result] = await db.insert(adminUsers).values(admin).returning();
    return result;
  }

  async updateAdministratorEmail(id: string, email: string): Promise<void> {
    await db
      .update(adminUsers)
      .set({ email })
      .where(eq(adminUsers.id, id));
  }

  async updateAdministratorPassword(id: string, password: string): Promise<void> {
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);
    await db
      .update(adminUsers)
      .set({ password: hashedPassword })
      .where(eq(adminUsers.id, id));
  }

  async getAllHotelsForAdmin(): Promise<(Hotel & { pendingPurchases: number })[]> {
    const results = await db.select({
      hotel: hotels,
      pendingPurchases: sql<number>`count(${creditPurchases.id})`
    })
    .from(hotels)
    .leftJoin(creditPurchases, and(
      eq(hotels.id, creditPurchases.hotelId),
      eq(creditPurchases.status, "pending")
    ))
    .groupBy(hotels.id)
    .orderBy(desc(hotels.createdAt));

    return results.map(result => ({
      ...result.hotel,
      pendingPurchases: Number(result.pendingPurchases)
    }));
  }
}

export const storage = new DatabaseStorage();
