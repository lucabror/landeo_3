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
): Promise<{success: boolean, error?: string}> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY non configurata. Email non inviata.');
    return {success: false, error: 'RESEND_API_KEY non configurata'};
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
    const checkinDate = guestProfile?.checkInDate ? new Date(guestProfile.checkInDate).toLocaleDateString('it-IT') : 'N/A';
    const checkoutDate = guestProfile?.checkOutDate ? new Date(guestProfile.checkOutDate).toLocaleDateString('it-IT') : 'N/A';

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Il tuo Itinerario Personalizzato - ${hotel.name}</title>
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
      <h1>🗺️ Il tuo Itinerario Personalizzato</h1>
      <p>Pronti per un soggiorno indimenticabile</p>
    </div>
    
    <div class="content">
      <p>Caro/a <strong>${recipientName}</strong>,</p>
      
      <p>Siamo entusiasti di condividere con te il tuo <strong>itinerario personalizzato</strong> per il soggiorno presso ${hotel.name}!</p>
      
      <div class="itinerary-details">
        <h3>📋 Dettagli del Soggiorno</h3>
        <ul>
          <li><strong>Periodo:</strong> ${checkinDate} - ${checkoutDate}</li>
          <li><strong>Itinerario:</strong> ${itinerary.title}</li>
          <li><strong>Persone:</strong> ${guestProfile?.numberOfPeople || 'N/A'}</li>
        </ul>
      </div>
      
      <div class="highlight">
        <h3>📱 Come Utilizzare il Tuo Itinerario</h3>
        <p>L'itinerario completo è allegato in formato PDF. Puoi:</p>
        <ul>
          <li>🖨️ <strong>Stamparlo</strong> per averlo sempre con te</li>
          <li>📱 <strong>Salvarlo sul telefono</strong> per accesso offline</li>
          <li>🔗 <strong>Condividerlo</strong> con i tuoi compagni di viaggio</li>
        </ul>
      </div>
      
      <p>Se hai domande o necessiti di modifiche all'itinerario, non esitare a contattarci. Il nostro team è sempre a disposizione per rendere il tuo soggiorno perfetto!</p>
      
      <p>Buon viaggio!<br>
      <strong>Team ${hotel.name}</strong></p>
    </div>
    
    <div class="footer">
      <p>${hotel.city}, ${hotel.region}<br>
      📧 ${hotel.email} | 📞 ${hotel.phone}</p>
      <p>Questo itinerario è stato generato automaticamente in base alle tue preferenze</p>
    </div>
  </div>
</body>
</html>`;

    const { data, error } = await resend.emails.send({
      from: `${hotel.name} <onboarding@resend.dev>`,
      to: [recipientEmail],
      subject: `🗺️ Il tuo Itinerario Personalizzato - ${hotel.name}`,
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
      <strong>Luca Borro - Itinera</strong></p>
    </div>
    
    <div class="footer">
      <p>Questa email è stata generata automaticamente. Per assistenza contattate il nostro supporto.</p>
      <p>© 2025 Luca Borro - Itinera - Sistema di Gestione Itinerari per Hotel</p>
    </div>
  </div>
</body>
</html>`;

    const { data, error } = await resend.emails.send({
      from: `Luca Borro - Itinera <onboarding@resend.dev>`,
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