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


}

export const googlePlacesService = new GooglePlacesService();