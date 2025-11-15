const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Servir archivos estáticos desde la carpeta public
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de Multer
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }
});

// Configurar transporter de Nodemailer
const emailPort = parseInt(process.env.EMAIL_PORT) || 465;
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp-mail.outlook.com',
    port: emailPort,
    secure: emailPort === 465, // true para 465 (SSL), false para 587 (TLS)
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false,
        ciphers: 'SSLv3'
    },
    connectionTimeout: 10000, // 10 segundos
    greetingTimeout: 10000,
    socketTimeout: 10000
});

// Verificar conexión
transporter.verify((error, success) => {
    if (error) {
        console.error('❌ Error en configuración de correo:', error);
        console.log('⚠️  Verifica EMAIL_USER y EMAIL_PASS en variables de entorno');
    } else {
        console.log('✅ Servidor de correo configurado correctamente');
    }
});

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Endpoint para enviar correo
app.post('/api/enviar-correo', upload.single('archivo'), async (req, res) => {
    try {
        const { destinatario, asunto, mensaje, nombreArchivo } = req.body;
        
        if (!destinatario || !req.file) {
            return res.status(400).json({
                success: false,
                message: 'Faltan datos requeridos (destinatario y archivo)'
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(destinatario)) {
            return res.status(400).json({
                success: false,
                message: 'Formato de correo inválido'
            });
        }

        console.log(`📧 Enviando correo a: ${destinatario}`);
        console.log(`📎 Archivo: ${nombreArchivo} (${(req.file.size / 1024).toFixed(2)} KB)`);

        const mailOptions = {
            from: `"Sistema Gestión Técnica" <${process.env.EMAIL_USER}>`,
            to: destinatario,
            subject: asunto || 'Documento Técnico',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #0d6efd; padding: 20px; text-align: center;">
                        <h2 style="color: white; margin: 0;">📋 Sistema de Gestión Técnica</h2>
                    </div>
                    <div style="padding: 30px; background-color: #f8f9fa;">
                        <p style="font-size: 16px; color: #333;">
                            ${mensaje || 'Se adjunta el documento solicitado.'}
                        </p>
                        <div style="margin-top: 20px; padding: 15px; background-color: white; border-left: 4px solid #0d6efd; border-radius: 4px;">
                            <p style="margin: 0; color: #666;">
                                <strong>📎 Archivo adjunto:</strong><br>
                                ${nombreArchivo || 'documento.xlsx'}
                            </p>
                        </div>
                        <p style="font-size: 14px; color: #666; margin-top: 25px;">
                            Este correo fue generado automáticamente por el Sistema de Gestión Técnica.
                        </p>
                    </div>
                    <div style="background-color: #e9ecef; padding: 15px; text-align: center; font-size: 12px; color: #666;">
                        © ${new Date().getFullYear()} Sistema de Gestión Técnica
                    </div>
                </div>
            `,
            attachments: [
                {
                    filename: nombreArchivo || 'documento.xlsx',
                    content: req.file.buffer,
                    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                }
            ]
        };

        const info = await transporter.sendMail(mailOptions);
        
        console.log('✅ Correo enviado exitosamente. Message ID:', info.messageId);

        res.json({
            success: true,
            message: 'Correo enviado exitosamente',
            messageId: info.messageId
        });

    } catch (error) {
        console.error('❌ Error al enviar correo:', error);
        res.status(500).json({
            success: false,
            message: 'Error al enviar el correo: ' + error.message
        });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok',
        timestamp: new Date().toISOString(),
        emailConfigured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS),
        emailUser: process.env.EMAIL_USER ? process.env.EMAIL_USER.replace(/(.{3}).*(@.*)/, '$1***$2') : 'NO CONFIGURADO'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        error: 'Ruta no encontrada',
        path: req.path 
    });
});

// Error handler
app.use((error, req, res, next) => {
    console.error('❌ Error del servidor:', error);
    res.status(500).json({ 
        error: 'Error interno del servidor',
        message: error.message 
    });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log('='.repeat(60));
    console.log('🚀 Servidor iniciado exitosamente');
    console.log(`📡 Puerto: ${PORT}`);
    console.log(`📧 Email: ${process.env.EMAIL_USER || '⚠️  NO CONFIGURADO'}`);
    console.log(`🌐 Entorno: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📁 Sirviendo archivos desde: ${path.join(__dirname, 'public')}`);
    console.log('='.repeat(60));
});

// Manejo de errores
process.on('unhandledRejection', (error) => {
    console.error('❌ Promise rechazada:', error);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Excepción no capturada:', error);
    process.exit(1);
});