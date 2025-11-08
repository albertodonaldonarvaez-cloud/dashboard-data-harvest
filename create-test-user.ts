import bcrypt from 'bcrypt';
import { drizzle } from 'drizzle-orm/mysql2';
import { users } from './drizzle/schema';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL no está configurada');
  process.exit(1);
}

const db = drizzle(DATABASE_URL);

async function createTestUser() {
  const email = 'viewer@harvestdash.com';
  const password = 'test123';
  const name = 'Usuario Viewer';
  
  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);
  
  try {
    await db.insert(users).values({
      email,
      name,
      passwordHash,
      role: 'viewer',
      openId: `local-viewer-${Date.now()}`,
      loginMethod: 'password',
    });
    
    console.log('✅ Usuario viewer creado exitosamente');
    console.log('Email:', email);
    console.log('Contraseña: test123');
    console.log('Rol: viewer');
  } catch (error) {
    console.error('Error al crear usuario:', error);
  }
  
  process.exit(0);
}

createTestUser();
