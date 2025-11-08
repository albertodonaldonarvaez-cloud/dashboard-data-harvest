import { drizzle } from 'drizzle-orm/mysql2';
import { users } from './drizzle/schema';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL no está configurada');
  process.exit(1);
}

const db = drizzle(DATABASE_URL);

async function listUsers() {
  try {
    const allUsers = await db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      openId: users.openId,
      loginMethod: users.loginMethod,
    }).from(users);
    
    console.log('\n=== Usuarios en la base de datos ===\n');
    allUsers.forEach(user => {
      console.log(`ID: ${user.id}`);
      console.log(`Email: ${user.email}`);
      console.log(`Nombre: ${user.name}`);
      console.log(`Rol: ${user.role}`);
      console.log(`OpenID: ${user.openId}`);
      console.log(`Método: ${user.loginMethod}`);
      console.log('---');
    });
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

listUsers();
