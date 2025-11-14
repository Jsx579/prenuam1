// Función de búsqueda en la tabla
document.getElementById('searchInput').addEventListener('keyup', function() {
    const searchValue = this.value.toLowerCase();
    const tableRows = document.querySelectorAll('#tablaBody tr');
    
    tableRows.forEach(row => {
        const text = row.textContent.toLowerCase();
        if (text.includes(searchValue)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
});

// Función para copiar la tabla al portapapeles
function copiarTabla() {
    const table = document.getElementById('formatoTabla');
    const range = document.createRange();
    range.selectNode(table);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
    
    try {
        document.execCommand('copy');
        mostrarNotificacion('Tabla copiada al portapapeles', 'success');
    } catch (err) {
        mostrarNotificacion('Error al copiar la tabla', 'danger');
    }
    
    window.getSelection().removeAllRanges();
}

// Función para exportar a Excel (simulación)
function exportarExcel() {
    mostrarNotificacion('Descargando plantilla Excel...', 'info');
    
    // Aquí iría la lógica real de exportación
    // Por ahora solo mostramos una notificación
    setTimeout(() => {
        mostrarNotificacion('Plantilla descargada exitosamente', 'success');
    }, 1500);
}

// Función para mostrar notificaciones
function mostrarNotificacion(mensaje, tipo) {
    // Crear el elemento de notificación
    const notificacion = document.createElement('div');
    notificacion.className = `alert alert-${tipo} alert-dismissible fade show position-fixed`;
    notificacion.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notificacion.innerHTML = `
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notificacion);
    
    // Auto-eliminar después de 3 segundos
    setTimeout(() => {
        notificacion.remove();
    }, 3000);
}

// Resaltar fila al pasar el mouse
document.querySelectorAll('#tablaBody tr').forEach(row => {
    row.addEventListener('mouseenter', function() {
        this.style.backgroundColor = '#f8f9fa';
    });
    
    row.addEventListener('mouseleave', function() {
        this.style.backgroundColor = '';
    });
});
