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

// Map delle categorie dal prompt alle categorie standard del sistema
const categoryMapping: Record<string, string> = {
  'Museo': 'musei',
  'Sito Archeologico': 'archeologia',
  'Monumento Storico': 'monumenti',
  'Chiesa o Luogo Religioso': 'chiese',
  'Borgo Storico': 'borghi',
  'Evento Culturale': 'cultura',
  'Ristorante Tipico': 'ristoranti',
  'Cantina / Enoteca': 'vino',
  'Mercato o Bottega Locale': 'mercati',
  'Laboratorio Artigianale': 'mercati',
  'Parco Naturale': 'parchi',
  'Trekking / Escursione': 'trekking',
  'Lago / Spiaggia': 'laghi',
  'Giardino Botanico / Storico': 'giardini',
  'Sport Avventura / Outdoor': 'sport',
  'Cicloturismo': 'ciclismo',
  'Centro Termale / SPA': 'terme',
  'Shopping Locale': 'shopping',
  'Locali / Divertimento': 'divertimento',
  'Esperienza Unica del Territorio': 'cultura'
};

// Parsing della tabella Markdown generata dall'AI
function parseMarkdownTable(markdownContent: string, hotelCity: string | null, hotelRegion: string | null): LocalAttraction[] {
  const attractions: LocalAttraction[] = [];
  const lines = markdownContent.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip header lines and separators
    if (!line.includes('|') || line.includes('---') || line.includes('Nome') || line.includes('Categoria')) {
      continue;
    }
    
    // Parse table row: | Nome | Categoria | Distanza (km) | Descrizione | Perché è consigliata |
    const columns = line.split('|').map(col => col.trim()).filter(col => col);
    
    if (columns.length >= 5) {
      const name = columns[0];
      const categoryFromAI = columns[1];
      const distance = columns[2];
      const description = columns[3];
      const whyRecommended = columns[4];
      
      // Map AI category to system category
      const mappedCategory = categoryMapping[categoryFromAI] || 'cultura';
      
      // Determine type based on category
      let type: 'restaurant' | 'museum' | 'exhibition' | 'nature' | 'sport' | 'monument' | 'shopping' | 'entertainment' | 'other' = 'other';
      if (['musei', 'archeologia', 'monumenti', 'chiese', 'borghi'].includes(mappedCategory)) {
        type = 'museum';
      } else if (['ristoranti', 'vino', 'mercati'].includes(mappedCategory)) {
        type = 'restaurant';
      } else if (['parchi', 'trekking', 'laghi', 'giardini'].includes(mappedCategory)) {
        type = 'nature';
      } else if (['sport', 'ciclismo', 'terme'].includes(mappedCategory)) {
        type = 'sport';
      } else if (['shopping', 'divertimento'].includes(mappedCategory)) {
        type = 'entertainment';
      }
      
      attractions.push({
        name,
        type,
        description,
        location: `${hotelCity}, ${hotelRegion}`,
        estimatedDistance: distance,
        category: mappedCategory,
        highlights: [whyRecommended],
        recommendedDuration: '1-2 ore',
        priceRange: 'medio',
        bestTimeToVisit: 'Tutto il giorno'
      });
    }
  }
  
  return attractions.slice(0, 40); // Max 40 attrazioni
}

export async function findLocalAttractions(
  hotelCity: string | null, 
  hotelRegion: string | null, 
  hotelCoordinates?: { latitude: string; longitude: string } | null,
  hotelPostalCode?: string,
  hotel?: { name: string }
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
    
    const prompt = `
Contesto:
Sei un esperto in promozione turistica territoriale e hospitality. Devi trovare tra 20 e 40 attrazioni realmente esistenti entro un raggio di 50 km dal CAP ${hotelPostalCode} nella città di ${hotelCity}, in Italia. Ogni attrazione deve essere assegnata a UNA SOLA categoria tra le 20 elencate sotto. Non ci devono essere ambiguità. Nessuna attrazione può appartenere a più di una categoria.

Categorie ammesse:
1. Museo
2. Sito Archeologico
3. Monumento Storico
4. Chiesa o Luogo Religioso
5. Borgo Storico
6. Evento Culturale
7. Ristorante Tipico
8. Cantina / Enoteca
9. Mercato o Bottega Locale
10. Laboratorio Artigianale
11. Parco Naturale
12. Trekking / Escursione
13. Lago / Spiaggia
14. Giardino Botanico / Storico
15. Sport Avventura / Outdoor
16. Cicloturismo
17. Centro Termale / SPA
18. Shopping Locale
19. Locali / Divertimento
20. Esperienza Unica del Territorio

Per ogni attrazione fornisci:
- Nome dell'attrazione
- Categoria (esattamente come da lista sopra)
- Distanza approssimativa in km dal CAP ${hotelPostalCode}
- Breve descrizione (max 3 righe)
- Motivo per cui è consigliata (max 1 riga)

Restituisci il risultato in formato Markdown, ordinando le attrazioni per categoria (dal punto 1 al 20) e usando tabelle con queste colonne:
| Nome | Categoria | Distanza (km) | Descrizione | Perché è consigliata |
`;

    console.log(`Searching for attractions near ${searchArea}`);
    console.log(`Reference point for distances: ${referencePoint}`);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Sei un esperto di turismo locale in Italia. Rispondi sempre in italiano e fornisci informazioni accurate e aggiornate sulle attrazioni turistiche. Rispondi SEMPRE in formato Markdown usando tabelle."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 4000
    });

    const markdownContent = response.choices[0].message.content || '';
    
    if (!markdownContent.includes('|')) {
      throw new Error('Formato risposta OpenAI non valido - expected Markdown table');
    }

    // Parse delle tabelle Markdown per estrarre le attrazioni
    const validatedAttractions: LocalAttraction[] = parseMarkdownTable(markdownContent, hotelCity, hotelRegion);

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