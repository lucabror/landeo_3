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
    
    const prompt = `CONTESTO: Stai aiutando un operatore del settore turistico a migliorare l'offerta esperienziale di un hotel. L'obiettivo è generare un elenco di attrazioni e attività turistiche, culturali, gastronomiche, naturalistiche, sportive e di intrattenimento entro un raggio di 50 km dal ${hotelPostalCode ? `CAP ${hotelPostalCode}` : `punto geografico ${searchArea}`} dell'hotel.

RUOLO: Agisci come un esperto di turismo territoriale e promozione turistica, con oltre 20 anni di esperienza nella valorizzazione delle destinazioni locali. Hai una profonda conoscenza del patrimonio italiano e delle modalità con cui i turisti scelgono e vivono le esperienze di viaggio.

AZIONE:
1. Analizza il ${hotelPostalCode ? `CAP ${hotelPostalCode}` : `punto geografico ${searchArea}`} come punto di partenza e identifica il centro geografico dell'area di ricerca.

2. Raccogli esattamente 20 attrazioni o esperienze entro 50 km in linea d'aria da quel punto.

3. Classifica ogni attrazione in una delle seguenti categorie principali (OBBLIGATORIO):

STORIA E CULTURA (6 attrazioni minime):
- "musei" → musei, gallerie d'arte, collezioni artistiche
- "monumenti" → monumenti storici, castelli, palazzi antichi, fortezze  
- "chiese" → chiese, santuari, basiliche, luoghi sacri
- "borghi" → borghi medievali, centri storici, quartieri antichi
- "archeologia" → scavi archeologici, siti antichi, aree archeologiche
- "cultura" → teatri, concerti, eventi culturali, festival

GASTRONOMIA (4 attrazioni minime):
- "ristoranti" → ristoranti tipici, trattorie, osterie tradizionali
- "vino" → cantine, wine bar, aziende vinicole, degustazioni
- "mercati" → mercati locali, sagre, fiere gastronomiche
- "dolci" → pasticcerie, gelaterie, laboratori artigianali dolci

NATURA E OUTDOOR (5 attrazioni minime):
- "parchi" → parchi naturali, riserve naturali, oasi, aree protette
- "trekking" → percorsi di trekking, sentieri escursionistici, passeggiate
- "laghi" → laghi, fiumi, cascate, specchi d'acqua naturali, punti panoramici
- "giardini" → giardini botanici, ville con parco, orti storici
- "spiagge" → spiagge, stabilimenti balneari, attività marine, costa

SPORT E BENESSERE (3 attrazioni minime):
- "sport" → attività sportive, impianti sportivi, campi da gioco
- "ciclismo" → percorsi ciclabili, bike tours, cicloturismo, noleggio bici
- "terme" → terme, spa, centri benessere, trattamenti rilassanti

SHOPPING E DIVERTIMENTO (2 attrazioni minime):
- "shopping" → boutique locali, outlet, mercatini, botteghe artigiane
- "divertimento" → locali serali, eventi, fiere, festival, vita notturna

4. Per ogni attrazione, fornisci:
- Nome dell'attrazione (preciso e reale)
- Categoria (USA SOLO UNA delle 20 categorie sopra elencate)
- Distanza stimata in km dal ${referencePoint} (USA SEMPRE "${referencePoint}" come riferimento)
- Breve descrizione (max 3 righe, coinvolgente)
- Perché è consigliata (1 riga, motivazione specifica)
- Tipo per sistema (restaurant/museum/exhibition/nature/sport/monument/shopping/entertainment/other)
- 3-4 punti salienti
- Durata consigliata della visita
- Fascia di prezzo (gratuito/economico/medio/costoso)
- Momento migliore per visitare

REGOLE FERREE:
- NON includere attrazioni banali, troppo lontane, non fruibili dal pubblico o non attive
- Evita ripetizioni e cerca varietà nelle proposte
- Tieni conto della stagionalità
- Ogni categoria deve avere ALMENO il numero minimo di attrazioni indicato
- Distribuisci le 20 attrazioni coprendo tutte le 20 categorie possibili
- La categoria DEVE corrispondere esattamente al tipo principale dell'attrazione

TARGET AUDIENCE: Albergatori, receptionist e addetti all'ospitalità in Italia, che parlano italiano fluente e hanno bisogno di suggerimenti pronti da comunicare ai clienti italiani e stranieri.

${!hotelCoordinates && hotelPostalCode ? `IMPORTANTE: L'hotel è stato inserito manualmente e l'unica informazione geografica precisa è il CAP ${hotelPostalCode}. Utilizza ESCLUSIVAMENTE questo codice postale per localizzare l'area e trovare attrazioni turistiche entro 50km. Per le distanze, usa "${referencePoint}" come punto di riferimento invece del CAP.` : hotelPostalCode ? `IMPORTANTE: L'area di riferimento è identificata dal CAP ${hotelPostalCode} nella zona di ${hotelCity}, ${hotelRegion}. Utilizza questo codice postale per localizzare esattamente l'area e trovare attrazioni nelle immediate vicinanze.` : ''}

Trova esattamente 20 attrazioni diverse e interessanti distribuite tra le 20 categorie. Rispondi in formato JSON con questa struttura:

{
  "attractions": [
    {
      "name": "Nome attrazione reale",
      "category": "categoria specifica",
      "type": "tipo sistema",
      "description": "Descrizione coinvolgente max 3 righe",
      "location": "Indirizzo o zona specifica",
      "estimatedDistance": "X km da ${referencePoint}",
      "whyRecommended": "Perché è consigliata (1 riga)",
      "highlights": ["Punto 1", "Punto 2", "Punto 3", "Punto 4"],
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