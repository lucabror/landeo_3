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
      // Use Text Search to find hotels
      const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query + " hotel")}&type=lodging&key=${this.apiKey}`;
      
      const response = await fetch(searchUrl);
      const data = await response.json();

      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        console.error('Google Places API error:', data.status, data.error_message);
        return [];
      }

      if (!data.results || data.results.length === 0) {
        return [];
      }

      // Process results and get detailed information
      const hotels: HotelSuggestion[] = [];
      
      for (const place of data.results.slice(0, 5)) { // Limit to top 5 results
        try {
          const details = await this.getPlaceDetails(place.place_id);
          if (details) {
            hotels.push(details);
          }
        } catch (error) {
          console.error('Error getting place details for', place.place_id, error);
          // Continue with other places even if one fails
        }
      }

      return hotels;
    } catch (error) {
      console.error('Error searching hotels:', error);
      return [];
    }
  }

  private async getPlaceDetails(placeId: string): Promise<HotelSuggestion | null> {
    try {
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,address_components,geometry,formatted_phone_number,website&key=${this.apiKey}`;
      
      const response = await fetch(detailsUrl);
      const data = await response.json();

      if (data.status !== 'OK') {
        console.error('Place details API error:', data.status);
        return null;
      }

      const place = data.result;
      
      // Parse address components
      let city = '';
      let region = '';
      let postalCode = '';
      let country = '';

      if (place.address_components) {
        for (const component of place.address_components) {
          const types = component.types;
          
          if (types.includes('locality')) {
            city = component.long_name;
          } else if (types.includes('administrative_area_level_2') && !city) {
            city = component.long_name;
          } else if (types.includes('administrative_area_level_1')) {
            region = component.long_name;
          } else if (types.includes('postal_code')) {
            postalCode = component.long_name;
          } else if (types.includes('country')) {
            country = component.long_name;
          }
        }
      }

      return {
        placeId,
        name: place.name || '',
        formattedAddress: place.formatted_address || '',
        city,
        region,
        postalCode,
        country,
        latitude: place.geometry?.location?.lat || 0,
        longitude: place.geometry?.location?.lng || 0,
        phone: place.formatted_phone_number || '',
        website: place.website || ''
      };
    } catch (error) {
      console.error('Error getting place details:', error);
      return null;
    }
  }
}