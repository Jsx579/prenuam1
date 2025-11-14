// JavaScript para Modificar Calificaciones Tributarias
document.addEventListener('DOMContentLoaded', function() {
    
    // Referencias a elementos del DOM
    const form = document.getElementById('formModificar');
    const mercadoInput = document.getElementById('mercado');
    const instrumentoInput = document.getElementById('instrumento');
    const valorHistoricoInput = document.getElementById('valorHistorico');
    const fechaPagoInput = document.getElementById('fechaPago');
    const eventoCapitalInput = document.getElementById('eventoCapital');
    const descripcionInput = document.getElementById('descripcion');
    const secuenciaEventoInput = document.getElementById('secuenciaEvento');
    const anoInput = document.getElementById('ano');

    // Almacenar valores originales para detectar cambios
    let valoresOriginales = {};
    
    // Inicialización
    init();

    function init() {
        almacenarValoresOriginales();
        setupEventListeners();
        setupValidation();
        setupFactorValidation();
        setupAutoSave();
        highlightModifiedFields();
    }

    // Almacenar valores originales del formulario
    function almacenarValoresOriginales() {
        const inputs = form.querySelectorAll('input');
        inputs.forEach(input => {
            valoresOriginales[input.name] = input.value;
        });
    }

    // Configurar event listeners
    function setupEventListeners() {
        // Eventos para campos principales
        instrumentoInput.addEventListener('input', onInstrumentoChange);
        instrumentoInput.addEventListener('blur', validateInstrumento);
        
        valorHistoricoInput.addEventListener('input', formatNumericInput);
        valorHistoricoInput.addEventListener('blur', validateValorHistorico);
        
        fechaPagoInput.addEventListener('change', onFechaChange);
        
        eventoCapitalInput.addEventListener('input', onEventoCapitalChange);
        eventoCapitalInput.addEventListener('blur', validateEventoCapital);
        
        descripcionInput.addEventListener('input', onDescripcionChange);
        
        secuenciaEventoInput.addEventListener('input', formatNumericInput);
        secuenciaEventoInput.addEventListener('blur', validateSecuenciaEvento);
        
        anoInput.addEventListener('input', onAnoChange);
        anoInput.addEventListener('blur', validateAno);
        
        // Eventos para factores
        setupFactorEvents();
        
        // Evento de envío del formulario
        form.addEventListener('submit', onFormSubmit);
        
        // Detectar cambios para resaltar campos modificados
        form.addEventListener('input', detectarCambios);
        
        // Botón cancelar
        const cancelBtn = document.querySelector('button[onclick="window.history.back()"]');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', onCancel);
        }

        // Atajos de teclado
        setupKeyboardShortcuts();
    }

    // Configurar eventos para factores
    function setupFactorEvents() {
        const factorInputs = document.querySelectorAll('input[id^="factor"]');
        
        factorInputs.forEach(input => {
            input.addEventListener('input', function() {
                formatFactorInput(this);
                calculateRelatedFactors(this);
            });
            
            input.addEventListener('blur', function() {
                validateFactor(this);
                updateFactorSummary();
            });
            
            input.addEventListener('focus', function() {
                showFactorHelp(this);
            });
        });
    }

    // Manejar cambio de instrumento
    function onInstrumentoChange() {
        const instrumento = instrumentoInput.value.toUpperCase();
        instrumentoInput.value = instrumento;
        
        // Actualizar descripción si está vacía o es genérica
        if (!descripcionInput.value || descripcionInput.value.includes('DIVIDENDO DE PRUEBA')) {
            generateDescripcion(instrumento);
        }
        
        // Buscar información histórica del instrumento
        searchInstrumentoInfo(instrumento);
        
        markFieldAsModified(instrumentoInput);
    }

    // Validar instrumento
    function validateInstrumento() {
        const instrumento = instrumentoInput.value.trim();
        
        if (!instrumento) {
            showFieldError(instrumentoInput, 'El instrumento es obligatorio');
            return false;
        }
        
        if (instrumento.length < 3 || instrumento.length > 8) {
            showFieldError(instrumentoInput, 'El instrumento debe tener entre 3 y 8 caracteres');
            return false;
        }
        
        if (!/^[A-Z0-9]+$/.test(instrumento)) {
            showFieldError(instrumentoInput, 'El instrumento solo puede contener letras y números');
            return false;
        }
        
        clearFieldError(instrumentoInput);
        return true;
    }

    // Generar descripción automática
    function generateDescripcion(instrumento) {
        const mercado = mercadoInput.value;
        const eventoCapital = eventoCapitalInput.value;
        
        let descripcion = '';
        
        if (eventoCapital === '0' || !eventoCapital) {
            descripcion = `${instrumento} - DIVIDENDO`;
        } else {
            switch(eventoCapital) {
                case '1':
                    descripcion = `${instrumento} - INTERÉS`;
                    break;
                case '2':
                    descripcion = `${instrumento} - AMORTIZACIÓN`;
                    break;
                case '3':
                    descripcion = `${instrumento} - SPLIT`;
                    break;
                default:
                    descripcion = `${instrumento} - EVENTO ${eventoCapital}`;
            }
        }
        
        descripcionInput.value = descripcion;
        markFieldAsModified(descripcionInput);
    }

    // Buscar información del instrumento
    function searchInstrumentoInfo(instrumento) {
        // Simulación de búsqueda de información histórica
        const instrumentosConocidos = {
            'FROWARD': {
                valorHistorico: '1250.50000000',
                descripcion: 'FROWARD - ACCIÓN ORDINARIA'
            },
            'COPEC': {
                valorHistorico: '6800.00000000',
                descripcion: 'COPEC - ACCIÓN ORDINARIA'
            },
            'CHILE': {
                valorHistorico: '85.75000000',
                descripcion: 'CHILE - ACCIÓN ORDINARIA'
            }
        };
        
        if (instrumentosConocidos[instrumento]) {
            const info = instrumentosConocidos[instrumento];
            
            if (!valorHistoricoInput.value || valorHistoricoInput.value === '0.00000000') {
                valorHistoricoInput.value = info.valorHistorico;
                markFieldAsModified(valorHistoricoInput);
            }
            
            showSuccessMessage(`Información encontrada para ${instrumento}`);
        }
    }

    // Formatear entrada numérica
    function formatNumericInput(event) {
        const input = event.target;
        let value = input.value;
        
        // Permitir solo números, puntos y comas
        value = value.replace(/[^0-9.,]/g, '');
        
        // Convertir comas a puntos
        value = value.replace(',', '.');
        
        input.value = value;
    }

    // Validar valor histórico
    function validateValorHistorico() {
        const valor = parseFloat(valorHistoricoInput.value);
        
        if (isNaN(valor)) {
            showFieldError(valorHistoricoInput, 'Debe ingresar un valor numérico válido');
            return false;
        }
        
        if (valor < 0) {
            showFieldError(valorHistoricoInput, 'El valor histórico no puede ser negativo');
            return false;
        }
        
        // Formatear a 8 decimales
        valorHistoricoInput.value = valor.toFixed(8);
        clearFieldError(valorHistoricoInput);
        markFieldAsModified(valorHistoricoInput);
        return true;
    }

    // Manejar cambio de fecha
    function onFechaChange() {
        const fecha = new Date(fechaPagoInput.value);
        const ano = fecha.getFullYear();
        
        if (ano && ano.toString() !== anoInput.value) {
            anoInput.value = ano.toString();
            markFieldAsModified(anoInput);
            showInfoMessage(`Año actualizado automáticamente a ${ano}`);
        }
        
        // Validar que la fecha no sea futura
        const hoy = new Date();
        if (fecha > hoy) {
            showFieldWarning(fechaPagoInput, 'La fecha de pago es futura');
        } else {
            clearFieldError(fechaPagoInput);
        }
        
        markFieldAsModified(fechaPagoInput);
    }

    // Manejar cambio de evento capital
    function onEventoCapitalChange() {
        const evento = eventoCapitalInput.value;
        
        // Actualizar descripción basada en el evento
        if (instrumentoInput.value) {
            generateDescripcion(instrumentoInput.value);
        }
        
        // Sugerir factores relevantes según el evento
        suggestRelevantFactors(evento);
        
        markFieldAsModified(eventoCapitalInput);
    }

    // Validar evento capital
    function validateEventoCapital() {
        const evento = eventoCapitalInput.value;
        
        if (evento && !/^\d+$/.test(evento)) {
            showFieldError(eventoCapitalInput, 'El evento capital debe ser numérico');
            return false;
        }
        
        clearFieldError(eventoCapitalInput);
        return true;
    }

    // Sugerir factores relevantes
    function suggestRelevantFactors(evento) {
        const factorSuggestions = {
            '0': ['factor16', 'factor17', 'factor19'], // Dividendo
            '1': ['factor11', 'factor13', 'factor20'], // Interés
            '2': ['factor14', 'factor16', 'factor23'], // Amortización
            '3': ['factor17', 'factor19', 'factor25']  // Split
        };
        
        const sugeridos = factorSuggestions[evento];
        if (sugeridos) {
            highlightSuggestedFactors(sugeridos);
            showInfoMessage(`Factores sugeridos para este evento: ${sugeridos.join(', ')}`);
        }
    }

    // Resaltar factores sugeridos
    function highlightSuggestedFactors(factorIds) {
        // Remover resaltado anterior
        document.querySelectorAll('.factor-suggested').forEach(el => {
            el.classList.remove('factor-suggested');
        });
        
        // Agregar resaltado a factores sugeridos
        factorIds.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.classList.add('factor-suggested');
            }
        });
    }

    // Manejar cambio de descripción
    function onDescripcionChange() {
        markFieldAsModified(descripcionInput);
    }

    // Validar secuencia evento
    function validateSecuenciaEvento() {
        const secuencia = secuenciaEventoInput.value;
        
        if (secuencia && !/^\d+(\.\d+)?$/.test(secuencia)) {
            showFieldError(secuenciaEventoInput, 'La secuencia debe ser numérica');
            return false;
        }
        
        clearFieldError(secuenciaEventoInput);
        return true;
    }

    // Manejar cambio de año
    function onAnoChange() {
        const ano = parseInt(anoInput.value);
        const anoActual = new Date().getFullYear();
        
        if (ano && (ano < 2000 || ano > anoActual + 5)) {
            showFieldWarning(anoInput, `Año fuera del rango esperado (2000-${anoActual + 5})`);
        } else {
            clearFieldError(anoInput);
        }
        
        markFieldAsModified(anoInput);
    }

    // Validar año
    function validateAno() {
        const ano = anoInput.value;
        
        if (ano && (!/^\d{4}$/.test(ano) || parseInt(ano) < 1900 || parseInt(ano) > 2100)) {
            showFieldError(anoInput, 'Debe ingresar un año válido (1900-2100)');
            return false;
        }
        
        clearFieldError(anoInput);
        return true;
    }

    // Formatear entrada de factor
    function formatFactorInput(input) {
        let value = input.value;
        
        // Permitir solo números, puntos y comas
        value = value.replace(/[^0-9.,-]/g, '');
        
        // Convertir comas a puntos
        value = value.replace(',', '.');
        
        input.value = value;
        markFieldAsModified(input);
    }

    // Calcular factores relacionados
    function calculateRelatedFactors(input) {
        const factorId = input.id;
        const value = parseFloat(input.value) || 0;
        
        // Lógica para calcular factores relacionados
        switch(factorId) {
            case 'factor16':
                // Si factor 16 cambia, puede afectar factor 17
                if (value > 0) {
                    const factor17 = document.getElementById('factor17');
                    if (factor17 && parseFloat(factor17.value) === 0) {
                        factor17.value = (value * 0.1).toFixed(8);
                        markFieldAsModified(factor17);
                    }
                }
                break;
                
            case 'factor20':
                // Factor 20 y 21 son complementarios
                const factor21 = document.getElementById('factor21');
                if (factor21 && value > 0) {
                    factor21.value = (1 - value).toFixed(8);
                    markFieldAsModified(factor21);
                }
                break;
        }
    }

    // Validar factor individual
    function validateFactor(input) {
        const value = parseFloat(input.value);
        
        if (input.value && isNaN(value)) {
            showFieldError(input, 'Debe ingresar un valor numérico válido');
            return false;
        }
        
        if (value < 0) {
            showFieldError(input, 'El factor no puede ser negativo');
            return false;
        }
        
        if (value > 1 && !input.id.includes('35') && !input.id.includes('36')) {
            // Algunos factores pueden ser > 1 (como TEF y TEX)
            showFieldWarning(input, 'Valor mayor a 1, verifique si es correcto');
        }
        
        // Formatear a 8 decimales
        if (input.value) {
            input.value = value.toFixed(8);
        }
        
        clearFieldError(input);
        return true;
    }

    // Actualizar resumen de factores
    function updateFactorSummary() {
        const factorInputs = document.querySelectorAll('input[id^="factor"]');
        let totalFactors = 0;
        let nonZeroFactors = 0;
        
        factorInputs.forEach(input => {
            const value = parseFloat(input.value) || 0;
            totalFactors += value;
            if (value !== 0) nonZeroFactors++;
        });
        
        // Mostrar resumen en consola o en un elemento dedicado
        console.log(`Factores activos: ${nonZeroFactors}, Total: ${totalFactors.toFixed(8)}`);
    }

    // Mostrar ayuda para factor
    function showFactorHelp(input) {
        const factorId = input.id;
        const helpTexts = {
            'factor08': 'Factor para crédito por IDPC generados desde 2017',
            'factor16': 'Factor principal para ingresos no constitutivos de renta',
            'factor17': 'Factor para devolución de capital según Art. 17',
            'factor19': 'Factor para ingresos no constitutivos de renta general'
        };
        
        if (helpTexts[factorId]) {
            showTooltip(input, helpTexts[factorId]);
        }
    }

    // Configurar validación del formulario
    function setupValidation() {
        const requiredFields = [instrumentoInput, fechaPagoInput];
        
        requiredFields.forEach(field => {
            field.addEventListener('blur', validateField);
        });
    }

    // Configurar validación de factores
    function setupFactorValidation() {
        const factorInputs = document.querySelectorAll('input[id^="factor"]');
        
        factorInputs.forEach(input => {
            input.addEventListener('blur', function() {
                validateFactor(this);
            });
        });
    }

    // Configurar auto-guardado
    function setupAutoSave() {
        let autoSaveTimer;
        
        form.addEventListener('input', function() {
            clearTimeout(autoSaveTimer);
            autoSaveTimer = setTimeout(() => {
                if (hasUnsavedChanges()) {
                    autoSave();
                }
            }, 30000); // Auto-guardar cada 30 segundos
        });
    }

    // Auto-guardado
    function autoSave() {
        if (validateForm(false)) {
            showInfoMessage('Guardado automático realizado');
            // Aquí iría la lógica de guardado automático
            console.log('Auto-guardado realizado');
        }
    }

    // Detectar cambios en el formulario
    function detectarCambios() {
        const inputs = form.querySelectorAll('input');
        let hayCambios = false;
        
        inputs.forEach(input => {
            if (input.value !== valoresOriginales[input.name]) {
                hayCambios = true;
                markFieldAsModified(input);
            }
        });
        
        // Actualizar estado del botón guardar
        const saveBtn = document.querySelector('button[type="submit"]');
        if (saveBtn) {
            saveBtn.disabled = !hayCambios;
        }
    }

    // Marcar campo como modificado
    function markFieldAsModified(field) {
        field.classList.add('field-modified');
        
        // Agregar indicador visual
        if (!field.parentNode.querySelector('.modified-indicator')) {
            const indicator = document.createElement('span');
            indicator.className = 'modified-indicator text-warning ms-1';
            indicator.innerHTML = '<i class="bi bi-pencil-fill"></i>';
            indicator.title = 'Campo modificado';
            field.parentNode.appendChild(indicator);
        }
    }

    // Resaltar campos modificados
    function highlightModifiedFields() {
        const style = document.createElement('style');
        style.textContent = `
            .field-modified {
                border-left: 3px solid #ffc107 !important;
                background-color: #fff3cd !important;
            }
            .factor-suggested {
                border-left: 3px solid #0d6efd !important;
                background-color: #cff4fc !important;
            }
            .modified-indicator {
                font-size: 0.8rem;
            }
        `;
        document.head.appendChild(style);
    }

    // Configurar atajos de teclado
    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', function(e) {
            // Ctrl+S para guardar
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                if (validateForm()) {
                    form.submit();
                }
            }
            
            // Ctrl+Z para deshacer último cambio
            if (e.ctrlKey && e.key === 'z') {
                e.preventDefault();
                undoLastChange();
            }
            
            // Escape para cancelar
            if (e.key === 'Escape') {
                onCancel(e);
            }
        });
    }

    // Deshacer último cambio
    function undoLastChange() {
        const modifiedFields = document.querySelectorAll('.field-modified');
        if (modifiedFields.length > 0) {
            const lastField = modifiedFields[modifiedFields.length - 1];
            const fieldName = lastField.name;
            
            if (valoresOriginales[fieldName] !== undefined) {
                lastField.value = valoresOriginales[fieldName];
                lastField.classList.remove('field-modified');
                
                const indicator = lastField.parentNode.querySelector('.modified-indicator');
                if (indicator) {
                    indicator.remove();
                }
                
                showInfoMessage('Último cambio deshecho');
            }
        }
    }

    // Validar campo individual
    function validateField(event) {
        const field = event.target;
        
        switch(field.id) {
            case 'instrumento':
                return validateInstrumento();
            case 'valorHistorico':
                return validateValorHistorico();
            case 'eventoCapital':
                return validateEventoCapital();
            case 'secuenciaEvento':
                return validateSecuenciaEvento();
            case 'ano':
                return validateAno();
            default:
                if (field.id.startsWith('factor')) {
                    return validateFactor(field);
                }
                return true;
        }
    }

    // Manejar envío del formulario
    function onFormSubmit(event) {
        event.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        // Mostrar confirmación
        const changedFields = document.querySelectorAll('.field-modified').length;
        const message = `¿Está seguro de guardar los cambios? (${changedFields} campos modificados)`;
        
        if (confirm(message)) {
            submitForm();
        }
    }

    // Validar formulario completo
    function validateForm(showMessages = true) {
        let isValid = true;
        const errors = [];
        
        // Validar campos principales
        if (!validateInstrumento()) {
            isValid = false;
            errors.push('Instrumento inválido');
        }
        
        if (!validateValorHistorico()) {
            isValid = false;
            errors.push('Valor histórico inválido');
        }
        
        if (!validateEventoCapital()) {
            isValid = false;
            errors.push('Evento capital inválido');
        }
        
        if (!validateSecuenciaEvento()) {
            isValid = false;
            errors.push('Secuencia evento inválida');
        }
        
        if (!validateAno()) {
            isValid = false;
            errors.push('Año inválido');
        }
        
        // Validar factores
        const factorInputs = document.querySelectorAll('input[id^="factor"]');
        factorInputs.forEach(input => {
            if (!validateFactor(input)) {
                isValid = false;
                errors.push(`Factor ${input.id} inválido`);
            }
        });
        
        if (!isValid && showMessages) {
            showErrorMessage('Errores de validación: ' + errors.join(', '));
        }
        
        return isValid;
    }

    // Enviar formulario
    function submitForm() {
        showLoadingMessage('Guardando modificaciones...');
        
        // Simular envío al servidor
        setTimeout(() => {
            hideLoadingMessage();
            showSuccessMessage('Calificación tributaria modificada correctamente');
            
            // Actualizar valores originales
            almacenarValoresOriginales();
            
            // Limpiar indicadores de modificación
            document.querySelectorAll('.field-modified').forEach(field => {
                field.classList.remove('field-modified');
            });
            
            document.querySelectorAll('.modified-indicator').forEach(indicator => {
                indicator.remove();
            });
            
            // Opcional: redirigir o mantener en la página
            // window.location.href = '/lista-calificaciones/';
        }, 2000);
    }

    // Manejar cancelación
    function onCancel(event) {
        event.preventDefault();
        
        if (hasUnsavedChanges()) {
            const changedFields = document.querySelectorAll('.field-modified').length;
            const message = `Hay ${changedFields} campos modificados sin guardar. ¿Está seguro de cancelar?`;
            
            if (confirm(message)) {
                window.history.back();
            }
        } else {
            window.history.back();
        }
    }

    // Verificar cambios sin guardar
    function hasUnsavedChanges() {
        const inputs = form.querySelectorAll('input');
        
        for (let input of inputs) {
            if (input.value !== valoresOriginales[input.name]) {
                return true;
            }
        }
        
        return false;
    }

    // Funciones de utilidad para mensajes y UI
    function showFieldError(field, message) {
        clearFieldError(field);
        
        field.classList.add('is-invalid');
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'invalid-feedback';
        errorDiv.textContent = message;
        
        field.parentNode.appendChild(errorDiv);
    }

    function showFieldWarning(field, message) {
        clearFieldError(field);
        
        field.classList.add('is-warning');
        
        const warningDiv = document.createElement('div');
        warningDiv.className = 'warning-feedback text-warning small';
        warningDiv.textContent = message;
        
        field.parentNode.appendChild(warningDiv);
    }

    function clearFieldError(field) {
        field.classList.remove('is-invalid', 'is-warning');
        
        const errorDiv = field.parentNode.querySelector('.invalid-feedback');
        if (errorDiv) errorDiv.remove();
        
        const warningDiv = field.parentNode.querySelector('.warning-feedback');
        if (warningDiv) warningDiv.remove();
    }

    function showSuccessMessage(message) {
        showMessage(message, 'success');
    }

    function showInfoMessage(message) {
        showMessage(message, 'info');
    }

    function showErrorMessage(message) {
        showMessage(message, 'danger');
    }

    function showMessage(message, type) {
        // Remover mensajes anteriores
        const existingAlert = document.querySelector('.alert-message');
        if (existingAlert) {
            existingAlert.remove();
        }
        
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show alert-message position-fixed`;
        alert.style.top = '20px';
        alert.style.right = '20px';
        alert.style.zIndex = '9999';
        alert.style.maxWidth = '400px';
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(alert);
        
        // Auto-ocultar después de 5 segundos
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, 5000);
    }

    function showLoadingMessage(message) {
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'loading-message';
        loadingDiv.className = 'alert alert-info position-fixed';
        loadingDiv.style.top = '20px';
        loadingDiv.style.right = '20px';
        loadingDiv.style.zIndex = '9999';
        loadingDiv.innerHTML = `
            <div class="d-flex align-items-center">
                <div class="spinner-border spinner-border-sm me-2" role="status"></div>
                ${message}
            </div>
        `;
        
        document.body.appendChild(loadingDiv);
    }

    function hideLoadingMessage() {
        const loadingDiv = document.getElementById('loading-message');
        if (loadingDiv) {
            loadingDiv.remove();
        }
    }

    function showTooltip(element, message) {
        // Implementar tooltip personalizado
        const tooltip = document.createElement('div');
        tooltip.className = 'custom-tooltip';
        tooltip.textContent = message;
        tooltip.style.cssText = `
            position: absolute;
            background: #333;
            color: white;
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 12px;
            z-index: 1000;
            max-width: 200px;
        `;
        
        document.body.appendChild(tooltip);
        
        const rect = element.getBoundingClientRect();
        tooltip.style.left = rect.left + 'px';
        tooltip.style.top = (rect.bottom + 5) + 'px';
        
        setTimeout(() => {
            if (tooltip.parentNode) {
                tooltip.remove();
            }
        }, 3000);
    }

    // Exportar funciones para uso externo
    window.ModificarClasificaciones = {
        validateForm,
        submitForm,
        hasUnsavedChanges,
        autoSave
    };
});