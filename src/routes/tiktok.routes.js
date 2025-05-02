import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import ejs from 'ejs';
import { Readable } from 'stream';
import { fetchTikTokVideoInfo } from '../modules/tiktokAPI.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

router.get('/tiktok', async (req, res) => {
  try {
    const tiktokContent = await ejs.renderFile(path.join(__dirname, '../views', 'tiktok.ejs'), {});
    if (req.query.partial === 'true') {
      res.send(tiktokContent); // Envía SOLO el contenido renderizado
    } else {
      res.render('index', { content: tiktokContent });
    }
  } catch (error) {
    console.error("Error rendering TikTok:", error);
    res.status(500).send("Error rendering TikTok");
  }
});

// NUEVA RUTA: API para obtener información del video
router.post('/api/tiktok/info', async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ status: 'error', message: 'URL is required' });
  }
  try {
    const videoInfo = await fetchTikTokVideoInfo(url);
    res.json(videoInfo);
  } catch (error) {
    console.error("Error in /api/tiktok/info:", error);
    // Devuelve un mensaje de error genérico o el mensaje específico si es seguro
    res.status(500).json({ status: 'error', message: error.message || 'Failed to get video information' });
  }
});

// --- RUTA PARA PROXY DE DESCARGA (MODIFICADA) ---
router.get('/api/tiktok/download', async (req, res) => {
  const { url, filename } = req.query;
  if (!url || !filename) {
      return res.status(400).send('Missing URL or filename');
  }

  let videoResponse;
  try {
      const decodedUrl = decodeURIComponent(url);
      const decodedFilename = decodeURIComponent(filename);

      console.log(`Proxying download for URL: ${decodedUrl}`);
      console.log(`Filename: ${decodedFilename}`);

      videoResponse = await fetch(decodedUrl, {
           headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36',
              'Referer': 'https://www.tiktok.com/'
           }
      });

      if (!videoResponse.ok) {
          const errorBody = await videoResponse.text().catch(() => 'Could not read error body');
          console.error(`Failed to fetch video from source. Status: ${videoResponse.status} ${videoResponse.statusText}. Body: ${errorBody}`);
          throw new Error(`Failed to fetch video from source: ${videoResponse.status} ${videoResponse.statusText}`);
      }

      // Verificar si el cuerpo existe antes de intentar convertirlo
      if (!videoResponse.body) {
           throw new Error("Video source response body is null or undefined.");
      }

      // --- CABECERAS DE RESPUESTA ---
      res.setHeader('Content-Disposition', `attachment; filename="${decodedFilename}"`);
      const contentType = videoResponse.headers.get('content-type');
      res.setHeader('Content-Type', contentType || 'video/mp4');
      const contentLength = videoResponse.headers.get('content-length');
      if (contentLength) {
           res.setHeader('Content-Length', contentLength);
      }

      // --- CONVERSIÓN Y PIPE ---
      const nodeReadableStream = Readable.fromWeb(videoResponse.body);

      // Ahora haz pipe usando el stream de Node.js
      nodeReadableStream.pipe(res);

      // Manejo de errores en el stream *convertido*
      nodeReadableStream.on('error', (streamErr) => {
          console.error('Error piping converted video stream:', streamErr);
          if (!res.headersSent) {
              res.status(500).send('Error streaming video file.');
          } else {
             res.end();
          }
      });
  } catch (error) {
      console.error('Error in /api/tiktok/download:', error);
      if (!res.headersSent) {
          res.status(500).send(`Error processing download request: ${error.message}`);
      } else {
           console.error("Headers already sent, cannot send error status for download failure.");
           res.end();
      }
  }
});

export default router;