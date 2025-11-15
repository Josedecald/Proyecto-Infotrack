const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const multer = require('multer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Configuración de Multer para manejar archivos en memoria
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Configurar transporter de Nodemailer
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true para 465, false para otros puertos
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Verificar conexión al iniciar
transporter.verify((error, success) => {
    if (error) {
        console.error('❌ Error en configuración de correo:', error);
    } else {
        console.log('✅ Servidor de correo listo');
    }
});

// Endpoint para enviar correo
app.post('/api/enviar-correo', upload.single('archivo'), async (req, res) => {
    try {
        const { destinatario, asunto, mensaje, nombreArchivo } = req.body;
        
        // Validaciones
        if (!destinatario || !req.file) {
            return res.status(400).json({
                success: false,
                message: 'Faltan datos requeridos'
            });
        }

        // Validar formato de correo
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(destinatario)) {
            return res.status(400).json({
                success: false,
                message: 'Formato de correo inválido'
            });
        }

        // Configurar email
        const mailOptions = {
            from: `"Sistema Gestión Técnica" <${process.env.EMAIL_USER}>`,
            to: destinatario,
            subject: asunto || 'Documento Técnico',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #0d6efd; padding: 20px; text-align: center;">
                        <h2 style="color: white; margin: 0;">Sistema de Gestión Técnica</h2>
                    </div>
                    <div style="padding: 30px; background-color: #f8f9fa;">
                        <p style="font-size: 16px; color: #333;">
                            ${mensaje || 'Se adjunta el documento solicitado.'}
                        </p>
                        <p style="font-size: 14px; color: #666; margin-top: 20px;">
                            Este correo fue generado automáticamente por el Sistema de Gestión Técnica.
                        </p>
                    </div>
                    <div style="background-color: #e9ecef; padding: 15px; text-align: center; font-size: 12px; color: #666;">
                        © 2025 Sistema de Gestión Técnica
                    </div>
                </div>
            `,
            attachments: [
                {
                    filename: nombreArchivo || 'documento.xlsx',
                    content: req.file.buffer
                }
            ]
        };

        // Enviar correo
        await transporter.sendMail(mailOptions);

        res.json({
            success: true,
            message: 'Correo enviado exitosamente'
        });

    } catch (error) {
        console.error('Error al enviar correo:', error);
        res.status(500).json({
            success: false,
            message: 'Error al enviar el correo: ' + error.message
        });
    }
});

// Endpoint de prueba
app.get('/api/test', (req, res) => {
    res.json({ message: 'Servidor funcionando correctamente' });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});