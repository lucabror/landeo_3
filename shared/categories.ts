// CATEGORIE STANDARD LANDEO - 20 categorie definitive e univoche
// Queste sono le UNICHE categorie ammesse per generazione AI e preferenze ospiti

export const LANDEO_CATEGORIES = [
  { value: "museo", label: "1. Museo", emailText: "Museo", description: "Musei, gallerie d'arte, collezioni artistiche" },
  { value: "sito_archeologico", label: "2. Sito Archeologico", emailText: "Sito Archeologico", description: "Scavi, rovine antiche, archeologia" },
  { value: "monumento_storico", label: "3. Monumento Storico", emailText: "Monumento Storico", description: "Monumenti, siti storici, architettura antica" },
  { value: "chiesa", label: "4. Chiesa o Luogo Religioso", emailText: "Chiesa o Luogo Religioso", description: "Chiese, santuari, luoghi religiosi" },
  { value: "borgo_storico", label: "5. Borgo Storico", emailText: "Borgo Storico", description: "Borghi storici, centri medievali" },
  { value: "evento_culturale", label: "6. Evento Culturale", emailText: "Evento Culturale", description: "Concerti, teatro, eventi culturali" },
  { value: "ristorante_tipico", label: "7. Ristorante Tipico", emailText: "Ristorante Tipico", description: "Ristoranti tradizionali, cucina tipica regionale" },
  { value: "cantina_enoteca", label: "8. Cantina / Enoteca", emailText: "Cantina / Enoteca", description: "Cantine, wine tasting, degustazioni enologiche" },
  { value: "mercato_bottega", label: "9. Mercato o Bottega Locale", emailText: "Mercato o Bottega Locale", description: "Mercati rionali, prodotti locali, botteghe artigiane" },
  { value: "laboratorio_artigianale", label: "10. Laboratorio Artigianale", emailText: "Laboratorio Artigianale", description: "Botteghe artigiane, laboratori tradizionali" },
  { value: "parco_naturale", label: "11. Parco Naturale", emailText: "Parco Naturale", description: "Parchi nazionali, riserve naturali, aree protette" },
  { value: "trekking_escursione", label: "12. Trekking / Escursione", emailText: "Trekking / Escursione", description: "Sentieri escursionistici, passeggiate naturalistiche" },
  { value: "lago_spiaggia", label: "13. Lago / Spiaggia", emailText: "Lago / Spiaggia", description: "Laghi, spiagge, vedute panoramiche" },
  { value: "giardino_botanico", label: "14. Giardino Botanico / Storico", emailText: "Giardino Botanico / Storico", description: "Giardini botanici, orti storici, parchi urbani" },
  { value: "sport_avventura", label: "15. Sport Avventura / Outdoor", emailText: "Sport Avventura / Outdoor", description: "Sport all'aria aperta, attività fisiche" },
  { value: "cicloturismo", label: "16. Cicloturismo", emailText: "Cicloturismo", description: "Piste ciclabili, bike tours, cicloturismo" },
  { value: "centro_termale", label: "17. Centro Termale / SPA", emailText: "Centro Termale / SPA", description: "Terme, spa, centri benessere, trattamenti rilassanti" },
  { value: "shopping_locale", label: "18. Shopping Locale", emailText: "Shopping Locale", description: "Negozi tipici, artigianato locale, botteghe storiche" },
  { value: "locali_divertimento", label: "19. Locali / Divertimento", emailText: "Locali / Divertimento", description: "Locali notturni, spettacoli, vita notturna" },
  { value: "esperienza_unica", label: "20. Esperienza Unica del Territorio", emailText: "Esperienza Unica del Territorio", description: "Esperienze particolari e uniche del territorio" }
] as const;

export type LandeoCategoryValue = typeof LANDEO_CATEGORIES[number]['value'];