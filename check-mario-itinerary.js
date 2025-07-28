const fetch = require('node-fetch');

async function checkMarioItinerary() {
  try {
    const response = await fetch('http://localhost:5000/api/guest-profiles/53a60209-cc32-4c96-a07d-7af6f3f2c77b/itinerary');
    const data = await response.json();
    
    console.log('=== MARIO BIANCHI ITINERARY ANALYSIS ===');
    console.log('Title:', data.title);
    console.log('Guest Preferences: ["Musei e gallerie d\'arte", "Ristoranti tradizionali"]');
    console.log('');
    
    data.days.forEach((day, dayIndex) => {
      console.log(`DAY ${day.day} (${day.date}):`);
      day.activities.forEach((activity, actIndex) => {
        const isMuseumOrArt = activity.activity.toLowerCase().includes('museo') || 
                              activity.activity.toLowerCase().includes('gallerie') ||
                              activity.activity.toLowerCase().includes('arte');
        const isRestaurant = activity.activity.toLowerCase().includes('ristorante') ||
                             activity.activity.toLowerCase().includes('trattoria');
        
        const matchesPrefs = isMuseumOrArt || isRestaurant;
        const sourceLabel = activity.source === 'preference-matched' ? '🎯 PREFERENCE-MATCHED' : 
                           activity.source === 'hotel-suggested' ? '🏨 HOTEL-SUGGESTED' : 
                           '❓ NO SOURCE';
        
        console.log(`  ${activity.time} - ${activity.activity}`);
        console.log(`    Source: ${sourceLabel}`);
        if (matchesPrefs) {
          console.log(`    ✅ MATCHES PREFERENCES: ${isMuseumOrArt ? 'Musei/Arte' : 'Ristoranti'}`);
        }
        console.log('');
      });
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkMarioItinerary();