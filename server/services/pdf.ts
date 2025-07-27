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

      // Define colors (inspired by the elegant restaurant menu design)
      const colors = {
        darkGreen: '#4A5D23',     // Deep olive green from header
        goldAccent: '#B8860B',    // Elegant gold for accents
        creamBg: '#F5F5DC',       // Warm cream/beige background
        lightBeige: '#F9F7F4',    // Very light beige sections
        textDark: '#2C2C2C',      // Almost black for main text
        textMedium: '#5A5A5A',    // Medium gray for secondary text
        textLight: '#8A8A8A',     // Light gray for subtle text
        borderLight: '#E8E6E1',   // Very light border color
        white: '#FFFFFF'          // Pure white for contrast
      };

      // Create elegant header inspired by the restaurant menu design
      // Background pattern area (top section with decorative elements)
      doc.rect(0, 0, doc.page.width, 120).fill(colors.darkGreen);
      
      // Add subtle decorative elements (simple lines to mimic the leaf pattern)
      doc.strokeColor(colors.goldAccent).lineWidth(1);
      for (let i = 0; i < 8; i++) {
        const x = 60 + (i * 60);
        const y = 15 + (i % 2) * 10;
        // Simple curved lines as decoration
        doc.moveTo(x, y).lineTo(x + 25, y + 8).lineTo(x + 15, y + 20).stroke();
      }
      
      // Hotel name in elegant style (centered golden banner)
      const bannerWidth = 300;
      const bannerX = (doc.page.width - bannerWidth) / 2;
      doc.rect(bannerX, 45, bannerWidth, 50).fill(colors.goldAccent);
      
      doc.font('Helvetica-Bold')
         .fontSize(28)
         .fillColor(colors.white)
         .text(hotel.name.toUpperCase(), 0, 65, { 
           width: doc.page.width, 
           align: 'center'
         });
         
      // Small subtitle under hotel name
      doc.font('Helvetica')
         .fontSize(11)
         .fillColor(colors.white)
         .text('ITINERARIO PERSONALIZZATO', 0, 90, { 
           width: doc.page.width, 
           align: 'center'
         });

      // Main content area starts with cream background
      doc.rect(0, 120, doc.page.width, doc.page.height - 120).fill(colors.creamBg);
      
      // Guest information section (two columns like the menu)
      const leftColumnX = 60;
      const rightColumnX = 320;
      const startY = 150;
      
      // Left column - Guest details
      doc.font('Helvetica-Bold')
         .fontSize(18)
         .fillColor(colors.goldAccent)
         .text('ospite', leftColumnX, startY);
         
      doc.font('Helvetica-Bold')
         .fontSize(14)
         .fillColor(colors.textDark)
         .text(guestProfile.referenceName, leftColumnX, startY + 25);
         
      doc.font('Helvetica')
         .fontSize(10)
         .fillColor(colors.textMedium)
         .text(`Tipo di soggiorno: ${guestProfile.type}`, leftColumnX, startY + 45);
         
      if (guestProfile.numberOfGuests) {
        doc.text(`Numero ospiti: ${guestProfile.numberOfGuests}`, leftColumnX, startY + 60);
      }
      
      // Right column - Stay details  
      doc.font('Helvetica-Bold')
         .fontSize(18)
         .fillColor(colors.goldAccent)
         .text('soggiorno', rightColumnX, startY);
         
      if (guestProfile.checkInDate && guestProfile.checkOutDate) {
        const checkIn = new Date(guestProfile.checkInDate).toLocaleDateString('it-IT');
        const checkOut = new Date(guestProfile.checkOutDate).toLocaleDateString('it-IT');
        
        doc.font('Helvetica')
           .fontSize(10)
           .fillColor(colors.textMedium)
           .text(`Check-in: ${checkIn}`, rightColumnX, startY + 25)
           .text(`Check-out: ${checkOut}`, rightColumnX, startY + 40);
      }
      
      // Add thin separator line like in the menu
      doc.strokeColor(colors.borderLight).lineWidth(0.5)
         .moveTo(60, startY + 90).lineTo(doc.page.width - 60, startY + 90).stroke();
      
      let yPosition = startY + 120;

      // Title of the itinerary (center aligned like menu sections)
      doc.font('Helvetica-Bold')
         .fontSize(24)
         .fillColor(colors.goldAccent)
         .text(itinerary.title || 'il tuo itinerario', 0, yPosition, { 
           width: doc.page.width, 
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
            // Add cream background to new page
            doc.rect(0, 0, doc.page.width, doc.page.height).fill(colors.creamBg);
            yPosition = 60;
          }

          // Day title (like "antipasti", "le specialità dello chef" in the menu)
          doc.font('Helvetica-Bold')
             .fontSize(22)
             .fillColor(colors.goldAccent)
             .text(`giorno ${dayIndex + 1}`, leftColumnX, yPosition);
          
          // Day description/date in smaller text
          if (day.date) {
            doc.font('Helvetica')
               .fontSize(10)
               .fillColor(colors.textMedium)
               .text(new Date(day.date).toLocaleDateString('it-IT', { 
                 weekday: 'long', 
                 day: 'numeric',
                 month: 'long'
               }), leftColumnX, yPosition + 25);
          }

          yPosition += 55;

          // Activities (styled like menu items with two columns)
          if (day.activities && Array.isArray(day.activities)) {
            let currentColumn = 'left';
            let columnY = yPosition;
            
            for (let actIndex = 0; actIndex < day.activities.length; actIndex++) {
              const activity = day.activities[actIndex];
              
              // Check if we need a new page
              if (columnY > doc.page.height - 120) {
                doc.addPage();
                // Add cream background to new page
                doc.rect(0, 0, doc.page.width, doc.page.height).fill(colors.creamBg);
                columnY = 60;
                currentColumn = 'left';
              }

              const columnX = currentColumn === 'left' ? leftColumnX : rightColumnX;
              const columnWidth = 220;

              // Activity name (bold like menu items)
              doc.font('Helvetica-Bold')
                 .fontSize(13)
                 .fillColor(colors.textDark)
                 .text(activity.activity, columnX, columnY);

              // Activity description (smaller italic-like text)
              let descriptionY = columnY + 18;
              if (activity.description) {
                doc.font('Helvetica')
                   .fontSize(9)
                   .fillColor(colors.textMedium)
                   .text(activity.description, columnX, descriptionY, { width: columnWidth - 20 });
                descriptionY += 25;
              }

              // Time and location details (like ingredients/price in menu)
              if (activity.time) {
                doc.font('Helvetica')
                   .fontSize(9)
                   .fillColor(colors.textLight)
                   .text(`Orario: ${activity.time}`, columnX, descriptionY);
                descriptionY += 12;
              }

              if (activity.location) {
                doc.font('Helvetica')
                   .fontSize(9)
                   .fillColor(colors.textLight)
                   .text(`Dove: ${activity.location}`, columnX, descriptionY);
                descriptionY += 12;
              }

              // Price/number like in menu (right aligned)
              if (activity.time) {
                doc.font('Helvetica')
                   .fontSize(10)
                   .fillColor(colors.goldAccent)
                   .text(activity.time, columnX + columnWidth - 40, columnY);
              }

              // Switch column or move to next row
              if (currentColumn === 'left') {
                currentColumn = 'right';
              } else {
                currentColumn = 'left';
                columnY = Math.max(columnY + 80, descriptionY + 15);
              }
            }
            
            // Adjust yPosition for next section
            yPosition = columnY + (currentColumn === 'right' ? 80 : 40);
          }

          yPosition += 20; // Space between days
        }
      }

      // Elegant footer (minimal like the menu)
      const footerY = doc.page.height - 40;
      
      // Thin line separator
      doc.strokeColor(colors.borderLight).lineWidth(0.5)
         .moveTo(60, footerY).lineTo(doc.page.width - 60, footerY).stroke();
      
      // Hotel name and generation info
      doc.font('Helvetica')
         .fontSize(8)
         .fillColor(colors.textLight)
         .text(`${hotel.name} - ${hotel.city}`, 60, footerY + 10);
      
      doc.text(`Generato il ${new Date().toLocaleDateString('it-IT')}`, 
               doc.page.width - 150, footerY + 10);
      
      // Centered branding
      doc.font('Helvetica')
         .fontSize(8)
         .fillColor(colors.goldAccent)
         .text('ItineraItalia - Itinerari Personalizzati con AI', 0, footerY + 22, { 
           align: 'center', 
           width: doc.page.width 
         });

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
