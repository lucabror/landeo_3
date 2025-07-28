import OpenAI from "openai";
import type { Hotel, GuestProfile, LocalExperience } from "@shared/schema";
import { storage } from "../storage";
import { randomUUID } from "crypto";
import { calculateExperienceMatches } from './preference-matcher';

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

  // Generate dates array for each day of stay
  const checkInDate = new Date(guestProfile.checkInDate);
  const dates = [];
  for (let i = 0; i < stayDuration; i++) {
    const currentDate = new Date(checkInDate);
    currentDate.setDate(checkInDate.getDate() + i);
    dates.push(currentDate.toISOString().split('T')[0]);
  }

  // Create AI prompt for guest-specific itinerary
  const prompt = `
Genera un itinerario personalizzato che deve basarsi ESCLUSIVAMENTE su questi tre elementi:

1. CARATTERISTICHE HOTEL "${hotel.name}":
${hotel.services?.length ? 
  hotel.services.map(service => `   - ${service}`).join('\n') : 
  '   - Servizi standard di ospitalità'
}
${hotel.description ? `   - Descrizione: ${hotel.description}` : ''}

2. PREFERENZE OSPITE:
   - Tipo ospite: ${guestProfile.type}
   - Numero persone: ${guestProfile.numberOfPeople}
   - Preferenze specifiche: ${guestProfile.preferences?.join(", ") || "Nessuna preferenza particolare"}
   - Richieste speciali: ${guestProfile.specialRequests || "Nessuna richiesta particolare"}

3. ESPERIENZE LOCALI SELEZIONATE DAL MANAGER:
${localExperiences.length > 0 ? 
  localExperiences.map(exp => `   - ID: ${exp.id}
     Nome: ${exp.name} (${exp.category})
     Durata: ${exp.duration} | Prezzo: ${exp.priceRange}
     Località: ${exp.location}
     Descrizione: ${exp.description}`).join('\n\n') :
  '   - Nessuna esperienza locale configurata dal manager'
}

REGOLE FONDAMENTALI:
- Crea un itinerario di ESATTAMENTE ${stayDuration} giorni (dal ${dates[0]} al ${dates[dates.length - 1]})
- USA SOLO le esperienze locali elencate sopra con i loro ID specifici
- NON inventare attività o esperienze non presenti nella lista
- INTEGRA i servizi dell'hotel specificati nella lista servizi
- RISPETTA sempre le preferenze dell'ospite: ${guestProfile.preferences?.join(", ") || "nessuna preferenza particolare"}
- Per il tipo ospite "${guestProfile.type}" considera il target appropriato
- Se non ci sono esperienze locali, concentrati sui servizi dell'hotel
- Ogni giorno deve avere dalle 3 alle 5 attività distribuite dalla mattina alla sera
- Per le esperienze locali usa sempre l'ID corrispondente nel campo "experienceId"

FORMAT RICHIESTO - Rispondi SOLO con JSON valido:
{
  "title": "Titolo itinerario per ${guestProfile.referenceName}",
  "description": "Breve descrizione personalizzata",
  "days": [
${dates.map((date, index) => `    {
      "day": ${index + 1},
      "date": "${date}",
      "activities": [
        {
          "time": "09:00",
          "activity": "Nome attività mattutina",
          "location": "Dove si svolge",
          "description": "Descrizione dell'attività",
          "experienceId": "id_se_esperienza_locale",
          "duration": "durata stimata",
          "notes": "Note specifiche per l'ospite"
        }
      ]
    }`).join(',\n')}
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
    
    // Calculate preference matches for local experiences
    const experienceMatches = calculateExperienceMatches(guestProfile, localExperiences);
    
    // Apply source labels to activities based on preference matching
    if (aiResponse.days && Array.isArray(aiResponse.days)) {
      for (const day of aiResponse.days) {
        if (day.activities && Array.isArray(day.activities)) {
          for (const activity of day.activities) {
            // If activity has experienceId, check if it matches guest preferences
            if (activity.experienceId) {
              const matchedExperience = experienceMatches.find((match: any) => 
                match.experience.id === activity.experienceId
              );
              
              if (matchedExperience && matchedExperience.matchType === 'high') {
                activity.source = 'preference-matched';
              } else {
                activity.source = 'hotel-suggested';
              }
            } else {
              // For activities without experienceId, check if they match preferences by keywords
              const activityText = `${activity.activity} ${activity.description || ''}`.toLowerCase();
              const hasPreferenceMatch = guestProfile.preferences?.some(pref => 
                activityText.includes(pref.toLowerCase()) || 
                pref.toLowerCase().split(' ').some(word => 
                  word.length > 3 && activityText.includes(word)
                )
              );
              
              activity.source = hasPreferenceMatch ? 'preference-matched' : 'hotel-suggested';
            }
          }
        }
      }
    }
    
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