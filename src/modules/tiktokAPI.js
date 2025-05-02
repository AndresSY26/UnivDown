// modules/tiktokAPI.js
import Tiktok from '@tobyg74/tiktok-api-dl';

/**
 * Fetches TikTok video information using @tobyg74/tiktok-api-dl.
 * @param {string} url
 * @returns {Promise<object>}
 */
export const fetchTikTokVideoInfo = async (url) => {
  if (!url) {
    throw new Error('URL is required');
  }

  console.log(`Fetching TikTok info for URL: ${url}`);

  try {
    const options = {
      version: "v3"
    };

    const result = await Tiktok.Downloader(url, options);

    console.log("TikTok API Result:", result);

    if (result.status === 'success' && result.result?.videoHD) {
        // Devolvemos solo la información relevante
        return {
            status: 'success',
            videoUrl: result.result.videoHD,
            videoSD: result.result.videoSD,
            videoWatermark: result.result.videoWatermark,
            description: result.result.desc || '',
            author: result.result.author || { nickname: 'Unknown', avatar: '' },
            thumbnailUrl: result.result.author?.avatar || '/path/to/default/tiktok/thumbnail.png'
        };
    } else if (result.status === 'success' && result.result?.videoSD && !result.result?.videoHD) {
        console.warn("HD video not available, falling back to SD for URL:", url);
        return {
            status: 'success',
            videoUrl: result.result.videoSD,
            videoSD: result.result.videoSD,
            videoWatermark: result.result.videoWatermark,
            description: result.result.desc || '',
            author: result.result.author || { nickname: 'Unknown', avatar: '' },
            thumbnailUrl: result.result.author?.avatar || '/path/to/default/tiktok/thumbnail.png'
        };
    }
     else {
      // Si el status no es 'success' o falta la URL del video
      const errorMessage = result.message || 'Could not retrieve video information.';
      console.error(`TikTok API Error for URL ${url}: ${errorMessage}`, result);
      throw new Error(errorMessage);
    }
  } catch (error) {
    console.error(`Error fetching TikTok video info for URL ${url}:`, error);
    // Asegurarse de que se lance un error significativo
    throw new Error(error.message || 'Failed to fetch TikTok video information due to an unexpected error.');
  }
};