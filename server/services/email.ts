import { MailService } from '@sendgrid/mail';
import type { Hotel, GuestProfile } from '@shared/schema';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

const mailService = new MailService();
mailService.setApiKey(process.env.SENDGRID_API_KEY);

export async function sendGuestPreferencesEmail(
  hotel: Hotel,
  guestProfile: GuestProfile,
  preferencesToken: string
): Promise<boolean> {
  try {
    const baseUrl = process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000';
    const preferencesUrl = `https://${baseUrl}/guest-preferences/${preferencesToken}`;
    
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Personalizza il tuo soggiorno - ${hotel.name}</title>
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
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">${hotel.name}</div>
      <p>Benvenuto nel nostro hotel!</p>
    </div>
    
    <div class="content">
      <h2>Caro/a ${guestProfile.referenceName},</h2>
      
      <p>Siamo entusiasti di accoglierti presso il nostro hotel dal <strong>${new Date(guestProfile.checkInDate).toLocaleDateString('it-IT')}</strong> al <strong>${new Date(guestProfile.checkOutDate).toLocaleDateString('it-IT')}</strong>!</p>
      
      <div class="highlight">
        <p><strong>Per rendere il tuo soggiorno ancora più speciale</strong>, abbiamo preparato un breve questionario per conoscere le tue preferenze e creare un itinerario personalizzato della tua esperienza nella nostra magnifica città.</p>
      </div>
      
      <p>Il questionario richiede solo 2-3 minuti e ci aiuterà a:</p>
      <ul>
        <li>🎯 Suggerire esperienze su misura per te</li>
        <li>🍽️ Raccomandare ristoranti che amerai</li>
        <li>🎨 Proporre attrazioni culturali di tuo interesse</li>
        <li>📍 Creare un itinerario personalizzato con i nostri partner locali</li>
      </ul>
      
      <div style="text-align: center;">
        <a href="${preferencesUrl}" class="button">
          📝 Compila le tue preferenze
        </a>
      </div>
      
      <p><small>Se il pulsante non funziona, copia e incolla questo link nel tuo browser:<br>
      <a href="${preferencesUrl}">${preferencesUrl}</a></small></p>
      
      <p>Non vediamo l'ora di darti il benvenuto!</p>
      
      <p>Cordiali saluti,<br>
      <strong>Il Team di ${hotel.name}</strong></p>
    </div>
    
    <div class="footer">
      <p>${hotel.name}<br>
      ${hotel.address}<br>
      ${hotel.phone} | ${hotel.email}</p>
      <p><small>Questa email è stata inviata automaticamente dal nostro sistema di gestione ospiti.</small></p>
    </div>
  </div>
</body>
</html>
    `;

    const textContent = `
Benvenuto/a ${guestProfile.referenceName}!

Siamo entusiasti di accoglierti presso ${hotel.name} dal ${new Date(guestProfile.checkInDate).toLocaleDateString('it-IT')} al ${new Date(guestProfile.checkOutDate).toLocaleDateString('it-IT')}!

Per rendere il tuo soggiorno ancora più speciale, abbiamo preparato un breve questionario per conoscere le tue preferenze e creare un itinerario personalizzato.

Compila le tue preferenze qui: ${preferencesUrl}

Il questionario richiede solo 2-3 minuti e ci aiuterà a suggerire esperienze su misura per te.

Cordiali saluti,
Il Team di ${hotel.name}

${hotel.name}
${hotel.address}
${hotel.phone} | ${hotel.email}
    `;

    await mailService.send({
      to: guestProfile.email || '',
      from: hotel.email || 'noreply@hotel.com',
      subject: `Benvenuto ${guestProfile.referenceName} - Personalizza il tuo soggiorno presso ${hotel.name}`,
      text: textContent,
      html: htmlContent,
    });

    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}