// CATEGORIE STANDARD LANDEO - 20 categorie definitive e univoche
// Queste sono le UNICHE categorie ammesse per generazione AI e preferenze ospiti

export const LANDEO_CATEGORIES = [
  { 
    value: "museo", 
    label: { it: "1. Museo", en: "1. Museum" }, 
    emailText: { it: "Museo", en: "Museum" }, 
    description: { it: "Musei, gallerie d'arte, collezioni artistiche", en: "Museums, art galleries, artistic collections" } 
  },
  { 
    value: "sito_archeologico", 
    label: { it: "2. Sito Archeologico", en: "2. Archaeological Site" }, 
    emailText: { it: "Sito Archeologico", en: "Archaeological Site" }, 
    description: { it: "Scavi, rovine antiche, archeologia", en: "Excavations, ancient ruins, archaeology" } 
  },
  { 
    value: "monumento_storico", 
    label: { it: "3. Monumento Storico", en: "3. Historical Monument" }, 
    emailText: { it: "Monumento Storico", en: "Historical Monument" }, 
    description: { it: "Monumenti, siti storici, architettura antica", en: "Monuments, historical sites, ancient architecture" } 
  },
  { 
    value: "chiesa", 
    label: { it: "4. Chiesa o Luogo Religioso", en: "4. Church or Religious Site" }, 
    emailText: { it: "Chiesa o Luogo Religioso", en: "Church or Religious Site" }, 
    description: { it: "Chiese, santuari, luoghi religiosi", en: "Churches, sanctuaries, religious places" } 
  },
  { 
    value: "borgo_storico", 
    label: { it: "5. Borgo Storico", en: "5. Historic Village" }, 
    emailText: { it: "Borgo Storico", en: "Historic Village" }, 
    description: { it: "Borghi storici, centri medievali", en: "Historic villages, medieval centers" } 
  },
  { 
    value: "evento_culturale", 
    label: { it: "6. Evento Culturale", en: "6. Cultural Event" }, 
    emailText: { it: "Evento Culturale", en: "Cultural Event" }, 
    description: { it: "Concerti, teatro, eventi culturali", en: "Concerts, theater, cultural events" } 
  },
  { 
    value: "ristorante_tipico", 
    label: { it: "7. Ristorante Tipico", en: "7. Traditional Restaurant" }, 
    emailText: { it: "Ristorante Tipico", en: "Traditional Restaurant" }, 
    description: { it: "Ristoranti tradizionali, cucina tipica regionale", en: "Traditional restaurants, regional cuisine" } 
  },
  { 
    value: "cantina_enoteca", 
    label: { it: "8. Cantina / Enoteca", en: "8. Winery / Wine Bar" }, 
    emailText: { it: "Cantina / Enoteca", en: "Winery / Wine Bar" }, 
    description: { it: "Cantine, wine tasting, degustazioni enologiche", en: "Wineries, wine tasting, wine experiences" } 
  },
  { 
    value: "mercato_bottega", 
    label: { it: "9. Mercato o Bottega Locale", en: "9. Local Market or Shop" }, 
    emailText: { it: "Mercato o Bottega Locale", en: "Local Market or Shop" }, 
    description: { it: "Mercati rionali, prodotti locali, botteghe artigiane", en: "Local markets, local products, artisan shops" } 
  },
  { 
    value: "laboratorio_artigianale", 
    label: { it: "10. Laboratorio Artigianale", en: "10. Artisan Workshop" }, 
    emailText: { it: "Laboratorio Artigianale", en: "Artisan Workshop" }, 
    description: { it: "Botteghe artigiane, laboratori tradizionali", en: "Craft workshops, traditional laboratories" } 
  },
  { 
    value: "parco_naturale", 
    label: { it: "11. Parco Naturale", en: "11. Natural Park" }, 
    emailText: { it: "Parco Naturale", en: "Natural Park" }, 
    description: { it: "Parchi nazionali, riserve naturali, aree protette", en: "National parks, nature reserves, protected areas" } 
  },
  { 
    value: "trekking_escursione", 
    label: { it: "12. Trekking / Escursione", en: "12. Trekking / Hiking" }, 
    emailText: { it: "Trekking / Escursione", en: "Trekking / Hiking" }, 
    description: { it: "Sentieri escursionistici, passeggiate naturalistiche", en: "Hiking trails, nature walks" } 
  },
  { 
    value: "lago_spiaggia", 
    label: { it: "13. Lago / Spiaggia", en: "13. Lake / Beach" }, 
    emailText: { it: "Lago / Spiaggia", en: "Lake / Beach" }, 
    description: { it: "Laghi, spiagge, vedute panoramiche", en: "Lakes, beaches, scenic views" } 
  },
  { 
    value: "giardino_botanico", 
    label: { it: "14. Giardino Botanico / Storico", en: "14. Botanical / Historic Garden" }, 
    emailText: { it: "Giardino Botanico / Storico", en: "Botanical / Historic Garden" }, 
    description: { it: "Giardini botanici, orti storici, parchi urbani", en: "Botanical gardens, historic gardens, urban parks" } 
  },
  { 
    value: "sport_avventura", 
    label: { it: "15. Sport Avventura / Outdoor", en: "15. Adventure Sports / Outdoor" }, 
    emailText: { it: "Sport Avventura / Outdoor", en: "Adventure Sports / Outdoor" }, 
    description: { it: "Sport all'aria aperta, attività fisiche", en: "Outdoor sports, physical activities" } 
  },
  { 
    value: "cicloturismo", 
    label: { it: "16. Cicloturismo", en: "16. Bike Tourism" }, 
    emailText: { it: "Cicloturismo", en: "Bike Tourism" }, 
    description: { it: "Piste ciclabili, bike tours, cicloturismo", en: "Bike paths, bike tours, cycling tourism" } 
  },
  { 
    value: "centro_termale", 
    label: { it: "17. Centro Termale / SPA", en: "17. Thermal Center / SPA" }, 
    emailText: { it: "Centro Termale / SPA", en: "Thermal Center / SPA" }, 
    description: { it: "Terme, spa, centri benessere, trattamenti rilassanti", en: "Thermal baths, spa, wellness centers, relaxing treatments" } 
  },
  { 
    value: "shopping_locale", 
    label: { it: "18. Shopping Locale", en: "18. Local Shopping" }, 
    emailText: { it: "Shopping Locale", en: "Local Shopping" }, 
    description: { it: "Negozi tipici, artigianato locale, botteghe storiche", en: "Local shops, local crafts, historic boutiques" } 
  },
  { 
    value: "locali_divertimento", 
    label: { it: "19. Locali / Divertimento", en: "19. Nightlife / Entertainment" }, 
    emailText: { it: "Locali / Divertimento", en: "Nightlife / Entertainment" }, 
    description: { it: "Locali notturni, spettacoli, vita notturna", en: "Nightlife venues, shows, entertainment" } 
  },
  { 
    value: "esperienza_unica", 
    label: { it: "20. Esperienza Unica del Territorio", en: "20. Unique Local Experience" }, 
    emailText: { it: "Esperienza Unica del Territorio", en: "Unique Local Experience" }, 
    description: { it: "Esperienze particolari e uniche del territorio", en: "Special and unique local experiences" } 
  }
] as const;

export type LandeoCategoryValue = typeof LANDEO_CATEGORIES[number]['value'];