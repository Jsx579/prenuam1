// JavaScript para Carga de Archivos Tributarios
document.addEventListener('DOMContentLoaded', function() {
    
    // Referencias a elementos del DOM
    const archivoInput = document.getElementById('archivoInput');
    const tablaDatos = document.getElementById('tablaDatos');
    const estadoCarga = document.getElementById('estadoCarga');
    const btnCargar = document.querySelector('button[onclick="cargarArchivo()"]');
    const btnGrabar = document.querySelector('.btn-success');
    const btnCancelar = document.querySelector('.btn-secondary');
    const btnVerFormato = document.querySelector('.btn-info');
    
    // Variables de estado
    let datosArchivo = [];
    let archivoOriginal = null;
    let procesandoArchivo = false;
    
    // Configuración de formatos permitidos
    const formatosPermitidos = {
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel (.xlsx)',
        'application/vnd.ms-excel': 'Excel (.xls)',
        'text/csv': 'CSV',
        'application/csv': 'CSV'
    };
    
    // Columnas esperadas en el archivo
    const columnasEsperadas = [
        'EJERCICIO', 'MERCADO', 'NEMOTECNICO', 'FEC_PAGO', 'SEC_EVE', 
        'DESCRIPCION', 'F8_MONTO', 'F9_MONTO', 'F10_MONTO', 'F11_MONTO', 
        'F12_REX', 'F13_REX'
    ];
    
    // Inicialización
    init();

    function init() {
        setupEventListeners();
        setupDragAndDrop();
        setupValidation();
        initializeTable();
        setupKeyboardShortcuts();
    }

    // Configurar event listeners
    function setupEventListeners() {
        // Evento de cambio en el input de archivo
        archivoInput.addEventListener('change', onArchivoSeleccionado);
        
        // Botón cargar archivo
        btnCargar.addEventListener('click', procesarArchivo);
        
        // Botón grabar
        btnGrabar.addEventListener('click', grabarDatos);
        
        // Botón cancelar
        btnCancelar.addEventListener('click', cancelarOperacion);
        
        // Botón ver formato
        btnVerFormato.addEventListener('click', mostrarFormatoEjemplo);
        
        // Validación en tiempo real del archivo
        archivoInput.addEventListener('change', validarArchivoSeleccionado);
    }

    // Configurar drag and drop
    function setupDragAndDrop() {
        const dropZone = document.querySelector('.card-body');
        
        // Prevenir comportamiento por defecto
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, preventDefaults, false);
        });
        
        // Resaltar zona de drop
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, highlight, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, unhighlight, false);
        });
        
        // Manejar drop
        dropZone.addEventListener('drop', handleDrop, false);
        
        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        function highlight() {
            dropZone.classList.add('drag-highlight');
        }
        
        function unhighlight() {
            dropZone.classList.remove('drag-highlight');
        }
        
        function handleDrop(e) {
            const dt = e.dataTransfer;
            const files = dt.files;
            
            if (files.length > 0) {
                archivoInput.files = files;
                onArchivoSeleccionado();
            }
        }
    }

    // Manejar selección de archivo
    function onArchivoSeleccionado() {
        const archivo = archivoInput.files[0];
        
        if (!archivo) {
            limpiarTabla();
            return;
        }
        
        archivoOriginal = archivo;
        
        // Mostrar información del archivo
        mostrarInfoArchivo(archivo);
        
        // Validar archivo
        if (validarArchivo(archivo)) {
            habilitarBotonCargar(true);
            showSuccessMessage(`Archivo "${archivo.name}" seleccionado correctamente`);
        } else {
            habilitarBotonCargar(false);
        }
    }

    // Mostrar información del archivo
    function mostrarInfoArchivo(archivo) {
        const info = `
            <div class="archivo-info mt-2 p-2 bg-light rounded">
                <small class="text-muted">
                    <i class="bi bi-file-earmark"></i> 
                    <strong>${archivo.name}</strong> 
                    (${formatearTamano(archivo.size)}) - 
                    ${formatosPermitidos[archivo.type] || 'Formato no reconocido'}
                </small>
            </div>
        `;
        
        // Remover info anterior
        const infoAnterior = document.querySelector('.archivo-info');
        if (infoAnterior) {
            infoAnterior.remove();
        }
        
        // Agregar nueva info
        archivoInput.parentNode.insertAdjacentHTML('afterend', info);
    }

    // Validar archivo seleccionado
    function validarArchivoSeleccionado() {
        const archivo = archivoInput.files[0];
        
        if (!archivo) return true;
        
        return validarArchivo(archivo);
    }

    // Validar archivo
    function validarArchivo(archivo) {
        // Validar tipo de archivo
        if (!formatosPermitidos[archivo.type] && !archivo.name.toLowerCase().endsWith('.csv')) {
            showErrorMessage('Formato de archivo no permitido. Use Excel (.xlsx, .xls) o CSV');
            return false;
        }
        
        // Validar tamaño (máximo 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (archivo.size > maxSize) {
            showErrorMessage('El archivo es demasiado grande. Tamaño máximo: 10MB');
            return false;
        }
        
        // Validar nombre del archivo
        if (archivo.name.length > 100) {
            showErrorMessage('El nombre del archivo es demasiado largo');
            return false;
        }
        
        return true;
    }

    // Procesar archivo
    function procesarArchivo() {
        if (!archivoOriginal) {
            showErrorMessage('Por favor seleccione un archivo');
            return;
        }
        
        if (procesandoArchivo) {
            showWarningMessage('Ya se está procesando un archivo');
            return;
        }
        
        procesandoArchivo = true;
        mostrarEstadoCarga(true, 'Procesando archivo...');
        habilitarBotones(false);
        
        // Determinar tipo de archivo y procesar
        const extension = archivoOriginal.name.toLowerCase().split('.').pop();
        
        if (extension === 'csv') {
            procesarCSV(archivoOriginal);
        } else if (extension === 'xlsx' || extension === 'xls') {
            procesarExcel(archivoOriginal);
        } else {
            showErrorMessage('Formato de archivo no soportado');
            finalizarProcesamiento();
        }
    }

    // Procesar archivo CSV
    function procesarCSV(archivo) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const csv = e.target.result;
                const lineas = csv.split('\n');
                
                if (lineas.length < 2) {
                    throw new Error('El archivo CSV debe tener al menos una fila de encabezados y una de datos');
                }
                
                // Procesar encabezados
                const encabezados = lineas[0].split(',').map(h => h.trim().replace(/"/g, ''));
                
                // Validar encabezados
                if (!validarEncabezados(encabezados)) {
                    return;
                }
                
                // Procesar datos
                const datos = [];
                for (let i = 1; i < lineas.length; i++) {
                    const linea = lineas[i].trim();
                    if (linea) {
                        const valores = linea.split(',').map(v => v.trim().replace(/"/g, ''));
                        if (valores.length === encabezados.length) {
                            const fila = {};
                            encabezados.forEach((encabezado, index) => {
                                fila[encabezado] = valores[index];
                            });
                            datos.push(fila);
                        }
                    }
                }
                
                procesarDatos(datos);
                
            } catch (error) {
                showErrorMessage('Error al procesar CSV: ' + error.message);
                finalizarProcesamiento();
            }
        };
        
        reader.onerror = function() {
            showErrorMessage('Error al leer el archivo CSV');
            finalizarProcesamiento();
        };
        
        reader.readAsText(archivo);
    }

    // Procesar archivo Excel (simulado - requiere librería como SheetJS)
    function procesarExcel(archivo) {
        // Nota: En un entorno real, necesitarías una librería como SheetJS
        // Aquí simularemos el procesamiento
        
        setTimeout(() => {
            // Datos de ejemplo para simular la carga de Excel
            const datosEjemplo = [
                {
                    'EJERCICIO': '2024',
                    'MERCADO': 'AC',
                    'NEMOTECNICO': 'JEEP',
                    'FEC_PAGO': '2024-01-15',
                    'SEC_EVE': '100000807',
                    'DESCRIPCION': 'JEEP - DIVIDENDO ORDINARIO',
                    'F8_MONTO': '1250.50000000',
                    'F9_MONTO': '0.00000000',
                    'F10_MONTO': '0.00000000',
                    'F11_MONTO': '0.00000000',
                    'F12_REX': '0.00000000',
                    'F13_REX': '0.00000000'
                },
                {
                    'EJERCICIO': '2024',
                    'MERCADO': 'AC',
                    'NEMOTECNICO': 'COPEC',
                    'FEC_PAGO': '2024-02-20',
                    'SEC_EVE': '100000808',
                    'DESCRIPCION': 'COPEC - DIVIDENDO ORDINARIO',
                    'F8_MONTO': '6800.00000000',
                    'F9_MONTO': '0.00000000',
                    'F10_MONTO': '0.00000000',
                    'F11_MONTO': '0.00000000',
                    'F12_REX': '0.00000000',
                    'F13_REX': '0.00000000'
                }
            ];
            
            procesarDatos(datosEjemplo);
        }, 1500);
    }

    // Validar encabezados
    function validarEncabezados(encabezados) {
        const encabezadosNormalizados = encabezados.map(e => e.toUpperCase().replace(/\s+/g, '_'));
        const faltantes = [];
        
        columnasEsperadas.forEach(columna => {
            if (!encabezadosNormalizados.includes(columna)) {
                faltantes.push(columna);
            }
        });
        
        if (faltantes.length > 0) {
            showErrorMessage(`Columnas faltantes en el archivo: ${faltantes.join(', ')}`);
            finalizarProcesamiento();
            return false;
        }
        
        return true;
    }

    // Procesar datos cargados
    function procesarDatos(datos) {
        try {
            // Validar datos
            const datosValidados = validarDatos(datos);
            
            if (datosValidados.length === 0) {
                showWarningMessage('No se encontraron datos válidos en el archivo');
                finalizarProcesamiento();
                return;
            }
            
            // Almacenar datos
            datosArchivo = datosValidados;
            
            // Mostrar datos en la tabla
            mostrarDatosEnTabla(datosValidados);
            
            // Mostrar estadísticas
            mostrarEstadisticas(datosValidados);
            
            showSuccessMessage(`Archivo procesado correctamente. ${datosValidados.length} registros cargados.`);
            
            // Habilitar botón grabar
            btnGrabar.disabled = false;
            
        } catch (error) {
            showErrorMessage('Error al procesar los datos: ' + error.message);
        } finally {
            finalizarProcesamiento();
        }
    }

    // Validar datos
    function validarDatos(datos) {
        const datosValidos = [];
        const errores = [];
        
        datos.forEach((fila, index) => {
            const filaValidada = validarFila(fila, index + 1);
            if (filaValidada.valida) {
                datosValidos.push(filaValidada.datos);
            } else {
                errores.push(`Fila ${index + 1}: ${filaValidada.error}`);
            }
        });
        
        if (errores.length > 0 && errores.length < 10) {
            showWarningMessage(`Se encontraron errores en algunas filas:\n${errores.slice(0, 5).join('\n')}`);
        } else if (errores.length >= 10) {
            showWarningMessage(`Se encontraron ${errores.length} errores. Revise el formato del archivo.`);
        }
        
        return datosValidos;
    }

    // Validar fila individual
    function validarFila(fila, numeroFila) {
        const errores = [];
        
        // Validar ejercicio
        if (!fila.EJERCICIO || !/^\d{4}$/.test(fila.EJERCICIO)) {
            errores.push('Ejercicio inválido');
        }
        
        // Validar mercado
        if (!fila.MERCADO || !['AC', 'RF', 'DER'].includes(fila.MERCADO)) {
            errores.push('Mercado inválido');
        }
        
        // Validar nemotécnico
        if (!fila.NEMOTECNICO || fila.NEMOTECNICO.length < 3) {
            errores.push('Nemotécnico inválido');
        }
        
        // Validar fecha
        if (!fila.FEC_PAGO || !validarFecha(fila.FEC_PAGO)) {
            errores.push('Fecha de pago inválida');
        }
        
        // Validar montos numéricos
        const camposNumericos = ['F8_MONTO', 'F9_MONTO', 'F10_MONTO', 'F11_MONTO', 'F12_REX', 'F13_REX'];
        camposNumericos.forEach(campo => {
            if (fila[campo] && isNaN(parseFloat(fila[campo]))) {
                errores.push(`${campo} no es numérico`);
            }
        });
        
        if (errores.length > 0) {
            return {
                valida: false,
                error: errores.join(', ')
            };
        }
        
        return {
            valida: true,
            datos: fila
        };
    }

    // Validar fecha
    function validarFecha(fecha) {
        const formatosFecha = [
            /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
            /^\d{2}\/\d{2}\/\d{4}$/, // DD/MM/YYYY
            /^\d{2}-\d{2}-\d{4}$/ // DD-MM-YYYY
        ];
        
        return formatosFecha.some(formato => formato.test(fecha));
    }

    // Mostrar datos en tabla
    function mostrarDatosEnTabla(datos) {
        const tbody = tablaDatos.querySelector('tbody');
        tbody.innerHTML = '';
        
        if (datos.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="12" class="text-center text-muted py-5">
                        <i class="bi bi-inbox fs-1 d-block mb-2"></i>
                        <span class="fs-5">No hay registros</span>
                    </td>
                </tr>
            `;
            return;
        }
        
        datos.forEach((fila, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="text-center">${fila.EJERCICIO}</td>
                <td class="text-center">${fila.MERCADO}</td>
                <td class="text-center">${fila.NEMOTECNICO}</td>
                <td class="text-center">${formatearFecha(fila.FEC_PAGO)}</td>
                <td class="text-center">${fila.SEC_EVE}</td>
                <td>${fila.DESCRIPCION}</td>
                <td class="text-end">${formatearMonto(fila.F8_MONTO)}</td>
                <td class="text-end">${formatearMonto(fila.F9_MONTO)}</td>
                <td class="text-end">${formatearMonto(fila.F10_MONTO)}</td>
                <td class="text-end">${formatearMonto(fila.F11_MONTO)}</td>
                <td class="text-end">${formatearMonto(fila.F12_REX)}</td>
                <td class="text-end">${formatearMonto(fila.F13_REX)}</td>
            `;
            
            // Agregar clase para filas alternas
            if (index % 2 === 0) {
                tr.classList.add('table-row-even');
            }
            
            tbody.appendChild(tr);
        });
        
        // Agregar funcionalidad de scroll si hay muchos registros
        if (datos.length > 10) {
            tablaDatos.parentNode.style.maxHeight = '400px';
            tablaDatos.parentNode.style.overflowY = 'auto';
        }
    }

    // Mostrar estadísticas
    function mostrarEstadisticas(datos) {
        const estadisticas = calcularEstadisticas(datos);
        
        const estadisticasHtml = `
            <div class="estadisticas-archivo mt-3 p-3 bg-info bg-opacity-10 rounded">
                <h6 class="text-info mb-2">
                    <i class="bi bi-graph-up"></i> Estadísticas del archivo
                </h6>
                <div class="row">
                    <div class="col-md-3">
                        <small class="text-muted">Total registros:</small>
                        <div class="fw-bold">${estadisticas.totalRegistros}</div>
                    </div>
                    <div class="col-md-3">
                        <small class="text-muted">Mercados:</small>
                        <div class="fw-bold">${estadisticas.mercados.join(', ')}</div>
                    </div>
                    <div class="col-md-3">
                        <small class="text-muted">Ejercicios:</small>
                        <div class="fw-bold">${estadisticas.ejercicios.join(', ')}</div>
                    </div>
                    <div class="col-md-3">
                        <small class="text-muted">Total montos:</small>
                        <div class="fw-bold">$${estadisticas.totalMontos.toLocaleString()}</div>
                    </div>
                </div>
            </div>
        `;
        
        // Remover estadísticas anteriores
        const estadisticasAnteriores = document.querySelector('.estadisticas-archivo');
        if (estadisticasAnteriores) {
            estadisticasAnteriores.remove();
        }
        
        // Agregar nuevas estadísticas
        tablaDatos.parentNode.insertAdjacentHTML('afterend', estadisticasHtml);
    }

    // Calcular estadísticas
    function calcularEstadisticas(datos) {
        const mercados = [...new Set(datos.map(d => d.MERCADO))];
        const ejercicios = [...new Set(datos.map(d => d.EJERCICIO))];
        
        let totalMontos = 0;
        datos.forEach(fila => {
            ['F8_MONTO', 'F9_MONTO', 'F10_MONTO', 'F11_MONTO', 'F12_REX', 'F13_REX'].forEach(campo => {
                totalMontos += parseFloat(fila[campo]) || 0;
            });
        });
        
        return {
            totalRegistros: datos.length,
            mercados,
            ejercicios,
            totalMontos
        };
    }

    // Grabar datos
    function grabarDatos() {
        if (datosArchivo.length === 0) {
            showWarningMessage('No hay datos para grabar');
            return;
        }
        
        if (confirm(`¿Está seguro de grabar ${datosArchivo.length} registros?`)) {
            mostrarEstadoCarga(true, 'Grabando datos...');
            habilitarBotones(false);
            
            // Simular grabado
            setTimeout(() => {
                showSuccessMessage('Datos grabados correctamente');
                limpiarFormulario();
                finalizarProcesamiento();
            }, 2000);
        }
    }

    // Cancelar operación
    function cancelarOperacion() {
        if (datosArchivo.length > 0) {
            if (confirm('¿Está seguro de cancelar? Se perderán los datos cargados.')) {
                limpiarFormulario();
            }
        } else {
            limpiarFormulario();
        }
    }

    // Mostrar formato de ejemplo
    function mostrarFormatoEjemplo() {
        const formatoEjemplo = `
            <div class="modal fade" id="modalFormato" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="bi bi-file-earmark-text"></i> Formato de Archivo Requerido
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <h6>Columnas requeridas:</h6>
                            <div class="table-responsive">
                                <table class="table table-sm table-bordered">
                                    <thead class="table-light">
                                        <tr>
                                            <th>Columna</th>
                                            <th>Descripción</th>
                                            <th>Ejemplo</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr><td>EJERCICIO</td><td>Año del ejercicio</td><td>2024</td></tr>
                                        <tr><td>MERCADO</td><td>Código del mercado</td><td>AC, RF, DER</td></tr>
                                        <tr><td>NEMOTECNICO</td><td>Código del instrumento</td><td>JEEP, COPEC</td></tr>
                                        <tr><td>FEC_PAGO</td><td>Fecha de pago</td><td>2024-01-15</td></tr>
                                        <tr><td>SEC_EVE</td><td>Secuencia del evento</td><td>100000807</td></tr>
                                        <tr><td>DESCRIPCION</td><td>Descripción del evento</td><td>DIVIDENDO ORDINARIO</td></tr>
                                        <tr><td>F8_MONTO</td><td>Factor 8 - Monto</td><td>1250.50000000</td></tr>
                                        <tr><td>F9_MONTO</td><td>Factor 9 - Monto</td><td>0.00000000</td></tr>
                                        <tr><td>F10_MONTO</td><td>Factor 10 - Monto</td><td>0.00000000</td></tr>
                                        <tr><td>F11_MONTO</td><td>Factor 11 - Monto</td><td>0.00000000</td></tr>
                                        <tr><td>F12_REX</td><td>Factor 12 - REX</td><td>0.00000000</td></tr>
                                        <tr><td>F13_REX</td><td>Factor 13 - REX</td><td>0.00000000</td></tr>
                                    </tbody>
                                </table>
                            </div>
                            <div class="alert alert-info">
                                <i class="bi bi-info-circle"></i>
                                <strong>Notas importantes:</strong>
                                <ul class="mb-0 mt-2">
                                    <li>El archivo debe tener encabezados en la primera fila</li>
                                    <li>Las fechas deben estar en formato YYYY-MM-DD</li>
                                    <li>Los montos deben ser numéricos con punto decimal</li>
                                    <li>Tamaño máximo del archivo: 10MB</li>
                                </ul>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-primary" onclick="descargarPlantilla()">
                                <i class="bi bi-download"></i> Descargar Plantilla
                            </button>
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remover modal anterior si existe
        const modalAnterior = document.getElementById('modalFormato');
        if (modalAnterior) {
            modalAnterior.remove();
        }
        
        // Agregar modal al DOM
        document.body.insertAdjacentHTML('beforeend', formatoEjemplo);
        
        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('modalFormato'));
        modal.show();
    }

    // Configurar validación
    function setupValidation() {
        // Validación del input de archivo
        archivoInput.addEventListener('change', function() {
            const archivo = this.files[0];
            if (archivo && !validarArchivo(archivo)) {
                this.value = '';
            }
        });
    }

    // Inicializar tabla
    function initializeTable() {
        // Agregar funcionalidad de ordenamiento a los encabezados
        const encabezados = tablaDatos.querySelectorAll('th');
        encabezados.forEach((th, index) => {
            th.style.cursor = 'pointer';
            th.addEventListener('click', () => ordenarTabla(index));
        });
    }

    // Ordenar tabla
    function ordenarTabla(columna) {
        if (datosArchivo.length === 0) return;
        
        const tbody = tablaDatos.querySelector('tbody');
        const filas = Array.from(tbody.querySelectorAll('tr'));
        
        filas.sort((a, b) => {
            const valorA = a.cells[columna].textContent.trim();
            const valorB = b.cells[columna].textContent.trim();
            
            // Intentar comparación numérica
            const numA = parseFloat(valorA.replace(/[,$]/g, ''));
            const numB = parseFloat(valorB.replace(/[,$]/g, ''));
            
            if (!isNaN(numA) && !isNaN(numB)) {
                return numA - numB;
            }
            
            // Comparación alfabética
            return valorA.localeCompare(valorB);
        });
        
        // Limpiar tbody y agregar filas ordenadas
        tbody.innerHTML = '';
        filas.forEach(fila => tbody.appendChild(fila));
    }

    // Configurar atajos de teclado
    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', function(e) {
            // Ctrl+O para abrir archivo
            if (e.ctrlKey && e.key === 'o') {
                e.preventDefault();
                archivoInput.click();
            }
            
            // Ctrl+S para grabar
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                if (!btnGrabar.disabled) {
                    grabarDatos();
                }
            }
            
            // Escape para cancelar
            if (e.key === 'Escape') {
                cancelarOperacion();
            }
        });
    }

    // Funciones de utilidad
    function mostrarEstadoCarga(mostrar, mensaje = 'Procesando...') {
        if (mostrar) {
            estadoCarga.textContent = mensaje;
            estadoCarga.classList.remove('d-none');
        } else {
            estadoCarga.classList.add('d-none');
        }
    }

    function habilitarBotonCargar(habilitar) {
        btnCargar.disabled = !habilitar;
    }

    function habilitarBotones(habilitar) {
        btnCargar.disabled = !habilitar;
        btnGrabar.disabled = !habilitar;
        btnCancelar.disabled = !habilitar;
    }

    function finalizarProcesamiento() {
        procesandoArchivo = false;
        mostrarEstadoCarga(false);
        habilitarBotones(true);
        
        if (datosArchivo.length === 0) {
            btnGrabar.disabled = true;
        }
    }

    function limpiarFormulario() {
        archivoInput.value = '';
        datosArchivo = [];
        archivoOriginal = null;
        limpiarTabla();
        
        // Remover información del archivo
        const archivoInfo = document.querySelector('.archivo-info');
        if (archivoInfo) {
            archivoInfo.remove();
        }
        
        // Remover estadísticas
        const estadisticas = document.querySelector('.estadisticas-archivo');
        if (estadisticas) {
            estadisticas.remove();
        }
        
        btnGrabar.disabled = true;
    }

    function limpiarTabla() {
        const tbody = tablaDatos.querySelector('tbody');
        tbody.innerHTML = `
            <tr>
                <td colspan="12" class="text-center text-muted py-5">
                    <i class="bi bi-inbox fs-1 d-block mb-2"></i>
                    <span class="fs-5">No hay registros</span>
                </td>
            </tr>
        `;
    }

    function formatearTamano(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function formatearFecha(fecha) {
        if (!fecha) return '';
        
        // Si ya está en formato correcto, devolverla
        if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
            return fecha;
        }
        
        // Convertir otros formatos
        const date = new Date(fecha);
        if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
        }
        
        return fecha;
    }

    function formatearMonto(monto) {
        if (!monto || monto === '0.00000000') return '0.00';
        
        const num = parseFloat(monto);
        if (isNaN(num)) return monto;
        
        return num.toLocaleString('es-CL', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 8
        });
    }

    // Funciones de mensajes
    function showSuccessMessage(message) {
        showMessage(message, 'success');
    }

    function showErrorMessage(message) {
        showMessage(message, 'danger');
    }

    function showWarningMessage(message) {
        showMessage(message, 'warning');
    }

    function showMessage(message, type) {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        alert.style.top = '20px';
        alert.style.right = '20px';
        alert.style.zIndex = '9999';
        alert.style.maxWidth = '400px';
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(alert);
        
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, 5000);
    }

    // Función global para descargar plantilla
    window.descargarPlantilla = function() {
        const csvContent = columnasEsperadas.join(',') + '\n' +
                          '2024,AC,JEEP,2024-01-15,100000807,JEEP - DIVIDENDO ORDINARIO,1250.50000000,0.00000000,0.00000000,0.00000000,0.00000000,0.00000000';
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'plantilla_carga_tributaria.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    };

    // Función global para cargar archivo (mantener compatibilidad)
    window.cargarArchivo = procesarArchivo;

    // Exportar funciones para uso externo
    window.CargaArchivo = {
        procesarArchivo,
        grabarDatos,
        limpiarFormulario,
        validarArchivo
    };
});