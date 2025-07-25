import OpenAI from "openai";
import type { GuestProfile, Hotel, LocalExperience } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

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
    }>;
  }>;
  prompt: string;
}> {
  const checkInDate = new Date(guestProfile.checkInDate);
  const checkOutDate = new Date(guestProfile.checkOutDate);
  const stayDuration = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
  const actualDays = Math.min(requestedDays, stayDuration);

  // Build the prompt for AI
  const experiencesText = localExperiences.map(exp => 
    `${exp.name} (${exp.category}) - ${exp.description} - Ubicazione: ${exp.location} - Distanza: ${exp.distance} - Durata: ${exp.duration} - Target: ${exp.targetAudience?.join(", ")}`
  ).join("\n");

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

ISTRUZIONI:
1. Crea un itinerario che rispecchi il profilo degli ospiti e le loro preferenze
2. Includi sia esperienze locali disponibili che attività generiche appropriate per la zona
3. Bilancia cultura, gastronomia, natura e relax in base al tipo di ospite
4. Fornisci orari realistici e descrizioni dettagliate
5. Considera distanze e tempi di spostamento
6. Includi raccomandazioni per pasti e pause

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
          "notes": "Note aggiuntive"
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
    
    // Validate and format dates
    for (let i = 0; i < result.days.length; i++) {
      const dayDate = new Date(checkInDate);
      dayDate.setDate(dayDate.getDate() + i);
      result.days[i].date = dayDate.toISOString().split('T')[0];
      result.days[i].day = i + 1;
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
