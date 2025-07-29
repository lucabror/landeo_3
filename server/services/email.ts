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

// Funzione per sanitizzare input email per prevenire email injection
function sanitizeEmailInput(input: string): string {
  if (!input) return '';
  return input
    .replace(/[\r\n]/g, '') // Rimuovi newlines che possono causare header injection
    .replace(/[<>]/g, '') // Rimuovi caratteri che possono causare problemi
    .trim()
    .substring(0, 254); // Limita lunghezza email
}

function sanitizeHtmlContent(input: string): string {
  if (!input) return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Rimuovi script tags
    .replace(/javascript:/gi, '') // Rimuovi javascript: urls
    .replace(/on\w+\s*=/gi, '') // Rimuovi event handlers
    .trim();
}

export async function sendGuestPreferencesEmail(
  hotel: Hotel,
  guestProfile: GuestProfile,
  preferencesToken: string
): Promise<{success: boolean, error?: string}> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY non configurata. Email non inviata.');
    return {success: false, error: 'RESEND_API_KEY non configurata'};
  }

  try {
    const language = guestProfile.emailLanguage || 'it';
    const template = EMAIL_TEMPLATES[language as keyof typeof EMAIL_TEMPLATES];
    
    const baseUrl = process.env.REPLIT_DOMAINS 
      ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` 
      : 'http://localhost:5000';
    const preferencesUrl = `${baseUrl}/guest-preferences/${preferencesToken}`;
    
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
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif; 
      line-height: 1.6; 
      color: #1f2937; 
      margin: 0; 
      padding: 0; 
      background: linear-gradient(to bottom right, #fafaf9, #fffbeb, #f9fafb);
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      background-color: white; 
      border-radius: 12px; 
      overflow: hidden; 
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      margin-top: 20px;
      margin-bottom: 20px;
    }
    .header { 
      background: linear-gradient(135deg, #b45309 0%, #92400e 100%); 
      color: white; 
      padding: 40px 30px; 
      text-align: center; 
      position: relative;
    }
    .header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 20"><defs><pattern id="grain" patternUnits="userSpaceOnUse" width="100" height="20"><rect width="100" height="20" fill="%23ffffff" opacity="0.03"/></pattern></defs><rect width="100" height="20" fill="url(%23grain)"/></svg>');
      opacity: 0.3;
    }
    .header-content { position: relative; z-index: 1; }
    .content { padding: 40px 30px; }
    .button { 
      display: inline-block; 
      background: linear-gradient(135deg, #b45309 0%, #92400e 100%); 
      color: white !important; 
      padding: 16px 32px; 
      text-decoration: none !important; 
      border-radius: 12px; 
      font-weight: 600; 
      margin: 24px 0;
      text-align: center;
      box-shadow: 0 4px 12px rgba(180, 83, 9, 0.3);
      transition: all 0.2s ease;
    }
    .button:hover {
      background: linear-gradient(135deg, #92400e 0%, #78350f 100%) !important;
      color: white !important;
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(180, 83, 9, 0.4);
      text-decoration: none !important;
    }
    .button:visited {
      color: white !important;
      text-decoration: none !important;
    }
    .button:link {
      color: white !important;
      text-decoration: none !important;
    }
    .footer { 
      background: linear-gradient(to right, #fafaf9, #fffbeb); 
      padding: 30px; 
      text-align: center; 
      color: #6b7280; 
      border-top: 1px solid #f3f4f6;
    }
    .logo { 
      font-size: 28px; 
      font-weight: 700; 
      margin-bottom: 12px; 
      background: linear-gradient(135deg, #ffffff 0%, #fef3c7 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .highlight { 
      background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); 
      padding: 20px; 
      border-left: 4px solid #f59e0b; 
      margin: 24px 0; 
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(245, 158, 11, 0.1);
    }
    .details { 
      background: linear-gradient(135deg, #fafaf9 0%, #f9fafb 100%); 
      padding: 24px; 
      border-radius: 12px; 
      margin: 24px 0; 
      border-left: 4px solid #d97706;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }
    .benefit-item {
      display: flex;
      align-items: center;
      margin: 12px 0;
      padding: 8px 0;
    }
    .benefit-icon {
      margin-right: 12px;
      font-size: 18px;
    }
    .subtitle {
      color: #fef3c7;
      font-size: 18px;
      margin-top: 8px;
      font-weight: 400;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-content">
        <div class="logo">${hotel.name}</div>
        <h1 style="margin: 0; font-size: 32px; font-weight: 700;">${template.greeting(guestProfile.referenceName)}</h1>
        <p class="subtitle">${template.subtitle(hotel.name)}</p>
      </div>
    </div>
    
    <div class="content">
      <p style="font-size: 18px; margin-bottom: 24px; color: #374151;">${template.salutation(guestProfile.referenceName)}</p>
      
      <p style="font-size: 16px; margin-bottom: 24px; color: #4b5563;">${template.welcomeText(hotel.name, checkinDate, checkoutDate)}</p>
      
      <div class="details">
        <h3 style="margin-top: 0; color: #92400e; font-size: 18px; font-weight: 600;">${template.bookingDetails}</h3>
        <div style="display: grid; gap: 8px;">
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6;">
            <span style="font-weight: 600; color: #374151;">${template.bookingFields.name}</span>
            <span style="color: #6b7280;">${guestProfile.referenceName}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6;">
            <span style="font-weight: 600; color: #374151;">${template.bookingFields.people}</span>
            <span style="color: #6b7280;">${guestProfile.numberOfPeople}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6;">
            <span style="font-weight: 600; color: #374151;">${template.bookingFields.checkin}</span>
            <span style="color: #6b7280;">${checkinDate}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px 0;">
            <span style="font-weight: 600; color: #374151;">${template.bookingFields.checkout}</span>
            <span style="color: #6b7280;">${checkoutDate}</span>
          </div>
        </div>
      </div>
      
      <div class="highlight">
        <p style="margin: 0; font-size: 16px; color: #92400e; font-weight: 500;">${template.description}</p>
      </div>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${preferencesUrl}" class="button">
          ${template.ctaButton}
        </a>
      </div>
      
      <h3 style="color: #92400e; font-size: 18px; font-weight: 600; margin-bottom: 16px;">${template.whyTitle}</h3>
      <div style="margin-bottom: 24px;">
        ${template.benefits.map(benefit => `
          <div class="benefit-item">
            <span class="benefit-icon">${benefit.charAt(0)}</span>
            <span style="color: #4b5563;">${benefit.substring(2)}</span>
          </div>
        `).join('')}
      </div>
      
      <p style="font-size: 14px; color: #6b7280; font-style: italic; margin-top: 24px;">${template.timeNote}</p>
    </div>
    
    <div class="footer">
      <div style="margin-bottom: 16px;">
        <p style="margin: 0; font-size: 16px; color: #374151; font-weight: 600;">${template.closing}</p>
        <p style="margin: 4px 0 0 0; font-size: 16px; color: #92400e; font-weight: 700;">Team ${hotel.name}</p>
      </div>
      <div style="padding-top: 16px; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0; font-size: 13px; color: #9ca3af;">
          📍 ${hotel.city}, ${hotel.region}<br>
          📧 ${hotel.email} • 📞 ${hotel.phone}
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;

    // Sanitizza input critici
    const sanitizedEmail = sanitizeEmailInput(guestProfile.email || '');
    const sanitizedHotelName = sanitizeHtmlContent(hotel.name);
    const sanitizedGuestName = sanitizeHtmlContent(guestProfile.referenceName);
    
    if (!sanitizedEmail || !sanitizedEmail.includes('@')) {
      return { success: false, error: 'Email non valida' };
    }

    const { data, error } = await resend.emails.send({
      from: `${sanitizedHotelName} <onboarding@resend.dev>`,
      to: [sanitizedEmail],
      subject: template.subject(sanitizedHotelName),
      html: htmlContent,
    });

    if (error) {
      console.error('Errore Resend:', error);
      if (error.message?.includes('You can only send testing emails')) {
        return {success: false, error: 'Domain not verified. Please verify your domain in Resend to send emails to other recipients.'};
      }
      return {success: false, error: error.message || 'Email sending failed'};
    }

    if (data?.id) {
      console.log(`Email preferenze inviata con successo a ${guestProfile.email} per ospite ${guestProfile.referenceName}`);
      console.log('Email ID:', data.id);
      return {success: true};
    }

    return {success: false, error: 'Unknown error occurred'};
  } catch (error: any) {
    console.error('Errore invio email:', error);
    return {success: false, error: error.message || 'Email sending failed'};
  }
}

// Multilingual templates for PDF itinerary emails
const PDF_EMAIL_TEMPLATES = {
  it: {
    title: 'Il tuo Itinerario Personalizzato',
    greeting: (name: string) => `Caro/a <strong>${name}</strong>`,
    mainText: (hotelName: string) => `Siamo entusiasti di condividere con te il tuo <strong>itinerario personalizzato</strong> per il soggiorno presso ${hotelName}!`,
    readyForStay: 'Pronti per un soggiorno indimenticabile',
    stayDetails: 'Dettagli del Soggiorno',
    period: 'Periodo:',
    itinerary: 'Itinerario:',
    people: 'Persone:',
    howToUse: 'Come Utilizzare il Tuo Itinerario',
    howToUseText: 'L\'itinerario completo è allegato in formato PDF. Puoi:',
    print: 'Stamparlo per averlo sempre con te',
    save: 'Salvarlo sul telefone per accesso offline',
    share: 'Condividerlo con i tuoi compagni di viaggio',
    support: 'Se hai domande o necessiti di modifiche all\'itinerario, non esitare a contattarci. Il nostro team è sempre a disposizione per rendere il tuo soggiorno perfetto!',
    farewell: 'Buon viaggio!',
    team: 'Team',
    generated: 'Questo itinerario è stato generato automaticamente in base alle tue preferenze'
  },
  en: {
    title: 'Your Personalized Itinerary',
    greeting: (name: string) => `Dear <strong>${name}</strong>`,
    mainText: (hotelName: string) => `We're excited to share your <strong>personalized itinerary</strong> for your stay at ${hotelName}!`,
    readyForStay: 'Ready for an unforgettable stay',
    stayDetails: 'Stay Details',
    period: 'Period:',
    itinerary: 'Itinerary:',
    people: 'People:',
    howToUse: 'How to Use Your Itinerary',
    howToUseText: 'The complete itinerary is attached as a PDF. You can:',
    print: 'Print it to have it always with you',
    save: 'Save it on your phone for offline access',
    share: 'Share it with your travel companions',
    support: 'If you have questions or need changes to the itinerary, don\'t hesitate to contact us. Our team is always available to make your stay perfect!',
    farewell: 'Have a great trip!',
    team: 'Team',
    generated: 'This itinerary was automatically generated based on your preferences'
  }
};

export async function sendItineraryPDF(
  hotel: Hotel,
  guestProfile: any,
  itinerary: any,
  pdfBuffer: Buffer,
  recipientEmail: string,
  recipientName: string
): Promise<{success: boolean, error?: string}> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY non configurata. Email non inviata.');
    return {success: false, error: 'RESEND_API_KEY non configurata'};
  }

  try {
    // Determine language from guest profile
    const language = (guestProfile?.emailLanguage || 'it') as 'it' | 'en';
    const template = PDF_EMAIL_TEMPLATES[language];
    const locale = language === 'it' ? 'it-IT' : 'en-US';
    
    const checkinDate = guestProfile?.checkInDate ? new Date(guestProfile.checkInDate).toLocaleDateString(locale) : 'N/A';
    const checkoutDate = guestProfile?.checkOutDate ? new Date(guestProfile.checkOutDate).toLocaleDateString(locale) : 'N/A';

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${template.title} - ${hotel.name}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
    .content { padding: 30px; }
    .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
    .highlight { background-color: #e8f4fd; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 4px; }
    .itinerary-details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">${hotel.name}</div>
      <h1>🗺️ ${template.title}</h1>
      <p>${template.readyForStay}</p>
    </div>
    
    <div class="content">
      <p>${template.greeting(recipientName)},</p>
      
      <p>${template.mainText(hotel.name)}</p>
      
      <div class="itinerary-details">
        <h3>📋 ${template.stayDetails}</h3>
        <ul>
          <li><strong>${template.period}</strong> ${checkinDate} - ${checkoutDate}</li>
          <li><strong>${template.itinerary}</strong> ${itinerary.title}</li>
          <li><strong>${template.people}</strong> ${guestProfile?.numberOfPeople || 'N/A'}</li>
        </ul>
      </div>
      
      <div class="highlight">
        <h3>📱 ${template.howToUse}</h3>
        <p>${template.howToUseText}</p>
        <ul>
          <li>🖨️ <strong>${template.print}</strong></li>
          <li>📱 <strong>${template.save}</strong></li>
          <li>🔗 <strong>${template.share}</strong></li>
        </ul>
      </div>
      
      <p>${template.support}</p>
      
      <p>${template.farewell}<br>
      <strong>${template.team} ${hotel.name}</strong></p>
    </div>
    
    <div class="footer">
      <p>${hotel.city}, ${hotel.region}<br>
      📧 ${hotel.email} | 📞 ${hotel.phone}</p>
      <p>${template.generated}</p>
    </div>
  </div>
</body>
</html>`;

    const { data, error } = await resend.emails.send({
      from: `${hotel.name} <onboarding@resend.dev>`,
      to: [recipientEmail],
      subject: `🗺️ ${template.title} - ${hotel.name}`,
      html: htmlContent,
      attachments: [{
        filename: `Itinerario_${itinerary.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
        content: pdfBuffer,
      }],
    });

    if (error) {
      console.error('Errore Resend invio itinerario PDF:', error);
      if (error.message?.includes('You can only send testing emails')) {
        return {success: false, error: 'Domain not verified. Please verify your domain in Resend to send emails to other recipients.'};
      }
      return {success: false, error: error.message || 'Email sending failed'};
    }

    if (data?.id) {
      console.log(`Itinerario PDF inviato con successo a ${recipientEmail}`);
      console.log('Email ID:', data.id);
      return {success: true};
    }

    return {success: false, error: 'Unknown error occurred'};
  } catch (error: any) {
    console.error('Errore invio itinerario PDF:', error);
    return {success: false, error: error.message || 'Email sending failed'};
  }
}

export async function sendCreditPurchaseInstructions(
  hotel: Hotel,
  packageType: string,
  packagePrice: number,
  creditsAmount: number,
  purchaseId: string
): Promise<{success: boolean, error?: string}> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY non configurata. Email non inviata.');
    return {success: false, error: 'Email service not configured'};
  }

  if (!hotel.email) {
    return {success: false, error: 'Hotel email not found'};
  }

  try {
    const packageNames = {
      basic: "Pacchetto Base",
      standard: "Pacchetto Standard", 
      premium: "Pacchetto Premium",
      enterprise: "Pacchetto Enterprise"
    };

    const packageName = packageNames[packageType as keyof typeof packageNames] || "Pacchetto Crediti";

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f8f9fa; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 300; }
    .content { padding: 30px; }
    .order-details { background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .bank-details { background: #e3f2fd; border-left: 4px solid #2196f3; padding: 20px; margin: 20px 0; }
    .bank-details h3 { color: #1976d2; margin-top: 0; }
    .highlight { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; padding: 15px; margin: 15px 0; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
    .btn { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px 0; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 8px 0; border-bottom: 1px solid #eee; }
    .label { font-weight: bold; width: 30%; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏦 Istruzioni per il Bonifico</h1>
      <p>Ordine Crediti Confermato</p>
    </div>
    
    <div class="content">
      <p>Gentile <strong>${hotel.name}</strong>,</p>
      
      <p>Il vostro ordine crediti è stato registrato con successo! Di seguito trovate le istruzioni complete per effettuare il bonifico bancario.</p>
      
      <div class="order-details">
        <h3>📋 Riepilogo Ordine</h3>
        <table>
          <tr>
            <td class="label">Pacchetto:</td>
            <td><strong>${packageName}</strong></td>
          </tr>
          <tr>
            <td class="label">Crediti:</td>
            <td><strong>${creditsAmount}</strong> crediti</td>
          </tr>
          <tr>
            <td class="label">Importo:</td>
            <td><strong>€${packagePrice}</strong></td>
          </tr>
          <tr>
            <td class="label">ID Ordine:</td>
            <td><code>${purchaseId}</code></td>
          </tr>
        </table>
      </div>
      
      <div class="bank-details">
        <h3>🏦 Dati per il Bonifico</h3>
        <table>
          <tr>
            <td class="label">Beneficiario:</td>
            <td><strong>BORRO LUCA</strong></td>
          </tr>
          <tr>
            <td class="label">Banca:</td>
            <td><strong>BANCO BPM</strong></td>
          </tr>
          <tr>
            <td class="label">IBAN:</td>
            <td><strong>IT67 X050 3401 7530 0000 0146 989</strong></td>
          </tr>
          <tr>
            <td class="label">BIC/SWIFT:</td>
            <td><strong>BAPPIT21A88</strong></td>
          </tr>
          <tr>
            <td class="label">Causale:</td>
            <td><strong>Acquisto ${creditsAmount} crediti - ${hotel.name} - ID: ${purchaseId.substring(0, 8)}</strong></td>
          </tr>
          <tr>
            <td class="label">Importo:</td>
            <td><strong>€${packagePrice}</strong></td>
          </tr>
        </table>
      </div>
      
      <div class="highlight">
        <strong>⚠️ Importante:</strong> Utilizzate esattamente la causale indicata sopra per garantire un'identificazione rapida del pagamento.
      </div>
      
      <h3>📅 Prossimi Passi</h3>
      <ol>
        <li><strong>Effettuate il bonifico</strong> utilizzando i dati sopra indicati</li>
        <li><strong>Conservate la ricevuta</strong> del bonifico per eventuali verifiche</li>
        <li><strong>Attendete l'attivazione</strong> - i crediti saranno disponibili entro 24 ore lavorative dalla ricezione del pagamento</li>
        <li><strong>Riceverete conferma</strong> via email quando i crediti saranno attivati</li>
      </ol>
      
      <p>Se avete domande o necessitate di assistenza, non esitate a contattarci.</p>
      
      <p>Cordiali saluti,<br>
      <strong>Luca Borro - Landeo</strong></p>
    </div>
    
    <div class="footer">
      <p>Questa email è stata generata automaticamente. Per assistenza contattate il nostro supporto.</p>
      <p>© 2025 Luca Borro - Landeo - Sistema di Gestione Itinerari per Hotel</p>
    </div>
  </div>
</body>
</html>`;

    const { data, error } = await resend.emails.send({
      from: `Luca Borro - Landeo <onboarding@resend.dev>`,
      to: [hotel.email],
      subject: `📋 Istruzioni Bonifico - Ordine Crediti ${packageName}`,
      html: htmlContent,
    });

    if (error) {
      console.error('Errore Resend:', error);
      if (error.message?.includes('You can only send testing emails')) {
        return {success: false, error: 'Domain not verified. Please verify your domain in Resend to send emails to other recipients.'};
      }
      return {success: false, error: error.message || 'Email sending failed'};
    }

    if (data?.id) {
      console.log(`Email istruzioni bonifico inviata con successo a ${hotel.email} per hotel ${hotel.name}`);
      console.log('Email ID:', data.id);
      return {success: true};
    }

    return {success: false, error: 'Unknown error occurred'};
  } catch (error: any) {
    console.error('Errore invio email istruzioni bonifico:', error);
    return {success: false, error: error.message || 'Email sending failed'};
  }
}