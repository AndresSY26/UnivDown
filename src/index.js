import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import routes from "./routes/index.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT) || process.argv[3] || 2600;

app
  .use(express.static(path.join(__dirname, "public")))
  .set("views", path.join(__dirname, "views"))
  .set("view engine", "ejs");

// Agrega esto para manejar solicitudes JSON
app.use(express.json());

// Usa el enrutador maestro
app.use(routes);

app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
}); 