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

      // Define colors (matching the design)
      const primaryColor = '#2C5530';
      const secondaryColor = '#D4AF37';
      const accentColor = '#8B4513';

      // Header with hotel branding
      doc.rect(0, 0, doc.page.width, 120).fill(primaryColor);
      
      doc.font('Helvetica-Bold')
         .fontSize(24)
         .fillColor('white')
         .text(hotel.name, 50, 30, { width: doc.page.width - 100 });

      doc.font('Helvetica')
         .fontSize(12)
         .text(hotel.address, 50, 60)
         .text(`${hotel.city}, ${hotel.region}`, 50, 75)
         .text(hotel.phone, 50, 90);

      // Itinerary title
      doc.font('Helvetica-Bold')
         .fontSize(18)
         .fillColor(primaryColor)
         .text(itinerary.title, 50, 150);

      // Guest information
      doc.font('Helvetica')
         .fontSize(10)
         .fillColor('black')
         .text(`Ospiti: ${guestProfile.referenceName} (${guestProfile.numberOfPeople} persone)`, 50, 180)
         .text(`Tipo: ${guestProfile.type}`, 50, 195)
         .text(`Check-in: ${new Date(guestProfile.checkInDate).toLocaleDateString('it-IT')}`, 50, 210)
         .text(`Check-out: ${new Date(guestProfile.checkOutDate).toLocaleDateString('it-IT')}`, 50, 225);

      // Description
      if (itinerary.description) {
        doc.font('Helvetica')
           .fontSize(11)
           .fillColor('#333')
           .text(itinerary.description, 50, 250, { width: doc.page.width - 100 });
      }

      let yPosition = 290;

      // Itinerary days
      if (itinerary.days && Array.isArray(itinerary.days)) {
        for (const day of itinerary.days) {
          // Check if we need a new page
          if (yPosition > doc.page.height - 150) {
            doc.addPage();
            yPosition = 50;
          }

          // Day header
          doc.rect(50, yPosition, doc.page.width - 100, 30).fill(secondaryColor);
          doc.font('Helvetica-Bold')
             .fontSize(14)
             .fillColor('white')
             .text(`Giorno ${day.day} - ${new Date(day.date).toLocaleDateString('it-IT', { 
               weekday: 'long', 
               year: 'numeric', 
               month: 'long', 
               day: 'numeric' 
             })}`, 60, yPosition + 8);

          yPosition += 45;

          // Activities
          if (day.activities && Array.isArray(day.activities)) {
            for (const activity of day.activities) {
              // Check if we need a new page
              if (yPosition > doc.page.height - 100) {
                doc.addPage();
                yPosition = 50;
              }

              // Time
              doc.font('Helvetica-Bold')
                 .fontSize(12)
                 .fillColor(accentColor)
                 .text(activity.time, 60, yPosition);

              // Activity name
              doc.font('Helvetica-Bold')
                 .fontSize(11)
                 .fillColor('black')
                 .text(activity.activity, 120, yPosition, { width: 350 });

              yPosition += 15;

              // Location
              doc.font('Helvetica')
                 .fontSize(10)
                 .fillColor('#666')
                 .text(`📍 ${activity.location}`, 120, yPosition);

              yPosition += 15;

              // Description
              if (activity.description) {
                doc.font('Helvetica')
                   .fontSize(10)
                   .fillColor('#333')
                   .text(activity.description, 120, yPosition, { width: 350 });
                yPosition += 15;
              }

              // Duration and notes
              if (activity.duration || activity.notes) {
                doc.font('Helvetica')
                   .fontSize(9)
                   .fillColor('#999');
                
                if (activity.duration) {
                  doc.text(`⏱ Durata: ${activity.duration}`, 120, yPosition);
                  yPosition += 12;
                }
                
                if (activity.notes) {
                  doc.text(`📝 ${activity.notes}`, 120, yPosition);
                  yPosition += 12;
                }
              }

              yPosition += 10; // Space between activities
            }
          }

          yPosition += 20; // Space between days
        }
      }

      // Footer
      doc.font('Helvetica')
         .fontSize(8)
         .fillColor('#666')
         .text(`Generato da ${hotel.name} - ${new Date().toLocaleDateString('it-IT')}`, 
               50, doc.page.height - 30, { align: 'center', width: doc.page.width - 100 });

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
