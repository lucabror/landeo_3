import OpenAI from "openai";
import type { GuestProfile, Hotel, LocalExperience } from "@shared/schema";
import { LANDEO_CATEGORIES } from "@shared/categories";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || (() => {
    throw new Error('OPENAI_API_KEY environment variable is required');
  })()
});

// Simple preference matching function
function calculateExperienceMatches(guestProfile: GuestProfile, localExperiences: LocalExperience[]) {
  const guestPreferences = guestProfile.preferences || [];
  
  return localExperiences.map(experience => {
    // Find category match
    const categoryInfo = LANDEO_CATEGORIES.find(cat => cat.value === experience.category);
    // Use the guest's language preference to get the right text - fallback to Italian if no language specified
    const language = (guestProfile.emailLanguage || 'it') as 'it' | 'en';
    const categoryEmailText = categoryInfo?.emailText[language] || '';
    
    // Check if experience category matches guest preferences
    const matchingPreferences = guestPreferences.filter(pref => 
      categoryEmailText.toLowerCase().includes(pref.toLowerCase()) ||
      experience.name.toLowerCase().includes(pref.toLowerCase()) ||
      experience.description.toLowerCase().includes(pref.toLowerCase())
    );
    
    // Determine match type
    let matchType: 'high' | 'medium' | 'low' = 'low';
    if (matchingPreferences.length >= 2) {
      matchType = 'high';
    } else if (matchingPreferences.length === 1) {
      matchType = 'medium';
    }
    
    return {
      experience,
      matchType,
      matchingPreferences
    };
  });
}

export async function generateItinerary(
  guestProfile: GuestProfile,
  hotel: Hotel,
  localExperiences: LocalExperience[],
  requestedDays: number
): Promise<{
  title: string;
  description: string;
  days: Array<{
    day: number;
    date: string;
    activities: Array<{
      time: string;
      activity: string;
      location: string;
      description: string;
      experienceId?: string;
      duration?: string;
      notes?: string;
      source?: 'preference-matched' | 'hotel-suggested';
    }>;
  }>;
  prompt: string;
}> {
  const checkInDate = new Date(guestProfile.checkInDate);
  const checkOutDate = new Date(guestProfile.checkOutDate);
  const stayDuration = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
  const actualDays = Math.min(requestedDays, stayDuration);

  // Calculate preference matches for experiences
  const experienceMatches = calculateExperienceMatches(guestProfile, localExperiences);
  
  // Build the prompt for AI with preference match information
  const experiencesText = experienceMatches.map((match: any) => {
    const exp = match.experience;
    const matchInfo = match.matchType === 'high' ? 'PREFERENZA TOP' : 
                     match.matchType === 'medium' ? 'BUON MATCH' : 'STANDARD';
    const preferenceList = match.matchingPreferences.length > 0 ? 
                          ` [Match con: ${match.matchingPreferences.join(", ")}]` : '';
    
    return `${exp.name} (${exp.category}) - ${matchInfo}${preferenceList} - ${exp.description} - Ubicazione: ${exp.location} - Distanza: ${exp.distance} - Durata: ${exp.duration} - Target: ${exp.targetAudience?.join(", ")}`;
  }).join("\n");

  const prompt = `
Crea un itinerario personalizzato per ${actualDays} giorno/i per ospiti dell'hotel "${hotel.name}" situato a ${hotel.city}, ${hotel.region}.

PROFILO OSPITI:
- Tipo: ${guestProfile.type}
- Numero persone: ${guestProfile.numberOfPeople}
- Nome riferimento: ${guestProfile.referenceName}
- Età: ${guestProfile.ages?.join(", ") || "Non specificato"}
- Preferenze: ${guestProfile.preferences?.join(", ") || "Non specificate"}
- Richieste speciali: ${guestProfile.specialRequests || "Nessuna"}
- Check-in: ${checkInDate.toLocaleDateString("it-IT")}
- Check-out: ${checkOutDate.toLocaleDateString("it-IT")}

ESPERIENZE LOCALI DISPONIBILI:
${experiencesText}

ISTRUZIONI OBBLIGATORIE:
1. Crea un itinerario che rispecchi il profilo degli ospiti e le loro preferenze
2. USA ESCLUSIVAMENTE le esperienze locali fornite sopra - NON inventare o aggiungere attività generiche
3. Se non ci sono abbastanza esperienze per riempire tutti i giorni, ripeti le migliori o crea variazioni orarie
4. Bilancia le esperienze in base al matching: priorità a "PREFERENZA TOP", poi "BUON MATCH", infine "STANDARD"
5. Fornisci orari realistici e descrizioni dettagliate per ogni esperienza fornita
6. Considera distanze e tempi di spostamento tra le esperienze elencate
7. Includi solo pause e pasti tra le esperienze, mai attività inventate
8. IMPORTANTE: Per ogni attività, specifica SEMPRE il campo "source":
   - "preference-matched" per esperienze marcate come "PREFERENZA TOP" o "BUON MATCH"
   - "hotel-suggested" per esperienze marcate come "STANDARD"
9. VINCOLO ASSOLUTO: Non aggiungere mai attività non presenti nella lista "ESPERIENZE LOCALI DISPONIBILI"

Rispondi SOLO in formato JSON valido con questa struttura:
{
  "title": "Titolo dell'itinerario",
  "description": "Breve descrizione generale",
  "days": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "activities": [
        {
          "time": "09:00",
          "activity": "Nome attività",
          "location": "Luogo",
          "description": "Descrizione dettagliata",
          "experienceId": "id_esperienza_se_applicabile",
          "duration": "2 ore",
          "notes": "Note aggiuntive",
          "source": "preference-matched"
        }
      ]
    }
  ]
}
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Sei un esperto guida turistica italiana specializzato nella creazione di itinerari personalizzati per hotel di lusso. Rispondi sempre in JSON valido."
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

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    // Validate and format dates and ensure source field
    for (let i = 0; i < result.days.length; i++) {
      const dayDate = new Date(checkInDate);
      dayDate.setDate(dayDate.getDate() + i);
      result.days[i].date = dayDate.toISOString().split('T')[0];
      result.days[i].day = i + 1;
      
      // Ensure all activities have a source field
      if (result.days[i].activities) {
        result.days[i].activities.forEach((activity: any) => {
          if (!activity.source) {
            activity.source = 'hotel-suggested'; // Default fallback
          }
        });
      }
    }

    return {
      ...result,
      prompt
    };
  } catch (error) {
    console.error("OpenAI API Error:", error);
    throw new Error("Failed to generate itinerary with AI: " + (error instanceof Error ? error.message : String(error)));
  }
}
