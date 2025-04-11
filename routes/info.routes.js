import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import ejs from "ejs";
import nodemailer from "nodemailer";
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configuración del transporter de Nodemailer (¡Usa variables de entorno!)
const transporter = nodemailer.createTransport({
  service: 'gmail', // O usa SMTP directamente si prefieres otro servicio
  auth: {
    user: process.env.GMAIL_USER,      // Tu correo de envío
    pass: process.env.GMAIL_APP_PASS   // Tu contraseña de aplicación
  },
  tls: {
      rejectUnauthorized: false // A veces necesario con Gmail localmente, revisa si lo necesitas en producción
  }
});

// Ruta para la página de contactenos
router.get("/contact", async (req, res) => {
  try {
    const IndexContent = await ejs.renderFile(path.join(__dirname, "../views/pages", "contact.ejs"),{});
    if (req.query.partial === "true") {
      res.send(IndexContent); // Envía SOLO el contenido renderizado
    } else {
      res.render("index", { content: IndexContent });
    }
  } catch (error) {
    console.error("Error rendering Home:", error);
    res.status(500).send("Error rendering Home");
  }
});

router.post("/api/contact", async (req, res) => {
  const { name, email, subject, message } = req.body;

  // Validación
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ success: false, message: "Por favor, completa todos los campos." });
  }

  // ============ INICIO DE CAMBIOS EN mailOptions ============
  const mailOptions = {
    // CAMBIO 1: Nombre específico + Nombre del Usuario en el campo "From" (Gmail podría sobrescribirlo)
    from: `"Formulario UnivDown - ${name}" <${process.env.GMAIL_USER}>`,
    replyTo: email,
    to: process.env.EMAIL_TO,

    // CAMBIO 2: Asunto = Solo lo que el usuario puso en el input 'subject'
    subject: subject,

    // CAMBIO 3: Cuerpo del mensaje (sin cambios en la estructura, pero ajustamos el título HTML opcionalmente)
    text: `Nuevo mensaje del formulario de contacto:\n\nNombre: ${name}\nCorreo: ${email}\nAsunto: ${subject}\nMensaje:\n${message}`,
    html: `
      <!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Mensaje de Contacto</title>
<style>
  body { 
    font-family: Arial, sans-serif; 
    margin: 0; 
    padding: 0; 
    background-color: #f4f4f7;
  }
  /* CAMBIO: Color de enlace principal actualizado */
  a { 
    color: #8400ff;
    text-decoration: none;
  }
  .content p {
    margin: 0 0 10px 0;
  }
  .content strong {
    color: #333333;
  }
</style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f7; font-family: Arial, sans-serif;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f4f4f7;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table width="600" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 30px 40px; font-size: 16px; line-height: 1.7; color: #555555;" class="content">

              <h1 style="font-size: 24px; color: #333333; margin: 0 0 25px 0; font-weight: 500;">Mensaje del Formulario de Contacto</h1>

              <p style="margin-bottom: 12px;">
                <strong style="display: inline-block; min-width: 140px; color: #333333;">Nombre:</strong> ${name}
              </p>
              <p style="margin-bottom: 12px;">
                <strong style="display: inline-block; min-width: 140px; color: #333333;">Correo Electrónico:</strong>
                <!-- CAMBIO: Color de enlace inline actualizado -->
                <a href="mailto:${email}" style="color: #8400ff; text-decoration: none;">${email}</a>
              </p>

              <hr style="border: none; border-top: 1px solid #eeeeee; margin: 20px 0;">

              <p style="margin-bottom: 5px;">
                <strong style="color: #333333;">Mensaje Recibido:</strong>
              </p>
              <!-- CAMBIO: Color del borde lateral izquierdo actualizado -->
              <p style="margin-top: 0; padding: 15px; background-color: #f9f9f9; border-left: 3px solid #8400ff; border-radius: 4px;">
                ${message.replace(/\n/g, '<br>')}
              </p>

              <p style="margin-top: 30px; font-size: 12px; text-align: center; color: #888888;">
                Correo enviado desde el formulario de contacto de UnivDown.
              </p>

            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  };

  try {
    // Enviar el correo
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
    res.json({ success: true, message: "Message sent successfully. Thank you!" });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ success: false, message: "Error sending message. Please try again later." });
  }
});

// Ruta para la página de acerca de nosotros
router.get("/about", async (req, res) => {
  try {
    const IndexContent = await ejs.renderFile(path.join(__dirname, "../views/pages", "about.ejs"),{});
    if (req.query.partial === "true") {
      res.send(IndexContent); // Envía SOLO el contenido renderizado
    } else {
      res.render("index", { content: IndexContent });
    }
  } catch (error) {
    console.error("Error rendering Home:", error);
    res.status(500).send("Error rendering Home");
  }
});

// Ruta para la página de contactenos
router.get("/faq", async (req, res) => {
  try {
    const IndexContent = await ejs.renderFile(path.join(__dirname, "../views/pages", "faq.ejs"),{});
    if (req.query.partial === "true") {
      res.send(IndexContent); // Envía SOLO el contenido renderizado
    } else {
      res.render("index", { content: IndexContent });
    }
  } catch (error) {
    console.error("Error rendering Home:", error);
    res.status(500).send("Error rendering Home");
  }
});

// Ruta para la página de acerca de nosotros
router.get("/terms-use", async (req, res) => {
  try {
    const IndexContent = await ejs.renderFile(path.join(__dirname, "../views/pages", "terms-use.ejs"),{});
    if (req.query.partial === "true") {
      res.send(IndexContent); // Envía SOLO el contenido renderizado
    } else {
      res.render("index", { content: IndexContent });
    }
  } catch (error) {
    console.error("Error rendering Home:", error);
    res.status(500).send("Error rendering Home");
  }
});

// Ruta para la página de acerca de nosotros
router.get("/disclaimer", async (req, res) => {
  try {
    const IndexContent = await ejs.renderFile(path.join(__dirname, "../views/pages", "disclaimer.ejs"),{});
    if (req.query.partial === "true") {
      res.send(IndexContent); // Envía SOLO el contenido renderizado
    } else {
      res.render("index", { content: IndexContent });
    }
  } catch (error) {
    console.error("Error rendering Home:", error);
    res.status(500).send("Error rendering Home");
  }
});

export default router;