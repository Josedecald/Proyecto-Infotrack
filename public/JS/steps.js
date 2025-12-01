document.addEventListener("DOMContentLoaded", () => {
    // ============================================
    // WIZARD PARA REPARACIÓN (original)
    // ============================================
    const reparacionSteps = document.querySelectorAll(".wizard-step[data-step]");
    const reparacionTabs = document.querySelectorAll("#wizardTabs .nav-tab-horizontal");
    
    if (reparacionSteps.length > 0 && reparacionTabs.length > 0) {
        setupReparacionWizard(reparacionSteps, reparacionTabs);
    }
    
    // ============================================
    // WIZARD PARA RECEPCIÓN Y ENTREGA
    // ============================================
    const verticalTabs = document.querySelectorAll(".vertical-tab");
    const formContainers = document.querySelectorAll(".form-container");
    
    if (verticalTabs.length > 0) {
        // FUNCIONALIDAD DE PESTAÑAS VERTICALES
        verticalTabs.forEach(tab => {
            tab.addEventListener("click", () => {
                const formType = tab.dataset.form;
                
                // Actualizar pestañas activas
                verticalTabs.forEach(t => t.classList.remove("active"));
                tab.classList.add("active");
                
                // Mostrar formulario correspondiente
                formContainers.forEach(container => {
                    container.style.display = "none";
                    container.classList.remove("active");
                });
                
                const activeForm = document.querySelector(`.${formType}-form`);
                if (activeForm) {
                    activeForm.style.display = "block";
                    activeForm.classList.add("active");
                    
                    // Reiniciar wizard del formulario activo
                    resetWizard(formType);
                }
            });
        });
        
        // CONFIGURAR WIZARDS
        setupRecepcionEntregaWizard("recepcion", "recepcionTabs", "wizard-next-recepcion", "wizard-prev-recepcion");
        setupRecepcionEntregaWizard("entrega", "entregaTabs", "wizard-next-entrega", "wizard-prev-entrega");
    }
});

// ============================================
// FUNCIÓN PARA WIZARD DE REPARACIÓN
// ============================================
function setupReparacionWizard(steps, tabs) {
    const nextBtns = document.querySelectorAll(".wizard-next");
    const prevBtns = document.querySelectorAll(".wizard-prev");

    let currentStep = 1;
    const totalSteps = steps.length;

    // GUARDAR QUÉ CAMPOS SON REQUIRED ORIGINALMENTE
    document.querySelectorAll("[required]").forEach(i => {
        i.dataset.originalRequired = "true";
    });

    // VALIDAR PASO (sin usar required del navegador)
    function validateStep(step) {
        const stepDiv = document.querySelector(`.wizard-step[data-step="${step}"]`);
        const tab = document.querySelector(`#wizardTabs .nav-tab-horizontal[data-step="${step}"]`);

        if (!stepDiv || !tab) return true;

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
            tab.classList.add("text-danger");
        } else {
            tab.classList.remove("text-danger");
        }

        if (firstInvalid) {
            firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
        }

        return valid;
    }

    // VALIDAR TODOS LOS PASOS ANTERIORES
    function validateAllPreviousSteps(upToStep) {
        let allValid = true;
        
        for (let s = 1; s <= upToStep; s++) {
            if (!validateStep(s)) {
                allValid = false;
            }
        }
        
        return allValid;
    }

    // MOSTRAR PASO
    function showStep(step) {
        steps.forEach(s => s.style.display = "none");
        tabs.forEach(t => t.classList.remove("active"));

        const current = document.querySelector(`.wizard-step[data-step="${step}"]`);
        const currentTab = document.querySelector(`#wizardTabs .nav-tab-horizontal[data-step="${step}"]`);

        if (current) current.style.display = "block";
        if (currentTab) currentTab.classList.add("active");

        currentStep = step;
    }

    // HABILITAR TAB SIGUIENTE
    function enableTab(step) {
        const tab = document.querySelector(`#wizardTabs .nav-tab-horizontal[data-step="${step}"]`);
        if (tab) tab.classList.remove("disabled");
    }

    // BOTÓN SIGUIENTE
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

    // BOTÓN ATRÁS
    prevBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            const prev = currentStep - 1;
            if (prev >= 1) {
                showStep(prev);
            }
        });
    });

    // CLICK EN TABS
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

    // INTERCEPTAR SUBMIT DEL FORMULARIO
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
}

// ============================================
// FUNCIÓN PARA WIZARD DE RECEPCIÓN/ENTREGA
// ============================================
function setupRecepcionEntregaWizard(formType, tabsId, nextClass, prevClass) {
    const steps = document.querySelectorAll(`.${formType}-step`);
    const tabs = document.querySelectorAll(`#${tabsId} .nav-tab-horizontal`);
    const nextBtns = document.querySelectorAll(`.${nextClass}`);
    const prevBtns = document.querySelectorAll(`.${prevClass}`);
    
    if (steps.length === 0) return;
    
    let currentStep = 1;
    const totalSteps = steps.length;
    
    // GUARDAR CAMPOS REQUIRED ORIGINALES
    document.querySelectorAll(`.${formType}-form [required]`).forEach(i => {
        i.dataset.originalRequired = "true";
    });
    
    // VALIDAR PASO
    function validateStep(step) {
        const stepDiv = document.querySelector(`.${formType}-step[data-step="${step}"]`);
        const tab = document.querySelector(`#${tabsId} .nav-tab-horizontal[data-step="${step}"]`);
        
        if (!stepDiv || !tab) return true;
        
        let valid = true;
        let firstInvalid = null;
        
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
                // Para archivos, solo validar en el paso 4
                if (step === 4) {
                    ok = field.files && field.files.length > 0;
                } else {
                    ok = true; // No validar archivos en otros pasos
                }
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
        
        // Marcar pestaña en rojo si hay error
        if (!valid) {
            tab.classList.add("text-danger");
        } else {
            tab.classList.remove("text-danger");
        }
        
        if (firstInvalid) {
            firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        
        return valid;
    }
    
    // MOSTRAR PASO
    function showStep(step) {
        steps.forEach(s => {
            s.style.display = "none";
            s.classList.remove("active");
        });
        tabs.forEach(t => t.classList.remove("active"));
        
        const current = document.querySelector(`.${formType}-step[data-step="${step}"]`);
        const currentTab = document.querySelector(`#${tabsId} .nav-tab-horizontal[data-step="${step}"]`);
        
        if (current) {
            current.style.display = "block";
            current.classList.add("active");
        }
        if (currentTab) currentTab.classList.add("active");
        
        currentStep = step;
    }
    
    // HABILITAR TAB SIGUIENTE
    function enableTab(step) {
        const tab = document.querySelector(`#${tabsId} .nav-tab-horizontal[data-step="${step}"]`);
        if (tab) tab.classList.remove("disabled");
    }
    
    // BOTÓN SIGUIENTE
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
    
    // BOTÓN ATRÁS
    prevBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            const prev = currentStep - 1;
            if (prev >= 1) {
                showStep(prev);
            }
        });
    });
    
    // CLICK EN TABS HORIZONTALES
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
    
    // INTERCEPTAR SUBMIT
    const form = document.getElementById(`formulario${formType.charAt(0).toUpperCase() + formType.slice(1)}`);
    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Validar TODOS los pasos
            for (let s = 1; s <= totalSteps; s++) {
                if (!validateStep(s)) {
                    showStep(s);
                    
                    // Mostrar alerta
                    const modalAlert = document.getElementById('staticBackdrop2');
                    const modalAlertBody = document.getElementById('modalAlertBody');
                    
                    if (modalAlertBody) {
                        modalAlertBody.textContent = `Completa todos los campos obligatorios en el Paso ${s} antes de finalizar.`;
                    }
                    if (modalAlert) {
                        const modal = new bootstrap.Modal(modalAlert);
                        modal.show();
                    }
                    
                    return false;
                }
            }
            
            // Si todo está validado, disparar evento
            const eventoContinuar = new CustomEvent(`formulario${formType.charAt(0).toUpperCase() + formType.slice(1)}Validado`);
            form.dispatchEvent(eventoContinuar);
        });
    }
    
    // INICIALIZAR
    showStep(1);
}

// ============================================
// REINICIAR WIZARD
// ============================================
function resetWizard(formType) {
    const tabsId = formType === "recepcion" ? "recepcionTabs" : "entregaTabs";
    const steps = document.querySelectorAll(`.${formType}-step`);
    const tabs = document.querySelectorAll(`#${tabsId} .nav-tab-horizontal`);
    
    // Resetear todos los pasos
    steps.forEach(s => {
        s.style.display = "none";
        s.classList.remove("active");
    });
    
    // Resetear todas las pestañas
    tabs.forEach((tab, index) => {
        tab.classList.remove("active");
        if (index > 0) {
            tab.classList.add("disabled");
        }
    });
    
    // Mostrar primer paso y activar primera pestaña
    if (steps[0]) {
        steps[0].style.display = "block";
        steps[0].classList.add("active");
    }
    if (tabs[0]) {
        tabs[0].classList.add("active");
    }
}