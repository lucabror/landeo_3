// Rate limiting per Google Places API
class GoogleApiRateLimiter {
  private requests: { [key: string]: number[] } = {};
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 10, windowMs: number = 60 * 1000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async checkLimit(identifier: string = 'default'): Promise<boolean> {
    const now = Date.now();
    
    // Inizializza array se non esiste
    if (!this.requests[identifier]) {
      this.requests[identifier] = [];
    }

    // Rimuovi richieste fuori dalla finestra temporale
    this.requests[identifier] = this.requests[identifier].filter(
      timestamp => now - timestamp < this.windowMs
    );

    // Controlla se abbiamo raggiunto il limite
    if (this.requests[identifier].length >= this.maxRequests) {
      console.warn(`⚠️ Google Places rate limit raggiunto per ${identifier}: ${this.requests[identifier].length}/${this.maxRequests} richieste in ${this.windowMs}ms`);
      return false;
    }

    // Aggiungi la richiesta corrente
    this.requests[identifier].push(now);
    return true;
  }
}

// Rate limiter per Google Places: max 10 richieste per minuto
const googlePlacesLimiter = new GoogleApiRateLimiter(10, 60 * 1000);

export interface HotelSuggestion {
  placeId: string;
  name: string;
  formattedAddress: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  latitude: number;
  longitude: number;
  phone?: string;
  website?: string;
}

export class GooglePlacesService {
  private apiKey: string;

  constructor() {
    if (!process.env.GOOGLE_PLACES_API_KEY) {
      throw new Error("GOOGLE_PLACES_API_KEY environment variable is required");
    }
    this.apiKey = process.env.GOOGLE_PLACES_API_KEY;
  }

  async searchHotels(query: string): Promise<HotelSuggestion[]> {
    if (!query || query.length < 2) {
      return [];
    }

    try {
      // Controlla rate limiting prima di chiamare Google Places API
      const canMakeRequest = await googlePlacesLimiter.checkLimit('hotels');
      if (!canMakeRequest) {
        console.error('❌ Rate limit raggiunto per Google Places API. Riprova tra un minuto.');
        throw new Error('Troppe richieste API Google Places. Riprova tra un minuto.');
      }

      console.log(`🏨 Google Places search per hotel: "${query}"`);

      // Use the new Places API (New) - Text Search
      const searchUrl = 'https://places.googleapis.com/v1/places:searchText';
      
      const requestBody = {
        textQuery: `${query} hotel`,
        maxResultCount: 5,
        locationBias: {
          rectangle: {
            low: { latitude: 35.0, longitude: 6.0 },  // Southern Italy
            high: { latitude: 47.5, longitude: 19.0 } // Northern Italy
          }
        }
      };

      const response = await fetch(searchUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': this.apiKey,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.nationalPhoneNumber,places.websiteUri,places.addressComponents'
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Google Places API (New) error:', data);
        return [];
      }

      if (!data.places || data.places.length === 0) {
        return [];
      }

      // Process results
      const hotels: HotelSuggestion[] = [];
      
      for (const place of data.places) {
        try {
          const hotel = this.processPlaceResult(place);
          if (hotel) {
            hotels.push(hotel);
          }
        } catch (error) {
          console.error('Error processing place result:', error);
        }
      }

      return hotels;
    } catch (error) {
      console.error('Error searching hotels:', error);
      return [];
    }
  }

  private processPlaceResult(place: any): HotelSuggestion | null {
    try {
      // Parse address components
      let city = '';
      let region = '';
      let postalCode = '';
      let country = '';

      if (place.addressComponents) {
        for (const component of place.addressComponents) {
          const types = component.types || [];
          
          if (types.includes('locality')) {
            city = component.longText;
          } else if (types.includes('administrative_area_level_2') && !city) {
            city = component.longText;
          } else if (types.includes('administrative_area_level_1')) {
            region = component.longText;
          } else if (types.includes('postal_code')) {
            postalCode = component.longText;
          } else if (types.includes('country')) {
            country = component.longText;
          }
        }
      }

      return {
        placeId: place.id,
        name: place.displayName?.text || '',
        formattedAddress: place.formattedAddress || '',
        city,
        region,
        postalCode,
        country,
        latitude: place.location?.latitude || 0,
        longitude: place.location?.longitude || 0,
        phone: place.nationalPhoneNumber || '',
        website: place.websiteUri || ''
      };
    } catch (error) {
      console.error('Error processing place:', error);
      return null;
    }
  }

  // Search for local attractions and points of interest
  async searchAttractions(query: string, location?: { lat: number; lng: number }, radius: number = 50000): Promise<AttractionSuggestion[]> {
    if (!this.apiKey) {
      throw new Error('Google Places API key not configured');
    }

    if (!query || query.length < 2) {
      return [];
    }

    try {
      // Controlla rate limiting prima di chiamare Google Places API per attrazioni
      const canMakeRequest = await googlePlacesLimiter.checkLimit('attractions');
      if (!canMakeRequest) {
        console.error('❌ Rate limit raggiunto per Google Places API (attrazioni). Riprova tra un minuto.');
        throw new Error('Troppe richieste API Google Places per attrazioni. Riprova tra un minuto.');
      }

      console.log(`🔍 Searching attractions for query: "${query}"`);

      const requestBody = {
        textQuery: query,
        maxResultCount: 20,
        ...(location && {
          locationBias: {
            circle: {
              center: {
                latitude: location.lat,
                longitude: location.lng
              },
              radius: radius
            }
          }
        }),
        regionCode: 'IT', // Focus on Italy  
        languageCode: 'it'
      };

      console.log('🌐 Google Places API request:', JSON.stringify(requestBody, null, 2));

      const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': this.apiKey,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.addressComponents,places.location,places.types,places.nationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.priceLevel,places.regularOpeningHours,places.primaryType'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Google Places API error:', response.status, errorText);
        throw new Error(`Google Places API error: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ Found ${data.places?.length || 0} attractions from Google Places API`);

      const attractions: AttractionSuggestion[] = [];
      
      if (data.places) {
        for (const place of data.places) {
          try {
            const attraction = this.processAttractionResult(place);
            if (attraction) {
              attractions.push(attraction);
            }
          } catch (error) {
            console.error('Error processing attraction result:', error);
          }
        }
      }

      return attractions;
    } catch (error) {
      console.error('Error searching attractions:', error);
      return [];
    }
  }

  private processAttractionResult(place: any): AttractionSuggestion | null {
    try {
      // Parse address components
      let city = '';
      let region = '';
      let postalCode = '';
      let country = '';

      if (place.addressComponents) {
        for (const component of place.addressComponents) {
          const types = component.types || [];
          
          if (types.includes('locality')) {
            city = component.longText;
          } else if (types.includes('administrative_area_level_2') && !city) {
            city = component.longText;
          } else if (types.includes('administrative_area_level_1')) {
            region = component.longText;
          } else if (types.includes('postal_code')) {
            postalCode = component.longText;
          } else if (types.includes('country')) {
            country = component.longText;
          }
        }
      }

      // Map Google Places types to our categories
      const primaryType = place.primaryType || '';
      const allTypes = place.types || [];
      const category = this.mapGoogleTypesToCategory(primaryType, allTypes);

      // Format opening hours
      let openingHours = '';
      if (place.regularOpeningHours?.weekdayDescriptions) {
        openingHours = place.regularOpeningHours.weekdayDescriptions.join('; ');
      }

      // Format price range
      let priceRange = '';
      if (place.priceLevel !== undefined) {
        const priceMap = {
          0: 'Gratuito',
          1: '€ - Economico',
          2: '€€ - Medio',
          3: '€€€ - Costoso',
          4: '€€€€ - Molto costoso'
        };
        priceRange = priceMap[place.priceLevel as keyof typeof priceMap] || '';
      }

      return {
        placeId: place.id,
        name: place.displayName?.text || '',
        formattedAddress: place.formattedAddress || '',
        city,
        region,
        postalCode,
        country,
        latitude: place.location?.latitude || 0,
        longitude: place.location?.longitude || 0,
        phone: place.nationalPhoneNumber || '',
        website: place.websiteUri || '',
        category,
        primaryType,
        types: allTypes,
        rating: place.rating ? place.rating.toString() : '',
        userRatingCount: place.userRatingCount || 0,
        priceRange,
        openingHours
      };
    } catch (error) {
      console.error('Error processing attraction:', error);
      return null;
    }
  }

  private mapGoogleTypesToCategory(primaryType: string, allTypes: string[]): string {
    // Map Google Places types to our 20 Landeo categories
    const categoryMappings: { [key: string]: string } = {
      'museum': 'Museo',
      'art_gallery': 'Museo',
      'archaeological_site': 'Sito Archeologico',
      'historical_landmark': 'Monumento Storico',
      'monument': 'Monumento Storico',
      'place_of_worship': 'Chiesa o Luogo Religioso',
      'church': 'Chiesa o Luogo Religioso',
      'hindu_temple': 'Chiesa o Luogo Religioso',
      'mosque': 'Chiesa o Luogo Religioso',
      'synagogue': 'Chiesa o Luogo Religioso',
      'tourist_attraction': 'Borgo Storico',
      'cultural_center': 'Evento Culturale',
      'performing_arts_theater': 'Evento Culturale',
      'restaurant': 'Ristorante Tipico',
      'meal_takeaway': 'Ristorante Tipico',
      'food': 'Ristorante Tipico',
      'bar': 'Cantina/Enoteca',
      'liquor_store': 'Cantina/Enoteca',
      'supermarket': 'Mercato o Bottega Locale',
      'grocery_or_supermarket': 'Mercato o Bottega Locale',
      'shopping_mall': 'Mercato o Bottega Locale',
      'store': 'Laboratorio Artigianale',
      'park': 'Parco Naturale',
      'national_park': 'Parco Naturale',
      'campground': 'Trekking/Escursione',
      'hiking_area': 'Trekking/Escursione',
      'natural_feature': 'Lago/Spiaggia',
      'beach': 'Lago/Spiaggia',
      'botanical_garden': 'Giardino Botanico/Storico',
      'zoo': 'Giardino Botanico/Storico',
      'amusement_park': 'Sport Avventura/Outdoor',
      'gym': 'Sport Avventura/Outdoor',
      'bicycle_store': 'Cicloturismo',
      'spa': 'Centro Termale/SPA',
      'beauty_salon': 'Centro Termale/SPA',
      'clothing_store': 'Shopping Locale',
      'jewelry_store': 'Shopping Locale',
      'night_club': 'Locali/Divertimento',
      'casino': 'Locali/Divertimento'
    };

    // Check primary type first
    if (categoryMappings[primaryType]) {
      return categoryMappings[primaryType];
    }

    // Check all types
    for (const type of allTypes) {
      if (categoryMappings[type]) {
        return categoryMappings[type];
      }
    }

    // Default fallback
    return 'Esperienza Unica del Territorio';
  }


}

// Interface for attraction suggestions from Google Places
export interface AttractionSuggestion {
  placeId: string;
  name: string;
  formattedAddress: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  latitude: number;
  longitude: number;
  phone?: string;
  website?: string;
  category: string;
  primaryType: string;
  types: string[];
  rating: string;
  userRatingCount: number;
  priceRange: string;
  openingHours: string;
}

export const googlePlacesService = new GooglePlacesService();