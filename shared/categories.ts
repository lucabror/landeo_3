// CATEGORIE STANDARD LANDEO - Sistema semplificato con 20 categorie numerate
// Corrispondenza diretta tra generazione AI e sistema interno

export const LANDEO_CATEGORIES = [
  { value: "museo", label: "1. Museo", emailText: "Musei", description: "Musei, gallerie d'arte, collezioni artistiche" },
  { value: "sito_archeologico", label: "2. Sito Archeologico", emailText: "Siti archeologici", description: "Scavi, rovine antiche, archeologia" },
  { value: "monumento_storico", label: "3. Monumento Storico", emailText: "Monumenti storici", description: "Monumenti, siti storici, architettura antica" },
  { value: "chiesa", label: "4. Chiesa o Luogo Religioso", emailText: "Chiese e luoghi sacri", description: "Chiese, santuari, luoghi religiosi" },
  { value: "borgo_storico", label: "5. Borgo Storico", emailText: "Borghi storici", description: "Borghi storici, centri medievali" },
  { value: "evento_culturale", label: "6. Evento Culturale", emailText: "Eventi culturali", description: "Concerti, teatro, eventi culturali" },
  { value: "ristorante_tipico", label: "7. Ristorante Tipico", emailText: "Ristoranti tipici", description: "Ristoranti tradizionali, cucina tipica regionale" },
  { value: "cantina_enoteca", label: "8. Cantina / Enoteca", emailText: "Cantine ed enoteche", description: "Cantine, wine tasting, degustazioni enologiche" },
  { value: "mercato_bottega", label: "9. Mercato o Bottega Locale", emailText: "Mercati e botteghe", description: "Mercati rionali, prodotti locali, botteghe artigiane" },
  { value: "laboratorio_artigianale", label: "10. Laboratorio Artigianale", emailText: "Laboratori artigianali", description: "Botteghe artigiane, laboratori tradizionali" },
  { value: "parco_naturale", label: "11. Parco Naturale", emailText: "Parchi naturali", description: "Parchi nazionali, riserve naturali, aree protette" },
  { value: "trekking_escursione", label: "12. Trekking / Escursione", emailText: "Trekking ed escursioni", description: "Sentieri escursionistici, passeggiate naturalistiche" },
  { value: "lago_spiaggia", label: "13. Lago / Spiaggia", emailText: "Laghi e spiagge", description: "Laghi, spiagge, vedute panoramiche" },
  { value: "giardino_botanico", label: "14. Giardino Botanico / Storico", emailText: "Giardini botanici", description: "Giardini botanici, orti storici, parchi urbani" },
  { value: "sport_avventura", label: "15. Sport Avventura / Outdoor", emailText: "Sport e avventura", description: "Sport all'aria aperta, attività fisiche" },
  { value: "cicloturismo", label: "16. Cicloturismo", emailText: "Cicloturismo", description: "Piste ciclabili, bike tours, cicloturismo" },
  { value: "centro_termale", label: "17. Centro Termale / SPA", emailText: "Terme e centri benessere", description: "Terme, spa, centri benessere, trattamenti rilassanti" },
  { value: "shopping_locale", label: "18. Shopping Locale", emailText: "Shopping locale", description: "Negozi tipici, artigianato locale, botteghe storiche" },
  { value: "locali_divertimento", label: "19. Locali / Divertimento", emailText: "Locali e divertimento", description: "Locali notturni, spettacoli, vita notturna" },
  { value: "esperienza_unica", label: "20. Esperienza Unica del Territorio", emailText: "Esperienze uniche", description: "Esperienze particolari e uniche del territorio" }
] as const;

export type LandeoCategoryValue = typeof LANDEO_CATEGORIES[number]['value'];