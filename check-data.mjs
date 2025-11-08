import { drizzle } from 'drizzle-orm/mysql2';
import { sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';

dotenv.config();

const db = drizzle(process.env.DATABASE_URL);

async function checkData() {
  console.log('🔍 Verificando datos en la base de datos...\n');

  try {
    // 1. Ver estadísticas generales
    console.log('1️⃣ Estadísticas generales:');
    const stats = await db.execute(sql`
      SELECT 
        COUNT(*) as total_cajas,
        SUM(CAST(pesoCaja AS DECIMAL(10,2))) as peso_total_kg,
        AVG(CAST(pesoCaja AS DECIMAL(10,2))) as peso_promedio_kg
      FROM harvests
    `);
    console.table(stats[0]);

    // 2. Ver por tipo de higo
    console.log('\n2️⃣ Por tipo de higo:');
    const byTipo = await db.execute(sql`
      SELECT 
        tipoHigo,
        COUNT(*) as total_cajas,
        SUM(CAST(pesoCaja AS DECIMAL(10,2))) as peso_total_kg,
        AVG(CAST(pesoCaja AS DECIMAL(10,2))) as peso_promedio_kg
      FROM harvests
      GROUP BY tipoHigo
      ORDER BY tipoHigo
    `);
    console.table(byTipo[0]);

    // 3. Ver promedio solo de primera calidad
    console.log('\n3️⃣ Promedio solo de primera calidad:');
    const primeraPromedio = await db.execute(sql`
      SELECT 
        AVG(CAST(pesoCaja AS DECIMAL(10,2))) as peso_promedio_kg
      FROM harvests
      WHERE LOWER(REPLACE(tipoHigo, ' ', '_')) = 'primera_calidad'
    `);
    console.table(primeraPromedio[0]);

    // 4. Ver algunos registros de ejemplo
    console.log('\n4️⃣ Registros de ejemplo (primeros 5):');
    const examples = await db.execute(sql`
      SELECT 
        id,
        tipoHigo,
        pesoCaja,
        CAST(pesoCaja AS DECIMAL(10,2)) as pesoCaja_decimal,
        numeroCortadora
      FROM harvests
      ORDER BY id DESC
      LIMIT 5
    `);
    console.table(examples[0]);

    // 5. Ver top cortadoras
    console.log('\n5️⃣ Top 5 cortadoras:');
    const topCortadoras = await db.execute(sql`
      SELECT 
        numeroCortadora,
        COUNT(*) as total_cajas,
        SUM(CAST(pesoCaja AS DECIMAL(10,2))) as peso_total_kg,
        AVG(CAST(pesoCaja AS DECIMAL(10,2))) as peso_promedio_kg
      FROM harvests
      WHERE numeroCortadora NOT IN ('97', '98', '99')
      GROUP BY numeroCortadora
      ORDER BY peso_total_kg DESC
      LIMIT 5
    `);
    console.table(topCortadoras[0]);

    console.log('\n✅ Verificación completada!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkData();
