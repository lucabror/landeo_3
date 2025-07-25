import OpenAI from "openai";
import type { Hotel, GuestProfile, LocalExperience } from "@shared/schema";
import { storage } from "../storage";
import { randomUUID } from "crypto";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateGuestSpecificItinerary(
  hotel: Hotel,
  guestProfile: GuestProfile,
  localExperiences: LocalExperience[]
) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured");
  }

  const stayDuration = Math.ceil(
    (new Date(guestProfile.checkOutDate).getTime() - new Date(guestProfile.checkInDate).getTime()) 
    / (1000 * 60 * 60 * 24)
  );

  // Create AI prompt for guest-specific itinerary
  const prompt = `
Genera un itinerario personalizzato per un ospite di ${hotel.name} a ${hotel.city}, ${hotel.region}.

INFORMAZIONI OSPITE:
- Nome: ${guestProfile.referenceName}
- Tipo: ${guestProfile.type}
- Numero persone: ${guestProfile.numberOfPeople}
- Durata soggiorno: ${stayDuration} giorni
- Check-in: ${new Date(guestProfile.checkInDate).toLocaleDateString('it-IT')}
- Check-out: ${new Date(guestProfile.checkOutDate).toLocaleDateString('it-IT')}
- Preferenze: ${guestProfile.preferences?.join(", ") || "Nessuna preferenza specifica"}
- Richieste speciali: ${guestProfile.specialRequests || "Nessuna"}

HOTEL INFORMAZIONI:
- Nome: ${hotel.name}
- Città: ${hotel.city}, ${hotel.region}
- Servizi: ${hotel.services?.join(", ") || "Standard"}

ESPERIENZE LOCALI DISPONIBILI:
${localExperiences.map(exp => `
- ${exp.name}: ${exp.description}
  Categoria: ${exp.category}
  Durata: ${exp.duration}
  Prezzo: ${exp.priceRange}
  Località: ${exp.location}
`).join("\n")}

ISTRUZIONI:
1. Crea un itinerario specifico per questo ospite di ${stayDuration} giorni
2. Considera le preferenze dell'ospite: ${guestProfile.preferences?.join(", ") || "generale"}
3. Includi le esperienze locali più adatte dal catalogo fornito
4. Aggiungi suggerimenti per pasti e momenti di relax
5. Considera il tipo di ospite: ${guestProfile.type}
6. Bilancia attività attive e momenti di relax

Rispondi SOLO con un oggetto JSON valido nel seguente formato:
{
  "title": "Titolo dell'itinerario personalizzato",
  "description": "Breve descrizione dell'itinerario",
  "days": [
    {
      "day": 1,
      "date": "2024-01-01",
      "activities": [
        {
          "time": "09:00",
          "activity": "Nome attività",
          "location": "Località",
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
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "Sei un esperto di turismo in Italia specializzato nella creazione di itinerari personalizzati. Rispondi sempre con JSON valido."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const aiResponse = JSON.parse(response.choices[0].message.content || "{}");
    
    // Create unique URL for the itinerary
    const uniqueUrl = randomUUID();
    
    // Save itinerary to database
    const itinerary = await storage.createItinerary({
      hotelId: hotel.id,
      guestProfileId: guestProfile.id,
      title: aiResponse.title || `Itinerario per ${guestProfile.referenceName}`,
      description: aiResponse.description || "Itinerario personalizzato generato con AI",
      days: aiResponse.days || [],
      status: "active",
      uniqueUrl: uniqueUrl,
      aiPrompt: prompt,
      aiResponse: aiResponse
    });

    return itinerary;
  } catch (error) {
    console.error("Error generating AI itinerary:", error);
    throw new Error("Failed to generate itinerary with AI");
  }
}