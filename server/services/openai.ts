import OpenAI from "openai";
import type { GuestProfile, Hotel, LocalExperience } from "@shared/schema";
import { LANDEO_CATEGORIES } from "@shared/categories";

// Rate limiting per OpenAI API - critico per controllo costi
class OpenAIRateLimiter {
  private requests: { [key: string]: number[] } = {};
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 5, windowMs: number = 60 * 1000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async checkLimit(identifier: string = 'default'): Promise<boolean> {
    const now = Date.now();
    
    // Inizializza array se non esiste
    if (!this.requests[identifier]) {
      this.requests[identifier] = [];
    }

    // Rimuovi richieste fuori dalla finestra temporale
    this.requests[identifier] = this.requests[identifier].filter(
      timestamp => now - timestamp < this.windowMs
    );

    // Controlla se abbiamo raggiunto il limite
    if (this.requests[identifier].length >= this.maxRequests) {
      console.warn(`⚠️ OpenAI rate limit raggiunto per ${identifier}: ${this.requests[identifier].length}/${this.maxRequests} richieste in ${this.windowMs}ms`);
      return false;
    }

    // Aggiungi la richiesta corrente
    this.requests[identifier].push(now);
    return true;
  }
}

// Rate limiter per OpenAI: max 5 richieste per minuto per controllo costi
const openaiLimiter = new OpenAIRateLimiter(5, 60 * 1000);

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || (() => {
    throw new Error('OPENAI_API_KEY environment variable is required');
  })()
});

// Multilingual templates for itinerary generation
const ITINERARY_TEMPLATES = {
  it: {
    matchLabels: {
      high: 'PREFERENZA TOP',
      medium: 'BUON MATCH', 
      standard: 'STANDARD'
    },
    matchWith: 'Match con:',
    systemRole: "Sei un esperto guida turistica italiana specializzato nella creazione di itinerari personalizzati per hotel di lusso. Rispondi sempre in JSON valido.",
    promptTemplate: (days: number, hotel: any, guestProfile: any, experiencesText: string, checkInDate: Date, checkOutDate: Date) => `
Crea un itinerario personalizzato per ${days} giorno/i per ospiti dell'hotel "${hotel.name}" situato a ${hotel.city}, ${hotel.region}.

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
9. INFORMAZIONI LOCALITÀ: Per ogni attività, includi sia "location" (località generale) che "address" (indirizzo specifico) quando disponibili dalle esperienze locali
10. VINCOLO ASSOLUTO: Non aggiungere mai attività non presenti nella lista "ESPERIENZE LOCALI DISPONIBILI"

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
          "address": "Indirizzo specifico (se disponibile)",
          "description": "Descrizione dettagliata",
          "experienceId": "id_esperienza_se_applicabile",
          "duration": "2 ore",
          "notes": "Note aggiuntive",
          "source": "preference-matched"
        }
      ]
    }
  ]
}`
  },
  en: {
    matchLabels: {
      high: 'TOP PREFERENCE',
      medium: 'GOOD MATCH',
      standard: 'STANDARD'
    },
    matchWith: 'Matches with:',
    systemRole: "You are an expert Italian tour guide specialized in creating personalized itineraries for luxury hotels. Always respond in valid JSON format.",
    promptTemplate: (days: number, hotel: any, guestProfile: any, experiencesText: string, checkInDate: Date, checkOutDate: Date) => `
Create a personalized itinerary for ${days} day(s) for guests of "${hotel.name}" hotel located in ${hotel.city}, ${hotel.region}.

GUEST PROFILE:
- Type: ${guestProfile.type}
- Number of people: ${guestProfile.numberOfPeople}
- Reference name: ${guestProfile.referenceName}
- Ages: ${guestProfile.ages?.join(", ") || "Not specified"}
- Preferences: ${guestProfile.preferences?.join(", ") || "Not specified"}
- Special requests: ${guestProfile.specialRequests || "None"}
- Check-in: ${checkInDate.toLocaleDateString("en-US")}
- Check-out: ${checkOutDate.toLocaleDateString("en-US")}

AVAILABLE LOCAL EXPERIENCES:
${experiencesText}

MANDATORY INSTRUCTIONS:
1. Create an itinerary that reflects the guests' profile and preferences
2. USE EXCLUSIVELY the local experiences provided above - DO NOT invent or add generic activities
3. If there aren't enough experiences to fill all days, repeat the best ones or create time variations
4. Balance experiences based on matching: priority to "TOP PREFERENCE", then "GOOD MATCH", finally "STANDARD"
5. Provide realistic times and detailed descriptions for each provided experience
6. Consider distances and travel times between listed experiences
7. Include only breaks and meals between experiences, never invented activities
8. IMPORTANT: For each activity, ALWAYS specify the "source" field:
   - "preference-matched" for experiences marked as "TOP PREFERENCE" or "GOOD MATCH"
   - "hotel-suggested" for experiences marked as "STANDARD"
9. LOCATION INFORMATION: For each activity, include both "location" (general area) and "address" (specific address) when available from local experiences
10. ABSOLUTE CONSTRAINT: Never add activities not present in the "AVAILABLE LOCAL EXPERIENCES" list

Respond ONLY in valid JSON format with this structure:
{
  "title": "Itinerary title",
  "description": "Brief general description",
  "days": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "activities": [
        {
          "time": "09:00",
          "activity": "Activity name",
          "location": "Location",
          "address": "Specific address (if available)",
          "description": "Detailed description",
          "experienceId": "experience_id_if_applicable",
          "duration": "2 hours",
          "notes": "Additional notes",
          "source": "preference-matched"
        }
      ]
    }
  ]
}`
  }
};

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
      address?: string;
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

  // Determine guest language for multilingual support
  const guestLanguage = (guestProfile.emailLanguage || 'it') as 'it' | 'en';
  const template = ITINERARY_TEMPLATES[guestLanguage];

  // Calculate preference matches for experiences
  const experienceMatches = calculateExperienceMatches(guestProfile, localExperiences);
  
  // Build the prompt for AI with preference match information in the guest's language
  const experiencesText = experienceMatches.map((match: any) => {
    const exp = match.experience;
    const matchInfo = match.matchType === 'high' ? template.matchLabels.high : 
                     match.matchType === 'medium' ? template.matchLabels.medium : template.matchLabels.standard;
    const preferenceList = match.matchingPreferences.length > 0 ? 
                          ` [${template.matchWith} ${match.matchingPreferences.join(", ")}]` : '';
    
    const locationInfo = exp.address ? `${exp.location} - ${exp.address}` : exp.location;
    return `${exp.name} (${exp.category}) - ${matchInfo}${preferenceList} - ${exp.description} - ${guestLanguage === 'it' ? 'Ubicazione' : 'Location'}: ${locationInfo} - ${guestLanguage === 'it' ? 'Distanza' : 'Distance'}: ${exp.distance} - ${guestLanguage === 'it' ? 'Durata' : 'Duration'}: ${exp.duration} - Target: ${exp.targetAudience?.join(", ")}`;
  }).join("\n");

  const prompt = template.promptTemplate(actualDays, hotel, guestProfile, experiencesText, checkInDate, checkOutDate);

  try {
    // Controlla rate limiting prima di chiamare OpenAI API - critico per controllo costi
    const canMakeRequest = await openaiLimiter.checkLimit('itinerary');
    if (!canMakeRequest) {
      console.error('❌ Rate limit raggiunto per OpenAI API. Riprova tra un minuto.');
      throw new Error('Troppe richieste API OpenAI per generazione itinerari. Riprova tra un minuto.');
    }

    console.log(`🤖 Generazione itinerario AI per ${hotel.name} - ${guestProfile.referenceName}`);

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: template.systemRole
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
