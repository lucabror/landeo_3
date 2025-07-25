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
  createdAt: timestamp("created_at").defaultNow(),
});

export const guestProfiles = pgTable("guest_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  hotelId: varchar("hotel_id").notNull().references(() => hotels.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // famiglia, coppia, singolo, gruppo_lavoro, anziani
  numberOfPeople: integer("number_of_people").notNull(),
  referenceName: text("reference_name").notNull(),
  ages: jsonb("ages").$type<number[]>(), // array of ages
  preferences: jsonb("preferences").$type<string[]>(), // array of preferences
  specialRequests: text("special_requests"),
  checkInDate: timestamp("check_in_date").notNull(),
  checkOutDate: timestamp("check_out_date").notNull(),
  roomNumber: text("room_number"),
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
  createdAt: timestamp("created_at").defaultNow(),
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

// Relations
export const hotelsRelations = relations(hotels, ({ many }) => ({
  guestProfiles: many(guestProfiles),
  localExperiences: many(localExperiences),
  itineraries: many(itineraries),
}));

export const guestProfilesRelations = relations(guestProfiles, ({ one, many }) => ({
  hotel: one(hotels, {
    fields: [guestProfiles.hotelId],
    references: [hotels.id],
  }),
  itineraries: many(itineraries),
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

// Types
export type Hotel = typeof hotels.$inferSelect;
export type InsertHotel = z.infer<typeof insertHotelSchema>;
export type GuestProfile = typeof guestProfiles.$inferSelect;
export type InsertGuestProfile = z.infer<typeof insertGuestProfileSchema>;
export type LocalExperience = typeof localExperiences.$inferSelect;
export type InsertLocalExperience = z.infer<typeof insertLocalExperienceSchema>;
export type Itinerary = typeof itineraries.$inferSelect;
export type InsertItinerary = z.infer<typeof insertItinerarySchema>;
