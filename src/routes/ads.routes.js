import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Ruta para servir el archivo ads.txt
router.get('/ads.txt', (req, res) => {
  // Envía el archivo ads.txt que debería estar en la carpeta 'public'
  // Esta es una forma explícita de hacerlo.
  const adsPath = path.join(__dirname, '..', 'ads.txt');
  
  // Opcional: Si el contenido de ads.txt es corto y no cambia,
  // puedes enviarlo directamente como texto para mayor eficiencia.
  // res.type('text/plain');
  // res.send('google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0');
  
  res.sendFile(adsPath, (err) => {
    if (err) {
      console.error("ads.txt not found or error sending file:", err);
      res.status(404).send("Not Found");
    }
  });
});

export default router;
