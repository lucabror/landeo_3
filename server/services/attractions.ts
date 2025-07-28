import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface LocalAttraction {
  name: string;
  type: 'restaurant' | 'museum' | 'exhibition' | 'nature' | 'sport' | 'monument' | 'shopping' | 'entertainment' | 'other';
  description: string;
  location: string;
  estimatedDistance: string;
  category: string;
  highlights: string[];
  recommendedDuration: string;
  priceRange: 'gratuito' | 'economico' | 'medio' | 'costoso';
  bestTimeToVisit: string;
}

interface AttractionSearchResult {
  attractions: LocalAttraction[];
  searchArea: string;
  totalFound: number;
}

export async function findLocalAttractions(
  hotelCity: string, 
  hotelRegion: string, 
  hotelCoordinates?: { latitude: string; longitude: string } | null,
  hotelPostalCode?: string
): Promise<AttractionSearchResult> {
  try {
    const searchArea = hotelPostalCode 
      ? `CAP ${hotelPostalCode}, ${hotelCity}, ${hotelRegion}, Italia`
      : `${hotelCity}, ${hotelRegion}, Italia`;
    
    const prompt = `Sei un esperto di turismo locale in Italia. Trova le migliori attrazioni turistiche entro 50km da ${searchArea}.

${hotelPostalCode ? `IMPORTANTE: L'area di riferimento è identificata dal CAP ${hotelPostalCode} che è un identificatore geografico preciso. Utilizza questo codice postale per localizzare esattamente l'area e trovare attrazioni nelle immediate vicinanze.` : ''}

Includi:
- Ristoranti tipici e rinomati
- Musei e siti culturali
- Mostre temporanee e permanenti
- Punti paesaggistici e naturali
- Luoghi per attività sportive
- Monumenti e siti storici
- Centri commerciali e negozi caratteristici
- Luoghi di intrattenimento

Per ogni attrazione, fornisci:
- Nome preciso
- Tipo (restaurant/museum/exhibition/nature/sport/monument/shopping/entertainment/other)
- Descrizione coinvolgente (2-3 frasi)
- Posizione specifica
- Distanza stimata da ${hotelPostalCode ? `CAP ${hotelPostalCode}` : hotelCity}
- Categoria dettagliata
- 3-4 punti salienti
- Durata consigliata della visita
- Fascia di prezzo (gratuito/economico/medio/costoso)
- Momento migliore per visitare

Trova esattamente 20 attrazioni diverse e interessanti. Rispondi in formato JSON con questa struttura:

{
  "attractions": [
    {
      "name": "Nome attrazione",
      "type": "tipo",
      "description": "Descrizione coinvolgente",
      "location": "Indirizzo o zona specifica",
      "estimatedDistance": "X km da ${hotelPostalCode ? `CAP ${hotelPostalCode}` : hotelCity}",
      "category": "Categoria dettagliata",
      "highlights": ["Punto 1", "Punto 2", "Punto 3"],
      "recommendedDuration": "1-2 ore",
      "priceRange": "economico",
      "bestTimeToVisit": "Mattina/Pomeriggio/Sera/Tutto il giorno"
    }
  ]
}`;

    console.log(`Searching for attractions near ${searchArea}`);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Sei un esperto di turismo locale in Italia. Rispondi sempre in italiano e fornisci informazioni accurate e aggiornate sulle attrazioni turistiche."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 4000
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    if (!result.attractions || !Array.isArray(result.attractions)) {
      throw new Error('Formato risposta OpenAI non valido');
    }

    // Valida e pulisce i dati
    const validatedAttractions: LocalAttraction[] = result.attractions
      .slice(0, 20) // Assicura max 20 attrazioni
      .map((attraction: any) => ({
        name: attraction.name || 'Attrazione sconosciuta',
        type: ['restaurant', 'museum', 'exhibition', 'nature', 'sport', 'monument', 'shopping', 'entertainment', 'other']
          .includes(attraction.type) ? attraction.type : 'other',
        description: attraction.description || 'Descrizione non disponibile',
        location: attraction.location || `${hotelCity}, ${hotelRegion}`,
        estimatedDistance: attraction.estimatedDistance || 'Distanza non specificata',
        category: attraction.category || 'Generale',
        highlights: Array.isArray(attraction.highlights) ? attraction.highlights.slice(0, 4) : [],
        recommendedDuration: attraction.recommendedDuration || '1-2 ore',
        priceRange: ['gratuito', 'economico', 'medio', 'costoso']
          .includes(attraction.priceRange) ? attraction.priceRange : 'medio',
        bestTimeToVisit: attraction.bestTimeToVisit || 'Tutto il giorno'
      }));

    console.log(`Found ${validatedAttractions.length} attractions for ${searchArea}`);

    return {
      attractions: validatedAttractions,
      searchArea,
      totalFound: validatedAttractions.length
    };

  } catch (error) {
    console.error('Error finding local attractions:', error);
    throw new Error('Errore nella ricerca delle attrazioni locali: ' + (error instanceof Error ? error.message : String(error)));
  }
}

// Funzione per convertire un'attrazione in formato LocalExperience
export function attractionToLocalExperience(attraction: LocalAttraction, hotelId: string): any {
  return {
    hotelId,
    name: attraction.name,
    description: attraction.description,
    category: attraction.category,
    location: attraction.location,
    distance: attraction.estimatedDistance, // Mappo a distance per compatibilità schema
    duration: attraction.recommendedDuration,
    priceRange: attraction.priceRange,
    contactInfo: {}, // Oggetto vuoto per contactInfo
    openingHours: null,
    seasonality: null,
    targetAudience: [], // Array vuoto per targetAudience
    rating: null,
    imageUrl: null,
    isActive: true,
    // Campi AI aggiuntivi
    aiGenerated: true,
    attractionType: attraction.type,
    estimatedDistance: attraction.estimatedDistance,
    bestTimeToVisit: attraction.bestTimeToVisit,
    highlights: attraction.highlights || []
  };
}