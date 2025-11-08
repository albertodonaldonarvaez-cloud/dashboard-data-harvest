import { drizzle } from 'drizzle-orm/mysql2';
import { sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';

dotenv.config();

const db = drizzle(process.env.DATABASE_URL);

async function checkOrphanImages() {
  console.log('🔍 Verificando imágenes huérfanas...\n');

  try {
    // 1. Ver rango de IDs en harvests
    console.log('1️⃣ Rango de IDs en harvests:');
    const harvestIds = await db.execute(sql`
      SELECT 
        MIN(id) as min_id,
        MAX(id) as max_id,
        COUNT(*) as total
      FROM harvests
    `);
    console.table(harvestIds[0]);

    // 2. Ver rango de harvestIds en attachments
    console.log('\n2️⃣ Rango de harvestIds en attachments:');
    const attachmentIds = await db.execute(sql`
      SELECT 
        MIN(harvestId) as min_harvest_id,
        MAX(harvestId) as max_harvest_id,
        COUNT(*) as total
      FROM harvest_attachments
    `);
    console.table(attachmentIds[0]);

    // 3. Ver algunos harvestIds específicos de attachments
    console.log('\n3️⃣ Algunos harvestIds de attachments:');
    const someIds = await db.execute(sql`
      SELECT DISTINCT harvestId
      FROM harvest_attachments
      ORDER BY harvestId
      LIMIT 10
    `);
    console.table(someIds[0]);

    // 4. Verificar si esos IDs existen en harvests
    console.log('\n4️⃣ Verificando si existen en harvests:');
    const exists = await db.execute(sql`
      SELECT 
        ha.harvestId,
        CASE WHEN h.id IS NULL THEN 'NO EXISTE' ELSE 'EXISTE' END as estado
      FROM harvest_attachments ha
      LEFT JOIN harvests h ON ha.harvestId = h.id
      GROUP BY ha.harvestId
      LIMIT 10
    `);
    console.table(exists[0]);

    console.log('\n✅ Verificación completada!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkOrphanImages();
