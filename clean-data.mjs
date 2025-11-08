import { drizzle } from 'drizzle-orm/mysql2';
import { sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';

dotenv.config();

const db = drizzle(process.env.DATABASE_URL);

async function cleanData() {
  console.log('🧹 Iniciando limpieza de datos...\n');

  try {
    // 1. Normalizar tipos de higo
    console.log('1️⃣ Normalizando tipos de higo...');
    
    await db.execute(sql`
      UPDATE harvests 
      SET tipoHigo = 'primera_calidad' 
      WHERE LOWER(REPLACE(tipoHigo, ' ', '_')) = 'primera_calidad'
    `);
    console.log('   ✅ Primera calidad normalizada');

    await db.execute(sql`
      UPDATE harvests 
      SET tipoHigo = 'segunda_calidad' 
      WHERE LOWER(REPLACE(tipoHigo, ' ', '_')) = 'segunda_calidad'
    `);
    console.log('   ✅ Segunda calidad normalizada');

    await db.execute(sql`
      UPDATE harvests 
      SET tipoHigo = 'desperdicio' 
      WHERE LOWER(REPLACE(tipoHigo, ' ', '_')) = 'desperdicio'
    `);
    console.log('   ✅ Desperdicio normalizado\n');

    // 2. Eliminar datos con pesos absurdos
    console.log('2️⃣ Eliminando registros con pesos inválidos...');
    
    const result1 = await db.execute(sql`
      DELETE FROM harvests 
      WHERE CAST(pesoCaja AS DECIMAL(10,2)) > 50
    `);
    console.log(`   ✅ Eliminados ${result1[0].affectedRows || 0} registros con peso > 50 kg`);

    const result2 = await db.execute(sql`
      DELETE FROM harvests 
      WHERE CAST(pesoCaja AS DECIMAL(10,2)) <= 0
    `);
    console.log(`   ✅ Eliminados ${result2[0].affectedRows || 0} registros con peso <= 0 kg\n`);

    // 3. Mostrar resumen
    console.log('3️⃣ Resumen después de la limpieza:\n');
    
    const summary = await db.execute(sql`
      SELECT 
        tipoHigo,
        COUNT(*) as total_cajas,
        ROUND(SUM(CAST(pesoCaja AS DECIMAL(10,2))), 2) as peso_total_kg,
        ROUND(AVG(CAST(pesoCaja AS DECIMAL(10,2))), 2) as peso_promedio_kg,
        ROUND(MIN(CAST(pesoCaja AS DECIMAL(10,2))), 2) as peso_minimo_kg,
        ROUND(MAX(CAST(pesoCaja AS DECIMAL(10,2))), 2) as peso_maximo_kg
      FROM harvests
      GROUP BY tipoHigo
      ORDER BY tipoHigo
    `);

    console.table(summary[0]);
    
    console.log('\n✅ Limpieza completada exitosamente!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
    process.exit(1);
  }
}

cleanData();
