let contadorEquipos = 1;
const MAX_EQUIPOS = 20;
const modalAlert = new bootstrap.Modal(document.getElementById('staticBackdrop2'));
const modalAlertTitle = document.getElementById('modalAlert');
const modalConfirmacion = new bootstrap.Modal(document.getElementById('staticBackdrop'));

document.addEventListener('DOMContentLoaded', function() {
  // Configurar event listeners para los acordeones existentes
  document.querySelectorAll('.accordion-collapse').forEach(collapse => {
    const equipoItem = collapse.closest('.equipo-item');
    const removeBtn = equipoItem.querySelector('.remove-equipo');
    const removerBtn = equipoItem.querySelector('.remover-equipo');
    
    // Verificar si es el primer equipo
    const esElPrimero = equipoItem === document.querySelector('.equipo-item');
    
    if (esElPrimero) {
      // Primer equipo: nunca mostrar botones
      removeBtn.style.display = 'none';
      removerBtn.style.display = 'none';
    } else {
      // Equipos adicionales: comportamiento normal
      collapse.addEventListener('show.bs.collapse', function() {
        removeBtn.style.display = 'none';
        removerBtn.style.display = 'block';
      });
      
      collapse.addEventListener('hide.bs.collapse', function() {
        removeBtn.style.display = 'block';
        removerBtn.style.display = 'none';
      });
    }
  });
});

document.getElementById('agregarEquipo').addEventListener('click', function () {
  if (contadorEquipos >= MAX_EQUIPOS) {
    modalAlertTitle.innerHTML = "¡Máximo 20 equipos por documento!";
    modalAlert.show();
    return;
  }

  const equipoContainer = document.getElementById('accordionEquipos');
  const primerEquipo = equipoContainer.querySelector('.equipo-item');
  const nuevoEquipo = primerEquipo.cloneNode(true);

  nuevoEquipo.querySelectorAll('input, textarea, select').forEach(el => {
    if (el.tagName === 'SELECT') el.value = 'N/A';
    else el.value = '';
  });

  contadorEquipos++;
  const equipoID = `equipo-${contadorEquipos}`;
  const headerID = `heading-${equipoID}`;
  const collapseID = `collapse-${equipoID}`;

  nuevoEquipo.querySelector('.accordion-header').setAttribute('id', headerID);
  const boton = nuevoEquipo.querySelector('.accordion-button');
  boton.textContent = `Equipo ${contadorEquipos}`;
  boton.setAttribute('data-bs-target', `#${collapseID}`);
  boton.setAttribute('aria-controls', collapseID);

  const collapseDiv = nuevoEquipo.querySelector('.accordion-collapse');
  collapseDiv.setAttribute('id', collapseID);
  collapseDiv.setAttribute('aria-labelledby', headerID);
  collapseDiv.classList.remove('show');

  // Configurar los botones eliminar para el nuevo equipo
  const removeBtn = nuevoEquipo.querySelector('.remove-equipo');
  const removerBtn = nuevoEquipo.querySelector('.remover-equipo');
  
  // Configurar estados iniciales
  removeBtn.style.display = 'block'; // Mostrar icono (acordeón plegado)
  removerBtn.style.display = 'none'; // Ocultar botón texto
  
  // Configurar event listeners para el nuevo acordeón
  collapseDiv.addEventListener('show.bs.collapse', function() {
    removeBtn.style.display = 'none'; // Ocultar icono
    removerBtn.style.display = 'block'; // Mostrar botón texto
  });
  
  collapseDiv.addEventListener('hide.bs.collapse', function() {
    removeBtn.style.display = 'block'; // Mostrar icono
    removerBtn.style.display = 'none'; // Ocultar botón texto
  });

  equipoContainer.appendChild(nuevoEquipo);
  actualizarContadorEquipos();
});

// Variable para guardar el elemento a eliminar
let equipoAEliminar = null;

document.addEventListener('click', function (e) {
  if (e.target.closest('.remove-equipo') || e.target.closest('.remover-equipo')) {
    if (contadorEquipos > 1) {
      // Guardar referencia al equipo a eliminar
      equipoAEliminar = e.target.closest('.equipo-item');
      
      // Mostrar modal de confirmación
      modalAlertTitle.innerHTML = "¿Estás seguro de eliminar este equipo?";
      
      // Cambiar el texto del modal
      const modalBody = document.querySelector('#staticBackdrop2 .modal-body');
      modalBody.textContent = "Esta acción no se puede deshacer.";
      
      // Cambiar el botón a uno de confirmación
      const modalFooter = document.querySelector('#staticBackdrop2 .modal-footer');
      modalFooter.innerHTML = `
        <button type="button" class="btn btn-danger" id="btnConfirmarEliminar">
          <i class="bi bi-trash3 me-1"></i>Sí, eliminar
        </button>
        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">
          <i class="bi bi-x-circle me-1"></i>Cancelar
        </button>
      `;
      
      modalAlert.show();
    } else {
      modalAlertTitle.innerHTML = "¡Debe haber al menos un equipo!";
      const modalBody = document.querySelector('#staticBackdrop2 .modal-body');
      modalBody.textContent = "Se ha detectado un problema en la información ingresada.";
      const modalFooter = document.querySelector('#staticBackdrop2 .modal-footer');
      modalFooter.innerHTML = `
        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">
          <i class="bi bi-check2-circle me-1"></i>Ok
        </button>
      `;
      modalAlert.show();
    }
  }
});

// Event listener para confirmar eliminación
document.addEventListener('click', function(e) {
  if (e.target.id === 'btnConfirmarEliminar' || e.target.closest('#btnConfirmarEliminar')) {
    if (equipoAEliminar) {
      equipoAEliminar.remove();
      contadorEquipos--;
      actualizarContadorEquipos();
      equipoAEliminar = null;
      modalAlert.hide();
    }
  }
});

// =====================
// ACTUALIZAR CONTADOR VISUAL
// =====================
function actualizarContadorEquipos() {
  const botonAgregar = document.getElementById('agregarEquipo');
  const textoContador = botonAgregar.nextElementSibling;
  if (textoContador && textoContador.classList.contains('text-muted')) {
    textoContador.textContent = `${contadorEquipos}/${MAX_EQUIPOS} equipos`;
  }
}
actualizarContadorEquipos();

// =====================
// VALIDAR ARCHIVOS
// =====================
function checkFileCount() {
  const fileInput = document.getElementById('evidencias');
  const files = fileInput.files;
  if (files.length > 20) {
    modalAlertTitle.innerHTML = "¡Solo se permiten 20 fotografías!";
    modalAlert.show();
    fileInput.value = '';
    return false;
  }
  return true;
}
document.getElementById('evidencias').addEventListener('change', checkFileCount);

// =====================
// VALIDAR FORMULARIO
// =====================
document.getElementById("formulario").addEventListener("submit", async (e) => {
  e.preventDefault();
  const formulario = e.target;
  formulario.classList.add('was-validated');

  if (!formulario.checkValidity()) {
    modalAlertTitle.innerHTML = "¡Completa todos los campos obligatorios!";
    modalAlert.show();
    e.stopPropagation();
    return;
  }

  modalConfirmacion.show();
});

document.querySelectorAll('#formulario .form-control, #formulario textarea, #formulario select').forEach(element => {
  element.addEventListener('input', () => {
    if (!element.checkValidity()) {
      element.classList.add('is-invalid');
    } else {
      element.classList.remove('is-invalid');
    }
  });
});

// =====================
// BOTÓN PRINCIPAL: GENERAR ARCHIVO
// =====================
document.getElementById("btnGenerar").addEventListener("click", async (e) => {
  e.preventDefault();

  try {
    // 1️⃣ Recolectar datos generales
    const datosGenerales = {
      fecha: document.getElementById("fecha").value,
      nombre: document.getElementById("nombre").value,
      cedula: document.getElementById("cedula").value,
      cliente: document.getElementById("cliente").value,
      idCliente: document.getElementById("idCliente").value,
      ubicacion: document.getElementById("ubicacion").value,
      observaciones: document.getElementById("observaciones").value
    };

    // 2️⃣ Recolectar equipos
    const equipos = [];
    document.querySelectorAll(".equipo-item").forEach((item) => {
      const serial = item.querySelector(".serial")?.value || "";
      const modelo = item.querySelector(".modelo")?.value || "";
      const problema = item.querySelector(".problema-equipo")?.value || "";

      const estados = {
        lapiz: item.querySelector(".estado-lapiz")?.value || "N/A",
        cuerdaLapiz: item.querySelector(".estado-cuerdaLapiz")?.value || "N/A",
        correaMano: item.querySelector(".estado-correaMano")?.value || "N/A",
        tecladoNumerico: item.querySelector(".estado-tecladoNumerico")?.value || "N/A",
        tecladoCompleto: item.querySelector(".estado-tecladoCompleto")?.value || "N/A",
        pantalla: item.querySelector(".estado-pantalla")?.value || "N/A",
        protectorPantalla: item.querySelector(".estado-protectorPantalla")?.value || "N/A",
        bateria: item.querySelector(".estado-bateria")?.value || "N/A",
        tapaBateria: item.querySelector(".estado-tapaBateria")?.value || "N/A",
        tarjetaAlm: item.querySelector(".estado-tarjetaAlm")?.value || "N/A",
        cubiertaTarjeta: item.querySelector(".estado-cubiertaTarjeta")?.value || "N/A",
        cristalLector: item.querySelector(".estado-cristalLector")?.value || "N/A",
        carcazaSuperior: item.querySelector(".estado-carcazaSuperior")?.value || "N/A",
        carcazaInferior: item.querySelector(".estado-carcazaInferior")?.value || "N/A",
        simCard: item.querySelector(".estado-simCard")?.value || "N/A"
      };

      if (serial && modelo && problema) {
        equipos.push({ serial, modelo, problema, estados });
      }
    });

    if (equipos.length === 0) {
      alert("Debes ingresar al menos un equipo con Serial, Modelo y Descripción.");
      return;
    }

    // 3️⃣ Cargar plantilla y llenarla con XLSX-Populate
    const response = await fetch("Referencia.xlsx");
    const blobPlantilla = await response.blob();
    const workbookPopulate = await XlsxPopulate.fromDataAsync(blobPlantilla);
    const sheet = workbookPopulate.sheet(0);
    const filaBase = 7;
    const maxEquipos = 20;

    equipos.forEach((eq, i) => {
      const f = filaBase + i;
      sheet.cell(`B${f}`).value(datosGenerales.idCliente || "");
      sheet.cell(`C${f}`).value(eq.serial);
      sheet.cell(`D${f}`).value(eq.modelo);
      sheet.cell(`E${f}`).value(eq.estados.lapiz);
      sheet.cell(`F${f}`).value(eq.estados.cuerdaLapiz);
      sheet.cell(`G${f}`).value(eq.estados.correaMano);
      sheet.cell(`H${f}`).value(eq.estados.tecladoNumerico);
      sheet.cell(`I${f}`).value(eq.estados.tecladoCompleto);
      sheet.cell(`J${f}`).value(eq.estados.pantalla);
      sheet.cell(`K${f}`).value(eq.estados.protectorPantalla);
      sheet.cell(`L${f}`).value(eq.estados.bateria);
      sheet.cell(`M${f}`).value(eq.estados.tapaBateria);
      sheet.cell(`N${f}`).value(eq.estados.tarjetaAlm);
      sheet.cell(`O${f}`).value(eq.estados.cubiertaTarjeta);
      sheet.cell(`P${f}`).value(eq.estados.cristalLector);
      sheet.cell(`Q${f}`).value(eq.estados.carcazaSuperior);
      sheet.cell(`R${f}`).value(eq.estados.carcazaInferior);
      sheet.cell(`S${f}`).value(eq.estados.simCard);
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
    sheet.find("{{ID_CLIENTE}}").forEach(c => c.value(datosGenerales.idCliente));

    // 4️⃣ Exportar a blob
    const blobPopulate = await workbookPopulate.outputAsync();

    // 5️⃣ Reabrir con ExcelJS para agregar imágenes
    const workbookExcelJS = new ExcelJS.Workbook();
    await workbookExcelJS.xlsx.load(await blobPopulate.arrayBuffer());

    const hojaFotos = workbookExcelJS.addWorksheet("FOTOS");
    hojaFotos.columns = [
      { width: 25 }, { width: 25 }, { width: 25 }, { width: 25 }
    ];
    hojaFotos.getCell("A1").value = "EVIDENCIAS FOTOGRÁFICAS";
    hojaFotos.mergeCells("A1:D1");
    hojaFotos.getCell("A1").font = { bold: true, size: 14 };
    hojaFotos.getCell("A1").alignment = { horizontal: "center" };

    const archivos = document.getElementById("evidencias").files;
    let filaActual = 3;
    let col = 1;

    for (let i = 0; i < archivos.length; i++) {
      const file = archivos[i];
      if (!file.type.startsWith("image/")) continue;
      const base64 = await archivoToBase64(file);
      const imgId = workbookExcelJS.addImage({
        base64: base64,
        extension: file.type.split("/")[1]
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
    }

    // 6️⃣ Descargar el archivo final con fotos embebidas
    const bufferFinal = await workbookExcelJS.xlsx.writeBuffer();
    const blobFinal = new Blob([bufferFinal], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });
    

    const nombreArchivo = `Recepcion_${datosGenerales.cliente}_${equipos.length}_equipos_${datosGenerales.fecha}_${datosGenerales.ubicacion}.xlsx`;
    saveAs(blobFinal, nombreArchivo);
    bootstrap.Modal.getInstance(document.getElementById("staticBackdrop")).hide();

  } catch (err) {
    console.error(err);
    alert("Error generando el archivo: " + err.message);
  }
});


// =====================
// FUNCIÓN: REEMPLAZAR PLACEHOLDERS
// =====================
function reemplazarPlaceholdersEnWorkbook(workbook, equipos, datosGenerales) {
  const MAX_EQUIPOS = 20;
  const mapa = {};

  // Datos generales
  mapa["{{CLIENTE}}"] = datosGenerales.cliente || "";
  mapa["{{FECHA}}"] = datosGenerales.fecha || "";
  mapa["{{UBICACION}}"] = datosGenerales.ubicacion || "";
  mapa["{{OBSERVACIONES}}"] = datosGenerales.observaciones || "";
  mapa["{{NOMBRE_RECIBE}}"] = datosGenerales.nombre || "";
  mapa["{{CEDULA_RECIBE}}"] = datosGenerales.cedula || "";
  mapa["{{ID_CLIENTE}}"] = datosGenerales.idCliente || "";

  // Equipos
  const estadoKeys = ["LAPIZ","CUERDA","CORREA","TECLADO_NUM","TECLADO_COMPL","PANTALLA","PROTECTOR","BATERIA","TAPA_BATERIA","TARJETA_ALM","CUBIERTA_TARJETA","CRISTAL","CARCAZA_SUP","CARCAZA_INF","SIM"];
  for (let i = 0; i < MAX_EQUIPOS; i++) {
    const idx = i + 1;
    const e = equipos[i] || null;
    mapa[`{{E${idx}_ID}}`] = e ? (datosGenerales.idCliente || "") : "";
    mapa[`{{E${idx}_SERIAL}}`] = e ? (e.serial || "") : "";
    mapa[`{{E${idx}_MODELO}}`] = e ? (e.modelo || "") : "";
    mapa[`{{E${idx}_PROBLEMA}}`] = e ? (e.problema || "") : "";

    const estados = e ? Object.values(e.estados || {}) : [];
    for (let j = 0; j < estadoKeys.length; j++) {
      mapa[`{{E${idx}_${estadoKeys[j]}}}`] = estados[j] || "";
    }
  }

  workbook.worksheets.forEach(sheet => {
    sheet.eachRow({ includeEmpty: true }, row => {
      row.eachCell({ includeEmpty: true }, cell => {
        if (cell.value && typeof cell.value === "string") {
          let valor = cell.value;
          for (const key in mapa) {
            if (mapa.hasOwnProperty(key) && valor.includes(key)) {
              valor = valor.split(key).join(String(mapa[key]));
            }
          }
          if (valor !== cell.value) cell.value = valor;
        }
      });
    });
  });
}

// =====================
// FUNCIÓN: PROCESAR IMÁGENES
// =====================
async function procesarImagenes(archivos, worksheet, workbook) {
  worksheet.columns = [
    { width: 25 }, { width: 25 }, { width: 25 }, { width: 25 }
  ];
  worksheet.getCell('A1').value = 'EVIDENCIAS FOTOGRÁFICAS';
  worksheet.mergeCells('A1:D1');
  worksheet.getCell('A1').font = { bold: true, size: 14 };
  worksheet.getCell('A1').alignment = { horizontal: 'center' };

  let filaActual = 3, columnaActual = 1;
  for (let i = 0; i < archivos.length; i++) {
    const archivo = archivos[i];
    if (archivo.type.startsWith('image/')) {
      try {
        const base64 = await archivoToBase64(archivo);
        const imagenId = workbook.addImage({
          base64: base64,
          extension: archivo.type.split('/')[1]
        });
        worksheet.addImage(imagenId, {
          tl: { col: columnaActual - 1, row: filaActual - 1 },
          br: { col: columnaActual, row: filaActual + 20 }
        });
        columnaActual++;
        if (columnaActual > 4) { columnaActual = 1; filaActual += 25; }
      } catch (error) {
        console.error(`Error procesando imagen ${archivo.name}:`, error);
      }
    }
  }
}

function archivoToBase64(archivo) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(archivo);
  });
}



