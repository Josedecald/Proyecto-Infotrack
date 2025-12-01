// seleccionR.js - Manejo unificado de carga de archivos Excel

document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInputExcel');
    
    if (fileInput) {
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            
            if (!file) return;
            
            // Validar extensión
            const validExtensions = ['.xlsx', '.xls'];
            const fileName = file.name.toLowerCase();
            const isValidExcel = validExtensions.some(ext => fileName.endsWith(ext));
            
            if (!isValidExcel) {
                alert('Por favor selecciona un archivo Excel válido (.xlsx o .xls)');
                fileInput.value = '';
                return;
            }
            
            // Mostrar indicador de carga
            const btnLabel = document.getElementById('btnSubirArchivo');
            const originalHTML = btnLabel.innerHTML;
            btnLabel.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Procesando...';
            btnLabel.style.pointerEvents = 'none';
            
            try {
                // Convertir a base64
                const base64 = await fileToBase64(file);
                
                console.log('✅ Archivo convertido a base64, tamaño:', base64.length);
                
                // Guardar en sessionStorage
                sessionStorage.setItem('excelFileData', base64);
                sessionStorage.setItem('excelFileName', file.name);
                
                console.log('✅ Datos guardados en sessionStorage');
                
                // Redirigir
                window.location.href = '../HTML/post-reparacion.html';
                
            } catch (error) {
                console.error('❌ Error procesando archivo:', error);
                alert('Error al procesar el archivo. Por favor intenta de nuevo.');
                fileInput.value = '';
                btnLabel.innerHTML = originalHTML;
                btnLabel.style.pointerEvents = 'auto';
            }
        });
    }
    
    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result;
                console.log('📄 Archivo leído, tipo:', file.type, 'tamaño:', file.size);
                resolve(result);
            };
            reader.onerror = () => {
                console.error('❌ Error leyendo archivo:', reader.error);
                reject(reader.error);
            };
            reader.readAsDataURL(file);
        });
    }
});