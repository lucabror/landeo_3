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
  hotelCity: string | null, 
  hotelRegion: string | null, 
  hotelCoordinates?: { latitude: string; longitude: string } | null,
  hotelPostalCode?: string
): Promise<AttractionSearchResult> {
  try {
    // Determina l'area di ricerca in base ai parametri disponibili
    let searchArea: string;
    let referencePoint: string;
    
    if (!hotelCoordinates && hotelPostalCode) {
      // Hotel inserito manualmente: usa solo CAP per area di ricerca, ma città per reference
      searchArea = `CAP ${hotelPostalCode}, Italia`;
      referencePoint = hotelCity || `CAP ${hotelPostalCode}`;
    } else if (hotelCoordinates && hotelPostalCode && hotelCity && hotelRegion) {
      // Hotel geolocalizzato: usa tutti i dati
      searchArea = `CAP ${hotelPostalCode}, ${hotelCity}, ${hotelRegion}, Italia`;
      referencePoint = hotelCity;
    } else {
      // Fallback per casi edge
      searchArea = `${hotelCity || 'area non specificata'}, ${hotelRegion || 'Italia'}`;
      referencePoint = hotelCity || 'hotel';
    }
    
    const prompt = `Sei un esperto di turismo locale in Italia. Trova le migliori attrazioni turistiche entro 50km da ${searchArea}.

${!hotelCoordinates && hotelPostalCode ? `IMPORTANTE: L'hotel è stato inserito manualmente e l'unica informazione geografica precisa è il CAP ${hotelPostalCode}. Utilizza ESCLUSIVAMENTE questo codice postale per localizzare l'area e trovare attrazioni turistiche entro 50km. Per le distanze, usa "${referencePoint}" come punto di riferimento invece del CAP.` : hotelPostalCode ? `IMPORTANTE: L'area di riferimento è identificata dal CAP ${hotelPostalCode} che è un identificatore geografico preciso. Utilizza questo codice postale per localizzare esattamente l'area e trovare attrazioni nelle immediate vicinanze.` : ''}

CATEGORIE OBBLIGATORIE - Scegli SOLO UNA di queste 15 categorie per ogni attrazione:

STORIA E CULTURA (5 categorie):
1. "musei" - SOLO musei, gallerie d'arte, collezioni artistiche
2. "monumenti" - SOLO monumenti storici, castelli, palazzi antichi, rovine
3. "chiese" - SOLO chiese, santuari, basiliche, luoghi sacri
4. "borghi" - SOLO borghi medievali, centri storici, quartieri antichi
5. "archeologia" - SOLO scavi archeologici, siti antichi, aree archeologiche

GASTRONOMIA (3 categorie):
6. "ristoranti" - SOLO ristoranti, trattorie, osterie tradizionali
7. "vino" - SOLO cantine, wine bar, aziende vinicole, degustazioni vino
8. "mercati" - SOLO mercati locali, sagre, fiere gastronomiche

NATURA E PAESAGGI (4 categorie):
9. "parchi" - SOLO parchi nazionali, riserve naturali, oasi
10. "trekking" - SOLO sentieri di montagna, percorsi escursionistici
11. "laghi" - SOLO laghi, fiumi, cascate, specchi d'acqua naturali
12. "giardini" - SOLO giardini botanici, ville con parco, orti

ATTIVITÀ (2 categorie):
13. "sport" - SOLO impianti sportivi, palestre all'aperto, campi da gioco
14. "ciclismo" - SOLO piste ciclabili, noleggio bici, tour in bicicletta

COMMERCIO (1 categoria):
15. "shopping" - SOLO negozi tipici, mercatini, botteghe artigiane

REGOLE FERREE PER LA CATEGORIZZAZIONE:
- Un LAGO va SEMPRE in categoria "laghi", MAI in altre categorie
- Un MUSEO va SEMPRE in categoria "musei", MAI in "monumenti"
- Un RISTORANTE va SEMPRE in categoria "ristoranti", MAI in "mercati"
- Un PARCO NATURALE va SEMPRE in categoria "parchi", MAI in "giardini"
- Una CHIESA va SEMPRE in categoria "chiese", MAI in "monumenti"
- Ogni attrazione ha UNA SOLA categoria che corrisponde perfettamente al suo tipo principale
- Distribuisci le 20 attrazioni tra tutte le categorie (almeno 1 per categoria)
- ESCLUSIVAMENTE attrazioni reali entro 50km dall'area specificata

Per ogni attrazione, fornisci:
- Nome preciso
- Tipo (restaurant/museum/exhibition/nature/sport/monument/shopping/entertainment/other)
- Descrizione coinvolgente (2-3 frasi)
- Posizione specifica
- Distanza stimata da ${referencePoint} (USA SEMPRE "${referencePoint}" e MAI il codice postale)
- Categoria (USA SOLO UNA delle 15 categorie sopra elencate)
- 3-4 punti salienti
- Durata consigliata della visita
- Fascia di prezzo (gratuito/economico/medio/costoso)
- Momento migliore per visitare

ESEMPI DI CATEGORIZZAZIONE CORRETTA:
✅ "Lago di Bracciano" → categoria: "laghi" (NON "monumenti" o "parchi")
✅ "Museo Etrusco" → categoria: "musei" (NON "archeologia" o "monumenti")
✅ "Castello Odescalchi" → categoria: "monumenti" (NON "musei" o "borghi")
✅ "Basilica di San Pietro" → categoria: "chiese" (NON "monumenti" o "archeologia")
✅ "Borgo di Calcata" → categoria: "borghi" (NON "monumenti" o "archeologia")
✅ "Trattoria da Mario" → categoria: "ristoranti" (NON "mercati")
✅ "Parco dei Monti Cimini" → categoria: "parchi" (NON "trekking" o "laghi")

ATTENZIONE FINALE:
- Ogni attrazione DEVE avere la categoria che corrisponde ESATTAMENTE al suo tipo principale
- Non inventare categorie diverse dalle 15 elencate
- Un lago NON può essere categorizzato come "monumenti" o "eventi culturali"
- Una chiesa NON può essere categorizzata come "musei" o "archeologia"
- Verifica SEMPRE che categoria scelta corrisponda al nome e tipo dell'attrazione

Trova esattamente 20 attrazioni diverse e interessanti distribuite tra le 15 categorie. Rispondi in formato JSON con questa struttura:

{
  "attractions": [
    {
      "name": "Nome attrazione",
      "type": "tipo",
      "description": "Descrizione coinvolgente",
      "location": "Indirizzo o zona specifica",
      "estimatedDistance": "X km da ${referencePoint}",
      "category": "Categoria dettagliata",
      "highlights": ["Punto 1", "Punto 2", "Punto 3"],
      "recommendedDuration": "1-2 ore",
      "priceRange": "economico",
      "bestTimeToVisit": "Mattina/Pomeriggio/Sera/Tutto il giorno"
    }
  ]
}`;

    console.log(`Searching for attractions near ${searchArea}`);
    console.log(`Reference point for distances: ${referencePoint}`);
    
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

// Funzione per mappare le categorie AI alle categorie standardizzate
function mapAIcategoryToStandard(aiCategory: string): string {
  const categoryLower = aiCategory.toLowerCase();
  
  // Shopping
  if (categoryLower.includes('shopping') || categoryLower.includes('svago') || 
      categoryLower.includes('mercato') || categoryLower.includes('outlet') ||
      categoryLower.includes('centro commerciale')) {
    return 'shopping';
  }
  
  // Sport/Avventura  
  if (categoryLower.includes('sport') || categoryLower.includes('arrampicata') ||
      categoryLower.includes('rafting') || categoryLower.includes('climbing') ||
      categoryLower.includes('bike') || categoryLower.includes('palestra')) {
    return 'sport';
  }
  
  // Gastronomia
  if (categoryLower.includes('cucina') || categoryLower.includes('ristorante') ||
      categoryLower.includes('osteria') || categoryLower.includes('trattoria') ||
      categoryLower.includes('gastronomia') || categoryLower.includes('mare')) {
    return 'gastronomia';
  }
  
  // Degustazione
  if (categoryLower.includes('degustazione') || categoryLower.includes('vino') ||
      categoryLower.includes('cantina') || categoryLower.includes('enoteca')) {
    return 'degustazione';
  }
  
  // Natura  
  if (categoryLower.includes('natura') || categoryLower.includes('parco') ||
      categoryLower.includes('giardino') || categoryLower.includes('lago') ||
      categoryLower.includes('bosco') || categoryLower.includes('riserva')) {
    return 'natura';
  }
  
  // Storia/Cultura
  if (categoryLower.includes('archeologico') || categoryLower.includes('sito') ||
      categoryLower.includes('storico') || categoryLower.includes('romano') ||
      categoryLower.includes('medievale') || categoryLower.includes('antico')) {
    return 'storia';
  }
  
  // Arte
  if (categoryLower.includes('arte') || categoryLower.includes('galleria') ||
      categoryLower.includes('pittura') || categoryLower.includes('scultura')) {
    return 'arte';
  }
  
  // Cultura (catch-all per musei/palazzi/basiliche)
  if (categoryLower.includes('museo') || categoryLower.includes('palazzo') ||
      categoryLower.includes('basilica') || categoryLower.includes('chiesa') ||
      categoryLower.includes('cultura') || categoryLower.includes('duomo')) {
    return 'cultura';
  }
  
  // Famiglia
  if (categoryLower.includes('famiglia') || categoryLower.includes('zoo') ||
      categoryLower.includes('bambini') || categoryLower.includes('parco giochi')) {
    return 'famiglia';
  }
  
  // Relax
  if (categoryLower.includes('terme') || categoryLower.includes('spa') ||
      categoryLower.includes('relax') || categoryLower.includes('benessere')) {
    return 'relax';
  }
  
  // Divertimento
  if (categoryLower.includes('divertimento') || categoryLower.includes('luna park') ||
      categoryLower.includes('spettacolo') || categoryLower.includes('teatro')) {
    return 'divertimento';
  }
  
  // Default: cultura
  return 'cultura';
}

// Funzione per convertire un'attrazione in formato LocalExperience
export function attractionToLocalExperience(attraction: LocalAttraction, hotelId: string): any {
  return {
    hotelId,
    name: attraction.name,
    description: attraction.description,
    category: mapAIcategoryToStandard(attraction.category), // Usa mapping standardizzato
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