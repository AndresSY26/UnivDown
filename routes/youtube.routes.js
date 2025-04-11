import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import ejs from 'ejs';

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

export default router;