// services/youtubeService.js
import ytdl from '@distube/ytdl-core';

// Helper function to sanitize filenames (no changes)
function sanitizeFilename(name) {
  return name.replace(/[<>:"/\\|?*]/g, '').replace(/\s+/g, ' ').replace(/_+/g, '_').trim();
}

// Helper function to format bytes (no changes)
function formatBytes(bytes, decimals = 2) {
    if (!+bytes) return '0 Bytes'
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

export async function getVideoDetails(youtubeUrl) {
  try {
    if (!ytdl.validateURL(youtubeUrl)) {
      throw new Error('Invalid YouTube URL provided.');
    }

    const info = await ytdl.getInfo(youtubeUrl);
    const videoDetails = info.videoDetails;
    const formats = info.formats;

    // --- Prepare Video Formats (MP4 only, Map details) ---
    let potentialVideoFormats = formats
      .filter(format => format.container === 'mp4' && format.hasVideo)
      .map(format => ({
        itag: format.itag,
        url: format.url,
        mimeType: format.mimeType,
        container: format.container,
        qualityLabel: format.qualityLabel || 'Unknown',
        size: format.contentLength ? formatBytes(parseInt(format.contentLength)) : null,
        contentLength: format.contentLength ? parseInt(format.contentLength) : null,
        hasAudio: !!format.hasAudio
      }));

     // Sort by quality descending (higher resolution first)
     potentialVideoFormats.sort((a, b) => {
             const qualityA = parseInt(a.qualityLabel?.replace('p', '')) || 0;
             const qualityB = parseInt(b.qualityLabel?.replace('p', '')) || 0;
             return qualityB - qualityA;
         });

     // --- Deduplicate Video Formats ---
     const uniqueVideoFormats = [];
     const seenVideoKeys = new Set();
     for (const format of potentialVideoFormats) {
         // Create a unique key based on quality, container, and audio presence
         const key = `${format.qualityLabel}-${format.container}-${format.hasAudio}`;
         if (!seenVideoKeys.has(key)) {
             uniqueVideoFormats.push(format);
             seenVideoKeys.add(key);
         }
     }

    // --- Prepare Audio Formats (Focus on M4A/MP4, Map details) ---
    let potentialAudioFormats = formats
      .filter(format => format.hasAudio && !format.hasVideo && format.container === 'mp4')
      .map(format => ({
          itag: format.itag,
          url: format.url,
          mimeType: format.mimeType,
          container: 'm4a', // Standardize label for mp4 audio
          bitrate: format.audioBitrate || 0,
          bitrateLabel: format.audioBitrate ? `${format.audioBitrate} kbps` : 'Unknown',
          size: format.contentLength ? formatBytes(parseInt(format.contentLength)) : null,
          contentLength: format.contentLength ? parseInt(format.contentLength) : null,
          codec: format.audioCodec
      }));

      // Sort audio formats by bitrate descending
      potentialAudioFormats.sort((a, b) => b.bitrate - a.bitrate);

     // --- Deduplicate Audio Formats ---
     const uniqueAudioFormats = [];
     const seenAudioKeys = new Set();
     for (const format of potentialAudioFormats) {
        // Create unique key based on bitrate label and container
        const key = `${format.bitrateLabel}-${format.container}`;
        if (!seenAudioKeys.has(key)) {
            uniqueAudioFormats.push(format);
            seenAudioKeys.add(key);
        }
     }

    // --- Sanitize Title ---
    const sanitizedTitle = sanitizeFilename(videoDetails.title);

    // --- Return UNIQUE Formats ---
    return {
      title: videoDetails.title,
      thumbnail: videoDetails.thumbnails[videoDetails.thumbnails.length - 1].url,
      sanitizedTitle: sanitizedTitle,
      videoFormats: uniqueVideoFormats,
      audioFormats: uniqueAudioFormats
    };

  } catch (error) {
    console.error("Error in youtubeService:", error);
    // Make sure error message is passed along
    throw new Error(error.message || 'Failed to fetch video details.');
  }
}