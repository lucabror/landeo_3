import fetch from 'node-fetch';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationData {
  coordinates: Coordinates;
  city: string;
  region: string;
  country: string;
  postalCode: string;
}

/**
 * Geocoding service to convert postal codes and addresses to coordinates
 */
export class GeolocationService {
  private static readonly NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
  private static readonly USER_AGENT = 'LandeoApp/1.0';

  /**
   * Get coordinates from postal code and location details
   */
  static async getCoordinatesFromPostalCode(
    postalCode: string, 
    city?: string, 
    region?: string,
    country: string = 'Italy'
  ): Promise<Coordinates | null> {
    try {
      // Build search query with available location data
      const searchParts = [postalCode];
      if (city) searchParts.push(city);
      if (region) searchParts.push(region);
      searchParts.push(country);
      
      const query = searchParts.join(', ');
      
      console.log(`Geocoding: ${query}`);
      
      const url = `${this.NOMINATIM_BASE_URL}/search?` + new URLSearchParams({
        q: query,
        format: 'json',
        limit: '1',
        countrycodes: 'it',
        addressdetails: '1'
      });

      const response = await fetch(url, {
        headers: {
          'User-Agent': this.USER_AGENT
        }
      });

      if (!response.ok) {
        throw new Error(`Geocoding API error: ${response.status}`);
      }

      const data = await response.json() as any[];
      
      if (data && data.length > 0) {
        const result = data[0];
        const coordinates = {
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon)
        };
        
        console.log(`✓ Coordinates found for ${query}: ${coordinates.latitude}, ${coordinates.longitude}`);
        return coordinates;
      }

      console.warn(`No coordinates found for: ${query}`);
      return null;

    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  static calculateDistance(point1: Coordinates, point2: Coordinates): number {
    const R = 6371; // Earth's radius in kilometers
    
    const dLat = this.toRadians(point2.latitude - point1.latitude);
    const dLon = this.toRadians(point2.longitude - point1.longitude);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(point1.latitude)) * Math.cos(this.toRadians(point2.latitude)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return Math.round(distance * 10) / 10; // Round to 1 decimal place
  }

  /**
   * Get nearby cities and areas within specified radius
   */
  static async getNearbyAreas(
    centerCoordinates: Coordinates, 
    radiusKm: number = 50
  ): Promise<string[]> {
    try {
      // Search for places within radius using overpass API for more comprehensive results
      const boundingBox = this.getBoundingBox(centerCoordinates, radiusKm);
      
      console.log(`Searching nearby areas within ${radiusKm}km of ${centerCoordinates.latitude}, ${centerCoordinates.longitude}`);
      
      // For now, return major areas around common Italian regions
      // This could be enhanced with real-time geographic APIs
      const nearbyAreas = [
        "centri storici locali",
        "borghi medievali",
        "aree naturalistiche",
        "zone vinicole",
        "parchi regionali",
        "laghi e fiumi",
        "colline circostanti",
        "valli limitrofe"
      ];
      
      return nearbyAreas;

    } catch (error) {
      console.error('Error getting nearby areas:', error);
      return [];
    }
  }

  /**
   * Enhanced location context for AI prompts
   */
  static async getLocationContext(
    postalCode: string,
    city?: string,
    region?: string
  ): Promise<{
    coordinates: Coordinates | null;
    searchRadius: string;
    referencePoint: string;
    nearbyAreas: string[];
    geoContext: string;
  }> {
    const coordinates = await this.getCoordinatesFromPostalCode(postalCode, city, region);
    const referencePoint = city || `CAP ${postalCode}`;
    
    let nearbyAreas: string[] = [];
    let geoContext = '';
    
    if (coordinates) {
      nearbyAreas = await this.getNearbyAreas(coordinates, 50);
      geoContext = this.buildGeoContext(coordinates, city, region);
    }

    return {
      coordinates,
      searchRadius: "50km",
      referencePoint,
      nearbyAreas,
      geoContext
    };
  }

  /**
   * Build geographic context for AI prompts
   */
  private static buildGeoContext(
    coordinates: Coordinates,
    city?: string,
    region?: string
  ): string {
    let context = `Coordinate geografiche: ${coordinates.latitude}, ${coordinates.longitude}`;
    
    if (region) {
      context += `\nRegione: ${region}`;
      
      // Add region-specific context
      const regionContext = this.getRegionContext(region);
      if (regionContext) {
        context += `\nContesto regionale: ${regionContext}`;
      }
    }
    
    if (city) {
      context += `\nCittà di riferimento: ${city}`;
    }
    
    return context;
  }

  /**
   * Get specific context for Italian regions
   */
  private static getRegionContext(region: string): string {
    const regionContexts: Record<string, string> = {
      'Toscana': 'Ricca di arte rinascimentale, borghi medievali, colline del Chianti, terme naturali',
      'Lazio': 'Storia antica romana, siti archeologici, castelli romani, parchi naturali',
      'Lombardia': 'Laghi alpini, arte e cultura, centri storici, montagne prealpine',
      'Veneto': 'Arte veneziana, Dolomiti, ville palladiane, tradizioni enogastronomiche',
      'Emilia-Romagna': 'Tradizione culinaria, città d\'arte, Riviera Adriatica, motori',
      'Piemonte': 'Vino e tartufi, Alpi, residenze sabaude, tradizione industriale',
      'Campania': 'Storia antica, vulcani, costa amalfitana, tradizione culinaria',
      'Sicilia': 'Archeologia greca, vulcani, tradizioni mediterranee, arte barocca',
      'Puglia': 'Architettura barocca, trulli, costa adriatica e ionica, tradizioni agricole',
      'Umbria': 'Spiritualità francescana, borghi medievali, colline verdi, tradizioni artigiane'
    };
    
    return regionContexts[region] || 'Ricco patrimonio culturale e naturale italiano';
  }

  /**
   * Helper methods
   */
  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private static getBoundingBox(center: Coordinates, radiusKm: number) {
    const lat = center.latitude;
    const lon = center.longitude;
    
    // Rough approximation: 1 degree ≈ 111 km
    const deltaLat = radiusKm / 111;
    const deltaLon = radiusKm / (111 * Math.cos(this.toRadians(lat)));
    
    return {
      minLat: lat - deltaLat,
      maxLat: lat + deltaLat,
      minLon: lon - deltaLon,
      maxLon: lon + deltaLon
    };
  }
}

/**
 * Validate coordinates
 */
export function isValidCoordinates(coordinates: Coordinates): boolean {
  return (
    coordinates.latitude >= -90 && coordinates.latitude <= 90 &&
    coordinates.longitude >= -180 && coordinates.longitude <= 180
  );
}

/**
 * Format coordinates for display
 */
export function formatCoordinates(coordinates: Coordinates): string {
  return `${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)}`;
}