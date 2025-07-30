import OpenAI from "openai";
import type { Hotel, LocalExperience, InsertLocalExperience } from "@shared/schema";
import { LANDEO_CATEGORIES } from "@shared/categories";
import { GeolocationService, type Coordinates } from "./geolocation";

// Rate limiting per OpenAI API nelle attrazioni
class AttractionsRateLimiter {
  private requests: { [key: string]: number[] } = {};
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 3, windowMs: number = 60 * 1000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async checkLimit(identifier: string = 'default'): Promise<boolean> {
    const now = Date.now();
    
    if (!this.requests[identifier]) {
      this.requests[identifier] = [];
    }

    this.requests[identifier] = this.requests[identifier].filter(
      timestamp => now - timestamp < this.windowMs
    );

    if (this.requests[identifier].length >= this.maxRequests) {
      console.warn(`⚠️ OpenAI attrazioni rate limit raggiunto per ${identifier}: ${this.requests[identifier].length}/${this.maxRequests} richieste in ${this.windowMs}ms`);
      return false;
    }

    this.requests[identifier].push(now);
    return true;
  }
}

// Rate limiter per generazione attrazioni: max 3 richieste per minuto
const attractionsLimiter = new AttractionsRateLimiter(3, 60 * 1000);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateLocalExperiences(hotel: Hotel): Promise<InsertLocalExperience[]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured");
  }

  if (!hotel.postalCode) {
    throw new Error("CAP hotel non trovato - necessario per localizzazione attrazioni");
  }

  console.log(`🌍 Analisi geolocalizzazione per ${hotel.name}...`);
  
  // Get enhanced location context with coordinates and geographic data
  const locationContext = await GeolocationService.getLocationContext(
    hotel.postalCode,
    hotel.city,
    hotel.region
  );

  // Update hotel coordinates if found and not already set
  if (locationContext.coordinates && (!hotel.latitude || !hotel.longitude)) {
    console.log(`📍 Aggiornamento coordinate hotel: ${locationContext.coordinates.latitude}, ${locationContext.coordinates.longitude}`);
    // Note: In a full implementation, you'd update the hotel record here
  }

  // Crea la lista delle 20 categorie per il prompt (sempre in italiano per AI)
  const categoriesList = LANDEO_CATEGORIES.map(cat => cat.label.it).join('\n');

  const enhancedPrompt = `Sei un esperto di turismo italiano con conoscenza approfondita delle attrazioni locali. 

AREA DI RICERCA:
- Centro: ${locationContext.referencePoint} (${hotel.postalCode})
- Raggio: ${locationContext.searchRadius}
- Regione: ${hotel.region}
${locationContext.geoContext}

CATEGORIE AMMESSE (scegli ESATTAMENTE una di queste 20):
${categoriesList}

ISTRUZIONI AVANZATE:
- Trova attrazioni turistiche REALI ed ESISTENTI entro 50km dal ${locationContext.referencePoint}
- Priorità a attrazioni autentiche e caratteristiche del territorio
- Considera la tipicità regionale di ${hotel.region}
- Ogni attrazione deve appartenere a UNA SOLA delle 20 categorie sopra elencate
- Valuta attentamente la natura di ogni attrazione per assegnarla alla categoria più appropriata
- Includi distanza precisa dal ${locationContext.referencePoint}
- Varia le distanze: alcune vicine (5-15km), altre moderate (15-35km), alcune al limite (35-50km)

CONTESTO GEOGRAFICO:
${locationContext.nearbyAreas.length > 0 ? `Aree circostanti da considerare: ${locationContext.nearbyAreas.join(', ')}` : ''}

FORMATO OUTPUT (Tabella Markdown):
| Nome | Categoria | Distanza (km) | Località | Indirizzo | Descrizione | Perché è consigliata |
|------|-----------|---------------|----------|-----------|-------------|---------------------|
| [Nome attrazione] | [Numero. Nome categoria] | [X] | [Comune/Località] | [Via/Indirizzo specifico] | [Descrizione breve e accattivante] | [Motivo specifico per cui vale la pena visitarla] |

Genera 18-25 attrazioni diverse, assicurandoti di:
- Includere SEMPRE località e indirizzo precisi per ogni attrazione
- Coprire tutte le principali categorie disponibili nella zona
- Variare le distanze da 5km a 50km
- Includere sia attrazioni famose che gemme nascoste locali
- Fornire indirizzi reali e verificabili
- Considerare il contesto stagionale e l'accessibilità`;

  console.log(`🤖 Generazione AI attrazioni per ${locationContext.referencePoint}...`);
  
  try {
    // Controlla rate limiting prima di chiamare OpenAI API per attrazioni
    const canMakeRequest = await attractionsLimiter.checkLimit('attractions');
    if (!canMakeRequest) {
      console.error('❌ Rate limit raggiunto per OpenAI API (attrazioni). Riprova tra un minuto.');
      throw new Error('Troppe richieste API OpenAI per generazione attrazioni. Riprova tra un minuto.');
    }

    console.log("📝 Prompt inviato ad OpenAI:", enhancedPrompt.substring(0, 200) + "...");
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system", 
          content: "Sei un esperto locale di turismo italiano con conoscenza approfondita delle attrazioni autentiche e delle specificità regionali. Conosci perfettamente le distanze reali e le caratteristiche uniche di ogni territorio."
        },
        {
          role: "user",
          content: enhancedPrompt
        }
      ],
      temperature: 0.8,
      max_tokens: 3000
    });
    
    console.log("✅ Risposta OpenAI ricevuta");

    const markdownContent = response.choices[0].message.content;
    if (!markdownContent) {
      throw new Error("Nessuna risposta da OpenAI");
    }

    console.log("📝 Risposta AI ricevuta, lunghezza:", markdownContent.length, "caratteri");
    console.log("🔍 Prime 500 caratteri:", markdownContent.substring(0, 500));
    
    const experiences = parseMarkdownToExperiences(markdownContent, hotel.id);
    console.log(`🎯 Estratte ${experiences.length} esperienze dal parsing`);
    
    // Add geolocation validation and enhancement if coordinates are available
    if (locationContext.coordinates) {
      console.log("🎯 Validazione geografica delle attrazioni...");
      await enhanceExperiencesWithGeolocation(experiences, locationContext.coordinates);
    }
    
    return experiences;

  } catch (error) {
    console.error("❌ Errore generazione AI:", error);
    throw new Error(`Errore nella generazione delle attrazioni: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`);
  }
}

function parseMarkdownToExperiences(markdownContent: string, hotelId: string): InsertLocalExperience[] {
  const experiences: InsertLocalExperience[] = [];
  
  // Estrae le righe della tabella (esclude header e separatore)
  const lines = markdownContent.split('\n');
  const tableLines = lines.filter(line => 
    line.trim().startsWith('|') && 
    !line.includes('---') && 
    !line.includes('Nome') && 
    !line.includes('Categoria')
  );

  console.log(`Trovate ${tableLines.length} righe da parsare`);

  for (const line of tableLines) {
    try {
      const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell);
      
      if (cells.length >= 5) {
        let nome, categoriaAI, distanzaStr, localita, indirizzo, descrizione, perche;
        
        if (cells.length >= 7) {
          // New format with separate locality and address
          [nome, categoriaAI, distanzaStr, localita, indirizzo, descrizione, perche] = cells;
        } else {
          // Old format with just 5 columns
          [nome, categoriaAI, distanzaStr, descrizione, perche] = cells;
          localita = nome; // Use attraction name as locality fallback
          indirizzo = "";
        }
        
        // Estrae il numero della categoria dal formato "1. Museo"
        const categoryMatch = categoriaAI.match(/^(\d+)\.\s*(.+)$/);
        if (!categoryMatch) {
          console.warn(`Categoria non riconosciuta: ${categoriaAI}`);
          continue;
        }

        const categoryNumber = parseInt(categoryMatch[1]);
        const categoryName = categoryMatch[2].trim();
        
        // Trova la categoria corrispondente nel sistema Landeo
        const landeaCategory = LANDEO_CATEGORIES.find(cat => 
          cat.label.it.includes(categoryNumber.toString()) && 
          cat.label.it.toLowerCase().includes(categoryName.toLowerCase())
        );

        if (!landeaCategory) {
          console.warn(`Categoria Landeo non trovata per: ${categoriaAI}`);
          continue;
        }

        // Estrae la distanza numerica
        const distanceMatch = distanzaStr.match(/(\d+)/);
        const distanceKm = distanceMatch ? parseInt(distanceMatch[1]) : 0;

        experiences.push({
          hotelId,
          name: nome,
          category: landeaCategory.value,
          description: descrizione,
          location: localita || nome, // Use locality or attraction name as fallback
          address: indirizzo || "", // Specific address if available
          distance: `${distanceKm} km`,
          whyRecommended: perche
        });

        console.log(`✓ Aggiunta: ${nome} (${landeaCategory.label.it}) - ${distanceKm}km`);
      }
    } catch (error) {
      console.warn(`Errore parsing riga: ${line}`, error);
    }
  }

  console.log(`Totale esperienze generate: ${experiences.length}`);
  return experiences;
}

export function mapAIcategoryToStandard(aiCategory: string): string {
  // Mapping intelligente da categoria AI a categoria standardizzata
  const categoryLower = aiCategory.toLowerCase();
  
  // Cerca corrispondenza diretta nel sistema Landeo
  const directMatch = LANDEO_CATEGORIES.find(cat => 
    categoryLower.includes(cat.value) || 
    categoryLower.includes(cat.label.it.toLowerCase())
  );
  
  if (directMatch) {
    return directMatch.value;
  }

  // Fallback mapping per categorie non standard
  if (categoryLower.includes('museo')) return 'museo';
  if (categoryLower.includes('archeologico')) return 'sito_archeologico';
  if (categoryLower.includes('monumento') || categoryLower.includes('storico')) return 'monumento_storico';
  if (categoryLower.includes('chiesa') || categoryLower.includes('religioso')) return 'chiesa';
  if (categoryLower.includes('borgo')) return 'borgo_storico';
  if (categoryLower.includes('evento') || categoryLower.includes('culturale')) return 'evento_culturale';
  if (categoryLower.includes('ristorante')) return 'ristorante_tipico';
  if (categoryLower.includes('cantina') || categoryLower.includes('enoteca') || categoryLower.includes('vino')) return 'cantina_enoteca';
  if (categoryLower.includes('mercato') || categoryLower.includes('bottega')) return 'mercato_bottega';
  if (categoryLower.includes('laboratorio') || categoryLower.includes('artigianale')) return 'laboratorio_artigianale';
  if (categoryLower.includes('parco') || categoryLower.includes('naturale')) return 'parco_naturale';
  if (categoryLower.includes('trekking') || categoryLower.includes('escursione')) return 'trekking_escursione';
  if (categoryLower.includes('lago') || categoryLower.includes('spiaggia')) return 'lago_spiaggia';
  if (categoryLower.includes('giardino') || categoryLower.includes('botanico')) return 'giardino_botanico';
  if (categoryLower.includes('sport') || categoryLower.includes('avventura') || categoryLower.includes('outdoor')) return 'sport_avventura';
  if (categoryLower.includes('ciclo') || categoryLower.includes('bici')) return 'cicloturismo';
  if (categoryLower.includes('terme') || categoryLower.includes('spa')) return 'centro_termale';
  if (categoryLower.includes('shopping')) return 'shopping_locale';
  if (categoryLower.includes('locale') || categoryLower.includes('divertimento') || categoryLower.includes('notturna')) return 'locali_divertimento';
  
  // Default per esperienze non classificabili
  return 'esperienza_unica';
}

/**
 * Enhance experiences with precise geolocation data
 */
async function enhanceExperiencesWithGeolocation(
  experiences: InsertLocalExperience[], 
  hotelCoordinates: Coordinates
): Promise<void> {
  console.log(`🗺️ Miglioramento geolocalizzazione per ${experiences.length} esperienze...`);
  
  for (const experience of experiences) {
    try {
      // Note: In a production system, you could geocode each attraction
      // and calculate precise distances here
      
      // For now, validate that distances are reasonable
      if (experience.distance) {
        const distanceMatch = experience.distance.match(/(\d+)/);
        const distanceKm = distanceMatch ? parseInt(distanceMatch[1]) : 0;
        
        if (distanceKm > 50) {
          console.warn(`⚠️ Distanza oltre limite per ${experience.name}: ${distanceKm}km`);
          experience.distance = `${Math.min(distanceKm, 50)} km`;
        }
        
        if (distanceKm < 1) {
          console.warn(`⚠️ Distanza troppo vicina per ${experience.name}: ${distanceKm}km`);
          experience.distance = `${Math.max(distanceKm, 1)} km`;
        }
      }
      
    } catch (error) {
      console.warn(`Errore validazione geolocalizzazione per ${experience.name}:`, error);
    }
  }
  
  console.log("✅ Validazione geolocalizzazione completata");
}

/**
 * Get recommended search areas based on hotel location
 */
export async function getRecommendedSearchAreas(hotel: Hotel): Promise<{
  primaryArea: string;
  secondaryAreas: string[];
  searchRadius: number;
  coordinates?: Coordinates;
}> {
  if (!hotel.postalCode) {
    throw new Error("CAP hotel richiesto per raccomandazioni geografiche");
  }

  const locationContext = await GeolocationService.getLocationContext(
    hotel.postalCode,
    hotel.city,
    hotel.region
  );

  return {
    primaryArea: locationContext.referencePoint,
    secondaryAreas: locationContext.nearbyAreas,
    searchRadius: 50,
    coordinates: locationContext.coordinates || undefined
  };
}