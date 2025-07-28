// CATEGORIE STANDARD LANDEO - Corrispondenza univoca tra Esperienze Locali e Preferenze Ospiti
// Queste 15 categorie sono utilizzate sia per le esperienze locali che per le preferenze email

export const LANDEO_CATEGORIES = [
  // Storia e Cultura (5 categorie)
  { value: "musei", label: "Musei e Arte", emailText: "Musei e arte", description: "Musei, gallerie d'arte, collezioni artistiche" },
  { value: "monumenti", label: "Monumenti Storici", emailText: "Monumenti storici", description: "Monumenti, siti storici, architettura antica" },
  { value: "chiese", label: "Chiese e Santuari", emailText: "Chiese e luoghi sacri", description: "Chiese, santuari, luoghi religiosi" },
  { value: "borghi", label: "Borghi Medievali", emailText: "Borghi medievali", description: "Borghi storici, centri medievali" },
  { value: "archeologia", label: "Siti Archeologici", emailText: "Siti archeologici", description: "Scavi, rovine antiche, archeologia" },
  
  // Gastronomia (3 categorie)
  { value: "ristoranti", label: "Ristoranti Tipici", emailText: "Ristoranti e cucina locale", description: "Ristoranti tradizionali, cucina tipica regionale" },
  { value: "vino", label: "Vino e Cantine", emailText: "Vino e degustazioni", description: "Cantine, wine tasting, degustazioni enologiche" },
  { value: "mercati", label: "Mercati Locali", emailText: "Mercati e prodotti tipici", description: "Mercati rionali, prodotti locali, gastronomia di strada" },
  
  // Natura e Outdoor (4 categorie)
  { value: "parchi", label: "Parchi Naturali", emailText: "Parchi e riserve naturali", description: "Parchi nazionali, riserve naturali, aree protette" },
  { value: "trekking", label: "Trekking e Passeggiate", emailText: "Trekking e passeggiate", description: "Sentieri escursionistici, passeggiate naturalistiche" },
  { value: "laghi", label: "Laghi e Panorami", emailText: "Laghi e panorami", description: "Laghi, vedute panoramiche, belvedere naturali" },
  { value: "giardini", label: "Giardini Botanici", emailText: "Giardini botanici", description: "Giardini botanici, orti storici, parchi urbani" },
  
  // Sport e Attività (2 categorie)
  { value: "sport", label: "Attività Sportive", emailText: "Attività sportive", description: "Sport all'aria aperta, attività fisiche" },
  { value: "ciclismo", label: "Ciclismo", emailText: "Ciclismo e percorsi in bici", description: "Piste ciclabili, bike tours, cicloturismo" },
  
  // Relax e Shopping (1 categoria)
  { value: "shopping", label: "Shopping e Artigianato", emailText: "Shopping e artigianato", description: "Negozi tipici, artigianato locale, botteghe storiche" }
] as const;

export type LandeoCategoryValue = typeof LANDEO_CATEGORIES[number]['value'];

// Mapping per retrocompatibilità con categorie esistenti
export const LEGACY_CATEGORY_MAPPING: Record<string, LandeoCategoryValue> = {
  "cultura": "musei",
  "storia": "monumenti", 
  "arte": "musei",
  "gastronomia": "ristoranti",
  "degustazione": "vino",
  "natura": "trekking",
  "relax": "benessere",
  "avventura": "trekking",
  "divertimento": "sport",
  "famiglia": "sport",
  "sport": "sport",
  "shopping": "shopping"
};

// Funzione per mappare categorie AI esistenti verso le nuove categorie standard
export function mapAIcategoryToStandard(aiCategory: string): LandeoCategoryValue {
  const normalized = aiCategory.toLowerCase().trim();
  
  // Mapping diretto
  if (LEGACY_CATEGORY_MAPPING[normalized]) {
    return LEGACY_CATEGORY_MAPPING[normalized];
  }
  
  // Mapping basato su parole chiave
  if (normalized.includes('museo') || normalized.includes('arte')) return 'musei';
  if (normalized.includes('monumento') || normalized.includes('storico')) return 'monumenti';
  if (normalized.includes('chiesa') || normalized.includes('santuario')) return 'chiese';
  if (normalized.includes('borgo') || normalized.includes('centro')) return 'borghi';
  if (normalized.includes('ristorante') || normalized.includes('cucina')) return 'ristoranti';
  if (normalized.includes('vino') || normalized.includes('cantina')) return 'vino';
  if (normalized.includes('mercato') || normalized.includes('prodotto')) return 'mercati';
  if (normalized.includes('parco') || normalized.includes('riserva')) return 'parchi';
  if (normalized.includes('trekking') || normalized.includes('passeggiata')) return 'trekking';
  if (normalized.includes('lago') || normalized.includes('panorama')) return 'laghi';
  if (normalized.includes('giardino') || normalized.includes('orto')) return 'giardini';
  if (normalized.includes('ciclismo') || normalized.includes('bici')) return 'ciclismo';
  if (normalized.includes('benessere') || normalized.includes('spa')) return 'benessere';
  if (normalized.includes('shopping') || normalized.includes('negozio')) return 'shopping';
  
  // Default fallback
  return 'trekking';
}