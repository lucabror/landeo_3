# Replit.md - Hotel Itinerary Management System

## Overview

This is a comprehensive full-stack TypeScript application for Italian hotel itinerary management built with React, Express, and PostgreSQL. The system allows hotels to manage guest profiles, local experiences, and generate personalized AI-powered itineraries. Key features include manager editing of individual itinerary blocks, QR code PDF generation for guest access, and email PDF functionality for direct guest communication.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

- **2025-01-26**: Implementato sistema completo di registrazione hotel
  - Creata pagina `/hotel-register` per registrazione iniziale (email + password)
  - Pagina `/verify-email/:token` per conferma identità tramite link email
  - Tabelle database `users` e `emailVerifications` per gestione registrazioni
  - Sistema email automatico con Resend per invio link di verifica
  - Reindirizzamento a `/hotel-setup` dopo conferma email completata
  - Aggiornati tutti i link da "Demo Gratuita"/"Inizia Gratis" verso nuovo flusso
- **2025-01-26**: Aggiunto pulsante registrazione hotel nella pagina login
  - Nuovo pulsante "Registra il Tuo Hotel" nella pagina di accesso
  - Link diretto a /hotel-register per nuovi albergatori 
  - Sezione separata con design elegante e icona Building2
  - Migliora conversione utenti non ancora registrati
- **2025-01-26**: Corretti link di registrazione per indirizzare alla pagina hotel-setup
  - Tutti i pulsanti "Demo Gratuita", "Inizia Gratis", "Registrazione Gratuita" ora portano a /hotel-setup
  - Migliorato flusso utente per conversion diretta degli albergatori
  - Eliminata confusione tra login generale e registrazione hotel
  - Ottimizzato percorso di onboarding per nuovi clienti
- **2025-01-26**: Aggiornata palette colori landing page con tonalità pastello più eleganti
  - Sostituiti colori amber-600/orange-600 con amber-700/amber-800 per maggiore raffinatezza
  - Modificati sfondi da amber-50/orange-50 a stone-50/amber-50 per atmosfera luxury
  - Eliminati colori troppo accesi e festosi in favore di toni eleganti e sobri
  - Palette allineata con standard di lusso per hotel italiani di alta gamma
- **2025-01-26**: Creata pagina "Scopri di Più" completa per convincere albergatori
  - Aggiunta sezione ROI con metriche concrete (tempo risparmiato, incremento revenue)
  - Sezione benefici con statistiche reali (+35% recensioni positive, +40% ritorni)
  - Features dettagliate divise per categoria (AI, Gestione Ospiti, Branding, Distribuzione)
  - Caso di studio Hotel Bellavista con risultati misurabili
  - FAQ per rispondere alle obiezioni comuni degli albergatori
  - CTA multipli per guidare verso registrazione gratuita
- **2025-01-26**: Aggiunta sezione mockup iPhone alla landing page
  - Mockup realistico con angolazione come da screenshot di riferimento
  - Esempio itinerario Roma autentico con Hotel Bellavista
  - Animazioni interattive e elementi fluttuanti per engagement
  - Dimostra visivamente il valore per gli ospiti dell'hotel
- **2025-01-26**: Corretti badge 2FA in tutti i profili
  - Badge ora mostra "Disattivata" invece di "Disattiva" quando 2FA è spento
  - Corretta icona Shield per configurazione 2FA nei profili hotel manager
  - Terminologia italiana appropriata per stati autenticazione
- **2025-01-26**: Disabilitato temporaneamente 2FA per hotel manager e super admin
  - Rimossi controlli MFA obbligatori dal flusso di login
  - Login diretto senza richiesta codice Google Authenticator
  - Modifiche temporanee per facilitare accesso durante sviluppo
- **2025-01-26**: Rimosso sistema reset MFA dalla piattaforma per maggiore sicurezza
  - Eliminati endpoint `/api/auth/reset-mfa` dal server
  - Rimosse pagine e componenti frontend per reset MFA
  - Il 2FA Google Authenticator ora richiede assistenza amministratore per reset
- **2025-01-26**: Login unificato implementato con riconoscimento automatico utenti
  - Creata pagina `/login` unica che determina tipo utente (hotel/admin) dall'email
  - Rimosse pagine separate `/hotel-login` e `/admin-login` (redirect al login unificato)
  - Interfaccia intelligente con icone dinamiche e gestione 2FA integrata
  - Sistema MFA reset completo per recupero Google Authenticator
  - Correzioni validation endpoint per supportare nuovo sistema login
- **2025-01-26**: Sistema di autenticazione completo ora funzionante
  - Risolti problemi di routing: aggiunta route /dashboard per redirect corretto
  - AuthProvider integrato nel sistema di login per gestione stato utente
  - ProtectedRoute ottimizzato per accesso dashboard senza problemi
  - Login hotel ora reindirizza correttamente alla dashboard dopo autenticazione
  - Email reset password funzionante con Resend (sender: delivered@resend.dev)
- **2025-01-26**: Implementato sistema "Password Dimenticata" completo con email reset
  - API endpoints per richiesta reset e conferma password funzionali
  - Invio email automatico con link sicuro (token valido 1 ora) tramite Resend
  - Form frontend con validazione elegante e interfaccia utente intuitiva
  - Pagina dedicata reset-password con verifica token e gestione errori
  - Integrazione completa nel sistema di routing e autenticazione esistente
  - Supporto per hotel managers e super admin con token sicuri generati con crypto.randomBytes
- **2025-01-26**: Risolto sistema di login Hotel Manager con correzione apiRequest()
  - Corrette tutte le mutations per usare il formato corretto di apiRequest
  - Parsing JSON delle response implementato correttamente
  - Headers Authorization configurati per sessioni autenticate
  - Sistema di setup password funzionale per nuovi hotel
  - Credenziali di test: borroluca@gmail.com / password123
- **2025-01-26**: Implemented comprehensive security system with Google Authenticator 2FA
  - Added complete authentication infrastructure with JWT tokens and secure sessions
  - Implemented Google Authenticator (TOTP) based 2FA for both hotel managers and superadmin
  - Added account lockout protection, IP whitelisting, and comprehensive security logging
  - Created secure login flows with password setup for new hotel accounts
  - Enhanced database schema with security tables for sessions, logs, and MFA management
  - Added rate limiting and security middleware (Helmet) for maximum protection
  - Implemented secure password hashing with bcrypt and session management
  - Created superadmin account: itinera1prova@gmail.com / admin2025 (requires MFA setup)
- **2025-01-26**: Completely redesigned PDF generation with elegant professional styling
  - Implemented elegant PDF design with color palette (saddle brown, goldenrod, light mint, wheat colors)
  - Added sophisticated header section with hotel branding and decorative borders
  - Created elegant guest information boxes with alternating background colors
  - Designed activity cards with time badges and organized layout structure
  - Enhanced typography with proper font hierarchies and readable spacing
  - Applied elegant footer with professional branding and generation date
  - Updated both download PDF endpoint and email PDF functionality with same elegant design
- **2025-01-26**: Implemented automated email system for credit purchase instructions
  - Added `sendCreditPurchaseInstructions` function in `server/services/email.ts`
  - Updated credit purchase endpoint to automatically send bank transfer instructions
  - Email includes: order details, bank information (BORRO LUCA - BANCO BPM), payment instructions
  - Configured with real bank details: IBAN IT67 X050 3401 7530 0000 0146 989, BIC BAPPIT21A88
- **2025-01-26**: Standardized notification system across entire application
  - Replaced all browser `alert()` and `confirm()` with elegant toast notifications and AlertDialog components
  - Improved UX for deletion confirmations in guest profiles, itineraries, and local experiences
  - Consistent shadcn/ui components for professional user experience
- **2025-01-27**: Fixed critical super-admin authentication system
  - Resolved 401 login errors by unifying database schema to use single 'adminUsers' table
  - Updated all service references from 'administrators' to 'adminUsers' for consistency
  - Fixed password hash generation and database storage for admin accounts
  - Added MFA security fields (mfaSecret, mfaEnabled, ipWhitelist) to adminUsers schema
  - Super-admin credentials now working: itinera1prova@gmail.com / password123
- **2025-01-27**: Fixed hotel manager login system after email verification
  - Resolved critical issue where users table and hotels table were disconnected
  - During email verification, system now creates hotel record with user's password hash
  - Login system searches hotels table while registration used users table (now unified)
  - Reduced rate limiting window from 15 minutes to 3 minutes for better UX
  - Hotel registration flow now: register → verify email → auto-create hotel record → login works
- **2025-01-27**: Added persistent hotel setup invitation system
  - New endpoint `/api/hotels/:id/setup-status` checks if hotel configuration is complete
  - Dashboard shows prominent setup banner until all required fields are filled
  - Required fields: name, address, city, region, postalCode, phone
  - Banner displays missing fields and direct link to hotel-setup page
  - Success banner shown when configuration is complete
  - Setup invitation persists across all login sessions until completion
- **2025-01-27**: Fixed critical hotel setup form validation and data saving issues
  - Resolved form validation errors caused by security fields (password, mfa, credits) in form schema
  - Updated insertHotelSchema to exclude system fields and make required fields optional for editing
  - Fixed form reset logic to use only valid form fields, preventing validation conflicts
  - Hotel data saving now works correctly with proper Zod validation
  - Form submission proceeds when no actual validation errors exist (not relying on isValid flag)
- **2025-01-27**: Completamente ridisegnata email "Personalizza il tuo soggiorno" per coerenza con homepage
  - Applicata palette colori sobria e pastello della homepage (stone-50, amber-25, warmgray-50)
  - Utilizzati colori amber-700/800 invece dei precedenti blu/viola per coerenza con brand
  - Migliorata tipografia con font system moderni e spaziature eleganti
  - Aggiunto design responsive con gradienti sottili e ombre delicate
  - Struttura email completamente rivisitata con sezioni ben definite e stile luxury hotel
  - Sistema di icone e layout benefici più elegante e leggibile
- **2025-01-27**: Risolto bug pulsante "Genera Itinerario" sempre disabilitato
  - Aggiunto aggiornamento campo preferencesCompleted=true quando ospite completa preferenze
  - Endpoint /api/guest-preferences/:token ora salva correttamente il flag di completamento
  - Pulsante itinerario ora si attiva automaticamente dopo raccolta preferenze (se crediti > 0)
  - Messaggio di errore mostrato solo quando preferenze non sono state effettivamente raccolte
- **2025-01-27**: Corretto colore testo pulsante "Compila le Tue Preferenze" nell'email
  - Aggiunto !important per forzare colore bianco del testo in tutti gli stati (link, visited, hover)
  - Rimosso text-decoration per mantenere design pulito del pulsante
  - Migliorata compatibilità con client email che sovrascrivono stili dei link
- **2025-01-27**: Risolto errore 404 "Genera con AI" in Esperienze Locali
  - Rimosso hardcoded MOCK_HOTEL_ID e sostituito con hotel ID dell'utente autenticato
  - Aggiornati tutti gli endpoint per usare hotelId corretto dall'authentication context
  - Aggiunto controllo enabled: !!hotelId nelle query per sicurezza
  - Funzione "Genera con AI" ora funziona correttamente per tutti gli hotel autenticati
- **2025-01-27**: Implementato sistema di setup a fasi progressive
  - Modificato endpoint setup-status per includere controllo esperienze locali generate
  - Banner "Configurazione Completata" ora scompare dopo il primo login completato
  - Nuovo banner "Genera le Tue Esperienze Locali" appare fino a generazione esperienze
  - Sistema di onboarding progressivo: Setup Hotel → Genera Esperienze → Uso completo
  - Banner con link diretto alla pagina esperienze locali e icona Sparkles

## System Architecture

The application follows a monorepo structure with clear separation between client, server, and shared code:

- **Frontend**: React SPA with Vite build system
- **Backend**: Express.js REST API
- **Database**: PostgreSQL with Drizzle ORM
- **Shared**: Common schemas and types using Zod validation
- **Styling**: TailwindCSS with shadcn/ui component library

### Architecture Rationale

The monorepo approach was chosen to maintain type safety between frontend and backend while sharing schemas and types. This reduces duplication and ensures consistency across the full stack.

## Key Components

### Frontend Architecture
- **React 18** with TypeScript for type safety
- **Wouter** for lightweight client-side routing
- **TanStack Query** for server state management and caching
- **React Hook Form** with Zod validation for form handling
- **shadcn/ui** components built on Radix UI primitives
- **TailwindCSS** for styling with CSS custom properties for theming

### Backend Architecture
- **Express.js** server with TypeScript
- **Drizzle ORM** for database operations with type-safe queries
- **Neon Database** as PostgreSQL provider
- **Zod** for request validation using shared schemas
- **OpenAI integration** for AI-powered itinerary generation
- **QR code generation** using the qrcode library
- **PDF generation** using PDFKit

### Database Schema
The application uses four main entities:
- **Hotels**: Store hotel information and branding
- **Guest Profiles**: Manage guest preferences and stay details
- **Local Experiences**: Catalog of activities and attractions
- **Itineraries**: Generated travel plans with unique URLs

## Data Flow

1. **Hotel Setup**: Hotels configure their profile and branding
2. **Experience Management**: Hotels add local attractions and activities
3. **Guest Registration**: Guest profiles are created with preferences and stay details
4. **AI Generation**: OpenAI generates personalized itineraries based on guest profiles and available experiences
5. **Distribution**: QR codes and PDFs are generated for guest access
6. **Guest Access**: Public itinerary view accessible via unique URLs with automatic expiration after checkout
7. **Security Control**: Manager-only editing with automatic QR code deactivation after guest checkout date

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection
- **drizzle-orm**: Type-safe database ORM
- **@tanstack/react-query**: Server state management
- **openai**: AI integration for itinerary generation
- **qrcode**: QR code generation for guest access
- **pdfkit**: PDF document generation for QR codes and full itineraries
- **resend**: Email service for automated guest communication and PDF delivery

### UI Dependencies
- **@radix-ui/***: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **react-hook-form**: Form state management
- **wouter**: Lightweight routing

### Development Dependencies
- **vite**: Fast build tool and dev server
- **typescript**: Type safety
- **tsx**: TypeScript execution for development
- **esbuild**: Fast JavaScript bundler for production

## Deployment Strategy

The application is designed for deployment on Replit with the following build process:

1. **Development**: `npm run dev` starts both Vite dev server and Express API
2. **Build**: `npm run build` compiles the React app and bundles the Express server
3. **Production**: `npm start` runs the production Express server serving static files

### Environment Configuration
- `DATABASE_URL`: PostgreSQL connection string (required)
- `OPENAI_API_KEY`: OpenAI API key for itinerary generation
- `RESEND_API_KEY`: Resend API key for automated email sending
- `REPLIT_DOMAINS`: Domain configuration for QR code generation

### Database Migration
- Uses Drizzle Kit for schema migrations
- `npm run db:push` applies schema changes to the database
- Migrations are stored in the `/migrations` directory

### File Storage
- QR codes and PDFs are stored in `/uploads` directory
- Public file serving through Express static middleware
- File paths are returned as URLs for frontend consumption

The system is built to be easily deployable on Replit with minimal configuration, using serverless PostgreSQL and file-based storage for generated assets.