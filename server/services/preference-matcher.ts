import type { GuestProfile, LocalExperience } from "@shared/schema";

// Mapping universale delle preferenze per massimizzare matching per TUTTI gli hotel
const PREFERENCE_TO_CATEGORY_MAP: Record<string, string[]> = {
  // Storia & Cultura - Mapping ampio per cogliere diverse tipologie
  "Chiese e luoghi sacri": ["cultura", "storia", "religioso"],
  "Musei e gallerie d'arte": ["cultura", "storia", "arte"],
  "Monumenti storici": ["cultura", "storia"],
  "Siti archeologici": ["cultura", "storia", "archeologia"],
  "Architettura storica": ["cultura", "storia", "architettura"],
  "Borghi medievali": ["cultura", "storia", "borgo"],
  "Palazzi e ville storiche": ["cultura", "storia", "villa", "palazzo"],
  "Arte e cultura locale": ["cultura", "arte", "locale"],
  
  // Gastronomia - Ampio per coprire diverse esperienze culinarie
  "Ristoranti tradizionali": ["gastronomia", "ristorante", "tradizionale"],
  "Cucina tipica locale": ["gastronomia", "cucina", "locale"],
  "Wine tasting": ["gastronomia", "vino", "degustazione"],
  "Cantine e vigneti": ["gastronomia", "vino", "cantina"],
  "Mercati locali": ["gastronomia", "mercato", "locale"],
  "Esperienze culinarie": ["gastronomia", "cucina", "esperienza"],
  
  // Natura & Outdoor
  "Parchi naturali": ["natura", "parco"],
  "Trekking e passeggiate": ["natura", "trekking", "passeggiata"],
  "Laghi e panorami": ["natura", "lago", "panorama"],
  "Giardini botanici": ["natura", "giardino"],
  "Attività all'aperto": ["natura", "outdoor"],
  "Natura e relax": ["natura", "relax"],
  
  // Sport & Famiglia
  "Attività sportive": ["sport", "attività"],
  "Attività per famiglie": ["famiglia", "bambini", "attività"],
  "Percorsi ciclabili": ["sport", "bicicletta", "ciclabile"],
  "Sport acquatici": ["sport", "acqua"],
  "Avventura e divertimento": ["avventura", "divertimento", "famiglia"],
  
  // Shopping & Relax
  "Shopping locale": ["shopping", "negozio"],
  "Centri benessere": ["benessere", "spa", "relax"],
  "Relax e spa": ["relax", "spa", "benessere"],
  "Artigianato tipico": ["artigianato", "tipico", "shopping"],
  "Luoghi tranquilli": ["relax", "tranquillo", "pace"]
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

  // Analizza distribuzione categorie per soglie adattive
  const categoryDistribution = analyzeExperienceDistribution(localExperiences);
  const adaptiveThresholds = calculateAdaptiveThresholds(categoryDistribution);
  
  console.log('🎯 ADAPTIVE MATCHING:', {
    categories: categoryDistribution,
    thresholds: adaptiveThresholds
  });

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

    // Usa soglie adattive basate sulla distribuzione di esperienze dell'hotel
    let matchType: 'high' | 'medium' | 'low';
    if (matchScore >= adaptiveThresholds.high) {
      matchType = 'high';
    } else if (matchScore >= adaptiveThresholds.medium) {
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

// Analizza la distribuzione delle categorie per calcolare soglie adattive
function analyzeExperienceDistribution(experiences: LocalExperience[]) {
  const distribution: Record<string, number> = {};
  
  experiences.forEach(exp => {
    distribution[exp.category] = (distribution[exp.category] || 0) + 1;
  });
  
  return distribution;
}

// Calcola soglie adattive basate sulla distribuzione delle esperienze
function calculateAdaptiveThresholds(distribution: Record<string, number>) {
  const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
  
  // Se ci sono poche esperienze totali, soglie più basse per aumentare matching
  if (total <= 10) {
    return { high: 10, medium: 3 };
  }
  
  // Se una categoria domina (>60%), soglie più basse per quella categoria
  const maxCategoryPercent = Math.max(...Object.values(distribution)) / total;
  if (maxCategoryPercent > 0.6) {
    return { high: 12, medium: 4 };
  }
  
  // Distribuzione equilibrata - soglie standard
  return { high: 15, medium: 5 };
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