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

// Función para generar el HTML del correo estilizado
function generarEmailHTML(mensaje, nombreArchivo, tipoDocumento) {
  const fecha = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const esRecepcion = nombreArchivo.toLowerCase().includes('recepcion');
  const colorPrincipal = esRecepcion ? '#0d6efd' : '#198754';
  const iconoDocumento = esRecepcion ? '📥' : '📤';
  const tituloDocumento = esRecepcion ? 'Recepción Técnica' : 'Entrega Técnica';

  return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Documento Técnico</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f8f9fa;
            padding: 20px;
            line-height: 1.6;
        }
        .container {
            max-width: 900px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, ${colorPrincipal} 0%, ${colorPrincipal}dd 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        .header-icon {
            font-size: 48px;
            margin-bottom: 10px;
            display: block;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
        }
        .header p {
            margin: 8px 0 0;
            opacity: 0.9;
            font-size: 14px;
        }
        .content {
            padding: 40px 30px;
        }
        .greeting {
            font-size: 18px;
            color: #212529;
            margin-bottom: 20px;
            font-weight: 500;
        }
        .message {
            color: #495057;
            font-size: 15px;
            margin-bottom: 25px;
            line-height: 1.8;
        }
        .document-info {
            background-color: #f8f9fa;
            border-left: 4px solid ${colorPrincipal};
            padding: 20px;
            margin: 25px 0;
            border-radius: 4px;
        }
        .document-info-title {
            color: ${colorPrincipal};
            font-weight: 600;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .document-details {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        .document-detail {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #495057;
            font-size: 14px;
        }
        .document-detail-icon {
            color: ${colorPrincipal};
            font-weight: bold;
        }
        .cta-button {
            display: inline-block;
            background-color: ${colorPrincipal};
            color: white;
            padding: 14px 32px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            font-size: 15px;
            margin: 20px 0;
            transition: background-color 0.3s ease;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .cta-button:hover {
            background-color: ${colorPrincipal}dd;
        }
        .info-box {
            background-color: #e7f3ff;
            border: 1px solid #b6d4fe;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            display: flex;
            gap: 12px;
            align-items: flex-start;
        }
        .info-box-icon {
            color: #0d6efd;
            font-size: 20px;
            flex-shrink: 0;
        }
        .info-box-text {
            color: #084298;
            font-size: 13px;
            line-height: 1.6;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 25px 30px;
            text-align: center;
            border-top: 1px solid #dee2e6;
        }
        .footer-text {
            color: #6c757d;
            font-size: 13px;
            margin-bottom: 8px;
        }
        .footer-date {
            color: #adb5bd;
            font-size: 12px;
        }
        .divider {
            height: 1px;
            background-color: #dee2e6;
            margin: 25px 0;
        }
        .signature {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #e9ecef;
        }
        .signature-line {
            color: #495057;
            font-size: 14px;
            margin-bottom: 5px;
        }
        .signature-name {
            color: ${colorPrincipal};
            font-weight: 600;
            font-size: 16px;
        }
        @media only screen and (max-width: 600px) {
            body {
                padding: 10px;
            }
            .content {
                padding: 25px 20px;
            }
            .header h1 {
                font-size: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <span class="header-icon">${iconoDocumento}</span>
            <h1>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 11l3 3L22 4"></path>
                    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"></path>
                </svg>
                ${tituloDocumento}
            </h1>
            <p>Sistema de Gestión Técnica</p>
        </div>

        <!-- Content -->
        <div class="content">
            <div class="greeting">¡Hola!</div>
            
            <div class="message">
                ${mensaje || 'Se adjunta el documento técnico solicitado. Por favor, revísalo y guárdalo para tus registros.'}
            </div>

            <!-- Document Info Box -->
            <div class="document-info">
                <div class="document-info-title">
                    📄 Información del Documento
                </div>
                <div class="document-details">
                    <div class="document-detail">
                        <span class="document-detail-icon">📎</span>
                        <strong>Archivo:</strong> ${nombreArchivo}
                    </div>
                    <div class="document-detail">
                        <span class="document-detail-icon">📋</span>
                        <strong>Tipo:</strong> ${tituloDocumento}
                    </div>
                    <div class="document-detail">
                        <span class="document-detail-icon">📅</span>
                        <strong>Fecha de envío:</strong> ${fecha}
                    </div>
                </div>
            </div>

            <!-- Info Box -->
            <div class="info-box">
                <div class="info-box-icon">ℹ️</div>
                <div class="info-box-text">
                    El documento adjunto está en formato Excel (.xlsx). 
                    Puedes abrirlo con Microsoft Excel, Google Sheets o cualquier programa compatible.
                </div>
            </div>

            <div class="divider"></div>

            <!-- Signature -->
            <div class="signature">
                <div class="signature-line">Atentamente,</div>
                <div class="signature-name">Sistema de Gestión Técnica</div>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <div class="footer-text">
                © 2025 Sistema de Gestión Técnica. Todos los derechos reservados.
            </div>
            <div class="footer-date">
                Este correo fue generado automáticamente el ${fecha}
            </div>
        </div>
    </div>
</body>
</html>
  `;
}

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

    // Generar HTML estilizado
    const htmlContent = generarEmailHTML(mensaje, nombreArchivo);

    // Enviar email con Mailtrap
    await client.send({
      from: sender,
      to: [{ email: destinatario }],
      subject: asunto || `Documento Técnico - ${nombreArchivo}`,
      html: htmlContent,
      category: 'technical_document',
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