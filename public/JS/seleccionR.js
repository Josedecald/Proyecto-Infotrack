// seleccionR.js
document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.querySelector('input[type="file"]');
    
    if (fileInput) {
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            
            if (!file) return;
            
            // Validar que sea un archivo Excel
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
            if (btnLabel) {
                const originalHTML = btnLabel.innerHTML;
                btnLabel.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Procesando...';
                btnLabel.style.pointerEvents = 'none';
            }
            
            try {
                // Crear FormData con el archivo
                const formData = new FormData();
                formData.append('file', file);
                
                // Enviar al servidor
                const response = await fetch('/api/procesar-excel', {
                    method: 'POST',
                    body: formData
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `Error del servidor: ${response.status}`);
                }
                
                const result = await response.json();
                
                // Guardar solo el ID en sessionStorage (es pequeño)
                sessionStorage.setItem('excelProcessedId', result.id);
                sessionStorage.setItem('excelData', JSON.stringify(result.data));
                
                // Redirigir
                window.location.href = './post-reparacion.html';
                
            } catch (error) {
                console.error('Error procesando archivo:', error);
                alert('Error al procesar el archivo: ' + error.message);
                fileInput.value = '';
                
                if (btnLabel) {
                    btnLabel.innerHTML = originalHTML;
                    btnLabel.style.pointerEvents = 'auto';
                }
            }
        });
    }
});


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
                // Crear FormData con el archivo
                const formData = new FormData();
                formData.append('file', file);
                
                // Enviar al servidor
                const response = await fetch('/api/procesar-excel', {
                    method: 'POST',
                    body: formData
                });
                
                if (!response.ok) {
                    throw new Error(`Error del servidor: ${response.status}`);
                }
                
                const result = await response.json();
                
                // Guardar solo el ID en sessionStorage (es pequeño)
                sessionStorage.setItem('excelProcessedId', result.id);
                
                // Redirigir
                window.location.href = '../HTML/post-reparacion.html';
                
            } catch (error) {
                console.error('Error procesando archivo:', error);
                alert('Error al procesar el archivo. Por favor intenta de nuevo.');
                fileInput.value = '';
                btnLabel.innerHTML = originalHTML;
                btnLabel.style.pointerEvents = 'auto';
            }
        });
    }
});