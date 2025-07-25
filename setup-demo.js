// Script per configurare dati demo per l'hotel
const API_BASE = 'http://localhost:5000/api';

async function setupDemoHotel() {
  try {
    // 1. Crea Hotel
    const hotel = await fetch(`${API_BASE}/hotels`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'hotel-1',
        name: 'Villa Toscana Resort',
        address: 'Via del Chianti 123',
        city: 'Firenze',
        region: 'Toscana',
        postalCode: '50125',
        phone: '+39 055 1234567',
        email: 'info@villatoscanaresort.it',
        website: 'https://villatoscanaresort.it',
        description: 'Un elegante resort nel cuore della Toscana, circondato da vigneti e uliveti secolari.',
        logoUrl: '/assets/villa-toscana-logo.png',
        latitude: '43.7696',
        longitude: '11.2558'
      })
    });
    console.log('✓ Hotel creato:', await hotel.json());

    // 2. Aggiungi Esperienze Locali
    const experiences = [
      {
        name: 'Tour dei Vigneti del Chianti',
        description: 'Visita guidata nelle cantine più prestigiose del Chianti con degustazione di vini pregiati',
        location: 'Chianti Classico',
        hotelId: 'hotel-1',
        category: 'Enogastronomia',
        duration: '6 ore',
        distance: '25 km',
        priceRange: '€80-120',
        targetAudience: ['Coppia', 'Famiglia'],
        rating: '4.8',
        contactInfo: {
          phone: '+39 055 987654',
          email: 'chianti@tours.it'
        },
        openingHours: '9:00-18:00',
        seasonality: 'Tutto l\'anno',
        isActive: true
      },
      {
        name: 'Visita agli Uffizi con Guida Privata',
        description: 'Tour esclusivo della Galleria degli Uffizi con guida esperta',
        location: 'Centro Storico Firenze',
        hotelId: 'hotel-1',
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
      },
      {
        name: 'Cooking Class Toscana',
        description: 'Corso di cucina tradizionale toscana con chef locale',
        location: 'Villa Toscana Resort',
        hotelId: 'hotel-1',
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
      }
    ];

    for (const exp of experiences) {
      const response = await fetch(`${API_BASE}/local-experiences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exp)
      });
      console.log('✓ Esperienza aggiunta:', (await response.json()).name);
    }

    // 3. Crea Profilo Ospite
    const guestProfile = await fetch(`${API_BASE}/guest-profiles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'Coppia',
        hotelId: 'hotel-1',
        numberOfPeople: 2,
        referenceName: 'Marco e Giulia Romano',
        checkInDate: new Date('2025-03-15'),
        checkOutDate: new Date('2025-03-18'),
        ages: [35, 32],
        preferences: ['Arte', 'Enogastronomia', 'Storia', 'Relax'],
        specialRequests: 'Allergici ai frutti di mare. Preferenza per esperienze culturali autentiche.',
        roomNumber: '205'
      })
    });
    const guest = await guestProfile.json();
    console.log('✓ Profilo ospite creato:', guest.referenceName);

    return guest.id;
  } catch (error) {
    console.error('Errore setup demo:', error);
  }
}

// Esegui setup
setupDemoHotel().then(guestId => {
  if (guestId) {
    console.log(`\n🎉 Setup completato! Puoi ora generare un itinerary per l'ospite ID: ${guestId}`);
  }
});