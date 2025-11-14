/**
 * NUAM - Sistema de Calificación Tributaria
 * Archivo: calificacion.js
 * Descripción: Manejo de formulario de calificación y funcionalidades del navbar
 */

// ============================================
// INICIALIZACIÓN Y CONFIGURACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    inicializarFormulario();
    configurarNavbar();
    aplicarEstilosReadonly();
});

// ============================================
// FUNCIONES DE INICIALIZACIÓN
// ============================================

/**
 * Inicializa el formulario con valores por defecto
 */
function inicializarFormulario() {
    // Establecer año actual
    document.getElementById('anio').value = new Date().getFullYear();
    
    // Generar secuencia automática
    document.getElementById('secuencia').value = generarSecuencia();
    
    // Configurar event listeners del formulario
    configurarEventListeners();
}

/**
 * Configura todos los event listeners del formulario
 */
function configurarEventListeners() {
    // Auto-cálculo al cambiar instrumento
    document.getElementById('instrumento').addEventListener('blur', function() {
        calcularValorHistorico();
        calcularDividendo();
    });

    // Auto-cálculo al cambiar fecha
    document.getElementById('fecha').addEventListener('change', function() {
        calcularFactor();
        calcularDividendo();
    });

    // Limpiar mensajes de validación al escribir
    document.querySelectorAll('input[required]').forEach(input => {
        input.addEventListener('input', limpiarMensajeValidacion);
    });

    // Manejo del submit del formulario
    document.getElementById('calificacionForm').addEventListener('submit', manejarSubmit);

    // Manejo del botón cancelar
    document.getElementById('btnCancelar').addEventListener('click', manejarCancelacion);
}

// ============================================
// FUNCIONES DE CÁLCULO AUTOMÁTICO
// ============================================

/**
 * Genera una secuencia única para el evento
 * @returns {number} Número de secuencia generado
 */
function generarSecuencia() {
    const secuenciaBase = 100000807;
    const random = Math.floor(Math.random() * 1000);
    return secuenciaBase + random;
}

/**
 * Calcula el valor histórico basado en el instrumento ingresado
 */
function calcularValorHistorico() {
    const instrumento = document.getElementById('instrumento').value.trim();
    
    if (instrumento.length > 0) {
        // Simulación de cálculo (en producción vendría del backend/API)
        // Aquí podrías hacer una llamada AJAX para obtener el valor real
        const valor = (Math.random() * 100).toFixed(8);
        document.getElementById('valor').value = valor.replace('.', ',');
        
        console.log(`Valor histórico calculado para ${instrumento}: ${valor}`);
    }
}

/**
 * Calcula el factor de actualización según la fecha de pago
 */
function calcularFactor() {
    const fechaInput = document.getElementById('fecha').value;
    
    if (fechaInput) {
        const fechaPago = new Date(fechaInput);
        const anioActual = new Date().getFullYear();
        const diferencia = anioActual - fechaPago.getFullYear();
        
        // Fórmula de actualización (ajustar según lógica de negocio)
        // Factor = 1 + (diferencia de años * 5%)
        const factor = (1 + (diferencia * 0.05)).toFixed(4);
        document.getElementById('factor').value = factor;
        
        console.log(`Factor de actualización calculado: ${factor}`);
    }
}

/**
 * Calcula el dividendo basado en valor histórico y factor
 */
function calcularDividendo() {
    const valorStr = document.getElementById('valor').value.replace(',', '.');
    const valor = parseFloat(valorStr);
    const factor = parseFloat(document.getElementById('factor').value);
    
    if (!isNaN(valor) && !isNaN(factor) && valor > 0) {
        const dividendo = (valor * factor).toFixed(2);
        document.getElementById('dividendo').value = dividendo;
        
        console.log(`Dividendo calculado: ${dividendo}`);
    }
}

/**
 * Recalcula todos los valores automáticos
 */
function recalcularTodo() {
    calcularValorHistorico();
    calcularFactor();
    calcularDividendo();
}

// ============================================
// VALIDACIÓN Y ENVÍO DEL FORMULARIO
// ============================================

/**
 * Valida los campos requeridos del formulario
 * @returns {boolean} true si es válido, false si no
 */
function validarFormulario() {
    const instrumento = document.getElementById('instrumento').value.trim();
    const descripcion = document.getElementById('descripcion').value.trim();
    const fecha = document.getElementById('fecha').value;
    
    if (!instrumento || !descripcion || !fecha) {
        mostrarMensaje(
            'Por favor complete todos los campos requeridos.',
            'danger',
            'exclamation-triangle'
        );
        return false;
    }
    
    return true;
}

/**
 * Maneja el envío del formulario
 * @param {Event} e - Evento de submit
 */
function manejarSubmit(e) {
    e.preventDefault();
    
    // Validar formulario
    if (!validarFormulario()) {
        return;
    }
    
    // Recalcular todos los valores antes de enviar
    recalcularTodo();
    
    // Recopilar datos del formulario
    const formData = recopilarDatosFormulario();
    
    console.log('Datos del formulario:', formData);
    
    // Mostrar mensaje de éxito
    mostrarMensaje(
        '¡Calificación ingresada correctamente!',
        'success',
        'check-circle'
    );
    
    // En producción, aquí se enviaría al backend
    // enviarDatosAlBackend(formData);
    
    // Preguntar si desea ingresar otra calificación
    setTimeout(() => {
        confirmarNuevaCalificacion();
    }, 1500);
}

/**
 * Recopila todos los datos del formulario
 * @returns {Object} Objeto con todos los datos del formulario
 */
function recopilarDatosFormulario() {
    return {
        mercado: document.getElementById('mercado').value,
        instrumento: document.getElementById('instrumento').value.trim(),
        descripcion: document.getElementById('descripcion').value.trim(),
        fecha: document.getElementById('fecha').value,
        secuencia: document.getElementById('secuencia').value,
        dividendo: document.getElementById('dividendo').value,
        valor_historico: document.getElementById('valor').value,
        factor_actualizacion: document.getElementById('factor').value,
        anio: document.getElementById('anio').value,
        isfut: document.getElementById('isfut').checked
    };
}

/**
 * Envía los datos al backend (función placeholder)
 * @param {Object} datos - Datos del formulario
 */
function enviarDatosAlBackend(datos) {
    // Aquí iría la lógica real de envío
    // Ejemplo con fetch:
    /*
    fetch('/api/calificacion/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify(datos)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Respuesta del servidor:', data);
    })
    .catch(error => {
        console.error('Error:', error);
        mostrarMensaje('Error al guardar la calificación', 'danger', 'exclamation-circle');
    });
    */
}

/**
 * Obtiene el valor de una cookie (para CSRF token)
 * @param {string} name - Nombre de la cookie
 * @returns {string|null} Valor de la cookie
 */
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// ============================================
// MENSAJES Y NOTIFICACIONES
// ============================================

/**
 * Muestra un mensaje de validación o información
 * @param {string} texto - Texto del mensaje
 * @param {string} tipo - Tipo de alerta (success, danger, info, warning)
 * @param {string} icono - Nombre del icono de Bootstrap Icons
 */
function mostrarMensaje(texto, tipo, icono) {
    const mensaje = document.getElementById('mensajeValidacion');
    
    // Limpiar clases anteriores
    mensaje.classList.remove('d-none', 'alert-info', 'alert-success', 'alert-danger', 'alert-warning');
    
    // Aplicar nuevas clases
    mensaje.classList.add(`alert-${tipo}`);
    
    // Establecer contenido
    mensaje.innerHTML = `<i class="bi bi-${icono}"></i> ${texto}`;
    
    // Scroll suave al mensaje
    mensaje.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/**
 * Limpia el mensaje de validación
 */
function limpiarMensajeValidacion() {
    const mensaje = document.getElementById('mensajeValidacion');
    if (!mensaje.classList.contains('d-none')) {
        mensaje.classList.add('d-none');
    }
}

// ============================================
// FUNCIONES DE LIMPIEZA Y RESETEO
// ============================================

/**
 * Limpia completamente el formulario
 */
function limpiarFormulario() {
    const form = document.getElementById('calificacionForm');
    form.reset();
    
    // Restaurar valores automáticos
    document.getElementById('secuencia').value = generarSecuencia();
    document.getElementById('anio').value = new Date().getFullYear();
    document.getElementById('valor').value = '0,00000000';
    document.getElementById('factor').value = '0';
    document.getElementById('dividendo').value = '0';
    
    // Limpiar mensaje
    limpiarMensajeValidacion();
}

/**
 * Maneja la cancelación del formulario
 */
function manejarCancelacion() {
    if (confirm('¿Está seguro de que desea cancelar? Se perderán todos los datos ingresados.')) {
        limpiarFormulario();
        mostrarMensaje('Formulario cancelado', 'info', 'info-circle');
        
        setTimeout(() => {
            limpiarMensajeValidacion();
        }, 2000);
    }
}

/**
 * Confirma si el usuario desea ingresar otra calificación
 */
function confirmarNuevaCalificacion() {
    if (confirm('¿Desea ingresar otra calificación?')) {
        limpiarFormulario();
    } else {
        // Opcional: redirigir a otra página
        // window.location.href = '/dashboard/';
    }
}

// ============================================
// FUNCIONALIDADES DEL NAVBAR
// ============================================

/**
 * Configura las funcionalidades del navbar
 */
function configurarNavbar() {
    configurarBusqueda();
}

/**
 * Configura la funcionalidad de búsqueda
 */
function configurarBusqueda() {
    const searchForm = document.getElementById('searchForm');
    const searchInput = document.getElementById('searchInput');
    
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const query = searchInput.value.trim();
            
            if (query.length > 0) {
                realizarBusqueda(query);
            } else {
                alert('Por favor ingrese un término de búsqueda');
                searchInput.focus();
            }
        });
        
        // Búsqueda en tiempo real (opcional)
        searchInput.addEventListener('input', function() {
            const query = this.value.trim();
            
            if (query.length >= 3) {
                // Aquí podrías implementar sugerencias de búsqueda
                console.log('Buscando:', query);
            }
        });
    }
}

/**
 * Realiza una búsqueda
 * @param {string} query - Término de búsqueda
 */
function realizarBusqueda(query) {
    console.log('Búsqueda ejecutada:', query);
    
    // En producción, aquí harías una llamada al backend
    // Ejemplo:
    /*
    fetch(`/api/buscar/?q=${encodeURIComponent(query)}`)
        .then(response => response.json())
        .then(data => {
            mostrarResultadosBusqueda(data);
        })
        .catch(error => {
            console.error('Error en la búsqueda:', error);
        });
    */
    
    // Por ahora, mostramos un alert (reemplazar con lógica real)
    alert(`Buscando: "${query}"\n\nEsta funcionalidad se conectará con el backend.`);
}

/**
 * Muestra los resultados de búsqueda (placeholder)
 * @param {Array} resultados - Resultados de la búsqueda
 */
function mostrarResultadosBusqueda(resultados) {
    // Aquí implementarías la visualización de resultados
    console.log('Resultados:', resultados);
}

// ============================================
// ESTILOS Y UI
// ============================================

/**
 * Aplica estilos a los campos readonly
 */
function aplicarEstilosReadonly() {
    const readonlyFields = document.querySelectorAll('input[readonly]');
    
    readonlyFields.forEach(field => {
        field.style.cursor = 'not-allowed';
        field.title = 'Este campo se calcula automáticamente';
    });
}

// ============================================
// UTILIDADES
// ============================================

/**
 * Formatea un número como moneda chilena
 * @param {number} valor - Valor a formatear
 * @returns {string} Valor formateado
 */
function formatearMoneda(valor) {
    return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP'
    }).format(valor);
}

/**
 * Formatea una fecha al formato DD/MM/YYYY
 * @param {string} fecha - Fecha en formato ISO
 * @returns {string} Fecha formateada
 */
function formatearFecha(fecha) {
    const date = new Date(fecha);
    const dia = String(date.getDate()).padStart(2, '0');
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const anio = date.getFullYear();
    
    return `${dia}/${mes}/${anio}`;
}

/**
 * Valida un RUT chileno
 * @param {string} rut - RUT a validar
 * @returns {boolean} true si es válido
 */
function validarRUT(rut) {
    // Limpiar RUT
    rut = rut.replace(/[^0-9kK]/g, '');
    
    if (rut.length < 2) return false;
    
    const cuerpo = rut.slice(0, -1);
    const dv = rut.slice(-1).toUpperCase();
    
    // Calcular dígito verificador
    let suma = 0;
    let multiplo = 2;
    
    for (let i = cuerpo.length - 1; i >= 0; i--) {
        suma += multiplo * parseInt(cuerpo.charAt(i));
        multiplo = multiplo < 7 ? multiplo + 1 : 2;
    }
    
    const dvEsperado = 11 - (suma % 11);
    const dvCalculado = dvEsperado === 11 ? '0' : dvEsperado === 10 ? 'K' : String(dvEsperado);
    
    return dv === dvCalculado;
}

// ============================================
// EXPORTAR FUNCIONES (si se usa módulos ES6)
// ============================================

// Si estás usando módulos, puedes exportar las funciones que necesites
// export { generarSecuencia, calcularValorHistorico, validarRUT };