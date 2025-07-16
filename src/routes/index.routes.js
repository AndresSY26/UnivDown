import express from 'express';
import homeRoutes from './home.routes.js';
import youtubeRoutes from './youtube.routes.js';
import tiktokRoutes from './tiktok.routes.js';
import instagramRoutes from './instagram.routes.js';
import eromeRoutes from './erome.routes.js';
import InfoRoutes from './info.routes.js';
import adsRoutes from './ads.routes.js'; // 1. Importa la nueva ruta

const router = express.Router();

// Monta todas las rutas
router.use('/', homeRoutes);
router.use('/', youtubeRoutes);
router.use('/', tiktokRoutes);
router.use('/', instagramRoutes);
router.use('/', eromeRoutes);
router.use('/', adsRoutes); // 2. Añade la ruta de ads.txt

// Ruta de informacion
router.use('/', InfoRoutes);

export default router;