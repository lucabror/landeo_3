import QRCode from "qrcode";
import type { Hotel } from "@shared/schema";
import fs from "fs/promises";
import path from "path";

export async function generateQRCode(uniqueUrl: string, hotel: Hotel): Promise<string> {
  try {
    // Get domain from environment or use default
    const domains = process.env.REPLIT_DOMAINS || "localhost:5000";
    const domain = domains.split(',')[0];
    const protocol = domain.includes('localhost') ? 'http' : 'https';
    const fullUrl = `${protocol}://${domain}/itinerary/${uniqueUrl}`;

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(fullUrl, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#2C5530', // Primary green color
        light: '#FFFFFF'
      },
      width: 256
    });

    // Create directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'uploads', 'qr-codes');
    await fs.mkdir(uploadsDir, { recursive: true });

    // Save QR code to file
    const fileName = `qr-${uniqueUrl}.png`;
    const filePath = path.join(uploadsDir, fileName);
    
    // Extract base64 data and save to file
    const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');
    await fs.writeFile(filePath, base64Data, 'base64');

    // Return the public URL
    return `/uploads/qr-codes/${fileName}`;
  } catch (error) {
    console.error("QR Code generation error:", error);
    throw new Error("Failed to generate QR code: " + (error instanceof Error ? error.message : String(error)));
  }
}
