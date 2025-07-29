import OpenAI from "openai";
import type { Hotel, LocalExperience, InsertLocalExperience } from "@shared/schema";
import { LANDEO_CATEGORIES } from "@shared/categories";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateLocalExperiences(hotel: Hotel): Promise<InsertLocalExperience[]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured");
  }

  if (!hotel.postalCode) {
    throw new Error("CAP hotel non trovato - necessario per localizzazione attrazioni");
  }

  // Crea la lista delle 20 categorie per il prompt
  const categoriesList = LANDEO_CATEGORIES.map(cat => cat.label).join('\n');

  const prompt = `Sei un esperto di turismo italiano. Trova attrazioni turistiche autentiche entro 50km dal CAP ${hotel.postalCode} (${hotel.city}, ${hotel.region}).

CATEGORIE AMMESSE (scegli ESATTAMENTE una di queste 20):
${categoriesList}

ISTRUZIONI:
- Trova attrazioni turistiche REALI ed ESISTENTI entro 50km dal CAP ${hotel.postalCode}
- Ogni attrazione deve appartenere a UNA SOLA delle 20 categorie sopra elencate
- Valuta attentamente la natura di ogni attrazione per assegnarla alla categoria più appropriata
- Includi distanza approssimativa dal CAP ${hotel.postalCode}

FORMATO OUTPUT (Tabella Markdown):
| Nome | Categoria | Distanza (km) | Descrizione | Perché è consigliata |
|------|-----------|---------------|-------------|---------------------|
| [Nome attrazione] | [Numero. Nome categoria] | [X] | [Descrizione breve e accattivante] | [Motivo per cui vale la pena visitarla] |

Genera 15-20 attrazioni diverse, assicurandoti di coprire varie categorie e distanze.`;

  console.log(`Generazione attrazioni per CAP ${hotel.postalCode}`);
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system", 
          content: "Sei un esperto locale di turismo italiano con conoscenza approfondita delle attrazioni autentiche."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const markdownContent = response.choices[0].message.content;
    if (!markdownContent) {
      throw new Error("Nessuna risposta da OpenAI");
    }

    console.log("Risposta AI ricevuta, parsing in corso...");
    return parseMarkdownToExperiences(markdownContent, hotel.id);

  } catch (error) {
    console.error("Errore generazione AI:", error);
    throw new Error(`Errore nella generazione delle attrazioni: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`);
  }
}

function parseMarkdownToExperiences(markdownContent: string, hotelId: number): InsertLocalExperience[] {
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
        const [nome, categoriaAI, distanzaStr, descrizione, perche] = cells;
        
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
          cat.label.includes(categoryNumber.toString()) && 
          cat.label.toLowerCase().includes(categoryName.toLowerCase())
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
          distanceKm,
          whyRecommended: perche
        });

        console.log(`✓ Aggiunta: ${nome} (${landeaCategory.label}) - ${distanceKm}km`);
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
    categoryLower.includes(cat.label.toLowerCase())
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