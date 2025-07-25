import { Resend } from 'resend';
import type { Hotel, GuestProfile } from '@shared/schema';

// Inizializza Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Email templates per lingua
const EMAIL_TEMPLATES = {
  it: {
    subject: (hotelName: string) => `Personalizza il tuo soggiorno - ${hotelName}`,
    greeting: (name: string) => `🏨 Benvenuto/a ${name}!`,
    subtitle: (hotelName: string) => `Personalizza il tuo soggiorno presso ${hotelName}`,
    salutation: (name: string) => `Caro/a ${name},`,
    welcomeText: (hotelName: string, checkin: string, checkout: string) => 
      `Siamo entusiasti di accoglierti presso <strong>${hotelName}</strong> dal <strong>${checkin}</strong> al <strong>${checkout}</strong>!`,
    bookingDetails: "📋 I tuoi dati di prenotazione:",
    bookingFields: {
      name: "Nome prenotazione:",
      people: "Numero persone:",
      checkin: "Check-in:",
      checkout: "Check-out:"
    },
    description: "Per rendere il tuo soggiorno indimenticabile, vorremmo conoscere le tue preferenze di viaggio. Compilando il nostro breve questionario, potremo creare un <strong>itinerario personalizzato</strong> con le migliori esperienze locali adatte ai tuoi gusti.",
    ctaButton: "✨ Compila le tue preferenze",
    whyTitle: "Perché compilare il questionario?",
    benefits: [
      "🎯 Suggerimenti personalizzati basati sui tuoi interessi",
      "🍕 Ristoranti e esperienze culinarie su misura", 
      "🏛️ Attrazioni culturali adatte al tuo stile",
      "🌅 Attività outdoor e relax secondo le tue preferenze",
      "📱 Accesso facile tramite QR code durante il soggiorno"
    ],
    timeNote: "Il questionario richiede solo <strong>5 minuti</strong> e farà la differenza nel tuo soggiorno!",
    closing: "Con affetto,"
  },
  en: {
    subject: (hotelName: string) => `Customize your stay - ${hotelName}`,
    greeting: (name: string) => `🏨 Welcome ${name}!`,
    subtitle: (hotelName: string) => `Personalize your stay at ${hotelName}`,
    salutation: (name: string) => `Dear ${name},`,
    welcomeText: (hotelName: string, checkin: string, checkout: string) => 
      `We're thrilled to welcome you to <strong>${hotelName}</strong> from <strong>${checkin}</strong> to <strong>${checkout}</strong>!`,
    bookingDetails: "📋 Your booking details:",
    bookingFields: {
      name: "Booking name:",
      people: "Number of people:",
      checkin: "Check-in:",
      checkout: "Check-out:"
    },
    description: "To make your stay unforgettable, we'd love to know your travel preferences. By completing our brief questionnaire, we can create a <strong>personalized itinerary</strong> with the best local experiences tailored to your tastes.",
    ctaButton: "✨ Share your preferences",
    whyTitle: "Why complete the questionnaire?",
    benefits: [
      "🎯 Personalized suggestions based on your interests",
      "🍕 Restaurants and culinary experiences tailored for you",
      "🏛️ Cultural attractions that match your style", 
      "🌅 Outdoor activities and relaxation based on your preferences",
      "📱 Easy access via QR code during your stay"
    ],
    timeNote: "The questionnaire takes only <strong>5 minutes</strong> and will make all the difference in your stay!",
    closing: "With warm regards,"
  }
};

export async function sendGuestPreferencesEmail(
  hotel: Hotel,
  guestProfile: GuestProfile,
  preferencesToken: string
): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY non configurata. Email non inviata.');
    return false;
  }

  try {
    const language = guestProfile.emailLanguage || 'it';
    const template = EMAIL_TEMPLATES[language as keyof typeof EMAIL_TEMPLATES];
    
    const baseUrl = process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000';
    const preferencesUrl = `https://${baseUrl}/guest-preferences/${preferencesToken}`;
    
    const checkinDate = new Date(guestProfile.checkInDate).toLocaleDateString(language === 'it' ? 'it-IT' : 'en-US');
    const checkoutDate = new Date(guestProfile.checkOutDate).toLocaleDateString(language === 'it' ? 'it-IT' : 'en-US');
    
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${template.subject(hotel.name)}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 0 auto; background-color: white; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
    .content { padding: 30px; }
    .button { 
      display: inline-block; 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
      color: white; 
      padding: 15px 30px; 
      text-decoration: none; 
      border-radius: 8px; 
      font-weight: bold; 
      margin: 20px 0;
      text-align: center;
    }
    .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; }
    .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
    .highlight { background-color: #e8f4fd; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0; }
    .details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #667eea; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">${hotel.name}</div>
      <h1>${template.greeting(guestProfile.referenceName)}</h1>
      <p>${template.subtitle(hotel.name)}</p>
    </div>
    
    <div class="content">
      <p>${template.salutation(guestProfile.referenceName)}</p>
      
      <p>${template.welcomeText(hotel.name, checkinDate, checkoutDate)}</p>
      
      <div class="details">
        <h3>${template.bookingDetails}</h3>
        <ul>
          <li><strong>${template.bookingFields.name}</strong> ${guestProfile.referenceName}</li>
          <li><strong>${template.bookingFields.people}</strong> ${guestProfile.numberOfPeople}</li>
          <li><strong>${template.bookingFields.checkin}</strong> ${checkinDate}</li>
          <li><strong>${template.bookingFields.checkout}</strong> ${checkoutDate}</li>
        </ul>
      </div>
      
      <p>${template.description}</p>
      
      <div style="text-align: center;">
        <a href="${preferencesUrl}" class="button">
          ${template.ctaButton}
        </a>
      </div>
      
      <p><strong>${template.whyTitle}</strong></p>
      <ul>
        ${template.benefits.map(benefit => `<li>${benefit}</li>`).join('')}
      </ul>
      
      <p>${template.timeNote}</p>
    </div>
    
    <div class="footer">
      <p>${template.closing}<br><strong>Team ${hotel.name}</strong></p>
      <p style="font-size: 12px; color: #999;">
        ${hotel.city}, ${hotel.region}<br>
        📧 ${hotel.email} | 📞 ${hotel.phone}
      </p>
    </div>
  </div>
</body>
</html>`;

    const { data, error } = await resend.emails.send({
      from: `${hotel.name} <onboarding@resend.dev>`, // Usa l'email di default di Resend
      to: [guestProfile.email!],
      subject: template.subject(hotel.name),
      html: htmlContent,
    });

    if (error) {
      console.error('Errore Resend:', error);
      return false;
    }

    if (data?.id) {
      console.log(`Email preferenze inviata con successo a ${guestProfile.email} per ospite ${guestProfile.referenceName}`);
      console.log('Email ID:', data.id);
      return true;
    }

    return false;
  } catch (error: any) {
    console.error('Errore invio email:', error);
    return false;
  }
}