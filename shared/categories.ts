// CATEGORIE STANDARD LANDEO - Corrispondenza univoca tra Esperienze Locali e Preferenze Ospiti
// Queste 20 categorie sono utilizzate sia per le esperienze locali che per le preferenze email

export const LANDEO_CATEGORIES = [
  // Storia e Cultura (6 categorie)
  { value: "musei", label: "Musei e Arte", emailText: "Musei e arte", description: "Musei, gallerie d'arte, collezioni artistiche" },
  { value: "monumenti", label: "Monumenti Storici", emailText: "Monumenti storici", description: "Monumenti, siti storici, architettura antica" },
  { value: "chiese", label: "Chiese e Santuari", emailText: "Chiese e luoghi sacri", description: "Chiese, santuari, luoghi religiosi" },
  { value: "borghi", label: "Borghi Medievali", emailText: "Borghi medievali", description: "Borghi storici, centri medievali" },
  { value: "archeologia", label: "Siti Archeologici", emailText: "Siti archeologici", description: "Scavi, rovine antiche, archeologia" },
  { value: "cultura", label: "Eventi Culturali", emailText: "Eventi culturali", description: "Concerti, teatro, eventi culturali" },
  
  // Gastronomia (4 categorie)
  { value: "ristoranti", label: "Ristoranti Tipici", emailText: "Ristoranti e cucina locale", description: "Ristoranti tradizionali, cucina tipica regionale" },
  { value: "vino", label: "Vino e Cantine", emailText: "Vino e degustazioni", description: "Cantine, wine tasting, degustazioni enologiche" },
  { value: "mercati", label: "Mercati Locali", emailText: "Mercati e prodotti tipici", description: "Mercati rionali, prodotti locali, gastronomia di strada" },
  { value: "dolci", label: "Dolci e Pasticcerie", emailText: "Dolci e pasticcerie", description: "Pasticcerie locali, dolci tradizionali, gelaterie" },
  
  // Natura e Outdoor (5 categorie)
  { value: "parchi", label: "Parchi Naturali", emailText: "Parchi e riserve naturali", description: "Parchi nazionali, riserve naturali, aree protette" },
  { value: "trekking", label: "Trekking e Passeggiate", emailText: "Trekking e passeggiate", description: "Sentieri escursionistici, passeggiate naturalistiche" },
  { value: "laghi", label: "Laghi e Panorami", emailText: "Laghi e panorami", description: "Laghi, vedute panoramiche, belvedere naturali" },
  { value: "giardini", label: "Giardini Botanici", emailText: "Giardini botanici", description: "Giardini botanici, orti storici, parchi urbani" },
  { value: "spiagge", label: "Spiagge e Mare", emailText: "Spiagge e mare", description: "Spiagge, stabilimenti balneari, attività marine" },
  
  // Sport e Benessere (3 categorie)
  { value: "sport", label: "Attività Sportive", emailText: "Attività sportive", description: "Sport all'aria aperta, attività fisiche" },
  { value: "ciclismo", label: "Ciclismo", emailText: "Ciclismo e percorsi in bici", description: "Piste ciclabili, bike tours, cicloturismo" },
  { value: "terme", label: "Terme e Benessere", emailText: "Terme e benessere", description: "Terme, spa, centri benessere, trattamenti rilassanti" },
  
  // Shopping e Divertimento (2 categorie)
  { value: "shopping", label: "Shopping e Artigianato", emailText: "Shopping e artigianato", description: "Negozi tipici, artigianato locale, botteghe storiche" },
  { value: "divertimento", label: "Divertimento e Spettacoli", emailText: "Divertimento e spettacoli", description: "Discoteche, locali notturni, spettacoli, vita notturna" }
] as const;

export type LandeoCategoryValue = typeof LANDEO_CATEGORIES[number]['value'];

// Mapping per retrocompatibilità con categorie esistenti
export const LEGACY_CATEGORY_MAPPING: Record<string, LandeoCategoryValue> = {
  "cultura": "cultura",
  "storia": "monumenti", 
  "arte": "musei",
  "gastronomia": "ristoranti",
  "degustazione": "vino",
  "natura": "trekking",
  "relax": "terme",
  "benessere": "terme",
  "avventura": "trekking",
  "divertimento": "divertimento",
  "famiglia": "sport",
  "sport": "sport",
  "shopping": "shopping",
  "mare": "spiagge",
  "spiaggia": "spiagge",
  "dolce": "dolci",
  "pasticceria": "dolci"
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
  if (normalized.includes('archeolog') || normalized.includes('scavo')) return 'archeologia';
  if (normalized.includes('cultura') || normalized.includes('evento')) return 'cultura';
  if (normalized.includes('ristorante') || normalized.includes('cucina')) return 'ristoranti';
  if (normalized.includes('vino') || normalized.includes('cantina')) return 'vino';
  if (normalized.includes('mercato') || normalized.includes('prodotto')) return 'mercati';
  if (normalized.includes('dolc') || normalized.includes('pasticc')) return 'dolci';
  if (normalized.includes('parco') || normalized.includes('riserva')) return 'parchi';
  if (normalized.includes('trekking') || normalized.includes('passeggiata')) return 'trekking';
  if (normalized.includes('lago') || normalized.includes('panorama')) return 'laghi';
  if (normalized.includes('giardino') || normalized.includes('orto')) return 'giardini';
  if (normalized.includes('spiaggia') || normalized.includes('mare')) return 'spiagge';
  if (normalized.includes('ciclismo') || normalized.includes('bici')) return 'ciclismo';
  if (normalized.includes('terme') || normalized.includes('spa') || normalized.includes('benessere')) return 'terme';
  if (normalized.includes('shopping') || normalized.includes('negozio')) return 'shopping';
  if (normalized.includes('divertimento') || normalized.includes('spettacol') || normalized.includes('notte')) return 'divertimento';
  
  // Default fallback
  return 'trekking';
}