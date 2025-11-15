# Sistema de Gestión Técnica

Sistema web para gestión de recepción y entrega de equipos técnicos con generación automática de documentos Excel y envío por correo electrónico.

## Características

- ✅ Formularios de Recepción y Entrega Técnica
- ✅ Captura de firmas digitales
- ✅ Generación automática de documentos Excel
- ✅ Envío de documentos por correo electrónico
- ✅ Soporte para múltiples equipos
- ✅ Adjuntar evidencias fotográficas

## Tecnologías

- **Frontend**: HTML5, Bootstrap 5, JavaScript
- **Backend**: Node.js, Express
- **Librerías**: ExcelJS, xlsx-populate, SignaturePad, Nodemailer

## Instalación Local
```bash
# Clonar repositorio
git clone [tu-repositorio]

# Instalar dependencias
cd server
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Iniciar servidor
npm start
```

## Variables de Entorno
```env
PORT=3000
EMAIL_USER=tu-correo@hotmail.com
EMAIL_PASS=tu-contraseña-de-aplicación
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
```

## Despliegue en Render

1. Conectar repositorio de GitHub
2. Configurar variables de entorno en Render
3. Desplegar automáticamente

## Licencia

MIT