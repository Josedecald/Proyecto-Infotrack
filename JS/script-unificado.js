// =====================
// CONFIGURACIÓN GLOBAL
// =====================
class SistemaGestionTecnica {
    constructor() {
        this.contadores = {
            recepcion: 1,
            entrega: 1
        };
        
        this.MAX_EQUIPOS = 20;
        this.signaturePads = {};
        this.firmasGuardadas = {};
        this.equiposAEliminar = {};
        
        this.init();
    }

    init() {
        // Usar DOMContentLoaded correctamente
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.inicializar());
        } else {
            this.inicializar();
        }
    }

    inicializar() {
        this.inicializarModales();
        this.inicializarEventListeners();
        this.inicializarAcordeones();
    }

    // =====================
    // INICIALIZACIÓN
    // =====================
    inicializarModales() {
        // Inicializar modales solo si existen los elementos
        const modalAlertElement = document.getElementById('staticBackdrop2');
        const modalConfirmarElement = document.getElementById('modalConfirmarEliminar');
        
        if (modalAlertElement) {
            try {
                this.modalAlert = new bootstrap.Modal(modalAlertElement);
            } catch (error) {
                console.error('Error inicializando modal de alerta:', error);
            }
        }
        
        if (modalConfirmarElement) {
            try {
                this.modalConfirmarEliminar = new bootstrap.Modal(modalConfirmarElement);
            } catch (error) {
                console.error('Error inicializando modal de confirmación:', error);
            }
        }
        
        // Elementos de alerta
        this.modalAlertTitle = document.querySelector('#staticBackdrop2 .modal-title');
        this.modalAlertBody = document.getElementById('modalAlertBody');
    }

    inicializarEventListeners() {
        // Formularios
        const formRecepcion = document.getElementById('formularioRecepcion');
        const formEntrega = document.getElementById('formularioEntrega');
        
        if (formRecepcion) {
            formRecepcion.addEventListener('submit', (e) => this.validarYGenerar(e, 'recepcion'));
        }
        
        if (formEntrega) {
            formEntrega.addEventListener('submit', (e) => this.validarYGenerar(e, 'entrega'));
        }

        // Botones agregar equipo
        const btnAgregarRecepcion = document.getElementById('agregarEquipoRecepcion');
        const btnAgregarEntrega = document.getElementById('agregarEquipoEntrega');
        
        if (btnAgregarRecepcion) {
            btnAgregarRecepcion.addEventListener('click', () => this.agregarEquipo('recepcion'));
        }
        
        if (btnAgregarEntrega) {
            btnAgregarEntrega.addEventListener('click', () => this.agregarEquipo('entrega'));
        }

        // Eliminación de equipos
        document.addEventListener('click', (e) => this.manejarEliminacionEquipo(e));
        
        const btnConfirmarEliminar = document.getElementById('btnConfirmarEliminar');
        if (btnConfirmarEliminar) {
            btnConfirmarEliminar.addEventListener('click', () => this.confirmarEliminacion());
        }

        // Validación de archivos
        const evidenciasRecepcion = document.getElementById('evidenciasRecepcion');
        const evidenciasEntrega = document.getElementById('evidenciasEntrega');
        
        if (evidenciasRecepcion) {
            evidenciasRecepcion.addEventListener('change', () => this.validarArchivos('recepcion'));
        }
        
        if (evidenciasEntrega) {
            evidenciasEntrega.addEventListener('change', () => this.validarArchivos('entrega'));
        }

        // Firmas
        this.inicializarFirmas();
    }

    // =====================
    // MANEJO DE FIRMAS
    // =====================
    inicializarFirmas() {
        const modalesFirma = [
            { modal: 'modalFirmaRecepcion', canvas: 'firmaCanvasRecepcion', tipo: 'recepcion' },
            { modal: 'modalFirmaEntrega', canvas: 'firmaCanvasEntrega', tipo: 'entrega' }
        ];

        modalesFirma.forEach(({ modal, canvas, tipo }) => {
            const modalElement = document.getElementById(modal);
            const canvasElement = document.getElementById(canvas);

            if (!modalElement) {
                console.warn(`Modal ${modal} no encontrado en el HTML`);
                return;
            }

            if (!canvasElement) {
                console.warn(`Canvas ${canvas} no encontrado en el HTML`);
                return;
            }

            // Evento al mostrar modal
            modalElement.addEventListener('shown.bs.modal', () => {
                this.inicializarSignaturePad(canvas, tipo);
            });

            // Botones limpiar
            const btnLimpiar = document.getElementById(`limpiarFirma${this.capitalize(tipo)}`);
            if (btnLimpiar) {
                btnLimpiar.addEventListener('click', () => {
                    if (this.signaturePads[tipo]) this.signaturePads[tipo].clear();
                });
            }

            // Botones guardar
            const btnGuardar = document.getElementById(`guardarFirma${this.capitalize(tipo)}`);
            if (btnGuardar) {
                btnGuardar.addEventListener('click', () => {
                    this.guardarFirma(tipo);
                });
            }
        });
    }

    inicializarSignaturePad(canvasId, tipo) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        // Destruir pad existente
        if (this.signaturePads[tipo]) {
            this.signaturePads[tipo].off();
        }

        // Ajustar tamaño
        this.ajustarTamanoCanvas(canvas);

        // Crear nuevo pad
        this.signaturePads[tipo] = new SignaturePad(canvas, {
            backgroundColor: "rgba(255,255,255,0)",
            penColor: "rgb(0, 0, 0)"
        });

        // Restaurar firma si existe
        if (this.firmasGuardadas[tipo]) {
            const img = new Image();
            img.onload = () => {
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            };
            img.src = this.firmasGuardadas[tipo];
        }
    }

    ajustarTamanoCanvas(canvas) {
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        const modalBody = canvas.closest('.modal-body');
        
        if (!modalBody) return;

        const maxWidth = Math.min(modalBody.clientWidth - 60, 650);
        const height = 250;

        canvas.style.width = maxWidth + 'px';
        canvas.style.height = height + 'px';
        canvas.width = maxWidth * ratio;
        canvas.height = height * ratio;

        const ctx = canvas.getContext("2d");
        ctx.scale(ratio, ratio);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    guardarFirma(tipo) {
        const pad = this.signaturePads[tipo];
        if (pad && !pad.isEmpty()) {
            this.firmasGuardadas[tipo] = pad.toDataURL("image/png");
            const imgPreview = document.getElementById(`imgPreviewFirma${this.capitalize(tipo)}`);
            const previewContainer = document.getElementById(`previewFirma${this.capitalize(tipo)}`);
            
            if (imgPreview) imgPreview.src = this.firmasGuardadas[tipo];
            if (previewContainer) previewContainer.style.display = "block";
        } else {
            this.firmasGuardadas[tipo] = null;
            const previewContainer = document.getElementById(`previewFirma${this.capitalize(tipo)}`);
            if (previewContainer) previewContainer.style.display = "none";
        }
    }

    // =====================
    // MANEJO DE EQUIPOS
    // =====================
    inicializarAcordeones() {
        ['recepcion', 'entrega'].forEach(tipo => {
            const containerId = `accordionEquipos${this.capitalize(tipo)}`;
            const container = document.getElementById(containerId);
            
            if (container) {
                container.querySelectorAll('.accordion-collapse').forEach((collapse, index) => {
                    this.configurarAcordeon(collapse, tipo, index === 0);
                });
            }
        });
    }

    configurarAcordeon(collapse, tipo, esPrimero) {
        const equipoItem = collapse.closest('.equipo-item');
        if (!equipoItem) return;
        
        const removeBtn = equipoItem.querySelector('.remove-equipo');
        const removerBtn = equipoItem.querySelector('.remover-equipo');

        if (esPrimero) {
            if (removeBtn) removeBtn.style.display = 'none';
            if (removerBtn) removerBtn.style.display = 'none';
        } else {
            collapse.addEventListener('show.bs.collapse', () => {
                if (removeBtn) removeBtn.style.display = 'none';
                if (removerBtn) removerBtn.style.display = 'block';
            });
            
            collapse.addEventListener('hide.bs.collapse', () => {
                if (removeBtn) removeBtn.style.display = 'block';
                if (removerBtn) removerBtn.style.display = 'none';
            });
        }
    }

    agregarEquipo(tipo) {
        if (this.contadores[tipo] >= this.MAX_EQUIPOS) {
            this.mostrarAlerta(`¡Máximo ${this.MAX_EQUIPOS} equipos por documento!`, "No puedes agregar más equipos.");
            return;
        }

        const containerId = `accordionEquipos${this.capitalize(tipo)}`;
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const primerEquipo = container.querySelector('.equipo-item');
        if (!primerEquipo) return;
        
        const nuevoEquipo = primerEquipo.cloneNode(true);

        // Limpiar campos
        nuevoEquipo.querySelectorAll('input, textarea, select').forEach(el => {
            if (el.tagName === 'SELECT') {
                el.value = tipo === 'recepcion' ? 'N/A' : '';
            } else if (el.type === 'checkbox') {
                el.checked = false;
            } else {
                el.value = '';
            }
        });

        this.contadores[tipo]++;
        const collapseID = `collapse${this.capitalize(tipo)}${this.contadores[tipo]}`;
        const headerID = `heading-${tipo}-${this.contadores[tipo]}`;

        // Actualizar IDs y atributos
        const header = nuevoEquipo.querySelector('.accordion-header');
        if (header) header.setAttribute('id', headerID);
        
        const boton = nuevoEquipo.querySelector('.accordion-button');
        if (boton) {
            boton.textContent = `Equipo ${this.contadores[tipo]}`;
            boton.setAttribute('data-bs-target', `#${collapseID}`);
            boton.setAttribute('aria-controls', collapseID);
        }

        const collapseDiv = nuevoEquipo.querySelector('.accordion-collapse');
        if (collapseDiv) {
            collapseDiv.setAttribute('id', collapseID);
            collapseDiv.setAttribute('aria-labelledby', headerID);
            collapseDiv.classList.remove('show');
        }

        // Configurar botones
        const removeBtn = nuevoEquipo.querySelector('.remove-equipo');
        const removerBtn = nuevoEquipo.querySelector('.remover-equipo');
        
        if (removeBtn) removeBtn.style.display = 'block';
        if (removerBtn) removerBtn.style.display = 'none';

        // Configurar eventos del acordeón
        if (collapseDiv) {
            this.configurarAcordeon(collapseDiv, tipo, false);
        }

        container.appendChild(nuevoEquipo);
    }

    manejarEliminacionEquipo(e) {
        const target = e.target.closest('.remove-equipo') || e.target.closest('.remover-equipo');
        if (!target) return;

        const equipoItem = target.closest('.equipo-item');
        if (!equipoItem) return;
        
        const container = equipoItem.closest('[id^="accordionEquipos"]');
        if (!container) return;

        // Determinar tipo (recepcion o entrega)
        const tipo = container.id.includes('Recepcion') ? 'recepcion' : 'entrega';

        if (this.contadores[tipo] > 1) {
            this.equiposAEliminar[tipo] = equipoItem;
            if (this.modalConfirmarEliminar) {
                this.modalConfirmarEliminar.show();
            }
        } else {
            this.mostrarAlerta("¡Debe haber al menos un equipo!", "No puedes eliminar todos los equipos.");
        }
    }

    confirmarEliminacion() {
        // Encontrar qué tipo de equipo se está eliminando
        for (const tipo in this.equiposAEliminar) {
            if (this.equiposAEliminar[tipo]) {
                this.equiposAEliminar[tipo].remove();
                this.contadores[tipo]--;
                this.equiposAEliminar[tipo] = null;
                break;
            }
        }
        if (this.modalConfirmarEliminar) {
            this.modalConfirmarEliminar.hide();
        }
    }

    // =====================
    // VALIDACIÓN
    // =====================
    validarArchivos(tipo) {
        const fileInput = document.getElementById(`evidencias${this.capitalize(tipo)}`);
        if (!fileInput) return true;
        
        const files = fileInput.files;
        if (files.length > 20) {
            this.mostrarAlerta("¡Solo se permiten 20 fotografías!", "Por favor selecciona máximo 20 imágenes.");
            fileInput.value = '';
            return false;
        }
        return true;
    }

    validarYGenerar(e, tipo) {
        e.preventDefault();
        const formulario = e.target;
        formulario.classList.add('was-validated');

        if (!formulario.checkValidity()) {
            this.mostrarAlerta("¡Campos obligatorios!", "Completa todos los campos marcados con * antes de continuar.");
            e.stopPropagation();
            return;
        }

        // Generar archivo según el tipo
        if (tipo === 'recepcion') {
            this.generarExcelRecepcion();
        } else {
            this.generarExcelEntrega();
        }
    }

    // =====================
    // GENERACIÓN DE EXCEL - RECEPCIÓN
    // =====================
    async generarExcelRecepcion() {
        try {
            // 1️⃣ Recolectar datos generales
            const datosGenerales = {
                fecha: document.getElementById("fechaRecepcion")?.value || "",
                nombre: document.getElementById("nombreRecepcion")?.value || "",
                cedula: document.getElementById("cedulaRecepcion")?.value || "",
                cliente: document.getElementById("clienteRecepcion")?.value || "",
                idCliente: document.getElementById("idClienteRecepcion")?.value || "",
                ubicacion: document.getElementById("ubicacionRecepcion")?.value || "",
                observaciones: document.getElementById("observacionesRecepcion")?.value || "",
                nombreEntrega: document.getElementById("nombreEntregaRecepcion")?.value || "",
                cedulaEntrega: document.getElementById("cedulaEntregaRecepcion")?.value || ""
            };

            // 2️⃣ Recolectar equipos
            const equipos = [];
            document.querySelectorAll("#accordionEquiposRecepcion .equipo-item").forEach((item) => {
                const serial = item.querySelector(".serial")?.value || "";
                const modelo = item.querySelector(".modelo")?.value || "";
                const problema = item.querySelector(".problema-equipo")?.value || "";

                const estados = {
                    lapiz: item.querySelector(".estado-lapiz")?.value || "N/A",
                    cuerdaLapiz: item.querySelector(".estado-cuerdaLapiz")?.value || "N/A",
                    correaMano: item.querySelector(".estado-correaMano")?.value || "N/A",
                    pantalla: item.querySelector(".estado-pantalla")?.value || "N/A",
                    base: item.querySelector(".estado-base")?.value || "N/A",
                    cargador: item.querySelector(".estado-cargador")?.value || "N/A",
                    bateria: item.querySelector(".estado-bateria")?.value || "N/A",
                    cableUSB: item.querySelector(".estado-cableUSB")?.value || "N/A",
                    estuche: item.querySelector(".estado-estuche")?.value || "N/A",
                    empaque: item.querySelector(".estado-empaque")?.value || "N/A",
                    tornillos: item.querySelector(".estado-tornillos")?.value || "N/A",
                    tapa: item.querySelector(".estado-tapa")?.value || "N/A",
                    gatillo: item.querySelector(".estado-gatillo")?.value || "N/A",
                    botones: item.querySelector(".estado-botones")?.value || "N/A",
                    audifonos: item.querySelector(".estado-audifonos")?.value || "N/A",
                    manual: item.querySelector(".estado-manual")?.value || "N/A"
                };

                if (serial && modelo && problema) {
                    equipos.push({ serial, modelo, problema, estados });
                }
            });

            if (equipos.length === 0) {
                this.mostrarAlerta("¡Atención!", "Debes ingresar al menos un equipo con Serial, Modelo y Descripción.");
                return;
            }

            // 3️⃣ Cargar plantilla y llenarla
            const response = await fetch("Referencia.xlsx");
            if (!response.ok) throw new Error("No se pudo cargar la plantilla Referencia.xlsx");
            
            const blobPlantilla = await response.blob();
            const workbookPopulate = await XlsxPopulate.fromDataAsync(blobPlantilla);
            const sheet = workbookPopulate.sheet(0);
            const filaBase = 7;
            const maxEquipos = 20;

            // Llenar datos de equipos
            equipos.forEach((eq, i) => {
                const f = filaBase + i;
                sheet.cell(`B${f}`).value(datosGenerales.idCliente);
                sheet.cell(`C${f}`).value(eq.serial);
                sheet.cell(`D${f}`).value(eq.modelo);
                
                // Estados de componentes (E7 a S7)
                const estadosOrden = ["lapiz", "cuerdaLapiz", "correaMano", "pantalla", "base", "cargador", 
                                    "bateria", "cableUSB", "estuche", "empaque", "tornillos", "tapa", 
                                    "gatillo", "botones", "audifonos", "manual"];
                
                estadosOrden.forEach((estado, index) => {
                    const columna = String.fromCharCode(69 + index); // E=69, F=70, etc.
                    sheet.cell(`${columna}${f}`).value(eq.estados[estado]);
                });

                sheet.cell(`T${f}`).value(eq.problema);
            });

            // Ocultar filas no usadas
            if (equipos.length < maxEquipos) {
                for (let f = filaBase + equipos.length; f < filaBase + maxEquipos; f++) {
                    sheet.range(`B${f}:T${f}`).value("");
                    sheet.row(f).hidden(true);
                }
            }

            // Reemplazar placeholders generales
            sheet.find("{{FECHA}}").forEach(c => c.value(datosGenerales.fecha));
            sheet.find("{{CLIENTE}}").forEach(c => c.value(datosGenerales.cliente));
            sheet.find("{{NOMBRE_RECIBE}}").forEach(c => c.value(datosGenerales.nombre));
            sheet.find("{{CEDULA_RECIBE}}").forEach(c => c.value(datosGenerales.cedula));
            sheet.find("{{UBICACION}}").forEach(c => c.value(datosGenerales.ubicacion));
            sheet.find("{{OBSERVACIONES}}").forEach(c => c.value(datosGenerales.observaciones));
            sheet.find("{{NOMBRE_ENTREGA}}").forEach(c => c.value(datosGenerales.nombreEntrega));
            sheet.find("{{CEDULA_ENTREGA}}").forEach(c => c.value(datosGenerales.cedulaEntrega));
            sheet.find("{{ID_CLIENTE}}").forEach(c => c.value(datosGenerales.idCliente));

            // 4️⃣ Exportar a blob
            const blobPopulate = await workbookPopulate.outputAsync();

            // 5️⃣ Reabrir con ExcelJS para agregar imágenes
            const workbookExcelJS = new ExcelJS.Workbook();
            await workbookExcelJS.xlsx.load(await blobPopulate.arrayBuffer());

            const hojaPrincipal = workbookExcelJS.worksheets[0];

            // Agregar firma
            if (this.firmasGuardadas.recepcion) {
                const firmaBase64 = this.firmasGuardadas.recepcion.replace(/^data:image\/png;base64,/, "");
                const firmaId = workbookExcelJS.addImage({
                    base64: firmaBase64,
                    extension: "png"
                });

                hojaPrincipal.addImage(firmaId, {
                    tl: { col: 5, row: 31 },
                    ext: { width: 300, height: 100 }
                });
            }

            // Agregar hoja de fotos
            await this.agregarHojaFotos(workbookExcelJS, "evidenciasRecepcion");

            // 6️⃣ Descargar archivo final
            const bufferFinal = await workbookExcelJS.xlsx.writeBuffer();
            const blobFinal = new Blob([bufferFinal], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            });

            const nombreArchivo = `Recepcion_${datosGenerales.cliente}_${equipos.length}_equipos_${datosGenerales.fecha}_${datosGenerales.ubicacion}.xlsx`;
            saveAs(blobFinal, nombreArchivo);

        } catch (error) {
            console.error("Error generando recepción:", error);
            this.mostrarAlerta("Error generando archivo", error.message);
        }
    }

    // =====================
    // GENERACIÓN DE EXCEL - ENTREGA
    // =====================
    async generarExcelEntrega() {
        try {
            // 1️⃣ Recolectar datos generales
            const datosGenerales = {
                fecha: document.getElementById("fechaEntrega")?.value || "",
                nombre: document.getElementById("nombreEntrega")?.value || "",
                cedula: document.getElementById("cedulaEntrega")?.value || "",
                cliente: document.getElementById("clienteEntrega")?.value || "",
                idCliente: document.getElementById("idClienteEntrega")?.value || "",
                ubicacion: document.getElementById("ubicacionEntrega")?.value || "",
                observaciones: document.getElementById("observacionesEntrega")?.value || "",
                nombreRecepcion: document.getElementById("nombreRecepcionEntrega")?.value || "",
                cedulaRecepcion: document.getElementById("cedulaRecepcionEntrega")?.value || ""
            };

            // 2️⃣ Recolectar equipos
            const equipos = [];
            document.querySelectorAll("#accordionEquiposEntrega .equipo-item").forEach((item) => {
                const serial = item.querySelector(".serial")?.value || "";
                const modelo = item.querySelector(".modelo")?.value || "";
                
                // Estados de componentes
                const estados = {
                    lapiz: item.querySelector(".estado-lapiz")?.value || "N/A",
                    cuerdaLapiz: item.querySelector(".estado-cuerdaLapiz")?.value || "N/A",
                    correaMano: item.querySelector(".estado-correaMano")?.value || "N/A",
                    pantalla: item.querySelector(".estado-pantalla")?.value || "N/A",
                    base: item.querySelector(".estado-base")?.value || "N/A",
                    cargador: item.querySelector(".estado-cargador")?.value || "N/A",
                    bateria: item.querySelector(".estado-bateria")?.value || "N/A",
                    cableUSB: item.querySelector(".estado-cableUSB")?.value || "N/A",
                    estuche: item.querySelector(".estado-estuche")?.value || "N/A",
                    empaque: item.querySelector(".estado-empaque")?.value || "N/A",
                    tornillos: item.querySelector(".estado-tornillos")?.value || "N/A",
                    tapa: item.querySelector(".estado-tapa")?.value || "N/A",
                    gatillo: item.querySelector(".estado-gatillo")?.value || "N/A",
                    botones: item.querySelector(".estado-botones")?.value || "N/A",
                    audifonos: item.querySelector(".estado-audifonos")?.value || "N/A"
                };

                // Nuevos campos de entrega
                const cambioRepuestos = item.querySelector(".cambio-repuestos")?.value || "";
                const solucion = item.querySelector(".descripcion-solucion")?.value || "";

                // Campos de verificación (corregido los IDs únicos)
                const verificacion = {
                    wifi: item.querySelector(".check-wifi")?.checked ? "✓" : "",
                    bluetooth: item.querySelector(".check-bluetooth")?.checked ? "✓" : "",
                    celular: item.querySelector(".check-celular")?.checked ? "✓" : "",
                    pantalla: item.querySelector(".check-pantalla")?.checked ? "✓" : "",
                    escaner: item.querySelector(".check-escaner")?.checked ? "✓" : "",
                    teclado: item.querySelector(".check-teclado")?.checked ? "✓" : ""
                };

                if (serial && modelo && solucion) {
                    equipos.push({ serial, modelo, estados, cambioRepuestos, verificacion, solucion });
                }
            });

            if (equipos.length === 0) {
                this.mostrarAlerta("¡Atención!", "Debes ingresar al menos un equipo con Serial, Modelo y Solución.");
                return;
            }

            // 3️⃣ Cargar plantilla y llenarla
            const response = await fetch("ReferenciaEntrega.xlsx");
            if (!response.ok) throw new Error("No se pudo cargar la plantilla ReferenciaEntrega.xlsx");
            
            const blobPlantilla = await response.blob();
            const workbookPopulate = await XlsxPopulate.fromDataAsync(blobPlantilla);
            const sheet = workbookPopulate.sheet(0);
            const filaBase = 7;

            // Llenar datos de equipos
            equipos.forEach((eq, i) => {
                const f = filaBase + i;
                
                // Datos básicos
                sheet.cell(`B${f}`).value(datosGenerales.idCliente);
                sheet.cell(`C${f}`).value(eq.serial);
                sheet.cell(`D${f}`).value(eq.modelo);

                // Estados de componentes (E7 a S7)
                const estadosOrden = ["lapiz", "cuerdaLapiz", "correaMano", "pantalla", "base", "cargador", 
                                    "bateria", "cableUSB", "estuche", "empaque", "tornillos", "tapa", 
                                    "gatillo", "botones", "audifonos"];
                
                estadosOrden.forEach((estado, index) => {
                    const columna = String.fromCharCode(69 + index); // E=69, F=70, etc.
                    sheet.cell(`${columna}${f}`).value(eq.estados[estado] || "N/A");
                });

                // Campos específicos de entrega
                sheet.cell(`T${f}`).value(eq.cambioRepuestos);
                sheet.cell(`U${f}`).value(eq.verificacion.wifi);
                sheet.cell(`V${f}`).value(eq.verificacion.bluetooth);
                sheet.cell(`W${f}`).value(eq.verificacion.celular);
                sheet.cell(`X${f}`).value(eq.verificacion.pantalla);
                sheet.cell(`Y${f}`).value(eq.verificacion.escaner);
                sheet.cell(`Z${f}`).value(eq.verificacion.teclado);
                sheet.cell(`AA${f}`).value(eq.solucion);
            });

            // Reemplazar placeholders generales
            sheet.find("{{FECHA}}").forEach(c => c.value(datosGenerales.fecha));
            sheet.find("{{CLIENTE}}").forEach(c => c.value(datosGenerales.cliente));
            sheet.find("{{IDCLIENTE}}").forEach(c => c.value(datosGenerales.idCliente));
            sheet.find("{{UBICACION}}").forEach(c => c.value(datosGenerales.ubicacion));
            sheet.find("{{OBSERVACIONES}}").forEach(c => c.value(datosGenerales.observaciones));
            sheet.find("{{NOMBRE_ENTREGA}}").forEach(c => c.value(datosGenerales.nombre));
            sheet.find("{{CEDULA_ENTREGA}}").forEach(c => c.value(datosGenerales.cedula));
            sheet.find("{{NOMBRE_RECIBE}}").forEach(c => c.value(datosGenerales.nombreRecepcion));
            sheet.find("{{CEDULA_RECIBE}}").forEach(c => c.value(datosGenerales.cedulaRecepcion));

            // 4️⃣ Exportar a blob
            const blobPopulate = await workbookPopulate.outputAsync();

            // 5️⃣ Reabrir con ExcelJS para agregar imágenes
            const workbookExcelJS = new ExcelJS.Workbook();
            await workbookExcelJS.xlsx.load(await blobPopulate.arrayBuffer());

            const hojaPrincipal = workbookExcelJS.worksheets[0];

            // Mostrar filas ocultas si hay más de 1 equipo
            if (equipos.length > 1) {
                for (let i = 1; i < equipos.length; i++) {
                    const fila = filaBase + i;
                    const rowObj = hojaPrincipal.getRow(fila);
                    rowObj.hidden = false;
                }
            }

            // Agregar firma
            if (this.firmasGuardadas.entrega) {
                const firmaBase64 = this.firmasGuardadas.entrega.replace(/^data:image\/png;base64,/, "");
                const firmaId = workbookExcelJS.addImage({ 
                    base64: firmaBase64, 
                    extension: "png" 
                });
                
                hojaPrincipal.addImage(firmaId, { 
                    tl: { col: 5, row: 29 }, 
                    ext: { width: 300, height: 100 } 
                });
            }

            // Agregar hoja de fotos
            await this.agregarHojaFotos(workbookExcelJS, "evidenciasEntrega");

            // 6️⃣ Descargar archivo final
            const bufferFinal = await workbookExcelJS.xlsx.writeBuffer();
            const blobFinal = new Blob([bufferFinal], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            });

            const nombreArchivo = `Entrega_${datosGenerales.cliente}_${equipos.length}_equipos_${datosGenerales.fecha}_${datosGenerales.ubicacion}.xlsx`;
            saveAs(blobFinal, nombreArchivo);

        } catch (error) {
            console.error("Error generando entrega:", error);
            this.mostrarAlerta("Error generando archivo", error.message);
        }
    }

    // =====================
    // FUNCIÓN AGREGAR HOJA FOTOS
    // =====================
    async agregarHojaFotos(workbook, inputId) {
        const fileInput = document.getElementById(inputId);
        if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
            return; // No hay archivos para agregar
        }

        const hojaFotos = workbook.addWorksheet("FOTOS");
        hojaFotos.columns = [
            { width: 25 }, { width: 25 }, { width: 25 }, { width: 25 }
        ];
        
        hojaFotos.getCell("A1").value = "EVIDENCIAS FOTOGRÁFICAS";
        hojaFotos.mergeCells("A1:D1");
        hojaFotos.getCell("A1").font = { bold: true, size: 14 };
        hojaFotos.getCell("A1").alignment = { horizontal: "center" };

        const archivos = fileInput.files;
        let filaActual = 3;
        let col = 1;

        for (let i = 0; i < archivos.length; i++) {
            const file = archivos[i];
            if (!file.type.startsWith("image/")) continue;
            
            try {
                const base64 = await this.archivoToBase64(file);
                const extension = file.type.split("/")[1] || "png";
                
                const imgId = workbook.addImage({
                    base64: base64,
                    extension: extension
                });
                
                hojaFotos.addImage(imgId, {
                    tl: { col: col - 1, row: filaActual - 1 },
                    br: { col: col, row: filaActual + 18 }
                });
                
                col++;
                if (col > 4) {
                    col = 1;
                    filaActual += 22;
                }
            } catch (error) {
                console.error(`Error procesando imagen ${file.name}:`, error);
            }
        }
    }

    // =====================
    // UTILIDADES
    // =====================
    mostrarAlerta(titulo, mensaje = "Se ha detectado un problema.") {
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

    capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    archivoToBase64(archivo) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result;
                if (typeof result === 'string') {
                    resolve(result.split(',')[1]);
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
new SistemaGestionTecnica();