import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configurazione Neon WebSocket
neonConfig.webSocketConstructor = ws;

// Validazione environment variables obbligatorie
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configurazione pool di connessioni ottimizzata per sicurezza e performance
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  
  // Pool size configuration
  max: 20, // Massimo 20 connessioni parallele per prevenire sovraccarico
  min: 2,  // Minimo 2 connessioni sempre attive per latenza ridotta
  
  // Timeout configurations (in millisecondi)
  idleTimeoutMillis: 30000, // 30 secondi per chiudere connessioni inattive
  connectionTimeoutMillis: 2000, // 2 secondi timeout per nuove connessioni
  
  // SSL configuration per sicurezza
  ssl: process.env.NODE_ENV === 'production' ? { 
    rejectUnauthorized: true // Verifica certificati SSL in produzione
  } : false,
  
  // Query timeout per prevenire query infinité
  query_timeout: 30000, // 30 secondi timeout per singole query
  
  // Statement timeout per sicurezza aggiuntiva
  statement_timeout: 30000, // 30 secondi limite per statement
  
  // Configurazioni di rete per stabilità
  keepAlive: true, // Mantiene connessioni TCP attive
  keepAliveInitialDelayMillis: 10000, // 10 secondi delay iniziale keep-alive
  
  // Application name per monitoring e debug
  application_name: 'landeo-hotel-management'
});

// Event listeners per monitoring del pool
pool.on('connect', (client) => {
  console.log('🔗 Database connection established');
});

pool.on('error', (err: Error) => {
  console.error('🚨 Database pool error:', err);
});

pool.on('acquire', (client) => {
  console.log('📊 Database connection acquired from pool');
});

// Note: 'release' event non supportato da @neondatabase/serverless Pool
// Utilizziamo solo eventi supportati: 'connect', 'error', 'acquire', 'remove'
pool.on('remove', (client) => {
  console.log('📊 Database connection removed from pool');
});

// Graceful shutdown del pool
process.on('SIGINT', async () => {
  console.log('🔄 Closing database pool...');
  await pool.end();
  console.log('✅ Database pool closed');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🔄 Closing database pool...');
  await pool.end();
  console.log('✅ Database pool closed');
  process.exit(0);
});

// Configurazione Drizzle ORM con pool ottimizzato
export const db = drizzle({ client: pool, schema });