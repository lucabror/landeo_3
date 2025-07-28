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

      // Define elegant and sober colors - light and readable
      const colors = {
        headerLight: '#F8F6F3',   // Very light beige for header
        accentGold: '#D4AF37',    // Soft elegant gold for accents
        backgroundCream: '#FEFDFB', // Almost white cream background
        lightGray: '#F5F5F5',     // Very light gray sections
        textBlack: '#1F1F1F',     // Clean black for main text
        textGray: '#4A4A4A',      // Medium gray for secondary text
        textLight: '#7A7A7A',     // Light gray for subtle elements
        borderSoft: '#E5E5E5',    // Soft light border
        white: '#FFFFFF'          // Pure white
      };

      // Create elegant and sober header with light colors
      // Light beige header background
      doc.rect(0, 0, doc.page.width, 100).fill(colors.headerLight);
      
      // Add subtle border line at bottom of header
      doc.strokeColor(colors.borderSoft).lineWidth(1);
      doc.moveTo(0, 100).lineTo(doc.page.width, 100).stroke();
      
      // Hotel name in elegant centered style - dark text on light background
      doc.font('Helvetica-Bold')
         .fontSize(24)
         .fillColor(colors.textBlack)
         .text(hotel.name.toUpperCase(), 0, 35, { 
           width: doc.page.width, 
           align: 'center'
         });
         
      // Elegant subtitle under hotel name with soft gold accent
      doc.font('Helvetica')
         .fontSize(10)
         .fillColor(colors.accentGold)
         .text('ITINERARIO PERSONALIZZATO', 0, 65, { 
           width: doc.page.width, 
           align: 'center'
         });

      // Main content area with clean white background
      doc.rect(0, 100, doc.page.width, doc.page.height - 100).fill(colors.white);
      
      // Guest information section with elegant light gray boxes
      const leftColumnX = 60;
      const rightColumnX = 320;
      const startY = 130;
      
      // Left column - Guest details in light gray box
      doc.rect(leftColumnX - 10, startY - 5, 220, 80).fill(colors.lightGray);
      
      doc.font('Helvetica-Bold')
         .fontSize(14)
         .fillColor(colors.accentGold)
         .text('OSPITE', leftColumnX, startY + 5);
         
      doc.font('Helvetica-Bold')
         .fontSize(12)
         .fillColor(colors.textBlack)
         .text(guestProfile.referenceName, leftColumnX, startY + 25);
         
      doc.font('Helvetica')
         .fontSize(9)
         .fillColor(colors.textGray)
         .text(`Tipo di soggiorno: ${guestProfile.type}`, leftColumnX, startY + 45);
         
      if (guestProfile.numberOfGuests) {
        doc.text(`Numero ospiti: ${guestProfile.numberOfGuests}`, leftColumnX, startY + 58);
      }
      
      // Right column - Stay details in light beige box
      doc.rect(rightColumnX - 10, startY - 5, 200, 80).fill(colors.backgroundCream);
      
      doc.font('Helvetica-Bold')
         .fontSize(14)
         .fillColor(colors.accentGold)
         .text('SOGGIORNO', rightColumnX, startY + 5);
         
      if (guestProfile.checkInDate && guestProfile.checkOutDate) {
        const checkIn = new Date(guestProfile.checkInDate).toLocaleDateString('it-IT');
        const checkOut = new Date(guestProfile.checkOutDate).toLocaleDateString('it-IT');
        
        doc.font('Helvetica')
           .fontSize(9)
           .fillColor(colors.textGray)
           .text(`Check-in: ${checkIn}`, rightColumnX, startY + 25)
           .text(`Check-out: ${checkOut}`, rightColumnX, startY + 42);
      }
      
      // Add subtle separator line with soft border
      doc.strokeColor(colors.borderSoft).lineWidth(0.5)
         .moveTo(60, startY + 90).lineTo(doc.page.width - 60, startY + 90).stroke();
      
      let yPosition = startY + 120;

      // Title of the itinerary with elegant styling
      doc.font('Helvetica-Bold')
         .fontSize(20)
         .fillColor(colors.textBlack)
         .text(itinerary.title || 'IL TUO ITINERARIO', 0, yPosition, { 
           width: doc.page.width, 
           align: 'center'
         });
      
      yPosition += 40;

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

          // Day title with elegant styling
          doc.font('Helvetica-Bold')
             .fontSize(16)
             .fillColor(colors.accentGold)
             .text(`GIORNO ${dayIndex + 1}`, leftColumnX, yPosition);
          
          // Day description/date in readable gray text
          if (day.date) {
            doc.font('Helvetica')
               .fontSize(9)
               .fillColor(colors.textGray)
               .text(new Date(day.date).toLocaleDateString('it-IT', { 
                 weekday: 'long', 
                 day: 'numeric',
                 month: 'long'
               }), leftColumnX, yPosition + 20);
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
                // Add clean white background to new page
                doc.rect(0, 0, doc.page.width, doc.page.height).fill(colors.white);
                columnY = 60;
                currentColumn = 'left';
              }

              const columnX = currentColumn === 'left' ? leftColumnX : rightColumnX;
              const columnWidth = 220;

              // Activity card with light background
              doc.rect(columnX - 5, columnY - 3, columnWidth + 10, 70).fill(colors.lightGray);

              // Activity name with clear black text
              doc.font('Helvetica-Bold')
                 .fontSize(11)
                 .fillColor(colors.textBlack)
                 .text(activity.activity, columnX, columnY + 3);

              // Source label (preference-matched vs hotel-suggested)
              let labelY = columnY + 15;
              if (activity.source === 'preference-matched') {
                doc.font('Helvetica-Bold')
                   .fontSize(7)
                   .fillColor('#16a34a')
                   .text('🎯 Scelta sulle tue preferenze', columnX, labelY);
                labelY += 10;
              } else if (activity.source === 'hotel-suggested') {
                doc.font('Helvetica-Bold')
                   .fontSize(7)
                   .fillColor('#2563eb')
                   .text('🏨 Suggerita dall\'hotel', columnX, labelY);
                labelY += 10;
              }

              // Activity description with readable gray text  
              let descriptionY = labelY + 3;
              if (activity.description) {
                doc.font('Helvetica')
                   .fontSize(8)
                   .fillColor(colors.textGray)
                   .text(activity.description, columnX, descriptionY, { width: columnWidth - 15 });
                descriptionY += 20;
              }

              // Time and location with subtle styling
              if (activity.time) {
                doc.font('Helvetica')
                   .fontSize(8)
                   .fillColor(colors.textLight)
                   .text(`Orario: ${activity.time}`, columnX, descriptionY);
                descriptionY += 10;
              }

              if (activity.location) {
                doc.font('Helvetica')
                   .fontSize(8)
                   .fillColor(colors.textLight)
                   .text(`Dove: ${activity.location}`, columnX, descriptionY);
                descriptionY += 10;
              }

              // Time badge with elegant styling
              if (activity.time) {
                doc.font('Helvetica-Bold')
                   .fontSize(8)
                   .fillColor(colors.accentGold)
                   .text(activity.time, columnX + columnWidth - 50, columnY + 3);
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

      // Clean and minimal footer
      const footerY = doc.page.height - 35;
      
      // Subtle separator line
      doc.strokeColor(colors.borderSoft).lineWidth(0.5)
         .moveTo(60, footerY).lineTo(doc.page.width - 60, footerY).stroke();
      
      // Hotel info and generation date with readable text
      doc.font('Helvetica')
         .fontSize(8)
         .fillColor(colors.textGray)
         .text(`${hotel.name} - ${hotel.city}`, 60, footerY + 8);
      
      doc.text(`Generato il ${new Date().toLocaleDateString('it-IT')}`, 
               doc.page.width - 130, footerY + 8);
      
      // Elegant centered branding
      doc.font('Helvetica')
         .fontSize(7)
         .fillColor(colors.textLight)
         .text('AiTour - Itinerari Personalizzati con AI', 0, footerY + 18, { 
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
