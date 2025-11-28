// =====================
// SISTEMA DE REPARACIÓN TÉCNICA
// =====================
class SistemaReparacion {
    constructor() {
        this.contadorRepuestos = 0;
        this.MAX_REPUESTOS = 10;
        this.MAX_FOTOS = 2;
        
        // Para envío de correo
        this.archivoGenerado = null;
        this.nombreArchivoGenerado = null;
        this.repuestoAEliminar = null;
        
        this.API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:3000/api' 
            : '/api';
        
        console.log('🔧 API URL configurada:', this.API_URL);
        
        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.inicializar());
        } else {
            this.inicializar();
        }
    }

    inicializar() {
        this.inicializarModales();
        this.inicializarEventListeners();
    }

    // =====================
    // INICIALIZACIÓN
    // =====================
    inicializarModales() {
        const modalAlertElement = document.getElementById('modalAlerta');
        const modalConfirmarEliminarElement = document.getElementById('modalConfirmarEliminar');
        
        if (modalAlertElement) {
            try {
                this.modalAlert = new bootstrap.Modal(modalAlertElement);
            } catch (error) {
                console.error('Error inicializando modal de alerta:', error);
            }
        }
        
        if (modalConfirmarEliminarElement) {
            try {
                this.modalConfirmarEliminar = new bootstrap.Modal(modalConfirmarEliminarElement);
            } catch (error) {
                console.error('Error inicializando modal de confirmación:', error);
            }
        }
        
        this.modalAlertTitle = document.getElementById('modalAlertaTitle');
        this.modalAlertBody = document.getElementById('modalAlertaBody');
    }

    inicializarEventListeners() {
        // Formulario
        const form = document.getElementById('formularioReparacion');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
            
            // Escuchar evento personalizado cuando todo está validado
            form.addEventListener('formularioValidado', () => {
                this.mostrarModalAccion();
            });
        }

        // Botón agregar repuesto
        const btnAgregar = document.getElementById('agregarRepuesto');
        if (btnAgregar) {
            btnAgregar.addEventListener('click', () => this.agregarRepuesto());
        }

        // Validación de archivos
        const evidencias = document.getElementById('evidenciaFotografica');
        if (evidencias) {
            evidencias.addEventListener('change', (e) => {
                if (e.target.files.length > 2) {
                    this.mostrarAlerta('Máximo 2 fotografías', 'Solo puedes seleccionar 2 imágenes.');
                    e.target.value = '';
                    return false;
                }
                return this.validarArchivos();
            });
        }

        // Eventos para envío de correo
        const btnConfirmarEnvio = document.getElementById('btnConfirmarEnvio');
        if (btnConfirmarEnvio) {
            btnConfirmarEnvio.addEventListener('click', () => this.enviarCorreo());
        }

        // Validación en tiempo real del correo
        const correoInput = document.getElementById('correoDestinatario');
        if (correoInput) {
            correoInput.addEventListener('input', (e) => {
                this.validarCorreoInput(e.target);
            });
        }

        // Confirmar eliminación de repuesto
        const btnConfirmarEliminar = document.getElementById('btnConfirmarEliminar');
        if (btnConfirmarEliminar) {
            btnConfirmarEliminar.addEventListener('click', () => this.eliminarRepuestoConfirmado());
        }
        

        // Delegación de eventos para eliminar repuestos
        document.addEventListener('click', (e) => {
            if (e.target.closest('.eliminar-repuesto')) {
                const repuestoItem = e.target.closest('.repuesto-item');
                if (repuestoItem) {
                    this.repuestoAEliminar = repuestoItem;
                    this.mostrarModalConfirmarEliminar();
                }
            }
        });
    }

    // =====================
    // MANEJO DE REPUESTOS
    // =====================
agregarRepuesto() {
    if (this.contadorRepuestos >= this.MAX_REPUESTOS) {
        this.mostrarAlerta('¡Máximo 10 repuestos!', 'No puedes agregar más repuestos.');
        return;
    }

    const container = document.getElementById('repuestosContainer');
    if (!container) return;

    this.contadorRepuestos++;

    const repuestoHTML = `
        <div class="accordion mb-3 repuesto-item" id="repuestoAccordion${this.contadorRepuestos}">
            <div class="accordion-item">
                <h2 class="accordion-header">
                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#repuestoCollapse${this.contadorRepuestos}" aria-expanded="false" aria-controls="repuestoCollapse${this.contadorRepuestos}">
                        <span class="fw-bold">Repuesto ${this.contadorRepuestos}</span>
                    </button>
                </h2>
                <div id="repuestoCollapse${this.contadorRepuestos}" class="accordion-collapse collapse" data-bs-parent="#repuestoAccordion${this.contadorRepuestos}">
                    <div class="accordion-body">
                        <div class="row g-3">
                            <div class="col-md-4">
                                <label class="form-label">Código de Repuesto*</label>
                                <input type="text" class="form-control codigo-repuesto" data-original-required="true">
                            </div>
                            <div class="col-md-8">
                                <label class="form-label">Descripción*</label>
                                <input type="text" class="form-control descripcion-repuesto" data-original-required="true">
                            </div>
                            <div class="col-12">
                                <label class="form-label fw-bold">Tipo de Cambio*</label>
                                <div class="btn-group w-100" role="group">
                                    <input type="radio" class="btn-check tipo-cambio" name="tipo_${this.contadorRepuestos}" id="uso_${this.contadorRepuestos}" value="uso" data-original-required="true">
                                    <label class="btn btn-outline-info" for="uso_${this.contadorRepuestos}">Uso</label>
                                    
                                    <input type="radio" class="btn-check tipo-cambio" name="tipo_${this.contadorRepuestos}" id="abuso_${this.contadorRepuestos}" value="abuso" data-original-required="true">
                                    <label class="btn btn-outline-warning" for="abuso_${this.contadorRepuestos}">Abuso</label>
                                    
                                    <input type="radio" class="btn-check tipo-cambio" name="tipo_${this.contadorRepuestos}" id="garantia_${this.contadorRepuestos}" value="garantia" data-original-required="true">
                                    <label class="btn btn-outline-success" for="garantia_${this.contadorRepuestos}">Garantía</label>
                                </div>
                            </div>
                            <div class="col-12 text-end">
                                <button type="button" class="btn btn-outline-danger btn-sm eliminar-repuesto">
                                    <i class="bi bi-trash3 me-1"></i>Eliminar Repuesto
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', repuestoHTML);
}

    mostrarModalConfirmarEliminar() {
        if (this.modalConfirmarEliminar) {
            this.modalConfirmarEliminar.show();
        }
    }

    eliminarRepuestoConfirmado() {
        if (this.repuestoAEliminar) {
            this.repuestoAEliminar.remove();
            this.contadorRepuestos--;
            this.repuestoAEliminar = null;
        }
        
        if (this.modalConfirmarEliminar) {
            this.modalConfirmarEliminar.hide();
        }
    }

    // =====================
    // VALIDACIÓN
    // =====================
    validarArchivos() {
        const fileInput = document.getElementById('evidenciaFotografica');
        if (!fileInput) return true;
        
        const files = fileInput.files;
        if (files.length > this.MAX_FOTOS) {
            this.mostrarAlerta('¡Solo se permiten 2 fotografías!', 'Por favor selecciona máximo 2 imágenes.');
            fileInput.value = '';
            return false;
        }
        return true;
    }

    validarYGenerar(e) {
        e.preventDefault();
        const formulario = e.target;
        formulario.classList.add('was-validated');

        if (!formulario.checkValidity()) {
            this.mostrarAlerta('¡Campos obligatorios!', 'Completa todos los campos marcados con * antes de continuar.');
            e.stopPropagation();
            return;
        }

        // Mostrar modal para elegir acción
        this.mostrarModalAccion();
    }

    // =====================
    // ENVÍO DE CORREO
    // =====================
    mostrarModalAccion() {
        const modalElement = document.getElementById('modalAccionDocumento');
        if (!modalElement) {
            console.error('Modal modalAccionDocumento no encontrado');
            return;
        }

        // Configurar eventos de los botones
        const btnDescargar = document.getElementById('btnDescargarDirecto');
        const btnCorreo = document.getElementById('btnEnviarCorreo');

        if (btnDescargar) {
            btnDescargar.onclick = () => {
                bootstrap.Modal.getInstance(modalElement).hide();
                this.procesarGeneracion(false);
            };
        }

        if (btnCorreo) {
            btnCorreo.onclick = () => {
                bootstrap.Modal.getInstance(modalElement).hide();
                this.procesarGeneracion(true);
            };
        }

        const modalBS = new bootstrap.Modal(modalElement);
        modalBS.show();
    }

    async procesarGeneracion(enviarCorreo) {
        try {
            const resultado = await this.generarExcelReparacion(true);

            this.archivoGenerado = resultado.blob;
            this.nombreArchivoGenerado = resultado.nombre;

            if (enviarCorreo) {
                this.mostrarModalEnvioCorreo();
            } else {
                saveAs(resultado.blob, resultado.nombre);
                this.mostrarMensajeExito('Documento descargado exitosamente');
            }

        } catch (error) {
            console.error('Error procesando documento:', error);
            this.mostrarAlerta('Error', 'Hubo un problema al generar el documento: ' + error.message);
        }
    }

    mostrarModalEnvioCorreo() {
        const modalElement = document.getElementById('modalEnviarCorreo');
        
        if (!modalElement) {
            console.error('❌ Modal modalEnviarCorreo no encontrado');
            this.mostrarAlerta('Error', 'No se puede mostrar el formulario de envío.');
            return;
        }

        // Limpiar campo de correo
        const correoInput = document.getElementById('correoDestinatario');
        const estadoDiv = document.getElementById('estadoEnvio');

        if (correoInput) correoInput.value = '';
        if (estadoDiv) estadoDiv.classList.add('d-none');
        if (correoInput) correoInput.classList.remove('is-valid', 'is-invalid');
        
        // Mostrar modal
        const modalBS = new bootstrap.Modal(modalElement);
        modalBS.show();
    }

    validarCorreoInput(input) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (input.value && !emailRegex.test(input.value)) {
            input.classList.add('is-invalid');
            input.classList.remove('is-valid');
        } else if (input.value) {
            input.classList.remove('is-invalid');
            input.classList.add('is-valid');
        } else {
            input.classList.remove('is-invalid', 'is-valid');
        }
    }

    async enviarCorreo() {
        const destinatario = document.getElementById('correoDestinatario')?.value.trim();
        
        // Validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!destinatario || !emailRegex.test(destinatario)) {
            this.mostrarEstadoEnvio('error', 'Por favor ingresa un correo válido');
            const correoInput = document.getElementById('correoDestinatario');
            if (correoInput) correoInput.classList.add('is-invalid');
            return;
        }

        if (!this.archivoGenerado) {
            this.mostrarEstadoEnvio('error', 'No hay archivo para enviar');
            return;
        }

        const btnEnviar = document.getElementById('btnConfirmarEnvio');
        const spinner = document.getElementById('spinnerEnvio');
        
        if (btnEnviar) btnEnviar.disabled = true;
        if (spinner) spinner.classList.remove('d-none');

        try {
            const cliente = document.getElementById('cliente')?.value || 'Cliente';
            const fecha = document.getElementById('fecha')?.value || 'N/A';

            const formData = new FormData();
            formData.append('archivo', this.archivoGenerado, this.nombreArchivoGenerado);
            formData.append('destinatario', destinatario);
            formData.append('asunto', `🔧 Reporte de Reparación Técnica - ${cliente} - ${fecha}`);
            formData.append('mensaje', `Se adjunta el reporte de reparación técnica para ${cliente}.`);
            formData.append('nombreArchivo', this.nombreArchivoGenerado);

            console.log('📤 Enviando a:', `${this.API_URL}/enviar-correo`);

            const response = await fetch(`${this.API_URL}/enviar-correo`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Error del servidor: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                this.mostrarEstadoEnvio('success', '✅ Correo enviado exitosamente');
                setTimeout(() => {
                    const modalElement = document.getElementById('modalEnviarCorreo');
                    if (modalElement) {
                        const modalInstance = bootstrap.Modal.getInstance(modalElement);
                        if (modalInstance) modalInstance.hide();
                    }
                    this.mostrarMensajeExito('Documento enviado por correo exitosamente');
                }, 2000);
            } else {
                this.mostrarEstadoEnvio('error', '❌ ' + (data.message || 'Error desconocido'));
            }

        } catch (error) {
            console.error('❌ Error al enviar correo:', error);
            this.mostrarEstadoEnvio('error', '❌ Error de conexión: ' + error.message);
        } finally {
            if (btnEnviar) btnEnviar.disabled = false;
            if (spinner) spinner.classList.add('d-none');
        }
    }

    mostrarEstadoEnvio(tipo, mensaje) {
        const estadoDiv = document.getElementById('estadoEnvio');
        if (!estadoDiv) return;
        
        estadoDiv.className = `alert ${tipo === 'success' ? 'alert-success' : 'alert-danger'}`;
        estadoDiv.textContent = mensaje;
        estadoDiv.classList.remove('d-none');
    }

    mostrarMensajeExito(mensaje) {
        const alertHTML = `
            <div class="alert alert-success alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3" 
                role="alert" style="z-index: 9999;">
                <i class="bi bi-check-circle-fill me-2"></i>${mensaje}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', alertHTML);
        
        setTimeout(() => {
            const alert = document.querySelector('.alert-success');
            if (alert) alert.remove();
        }, 3000);
    }

    // =====================
    // GENERACIÓN DE EXCEL
    // =====================
    async generarExcelReparacion(retornarBlob = false) {
        try {
            // Recopilar datos generales
            const datosGenerales = {
                fabricante: document.getElementById('fabricante')?.value || '',
                modelo: document.getElementById('modelo')?.value || '',
                serial: document.getElementById('serial')?.value || '',
                contrato: document.getElementById('contrato')?.value || '',
                cliente: document.getElementById('cliente')?.value || '',
                direccion: document.getElementById('direccion')?.value || '',
                telefono: document.getElementById('telefono')?.value || '',
                ciudad: document.getElementById('ciudad')?.value || '',
                fecha: document.getElementById('fecha')?.value || '',
                ingeniero: document.getElementById('ingeniero')?.value || '',
                ticket: document.getElementById('ticket')?.value || '',
                revisionInicial: document.getElementById('revisionInicial')?.value || '',
                observacionesRecepcion: document.getElementById('observaciones')?.value || '',
                fallaReportada: document.getElementById('falla')?.value || ''
            };

            // Recopilar estado de componentes
            const componentes = this.obtenerEstadoComponentes();

            // Recopilar repuestos
            const repuestos = this.obtenerRepuestos();

            // Cargar plantilla
            const response = await fetch('/public/ReferenciaReparacion.xlsx');
            if (!response.ok) throw new Error('No se pudo cargar la plantilla ReferenciaReparacion.xlsx');
            
            const blobPlantilla = await response.blob();
            const workbookPopulate = await XlsxPopulate.fromDataAsync(blobPlantilla);
            const sheet = workbookPopulate.sheet(0);

            // Rellenar datos generales
            sheet.cell('B7').value(datosGenerales.fabricante);
            sheet.cell('B8').value(datosGenerales.modelo);
            sheet.cell('B9').value(datosGenerales.serial);
            sheet.cell('B10').value(datosGenerales.contrato);
            sheet.cell('I7').value(datosGenerales.cliente);
            sheet.cell('I8').value(datosGenerales.direccion);
            sheet.cell('I9').value(datosGenerales.telefono);
            sheet.cell('P7').value(datosGenerales.fecha);
            sheet.cell('P8').value(datosGenerales.ingeniero);
            sheet.cell('P9').value(datosGenerales.ticket);
            sheet.cell('H13').value(datosGenerales.revisionInicial);
            sheet.cell('I10').value(datosGenerales.ciudad);

            // Rellenar componentes (D15-F34)
            this.rellenarComponentes(sheet, componentes);

            // Rellenar observaciones y falla
            sheet.cell('A36').value(datosGenerales.observacionesRecepcion);
            sheet.cell('A40').value(datosGenerales.fallaReportada);

            // Rellenar repuestos
            this.rellenarRepuestos(sheet, repuestos);

            const blobPopulate = await workbookPopulate.outputAsync();

            // Usar ExcelJS para agregar imágenes
            const workbookExcelJS = new ExcelJS.Workbook();
            await workbookExcelJS.xlsx.load(await blobPopulate.arrayBuffer());

            const hojaPrincipal = workbookExcelJS.worksheets[0];

            // Agregar fotos automáticamente
            await this.agregarFotos(workbookExcelJS, hojaPrincipal);
            hojaPrincipal.pageSetup.printArea = 'A1:S64';

            // Opcional: Ajustar para que quepa en una sola página
            hojaPrincipal.pageSetup.fitToPage = true;
            hojaPrincipal.pageSetup.fitToHeight = 1;
            hojaPrincipal.pageSetup.fitToWidth = 1;
            
            const bufferFinal = await workbookExcelJS.xlsx.writeBuffer();
            const blobFinal = new Blob([bufferFinal], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });

            const nombreArchivo = `Reparacion_${datosGenerales.cliente}_${datosGenerales.fecha}_${datosGenerales.ticket}.xlsx`;
            
            if (retornarBlob) {
                return { blob: blobFinal, nombre: nombreArchivo };
            } else {
                saveAs(blobFinal, nombreArchivo);
            }

        } catch (error) {
            console.error('Error generando reparación:', error);
            this.mostrarAlerta('Error generando archivo', error.message);
            throw error;
        }
    }

    obtenerEstadoComponentes() {
        const nombreComponentes = [
            'stylus', 'correa', 'screen', 'escaner', 'pantalla', 'teclado', 'teclasLat',
            'tapaBat', 'microsd', 'simcard', 'carcasaSup', 'carcasaInf', 'bateria',
            'tapaPapel', 'rodillo', 'cabezal', 'sensorPapel', 'guias', 'cables', 'baseEscaner'
        ];

        const componentes = {};
        nombreComponentes.forEach(comp => {
            const select = document.getElementById(`componente_${comp}`);
            componentes[comp] = select ? select.value : '';
        });

        return componentes;
    }

    rellenarComponentes(sheet, componentes) {
        const mapeo = {
            'stylus': 15,
            'correa': 16,
            'screen': 17,
            'escaner': 18,
            'pantalla': 19,
            'teclado': 20,
            'teclasLat': 21,
            'tapaBat': 22,
            'microsd': 23,
            'simcard': 24,
            'carcasaSup': 25,
            'carcasaInf': 26,
            'bateria': 27,
            'tapaPapel': 28,
            'rodillo': 29,
            'cabezal': 30,
            'sensorPapel': 31,
            'guias': 32,
            'cables': 33,
            'baseEscaner': 34
        };

        for (const [comp, fila] of Object.entries(mapeo)) {
            const estado = componentes[comp];
            if (estado === 'bueno') {
                sheet.cell(`D${fila}`).value('X');
            } else if (estado === 'malo') {
                sheet.cell(`E${fila}`).value('X');
            } else if (estado === 'notrae') {
                sheet.cell(`F${fila}`).value('X');
            }
        }
    }

    obtenerRepuestos() {
        const repuestos = [];
        const repuestosItems = document.querySelectorAll('.repuesto-item');

        repuestosItems.forEach(item => {
            const codigo = item.querySelector('.codigo-repuesto')?.value || '';
            const descripcion = item.querySelector('.descripcion-repuesto')?.value || '';
            const tipoRadio = item.querySelector('.tipo-cambio:checked');
            const tipo = tipoRadio ? tipoRadio.value : '';

            if (codigo && descripcion && tipo) {
                repuestos.push({ codigo, descripcion, tipo });
            }
        });

        return repuestos;
    }

    rellenarRepuestos(sheet, repuestos) {
        repuestos.forEach((rep, index) => {
            if (index >= 10) return; // Máximo 10 repuestos

            const fila = 37 + index;
            sheet.cell(`H${fila}`).value(rep.codigo);
            sheet.cell(`I${fila}`).value(rep.descripcion);

            if (rep.tipo === 'uso') {
                sheet.cell(`K${fila}`).value('X');
            } else if (rep.tipo === 'abuso') {
                sheet.cell(`L${fila}`).value('X');
            } else if (rep.tipo === 'garantia') {
                sheet.cell(`M${fila}`).value('X');
            }
        });
    }

async agregarFotos(workbook, hoja) {
    const fileInput = document.getElementById('evidenciaFotografica');
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        console.warn('No hay imágenes para insertar');
        return;
    }

    const archivos = Array.from(fileInput.files).slice(0, 2);

    // Rango vertical (fila 45 a fila 60)
    const filaInicio = 44; // fila 45 índice 44
    const filaFin    = 59; // fila 60 índice 59

    // Rango horizontal de cada imagen
    const rangos = [
        { colInicio: 0, colFin: 1 },  // A-B
        { colInicio: 2, colFin: 5 }   // C-F
    ];

    for (let i = 0; i < archivos.length; i++) {
        const archivo = archivos[i];

        try {
            const base64 = await this.archivoToBase64(archivo);
            const extension = archivo.type.split('/')[1] || 'png';
            const base64Clean = base64.split(',')[1] || base64;

            const imgId = workbook.addImage({
                base64: base64Clean,
                extension: extension
            });

            const rango = rangos[i];

            hoja.addImage(imgId, {
                tl: { col: rango.colInicio, row: filaInicio },
                br: { col: rango.colFin + 1, row: filaFin + 1 }, // +1 porque ExcelJS excluye la última
                editAs: 'twoCell'
            });

            console.log(`Imagen ${i+1} insertada en columnas ${rango.colInicio}-${rango.colFin}`);

        } catch (error) {
            console.error("❌ Error insertando imagen:", error);
        }
    }
}



    // =====================
    // UTILIDADES
    // =====================
    mostrarAlerta(titulo, mensaje = 'Se ha detectado un problema.') {
        if (this.modalAlertTitle) {
            this.modalAlertTitle.innerHTML = `<i class="bi bi-exclamation-triangle me-2"></i>${titulo}`;
        }
        if (this.modalAlertBody) {
            this.modalAlertBody.textContent = mensaje;
        }
        if (this.modalAlert) {
            this.modalAlert.show();
        }
    }

    archivoToBase64(archivo) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result;
                if (typeof result === 'string') {
                    resolve(result);
                } else {
                    reject(new Error('Error al leer el archivo'));
                }
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(archivo);
        });
    }
}

// Inicializar la aplicación
new SistemaReparacion();