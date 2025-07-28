import type { GuestProfile, LocalExperience } from "@shared/schema";

// Mapping ottimizzato delle preferenze per massimizzare matching con esperienze disponibili
const PREFERENCE_TO_CATEGORY_MAP: Record<string, string[]> = {
  // Storia & Cultura (65% delle esperienze) - mapping molto dettagliato
  "Chiese e luoghi sacri": ["cultura", "storia"],
  "Musei e gallerie d'arte": ["cultura", "storia"],
  "Monumenti storici": ["cultura", "storia"],
  "Siti archeologici": ["cultura", "storia"],
  "Architettura antica": ["cultura", "storia"],
  "Borghi medievali": ["cultura", "storia"],
  "Palazzi storici": ["cultura", "storia"],
  "Templi e santuari": ["cultura", "storia"],
  "Ville storiche": ["cultura", "storia"],
  "Centro storico": ["cultura", "storia"],
  
  // Gastronomia & Ristoranti
  "Ristoranti tradizionali": ["gastronomia", "cultura"],
  "Cucina tipica locale": ["gastronomia", "cultura"],
  "Wine tasting": ["gastronomia"],
  "Cantine e vigneti": ["gastronomia"],
  "Mercati e prodotti tipici": ["gastronomia"],
  "Cooking class": ["gastronomia"],
  
  // Natura & Parchi (25% delle esperienze)
  "Parchi naturali": ["natura"],
  "Parchi regionali": ["natura"],
  "Trekking e escursioni": ["natura"],
  "Giardini e ville": ["natura", "cultura"],
  "Laghi e panorami": ["natura"],
  "Attività outdoor": ["natura"],
  
  // Sport & Attività (5% delle esperienze)
  "Piste ciclabili": ["sport", "natura"],
  "Escursioni a piedi": ["sport", "natura"],
  "Sport acquatici": ["sport", "natura"],
  "Attività per famiglie": ["sport", "famiglia"],
  "Percorsi sportivi": ["sport", "natura"],
  
  // Shopping (5% delle esperienze)
  "Shopping locale": ["shopping"],
  "Mercatini": ["shopping", "cultura"],
  "Artigianato locale": ["shopping", "cultura"]
};

export interface ExperienceMatch {
  experience: LocalExperience;
  matchScore: number;
  matchingPreferences: string[];
  matchType: 'high' | 'medium' | 'low';
}

export function calculateExperienceMatches(
  guestProfile: GuestProfile,
  localExperiences: LocalExperience[]
): ExperienceMatch[] {
  if (!guestProfile.preferences || !guestProfile.preferences.length) {
    return localExperiences.map(exp => ({
      experience: exp,
      matchScore: 0,
      matchingPreferences: [],
      matchType: 'low' as const
    }));
  }

  const matches: ExperienceMatch[] = [];

  for (const experience of localExperiences) {
    const matchingPreferences: string[] = [];
    let matchScore = 0;

    // Controlla ogni preferenza dell'ospite
    for (const preference of guestProfile.preferences) {
      const relatedCategories = PREFERENCE_TO_CATEGORY_MAP[preference] || [];
      
      // Se la categoria dell'esperienza corrisponde a una categoria della preferenza
      if (relatedCategories.includes(experience.category)) {
        matchingPreferences.push(preference);
        matchScore += 20; // Aumentato punteggio base per match categoria
      }
      
      // Match additivo per target audience
      if (experience.targetAudience?.includes(guestProfile.type)) {
        matchScore += 10; // Aumentato punteggio per target audience
      }
      
      // Bonus per match diretto nelle descrizioni (più generoso)
      const searchText = (experience.name + " " + experience.description).toLowerCase();
      const preferenceKeywords = preference.toLowerCase().split(' ');
      
      // Match diretto del nome completo della preferenza
      if (searchText.includes(preference.toLowerCase())) {
        matchScore += 15; // Bonus alto per match completo
        if (!matchingPreferences.includes(preference)) {
          matchingPreferences.push(preference);
        }
      }
      
      // Match per singole parole chiave
      for (const keyword of preferenceKeywords) {
        if (keyword.length > 3 && searchText.includes(keyword)) {
          matchScore += 5; // Aumentato bonus per parole chiave
        }
      }
      
      // Match speciale per parole chiave comuni (ampliate per maggiori match)
      const commonWords = [
        'museo', 'arte', 'storia', 'natura', 'parco', 'ristorante', 'cibo', 'vino',
        'chiesa', 'santuario', 'tempio', 'villa', 'palazzo', 'borgo', 'centro',
        'archeologico', 'storico', 'culturale', 'tradizionale', 'locale'
      ];
      for (const word of commonWords) {
        if (preference.toLowerCase().includes(word) && searchText.includes(word)) {
          matchScore += 10; // Aumentato da 8 a 10 per più match
        }
      }
    }

    // Determina il tipo di match (soglie molto più generose per personalizzazione)
    let matchType: 'high' | 'medium' | 'low';
    if (matchScore >= 15) {  // Ridotto da 25 a 15 - più facile raggiungere high
      matchType = 'high';
    } else if (matchScore >= 5) {  // Ridotto da 12 a 5 - molto più inclusivo
      matchType = 'medium';
    } else {
      matchType = 'low';
    }

    matches.push({
      experience,
      matchScore,
      matchingPreferences,
      matchType
    });
  }

  // Ordina per punteggio di match decrescente
  return matches.sort((a, b) => b.matchScore - a.matchScore);
}

export function getPreferenceIcon(preference: string): string {
  // Mapping delle preferenze alle icone Lucide
  const iconMap: Record<string, string> = {
    // Cultura & Arte
    "Musei e gallerie d'arte": "Camera",
    "Monumenti storici": "Castle",
    "Architettura": "Building2",
    "Arte contemporanea": "Palette",
    "Siti archeologici": "Landmark",
    "Chiese e luoghi sacri": "Church",
    
    // Gastronomia
    "Ristoranti tradizionali": "Utensils",
    "Street food locale": "Coffee",
    "Mercati e prodotti tipici": "ShoppingBasket",
    "Cooking class": "ChefHat",
    "Wine tasting": "Wine",
    "Cantine e vigneti": "Grape",
    
    // Natura & Outdoor
    "Parchi naturali": "TreePine",
    "Trekking e escursioni": "Mountain",
    "Spiagge e mare": "Waves",
    "Montagna": "Mountain",
    "Giardini botanici": "Flower2",
    "Attività outdoor": "Compass",
    
    // Relax & Benessere
    "Spa e centri benessere": "Waves",
    "Terme": "Droplets",
    "Yoga e meditazione": "Heart",
    "Massaggi": "HandHeart",
    "Relax in natura": "Leaf",
    "Luoghi tranquilli": "CloudSun",
    
    // Intrattenimento
    "Concerti e musica live": "Music",
    "Teatro e spettacoli": "Theater",
    "Vita notturna": "Moon",
    "Festival ed eventi": "PartyPopper",
    "Cinema": "Film",
    "Discoteche e bar": "Cocktail"
  };
  
  return iconMap[preference] || "Star";
}

export function getMatchBadgeColor(matchType: 'high' | 'medium' | 'low'): string {
  switch (matchType) {
    case 'high':
      return "bg-green-100 text-green-800 border-green-200";
    case 'medium':
      return "bg-amber-100 text-amber-800 border-amber-200";
    case 'low':
      return "bg-gray-100 text-gray-600 border-gray-200";
  }
}

export function getMatchBadgeText(matchType: 'high' | 'medium' | 'low'): string {
  switch (matchType) {
    case 'high':
      return "🎯 Preferenza Top";
    case 'medium':
      return "✨ Buon Match";
    case 'low':
      return "• Standard";
  }
}