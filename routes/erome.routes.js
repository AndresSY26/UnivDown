import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import ejs from "ejs";
import { getEromeMedia } from "../modules/eromeAPI.js";
import fetch from "node-fetch"; // Import the fetch API

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// ... (your /erome and /erome/fetch routes - no changes needed) ...
router.get("/erome", async (req, res) => {
  // ... (rest of your /erome route, no changes needed here) ...
  try {
    const eromeContent = await ejs.renderFile(path.join(__dirname, "../views", "erome.ejs"), {});
    if (req.query.partial === "true") {
      res.send(eromeContent); // Envía SOLO el contenido renderizado
    } else {
      res.render("index", { content: eromeContent });
    }
  } catch (error) {
    console.error("Error rendering Erome:", error);
    res.status(500).send("Error rendering Erome");
  }
});

router.post("/erome/fetch", async (req, res) => {
  const url = req.body.url;

  if (!url || !url.match(/^https?:\/\/(www|es)\.erome\.com\/a\//)) {
    return res.status(400).json({ error: "Invalid Erome URL" });
  }

  try {
    const media = await getEromeMedia(url);
    res.json(media);
  } catch (error) {
    res.status(500).json({ error: "Error fetching media from Erome" });
  }
});

router.get("/erome/download", async (req, res) => {
  const mediaUrl = req.query.url;
  const filename = req.query.filename;

  if (!mediaUrl || !filename) {
    return res.status(400).send("Media URL and filename are required");
  }

  try {
    // === VERY IMPORTANT: Use the *SAME* headers as your browser. ===
    const headers = {
      Referer: new URL(mediaUrl).origin, // Set a correct refer.  The video's origin
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36", //  Browser User-Agent
    };

    const response = await fetch(mediaUrl, { headers }); // Use headers!!

    if (!response.ok) {
      console.log("Headers received on bad request", response.headers); // Print this in console!
      return res
        .status(response.status)
        .send(`Error fetching media: ${response.statusText}`);
    }

    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`); // Use filename
    const contentType = response.headers.get("content-type");

    if (filename.endsWith(".mp4")) {
      res.setHeader("Content-Type", "video/mp4");
    } else if (filename.endsWith(".png")) {
      res.setHeader("Content-Type", "image/png");
    } else {
      // Just in-case there is not any type on it.
      res.setHeader("Content-Type", contentType || "application/octet-stream");
    }
    response.body.pipe(res);
  } catch (error) {
    console.error("Download error:", error);
    res.status(500).send("Error downloading media");
  }
});

export default router;