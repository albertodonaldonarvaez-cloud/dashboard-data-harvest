import sharp from 'sharp';
import { storagePut } from './storage';

/**
 * Download image from URL with optional authentication
 */
async function downloadImage(url: string, authToken?: string): Promise<Buffer> {
  const headers: Record<string, string> = {};
  
  // Add authorization header if token is provided (for KoboToolbox images)
  if (authToken) {
    headers['Authorization'] = `Token ${authToken}`;
  }
  
  const response = await fetch(url, { headers });
  
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Process and upload image to S3 in both large and small versions
 * Returns URLs for both versions
 */
export async function processAndUploadImage(
  imageUrl: string,
  harvestId: number,
  fileName: string,
  authToken?: string
): Promise<{ largeUrl: string; smallUrl: string }> {
  try {
    // Download original image
    const imageBuffer = await downloadImage(imageUrl, authToken);

    // Process large version (max 1920px width, high quality)
    const largeBuffer = await sharp(imageBuffer)
      .resize(1920, null, {
        withoutEnlargement: true,
        fit: 'inside',
      })
      .jpeg({ quality: 90 })
      .toBuffer();

    // Process small version (max 400px width, for thumbnails)
    const smallBuffer = await sharp(imageBuffer)
      .resize(400, null, {
        withoutEnlargement: true,
        fit: 'inside',
      })
      .jpeg({ quality: 80 })
      .toBuffer();

    // Upload to S3
    const timestamp = Date.now();
    const baseName = fileName.replace(/\.[^/.]+$/, ''); // Remove extension
    
    const largeKey = `harvests/${harvestId}/large/${baseName}-${timestamp}.jpg`;
    const smallKey = `harvests/${harvestId}/small/${baseName}-${timestamp}.jpg`;

    const { url: largeUrl } = await storagePut(largeKey, largeBuffer, 'image/jpeg');
    const { url: smallUrl } = await storagePut(smallKey, smallBuffer, 'image/jpeg');

    return {
      largeUrl,
      smallUrl,
    };
  } catch (error) {
    console.error('Error processing image:', error);
    throw error;
  }
}

/**
 * Process multiple images for a harvest
 */
export async function processHarvestImages(
  imageUrls: string[],
  harvestId: number,
  authToken?: string
): Promise<Array<{ largeUrl: string; smallUrl: string; originalUrl: string }>> {
  const results = [];

  for (let i = 0; i < imageUrls.length; i++) {
    const url = imageUrls[i];
    try {
      const fileName = `image-${i + 1}`;
      const { largeUrl, smallUrl } = await processAndUploadImage(url, harvestId, fileName, authToken);
      results.push({
        originalUrl: url,
        largeUrl,
        smallUrl,
      });
    } catch (error) {
      console.error(`Failed to process image ${url}:`, error);
      // Continue with other images even if one fails
    }
  }

  return results;
}
