import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import ejs from 'ejs';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
router.get('/instagram', async (req, res) => {
  try {
    const instagramContent = await ejs.renderFile(path.join(__dirname, '../views', 'instagram.ejs'), {});
    if (req.query.partial === "true") {
      res.send(instagramContent); // Envía SOLO el contenido renderizado
    } else {
      res.render('index', { content: instagramContent });
    }
  } catch (error) {
    console.error("Error rendering Instagram:", error);
    res.status(500).send("Error rendering Instagram");
  }
});



export default router;