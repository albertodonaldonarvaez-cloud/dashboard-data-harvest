import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { getDb } from './db';
import { users } from '../drizzle/schema';

const SALT_ROUNDS = 10;

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

/**
 * Authenticate user with email and password
 * Returns user object if successful, null otherwise
 */
export async function authenticateWithPassword(email: string, password: string) {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  try {
    // Find user by email
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    
    if (result.length === 0) {
      return null; // User not found
    }

    const user = result[0];

    // Check if user has a password hash
    if (!user.passwordHash) {
      return null; // User doesn't have password-based auth enabled
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash);
    
    if (!isValid) {
      return null; // Invalid password
    }

    // Update last signed in
    await db.update(users)
      .set({ lastSignedIn: new Date() })
      .where(eq(users.id, user.id));

    // Return user without password hash
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error) {
    console.error('[Auth] Error authenticating user:', error);
    throw error;
  }
}

/**
 * Create user with email and password
 */
export async function createUserWithPassword(data: {
  email: string;
  password: string;
  name?: string;
  role?: 'user' | 'admin' | 'editor' | 'viewer';
}) {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  try {
    // Check if email already exists
    const existing = await db.select().from(users).where(eq(users.email, data.email)).limit(1);
    if (existing.length > 0) {
      throw new Error('Email already exists');
    }

    // Hash password
    const passwordHash = await hashPassword(data.password);

    // Create user
    const result = await db.insert(users).values({
      email: data.email,
      passwordHash,
      name: data.name || null,
      role: data.role || 'viewer',
      loginMethod: 'password',
      lastSignedIn: new Date(),
    });

    return result;
  } catch (error) {
    console.error('[Auth] Error creating user:', error);
    throw error;
  }
}

/**
 * Update user password
 */
export async function updateUserPassword(userId: number, newPassword: string) {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  try {
    const passwordHash = await hashPassword(newPassword);
    
    await db.update(users)
      .set({ passwordHash })
      .where(eq(users.id, userId));

    return true;
  } catch (error) {
    console.error('[Auth] Error updating password:', error);
    throw error;
  }
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    return null;
  }

  try {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    
    if (result.length === 0) {
      return null;
    }

    const { passwordHash, ...userWithoutPassword } = result[0];
    return userWithoutPassword;
  } catch (error) {
    console.error('[Auth] Error getting user by email:', error);
    return null;
  }
}
