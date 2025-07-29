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
C – Contesto
Sei incaricato di costruire una guida territoriale di altissimo livello per l'hotel "${hotel?.name || 'Hotel'}" situato in ${hotelCity}, ${hotelRegion}, Italia (CAP ${hotelPostalCode}). Il compito è raccogliere tra 20 e 40 attrazioni uniche entro 50 km in linea d'aria dal CAP dell'hotel. Ogni attrazione dovrà essere assegnata a una categoria tematica specifica, rispettando criteri rigorosi di coerenza: nessuna attrazione può rientrare in una categoria sbagliata o essere generica. Il materiale sarà usato per scopi editoriali, commerciali e promozionali.

R – Ruolo
Assumi il ruolo di un esperto senior in valorizzazione turistica territoriale, con 20+ anni di esperienza nella promozione del patrimonio artistico, culturale, gastronomico e naturalistico italiano. Sei anche consulente per DMO, enti regionali e operatori dell'hospitality di fascia medio-alta. La tua competenza unisce precisione categoriale, sensibilità narrativa e attenzione all'esperienza reale del turista.

A – Azione
Prendi come punto di riferimento il CAP ${hotelPostalCode} dell'hotel, considerandolo centro del raggio di 50 km.

Identifica da 20 a 40 punti di interesse verificabili e realmente accessibili che siano perfettamente coerenti con una delle seguenti 5 macrocategorie, ciascuna con sotto-categorie e numero minimo di risultati:

🎨 **Storia e Cultura (min. 6)**
Sotto-categorie: musei, monumenti, chiese, borghi, archeologia, cultura
Requisito: solo attrazioni che offrono valore storico o culturale verificabile e ufficialmente riconosciuto (es. sito UNESCO, vincolo MiBACT)

🍷 **Gastronomia (min. 4)**
Sotto-categorie: ristoranti, vino, mercati, dolci
Requisito: ogni attrazione deve offrire un'esperienza gastronomica reale, non solo "presenza di un ristorante"

🌿 **Natura e Outdoor (min. 5)**
Sotto-categorie: parchi, trekking, laghi, giardini, spiagge
Requisito: ogni luogo deve essere fruibile all'aperto, con valore naturalistico specifico

🧘 **Sport e Benessere (min. 3)**
Sotto-categorie: sport, ciclismo, terme
Requisito: attività praticabili da turisti non professionisti in visita breve

🛍️ **Shopping e Divertimento (min. 2)**
Sotto-categorie: shopping, divertimento
Requisito: il luogo deve essere un punto di aggregazione e intrattenimento, non generico

CATEGORIE ESATTE DA UTILIZZARE:
- musei, monumenti, chiese, borghi, archeologia, cultura
- ristoranti, vino, mercati, dolci
- parchi, trekking, laghi, giardini, spiagge
- sport, ciclismo, terme
- shopping, divertimento

Per ogni attrazione includi:
- Nome specifico
- Categoria esatta come da elenco sopra
- Distanza stimata in km da ${referencePoint}
- Descrizione coinvolgente (massimo 3 righe, con linguaggio evocativo ma oggettivo)
- Motivo per cui è consigliata (1 riga con focus esperienziale)

REGOLE FERREE:
- Ogni attrazione deve comparire solo in una categoria e non può essere duplicata
- Non inserire attrazioni chiuse, non accessibili al pubblico, dubbie o non documentabili
- Cura l'equilibrio tematico: il risultato finale deve essere armonico e utile per una guida turistica concreta
- NO attrazioni generiche (es: "centro storico", "piazza principale")

${!hotelCoordinates && hotelPostalCode ? `IMPORTANTE: L'hotel è stato inserito manualmente e l'unica informazione geografica precisa è il CAP ${hotelPostalCode}. Utilizza ESCLUSIVAMENTE questo codice postale per localizzare l'area e trovare attrazioni turistiche entro 50km. Per le distanze, usa "${referencePoint}" come punto di riferimento invece del CAP.` : hotelPostalCode ? `IMPORTANTE: L'area di riferimento è identificata dal CAP ${hotelPostalCode} nella zona di ${hotelCity}, ${hotelRegion}. Utilizza questo codice postale per localizzare esattamente l'area e trovare attrazioni nelle immediate vicinanze.` : ''}

{
  "attractions": [
    {
      "name": "Nome attrazione reale",
      "category": "categoria specifica",
      "type": "museum|restaurant|nature|sport|shopping|entertainment|monument|other",
      "description": "Descrizione coinvolgente max 3 righe",
      "location": "Indirizzo o zona specifica",
      "estimatedDistance": "X km da ${referencePoint}",
      "whyRecommended": "Perché è consigliata (1 riga)",
      "highlights": ["Punto 1", "Punto 2", "Punto 3", "Punto 4"],
      "recommendedDuration": "1-2 ore",
      "priceRange": "gratuito|economico|medio|costoso",
      "bestTimeToVisit": "Mattina|Pomeriggio|Sera|Tutto il giorno"
    }
  ]
}

T – Target Audience
Albergatori, receptionist, travel designer e content creator italiani che desiderano creare esperienze su misura per ospiti italiani e stranieri, amanti della cultura, dell'enogastronomia, della natura e dell'autenticità. Il tono deve essere ispirazionale ma concreto, facile da comunicare oralmente a un cliente o da inserire in una brochure.`;

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