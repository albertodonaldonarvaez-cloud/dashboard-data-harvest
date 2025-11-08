import bcrypt from 'bcrypt';
import { drizzle } from 'drizzle-orm/mysql2';
import { users } from './drizzle/schema.ts';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL no está configurada');
  process.exit(1);
}

const db = drizzle(DATABASE_URL);

async function createAdmin() {
  const email = 'admin@harvestdash.com';
  const password = 'TecTi#2020';
  const name = 'Administrador';
  
  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);
  
  try {
    await db.insert(users).values({
      email,
      name,
      passwordHash,
      role: 'admin',
      openId: `local-admin-${Date.now()}`,
      loginMethod: 'password',
    });
    
    console.log('✅ Usuario administrador creado exitosamente');
    console.log('Email:', email);
    console.log('Contraseña: TecTi#2020');
  } catch (error) {
    console.error('Error al crear usuario:', error);
  }
  
  process.exit(0);
}

createAdmin();
