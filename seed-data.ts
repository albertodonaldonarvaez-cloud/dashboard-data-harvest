import { drizzle } from 'drizzle-orm/mysql2';
import { harvests, harvestAttachments } from './drizzle/schema';
import * as fs from 'fs';

const db = drizzle(process.env.DATABASE_URL!);

async function seedData() {
  try {
    console.log('Reading JSON data...');
    const jsonData = JSON.parse(fs.readFileSync('/home/ubuntu/upload/consulta-de-datos-procesados.json', 'utf8'));
    
    console.log(`Found ${jsonData.length} records to import`);
    
    for (const record of jsonData) {
      // Convert peso_de_la_caja from kg to grams
      const pesoGrams = record.peso_de_la_caja ? Math.round(record.peso_de_la_caja * 1000) : null;
      
      // Insert harvest
      const harvestData = {
        externalId: record._id,
        formhubUuid: record['formhub/uuid'],
        startTime: record.start ? new Date(record.start) : null,
        endTime: record.end ? new Date(record.end) : null,
        parcela: record.escanea_la_parcela,
        pesoCaja: pesoGrams,
        fotoCaja: record.foto_de_la_caja,
        numeroCortadora: record.numero_de_cortadora,
        numeroCaja: record.numero_de_caja,
        tipoHigo: record.tipo_de_higo,
        latitud: record.latitud ? record.latitud.toString() : null,
        longitud: record.longitud ? record.longitud.toString() : null,
        status: record._status,
        submissionTime: record._submission_time ? new Date(record._submission_time) : null,
        submittedBy: record._submitted_by,
      };
      
      const result = await db.insert(harvests).values(harvestData);
      const harvestId = Number(result[0].insertId);
      
      // Insert attachments if any
      if (record._attachments && record._attachments.length > 0) {
        for (const att of record._attachments) {
          await db.insert(harvestAttachments).values({
            harvestId,
            filename: att.media_file_basename || att.filename,
            mimetype: att.mimetype,
            originalUrl: att.download_url,
            largeUrl: att.download_large_url,
            mediumUrl: att.download_medium_url,
            smallUrl: att.download_small_url,
            uid: att.uid,
            isDeleted: att.is_deleted || false,
          });
        }
      }
      
      console.log(`Imported record ${record._id} (harvest ID: ${harvestId})`);
    }
    
    console.log('Data import completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error importing data:', error);
    process.exit(1);
  }
}

seedData();
