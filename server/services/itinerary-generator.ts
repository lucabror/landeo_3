import OpenAI from "openai";
import type { Hotel, GuestProfile, LocalExperience } from "@shared/schema";
import { storage } from "../storage";
import { randomUUID } from "crypto";
// Preference matcher temporaneamente rimosso

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

  // Matching temporaneamente disabilitato durante ricostruzione
  const experienceMatches: any[] = [];
  
  console.log('=== MATCHING ANALYSIS - TEMPORANEAMENTE DISABILITATO ===');
  console.log(`Guest preferences: ${guestProfile.preferences?.join(', ') || 'None'}`);

  // Separazione esperienze temporaneamente disabilitata
  const highMatchExperiences: any[] = [];
  const mediumMatchExperiences = experienceMatches.filter(m => m.matchType === 'medium');
  const lowMatchExperiences = experienceMatches.filter(m => m.matchType === 'low');

  // Create AI prompt for guest-specific itinerary
  const prompt = `
Genera un itinerario personalizzato che deve basarsi ESCLUSIVAMENTE su questi elementi:

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

3. ESPERIENZE LOCALI CATEGORIZZATE PER AFFINITÀ CON L'OSPITE:

   🎯 ESPERIENZE PERFETTAMENTE ALLINEATE (USA PRIORITARIAMENTE):
${highMatchExperiences.length > 0 ? 
  highMatchExperiences.map(match => `   - ID: ${match.experience.id}
     Nome: ${match.experience.name} (${match.experience.category})
     MATCH PERFETTO: ${match.matchingPreferences.join(", ")}
     Durata: ${match.experience.duration} | Prezzo: ${match.experience.priceRange}
     Località: ${match.experience.location}
     Descrizione: ${match.experience.description}`).join('\n\n') :
  '   - Nessuna esperienza con match perfetto'
}

   ✨ ESPERIENZE COMPATIBILI (USA SE NECESSARIO):
${mediumMatchExperiences.length > 0 ? 
  mediumMatchExperiences.map(match => `   - ID: ${match.experience.id}
     Nome: ${match.experience.name} (${match.experience.category})
     Match parziale: ${match.matchingPreferences.join(", ") || "compatibile"}
     Durata: ${match.experience.duration} | Prezzo: ${match.experience.priceRange}
     Località: ${match.experience.location}`) :
  '   - Nessuna esperienza con match medio'
}

   • ESPERIENZE STANDARD (USA SOLO PER COMPLETARE):
${lowMatchExperiences.length > 0 ? 
  lowMatchExperiences.map(match => `   - ID: ${match.experience.id}
     Nome: ${match.experience.name} (${match.experience.category})
     Durata: ${match.experience.duration} | Località: ${match.experience.location}`) :
  '   - Nessuna esperienza standard'
}

REGOLE FONDAMENTALI:
- Crea un itinerario di ESATTAMENTE ${stayDuration} giorni (dal ${dates[0]} al ${dates[dates.length - 1]})
- USA PRIORITARIAMENTE le esperienze 🎯 PERFETTAMENTE ALLINEATE (almeno il 70% dell'itinerario)
- USA le esperienze ✨ COMPATIBILI solo se necessario per completare l'itinerario
- USA le esperienze • STANDARD solo come ultima risorsa
- NON inventare attività o esperienze non presenti nella lista
- INTEGRA i servizi dell'hotel specificati nella lista servizi
- RISPETTA sempre le preferenze dell'ospite: ${guestProfile.preferences?.join(", ") || "nessuna preferenza particolare"}
- Per il tipo ospite "${guestProfile.type}" considera il target appropriato
- Ogni giorno deve avere dalle 3 alle 5 attività distribuite dalla mattina alla sera
- Per le esperienze locali usa sempre l'ID corrispondente nel campo "experienceId"
- L'itinerario finale deve essere PRINCIPALMENTE basato sui gusti personali dell'ospite

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
          "description": "Descrizione completa dell'attività",
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
    // Matching temporaneamente disabilitato
    const experienceMatches: any[] = [];
    
    // Apply source labels to activities based on preference matching
    if (aiResponse.days && Array.isArray(aiResponse.days)) {
      for (const day of aiResponse.days) {
        if (day.activities && Array.isArray(day.activities)) {
          for (const activity of day.activities) {
            // Debug logging for matching
            console.log(`Processing activity: ${activity.activity}, experienceId: ${activity.experienceId}`);
            
            // If activity has experienceId, check if it matches guest preferences
            if (activity.experienceId) {
              const matchedExperience = experienceMatches.find((match: any) => 
                match.experience.id === activity.experienceId
              );
              
              console.log(`Experience match found: ${!!matchedExperience}, matchType: ${matchedExperience?.matchType}`);
              
              if (matchedExperience && (matchedExperience.matchType === 'high' || matchedExperience.matchType === 'medium')) {
                activity.source = 'preference-matched';
                console.log(`✓ Marked as preference-matched: ${activity.activity} (${matchedExperience.matchType} match)`);
              } else {
                activity.source = 'hotel-suggested';
                console.log(`✓ Marked as hotel-suggested: ${activity.activity}`);
              }
            } else {
              // For activities without experienceId, check if they match preferences by keywords
              const activityText = `${activity.activity} ${activity.description || ''}`.toLowerCase();
              const guestPrefs = guestProfile.preferences || [];
              
              console.log(`Checking activity text: "${activityText}" against preferences: ${guestPrefs.join(', ')}`);
              
              const hasPreferenceMatch = guestPrefs.some(pref => {
                const prefLower = pref.toLowerCase();
                const matches = activityText.includes(prefLower) || 
                  prefLower.split(' ').some(word => 
                    word.length > 3 && activityText.includes(word)
                  );
                if (matches) console.log(`✓ Preference match: "${pref}" matches "${activityText}"`);
                return matches;
              });
              
              activity.source = hasPreferenceMatch ? 'preference-matched' : 'hotel-suggested';
              console.log(`✓ Text-based matching result: ${activity.source} for ${activity.activity}`);
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