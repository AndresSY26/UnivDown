import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import ejs from 'ejs';
import { Readable } from 'stream';

import { getVideoDetails } from '../modules/youtubeAPI.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

router.get('/youtube', async (req, res) => {
  try {
    const youtubeContent = await ejs.renderFile(path.join(__dirname, '../views', 'youtube.ejs'), {});
    if (req.query.partial === "true") {
      res.send(youtubeContent); // Envía SOLO el contenido renderizado
    } else {
      res.render('index', { content: youtubeContent });
    }
  } catch (error) {
    console.error("Error rendering YouTube:", error);
    res.status(500).send("Error rendering YouTube");
  }
});

// --- NEW API ROUTE ---
router.post('/api/youtube/details', async (req, res) => {
  const { url } = req.body;

  // Validación básica de entrada
  if (!url) {
    return res.status(400).json({ success: false, message: 'URL is required.' });
  }

  try {
    // Llama a tu servicio que usa ytdl.getInfo()
    const details = await getVideoDetails(url);
    res.json({ success: true, data: details });
  } catch (error) {
    console.error("API Error fetching YouTube details:", error);
    // Devuelve el mensaje de error específico si está disponible
    res.status(400).json({ success: false, message: error.message || 'Failed to get video information.' });
  }
});

// === RUTA API PARA PROXY DE DESCARGA (MODIFICADA) ===
// Usa streaming directo con ytdl-core
router.get('/api/youtube/download', async (req, res) => {
  const { videoUrl, itag, filename } = req.query;

  // 1. Validación robusta de los parámetros necesarios
  if (!videoUrl || !itag || !filename) {
      console.error('Download request missing parameters:', { videoUrl, itag, filename });
      return res.status(400).send('Missing required parameters: videoUrl, itag, filename.');
  }

  let decodedVideoUrl;
  let decodedFilename;
  let numericItag;

  try {
    // Decodificar parámetros (filename es el más importante)
    decodedVideoUrl = decodeURIComponent(videoUrl); // A menudo no necesita decodificación, pero seguro hacerlo
    decodedFilename = decodeURIComponent(filename);
    numericItag = parseInt(itag, 10); // Convertir itag a número para la comparación

    if (isNaN(numericItag)) {
        throw new Error('Invalid itag provided.');
    }

    // Validar la URL de YouTube de nuevo aquí
    if (!ytdl.validateURL(decodedVideoUrl)) {
       throw new Error('Invalid YouTube video URL provided for download.');
    }

  } catch (decodeError) {
       console.error('Error decoding parameters:', decodeError);
       return res.status(400).send(`Error decoding parameters: ${decodeError.message}`);
  }

  console.log(`Attempting download: URL=${decodedVideoUrl}, itag=${numericItag}, Filename=${decodedFilename}`);

  try {
    // 2. Configurar cabeceras de respuesta para la descarga
    res.setHeader('Content-Disposition', `attachment; filename="${decodedFilename}"`);

    // Determinar Content-Type basado en la extensión del nombre de archivo (más fiable)
    let contentType = 'application/octet-stream'; // Default seguro
    const lowerFilename = decodedFilename.toLowerCase();
    if (lowerFilename.endsWith('.mp4')) {
        contentType = 'video/mp4';
    } else if (lowerFilename.endsWith('.mp3')) {
        // Aunque la fuente sea M4A(AAC), si el cliente pide MP3, usa el tipo MIME de MP3
        contentType = 'audio/mpeg';
    } else if (lowerFilename.endsWith('.m4a')) {
        contentType = 'audio/mp4'; // M4A usa contenedor MP4
    } else if (lowerFilename.endsWith('.webm')) {
        contentType = 'video/webm'; // O podría ser audio/webm si solo es audio
    } // Añadir más tipos si es necesario ('.ogg', '.flv', etc.)
    res.setHeader('Content-Type', contentType);
    console.log(`Setting Content-Type: ${contentType}`);

    // Opcional: Intentar obtener Content-Length puede añadir latencia y fallar.
    // Omitiéndolo por simplicidad y robustez inicial.
    // El navegador podría no mostrar el progreso total, pero la descarga funcionará.
    console.warn("Content-Length header is omitted for faster response start.");

    // 3. Obtener el stream directamente desde ytdl-core
    const stream = ytdl(decodedVideoUrl, {
      // Usa filter para asegurar que se obtiene el formato correcto
      filter: format => format.itag === numericItag,
      // Opcionalmente: Ajustar el buffer. Puede o no mejorar. Probar si hay problemas.
      // highWaterMark: 1024 * 1024 * 10, // Ejemplo: Buffer de 10MB
    });

    // 4. Manejar errores del stream y del cliente
    stream.on('error', (streamErr) => {
        console.error(`*** ytdl Stream Error (itag: ${numericItag}):`, streamErr.message);
        if (!res.headersSent) {
            // Si aún no hemos enviado datos, podemos enviar un estado de error
            res.status(500).send(`Error streaming data: ${streamErr.message}`);
        } else {
            // Si ya se enviaron cabeceras, la conexión probablemente se cortará.
            // Solo podemos intentar terminarla y registrar el error.
            console.warn("Stream error occurred after headers were sent. Ending response.");
            res.end();
        }
    });

    stream.on('end', () => {
        console.log(`Finished streaming itag ${numericItag} for ${decodedFilename}.`);
        // La respuesta (`res`) finaliza automáticamente cuando el `stream` finaliza y se ha hecho `pipe`.
    });

    req.on('close', () => {
      console.warn(`Client connection closed prematurely for itag ${numericItag}. Destroying stream.`);
      stream.destroy(); // Detiene el stream de ytdl para liberar recursos
    });

    // 5. ¡Iniciar el flujo! Enviar el stream al cliente.
    stream.pipe(res);

  } catch (error) {
    // Captura errores que ocurren *antes* de que el stream comience a enviarse
    // (p.ej., error al llamar a ytdl(), error al decodificar, URL inválida)
    console.error(`Error processing download request for itag ${numericItag}:`, error);
    if (!res.headersSent) {
        res.status(500).send(`Server error processing download request: ${error.message}`);
    } else {
        // Poco probable llegar aquí si el error es antes del pipe, pero por si acaso.
        console.error("Unexpected error occurred after headers potentially sent but before stream end.");
        res.end();
    }
  }
});

export default router;