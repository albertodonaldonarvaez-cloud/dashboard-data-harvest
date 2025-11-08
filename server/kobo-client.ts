/**
 * KoboToolbox API Client
 * Handles communication with KoboToolbox API for data synchronization
 */

export interface KoboSubmission {
  _id: number;
  start: string;
  end: string;
  escanea_la_parcela: string;
  escanea_la_caja: string;
  peso_de_la_caja: string;
  foto_de_la_caja?: string;
  tu_ubicacion?: string;
  _attachments?: Array<{
    download_url: string;
    download_large_url: string;
    download_small_url: string;
    mimetype: string;
    filename: string;
    uid: string;
  }>;
  _status: string;
  _submission_time: string;
  _submitted_by: string;
}

export interface ProcessedSubmission {
  parcela: string;
  pesoCaja: number;
  numeroCortadora: string;
  numeroCaja: string;
  tipoHigo: string;
  submissionTime: Date;
  latitud?: string;
  longitud?: string;
  status: string;
  submittedBy?: string;
  imageUrls?: {
    large?: string;
    small?: string;
  };
}

export interface KoboConfig {
  apiUrl: string;
  assetId: string;
  token: string;
}

/**
 * Process raw KoboToolbox submission data
 * Based on the Python script logic
 */
export function processKoboSubmission(submission: KoboSubmission): ProcessedSubmission | null {
  try {
    // 1. Process 'escanea_la_caja' to extract numero_cortadora and numero_de_caja
    let numeroCortadora: string | null = null;
    let numeroCaja: string | null = null;
    
    const escanea_la_caja = submission.escanea_la_caja;
    if (escanea_la_caja && escanea_la_caja.includes('-')) {
      const partes = escanea_la_caja.split('-');
      if (partes.length === 2) {
        numeroCortadora = partes[0].trim();
        numeroCaja = partes[1].trim();
      }
    }

    if (!numeroCortadora || !numeroCaja) {
      console.warn(`Invalid escanea_la_caja format: ${escanea_la_caja}`);
      return null;
    }

    // 2. Determine 'tipo_de_higo' based on numero_cortadora
    let tipoHigo = 'primera_calidad'; // Default
    if (numeroCortadora === '98') {
      tipoHigo = 'segunda_calidad';
    } else if (numeroCortadora === '99') {
      tipoHigo = 'desperdicio';
    }
    // Note: 97 and all other numbers are 'primera_calidad'

    // 3. Convert 'peso_de_la_caja' to number
    const pesoStr = submission.peso_de_la_caja;
    let pesoCaja: number;
    try {
      pesoCaja = parseFloat(pesoStr);
      if (isNaN(pesoCaja)) {
        console.warn(`Invalid peso_de_la_caja: ${pesoStr}`);
        return null;
      }
    } catch (error) {
      console.warn(`Error parsing peso_de_la_caja: ${pesoStr}`);
      return null;
    }

    // 4. Reformat 'start' date
    let submissionTime: Date;
    try {
      // Parse ISO date with timezone (e.g., "2025-10-30T09:02:13.998-06:00")
      submissionTime = new Date(submission.start);
      if (isNaN(submissionTime.getTime())) {
        console.warn(`Invalid start date: ${submission.start}`);
        submissionTime = new Date(); // Fallback to current date
      }
    } catch (error) {
      console.warn(`Error parsing start date: ${submission.start}`);
      submissionTime = new Date();
    }

    // 5. Separate 'tu_ubicacion' into latitud and longitud
    let latitud: string | undefined;
    let longitud: string | undefined;
    
    const ubicacion = submission.tu_ubicacion;
    if (ubicacion) {
      try {
        const partes = ubicacion.split(' ');
        if (partes.length >= 2) {
          latitud = partes[0];
          longitud = partes[1];
        }
      } catch (error) {
        console.warn(`Error parsing tu_ubicacion: ${ubicacion}`);
      }
    }

    // 6. Extract parcela (format: " -LOS ELOTES" or "367 -EL CHATO")
    let parcela = submission.escanea_la_parcela || '';
    if (parcela.includes('-')) {
      const partes = parcela.split('-');
      parcela = partes[0].trim() || partes[1].trim(); // Use first part if exists, otherwise second
    }
    parcela = parcela.trim();

    // 7. Extract image URLs if available
    let imageUrls: { large?: string; small?: string } | undefined;
    if (submission._attachments && submission._attachments.length > 0) {
      const attachment = submission._attachments[0]; // Use first attachment
      imageUrls = {
        large: attachment.download_large_url,
        small: attachment.download_small_url,
      };
    }

    return {
      parcela,
      pesoCaja,
      numeroCortadora,
      numeroCaja,
      tipoHigo,
      submissionTime,
      latitud,
      longitud,
      status: submission._status || 'submitted_via_web',
      submittedBy: submission._submitted_by,
      imageUrls,
    };
  } catch (error) {
    console.error('Error processing KoboToolbox submission:', error);
    return null;
  }
}

/**
 * Fetch submissions from KoboToolbox API
 */
export async function fetchKoboSubmissions(
  config: KoboConfig,
  options?: {
    limit?: number;
    offset?: number;
    since?: Date; // Fetch only submissions after this date
  }
): Promise<KoboSubmission[]> {
  try {
    let url = `${config.apiUrl}/api/v2/assets/${config.assetId}/data/?format=json`;
    
    if (options?.limit) {
      url += `&limit=${options.limit}`;
    }
    if (options?.offset) {
      url += `&start=${options.offset}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${config.token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`KoboToolbox API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    let submissions: KoboSubmission[] = data.results || [];

    // Filter by date if specified
    if (options?.since) {
      const sinceTime = options.since.getTime();
      submissions = submissions.filter(sub => {
        const subTime = new Date(sub._submission_time).getTime();
        return subTime > sinceTime;
      });
    }

    return submissions;
  } catch (error) {
    console.error('Error fetching KoboToolbox submissions:', error);
    throw error;
  }
}

/**
 * Get the default KoboToolbox configuration from environment
 */
export function getDefaultKoboConfig(): KoboConfig {
  return {
    apiUrl: process.env.KOBO_API_URL || 'https://kf.smart-harvest.tecti-cloud.com',
    assetId: process.env.KOBO_ASSET_ID || 'aDePEqzfzdqSRjPvn5gqNY',
    token: process.env.KOBO_API_TOKEN || '',
  };
}
