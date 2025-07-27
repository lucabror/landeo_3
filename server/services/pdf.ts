import PDFDocument from "pdfkit";
import type { Itinerary, Hotel, GuestProfile } from "@shared/schema";
import fs from "fs/promises";
import { createWriteStream } from "fs";
import path from "path";
import { Readable } from "stream";

export async function generateItineraryPDF(
  itinerary: Itinerary,
  hotel: Hotel,
  guestProfile: GuestProfile
): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
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

      // Define colors (matching the elegant landing page design)
      const colors = {
        primary: '#B45309',      // Amber-700 (elegant warm tone)
        secondary: '#92400E',    // Amber-800 (deeper warm tone)  
        accent: '#F3F4F6',       // Stone-100 (very light background)
        lightAccent: '#FAFAF9',  // Stone-50 (almost white)
        textDark: '#1F2937',     // Gray-800 (elegant dark text)
        textLight: '#6B7280',    // Gray-500 (subtle text)
        border: '#E5E7EB',       // Gray-200 (light borders)
        gold: '#FBBF24'          // Amber-400 (soft gold accents)
      };

      // Elegant header with subtle gradient effect
      doc.rect(0, 0, doc.page.width, 100).fill(colors.lightAccent);
      doc.rect(0, 0, doc.page.width, 6).fill(colors.primary);
      
      // Hotel name with elegant styling
      doc.font('Helvetica-Bold')
         .fontSize(22)
         .fillColor(colors.primary)
         .text(hotel.name, 50, 25, { width: doc.page.width - 100 });

      // Hotel details with lighter styling
      doc.font('Helvetica')
         .fontSize(10)
         .fillColor(colors.textLight)
         .text(hotel.address, 50, 50)
         .text(`${hotel.city}, ${hotel.region}`, 50, 65)
         .text(hotel.phone, 50, 80);

      // Itinerary title with elegant styling
      doc.font('Helvetica-Bold')
         .fontSize(20)
         .fillColor(colors.textDark)
         .text(itinerary.title, 50, 125);
      
      // Decorative line under title
      doc.rect(50, 150, 200, 2).fill(colors.gold);

      // Guest information with elegant card-like design
      doc.rect(50, 165, doc.page.width - 100, 70).fill(colors.accent);
      doc.rect(50, 165, doc.page.width - 100, 70).stroke(colors.border);
      
      doc.font('Helvetica-Bold')
         .fontSize(11)
         .fillColor(colors.textDark)
         .text('INFORMAZIONI OSPITE', 65, 175);
      
      doc.font('Helvetica')
         .fontSize(10)
         .fillColor(colors.textLight)
         .text(`Ospiti: ${guestProfile.referenceName} (${guestProfile.numberOfPeople} persone)`, 65, 190)
         .text(`Tipo: ${guestProfile.type}`, 65, 205)
         .text(`Check-in: ${new Date(guestProfile.checkInDate).toLocaleDateString('it-IT')}`, 65, 220)
         .text(`Check-out: ${new Date(guestProfile.checkOutDate).toLocaleDateString('it-IT')}`, 280, 220);

      let yPosition = 250;

      // Description with elegant styling
      if (itinerary.description) {
        doc.rect(50, yPosition, doc.page.width - 100, 50).fill(colors.lightAccent);
        doc.rect(50, yPosition, doc.page.width - 100, 50).stroke(colors.border);
        
        doc.font('Helvetica-Bold')
           .fontSize(11)
           .fillColor(colors.textDark)
           .text('DESCRIZIONE', 65, yPosition + 10);
        
        doc.font('Helvetica')
           .fontSize(10)
           .fillColor(colors.textLight)
           .text(itinerary.description, 65, yPosition + 25, { width: doc.page.width - 130 });
        
        yPosition += 65;
      } else {
        yPosition += 15;
      }

      // Itinerary days
      if (itinerary.days && Array.isArray(itinerary.days)) {
        for (const day of itinerary.days) {
          // Check if we need a new page
          if (yPosition > doc.page.height - 150) {
            doc.addPage();
            yPosition = 50;
          }

          // Day header with elegant styling
          doc.rect(50, yPosition, doc.page.width - 100, 35).fill(colors.primary);
          doc.rect(50, yPosition + 35, doc.page.width - 100, 3).fill(colors.gold);
          
          doc.font('Helvetica-Bold')
             .fontSize(14)
             .fillColor('white')
             .text(`Giorno ${day.day}`, 65, yPosition + 8);
          
          doc.font('Helvetica')
             .fontSize(11)
             .fillColor('white')
             .text(new Date(day.date).toLocaleDateString('it-IT', { 
               weekday: 'long', 
               year: 'numeric', 
               month: 'long', 
               day: 'numeric' 
             }), 65, yPosition + 22);

          yPosition += 50;

          // Activities
          if (day.activities && Array.isArray(day.activities)) {
            for (const activity of day.activities) {
              // Check if we need a new page
              if (yPosition > doc.page.height - 100) {
                doc.addPage();
                yPosition = 50;
              }

              // Activity card with elegant design
              doc.rect(60, yPosition, doc.page.width - 120, 50).fill(colors.lightAccent);
              doc.rect(60, yPosition, doc.page.width - 120, 50).stroke(colors.border);
              
              // Time badge
              doc.rect(70, yPosition + 8, 60, 16).fill(colors.gold);
              doc.font('Helvetica-Bold')
                 .fontSize(9)
                 .fillColor('white')
                 .text(activity.time, 75, yPosition + 12);

              // Activity name
              doc.font('Helvetica-Bold')
                 .fontSize(11)
                 .fillColor(colors.textDark)
                 .text(activity.activity, 140, yPosition + 10, { width: doc.page.width - 200 });

              // Location with subtle icon
              doc.font('Helvetica')
                 .fontSize(9)
                 .fillColor(colors.textLight)
                 .text(`📍 ${activity.location}`, 140, yPosition + 25);

              // Description
              if (activity.description) {
                doc.font('Helvetica')
                   .fontSize(9)
                   .fillColor(colors.textLight)
                   .text(activity.description, 140, yPosition + 37, { width: doc.page.width - 200 });
              }

              yPosition += 60; // Fixed spacing for activity cards
            }
          }

          yPosition += 20; // Space between days
        }
      }

      // Elegant footer
      const footerY = doc.page.height - 50;
      doc.rect(0, footerY, doc.page.width, 50).fill(colors.lightAccent);
      doc.rect(0, footerY, doc.page.width, 2).fill(colors.gold);
      
      doc.font('Helvetica')
         .fontSize(9)
         .fillColor(colors.textLight)
         .text(`Generato da ${hotel.name}`, 50, footerY + 15);
      
      doc.text(new Date().toLocaleDateString('it-IT'), 
               doc.page.width - 100, footerY + 15);
      
      doc.font('Helvetica-Bold')
         .fontSize(8)
         .fillColor(colors.primary)
         .text('ItineraItalia - Powered by AI', 
               50, footerY + 30, { align: 'center', width: doc.page.width - 100 });

      // Finalize the PDF
      doc.end();

      stream.on('finish', () => {
        resolve(`/uploads/pdfs/${fileName}`);
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
