// JavaScript para Ingreso de Calificaciones Tributarias
document.addEventListener('DOMContentLoaded', function() {
    
    // Referencias a elementos del DOM
    const form = document.getElementById('formIngreso');
    const mercadoSelect = document.getElementById('mercado');
    const instrumentoInput = document.getElementById('instrumento');
    const valorHistoricoInput = document.getElementById('valorHistorico');
    const fechaPagoInput = document.getElementById('fechaPago');
    const eventoCapitalSelect = document.getElementById('eventoCapital');
    const descripcionInput = document.getElementById('descripcion');
    const secuenciaEventoInput = document.getElementById('secuenciaEvento');
    const anoInput = document.getElementById('ano');
    const ingresosPorMontosCheckbox = document.getElementById('ingresosPorMontos');

    // Inicialización
    init();

    function init() {
        setupEventListeners();
        setupValidation();
        setupAutoComplete();
        generateSecuenciaEvento();
    }

    // Configurar event listeners
    function setupEventListeners() {
        // Cambio en mercado
        mercadoSelect.addEventListener('change', onMercadoChange);
        
        // Cambio en instrumento
        instrumentoInput.addEventListener('input', onInstrumentoChange);
        instrumentoInput.addEventListener('blur', validateInstrumento);
        
        // Cambio en evento capital
        eventoCapitalSelect.addEventListener('change', onEventoCapitalChange);
        
        // Cambio en fecha
        fechaPagoInput.addEventListener('change', onFechaChange);
        
        // Cambio en año
        anoInput.addEventListener('change', onAnoChange);
        
        // Checkbox ingresos por montos
        ingresosPorMontosCheckbox.addEventListener('change', onIngresosPorMontosChange);
        
        // Validación en tiempo real de campos numéricos
        setupNumericValidation();
        
        // Envío del formulario
        form.addEventListener('submit', onFormSubmit);
        
        // Botón cancelar
        const cancelBtn = document.querySelector('button[onclick="window.history.back()"]');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', onCancel);
        }
    }

    // Manejar cambio de mercado
    function onMercadoChange() {
        const mercado = mercadoSelect.value;
        
        // Limpiar campos dependientes
        instrumentoInput.value = '';
        descripcionInput.value = '';
        valorHistoricoInput.value = '';
        
        // Actualizar opciones de evento capital según mercado
        updateEventoCapitalOptions(mercado);
        
        // Generar nueva secuencia
        generateSecuenciaEvento();
        
        // Mostrar mensaje informativo
        showMercadoInfo(mercado);
    }

    // Actualizar opciones de evento capital
    function updateEventoCapitalOptions(mercado) {
        const eventoSelect = eventoCapitalSelect;
        eventoSelect.innerHTML = '<option value="">Seleccione...</option>';
        
        let opciones = [];
        
        switch(mercado) {
            case 'AC': // Acciones
                opciones = [
                    {value: 'DIV', text: 'Dividendo'},
                    {value: 'SPLIT', text: 'Split de Acciones'},
                    {value: 'BONUS', text: 'Acciones Liberadas'},
                    {value: 'DERECHO', text: 'Derechos de Suscripción'}
                ];
                break;
            case 'RF': // Renta Fija
                opciones = [
                    {value: 'INT', text: 'Interés'},
                    {value: 'AMOR', text: 'Amortización'},
                    {value: 'RESCATE', text: 'Rescate Anticipado'}
                ];
                break;
            case 'DER': // Derivados
                opciones = [
                    {value: 'VENC', text: 'Vencimiento'},
                    {value: 'EJERC', text: 'Ejercicio'},
                    {value: 'LIQUID', text: 'Liquidación'}
                ];
                break;
        }
        
        opciones.forEach(opcion => {
            const option = document.createElement('option');
            option.value = opcion.value;
            option.textContent = opcion.text;
            eventoSelect.appendChild(option);
        });
    }

    // Manejar cambio de instrumento
    function onInstrumentoChange() {
        const instrumento = instrumentoInput.value.toUpperCase();
        instrumentoInput.value = instrumento;
        
        // Auto-generar descripción si está vacía
        if (instrumento && !descripcionInput.value) {
            generateDescripcion(instrumento);
        }
        
        // Buscar valor histórico si existe
        searchValorHistorico(instrumento);
    }

    // Validar formato de instrumento
    function validateInstrumento() {
        const instrumento = instrumentoInput.value;
        const mercado = mercadoSelect.value;
        
        if (!instrumento) return;
        
        let isValid = true;
        let message = '';
        
        // Validaciones según mercado
        switch(mercado) {
            case 'AC':
                if (instrumento.length < 3 || instrumento.length > 6) {
                    isValid = false;
                    message = 'El código de acción debe tener entre 3 y 6 caracteres';
                }
                break;
            case 'RF':
                if (!/^[A-Z0-9]{4,8}$/.test(instrumento)) {
                    isValid = false;
                    message = 'El código de renta fija debe ser alfanumérico de 4-8 caracteres';
                }
                break;
        }
        
        if (!isValid) {
            showFieldError(instrumentoInput, message);
        } else {
            clearFieldError(instrumentoInput);
        }
        
        return isValid;
    }

    // Generar descripción automática
    function generateDescripcion(instrumento) {
        const mercado = mercadoSelect.value;
        let descripcion = '';
        
        switch(mercado) {
            case 'AC':
                descripcion = `${instrumento} ACC TXT`;
                break;
            case 'RF':
                descripcion = `${instrumento} BONO`;
                break;
            case 'DER':
                descripcion = `${instrumento} DERIVADO`;
                break;
            default:
                descripcion = instrumento;
        }
        
        descripcionInput.value = descripcion;
    }

    // Buscar valor histórico (simulado)
    function searchValorHistorico(instrumento) {
        // Simulación de búsqueda de valor histórico
        setTimeout(() => {
            const valores = {
                'JEEP': '1250.50',
                'COPEC': '6800.00',
                'CHILE': '85.75',
                'FALABELLA': '2150.25'
            };
            
            if (valores[instrumento]) {
                valorHistoricoInput.value = valores[instrumento];
                showSuccessMessage(`Valor histórico encontrado para ${instrumento}`);
            } else {
                valorHistoricoInput.value = '';
            }
        }, 500);
    }

    // Manejar cambio de evento capital
    function onEventoCapitalChange() {
        const evento = eventoCapitalSelect.value;
        
        // Actualizar campos según tipo de evento
        updateFieldsForEvento(evento);
    }

    // Actualizar campos según evento
    function updateFieldsForEvento(evento) {
        // Habilitar/deshabilitar campos de factores según el evento
        const factorInputs = document.querySelectorAll('input[name^="factor"]');
        
        switch(evento) {
            case 'DIV':
                // Para dividendos, habilitar factores específicos
                enableFactors(['factor08', 'factor10', 'factor17', 'factor19a']);
                break;
            case 'INT':
                // Para intereses, habilitar otros factores
                enableFactors(['factor11', 'factor13', 'factor20', 'factor22']);
                break;
            case 'AMOR':
                // Para amortización
                enableFactors(['factor14', 'factor16', 'factor23', 'factor25']);
                break;
            default:
                // Deshabilitar todos los factores
                factorInputs.forEach(input => {
                    input.disabled = true;
                    input.value = '';
                });
        }
    }

    // Habilitar factores específicos
    function enableFactors(factorNames) {
        const allFactors = document.querySelectorAll('input[name^="factor"]');
        
        // Deshabilitar todos primero
        allFactors.forEach(input => {
            input.disabled = true;
            input.value = '';
        });
        
        // Habilitar solo los especificados
        factorNames.forEach(name => {
            const input = document.querySelector(`input[name="${name}"]`);
            if (input) {
                input.disabled = false;
            }
        });
    }

    // Manejar cambio de fecha
    function onFechaChange() {
        const fecha = new Date(fechaPagoInput.value);
        const ano = fecha.getFullYear();
        
        if (ano && ano !== parseInt(anoInput.value)) {
            anoInput.value = ano;
            showInfoMessage(`Año actualizado automáticamente a ${ano}`);
        }
    }

    // Manejar cambio de año
    function onAnoChange() {
        generateSecuenciaEvento();
    }

    // Manejar checkbox ingresos por montos
    function onIngresosPorMontosChange() {
        const isChecked = ingresosPorMontosCheckbox.checked;
        const factorInputs = document.querySelectorAll('input[name^="factor"]');
        
        if (isChecked) {
            // Mostrar sección especial para ingresos por montos
            showIngresosMontoSection();
        } else {
            // Ocultar sección especial
            hideIngresosMontoSection();
        }
    }

    // Generar secuencia de evento
    function generateSecuenciaEvento() {
        const ano = anoInput.value || new Date().getFullYear();
        const mercado = mercadoSelect.value || 'AC';
        
        // Generar secuencia basada en año y mercado
        let base = 100000000;
        let increment = 0;
        
        switch(mercado) {
            case 'AC': increment = 800; break;
            case 'RF': increment = 900; break;
            case 'DER': increment = 700; break;
        }
        
        const secuencia = base + increment + parseInt(ano.toString().slice(-2));
        secuenciaEventoInput.value = secuencia;
    }

    // Configurar validación numérica
    function setupNumericValidation() {
        const numericInputs = document.querySelectorAll('input[name^="factor"]');
        
        numericInputs.forEach(input => {
            input.addEventListener('input', function() {
                // Permitir solo números y decimales
                this.value = this.value.replace(/[^0-9.,]/g, '');
                
                // Convertir comas a puntos
                this.value = this.value.replace(',', '.');
            });
            
            input.addEventListener('blur', function() {
                // Formatear número al perder el foco
                if (this.value) {
                    const num = parseFloat(this.value);
                    if (!isNaN(num)) {
                        this.value = num.toFixed(8);
                    }
                }
            });
        });
    }

    // Configurar autocompletado
    function setupAutoComplete() {
        // Lista de instrumentos comunes
        const instrumentosComunes = ['JEEP', 'COPEC', 'CHILE', 'FALABELLA', 'BANCO', 'ENTEL'];
        
        instrumentoInput.addEventListener('input', function() {
            const valor = this.value.toUpperCase();
            
            if (valor.length >= 2) {
                const sugerencias = instrumentosComunes.filter(inst => 
                    inst.startsWith(valor)
                );
                
                showSugerencias(sugerencias);
            }
        });
    }

    // Mostrar sugerencias
    function showSugerencias(sugerencias) {
        // Remover sugerencias anteriores
        const existingSuggestions = document.querySelector('.suggestions-list');
        if (existingSuggestions) {
            existingSuggestions.remove();
        }
        
        if (sugerencias.length === 0) return;
        
        const suggestionsList = document.createElement('div');
        suggestionsList.className = 'suggestions-list position-absolute bg-white border rounded shadow-sm';
        suggestionsList.style.zIndex = '1000';
        suggestionsList.style.width = instrumentoInput.offsetWidth + 'px';
        
        sugerencias.forEach(sugerencia => {
            const item = document.createElement('div');
            item.className = 'suggestion-item p-2 cursor-pointer';
            item.textContent = sugerencia;
            item.addEventListener('click', () => {
                instrumentoInput.value = sugerencia;
                suggestionsList.remove();
                onInstrumentoChange();
            });
            
            item.addEventListener('mouseenter', () => {
                item.classList.add('bg-light');
            });
            
            item.addEventListener('mouseleave', () => {
                item.classList.remove('bg-light');
            });
            
            suggestionsList.appendChild(item);
        });
        
        instrumentoInput.parentNode.style.position = 'relative';
        instrumentoInput.parentNode.appendChild(suggestionsList);
    }

    // Configurar validación del formulario
    function setupValidation() {
        // Validación en tiempo real
        const requiredFields = [mercadoSelect, instrumentoInput];
        
        requiredFields.forEach(field => {
            field.addEventListener('blur', validateField);
            field.addEventListener('input', clearFieldError);
        });
    }

    // Validar campo individual
    function validateField(event) {
        const field = event.target;
        const value = field.value.trim();
        
        if (field.hasAttribute('required') && !value) {
            showFieldError(field, 'Este campo es obligatorio');
            return false;
        }
        
        clearFieldError(field);
        return true;
    }

    // Mostrar error en campo
    function showFieldError(field, message) {
        clearFieldError(field);
        
        field.classList.add('is-invalid');
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'invalid-feedback';
        errorDiv.textContent = message;
        
        field.parentNode.appendChild(errorDiv);
    }

    // Limpiar error de campo
    function clearFieldError(field) {
        field.classList.remove('is-invalid');
        
        const errorDiv = field.parentNode.querySelector('.invalid-feedback');
        if (errorDiv) {
            errorDiv.remove();
        }
    }

    // Manejar envío del formulario
    function onFormSubmit(event) {
        event.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        // Mostrar confirmación
        if (confirm('¿Está seguro de que desea grabar esta calificación tributaria?')) {
            submitForm();
        }
    }

    // Validar formulario completo
    function validateForm() {
        let isValid = true;
        
        // Validar campos obligatorios
        if (!mercadoSelect.value) {
            showFieldError(mercadoSelect, 'Debe seleccionar un mercado');
            isValid = false;
        }
        
        if (!instrumentoInput.value.trim()) {
            showFieldError(instrumentoInput, 'Debe ingresar un instrumento');
            isValid = false;
        }
        
        // Validar formato de instrumento
        if (!validateInstrumento()) {
            isValid = false;
        }
        
        // Validar fecha
        if (!fechaPagoInput.value) {
            showFieldError(fechaPagoInput, 'Debe seleccionar una fecha de pago');
            isValid = false;
        }
        
        return isValid;
    }

    // Enviar formulario
    function submitForm() {
        showLoadingMessage('Guardando calificación tributaria...');
        
        // Simular envío al servidor
        setTimeout(() => {
            hideLoadingMessage();
            showSuccessMessage('Calificación tributaria guardada correctamente');
            
            // Opcional: limpiar formulario o redirigir
            // form.reset();
            // window.location.href = '/lista-calificaciones/';
        }, 2000);
    }

    // Manejar cancelación
    function onCancel(event) {
        event.preventDefault();
        
        if (hasUnsavedChanges()) {
            if (confirm('Hay cambios sin guardar. ¿Está seguro de que desea cancelar?')) {
                window.history.back();
            }
        } else {
            window.history.back();
        }
    }

    // Verificar cambios sin guardar
    function hasUnsavedChanges() {
        const inputs = form.querySelectorAll('input, select');
        
        for (let input of inputs) {
            if (input.type === 'checkbox') {
                if (input.checked !== input.defaultChecked) return true;
            } else {
                if (input.value !== input.defaultValue) return true;
            }
        }
        
        return false;
    }

    // Funciones de utilidad para mensajes
    function showMercadoInfo(mercado) {
        const messages = {
            'AC': 'Mercado de Acciones seleccionado',
            'RF': 'Mercado de Renta Fija seleccionado',
            'DER': 'Mercado de Derivados seleccionado'
        };
        
        if (messages[mercado]) {
            showInfoMessage(messages[mercado]);
        }
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
        alert.className = `alert alert-${type} alert-dismissible fade show alert-message`;
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        // Insertar al inicio del formulario
        form.insertBefore(alert, form.firstChild);
        
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
        loadingDiv.className = 'alert alert-info';
        loadingDiv.innerHTML = `
            <div class="d-flex align-items-center">
                <div class="spinner-border spinner-border-sm me-2" role="status"></div>
                ${message}
            </div>
        `;
        
        form.insertBefore(loadingDiv, form.firstChild);
    }

    function hideLoadingMessage() {
        const loadingDiv = document.getElementById('loading-message');
        if (loadingDiv) {
            loadingDiv.remove();
        }
    }

    // Funciones para sección de ingresos por montos
    function showIngresosMontoSection() {
        // Implementar lógica para mostrar campos adicionales
        console.log('Mostrando sección de ingresos por montos');
    }

    function hideIngresosMontoSection() {
        // Implementar lógica para ocultar campos adicionales
        console.log('Ocultando sección de ingresos por montos');
    }

    // Exportar funciones para uso externo si es necesario
    window.IngresoTributario = {
        validateForm,
        submitForm,
        generateSecuenciaEvento
    };
});