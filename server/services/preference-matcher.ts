import type { GuestProfile, LocalExperience } from "@shared/schema";

// Mapping dalle preferenze degli ospiti alle categorie delle esperienze
const PREFERENCE_TO_CATEGORY_MAP: Record<string, string[]> = {
  // Cultura & Arte
  "Musei e gallerie d'arte": ["cultura", "storia"],
  "Monumenti storici": ["storia", "cultura"],
  "Architettura": ["storia", "cultura"],
  "Arte contemporanea": ["cultura"],
  "Siti archeologici": ["storia", "cultura"],
  "Chiese e luoghi sacri": ["storia", "cultura"],
  
  // Gastronomia
  "Ristoranti tradizionali": ["gastronomia"],
  "Street food locale": ["gastronomia"],
  "Mercati e prodotti tipici": ["gastronomia"],
  "Cooking class": ["gastronomia"],
  "Wine tasting": ["degustazione", "gastronomia"],
  "Cantine e vigneti": ["degustazione", "gastronomia"],
  
  // Natura & Outdoor
  "Parchi naturali": ["natura"],
  "Trekking e escursioni": ["natura", "avventura"],
  "Spiagge e mare": ["natura"],
  "Montagna": ["natura", "avventura"],
  "Giardini botanici": ["natura"],
  "Attività outdoor": ["natura", "avventura"],
  
  // Relax & Benessere
  "Spa e centri benessere": ["relax"],
  "Terme": ["relax"],
  "Yoga e meditazione": ["relax"],
  "Massaggi": ["relax"],
  "Relax in natura": ["relax", "natura"],
  "Luoghi tranquilli": ["relax"],
  
  // Intrattenimento
  "Concerti e musica live": ["divertimento"],
  "Teatro e spettacoli": ["cultura", "divertimento"],
  "Vita notturna": ["divertimento"],
  "Festival ed eventi": ["divertimento"],
  "Cinema": ["divertimento"],
  "Discoteche e bar": ["divertimento"],
  
  // Famiglie
  "Attività per bambini": ["famiglia"],
  "Parchi giochi": ["famiglia"],
  "Zoo e acquari": ["famiglia"],
  "Attività educative": ["famiglia", "cultura"]
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
        matchScore += 10; // Punteggio base per match categoria
      }
      
      // Match additivo per target audience
      if (experience.targetAudience?.includes(guestProfile.type)) {
        matchScore += 5;
      }
      
      // Bonus per match diretto nelle descrizioni
      const searchText = (experience.name + " " + experience.description).toLowerCase();
      const preferenceKeywords = preference.toLowerCase().split(' ');
      
      for (const keyword of preferenceKeywords) {
        if (keyword.length > 3 && searchText.includes(keyword)) {
          matchScore += 2;
        }
      }
    }

    // Determina il tipo di match
    let matchType: 'high' | 'medium' | 'low';
    if (matchScore >= 15) {
      matchType = 'high';
    } else if (matchScore >= 8) {
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