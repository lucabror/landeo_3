// Script diretto per creare i dati demo
const fetch = require('node-fetch');

async function createDemoData() {
  const hotelId = '2b9e6746-b072-4e0b-92a8-0de6f5ea7894';
  
  try {
    // Aggiungi altre esperienze
    await fetch('http://localhost:5000/api/local-experiences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Visita agli Uffizi con Guida Privata',
        description: 'Tour esclusivo della Galleria degli Uffizi con guida esperta',
        location: 'Centro Storico Firenze',
        hotelId: hotelId,
        category: 'Arte e Cultura',
        duration: '3 ore',
        distance: '15 km',
        priceRange: '€150-200',
        targetAudience: ['Coppia', 'Famiglia', 'Singolo'],
        rating: '4.9',
        contactInfo: {
          phone: '+39 055 555123',
          email: 'uffizi@culturatour.it'
        },
        openingHours: '8:15-18:30',
        seasonality: 'Tutto l\'anno',
        isActive: true
      })
    });

    await fetch('http://localhost:5000/api/local-experiences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Cooking Class Toscana',
        description: 'Corso di cucina tradizionale toscana con chef locale',
        location: 'Villa Toscana Resort',
        hotelId: hotelId,
        category: 'Enogastronomia',
        duration: '4 ore',
        distance: '0 km',
        priceRange: '€90-130',
        targetAudience: ['Coppia', 'Famiglia'],
        rating: '4.7',
        contactInfo: {
          phone: '+39 055 1234567',
          email: 'chef@villatoscanaresort.it'
        },
        openingHours: '10:00-16:00',
        seasonality: 'Tutto l\'anno',
        isActive: true
      })
    });

    // Crea profilo ospite usando Date objects
    const response = await fetch('http://localhost:5000/api/guest-profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'Coppia',
        hotelId: hotelId,
        numberOfPeople: 2,
        referenceName: 'Marco e Giulia Romano',
        checkInDate: new Date('2025-03-15T10:00:00Z').toISOString(),
        checkOutDate: new Date('2025-03-18T12:00:00Z').toISOString(),
        ages: [35, 32],
        preferences: ['Arte', 'Enogastronomia', 'Storia', 'Relax'],
        specialRequests: 'Allergici ai frutti di mare. Preferenza per esperienze culturali autentiche.',
        roomNumber: '205'
      })
    });

    const guest = await response.json();
    console.log('✓ Profilo ospite creato:', guest);
    
    // Ora genera un itinerario AI per l'ospite
    if (guest.id) {
      console.log('\n🤖 Generando itinerario AI personalizzato...');
      const itineraryResponse = await fetch('http://localhost:5000/api/itineraries/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotelId: hotelId,
          guestProfileId: guest.id
        })
      });
      
      const itinerary = await itineraryResponse.json();
      console.log('✅ Itinerario AI generato:', itinerary.title);
      console.log('ID Itinerario:', itinerary.id);
      console.log('URL Itinerario:', itinerary.uniqueUrl);
      
      // Genera QR Code per l'itinerario
      console.log('\n📱 Generando QR Code...');
      const qrResponse = await fetch(`http://localhost:5000/api/itineraries/${itinerary.id}/qr`);
      const qrResult = await qrResponse.json();
      console.log('✅ QR Code generato:', qrResult.qrCodeUrl);
      
      // Genera PDF dell'itinerario
      console.log('\n📄 Generando PDF...');
      const pdfResponse = await fetch(`http://localhost:5000/api/itineraries/${itinerary.id}/pdf`);
      const pdfResult = await pdfResponse.json();
      console.log('✅ PDF generato:', pdfResult.pdfUrl);
      
      console.log('\n🎉 Demo completata! L\'applicazione è pronta per l\'uso.');
      console.log(`\n📱 Accedi all'itinerario pubblico: http://localhost:5000/itinerary/${itinerary.uniqueUrl}`);
    }

  } catch (error) {
    console.error('Errore:', error);
  }
}

createDemoData();