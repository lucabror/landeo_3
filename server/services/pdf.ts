import PDFDocument from "pdfkit";
import type { Itinerary, Hotel, GuestProfile } from "@shared/schema";
import fs from "fs/promises";
import { createWriteStream } from "fs";
import path from "path";
import { Readable } from "stream";
import { storage } from "../storage";

// Multilingual PDF templates
const PDF_TEMPLATES = {
  it: {
    personalizedItinerary: 'ITINERARIO PERSONALIZZATO',
    guest: 'OSPITE',
    stay: 'SOGGIORNO',
    people: 'persone',
    checkin: 'Check-in:',
    checkout: 'Check-out:',
    yourItinerary: 'IL TUO ITINERARIO',
    day: 'GIORNO',
    preferenceMatched: 'Scelta sulle tue preferenze',
    hotelSuggested: 'Suggerita dall\'hotel',
    poweredBy: 'Landeo - Powered by AI',
    generatedOn: 'Generato il'
  },
  en: {
    personalizedItinerary: 'PERSONALIZED ITINERARY',
    guest: 'GUEST',
    stay: 'STAY',
    people: 'people',
    checkin: 'Check-in:',
    checkout: 'Check-out:',
    yourItinerary: 'YOUR ITINERARY',
    day: 'DAY',
    preferenceMatched: 'Based on your preferences',
    hotelSuggested: 'Hotel recommendation',
    poweredBy: 'Landeo - Powered by AI',
    generatedOn: 'Generated on'
  }
};

export async function generateItineraryPDF(
  itinerary: Itinerary,
  hotel: Hotel,
  guestProfile: GuestProfile
): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      // Determine language from guest profile
      const language = (guestProfile.emailLanguage || 'it') as 'it' | 'en';
      const template = PDF_TEMPLATES[language];
      
      // Get local experiences to enrich activity data
      const localExperiences = await storage.getLocalExperiencesByHotel(hotel.id);
      
      // Enrich activities with local experience data
      if (itinerary.days && Array.isArray(itinerary.days)) {
        for (const day of itinerary.days) {
          if (day.activities && Array.isArray(day.activities)) {
            for (const activity of day.activities) {
              if (activity.experienceId) {
                const experience = localExperiences.find(exp => exp.id === activity.experienceId);
                if (experience) {
                  // Enrich with complete experience data
                  activity.address = experience.address || activity.address;
                  activity.distance = experience.distance || activity.distance;
                  activity.location = experience.location || activity.location;
                  // Don't override description if activity already has one, but fallback to experience description
                  if (!activity.description && experience.description) {
                    activity.description = experience.description;
                  }
                }
              }
            }
          }
        }
      }
      
      // Create directory if it doesn't exist
      const uploadsDir = path.join(process.cwd(), 'uploads', 'pdfs');
      await fs.mkdir(uploadsDir, { recursive: true });

      const fileName = `itinerary-${itinerary.id}.pdf`;
      const filePath = path.join(uploadsDir, fileName);

      // Create PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });

      // Pipe to file
      const stream = createWriteStream(filePath);
      doc.pipe(stream);

      // Define spa/wellness inspired colors matching the template
      const colors = {
        primaryTeal: '#4A90A4',      // Main teal color for headers
        lightTeal: '#6BA6C0',        // Lighter teal for accents  
        backgroundLight: '#F7F9F9',  // Clean light background
        sectionBg: '#F0F4F7',        // Light section backgrounds
        cardBackground: '#FCFDFD',   // Very light background for cards
        darkText: '#2C3E50',         // Dark blue-gray for main text
        mediumText: '#5A6C7D',       // Medium gray-blue for descriptions
        lightText: '#7B8794',        // Light gray for details
        borderLight: '#E1E8ED',      // Subtle borders
        white: '#FFFFFF'             // Pure white
      };

      // Create clean spa-inspired header
      // Main background in light teal/gray
      doc.rect(0, 0, doc.page.width, doc.page.height).fill(colors.backgroundLight);
      
      // White content area with rounded corners effect
      doc.rect(40, 40, doc.page.width - 80, doc.page.height - 80).fill(colors.white);
      
      // Header section with teal accent
      doc.rect(40, 40, doc.page.width - 80, 120).fill(colors.sectionBg);
      
      // Hotel name in clean, modern style
      doc.font('Helvetica-Bold')
         .fontSize(22)
         .fillColor(colors.primaryTeal)
         .text(hotel.name.toUpperCase(), 60, 65, { 
           width: doc.page.width - 120, 
           align: 'center'
         });
         
      // Elegant subtitle with clean typography
      doc.font('Helvetica')
         .fontSize(11)
         .fillColor(colors.mediumText)
         .text(template.personalizedItinerary, 60, 95, { 
           width: doc.page.width - 120, 
           align: 'center'
         });
         
      // Location subtitle
      doc.font('Helvetica')
         .fontSize(10)
         .fillColor(colors.lightText)
         .text(`${hotel.city}, ${hotel.region}`, 60, 115, { 
           width: doc.page.width - 120, 
           align: 'center'
         });
      
      // Guest information section in clean spa style
      let yPosition = 180;
      const leftMargin = 60;
      const rightMargin = doc.page.width - 60;
      // Guest information section in spa-style columns
      // Left column - Guest details
      doc.rect(leftMargin, yPosition, 200, 70).fill(colors.cardBackground);
      doc.strokeColor(colors.borderLight).lineWidth(1);
      doc.rect(leftMargin, yPosition, 200, 70).stroke();
      
      doc.font('Helvetica-Bold')
         .fontSize(12)
         .fillColor(colors.primaryTeal)
         .text(template.guest, leftMargin + 15, yPosition + 15);
         
      doc.font('Helvetica-Bold')
         .fontSize(11)
         .fillColor(colors.darkText)
         .text(guestProfile.referenceName, leftMargin + 15, yPosition + 35);
         
      doc.font('Helvetica')
         .fontSize(9)
         .fillColor(colors.mediumText)
         .text(`${guestProfile.type} • ${guestProfile.numberOfPeople} ${template.people}`, leftMargin + 15, yPosition + 50);
      
      // Right column - Stay details  
      const rightColX = leftMargin + 220;
      doc.rect(rightColX, yPosition, 200, 70).fill(colors.cardBackground);
      doc.strokeColor(colors.borderLight).lineWidth(1);
      doc.rect(rightColX, yPosition, 200, 70).stroke();
      
      doc.font('Helvetica-Bold')
         .fontSize(12)
         .fillColor(colors.primaryTeal)
         .text(template.stay, rightColX + 15, yPosition + 15);
         
      if (guestProfile.checkInDate && guestProfile.checkOutDate) {
        const locale = language === 'it' ? 'it-IT' : 'en-US';
        const checkIn = new Date(guestProfile.checkInDate).toLocaleDateString(locale);
        const checkOut = new Date(guestProfile.checkOutDate).toLocaleDateString(locale);
        
        doc.font('Helvetica')
           .fontSize(9)
           .fillColor(colors.mediumText)
           .text(`${template.checkin} ${checkIn}`, rightColX + 15, yPosition + 35)
           .text(`${template.checkout} ${checkOut}`, rightColX + 15, yPosition + 50);
      }
      
      yPosition += 100;

      // Title of the itinerary with spa-style
      doc.font('Helvetica-Bold')
         .fontSize(18)
         .fillColor(colors.primaryTeal)
         .text(itinerary.title || template.yourItinerary, leftMargin, yPosition, { 
           width: rightMargin - leftMargin, 
           align: 'center'
         });
      
      yPosition += 50;

      // Itinerary days (styled like menu sections)
      if (itinerary.days && Array.isArray(itinerary.days)) {
        for (let dayIndex = 0; dayIndex < itinerary.days.length; dayIndex++) {
          const day = itinerary.days[dayIndex];
          
          // Check if we need a new page
          if (yPosition > doc.page.height - 200) {
            doc.addPage();
            // Add clean white background to new page
            doc.rect(0, 0, doc.page.width, doc.page.height).fill(colors.white);
            yPosition = 60;
          }

          // Day section header in teal style
          doc.rect(leftMargin, yPosition, rightMargin - leftMargin, 40).fill(colors.sectionBg);
          
          doc.font('Helvetica-Bold')
             .fontSize(14)
             .fillColor(colors.primaryTeal)
             .text(`${template.day} ${dayIndex + 1}`, leftMargin + 15, yPosition + 12);
          
          // Day date
          if (day.date) {
            const locale = language === 'it' ? 'it-IT' : 'en-US';
            doc.font('Helvetica')
               .fontSize(10)
               .fillColor(colors.mediumText)
               .text(new Date(day.date).toLocaleDateString(locale, { 
                 weekday: 'long', 
                 day: 'numeric',
                 month: 'long'
               }), leftMargin + 200, yPosition + 14);
          }

          yPosition += 50;

          // Activities in spa-style treatment rows
          if (day.activities && Array.isArray(day.activities)) {
            for (let actIndex = 0; actIndex < day.activities.length; actIndex++) {
              const activity = day.activities[actIndex];
              
              // Check if we need a new page (improved logic to prevent empty pages)
              if (yPosition > doc.page.height - 150) {
                doc.addPage();
                doc.rect(0, 0, doc.page.width, doc.page.height).fill(colors.backgroundLight);
                doc.rect(40, 40, doc.page.width - 80, doc.page.height - 80).fill(colors.white);
                yPosition = 80; // Start higher to avoid layout issues
              }

              // Activity row like spa treatment entry (increased height for address info and distance)
              const hasLocationInfo = activity.location || activity.address || activity.distance;
              const rowHeight = hasLocationInfo ? 95 : 75;
              doc.rect(leftMargin, yPosition, rightMargin - leftMargin, rowHeight).fill(colors.cardBackground);
              doc.strokeColor(colors.borderLight).lineWidth(0.5);
              doc.rect(leftMargin, yPosition, rightMargin - leftMargin, rowHeight).stroke();

              // Activity name (like treatment name)
              doc.font('Helvetica-Bold')
                 .fontSize(12)
                 .fillColor(colors.darkText)
                 .text(activity.activity, leftMargin + 15, yPosition + 10);

              // Location, address and distance information
              let currentY = yPosition + 25;
              if (activity.location) {
                doc.font('Helvetica')
                   .fontSize(9)
                   .fillColor(colors.mediumText)
                   .text(`📍 ${activity.location}`, leftMargin + 15, currentY, { 
                     width: 350
                   });
                currentY += 12;
              }
              
              if (activity.address) {
                doc.font('Helvetica')
                   .fontSize(8)
                   .fillColor(colors.lightText)
                   .text(`🏠 ${activity.address}`, leftMargin + 15, currentY, { 
                     width: 350
                   });
                currentY += 11;
              }
              
              if (activity.distance) {
                doc.font('Helvetica')
                   .fontSize(8)
                   .fillColor(colors.lightTeal)
                   .text(`📏 ${activity.distance}`, leftMargin + 15, currentY, { 
                     width: 350
                   });
                currentY += 11;
              }

              // Source label with spa-style colors
              const sourceYPosition = hasLocationInfo ? currentY : yPosition + 28;
              if (activity.source === 'preference-matched') {
                doc.font('Helvetica')
                   .fontSize(8)
                   .fillColor(colors.primaryTeal)
                   .text(`🎯 ${template.preferenceMatched}`, leftMargin + 15, sourceYPosition);
              } else if (activity.source === 'hotel-suggested') {
                doc.font('Helvetica')
                   .fontSize(8)
                   .fillColor(colors.lightTeal)
                   .text(`🏨 ${template.hotelSuggested}`, leftMargin + 15, sourceYPosition);
              }
              currentY += 12;

              // Description - NEVER truncated, full text
              if (activity.description) {
                doc.font('Helvetica')
                   .fontSize(9)
                   .fillColor(colors.mediumText)
                   .text(activity.description, leftMargin + 15, currentY, { 
                     width: 350
                   });
              }

              // Time and duration (like spa treatment time and price)
              if (activity.time) {
                doc.font('Helvetica-Bold')
                   .fontSize(11)
                   .fillColor(colors.primaryTeal)
                   .text(activity.time, rightMargin - 100, yPosition + 10);
              }

              if (activity.duration) {
                doc.font('Helvetica')
                   .fontSize(9)
                   .fillColor(colors.mediumText)
                   .text(activity.duration, rightMargin - 100, yPosition + 28);
              }

              yPosition += rowHeight + 8;
            }
          }

          yPosition += 20; // Space between days
        }
      }

      // Add footer only if there's content on the current page
      if (yPosition > 80) {
        // Clean spa-style footer
        const footerY = Math.max(yPosition + 40, doc.page.height - 100);
        
        // Footer background section
        doc.rect(40, footerY, doc.page.width - 80, 50).fill(colors.sectionBg);
        
        // Hotel information
        doc.font('Helvetica-Bold')
           .fontSize(9)
           .fillColor(colors.primaryTeal)
           .text(hotel.name, leftMargin, footerY + 12);
        
        doc.font('Helvetica')
           .fontSize(8)
           .fillColor(colors.mediumText)
           .text(`${hotel.city}, ${hotel.region}`, leftMargin, footerY + 26);
        
        // Generation date
        const locale = language === 'it' ? 'it-IT' : 'en-US';
        doc.text(`${template.generatedOn} ${new Date().toLocaleDateString(locale)}`, 
                 rightMargin - 120, footerY + 12);
        
        // Branding
        doc.font('Helvetica')
           .fontSize(8)
           .fillColor(colors.lightText)
           .text(template.poweredBy, leftMargin, footerY + 38, { 
             width: rightMargin - leftMargin,
             align: 'center' 
           });
      }

      // Finalize the PDF without adding unnecessary pages
      doc.end();

      stream.on('finish', async () => {
        try {
          // Verify file exists and is readable before resolving
          await fs.access(filePath);
          const stats = await fs.stat(filePath);
          console.log('✅ PDF file written successfully:', filePath, 'Size:', stats.size, 'bytes');
          resolve(filePath); // Return the full absolute path instead of relative
        } catch (verifyError) {
          console.error('❌ PDF file verification failed:', verifyError);
          reject(new Error(`PDF file not accessible: ${verifyError instanceof Error ? verifyError.message : String(verifyError)}`));
        }
      });

      stream.on('error', (error: Error) => {
        reject(error);
      });

    } catch (error) {
      console.error("PDF generation error:", error);
      reject(new Error("Failed to generate PDF: " + (error instanceof Error ? error.message : String(error))));
    }
  });
}
