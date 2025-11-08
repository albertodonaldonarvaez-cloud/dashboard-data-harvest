import { drizzle } from 'drizzle-orm/mysql2';
import { sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';

dotenv.config();

const db = drizzle(process.env.DATABASE_URL);

async function checkImages() {
  console.log('🖼️  Verificando imágenes en la base de datos...\n');

  try {
    // 1. Ver cuántos harvests tienen imágenes
    console.log('1️⃣ Harvests con imágenes:');
    const withImages = await db.execute(sql`
      SELECT COUNT(DISTINCT h.id) as harvests_con_imagenes
      FROM harvests h
      INNER JOIN harvest_attachments ha ON h.id = ha.harvestId
    `);
    console.table(withImages[0]);

    // 2. Ver total de imágenes
    console.log('\n2️⃣ Total de imágenes:');
    const totalImages = await db.execute(sql`
      SELECT 
        COUNT(*) as total_imagenes,
        COUNT(DISTINCT harvestId) as harvests_unicos
      FROM harvest_attachments
    `);
    console.table(totalImages[0]);

    // 3. Ver ejemplos de imágenes
    console.log('\n3️⃣ Ejemplos de imágenes (primeras 10):');
    const examples = await db.execute(sql`
      SELECT 
        ha.id,
        ha.harvestId,
        ha.smallUrl,
        ha.largeUrl,
        h.numeroCaja,
        h.parcela
      FROM harvest_attachments ha
      INNER JOIN harvests h ON ha.harvestId = h.id
      ORDER BY ha.id DESC
      LIMIT 10
    `);
    console.table(examples[0]);

    // 4. Ver harvests sin imágenes
    console.log('\n4️⃣ Harvests sin imágenes (primeros 5):');
    const withoutImages = await db.execute(sql`
      SELECT 
        h.id,
        h.numeroCaja,
        h.parcela,
        h.tipoHigo
      FROM harvests h
      LEFT JOIN harvest_attachments ha ON h.id = ha.harvestId
      WHERE ha.id IS NULL
      LIMIT 5
    `);
    console.table(withoutImages[0]);

    console.log('\n✅ Verificación completada!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkImages();
