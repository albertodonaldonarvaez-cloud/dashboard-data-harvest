import { drizzle } from 'drizzle-orm/mysql2';
import { sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';

dotenv.config();

const db = drizzle(process.env.DATABASE_URL);

async function cleanOrphanImages() {
  console.log('🧹 Limpiando imágenes huérfanas...\n');

  try {
    // 1. Contar imágenes huérfanas antes
    console.log('1️⃣ Contando imágenes huérfanas:');
    const before = await db.execute(sql`
      SELECT COUNT(*) as total_huerfanas
      FROM harvest_attachments ha
      LEFT JOIN harvests h ON ha.harvestId = h.id
      WHERE h.id IS NULL
    `);
    console.table(before[0]);

    // 2. Eliminar imágenes huérfanas
    console.log('\n2️⃣ Eliminando imágenes huérfanas...');
    const result = await db.execute(sql`
      DELETE ha FROM harvest_attachments ha
      LEFT JOIN harvests h ON ha.harvestId = h.id
      WHERE h.id IS NULL
    `);
    console.log(`   ✅ Eliminadas ${result[0].affectedRows || 0} imágenes huérfanas`);

    // 3. Verificar después
    console.log('\n3️⃣ Verificando después de la limpieza:');
    const after = await db.execute(sql`
      SELECT 
        COUNT(*) as total_imagenes,
        COUNT(DISTINCT harvestId) as harvests_con_imagenes
      FROM harvest_attachments
    `);
    console.table(after[0]);

    console.log('\n✅ Limpieza completada!');
    console.log('\n💡 Nota: Para agregar imágenes a los harvests actuales, necesitas:');
    console.log('   1. Sincronizar nuevamente con KoboToolbox, o');
    console.log('   2. Subir imágenes manualmente desde la interfaz');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

cleanOrphanImages();
