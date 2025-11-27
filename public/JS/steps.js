document.addEventListener("DOMContentLoaded", () => {

    const steps = document.querySelectorAll(".wizard-step");
    const tabs = document.querySelectorAll("#wizardTabs .nav-link");
    const nextBtns = document.querySelectorAll(".wizard-next");
    const prevBtns = document.querySelectorAll(".wizard-prev");

    let currentStep = 1;
    const totalSteps = steps.length;

    // ============================================
    // GUARDAR QUÉ CAMPOS SON REQUIRED ORIGINALMENTE
    // ============================================
    document.querySelectorAll("[required]").forEach(i => {
        i.dataset.originalRequired = "true";
    });

    // ============================================
    // VALIDAR PASO (sin usar required del navegador)
    // ============================================
    function validateStep(step) {
        const stepDiv = document.querySelector(`.wizard-step[data-step="${step}"]`);
        const tab = document.querySelector(`#wizardTabs .nav-link[data-step="${step}"]`);

        let valid = true;
        let firstInvalid = null;

        // campos del paso actual que originalmente eran required
        const fields = stepDiv.querySelectorAll("input, select, textarea");

        fields.forEach(field => {

            let isRequired = field.dataset.originalRequired === "true";

            if (!isRequired) return;

            let ok = true;

            if (field.type === "radio") {
                const name = field.name;
                const checked = stepDiv.querySelector(`input[name="${name}"]:checked`);
                ok = !!checked;
            } else if (field.tagName === "SELECT") {
                ok = field.value.trim() !== "";
            } else if (field.type === "file") {
                // Para archivos, verificar si hay archivos seleccionados
                ok = field.files && field.files.length > 0;
            } else {
                ok = field.value.trim() !== "";
            }

            if (!ok) {
                field.classList.add("is-invalid");
                valid = false;

                if (!firstInvalid) firstInvalid = field;
            } else {
                field.classList.remove("is-invalid");
            }
        });

        // marcar la pestaña en rojo si tiene error
        if (!valid) {
            tab.classList.add("text-danger", "fw-bold");
        } else {
            tab.classList.remove("text-danger", "fw-bold");
        }

        if (firstInvalid) {
            firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
        }

        return valid;
    }

    // ============================================
    // VALIDAR TODOS LOS PASOS ANTERIORES
    // ============================================
    function validateAllPreviousSteps(upToStep) {
        let allValid = true;
        
        for (let s = 1; s <= upToStep; s++) {
            if (!validateStep(s)) {
                allValid = false;
            }
        }
        
        return allValid;
    }

    // ============================================
    // MOSTRAR PASO
    // ============================================
    function showStep(step) {
        steps.forEach(s => s.style.display = "none");
        tabs.forEach(t => t.classList.remove("active"));

        const current = document.querySelector(`.wizard-step[data-step="${step}"]`);
        const currentTab = document.querySelector(`#wizardTabs .nav-link[data-step="${step}"]`);

        if (current) current.style.display = "block";
        if (currentTab) currentTab.classList.add("active");

        currentStep = step;
    }

    // ============================================
    // HABILITAR TAB SIGUIENTE
    // ============================================
    function enableTab(step) {
        const tab = document.querySelector(`#wizardTabs .nav-link[data-step="${step}"]`);
        if (tab) tab.classList.remove("disabled");
    }

    // ============================================
    // BOTÓN SIGUIENTE
    // ============================================
    nextBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            if (!validateStep(currentStep)) return;

            const next = currentStep + 1;
            if (next <= totalSteps) {
                enableTab(next);
                showStep(next);
            }
        });
    });

    // ============================================
    // BOTÓN ATRÁS
    // ============================================
    prevBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            const prev = currentStep - 1;
            if (prev >= 1) {
                showStep(prev);
            }
        });
    });

    // ============================================
    // CLICK EN TABS
    // ============================================
    tabs.forEach(tab => {
        tab.addEventListener("click", (e) => {
            if (tab.classList.contains("disabled")) {
                e.preventDefault();
                return;
            }
            const step = parseInt(tab.dataset.step);
            showStep(step);
        });
    });

    // ============================================
    // INTERCEPTAR SUBMIT DEL FORMULARIO
    // ============================================
    const form = document.getElementById("formularioReparacion");
    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Validar TODOS los pasos
            if (!validateAllPreviousSteps(totalSteps)) {
                // Encontrar el primer paso con errores y mostrar
                for (let s = 1; s <= totalSteps; s++) {
                    if (!validateStep(s)) {
                        showStep(s);
                        
                        // Mostrar alerta
                        const modalAlertTitle = document.getElementById('modalAlertaTitle');
                        const modalAlertBody = document.getElementById('modalAlertaBody');
                        const modalElement = document.getElementById('modalAlerta');
                        
                        if (modalAlertTitle) {
                            modalAlertTitle.innerHTML = `<i class="bi bi-exclamation-triangle me-2"></i>¡Campos obligatorios en el Paso ${s}!`;
                        }
                        if (modalAlertBody) {
                            modalAlertBody.textContent = 'Completa todos los campos marcados con * antes de finalizar.';
                        }
                        if (modalElement) {
                            const modal = new bootstrap.Modal(modalElement);
                            modal.show();
                        }
                        
                        return false;
                    }
                }
                return false;
            }
            
            // Si todo está validado, disparar el evento custom para que lo maneje script-reparacion.js
            const eventoContinuar = new CustomEvent('formularioValidado');
            form.dispatchEvent(eventoContinuar);
        });
    }

    // INICIO
    showStep(1);
});