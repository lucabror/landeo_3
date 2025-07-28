import type { GuestProfile, LocalExperience } from "@shared/schema";

// SISTEMA SEMPLIFICATO: Mapping diretto preferenze → categorie esperienze
const PREFERENCE_TO_CATEGORY_MAP: Record<string, string[]> = {
  // Storia e Cultura → categoria "cultura"
  "Storia e monumenti": ["cultura"],
  "Musei e arte": ["cultura"], 
  "Chiese e luoghi sacri": ["cultura"],
  "Borghi e architettura": ["cultura"],
  
  // Cibo e Vino → categoria "gastronomia"
  "Ristoranti tipici": ["gastronomia"],
  "Vino e degustazioni": ["gastronomia"],
  "Cucina locale": ["gastronomia"],
  
  // Natura → categoria "natura"
  "Parchi e natura": ["natura"],
  "Passeggiate e trekking": ["natura"],
  "Laghi e panorami": ["natura"],
  
  // Sport → categoria "sport"
  "Attività sportive": ["sport"],
  "Attività per famiglie": ["sport"],
  "Ciclismo e bicicletta": ["sport"],
  
  // Shopping/Relax → categorie "shopping"/"relax"
  "Relax e benessere": ["relax"],
  "Shopping e acquisti": ["shopping"]
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

  console.log('🎯 SIMPLE MATCHING for preferences:', guestProfile.preferences);

  const matches: ExperienceMatch[] = [];

  for (const experience of localExperiences) {
    const matchingPreferences: string[] = [];
    let matchScore = 0;

    // Controlla ogni preferenza dell'ospite
    for (const preference of guestProfile.preferences) {
      const relatedCategories = PREFERENCE_TO_CATEGORY_MAP[preference] || [];
      
      // MATCH PRINCIPALE: categoria dell'esperienza corrisponde alla preferenza
      if (relatedCategories.includes(experience.category)) {
        matchingPreferences.push(preference);
        matchScore += 100; // Punteggio alto per match diretto categoria
        console.log(`✅ PERFECT MATCH: "${preference}" → categoria "${experience.category}" per "${experience.name}"`);
      }
      
      // MATCH TESTUALE: nome e descrizione contengono parole della preferenza
      const searchText = (experience.name + " " + experience.description).toLowerCase();
      const preferenceWords = preference.toLowerCase().split(/\s+/);
      
      for (const word of preferenceWords) {
        if (word.length > 3 && searchText.includes(word)) {
          matchScore += 20;
          if (!matchingPreferences.includes(preference)) {
            matchingPreferences.push(preference);
          }
          console.log(`📝 TEXT MATCH: "${word}" trovata in "${experience.name}"`);
        }
      }
    }

    // SOGLIE SEMPLICI: se c'è un match categoria = preference-matched
    let matchType: 'high' | 'medium' | 'low';
    if (matchScore >= 100) {
      matchType = 'high';
    } else if (matchScore >= 20) {
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
    
    console.log(`${experience.name}: score=${matchScore}, type=${matchType}, matches=[${matchingPreferences.join(', ')}]`);
  }

  return matches.sort((a, b) => b.matchScore - a.matchScore);
}

// LOGICA SEMPLIFICATA RIMOSSA - sistema ora usa matching diretto preferenze → categorie

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