# Rapporto di Audit di Sicurezza - Piattaforma Landeo
## Data: 28 Gennaio 2025

---

## SOMMARIO ESECUTIVO

Questa analisi ha identificato **26 vulnerabilità di sicurezza** suddivise in:
- **8 Vulnerabilità CRITICHE** - Richiedono intervento immediato
- **12 Vulnerabilità ELEVATE** - Richiedono intervento prioritario
- **6 Vulnerabilità MEDIE** - Richiedono intervento in tempi ragionevoli

---

## 🔴 VULNERABILITÀ CRITICHE (Intervento Immediato)

### 1. **HARDCODED FALLBACK API KEYS**
**File:** `server/services/openai.ts`
**Linea:** `apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"`

**Problema:** API key OpenAI con fallback hardcoded "default_key"
**Rischio:** Esposizione di credenziali, possibili chiamate API non autorizzate
**Impatto:** CRITICO - Espone il sistema a attacchi esterni

### 2. **JWT SECRET GENERATO DINAMICAMENTE**
**File:** `server/services/security.ts`
**Linea:** `const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');`

**Problema:** Se JWT_SECRET non è in .env, viene generato randomicamente ad ogni restart
**Rischio:** Tutti i token esistenti diventano invalidi ad ogni riavvio del server
**Impatto:** CRITICO - Disconnette tutti gli utenti ad ogni deploy/restart

### 3. **SQL INJECTION POTENZIALE**
**File:** `server/routes.ts` (multipli endpoint)
**Problema:** Uso di parametri user-input senza validazione completa in query dinamiche
**Rischio:** Possibilità di SQL injection attraverso parametri manipolati
**Impatto:** CRITICO - Accesso non autorizzato al database

### 4. **LOGGING SENSIBILE**
**File:** `server/routes/auth.ts` linee 102-105, 221
**Problema:** Logging di password in plain text nei console.log di debug
```typescript
console.log("Input password:", password);
console.log("User password hash:", user.passwordHash);
```
**Rischio:** Password visibili nei log del server
**Impatto:** CRITICO - Esposizione credenziali utente

### 5. **VALIDAZIONE INSUFFICIENTE UPLOAD FILE**
**File:** `server/routes.ts` linee 47-59
**Problema:** Validazione solo su MIME type, facilmente falsificabile
**Rischio:** Upload di file malevoli (shell, script)
**Impatto:** CRITICO - Possibile Remote Code Execution

### 6. **GESTIONE ERRORI CHE ESPONE INFORMAZIONI**
**File:** `server/routes.ts` (vari endpoint)
**Problema:** Stack trace e dettagli errori esposti al client
**Rischio:** Information disclosure per reconnaissance di attacchi
**Impatto:** CRITICO - Facilita attacchi mirati

### 7. **MANCANZA DI VALIDAZIONE ORIGINE DOMAINS**
**File:** `server/services/qr.ts`, `server/services/email.ts`
**Problema:** Usa REPLIT_DOMAINS senza validazione origine
**Rischio:** Possibili attacchi di redirect/phishing
**Impatto:** CRITICO - Compromissione user experience

### 8. **RATE LIMITING INSUFFICIENTE PER MFA**
**File:** `server/routes/auth.ts` linea 31
**Problema:** 10 tentativi in 5 minuti per MFA troppo permissivo
**Rischio:** Brute force attack sui codici TOTP
**Impatto:** CRITICO - Bypass dell'autenticazione a due fattori

---

## 🟠 VULNERABILITÀ ELEVATE (Intervento Prioritario)

### 9. **MANCANZA DI CSRF PROTECTION**
**File:** `server/index.ts`
**Problema:** Nessuna protezione CSRF implementata
**Rischio:** Cross-Site Request Forgery attacks
**Impatto:** ELEVATO - Azioni non autorizzate per utenti autenticati

### 10. **SESSION FIXATION**
**File:** `server/services/security.ts`
**Problema:** Session token non rigenerato dopo login/logout
**Rischio:** Attaccante può fissare session ID prima dell'autenticazione
**Impatto:** ELEVATO - Hijacking di sessioni utente

### 11. **WEAK PASSWORD POLICY**
**File:** `server/routes/auth.ts` linea 46
**Problema:** Password minimo 8 caratteri, nessun controllo complessità
**Rischio:** Password deboli facilmente craccabili
**Impatto:** ELEVATO - Compromise account utenti

### 12. **MANCANZA DI ACCOUNT ENUMERATION PROTECTION**
**File:** `server/routes/auth.ts` linee 79-83
**Problema:** Messaggi di errore diversi per "utente non trovato" vs "password errata"
**Rischio:** Enumerazione di account validi
**Impatto:** ELEVATO - Facilita attacchi mirati

### 13. **IP WHITELIST BYPASS**
**File:** `server/services/security.ts` linee 296-300
**Problema:** Lista IP vuota = tutti gli IP consentiti (fallback insicuro)
**Rischio:** Bypass delle restrizioni IP
**Impatto:** ELEVATO - Accesso da location non autorizzate

### 14. **HEADERS SECURITY INSUFFICIENTI**
**File:** `server/index.ts` linee 16-17
**Problema:** CSP permette 'unsafe-inline' e 'unsafe-eval'
**Rischio:** XSS attacks, code injection
**Impatto:** ELEVATO - Esecuzione script malevoli

### 15. **MANCANZA DI INPUT SANITIZATION**
**File:** `server/routes.ts` (vari endpoint)
**Problema:** Input utente non sanitizzato prima del database storage
**Rischio:** Stored XSS, data corruption
**Impatto:** ELEVATO - Compromissione dati e user experience

### 16. **EMAIL INJECTION**
**File:** `server/services/email.ts`
**Problema:** Parametri email non validati/sanitizzati
**Rischio:** Email header injection, spam relay
**Impatto:** ELEVATO - Uso improprio del servizio email

### 17. **EXPOSED DEBUG ENDPOINTS**
**File:** `server/routes/hotel-registration.ts` linee 271-303
**Problema:** Endpoint debug esposti anche in ambiente produzione
**Rischio:** Information disclosure di dati sensibili
**Impatto:** ELEVATO - Esposizione dati di registrazione

### 18. **PATH TRAVERSAL VULNERABILITY**
**File:** `server/routes.ts` linee 32-45
**Problema:** Upload path non validato contro directory traversal
**Rischio:** File upload in location non autorizzate
**Impatto:** ELEVATO - Potenziale compromise del filesystem

### 19. **INSUFFICIENT LOGGING SECURITY EVENTS**
**File:** `server/services/security.ts`
**Problema:** Log eventi critici non completi/strutturati
**Rischio:** Difficoltà nel detection e response degli attacchi
**Impatto:** ELEVATO - Compromessa visibility su security incidents

### 20. **DATABASE CONNECTION EXPOSURE**
**File:** `drizzle.config.ts`
**Problema:** Error message espone DATABASE_URL structure
**Rischio:** Information disclosure su infrastructure
**Impatto:** ELEVATO - Facilita reconnaissance attacchi

---

## 🟡 VULNERABILITÀ MEDIE (Intervento Ragionevole)

### 21. **WEAK SESSION DURATION**
**File:** `server/services/security.ts` linea 13
**Problema:** Session duration di 24 ore troppo lunga
**Rischio:** Finestre di attacco prolungate se session compromessa
**Impatto:** MEDIO - Estensione del periodo di rischio

### 22. **INSUFFICIENT RATE LIMITING GENERAL**
**File:** `server/index.ts` linee 29-35
**Problema:** 1000 requests per 15 minuti troppo permissivo
**Rischio:** DoS attacks, resource exhaustion
**Impatto:** MEDIO - Degradazione delle performance

### 23. **MFA SECRET STORAGE**
**File:** `shared/schema.ts` linee 29, 113
**Problema:** MFA secret stored as plain text invece che encrypted
**Rischio:** Compromissione MFA se database leak
**Impatto:** MEDIO - Bypass autenticazione in caso di breach

### 24. **MISSING HTTP SECURITY HEADERS**
**File:** `server/index.ts`
**Problema:** Mancano X-Frame-Options, X-Content-Type-Options specifici
**Rischio:** Clickjacking, MIME type confusion
**Impatto:** MEDIO - Vulnerabilità client-side

### 25. **COOKIE SECURITY**
**File:** Mancanza di configurazione cookies sicuri
**Problema:** Cookies non configurati con flags Secure, HttpOnly, SameSite
**Rischio:** Session theft via XSS o MITM
**Impatto:** MEDIO - Compromissione sessioni utente

### 26. **DEPENDENCY VULNERABILITIES**
**File:** `package.json`
**Problema:** Dependencies non verificate per vulnerabilità note
**Rischio:** Supply chain attacks, vulnerabilità ereditarie
**Impatto:** MEDIO - Compromissione attraverso librerie esterne

---

## 🛠️ RACCOMANDAZIONI IMMEDIATE

### Priorità 1 (Da implementare entro 24 ore):
1. **Rimuovere tutti i hardcoded fallback** per API keys
2. **Configurare JWT_SECRET fisso** in ambiente production
3. **Eliminare logging di password** e hash
4. **Implementare validazione file upload rigorosa**
5. **Configurare CSRF protection**

### Priorità 2 (Da implementare entro 1 settimana):
1. **Implementare password policy robusta** (lunghezza, complessità, dictionary check)
2. **Unificare messaggi di errore** per prevenire account enumeration
3. **Aggiungere input sanitization** completa
4. **Migliorare CSP headers** security
5. **Implementare session regeneration**

### Priorità 3 (Da implementare entro 1 mese):
1. **Audit dependencies** con npm audit
2. **Implementare MFA secret encryption**
3. **Migliorare security logging**
4. **Configurare cookie security flags**
5. **Implementare monitoring proattivo**

---

## 🔧 SCRIPT DI REMEDIATION

Per alcuni problemi critici, possono essere implementate fix immediate:

```bash
# 1. Audit dependencies
npm audit
npm audit fix

# 2. Check for hardcoded secrets
grep -r "default_key\|password123\|secret" server/

# 3. Validate environment variables
node -e "console.log('JWT_SECRET:', !!process.env.JWT_SECRET)"
node -e "console.log('OPENAI_API_KEY:', !!process.env.OPENAI_API_KEY)"
```

---

## 📊 METRICHE DI RISCHIO

| Categoria | Numero | Severità Media | Tempo Remediation |
|-----------|---------|---------------|-------------------|
| Critico   | 8       | 9.5/10        | 24-48 ore        |
| Elevato   | 12      | 7.5/10        | 1-2 settimane    |
| Medio     | 6       | 5.5/10        | 2-4 settimane    |

**Score di Rischio Complessivo: 8.2/10 (ALTO)**

---

## 📋 CHECKLIST COMPLIANCE

- [ ] OWASP Top 10 2021 - **NON CONFORME**
- [ ] GDPR Data Protection - **PARZIALMENTE CONFORME**
- [ ] ISO 27001 - **NON CONFORME**
- [ ] PCI DSS (se applicabile) - **NON CONFORME**

---

*Questo rapporto è stato generato attraverso analisi statica del codice e review manuale. Si raccomanda un penetration test completo dopo l'implementazione delle fix principali.*