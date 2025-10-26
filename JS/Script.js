
function checkFileCount() {
    const fileInput = document.getElementById('evidencias');
    const files = fileInput.files;
    if (files.length > 4) {
        alert('Solo se permiten 4 archivos como máximo.');
        fileInput.value = '';
        return false;
    }
    return true;
}


document.getElementById('evidencias').addEventListener('change', checkFileCount);


document.getElementById("btnGenerar").addEventListener("click", async () => {
    try {
        if (!checkFileCount()) {
            return;
        }

        const response = await fetch("Referencia.xlsx");
        const arrayBuffer = await response.arrayBuffer();
        
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(arrayBuffer);
        
        const worksheet = workbook.getWorksheet(1);

        const datos = {
            fecha: document.getElementById("fecha").value,
            nombre: document.getElementById("nombre").value,
            cedula: document.getElementById("cedula").value,
            cliente: document.getElementById("cliente").value,
            idCliente: document.getElementById("idCliente").value,
            ubicacion: document.getElementById("ubicacion").value,
            serial: document.getElementById("serial").value,
            modelo: document.getElementById("modelo").value,
            problema: document.getElementById("problema").value,
            observaciones: document.getElementById("observaciones").value,
            estados: {
                lapiz: document.getElementById("lapiz").value,
                cuerdaLapiz: document.getElementById("cuerdaLapiz").value,
                correaMano: document.getElementById("correaMano").value,
                tecladoNumerico: document.getElementById("tecladoNumerico").value,
                tecladoCompleto: document.getElementById("tecladoCompleto").value,
                pantalla: document.getElementById("pantalla").value,
                protectorPantalla: document.getElementById("protectorPantalla").value,
                bateria: document.getElementById("bateria").value,
                tapaBateria: document.getElementById("tapaBateria").value,
                tarjetaAlm: document.getElementById("tarjetaAlm").value,
                cubiertaTarjeta: document.getElementById("cubiertaTarjeta").value,
                cristalLector: document.getElementById("cristalLector").value,
                carcazaSuperior: document.getElementById("carcazaSuperior").value,
                carcazaInferior: document.getElementById("carcazaInferior").value,
                simCard: document.getElementById("simCard").value,
            },
        };

        // Asignar valores preservando formato
        worksheet.getCell('C3').value = datos.cliente;
        worksheet.getCell('L3').value = datos.fecha;
        worksheet.getCell('V3').value = datos.ubicacion;
        worksheet.getCell('B7').value = datos.idCliente;
        worksheet.getCell('C7').value = datos.serial;
        worksheet.getCell('D7').value = datos.modelo;
        worksheet.getCell('T7').value = datos.problema;
        worksheet.getCell('Q14').value = datos.observaciones;
        worksheet.getCell('B16').value = datos.nombre;
        worksheet.getCell('B18').value = datos.cedula;

        // Estados de componentes
        const celdasEstados = ['E7','F7','G7','H7','I7','J7','K7','L7','M7','N7','O7','P7','Q7','R7','S7'];
        Object.values(datos.estados).forEach((valor, index) => {
            if (celdasEstados[index]) {
                worksheet.getCell(celdasEstados[index]).value = valor;
            }
        });

  
        // ✅ CORREGIDO: PROCESAR IMÁGENES EN SEGUNDA HOJA
        let fotoWorksheet = workbook.getWorksheet('FOTOS');
        
        // Si existe la hoja FOTOS, eliminarla y crear una nueva
        if (fotoWorksheet) {
            workbook.removeWorksheet('FOTOS');
        }
        // Crear nueva hoja FOTOS
        fotoWorksheet = workbook.addWorksheet('FOTOS');

        const inputEvidencias = document.getElementById('evidencias');
        if (inputEvidencias.files.length > 0) {
            // ✅ CORREGIDO: Pasar workbook como parámetro
            await procesarImagenes(inputEvidencias.files, fotoWorksheet, workbook);
        } else {
            fotoWorksheet.getCell('A1').value = 'No hay evidencias fotográficas';
        }

                // Generar y descargar
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { 
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });

        Swal.fire({
        title: "¡RECUERDA!",
        text: "Revisa y confirma siempre la información diligenciada en el documento antes de generarlo.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#63be7b",
        cancelButtonColor: "#454545ff",
        cancelButtonText: "Revisar info",
        confirmButtonText: "Generar Excel"
        }).then((result) => {
        const nombreBase = `Recepcion_${datos.cliente}_${datos.modelo}_SN_${datos.serial}_${datos.fecha}_${datos.ubicacion}`;

        if (result.isConfirmed) {
            // ✅ Descargar Excel
            saveAs(blob, `${nombreBase}.xlsx`);
            Swal.fire("¡RECUERDA FIRMAR EL DOCUMENTO!", "", "info");
        }
        }); 

    } catch (error) {
        console.error('Error:', error);
        alert('Error generando el archivo');
    }
});



// ✅ CORREGIDO: FUNCIÓN PARA PROCESAR IMÁGENES (agregar workbook como parámetro)
async function procesarImagenes(archivos, worksheet, workbook) {
    // Configurar columnas
    worksheet.columns = [
        { width: 25 }, { width: 25 }, { width: 25 }, { width: 25 }
    ];
    
    // Título
    worksheet.getCell('A1').value = 'EVIDENCIAS FOTOGRÁFICAS';
    worksheet.mergeCells('A1:D1');
    worksheet.getCell('A1').font = { bold: true, size: 14 };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };

    let filaActual = 3;
    let columnaActual = 1;

    for (let i = 0; i < archivos.length; i++) {
        const archivo = archivos[i];
        
        if (archivo.type.startsWith('image/')) {
            try {
                const base64 = await archivoToBase64(archivo);
                
                // ✅ CORREGIDO: workbook ahora está disponible como parámetro
                const imagenId = workbook.addImage({
                    base64: base64,
                    extension: archivo.type.split('/')[1]
                });

                worksheet.addImage(imagenId, {
                    tl: { col: columnaActual - 1, row: filaActual - 1 },
                    br: { col: columnaActual, row: filaActual + 20 }
                });

                const celdaNombre = worksheet.getCell(filaActual + 5, columnaActual);
                celdaNombre.font = { size: 9 };
                celdaNombre.alignment = { horizontal: 'center' };

                columnaActual++;


            } catch (error) {
                console.error(`Error procesando imagen ${archivo.name}:`, error);
                
                const celdaError = worksheet.getCell(filaActual, columnaActual);
                celdaError.value = `Error: ${archivo.name}`;
                celdaError.font = { color: { argb: 'FFFF0000' }, size: 9 };
                
                columnaActual++;
                if (columnaActual > 4) {
                    columnaActual = 1;
                    filaActual += 3;
                }
            }
        }
    }

    // Ajustar alturas de fila
    for (let i = 2; i < filaActual + 10; i++) {
        const row = worksheet.getRow(i);
        if (row) {
            row.height = 25;
        }
    }
}

// ✅ FUNCIÓN PARA CONVERTIR A BASE64
function archivoToBase64(archivo) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(archivo);
    });
}