import { neonConfig, Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import bcrypt from 'bcryptjs';
import ws from 'ws';
import { administrators } from '../shared/schema.js';

// Configurazione Neon
neonConfig.webSocketConstructor = ws;

async function setupSuperAdmin() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle({ client: pool, schema: { administrators } });

  try {
    // Hash della password
    const hashedPassword = await bcrypt.hash('admin2025', 12);

    // Inserimento dell'admin
    const result = await db.insert(administrators).values({
      email: 'itinera1prova@gmail.com',
      password: hashedPassword,
      role: 'superadmin',
      isActive: true,
    }).returning();

    console.log('Super admin creato con successo:', result[0]);
    console.log('Email: itinera1prova@gmail.com');
    console.log('Password: admin2025');
    console.log('');
    console.log('IMPORTANTE: Cambia la password dopo il primo accesso!');
    
  } catch (error) {
    if (error.code === '23505') { // Violazione di vincolo unico
      console.log('Super admin già esistente con email: itinera1prova@gmail.com');
    } else {
      console.error('Errore nella creazione del super admin:', error);
    }
  } finally {
    await pool.end();
  }
}

setupSuperAdmin().catch(console.error);