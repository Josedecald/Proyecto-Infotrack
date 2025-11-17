const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { MailtrapClient } = require("mailtrap");
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://tu-dominio.railway.app'] 
    : ['http://localhost:3000', 'http://127.0.0.1:3000']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Multer configuration
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// Verificar variables de entorno
if (!process.env.MAILTRAP_API_KEY || !process.env.MAILTRAP_SENDER) {
  console.error('❌ ERROR: Faltan variables de entorno requeridas');
  console.error('Asegúrate de configurar MAILTRAP_API_KEY y MAILTRAP_SENDER');
  process.exit(1);
}

// Mailtrap client
const client = new MailtrapClient({
  token: process.env.MAILTRAP_API_KEY
});

const sender = {
  name: "Sistema Gestión Técnica",
  email: process.env.MAILTRAP_SENDER
};

// Ruta principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

// Endpoint para enviar correo
app.post('/api/enviar-correo', upload.single('archivo'), async (req, res) => {
  try {
    const { destinatario, asunto, mensaje, nombreArchivo } = req.body;

    // Validaciones
    if (!destinatario || !req.file) {
      return res.status(400).json({
        success: false,
        message: 'Faltan datos requeridos (destinatario y archivo)'
      });
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(destinatario)) {
      return res.status(400).json({
        success: false,
        message: 'Email de destinatario no válido'
      });
    }

    console.log(`📧 Enviando correo a: ${destinatario}`);
    console.log(`📎 Archivo: ${nombreArchivo} (${(req.file.size / 1024).toFixed(2)} KB)`);

    // Enviar email con Mailtrap
    await client.send({
      from: sender,
      to: [{ email: destinatario }],
      subject: asunto || "Documento Técnico",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #333;">Sistema de Gestión Técnica</h2>
          <p>${mensaje || "Se adjunta el documento solicitado."}</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            Este correo fue enviado automáticamente desde el Sistema de Gestión Técnica.
          </p>
        </div>
      `,
      attachments: [{
        filename: nombreArchivo,
        content: req.file.buffer.toString("base64"),
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        disposition: "attachment"
      }]
    });

    console.log('✅ Correo enviado exitosamente');

    res.json({
      success: true,
      message: "Correo enviado exitosamente"
    });

  } catch (error) {
    console.error("❌ Error al enviar correo:", error);
    res.status(500).json({
      success: false,
      message: "Error al enviar el correo: " + error.message
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada', path: req.path });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    success: false, 
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log("=".repeat(60));
  console.log("🚀 Servidor iniciado exitosamente");
  console.log(`📡 Puerto: ${PORT}`);
  console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📧 Email sender: ${process.env.MAILTRAP_SENDER}`);
  console.log("=".repeat(60));
});