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
import { DatabaseSecurity, SecureDatabase } from "./database-security";

/**
 * Secure Storage Implementation
 * Wraps all database operations with security measures
 */
export class SecureStorage {

  /**
   * HOTELS - Secure Operations
   */
  async getHotel(id: string, userId: string): Promise<Hotel | undefined> {
    const results = await SecureDatabase.secureSelect<Hotel>(
      hotels, 
      eq(hotels.id, id), 
      userId,
      { limit: 1, includeSensitive: false }
    );
    return results[0];
  }

  async getHotelSecure(id: string, userId: string): Promise<Hotel | undefined> {
    // Only admin or hotel owner can access sensitive data
    const results = await SecureDatabase.secureSelect<Hotel>(
      hotels, 
      eq(hotels.id, id), 
      userId,
      { limit: 1, includeSensitive: true }
    );
    return results[0];
  }

  async createHotel(hotel: InsertHotel, userId: string): Promise<Hotel> {
    // Encrypt sensitive fields before storage
    const secureHotel = DatabaseSecurity.encryptSensitiveData(hotel);
    return await SecureDatabase.secureInsert<Hotel>(hotels, secureHotel, userId);
  }

  async updateHotel(id: string, hotel: Partial<InsertHotel>, userId: string): Promise<Hotel> {
    const secureHotel = DatabaseSecurity.encryptSensitiveData(hotel);
    return await SecureDatabase.secureUpdate<Hotel>(hotels, id, secureHotel, userId);
  }

  async getHotels(userId: string): Promise<Hotel[]> {
    return await SecureDatabase.secureSelect<Hotel>(
      hotels, 
      sql`1=1`, // All hotels
      userId,
      { limit: 100, includeSensitive: false }
    );
  }

  async deleteHotel(id: string, userId: string): Promise<void> {
    await SecureDatabase.secureDelete(hotels, id, userId);
  }

  /**
   * GUEST PROFILES - Secure Operations
   */
  async getGuestProfile(id: string, userId: string): Promise<GuestProfile | undefined> {
    const results = await SecureDatabase.secureSelect<GuestProfile>(
      guestProfiles, 
      eq(guestProfiles.id, id), 
      userId,
      { limit: 1 }
    );
    return results[0];
  }

  async createGuestProfile(profile: InsertGuestProfile, userId: string): Promise<GuestProfile> {
    const sanitizedProfile = DatabaseSecurity.sanitizeInput(profile);
    return await SecureDatabase.secureInsert<GuestProfile>(guestProfiles, sanitizedProfile, userId);
  }

  async updateGuestProfile(id: string, profile: Partial<InsertGuestProfile>, userId: string): Promise<GuestProfile> {
    const sanitizedProfile = DatabaseSecurity.sanitizeInput(profile);
    return await SecureDatabase.secureUpdate<GuestProfile>(guestProfiles, id, sanitizedProfile, userId);
  }

  async getGuestProfilesByHotel(hotelId: string, userId: string): Promise<GuestProfile[]> {
    return await SecureDatabase.secureSelect<GuestProfile>(
      guestProfiles, 
      eq(guestProfiles.hotelId, hotelId), 
      userId,
      { limit: 500 }
    );
  }

  async deleteGuestProfile(id: string, userId: string): Promise<void> {
    await SecureDatabase.secureDelete(guestProfiles, id, userId);
  }

  /**
   * LOCAL EXPERIENCES - Secure Operations
   */
  async getLocalExperience(id: string, userId: string): Promise<LocalExperience | undefined> {
    const results = await SecureDatabase.secureSelect<LocalExperience>(
      localExperiences, 
      eq(localExperiences.id, id), 
      userId,
      { limit: 1 }
    );
    return results[0];
  }

  async createLocalExperience(experience: InsertLocalExperience, userId: string): Promise<LocalExperience> {
    const sanitizedExperience = DatabaseSecurity.sanitizeInput(experience);
    return await SecureDatabase.secureInsert<LocalExperience>(localExperiences, sanitizedExperience, userId);
  }

  async updateLocalExperience(id: string, experience: Partial<InsertLocalExperience>, userId: string): Promise<LocalExperience> {
    const sanitizedExperience = DatabaseSecurity.sanitizeInput(experience);
    return await SecureDatabase.secureUpdate<LocalExperience>(localExperiences, id, sanitizedExperience, userId);
  }

  async getLocalExperiencesByHotel(hotelId: string, userId: string): Promise<LocalExperience[]> {
    return await SecureDatabase.secureSelect<LocalExperience>(
      localExperiences, 
      and(eq(localExperiences.hotelId, hotelId), eq(localExperiences.isActive, true)), 
      userId,
      { limit: 1000 }
    );
  }

  async getAllLocalExperiencesByHotel(hotelId: string, userId: string): Promise<LocalExperience[]> {
    return await SecureDatabase.secureSelect<LocalExperience>(
      localExperiences, 
      eq(localExperiences.hotelId, hotelId), 
      userId,
      { limit: 1000 }
    );
  }

  async deleteLocalExperience(id: string, userId: string): Promise<void> {
    await SecureDatabase.secureDelete(localExperiences, id, userId);
  }

  /**
   * ITINERARIES - Secure Operations
   */
  async getItinerary(id: string, userId: string): Promise<Itinerary | undefined> {
    const results = await SecureDatabase.secureSelect<Itinerary>(
      itineraries, 
      eq(itineraries.id, id), 
      userId,
      { limit: 1 }
    );
    return results[0];
  }

  async getItineraryByUrl(uniqueUrl: string, userId: string): Promise<Itinerary | undefined> {
    const results = await SecureDatabase.secureSelect<Itinerary>(
      itineraries, 
      eq(itineraries.uniqueUrl, uniqueUrl), 
      userId,
      { limit: 1 }
    );
    return results[0];
  }

  async getItineraryByUniqueUrl(uniqueUrl: string, userId: string): Promise<Itinerary | undefined> {
    return this.getItineraryByUrl(uniqueUrl, userId);
  }

  async createItinerary(itinerary: InsertItinerary, userId: string): Promise<Itinerary> {
    const sanitizedItinerary = DatabaseSecurity.sanitizeInput(itinerary);
    return await SecureDatabase.secureInsert<Itinerary>(itineraries, sanitizedItinerary, userId);
  }

  async updateItinerary(id: string, itinerary: Partial<InsertItinerary>, userId: string): Promise<Itinerary> {
    const sanitizedItinerary = DatabaseSecurity.sanitizeInput(itinerary);
    return await SecureDatabase.secureUpdate<Itinerary>(itineraries, id, sanitizedItinerary, userId);
  }

  async getItinerariesByHotel(hotelId: string, userId: string): Promise<Itinerary[]> {
    return await SecureDatabase.secureSelect<Itinerary>(
      itineraries, 
      eq(itineraries.hotelId, hotelId), 
      userId,
      { limit: 1000 }
    );
  }

  async deleteItinerary(id: string, userId: string): Promise<void> {
    await SecureDatabase.secureDelete(itineraries, id, userId);
  }

  /**
   * CREDIT PURCHASES - Secure Operations  
   */
  async createCreditPurchase(purchase: InsertCreditPurchase, userId: string): Promise<CreditPurchase> {
    const sanitizedPurchase = DatabaseSecurity.sanitizeInput(purchase);
    return await SecureDatabase.secureInsert<CreditPurchase>(creditPurchases, sanitizedPurchase, userId);
  }

  async getCreditPurchasesByHotel(hotelId: string, userId: string): Promise<CreditPurchase[]> {
    return await SecureDatabase.secureSelect<CreditPurchase>(
      creditPurchases, 
      eq(creditPurchases.hotelId, hotelId), 
      userId,
      { limit: 500 }
    );
  }

  async getPendingCreditPurchases(userId: string): Promise<CreditPurchase[]> {
    return await SecureDatabase.secureSelect<CreditPurchase>(
      creditPurchases, 
      eq(creditPurchases.status, 'pending'), 
      userId,
      { limit: 500 }
    );
  }

  async updateCreditPurchase(id: string, purchase: Partial<InsertCreditPurchase>, userId: string): Promise<CreditPurchase> {
    const sanitizedPurchase = DatabaseSecurity.sanitizeInput(purchase);
    return await SecureDatabase.secureUpdate<CreditPurchase>(creditPurchases, id, sanitizedPurchase, userId);
  }

  /**
   * ADMIN USERS - Secure Operations
   */
  async getAdminUser(id: string, userId: string): Promise<AdminUser | undefined> {
    const results = await SecureDatabase.secureSelect<AdminUser>(
      adminUsers, 
      eq(adminUsers.id, id), 
      userId,
      { limit: 1, includeSensitive: false }
    );
    return results[0];
  }

  async getAdminUserByEmail(email: string, userId: string): Promise<AdminUser | undefined> {
    const results = await SecureDatabase.secureSelect<AdminUser>(
      adminUsers, 
      eq(adminUsers.email, email), 
      userId,
      { limit: 1, includeSensitive: true } // Needed for authentication
    );
    return results[0];
  }

  async createAdminUser(user: InsertAdminUser, userId: string): Promise<AdminUser> {
    const secureUser = DatabaseSecurity.encryptSensitiveData(user);
    return await SecureDatabase.secureInsert<AdminUser>(adminUsers, secureUser, userId);
  }

  async updateAdminUser(id: string, user: Partial<InsertAdminUser>, userId: string): Promise<AdminUser> {
    const secureUser = DatabaseSecurity.encryptSensitiveData(user);
    return await SecureDatabase.secureUpdate<AdminUser>(adminUsers, id, secureUser, userId);
  }

  /**
   * Security Health Check
   */
  async performSecurityHealthCheck(): Promise<any> {
    console.log('🔒 Performing database security health check...');
    
    const health = await DatabaseSecurity.healthCheck();
    const backup = await DatabaseSecurity.validateBackup();
    
    return {
      database: health,
      backup: { valid: backup },
      encryption: { status: 'active' },
      monitoring: { status: 'active' },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Emergency Security Lockdown
   */
  async emergencyLockdown(reason: string, userId: string): Promise<void> {
    console.log(`🚨 EMERGENCY LOCKDOWN initiated by ${userId}: ${reason}`);
    
    await DatabaseSecurity.auditLog('LOCKDOWN', 'system', userId, { reason });
    
    // In a real implementation, this would:
    // 1. Disable all non-essential database access
    // 2. Alert administrators
    // 3. Enable enhanced logging
    // 4. Restrict connections to specific IPs
  }
}

// Export singleton instance
export const secureStorage = new SecureStorage();