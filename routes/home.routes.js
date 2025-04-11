import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import ejs from 'ejs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const IndexContent = await ejs.renderFile(path.join(__dirname, '../views', 'home.ejs'), {});
    if (req.query.partial === "true") {
      res.send(IndexContent); // Envía SOLO el contenido renderizado
    } else {
      res.render('index', { content: IndexContent });
    }
  } catch (error) {
    console.error("Error rendering Home:", error);
    res.status(500).send("Error rendering Home");
  }
});

export default router;