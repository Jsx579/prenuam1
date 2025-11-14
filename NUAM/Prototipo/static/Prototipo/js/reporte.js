// JavaScript para Formulario de Reportes
document.addEventListener('DOMContentLoaded', function() {
    
    // Referencias a elementos del DOM
    const formReporte = document.getElementById('formReporte');
    const tipoReporteSelect = document.getElementById('tipoReporte');
    const asuntoInput = document.getElementById('asunto');
    const reporteTextarea = document.getElementById('reporte');
    const emailInput = document.getElementById('email');
    const btnEnviar = document.getElementById('btnEnviar');
    const btnLimpiar = document.getElementById('btnLimpiar');
    const mensajeConfirmacion = document.getElementById('mensajeConfirmacion');
    const mensajeError = document.getElementById('mensajeError');
    const textoError = document.getElementById('textoError');
    const contadorAsunto = document.getElementById('contadorAsunto');
    const contadorReporte = document.getElementById('contadorReporte');
    const historialReportes = document.getElementById('historialReportes');
    
    // Variables de estado
    let reportesEnviados = [];
    let enviandoReporte = false;
    
    // Inicialización
    init();

    function init() {
        setupEventListeners();
        setupValidation();
        setupCharacterCounters();
        cargarHistorialReportes();
        setupAutoSave();
    }

    // Configurar event listeners
    function setupEventListeners() {
        // Envío del formulario
        formReporte.addEventListener('submit', enviarReporte);
        
        // Botón limpiar
        btnLimpiar.addEventListener('click', limpiarFormulario);
        
        // Cambios en tipo de reporte
        tipoReporteSelect.addEventListener('change', onTipoReporteChange);
        
        // Validación en tiempo real
        asuntoInput.addEventListener('input', validarAsunto);
        reporteTextarea.addEventListener('input', validarReporte);
        emailInput.addEventListener('input', validarEmail);
        
        // Prevenir pérdida de datos
        window.addEventListener('beforeunload', onBeforeUnload);
    }

    // Configurar contadores de caracteres
    function setupCharacterCounters() {
        asuntoInput.addEventListener('input', function() {
            contadorAsunto.textContent = this.value.length;
            
            if (this.value.length >= 90) {
                contadorAsunto.classList.add('text-warning');
            } else {
                contadorAsunto.classList.remove('text-warning');
            }
        });
        
        reporteTextarea.addEventListener('input', function() {
            contadorReporte.textContent = this.value.length;
            
            if (this.value.length >= 900) {
                contadorReporte.classList.add('text-warning');
            } else {
                contadorReporte.classList.remove('text-warning');
            }
        });
    }

    // Manejar cambio de tipo de reporte
    function onTipoReporteChange() {
        const tipo = tipoReporteSelect.value;
        
        // Actualizar placeholder según el tipo
        const placeholders = {
            'error': 'Describe el error encontrado: ¿Qué estabas haciendo? ¿Qué esperabas que sucediera? ¿Qué sucedió en su lugar?',
            'sugerencia': 'Describe tu sugerencia: ¿Qué funcionalidad te gustaría ver? ¿Cómo mejoraría tu experiencia?',
            'mejora': 'Describe la mejora propuesta: ¿Qué aspecto se puede mejorar? ¿Cómo lo harías?',
            'consulta': 'Escribe tu consulta: ¿Qué necesitas saber? ¿En qué podemos ayudarte?',
            'otro': 'Describe tu reporte aquí. Incluye todos los detalles relevantes...'
        };
        
        if (placeholders[tipo]) {
            reporteTextarea.placeholder = placeholders[tipo];
        }
        
        // Sugerir prioridad según el tipo
        if (tipo === 'error') {
            document.getElementById('prioridadMedia').checked = true;
        } else if (tipo === 'sugerencia' || tipo === 'mejora') {
            document.getElementById('prioridadBaja').checked = true;
        }
    }

    // Configurar validación
    function setupValidation() {
        // Validación del formulario completo
        formReporte.addEventListener('submit', function(e) {
            if (!validarFormulario()) {
                e.preventDefault();
            }
        });
    }

    // Validar asunto
    function validarAsunto() {
        const valor = asuntoInput.value.trim();
        
        if (valor.length === 0) {
            mostrarErrorCampo(asuntoInput, 'El asunto es obligatorio');
            return false;
        }
        
        if (valor.length < 5) {
            mostrarErrorCampo(asuntoInput, 'El asunto debe tener al menos 5 caracteres');
            return false;
        }
        
        limpiarErrorCampo(asuntoInput);
        return true;
    }

    // Validar reporte
    function validarReporte() {
        const valor = reporteTextarea.value.trim();
        
        if (valor.length === 0) {
            mostrarErrorCampo(reporteTextarea, 'La descripción es obligatoria');
            return false;
        }
        
        if (valor.length < 20) {
            mostrarErrorCampo(reporteTextarea, 'La descripción debe tener al menos 20 caracteres');
            return false;
        }
        
        limpiarErrorCampo(reporteTextarea);
        return true;
    }

    // Validar email
    function validarEmail() {
        const valor = emailInput.value.trim();
        
        // Email es opcional
        if (valor.length === 0) {
            limpiarErrorCampo(emailInput);
            return true;
        }
        
        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!emailRegex.test(valor)) {
            mostrarErrorCampo(emailInput, 'El formato del email no es válido');
            return false;
        }
        
        limpiarErrorCampo(emailInput);
        return true;
    }

    // Validar formulario completo
    function validarFormulario() {
        let esValido = true;
        
        // Validar tipo de reporte
        if (!tipoReporteSelect.value) {
            mostrarErrorCampo(tipoReporteSelect, 'Debe seleccionar un tipo de reporte');
            esValido = false;
        } else {
            limpiarErrorCampo(tipoReporteSelect);
        }
        
        // Validar asunto
        if (!validarAsunto()) {
            esValido = false;
        }
        
        // Validar reporte
        if (!validarReporte()) {
            esValido = false;
        }
        
        // Validar email
        if (!validarEmail()) {
            esValido = false;
        }
        
        return esValido;
    }

    // Enviar reporte
    function enviarReporte(event) {
        event.preventDefault();
        
        if (enviandoReporte) {
            return;
        }
        
        // Validar formulario
        if (!validarFormulario()) {
            mostrarMensajeError('Por favor, completa todos los campos correctamente');
            return;
        }
        
        // Obtener datos del formulario
        const datosReporte = obtenerDatosFormulario();
        
        // Confirmar envío
        if (!confirm('¿Estás seguro de enviar este reporte?')) {
            return;
        }
        
        // Mostrar estado de carga
        enviandoReporte = true;
        btnEnviar.disabled = true;
        btnEnviar.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Enviando...';
        
        // Simular envío al servidor
        setTimeout(() => {
            try {
                // Aquí iría la llamada real al backend
                console.log('Reporte enviado:', datosReporte);
                
                // Guardar en historial
                guardarEnHistorial(datosReporte);
                
                // Mostrar mensaje de éxito
                mostrarMensajeExito();
                
                // Limpiar formulario
                limpiarFormulario();
                
                // Actualizar historial
                actualizarHistorial();
                
            } catch (error) {
                console.error('Error al enviar reporte:', error);
                mostrarMensajeError('Ocurrió un error al enviar el reporte. Por favor, intenta nuevamente.');
            } finally {
                enviandoReporte = false;
                btnEnviar.disabled = false;
                btnEnviar.innerHTML = '<i class="bi bi-send"></i> Enviar Reporte';
            }
        }, 2000);
    }

    // Obtener datos del formulario
    function obtenerDatosFormulario() {
        const prioridad = document.querySelector('input[name="prioridad"]:checked').value;
        
        return {
            tipo: tipoReporteSelect.value,
            tipoTexto: tipoReporteSelect.options[tipoReporteSelect.selectedIndex].text,
            asunto: asuntoInput.value.trim(),
            descripcion: reporteTextarea.value.trim(),
            prioridad: prioridad,
            email: emailInput.value.trim() || null,
            fecha: new Date().toISOString(),
            usuario: document.querySelector('.navbar-text strong')?.textContent || 'Anónimo'
        };
    }

    // Guardar en historial
    function guardarEnHistorial(reporte) {
        // Agregar ID único
        reporte.id = Date.now();
        reporte.estado = 'pendiente';
        
        // Agregar al array
        reportesEnviados.unshift(reporte);
        
        // Limitar a 10 reportes
        if (reportesEnviados.length > 10) {
            reportesEnviados = reportesEnviados.slice(0, 10);
        }
        
        // Guardar en localStorage
        try {
            localStorage.setItem('reportesNUAM', JSON.stringify(reportesEnviados));
        } catch (e) {
            console.error('Error al guardar en localStorage:', e);
        }
    }

    // Cargar historial de reportes
    function cargarHistorialReportes() {
        try {
            const reportesGuardados = localStorage.getItem('reportesNUAM');
            if (reportesGuardados) {
                reportesEnviados = JSON.parse(reportesGuardados);
                actualizarHistorial();
            }
        } catch (e) {
            console.error('Error al cargar historial:', e);
        }
    }

    // Actualizar historial en la UI
    function actualizarHistorial() {
        if (!historialReportes) return;
        
        if (reportesEnviados.length === 0) {
            historialReportes.innerHTML = `
                <div class="list-group-item text-center text-muted py-4">
                    <i class="bi bi-inbox fs-3 d-block mb-2"></i>
                    No hay reportes previos
                </div>
            `;
            return;
        }
        
        historialReportes.innerHTML = '';
        
        reportesEnviados.forEach(reporte => {
            const item = crearItemHistorial(reporte);
            historialReportes.appendChild(item);
        });
    }

    // Crear item de historial
    function crearItemHistorial(reporte) {
        const div = document.createElement('div');
        div.className = 'list-group-item list-group-item-action';
        
        const fecha = new Date(reporte.fecha);
        const fechaFormateada = fecha.toLocaleDateString('es-CL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const badgeEstado = obtenerBadgeEstado(reporte.estado);
        const badgePrioridad = obtenerBadgePrioridad(reporte.prioridad);
        
        div.innerHTML = `
            <div class="d-flex w-100 justify-content-between align-items-start">
                <div class="flex-grow-1">
                    <h6 class="mb-1">
                        ${reporte.tipoTexto}
                        ${badgePrioridad}
                    </h6>
                    <p class="mb-1 fw-semibold">${reporte.asunto}</p>
                    <small class="text-muted">${reporte.descripcion.substring(0, 100)}${reporte.descripcion.length > 100 ? '...' : ''}</small>
                </div>
                <div class="text-end ms-3">
                    ${badgeEstado}
                    <small class="d-block text-muted mt-1">${fechaFormateada}</small>
                </div>
            </div>
        `;
        
        return div;
    }

    // Obtener badge de estado
    function obtenerBadgeEstado(estado) {
        const badges = {
            'pendiente': '<span class="badge bg-warning text-dark">Pendiente</span>',
            'en_revision': '<span class="badge bg-info">En Revisión</span>',
            'resuelto': '<span class="badge bg-success">Resuelto</span>',
            'cerrado': '<span class="badge bg-secondary">Cerrado</span>'
        };
        
        return badges[estado] || badges['pendiente'];
    }

    // Obtener badge de prioridad
    function obtenerBadgePrioridad(prioridad) {
        const badges = {
            'baja': '<span class="badge bg-success ms-2">Baja</span>',
            'media': '<span class="badge bg-warning text-dark ms-2">Media</span>',
            'alta': '<span class="badge bg-danger ms-2">Alta</span>'
        };
        
        return badges[prioridad] || '';
    }

    // Limpiar formulario
    function limpiarFormulario() {
        formReporte.reset();
        
        // Limpiar contadores
        contadorAsunto.textContent = '0';
        contadorReporte.textContent = '0';
        
        // Limpiar errores
        document.querySelectorAll('.is-invalid').forEach(el => {
            el.classList.remove('is-invalid');
        });
        
        document.querySelectorAll('.invalid-feedback').forEach(el => {
            el.remove();
        });
        
        // Ocultar mensajes
        ocultarMensajes();
        
        // Limpiar auto-guardado
        limpiarAutoGuardado();
    }

    // Mostrar mensaje de éxito
    function mostrarMensajeExito() {
        ocultarMensajes();
        
        mensajeConfirmacion.classList.remove('d-none');
        mensajeConfirmacion.classList.add('show');
        
        // Scroll al mensaje
        mensajeConfirmacion.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Auto-ocultar después de 5 segundos
        setTimeout(() => {
            mensajeConfirmacion.classList.remove('show');
            setTimeout(() => {
                mensajeConfirmacion.classList.add('d-none');
            }, 150);
        }, 5000);
    }

    // Mostrar mensaje de error
    function mostrarMensajeError(mensaje) {
        ocultarMensajes();
        
        textoError.textContent = mensaje;
        mensajeError.classList.remove('d-none');
        mensajeError.classList.add('show');
        
        // Scroll al mensaje
        mensajeError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Auto-ocultar después de 5 segundos
        setTimeout(() => {
            mensajeError.classList.remove('show');
            setTimeout(() => {
                mensajeError.classList.add('d-none');
            }, 150);
        }, 5000);
    }

    // Ocultar mensajes
    function ocultarMensajes() {
        mensajeConfirmacion.classList.remove('show');
        mensajeConfirmacion.classList.add('d-none');
        mensajeError.classList.remove('show');
        mensajeError.classList.add('d-none');
    }

    // Mostrar error en campo
    function mostrarErrorCampo(campo, mensaje) {
        limpiarErrorCampo(campo);
        
        campo.classList.add('is-invalid');
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'invalid-feedback';
        errorDiv.textContent = mensaje;
        
        campo.parentNode.appendChild(errorDiv);
    }

    // Limpiar error de campo
    function limpiarErrorCampo(campo) {
        campo.classList.remove('is-invalid');
        
        const errorDiv = campo.parentNode.querySelector('.invalid-feedback');
        if (errorDiv) {
            errorDiv.remove();
        }
    }

    // Configurar auto-guardado
    function setupAutoSave() {
        let autoSaveTimer;
        
        const campos = [tipoReporteSelect, asuntoInput, reporteTextarea, emailInput];
        
        campos.forEach(campo => {
            campo.addEventListener('input', function() {
                clearTimeout(autoSaveTimer);
                autoSaveTimer = setTimeout(() => {
                    guardarBorrador();
                }, 3000);
            });
        });
        
        // Cargar borrador al inicio
        cargarBorrador();
    }

    // Guardar borrador
    function guardarBorrador() {
        const borrador = {
            tipo: tipoReporteSelect.value,
            asunto: asuntoInput.value,
            descripcion: reporteTextarea.value,
            email: emailInput.value,
            prioridad: document.querySelector('input[name="prioridad"]:checked')?.value,
            fecha: new Date().toISOString()
        };
        
        try {
            localStorage.setItem('borradorReporteNUAM', JSON.stringify(borrador));
        } catch (e) {
            console.error('Error al guardar borrador:', e);
        }
    }

    // Cargar borrador
    function cargarBorrador() {
        try {
            const borradorGuardado = localStorage.getItem('borradorReporteNUAM');
            if (borradorGuardado) {
                const borrador = JSON.parse(borradorGuardado);
                
                // Verificar que el borrador no sea muy antiguo (más de 24 horas)
                const fechaBorrador = new Date(borrador.fecha);
                const ahora = new Date();
                const diferenciaHoras = (ahora - fechaBorrador) / (1000 * 60 * 60);
                
                if (diferenciaHoras < 24) {
                    // Preguntar si desea restaurar el borrador
                    if (confirm('Se encontró un borrador guardado. ¿Deseas restaurarlo?')) {
                        tipoReporteSelect.value = borrador.tipo || '';
                        asuntoInput.value = borrador.asunto || '';
                        reporteTextarea.value = borrador.descripcion || '';
                        emailInput.value = borrador.email || '';
                        
                        if (borrador.prioridad) {
                            const radioPrioridad = document.getElementById(`prioridad${borrador.prioridad.charAt(0).toUpperCase() + borrador.prioridad.slice(1)}`);
                            if (radioPrioridad) {
                                radioPrioridad.checked = true;
                            }
                        }
                        
                        // Actualizar contadores
                        contadorAsunto.textContent = asuntoInput.value.length;
                        contadorReporte.textContent = reporteTextarea.value.length;
                    } else {
                        limpiarAutoGuardado();
                    }
                } else {
                    limpiarAutoGuardado();
                }
            }
        } catch (e) {
            console.error('Error al cargar borrador:', e);
        }
    }

    // Limpiar auto-guardado
    function limpiarAutoGuardado() {
        try {
            localStorage.removeItem('borradorReporteNUAM');
        } catch (e) {
            console.error('Error al limpiar borrador:', e);
        }
    }

    // Prevenir pérdida de datos
    function onBeforeUnload(e) {
        const hayDatos = asuntoInput.value.trim() || reporteTextarea.value.trim();
        
        if (hayDatos && !enviandoReporte) {
            e.preventDefault();
            e.returnValue = '';
            return '';
        }
    }

    // Exportar funciones para uso externo
    window.Reportes = {
        enviarReporte,
        limpiarFormulario,
        cargarHistorial: cargarHistorialReportes
    };
});