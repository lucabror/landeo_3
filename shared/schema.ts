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
