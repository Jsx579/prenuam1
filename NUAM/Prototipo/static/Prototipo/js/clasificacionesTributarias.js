// JavaScript para Clasificaciones Tributarias
document.addEventListener('DOMContentLoaded', function() {
    
    // Referencias a elementos del DOM
    const filtrosForm = document.getElementById('filtrosForm');
    const tablaResultados = document.getElementById('tablaResultados');
    const mercadoSelect = document.getElementById('mercado');
    const origenSelect = document.getElementById('origen');
    const corredorSelect = document.getElementById('corredor');
    const periodoSelect = document.getElementById('periodoComercial');
    const calificacionPendienteCheck = document.getElementById('calificacionPendiente');
    
    // Botones de acción
    const btnIngresar = document.querySelector('.btn-primary.btn-action');
    const btnModificar = document.querySelector('.btn-warning.btn-action');
    const btnEliminar = document.querySelector('.btn-danger.btn-action');
    const btnCopiar = document.querySelector('.btn-info.btn-action');
    const btnCargaFactor = document.querySelector('.btn-success.btn-action:first-of-type');
    const btnCargaMonto = document.querySelector('.btn-success.btn-action:last-of-type');
    const btnOpciones = document.querySelector('.btn-secondary.btn-action');
    
    // Filtros de tabla
    const filtrosTabla = document.querySelectorAll('.table-responsive input');
    
    // Variables de estado
    let datosOriginales = [];
    let datosFiltrados = [];
    let registroSeleccionado = null;
    let paginaActual = 1;
    let registrosPorPagina = 10;
    let ordenActual = { columna: null, direccion: 'asc' };
    
    // Datos de ejemplo (en producción vendrían del backend)
    const datosEjemplo = [
        {
            ejercicio: '2024',
            instrumento: 'JEEP',
            fechaPago: '2024-01-15',
            descripcion: 'JEEP - DIVIDENDO ORDINARIO',
            secuenciaEvento: '100000807',
            factorActual: '2024-01-20',
            factor08: '1250.50000000',
            factor09: '0.00000000',
            factor10: '0.00000000',
            factor11: '0.00000000',
            factor12: '0.00000000',
            mercado: 'ACCIONES',
            origen: 'NACIONAL',
            corredor: 'CORREDOR_1'
        },
        {
            ejercicio: '2024',
            instrumento: 'COPEC',
            fechaPago: '2024-02-20',
            descripcion: 'COPEC - DIVIDENDO ORDINARIO',
            secuenciaEvento: '100000808',
            factorActual: '2024-02-25',
            factor08: '6800.00000000',
            factor09: '0.00000000',
            factor10: '0.00000000',
            factor11: '0.00000000',
            factor12: '0.00000000',
            mercado: 'ACCIONES',
            origen: 'NACIONAL',
            corredor: 'CORREDOR_2'
        },
        {
            ejercicio: '2024',
            instrumento: 'CHILE',
            fechaPago: '2024-03-10',
            descripcion: 'CHILE - DIVIDENDO ORDINARIO',
            secuenciaEvento: '100000809',
            factorActual: '2024-03-15',
            factor08: '85.75000000',
            factor09: '0.00000000',
            factor10: '0.00000000',
            factor11: '0.00000000',
            factor12: '0.00000000',
            mercado: 'ACCIONES',
            origen: 'NACIONAL',
            corredor: 'CORREDOR_1'
        }
    ];
    
    // Inicialización
    init();

    function init() {
        setupEventListeners();
        setupTableFilters();
        setupPagination();
        setupKeyboardShortcuts();
        cargarDatosIniciales();
        configurarValidaciones();
    }

    // Configurar event listeners
    function setupEventListeners() {
        // Formulario de filtros
        filtrosForm.addEventListener('submit', realizarBusqueda);
        
        // Cambios en filtros principales
        mercadoSelect.addEventListener('change', onFiltroChange);
        origenSelect.addEventListener('change', onFiltroChange);
        corredorSelect.addEventListener('change', onFiltroChange);
        periodoSelect.addEventListener('change', onFiltroChange);
        calificacionPendienteCheck.addEventListener('change', onFiltroChange);
        
        // Botones de acción
        btnIngresar.addEventListener('click', ingresarNuevo);
        btnModificar.addEventListener('click', modificarSeleccionado);
        btnEliminar.addEventListener('click', eliminarSeleccionado);
        btnCopiar.addEventListener('click', copiarSeleccionado);
        btnCargaFactor.addEventListener('click', cargaPorFactor);
        btnCargaMonto.addEventListener('click', cargaPorMonto);
        btnOpciones.addEventListener('click', mostrarOpciones);
        
        // Eventos de tabla
        setupTableEvents();
    }

    // Configurar eventos de tabla
    function setupTableEvents() {
        // Click en encabezados para ordenar
        const encabezados = document.querySelectorAll('thead th');
        encabezados.forEach((th, index) => {
            th.style.cursor = 'pointer';
            th.addEventListener('click', () => ordenarPorColumna(index));
            
            // Agregar indicador visual
            th.innerHTML += ' <span class="sort-indicator"></span>';
        });
        
        // Click en filas para seleccionar
        document.addEventListener('click', function(e) {
            if (e.target.closest('#tablaResultados tr') && !e.target.closest('thead')) {
                seleccionarFila(e.target.closest('tr'));
            }
        });
        
        // Doble click para modificar
        document.addEventListener('dblclick', function(e) {
            if (e.target.closest('#tablaResultados tr') && !e.target.closest('thead')) {
                modificarSeleccionado();
            }
        });
    }

    // Configurar filtros de tabla
    function setupTableFilters() {
        filtrosTabla.forEach(input => {
            input.addEventListener('input', debounce(aplicarFiltrosTabla, 300));
            input.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    aplicarFiltrosTabla();
                }
            });
        });
    }

    // Manejar cambios en filtros principales
    function onFiltroChange() {
        // Auto-búsqueda cuando cambian los filtros principales
        if (datosOriginales.length > 0) {
            realizarBusqueda();
        }
        
        // Actualizar opciones dependientes
        actualizarOpcionesDependientes();
    }

    // Actualizar opciones dependientes
    function actualizarOpcionesDependientes() {
        const mercado = mercadoSelect.value;
        
        // Actualizar corredores según mercado
        if (mercado) {
            actualizarCorredores(mercado);
        }
        
        // Mostrar/ocultar campos específicos
        toggleCamposEspecificos(mercado);
    }

    // Actualizar lista de corredores
    function actualizarCorredores(mercado) {
        const corredoresPorMercado = {
            'ACCIONES': ['CORREDOR_1', 'CORREDOR_2', 'CORREDOR_3'],
            'RENTA_FIJA': ['CORREDOR_RF_1', 'CORREDOR_RF_2'],
            'DERIVADOS': ['CORREDOR_DER_1', 'CORREDOR_DER_2']
        };
        
        const corredores = corredoresPorMercado[mercado] || [];
        
        // Limpiar opciones actuales (excepto la primera)
        while (corredorSelect.children.length > 1) {
            corredorSelect.removeChild(corredorSelect.lastChild);
        }
        
        // Agregar nuevas opciones
        corredores.forEach(corredor => {
            const option = document.createElement('option');
            option.value = corredor;
            option.textContent = corredor.replace('_', ' ');
            corredorSelect.appendChild(option);
        });
    }

    // Mostrar/ocultar campos específicos
    function toggleCamposEspecificos(mercado) {
        // Lógica para mostrar campos específicos según el mercado
        const camposEspecificos = document.querySelectorAll('.campo-especifico');
        
        camposEspecificos.forEach(campo => {
            const mercadosPermitidos = campo.dataset.mercados?.split(',') || [];
            
            if (mercadosPermitidos.length === 0 || mercadosPermitidos.includes(mercado)) {
                campo.style.display = 'block';
            } else {
                campo.style.display = 'none';
            }
        });
    }

    // Realizar búsqueda
    function realizarBusqueda(event) {
        if (event) {
            event.preventDefault();
        }
        
        mostrarCargando(true);
        
        // Obtener valores de filtros
        const filtros = obtenerFiltros();
        
        // Simular llamada al backend
        setTimeout(() => {
            const resultados = filtrarDatos(datosEjemplo, filtros);
            mostrarResultados(resultados);
            mostrarCargando(false);
            
            showSuccessMessage(`Se encontraron ${resultados.length} registros`);
        }, 1000);
    }

    // Obtener valores de filtros
    function obtenerFiltros() {
        return {
            mercado: mercadoSelect.value,
            origen: origenSelect.value,
            corredor: corredorSelect.value,
            periodo: periodoSelect.value,
            calificacionPendiente: calificacionPendienteCheck.checked
        };
    }

    // Filtrar datos según criterios
    function filtrarDatos(datos, filtros) {
        return datos.filter(registro => {
            // Filtro por mercado
            if (filtros.mercado && registro.mercado !== filtros.mercado) {
                return false;
            }
            
            // Filtro por origen
            if (filtros.origen && registro.origen !== filtros.origen) {
                return false;
            }
            
            // Filtro por corredor
            if (filtros.corredor && registro.corredor !== filtros.corredor) {
                return false;
            }
            
            // Filtro por periodo
            if (filtros.periodo && registro.ejercicio !== filtros.periodo) {
                return false;
            }
            
            // Filtro por calificación pendiente
            if (filtros.calificacionPendiente) {
                // Lógica para determinar si está pendiente
                const esPendiente = parseFloat(registro.factor08) === 0;
                if (!esPendiente) {
                    return false;
                }
            }
            
            return true;
        });
    }

    // Mostrar resultados en tabla
    function mostrarResultados(datos) {
        datosOriginales = [...datos];
        datosFiltrados = [...datos];
        
        aplicarFiltrosTabla();
        actualizarEstadoBotones();
    }

    // Aplicar filtros de tabla
    function aplicarFiltrosTabla() {
        const filtros = obtenerFiltrosTabla();
        
        datosFiltrados = datosOriginales.filter(registro => {
            return Object.keys(filtros).every(campo => {
                if (!filtros[campo]) return true;
                
                const valor = registro[campo]?.toString().toLowerCase() || '';
                const filtro = filtros[campo].toLowerCase();
                
                // Para fechas, usar comparación exacta
                if (campo.includes('fecha') || campo.includes('Fecha')) {
                    return valor.includes(filtro);
                }
                
                // Para otros campos, usar búsqueda parcial
                return valor.includes(filtro);
            });
        });
        
        paginaActual = 1;
        renderizarTabla();
        actualizarPaginacion();
    }

    // Obtener filtros de tabla
    function obtenerFiltrosTabla() {
        const filtros = {};
        const campos = ['ejercicio', 'instrumento', 'fechaPago', 'descripcion', 'secuenciaEvento', 'factorActual', 'factor08', 'factor09', 'factor10', 'factor11', 'factor12'];
        
        filtrosTabla.forEach((input, index) => {
            if (input.value && campos[index]) {
                filtros[campos[index]] = input.value;
            }
        });
        
        return filtros;
    }

    // Renderizar tabla
    function renderizarTabla() {
        const tbody = tablaResultados;
        tbody.innerHTML = '';
        
        if (datosFiltrados.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="11" class="text-muted py-5">
                        <i class="bi bi-inbox fs-1 d-block mb-2"></i>
                        <span class="fs-5">No hay registros</span>
                        <br>
                        <small>Utilice los filtros para buscar información</small>
                    </td>
                </tr>
            `;
            return;
        }
        
        // Calcular registros para la página actual
        const inicio = (paginaActual - 1) * registrosPorPagina;
        const fin = inicio + registrosPorPagina;
        const registrosPagina = datosFiltrados.slice(inicio, fin);
        
        registrosPagina.forEach((registro, index) => {
            const tr = document.createElement('tr');
            tr.className = 'registro-fila';
            tr.dataset.index = inicio + index;
            
            tr.innerHTML = `
                <td>${registro.ejercicio}</td>
                <td class="fw-semibold text-primary">${registro.instrumento}</td>
                <td>${formatearFecha(registro.fechaPago)}</td>
                <td class="text-start">${registro.descripcion}</td>
                <td>${registro.secuenciaEvento}</td>
                <td>${formatearFecha(registro.factorActual)}</td>
                <td class="text-end">${formatearMonto(registro.factor08)}</td>
                <td class="text-end">${formatearMonto(registro.factor09)}</td>
                <td class="text-end">${formatearMonto(registro.factor10)}</td>
                <td class="text-end">${formatearMonto(registro.factor11)}</td>
                <td class="text-end">${formatearMonto(registro.factor12)}</td>
            `;
            
            // Agregar clases condicionales
            if (parseFloat(registro.factor08) > 0) {
                tr.classList.add('registro-con-factor');
            }
            
            if (index % 2 === 0) {
                tr.classList.add('registro-par');
            }
            
            tbody.appendChild(tr);
        });
    }

    // Seleccionar fila
    function seleccionarFila(fila) {
        // Remover selección anterior
        document.querySelectorAll('.registro-seleccionado').forEach(f => {
            f.classList.remove('registro-seleccionado');
        });
        
        // Seleccionar nueva fila
        fila.classList.add('registro-seleccionado');
        
        // Obtener datos del registro
        const index = parseInt(fila.dataset.index);
        registroSeleccionado = datosFiltrados[index];
        
        // Actualizar estado de botones
        actualizarEstadoBotones();
        
        // Mostrar información del registro seleccionado
        mostrarInfoRegistro(registroSeleccionado);
    }

    // Mostrar información del registro seleccionado
    function mostrarInfoRegistro(registro) {
        const info = `
            <div class="registro-info mt-2 p-2 bg-light rounded">
                <small class="text-muted">
                    <strong>Seleccionado:</strong> ${registro.instrumento} - ${registro.descripcion}
                    <span class="ms-2">
                        <i class="bi bi-calendar"></i> ${formatearFecha(registro.fechaPago)}
                    </span>
                </small>
            </div>
        `;
        
        // Remover info anterior
        const infoAnterior = document.querySelector('.registro-info');
        if (infoAnterior) {
            infoAnterior.remove();
        }
        
        // Agregar nueva info
        document.querySelector('.table-responsive').insertAdjacentHTML('afterend', info);
    }

    // Ordenar por columna
    function ordenarPorColumna(columnaIndex) {
        const campos = ['ejercicio', 'instrumento', 'fechaPago', 'descripcion', 'secuenciaEvento', 'factorActual', 'factor08', 'factor09', 'factor10', 'factor11', 'factor12'];
        const campo = campos[columnaIndex];
        
        if (!campo) return;
        
        // Determinar dirección de ordenamiento
        if (ordenActual.columna === columnaIndex) {
            ordenActual.direccion = ordenActual.direccion === 'asc' ? 'desc' : 'asc';
        } else {
            ordenActual.columna = columnaIndex;
            ordenActual.direccion = 'asc';
        }
        
        // Ordenar datos
        datosFiltrados.sort((a, b) => {
            let valorA = a[campo];
            let valorB = b[campo];
            
            // Convertir a números si es posible
            const numA = parseFloat(valorA);
            const numB = parseFloat(valorB);
            
            if (!isNaN(numA) && !isNaN(numB)) {
                valorA = numA;
                valorB = numB;
            }
            
            let resultado = 0;
            if (valorA < valorB) resultado = -1;
            if (valorA > valorB) resultado = 1;
            
            return ordenActual.direccion === 'desc' ? -resultado : resultado;
        });
        
        // Actualizar indicadores visuales
        actualizarIndicadoresOrden(columnaIndex);
        
        // Re-renderizar tabla
        paginaActual = 1;
        renderizarTabla();
        actualizarPaginacion();
    }

    // Actualizar indicadores de orden
    function actualizarIndicadoresOrden(columnaActiva) {
        const indicadores = document.querySelectorAll('.sort-indicator');
        
        indicadores.forEach((indicador, index) => {
            if (index === columnaActiva) {
                indicador.innerHTML = ordenActual.direccion === 'asc' ? ' ↑' : ' ↓';
                indicador.className = 'sort-indicator active';
            } else {
                indicador.innerHTML = '';
                indicador.className = 'sort-indicator';
            }
        });
    }

    // Configurar paginación
    function setupPagination() {
        const paginacion = document.querySelector('.pagination');
        
        paginacion.addEventListener('click', function(e) {
            e.preventDefault();
            
            const link = e.target.closest('.page-link');
            if (!link || link.parentNode.classList.contains('disabled')) return;
            
            const texto = link.textContent.trim();
            
            switch(texto) {
                case '«':
                    paginaActual = 1;
                    break;
                case '‹':
                    if (paginaActual > 1) paginaActual--;
                    break;
                case '›':
                    const totalPaginas = Math.ceil(datosFiltrados.length / registrosPorPagina);
                    if (paginaActual < totalPaginas) paginaActual++;
                    break;
                case '»':
                    paginaActual = Math.ceil(datosFiltrados.length / registrosPorPagina);
                    break;
                default:
                    const pagina = parseInt(texto);
                    if (!isNaN(pagina)) paginaActual = pagina;
            }
            
            renderizarTabla();
            actualizarPaginacion();
        });
    }

    // Actualizar paginación
    function actualizarPaginacion() {
        const totalPaginas = Math.ceil(datosFiltrados.length / registrosPorPagina);
        const paginacion = document.querySelector('.pagination');
        
        // Limpiar paginación actual
        paginacion.innerHTML = '';
        
        // Botón primera página
        const primera = crearBotonPagina('«', paginaActual === 1);
        paginacion.appendChild(primera);
        
        // Botón página anterior
        const anterior = crearBotonPagina('‹', paginaActual === 1);
        paginacion.appendChild(anterior);
        
        // Páginas numeradas
        const inicio = Math.max(1, paginaActual - 2);
        const fin = Math.min(totalPaginas, paginaActual + 2);
        
        for (let i = inicio; i <= fin; i++) {
            const boton = crearBotonPagina(i.toString(), false, i === paginaActual);
            paginacion.appendChild(boton);
        }
        
        // Botón página siguiente
        const siguiente = crearBotonPagina('›', paginaActual === totalPaginas || totalPaginas === 0);
        paginacion.appendChild(siguiente);
        
        // Botón última página
        const ultima = crearBotonPagina('»', paginaActual === totalPaginas || totalPaginas === 0);
        paginacion.appendChild(ultima);
    }

    // Crear botón de paginación
    function crearBotonPagina(texto, deshabilitado = false, activo = false) {
        const li = document.createElement('li');
        li.className = `page-item ${deshabilitado ? 'disabled' : ''} ${activo ? 'active' : ''}`;
        
        const a = document.createElement('a');
        a.className = 'page-link';
        a.href = '#';
        a.textContent = texto;
        
        li.appendChild(a);
        return li;
    }

    // Funciones de botones de acción
    function ingresarNuevo() {
        showInfoMessage('Redirigiendo a formulario de ingreso...');
        // window.location.href = '/ingreso-tributaria/';
    }

    function modificarSeleccionado() {
        if (!registroSeleccionado) {
            showWarningMessage('Debe seleccionar un registro para modificar');
            return;
        }
        
        showInfoMessage(`Modificando registro: ${registroSeleccionado.instrumento}`);
        // window.location.href = `/modificar-clasificacion/${registroSeleccionado.id}/`;
    }

    function eliminarSeleccionado() {
        if (!registroSeleccionado) {
            showWarningMessage('Debe seleccionar un registro para eliminar');
            return;
        }
        
        const mensaje = `¿Está seguro de eliminar el registro de ${registroSeleccionado.instrumento}?`;
        
        if (confirm(mensaje)) {
            mostrarCargando(true, 'Eliminando registro...');
            
            setTimeout(() => {
                // Simular eliminación
                const index = datosFiltrados.indexOf(registroSeleccionado);
                if (index > -1) {
                    datosFiltrados.splice(index, 1);
                    datosOriginales = datosOriginales.filter(r => r !== registroSeleccionado);
                }
                
                registroSeleccionado = null;
                renderizarTabla();
                actualizarPaginacion();
                actualizarEstadoBotones();
                mostrarCargando(false);
                
                showSuccessMessage('Registro eliminado correctamente');
            }, 1000);
        }
    }

    function copiarSeleccionado() {
        if (!registroSeleccionado) {
            showWarningMessage('Debe seleccionar un registro para copiar');
            return;
        }
        
        showInfoMessage(`Copiando registro: ${registroSeleccionado.instrumento}`);
        // Lógica para copiar registro
    }

    function cargaPorFactor() {
        showInfoMessage('Redirigiendo a carga por factor...');
        // window.location.href = '/carga-archivo/';
    }

    function cargaPorMonto() {
        showInfoMessage('Redirigiendo a carga por monto...');
        // window.location.href = '/carga-monto/';
    }

    function mostrarOpciones() {
        const opcionesModal = `
            <div class="modal fade" id="modalOpciones" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="bi bi-gear"></i> Opciones
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="list-group">
                                <button type="button" class="list-group-item list-group-item-action" onclick="exportarExcel()">
                                    <i class="bi bi-file-earmark-excel text-success"></i> Exportar a Excel
                                </button>
                                <button type="button" class="list-group-item list-group-item-action" onclick="exportarPDF()">
                                    <i class="bi bi-file-earmark-pdf text-danger"></i> Exportar a PDF
                                </button>
                                <button type="button" class="list-group-item list-group-item-action" onclick="configurarColumnas()">
                                    <i class="bi bi-columns-gap text-primary"></i> Configurar Columnas
                                </button>
                                <button type="button" class="list-group-item list-group-item-action" onclick="configurarFiltros()">
                                    <i class="bi bi-funnel text-info"></i> Configurar Filtros
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remover modal anterior si existe
        const modalAnterior = document.getElementById('modalOpciones');
        if (modalAnterior) {
            modalAnterior.remove();
        }
        
        // Agregar modal al DOM
        document.body.insertAdjacentHTML('beforeend', opcionesModal);
        
        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('modalOpciones'));
        modal.show();
    }

    // Configurar atajos de teclado
    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', function(e) {
            // Ctrl+F para enfocar búsqueda
            if (e.ctrlKey && e.key === 'f') {
                e.preventDefault();
                mercadoSelect.focus();
            }
            
            // Ctrl+N para nuevo registro
            if (e.ctrlKey && e.key === 'n') {
                e.preventDefault();
                ingresarNuevo();
            }
            
            // Ctrl+E para modificar
            if (e.ctrlKey && e.key === 'e') {
                e.preventDefault();
                modificarSeleccionado();
            }
            
            // Delete para eliminar
            if (e.key === 'Delete' && registroSeleccionado) {
                eliminarSeleccionado();
            }
            
            // Flechas para navegar registros
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                navegarRegistros(e.key === 'ArrowUp' ? -1 : 1);
                e.preventDefault();
            }
        });
    }

    // Navegar entre registros con teclado
    function navegarRegistros(direccion) {
        const filas = document.querySelectorAll('.registro-fila');
        const filaActual = document.querySelector('.registro-seleccionado');
        
        if (filas.length === 0) return;
        
        let indiceActual = -1;
        if (filaActual) {
            indiceActual = Array.from(filas).indexOf(filaActual);
        }
        
        const nuevoIndice = Math.max(0, Math.min(filas.length - 1, indiceActual + direccion));
        
        if (filas[nuevoIndice]) {
            seleccionarFila(filas[nuevoIndice]);
            filas[nuevoIndice].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    // Configurar validaciones
    function configurarValidaciones() {
        // Validación de periodo comercial
        periodoSelect.addEventListener('change', function() {
            const anoActual = new Date().getFullYear();
            const anoSeleccionado = parseInt(this.value);
            
            if (anoSeleccionado > anoActual) {
                showWarningMessage('Ha seleccionado un año futuro');
            }
        });
    }

    // Cargar datos iniciales
    function cargarDatosIniciales() {
        // Cargar datos de ejemplo al inicio
        datosOriginales = [...datosEjemplo];
        datosFiltrados = [...datosEjemplo];
        
        renderizarTabla();
        actualizarPaginacion();
        actualizarEstadoBotones();
    }

    // Actualizar estado de botones
    function actualizarEstadoBotones() {
        const haySeleccion = registroSeleccionado !== null;
        const hayDatos = datosFiltrados.length > 0;
        
        btnModificar.disabled = !haySeleccion;
        btnEliminar.disabled = !haySeleccion;
        btnCopiar.disabled = !haySeleccion;
        
        // Actualizar clases visuales
        [btnModificar, btnEliminar, btnCopiar].forEach(btn => {
            if (btn.disabled) {
                btn.classList.add('btn-disabled');
            } else {
                btn.classList.remove('btn-disabled');
            }
        });
    }

    // Funciones de utilidad
    function mostrarCargando(mostrar, mensaje = 'Cargando...') {
        const loadingDiv = document.getElementById('loading-overlay') || crearOverlayCarga();
        
        if (mostrar) {
            loadingDiv.querySelector('.loading-text').textContent = mensaje;
            loadingDiv.style.display = 'flex';
        } else {
            loadingDiv.style.display = 'none';
        }
    }

    function crearOverlayCarga() {
        const overlay = document.createElement('div');
        overlay.id = 'loading-overlay';
        overlay.innerHTML = `
            <div class="loading-content">
                <div class="spinner-border text-primary" role="status"></div>
                <div class="loading-text mt-2">Cargando...</div>
            </div>
        `;
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 255, 255, 0.8);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        `;
        
        document.body.appendChild(overlay);
        return overlay;
    }

    function formatearFecha(fecha) {
        if (!fecha) return '';
        
        const date = new Date(fecha);
        if (isNaN(date.getTime())) return fecha;
        
        return date.toLocaleDateString('es-CL');
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

    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
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

    function showInfoMessage(message) {
        showMessage(message, 'info');
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

    // Función global para limpiar filtros (mantener compatibilidad)
    window.limpiarFiltros = function() {
        filtrosForm.reset();
        
        // Limpiar también filtros de tabla
        filtrosTabla.forEach(input => {
            input.value = '';
        });
        
        // Resetear datos
        datosFiltrados = [...datosOriginales];
        paginaActual = 1;
        renderizarTabla();
        actualizarPaginacion();
        
        showInfoMessage('Filtros limpiados');
    };

    // Funciones globales para opciones
    window.exportarExcel = function() {
        showInfoMessage('Exportando a Excel...');
        // Lógica de exportación
    };

    window.exportarPDF = function() {
        showInfoMessage('Exportando a PDF...');
        // Lógica de exportación
    };

    window.configurarColumnas = function() {
        showInfoMessage('Configurando columnas...');
        // Lógica de configuración
    };

    window.configurarFiltros = function() {
        showInfoMessage('Configurando filtros...');
        // Lógica de configuración
    };

    // Exportar funciones para uso externo
    window.ClasificacionesTributarias = {
        realizarBusqueda,
        limpiarFiltros: window.limpiarFiltros,
        seleccionarRegistro: seleccionarFila,
        obtenerSeleccionado: () => registroSeleccionado
    };
});