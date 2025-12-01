// post-reparacion.js
// Extiende SistemaReparacion para POST reparación

document.addEventListener('DOMContentLoaded', async () => {

  // Instancia del sistema
  const sistema = new SistemaReparacion();

  // Variables de resultado final
  let blobGenerado = null;
  let nombreArchivoGenerado = null;

  // Verificar si hay un Excel cargado desde seleccionR
  const excelData = sessionStorage.getItem('excelFileData');
  if (excelData) await cargarDatosDesdeExcel(excelData, sistema);

  // ============================================
  // WIZARD
  // ============================================
  const steps = document.querySelectorAll('.wizard-step-post');
  const tabs  = document.querySelectorAll('#wizardTabsPost .nav-link');
  const nextBtns = document.querySelectorAll('.pr-next');
  const prevBtns = document.querySelectorAll('.pr-prev');
  let current = 1;
  const total = steps.length;

  function show(step) {
    steps.forEach(s => s.style.display = 'none');
    tabs.forEach(t => t.classList.remove('active','text-danger','fw-bold'));

    const cur = document.querySelector(`.wizard-step-post[data-step="${step}"]`);
    const tab = document.querySelector(`#wizardTabsPost .nav-link[data-step="${step}"]`);
    if (cur) cur.style.display = 'block';
    if (tab) tab.classList.add('active');
    current = step;
  }

  function collectRequiredValid(step) {
    const stepDiv = document.querySelector(`.wizard-step-post[data-step="${step}"]`);
    if (!stepDiv) return true;

    let ok = true;
    let firstInvalid = null;

    const fields = stepDiv.querySelectorAll('input,textarea,select');
    fields.forEach(f => {
      if (f.hasAttribute('required')) {
        if (!f.value || f.value.trim() === '') {
          f.classList.add('is-invalid');
          ok = false;
          if (!firstInvalid) firstInvalid = f;
        } else {
          f.classList.remove('is-invalid');
        }
      }
    });

    const tab = document.querySelector(`#wizardTabsPost .nav-link[data-step="${step}"]`);
    if (!ok) {
      if (tab) tab.classList.add('text-danger','fw-bold');
      if (firstInvalid) firstInvalid.scrollIntoView({behavior:'smooth', block:'center'});
    } else {
      if (tab) tab.classList.remove('text-danger','fw-bold');
    }
    return ok;
  }

  nextBtns.forEach(b => b.addEventListener('click', () => {
    if (!collectRequiredValid(current)) return;
    const next = current + 1;
    if (next <= total) {
      const tab = document.querySelector(`#wizardTabsPost .nav-link[data-step="${next}"]`);
      if (tab) tab.classList.remove('disabled');
      show(next);
    }
  }));

  prevBtns.forEach(b => b.addEventListener('click', () => {
    const prev = current - 1;
    if (prev >= 1) show(prev);
  }));

  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      if (tab.classList.contains('disabled')) return e.preventDefault();
      show(parseInt(tab.dataset.step));
    });
  });

  show(1);

  // ============================================
  // COMPONENTES
  // ============================================
  const componentsMap = [
    { id: 'pr_comp_wifi',        row: 38 },
    { id: 'pr_comp_bt',          row: 39 },
    { id: 'pr_comp_scan',        row: 40 },
    { id: 'pr_comp_keys',        row: 41 },
    { id: 'pr_comp_touch',       row: 42 },
    { id: 'pr_comp_sim',         row: 43 },
    { id: 'pr_comp_speaker',     row: 44 },
    { id: 'pr_comp_mic',         row: 45 },
    { id: 'pr_comp_cam',         row: 46 },
    { id: 'pr_comp_print',       row: 47 },
    { id: 'pr_comp_charge',      row: 48 },
    { id: 'pr_comp_head',        row: 49 },
    { id: 'pr_comp_ribbon',      row: 50 },
    { id: 'pr_comp_papersensor', row: 51 },
    { id: 'pr_comp_usb',         row: 52 },
    { id: 'pr_comp_otros',       row: 53 }
  ];

  function collectComponentsForExcel() {
    return componentsMap.map(c => ({
      row: c.row,
      value: document.getElementById(c.id)?.value || ''
    }));
  }

  // ============================================
  // FIRMAS
  // ============================================
  inicializarFirmasPostReparacion();

  function inicializarFirmasPostReparacion() {
    const modalesFirma = [
      { modalId: 'modalFirmaEntrega', canvasId: 'firmaCanvasEntrega', tipo: 'entrega' },
      { modalId: 'modalFirmaRecibe',  canvasId: 'firmaCanvasRecibe',  tipo: 'recibe'  }
    ];

    modalesFirma.forEach(({ modalId, canvasId, tipo }) => {
      const modal = document.getElementById(modalId);
      const canvas = document.getElementById(canvasId);
      if (!modal || !canvas) return;

      let signaturePad = null;

      modal.addEventListener('shown.bs.modal', () => {
        if (signaturePad) {
          signaturePad.clear();
          signaturePad = null;
        }
        ajustarCanvas(canvas);

        signaturePad = new SignaturePad(canvas, {
          backgroundColor: "rgba(255,255,255,0)",
          penColor: "rgb(0,0,0)"
        });

        if (sistema.firmasGuardadas?.[tipo]) {
          const img = new Image();
          img.onload = () => canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
          img.src = sistema.firmasGuardadas[tipo];
        }
      });

      document.getElementById(`limpiarFirma${capitalize(tipo)}`)?.addEventListener('click', () => {
        if (signaturePad) signaturePad.clear();
      });

      document.getElementById(`guardarFirma${capitalize(tipo)}`)?.addEventListener('click', () => {
        if (signaturePad && !signaturePad.isEmpty()) {
          const dataURL = signaturePad.toDataURL("image/png");

          if (!sistema.firmasGuardadas) sistema.firmasGuardadas = {};
          sistema.firmasGuardadas[tipo] = dataURL;

          const preview = document.getElementById(`previewFirma${capitalize(tipo)}`);
          if (preview) preview.innerHTML = `<img src="${dataURL}" style="max-width:100%; height:auto;">`;

          bootstrap.Modal.getInstance(modal)?.hide();
        }
      });
    });
  }

  function ajustarCanvas(canvas) {
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = 600 * ratio;
    canvas.height = 200 * ratio;
    canvas.style.width = '600px';
    canvas.style.height = '200px';
    canvas.getContext("2d").scale(ratio, ratio);
  }

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // Botones abrir firma
  document.getElementById('abrirModalFirmaEntrega')?.addEventListener('click', () => {
    new bootstrap.Modal(document.getElementById('modalFirmaEntrega')).show();
  });
  document.getElementById('abrirModalFirmaRecibe')?.addEventListener('click', () => {
    new bootstrap.Modal(document.getElementById('modalFirmaRecibe')).show();
  });

  // ============================================
  // GENERAR EXCEL
  // ============================================
  async function generarPostReparacionBlob() {

    const datos = {
      fabricante: document.getElementById('pr_fabricante')?.value || '',
      modelo:     document.getElementById('pr_modelo')?.value || '',
      serial:     document.getElementById('pr_serial')?.value || '',
      cliente:    document.getElementById('pr_cliente')?.value || '',
      fecha:      document.getElementById('pr_fecha')?.value || ''
    };

    const procedimiento = document.getElementById('pr_procedimiento')?.value || '';
    const componentes  = collectComponentsForExcel();
    const observaciones = document.getElementById('pr_observaciones')?.value || '';

    const firmaEntrega = sistema.firmasGuardadas?.entrega || null;
    const firmaRecibe  = sistema.firmasGuardadas?.recibe  || null;

    // ---- Cargar plantilla ----
    let blobPlantilla;
    const excelSession = sessionStorage.getItem('excelFileData');

    if (excelSession) {
      const bytes = Uint8Array.from(atob(excelSession.split(',')[1]), c => c.charCodeAt(0));
      blobPlantilla = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    } else {
      const resp = await fetch('/public/ReferenciaReparacion.xlsx');
      blobPlantilla = await resp.blob();
    }

    // ---- XlsxPopulate (texto) ----
    const workbookPopulate = await XlsxPopulate.fromDataAsync(blobPlantilla);
    const sheet = workbookPopulate.sheet(0);

    sheet.cell('B7').value(datos.fabricante);
    sheet.cell('B8').value(datos.modelo);
    sheet.cell('B9').value(datos.serial);
    sheet.cell('I7').value(datos.cliente);
    sheet.cell('P7').value(datos.fecha);
    sheet.cell('O13').value(procedimiento);

    componentes.forEach(item => {
      sheet.cell(`Q${item.row}`).value(null);
      sheet.cell(`R${item.row}`).value(null);
      sheet.cell(`S${item.row}`).value(null);

      if (item.value === 'si') sheet.cell(`Q${item.row}`).value('X');
      if (item.value === 'no') sheet.cell(`R${item.row}`).value('X');
      if (item.value === 'na') sheet.cell(`S${item.row}`).value('X');
    });

    if (observaciones) sheet.cell('A56').value(observaciones);

    // ---- Convertir a ExcelJS para imágenes ----
    const blobPopulate = await workbookPopulate.outputAsync();
    const workbookExcelJS = new ExcelJS.Workbook();
    await workbookExcelJS.xlsx.load(await blobPopulate.arrayBuffer());

    const hoja = workbookExcelJS.worksheets[0];

    // Firmas
    if (firmaEntrega) await addBase64ImageToSheet(firmaEntrega, hoja, 1, 62, 250, 100);
    if (firmaRecibe)  await addBase64ImageToSheet(firmaRecibe,  hoja, 15, 62, 250, 100);

    // Fotos
    const inputFotos = document.getElementById('fotos');
    if (inputFotos && inputFotos.files.length > 0) {
      const archivos = inputFotos.files;
      for (let i = 0; i < Math.min(archivos.length, 2); i++) {
        const file = archivos[i];
        const base64 = await fileToBase64(file);
        const ext = (file.type.split('/')[1] || 'png');
        const imgId = workbookExcelJS.addImage({ base64, extension: ext });

        hoja.addImage(imgId, {
          tl: { col: (i === 0 ? 0 : 8), row: 44 },
          ext: { width: 300, height: 200 },
          editAs: 'oneCell'
        });
      }
    }

    // ---- Output final ----
    const bufferFinal = await workbookExcelJS.xlsx.writeBuffer();
    const blobFinal = new Blob([bufferFinal], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const nombre = `PostReparacion_${datos.cliente}_${datos.fecha}_${datos.serial}.xlsx`;
    return { blob: blobFinal, nombre };
  }

  async function addBase64ImageToSheet(base64, sheet, col, row, width, height) {
    if (!base64) return;

    const matches = base64.match(/^data:(image\/\w+);base64,(.*)$/);
    const ext = matches[1].split('/')[1] || 'png';
    const data = matches[2];

    const imageId = sheet.workbook.addImage({
      base64: data,
      extension: ext
    });

    sheet.addImage(imageId, {
      tl: { col, row },
      ext: { width, height }
    });
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // ============================================
  // SUBMIT + MODAL
  // ============================================
  const form = document.getElementById('formPostReparacion');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Validar todo
      for (let i = 1; i <= total; i++) {
        if (!collectRequiredValid(i)) {
          show(i);
          return;
        }
      }

      // Mostrar spinner
      const btnSubmit = form.querySelector('button[type="submit"]');
      const originalText = btnSubmit.innerHTML;
      btnSubmit.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Generando...';
      btnSubmit.disabled = true;

      try {
        const result = await generarPostReparacionBlob();
        blobGenerado = result.blob;
        nombreArchivoGenerado = result.nombre;

        btnSubmit.innerHTML = originalText;
        btnSubmit.disabled = false;

        sistema.archivoGenerado = blobGenerado;
        sistema.nombreArchivoGenerado = nombreArchivoGenerado;

        new bootstrap.Modal(document.getElementById('modalAccionDocumento')).show();

      } catch (err) {
        console.error(err);
        alert('Error generando documento: ' + err.message);
        btnSubmit.innerHTML = originalText;
        btnSubmit.disabled = false;
      }
    });
  }

  // Botón: Descargar
  document.getElementById('btnDescargarDirectoPost')?.addEventListener('click', () => {
    if (blobGenerado) {
      saveAs(blobGenerado, nombreArchivoGenerado);
      sistema.mostrarMensajeExito('Documento descargado exitosamente');
      bootstrap.Modal.getInstance(document.getElementById('modalAccionDocumento'))?.hide();
    }
  });

  // Botón: Enviar correo
  document.getElementById('btnEnviarCorreoPost')?.addEventListener('click', () => {
    bootstrap.Modal.getInstance(document.getElementById('modalAccionDocumento'))?.hide();
    sistema.mostrarModalEnvioCorreo();
  });

  // ============================================
  // CARGAR DATOS DESDE EXCEL
  // ============================================
  async function cargarDatosDesdeExcel(base64Data, sistemaInstance) {
    try {
      document.body.insertAdjacentHTML('beforeend', `
        <div id="loadingIndicator" class="position-fixed top-50 start-50 translate-middle" style="z-index:9999;">
          <div class="spinner-border text-primary"></div>
        </div>
      `);

      const bytes = Uint8Array.from(atob(base64Data.split(',')[1]), c => c.charCodeAt(0));
      const blob = new Blob([bytes], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const workbook = await XlsxPopulate.fromDataAsync(blob);
      const sheet = workbook.sheet(0);

      const fabricante = sheet.cell('B7').value() || '';
      const modelo     = sheet.cell('B8').value() || '';
      const serial     = sheet.cell('B9').value() || '';
      const cliente    = sheet.cell('I7').value() || '';
      const fecha      = sheet.cell('P7').value() || '';

      if (fabricante) {
        const select = document.getElementById('pr_fabricante');
        const value = String(fabricante).trim();
        const option = [...select.options].find(o => o.value.toLowerCase() === value.toLowerCase());
        if (option) select.value = option.value;
        else {
          const opt = document.createElement('option');
          opt.value = value;
          opt.textContent = value;
          select.appendChild(opt);
          select.value = value;
        }
      }

      if (modelo) document.getElementById('pr_modelo').value = modelo;
      if (serial) document.getElementById('pr_serial').value = serial;
      if (cliente) document.getElementById('pr_cliente').value = cliente;

      if (fecha) {
        const date = new Date(fecha);
        document.getElementById('pr_fecha').value = !isNaN(date) ? date.toISOString().split('T')[0] : fecha;
      }

      document.getElementById('loadingIndicator')?.remove();
      sistemaInstance?.mostrarMensajeExito('Datos cargados desde el archivo Excel');

    } catch (err) {
      console.error(err);
      alert('Error al cargar el Excel');
      document.getElementById('loadingIndicator')?.remove();
    }
  }

});
