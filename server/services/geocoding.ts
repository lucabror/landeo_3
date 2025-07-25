import fetch from 'node-fetch';

interface GeocodeResult {
  name: string;
  address: string;
  city: string;
  region: string;
  postalCode: string;
  latitude: string;
  longitude: string;
  phone?: string;
  website?: string;
}

// Utilizzo di Nominatim OpenStreetMap (gratuito) per geolocalizzazione
export async function geocodeHotel(hotelName: string, country: string = 'Italy'): Promise<GeocodeResult | null> {
  try {
    // Lista di query progressive per aumentare le possibilità di trovare l'hotel
    const searchQueries = [
      `${hotelName} hotel ${country}`,
      `${hotelName} ${country}`,
      `hotel ${hotelName} ${country}`,
      hotelName
    ];
    
    for (const query of searchQueries) {
      const searchQuery = encodeURIComponent(query);
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${searchQuery}&limit=10&addressdetails=1&extratags=1`;
      
      console.log(`Trying search query: ${query}`);
      
      const response = await fetch(nominatimUrl, {
        headers: {
          'User-Agent': 'HotelItineraryApp/1.0 (hotel management system)'
        }
      });
      
      if (!response.ok) {
        console.log(`API error for query "${query}": ${response.status}`);
        continue;
      }
      
      const results = await response.json() as any[];
      
      if (!results || results.length === 0) {
        console.log(`No results for query: ${query}`);
        continue;
      }
      
      console.log(`Found ${results.length} results for query: ${query}`);
      
      // Trova il risultato più appropriato
      let bestResult = results.find(result => 
        result.type === 'hotel' || 
        result.type === 'resort' || 
        result.class === 'tourism' ||
        (result.extratags && (result.extratags.tourism === 'hotel' || result.extratags.tourism === 'resort')) ||
        result.display_name.toLowerCase().includes('hotel') ||
        result.display_name.toLowerCase().includes('resort') ||
        result.display_name.toLowerCase().includes('villa')
      );
      
      // Se non trova un hotel specifico, usa il primo risultato se è in Italia
      if (!bestResult && results.length > 0) {
        for (const result of results) {
          if (result.address && 
              (result.address.country_code === 'it' || 
               result.display_name.toLowerCase().includes('italy') ||
               result.display_name.toLowerCase().includes('italia'))) {
            bestResult = result;
            break;
          }
        }
      }
      
      if (bestResult) {
        console.log(`Selected result: ${bestResult.display_name}`);
        
        const address = bestResult.address || {};
        
        // Estrai informazioni dall'indirizzo
        const extractedInfo: GeocodeResult = {
          name: hotelName, // Mantieni il nome originale inserito dall'utente
          address: [
            address.house_number,
            address.road || address.street
          ].filter(Boolean).join(' ') || address.display_name?.split(',')[1]?.trim() || '',
          city: address.city || address.town || address.village || address.municipality || '',
          region: address.state || address.region || address.province || '',
          postalCode: address.postcode || '',
          latitude: bestResult.lat || '',
          longitude: bestResult.lon || '',
          phone: bestResult.extratags?.phone || bestResult.extratags?.['contact:phone'] || '',
          website: bestResult.extratags?.website || bestResult.extratags?.['contact:website'] || ''
        };
        
        return extractedInfo;
      }
    }
    
    // Fallback: se non trova l'hotel specifico, cerca per città italiana
    console.log('Hotel specifico non trovato, cercando per città...');
    return await searchByCityFallback(hotelName, country);
    
    const address = bestResult.address || {};
    
    // Estrai informazioni dall'indirizzo
    const extractedInfo: GeocodeResult = {
      name: bestResult.display_name.split(',')[0] || hotelName,
      address: [
        address.house_number,
        address.road || address.street
      ].filter(Boolean).join(' ') || address.display_name?.split(',')[0] || '',
      city: address.city || address.town || address.village || address.municipality || '',
      region: address.state || address.region || address.province || '',
      postalCode: address.postcode || '',
      latitude: bestResult.lat || '',
      longitude: bestResult.lon || '',
      phone: bestResult.extratags?.phone || bestResult.extratags?.['contact:phone'] || '',
      website: bestResult.extratags?.website || bestResult.extratags?.['contact:website'] || ''
    };
    
    // Fallback per informazioni mancanti usando reverse geocoding
    if (!extractedInfo.city || !extractedInfo.region) {
      const reverseUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${bestResult.lat}&lon=${bestResult.lon}&addressdetails=1`;
      
      const reverseResponse = await fetch(reverseUrl, {
        headers: {
          'User-Agent': 'HotelItineraryApp/1.0 (hotel management system)'
        }
      });
      
      if (reverseResponse.ok) {
        const reverseResult = await reverseResponse.json() as any;
        const reverseAddress = reverseResult.address || {};
        
        if (!extractedInfo.city) {
          extractedInfo.city = reverseAddress.city || reverseAddress.town || reverseAddress.village || reverseAddress.municipality || '';
        }
        
        if (!extractedInfo.region) {
          extractedInfo.region = reverseAddress.state || reverseAddress.region || reverseAddress.province || '';
        }
        
        if (!extractedInfo.postalCode) {
          extractedInfo.postalCode = reverseAddress.postcode || '';
        }
      }
    }
    
    return extractedInfo;
    
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

// Funzione per validare e migliorare i dati dell'hotel
export async function enrichHotelData(hotelName: string, partialData?: Partial<GeocodeResult>): Promise<GeocodeResult | null> {
  try {
    // Prima prova la geolocalizzazione standard
    let result = await geocodeHotel(hotelName);
    
    if (!result && partialData?.city) {
      // Se non trova l'hotel, prova con città specifica
      result = await geocodeHotel(`${hotelName} ${partialData.city}`);
    }
    
    if (!result && partialData?.region) {
      // Prova con regione specifica
      result = await geocodeHotel(`${hotelName} ${partialData.region} Italy`);
    }
    
    // Merge con i dati parziali forniti dall'utente se disponibili
    if (result && partialData) {
      return {
        ...result,
        ...Object.fromEntries(
          Object.entries(partialData).filter(([_, value]) => value && value.trim() !== '')
        )
      };
    }
    
    return result;
    
  } catch (error) {
    console.error('Hotel data enrichment error:', error);
    return null;
  }
}

// Fallback: cerca per città italiana per fornire almeno dati geografici di base
async function searchByCityFallback(hotelName: string, country: string): Promise<GeocodeResult | null> {
  try {
    // Estrai possibili nomi di città dal nome dell'hotel
    const cityKeywords = [
      'Roma', 'Milano', 'Firenze', 'Venezia', 'Napoli', 'Torino', 'Bologna', 
      'Genova', 'Palermo', 'Catania', 'Bari', 'Verona', 'Padova', 'Trieste',
      'Brescia', 'Parma', 'Modena', 'Reggio Emilia', 'Perugia', 'Rimini',
      'Salerno', 'Ravenna', 'Ferrara', 'Pisa', 'Livorno', 'Siena', 'Arezzo',
      'Terni', 'Pescara', 'Bergamo', 'Vicenza', 'Bolzano', 'Trento', 'Udine',
      'La Spezia', 'Carrara', 'Pistoia', 'Prato', 'Lucca', 'Grosseto',
      'Viterbo', 'Latina', 'Frosinone', 'Rieti', 'Tivoli', 'Civitavecchia',
      'Sorrento', 'Capri', 'Positano', 'Amalfi', 'Taormina', 'Cefalù',
      'San Gimignano', 'Montepulciano', 'Cortona', 'Assisi', 'Orvieto'
    ];
    
    const hotelNameLower = hotelName.toLowerCase();
    const detectedCity = cityKeywords.find(city => 
      hotelNameLower.includes(city.toLowerCase())
    );
    
    if (detectedCity) {
      console.log(`Detected city: ${detectedCity}`);
      
      const searchQuery = encodeURIComponent(`${detectedCity} ${country}`);
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${searchQuery}&limit=5&addressdetails=1`;
      
      const response = await fetch(nominatimUrl, {
        headers: {
          'User-Agent': 'HotelItineraryApp/1.0 (hotel management system)'
        }
      });
      
      if (response.ok) {
        const results = await response.json() as any[];
        
        if (results && results.length > 0) {
          const cityResult = results[0];
          const address = cityResult.address || {};
          
          console.log(`Found city data: ${cityResult.display_name}`);
          
          return {
            name: hotelName,
            address: '', // L'utente dovrà inserire l'indirizzo specifico
            city: detectedCity,
            region: address.state || address.region || address.province || '',
            postalCode: '', // L'utente dovrà inserire il CAP specifico
            latitude: cityResult.lat || '',
            longitude: cityResult.lon || '',
            phone: '',
            website: ''
          };
        }
      }
    }
    
    return null;
    
  } catch (error) {
    console.error('City fallback error:', error);
    return null;
  }
}

// Verifica se le coordinate sono valide per l'Italia
export function isValidItalianLocation(latitude: string, longitude: string): boolean {
  const lat = parseFloat(latitude);
  const lon = parseFloat(longitude);
  
  // Coordinate approssimative per l'Italia
  // Latitudine: 35.5 - 47.1
  // Longitudine: 6.6 - 18.8
  return lat >= 35.5 && lat <= 47.1 && lon >= 6.6 && lon <= 18.8;
}