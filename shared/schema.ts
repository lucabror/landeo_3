import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const hotels = pgTable("hotels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  region: text("region").notNull(),
  postalCode: text("postal_code").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  website: text("website"),
  description: text("description"),
  logoUrl: text("logo_url"),
  latitude: text("latitude"),
  longitude: text("longitude"),
  services: jsonb("services").$type<string[]>(), // array of hotel services
  // Credit system fields
  credits: integer("credits").default(0),
  creditsUsed: integer("credits_used").default(0),
  totalCredits: integer("total_credits").default(0),
  isActive: boolean("is_active").default(true),
  // Security fields
  password: text("password"), // Hashed password for manager login
  mfaSecret: text("mfa_secret"), // TOTP secret for 2FA
  mfaEnabled: boolean("mfa_enabled").default(false),
  lastLogin: timestamp("last_login"),
  loginAttempts: integer("login_attempts").default(0),
  lockedUntil: timestamp("locked_until"),
  ipWhitelist: jsonb("ip_whitelist").$type<string[]>(), // Allowed IP addresses
  sessionToken: text("session_token"),
  tokenExpiresAt: timestamp("token_expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const guestProfiles = pgTable("guest_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  hotelId: varchar("hotel_id").notNull().references(() => hotels.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // famiglia, coppia, singolo, gruppo_lavoro, anziani
  numberOfPeople: integer("number_of_people").notNull(),
  referenceName: text("reference_name").notNull(),
  email: text("email"), // Email per invio questionario preferenze
  emailLanguage: text("email_language").default("it"), // 'it' o 'en' per lingua email
  ages: jsonb("ages").$type<number[]>(), // array of ages
  preferences: jsonb("preferences").$type<string[]>(), // array of preferences
  specialRequests: text("special_requests"),
  checkInDate: timestamp("check_in_date").notNull(),
  checkOutDate: timestamp("check_out_date").notNull(),
  roomNumber: text("room_number"),
  preferencesCompleted: boolean("preferences_completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const localExperiences = pgTable("local_experiences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  hotelId: varchar("hotel_id").notNull().references(() => hotels.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  category: text("category").notNull(), // cultura, gastronomia, natura, relax, avventura
  description: text("description").notNull(),
  location: text("location").notNull(),
  distance: text("distance"), // e.g., "15 min", "25 km"
  duration: text("duration"), // e.g., "2 ore", "mezza giornata"
  priceRange: text("price_range"),
  contactInfo: jsonb("contact_info").$type<{phone?: string, email?: string, website?: string}>(),
  openingHours: text("opening_hours"),
  seasonality: text("seasonality"),
  targetAudience: jsonb("target_audience").$type<string[]>(), // famiglia, coppia, etc.
  rating: text("rating"),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").default(true),
  // Nuovi campi per il sistema AI
  aiGenerated: boolean("ai_generated").default(false),
  attractionType: text("attraction_type"),
  estimatedDistance: text("estimated_distance"),
  bestTimeToVisit: text("best_time_to_visit"),
  highlights: jsonb("highlights").$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow(),
});

// User management tables
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("hotel_manager"), // hotel_manager, admin
  isEmailVerified: boolean("is_email_verified").default(false),
  emailVerifiedAt: timestamp("email_verified_at"),
  isActive: boolean("is_active").default(false),
  mfaSecret: text("mfa_secret"),
  mfaEnabled: boolean("mfa_enabled").default(false),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const emailVerifications = pgTable("email_verifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Security tables
export const administrators = pgTable("administrators", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(), // Hashed password
  role: text("role").notNull().default("superadmin"), // superadmin, admin
  mfaSecret: text("mfa_secret"), // TOTP secret for 2FA
  mfaEnabled: boolean("mfa_enabled").default(false),
  lastLogin: timestamp("last_login"),
  loginAttempts: integer("login_attempts").default(0),
  lockedUntil: timestamp("locked_until"),
  ipWhitelist: jsonb("ip_whitelist").$type<string[]>(), // Allowed IP addresses
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const securitySessions = pgTable("security_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  userType: text("user_type").notNull(), // 'hotel' or 'admin'
  sessionToken: text("session_token").notNull().unique(),
  ipAddress: text("ip_address").notNull(),
  userAgent: text("user_agent"),
  expiresAt: timestamp("expires_at").notNull(),
  mfaVerified: boolean("mfa_verified").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const securityLogs = pgTable("security_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  userType: text("user_type"), // 'hotel' or 'admin'
  action: text("action").notNull(), // login_attempt, login_success, login_failed, mfa_failed, etc.
  ipAddress: text("ip_address").notNull(),
  userAgent: text("user_agent"),
  details: jsonb("details").$type<Record<string, any>>(),
  timestamp: timestamp("timestamp").defaultNow(),
});



// Tabella per le attrazioni suggerite in attesa di approvazione
export const pendingAttractions = pgTable("pending_attractions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  hotelId: varchar("hotel_id").notNull().references(() => hotels.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  location: text("location").notNull(),
  duration: text("duration").notNull(),
  priceRange: text("price_range").notNull(),
  highlights: jsonb("highlights").$type<string[]>().notNull(),
  attractionType: text("attraction_type").notNull(),
  estimatedDistance: text("estimated_distance").notNull(),
  bestTimeToVisit: text("best_time_to_visit").notNull(),
  searchArea: text("search_area").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  approved: boolean("approved").default(false),
  rejected: boolean("rejected").default(false),
  processedAt: timestamp("processed_at"),
});

export const itineraries = pgTable("itineraries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  hotelId: varchar("hotel_id").notNull().references(() => hotels.id, { onDelete: "cascade" }),
  guestProfileId: varchar("guest_profile_id").notNull().references(() => guestProfiles.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  days: jsonb("days").$type<Array<{
    day: number;
    date: string;
    activities: Array<{
      time: string;
      activity: string;
      location: string;
      description: string;
      experienceId?: string;
      duration?: string;
      notes?: string;
    }>;
  }>>(),
  status: text("status").notNull().default("draft"), // draft, active, completed
  uniqueUrl: text("unique_url").notNull(),
  qrCodeUrl: text("qr_code_url"),
  pdfUrl: text("pdf_url"),
  aiPrompt: text("ai_prompt"),
  aiResponse: jsonb("ai_response"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tabella per gestire i token delle preferenze ospiti
export const guestPreferencesTokens = pgTable("guest_preferences_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  token: varchar("token").notNull().unique(),
  guestProfileId: varchar("guest_profile_id").notNull().references(() => guestProfiles.id, { onDelete: "cascade" }),
  emailSent: boolean("email_sent").default(false),
  completed: boolean("completed").default(false),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  emailVerifications: many(emailVerifications),
}));

export const emailVerificationsRelations = relations(emailVerifications, ({ one }) => ({
  user: one(users, {
    fields: [emailVerifications.userId],
    references: [users.id],
  }),
}));

export const hotelsRelations = relations(hotels, ({ many }) => ({
  guestProfiles: many(guestProfiles),
  localExperiences: many(localExperiences),
  itineraries: many(itineraries),
  pendingAttractions: many(pendingAttractions),
}));

export const pendingAttractionsRelations = relations(pendingAttractions, ({ one }) => ({
  hotel: one(hotels, {
    fields: [pendingAttractions.hotelId],
    references: [hotels.id],
  }),
}));

export const guestProfilesRelations = relations(guestProfiles, ({ one, many }) => ({
  hotel: one(hotels, {
    fields: [guestProfiles.hotelId],
    references: [hotels.id],
  }),
  itineraries: many(itineraries),
  preferencesTokens: many(guestPreferencesTokens),
}));

export const guestPreferencesTokensRelations = relations(guestPreferencesTokens, ({ one }) => ({
  guestProfile: one(guestProfiles, {
    fields: [guestPreferencesTokens.guestProfileId],
    references: [guestProfiles.id],
  }),
}));

// Credit purchase table
export const creditPurchases = pgTable("credit_purchases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  hotelId: varchar("hotel_id").notNull().references(() => hotels.id, { onDelete: "cascade" }),
  packageType: text("package_type").notNull(), // "basic", "standard", "premium", "enterprise"
  packagePrice: integer("package_price").notNull(), // in euros
  creditsAmount: integer("credits_amount").notNull(),
  status: text("status").notNull().default("pending"), // "pending", "approved", "rejected"
  bankTransferConfirmed: boolean("bank_transfer_confirmed").default(false),
  processedAt: timestamp("processed_at"),
  processedBy: text("processed_by"), // admin email
  notes: text("notes"), // admin notes
  createdAt: timestamp("created_at").defaultNow(),
});

// Admin users table
export const adminUsers = pgTable("admin_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role").notNull().default("superadmin"), // "superadmin", "admin"
  isActive: boolean("is_active").default(true),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Credit transactions log
export const creditTransactions = pgTable("credit_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  hotelId: varchar("hotel_id").notNull().references(() => hotels.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // "purchase", "usage", "adjustment", "refund"
  amount: integer("amount").notNull(), // positive for add, negative for subtract
  description: text("description").notNull(),
  relatedPurchaseId: varchar("related_purchase_id").references(() => creditPurchases.id),
  relatedGuestProfileId: varchar("related_guest_profile_id").references(() => guestProfiles.id),
  processedBy: text("processed_by"), // admin email for manual adjustments
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations for new tables
export const creditPurchasesRelations = relations(creditPurchases, ({ one }) => ({
  hotel: one(hotels, {
    fields: [creditPurchases.hotelId],
    references: [hotels.id],
  }),
}));

export const creditTransactionsRelations = relations(creditTransactions, ({ one }) => ({
  hotel: one(hotels, {
    fields: [creditTransactions.hotelId],
    references: [hotels.id],
  }),
  relatedPurchase: one(creditPurchases, {
    fields: [creditTransactions.relatedPurchaseId],
    references: [creditPurchases.id],
  }),
  relatedGuestProfile: one(guestProfiles, {
    fields: [creditTransactions.relatedGuestProfileId],
    references: [guestProfiles.id],
  }),
}));

export const localExperiencesRelations = relations(localExperiences, ({ one }) => ({
  hotel: one(hotels, {
    fields: [localExperiences.hotelId],
    references: [hotels.id],
  }),
}));

export const itinerariesRelations = relations(itineraries, ({ one }) => ({
  hotel: one(hotels, {
    fields: [itineraries.hotelId],
    references: [hotels.id],
  }),
  guestProfile: one(guestProfiles, {
    fields: [itineraries.guestProfileId],
    references: [guestProfiles.id],
  }),
}));

// Insert schemas
export const insertHotelSchema = createInsertSchema(hotels).omit({
  id: true,
  createdAt: true,
});

export const insertGuestProfileSchema = createInsertSchema(guestProfiles).omit({
  id: true,
  createdAt: true,
  preferencesCompleted: true,
}).extend({
  checkInDate: z.union([z.date(), z.string().transform((str) => new Date(str))]),
  checkOutDate: z.union([z.date(), z.string().transform((str) => new Date(str))]),
});

export const insertLocalExperienceSchema = createInsertSchema(localExperiences).omit({
  id: true,
  createdAt: true,
});

export const insertItinerarySchema = createInsertSchema(itineraries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPendingAttractionSchema = createInsertSchema(pendingAttractions).omit({
  id: true,
  createdAt: true,
  processedAt: true,
});

export const insertGuestPreferencesTokenSchema = createInsertSchema(guestPreferencesTokens).omit({
  id: true,
  createdAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  emailVerifiedAt: true,
  lastLogin: true,
});

export const insertEmailVerificationSchema = createInsertSchema(emailVerifications).omit({
  id: true,
  createdAt: true,
});

// Security types and schemas
export type Administrator = typeof administrators.$inferSelect;
export type InsertAdministrator = typeof administrators.$inferInsert;
export type SecuritySession = typeof securitySessions.$inferSelect;
export type InsertSecuritySession = typeof securitySessions.$inferInsert;
export type SecurityLog = typeof securityLogs.$inferSelect;
export type InsertSecurityLog = typeof securityLogs.$inferInsert;

export const insertAdministratorSchema = createInsertSchema(administrators).omit({
  id: true,
  createdAt: true,
});

export const insertSecuritySessionSchema = createInsertSchema(securitySessions).omit({
  id: true,
  createdAt: true,
});

export const insertSecurityLogSchema = createInsertSchema(securityLogs).omit({
  id: true,
  timestamp: true,
});

// Schema per le preferenze ospiti dal modulo pubblico
export const guestPreferencesSchema = z.object({
  preferences: z.array(z.string()).min(1, "Seleziona almeno una preferenza"),
  otherPreferences: z.string().optional(),
  dietaryRestrictions: z.array(z.string()).optional(),
  mobilityNeeds: z.array(z.string()).optional(),
  specialInterests: z.string().optional(),
});

// Types
export type Hotel = typeof hotels.$inferSelect;
export type InsertHotel = z.infer<typeof insertHotelSchema>;
export type GuestProfile = typeof guestProfiles.$inferSelect;
export type InsertGuestProfile = z.infer<typeof insertGuestProfileSchema>;
export type LocalExperience = typeof localExperiences.$inferSelect;
export type InsertLocalExperience = z.infer<typeof insertLocalExperienceSchema>;
export type Itinerary = typeof itineraries.$inferSelect;
export type InsertItinerary = z.infer<typeof insertItinerarySchema>;
export type PendingAttraction = typeof pendingAttractions.$inferSelect;
export type InsertPendingAttraction = z.infer<typeof insertPendingAttractionSchema>;
export type GuestPreferencesToken = typeof guestPreferencesTokens.$inferSelect;
export type InsertGuestPreferencesToken = z.infer<typeof insertGuestPreferencesTokenSchema>;
export type GuestPreferences = z.infer<typeof guestPreferencesSchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type EmailVerification = typeof emailVerifications.$inferSelect;
export type InsertEmailVerification = z.infer<typeof insertEmailVerificationSchema>;

// Credit system schemas and types
export const insertCreditPurchaseSchema = createInsertSchema(creditPurchases).omit({
  id: true,
  createdAt: true,
  processedAt: true,
});

export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({
  id: true,
  createdAt: true,
  lastLogin: true,
});

export const insertCreditTransactionSchema = createInsertSchema(creditTransactions).omit({
  id: true,
  createdAt: true,
});

export type CreditPurchase = typeof creditPurchases.$inferSelect;
export type InsertCreditPurchase = z.infer<typeof insertCreditPurchaseSchema>;
export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;
export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type InsertCreditTransaction = z.infer<typeof insertCreditTransactionSchema>;
