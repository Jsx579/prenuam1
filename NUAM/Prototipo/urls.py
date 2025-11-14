from django.urls import path
from .views import( home, inicioSesion, cargaArchivo, bienvenida, clasificacionesTributarias, ingresoTribuatariaria, inicioSesionAuditor,  registroUsuario, registroAuditor,cerrarSesion,
    panel_administrador,panel_auditor,panel_corredor,
    usuario_crear,usuario_editar, usuario_eliminar, visualizarTributaria, modificarClasificaciones,
    calificacion_crear, calificacion_factores_editar,
    calificacion_revisar, panel_reportes, generar_reporte_calificaciones_csv, generar_reporte_logs_csv, reportes, formato_archivo)


urlpatterns = [
    path('Clasificacion/', home, name='Clasificacion'),
    path('InicioSesion/', inicioSesion, name='InicioSesion'),
    path('CargaArchivo/', cargaArchivo, name='CargaArchivo'),
    path('Bienvenida/', bienvenida, name='Bienvenida'),
    path('ClasificacionesTributarias/', clasificacionesTributarias, name='ClasificacionesTributarias'),
    path('Reportes/', reportes, name='Reportes'),
    
    path('InicioSesionAuditor/', inicioSesionAuditor, name='InicioSesionAuditor'),
    path('RegistroUsuario/', registroUsuario, name='RegistroUsuario'),
    path('RegistroAuditor/', registroAuditor, name='RegistroAuditor'),
    path('VisualizarTributaria/', visualizarTributaria, name='VisualizarTributaria'),
    path('ModificarClasificaciones/', modificarClasificaciones, name='ModificarClasificaciones'),

    path('CerrarSesion/', cerrarSesion, name='CerrarSesion'),
    path('PanelAdministrador/', panel_administrador, name='PanelAdministrador'),
    path('PanelAuditor/', panel_auditor, name='PanelAuditor'),
    path('PanelCorredor/', panel_corredor, name='PanelCorredor'),

    # CRUD Usuario
    path('PanelAdministrador/crear/', usuario_crear, name='UsuarioCrear'),
    path('PanelAdministrador/editar/<int:id_usuario>/', usuario_editar, name='UsuarioEditar'),
    path('PanelAdministrador/eliminar/<int:id_usuario>/', usuario_eliminar, name='UsuarioEliminar'),

    # CRUD Calificaciones
    path('IngresoTributaria/', calificacion_crear, name='IngresoCalificacionesTributarias'),
    path('PanelCorredor/factores/editar/<int:pk>/', calificacion_factores_editar, name='CalificacionFactoresEditar'),
    
    #Auditor
    path('PanelAuditor/revisar/<int:pk>/', calificacion_revisar, name='CalificacionRevisar'),
    path('PanelAuditor/Reportes/', panel_reportes, name='PanelReportes'),
    path('PanelAuditor/Reportes/CalificacionesCSV/', generar_reporte_calificaciones_csv, name='ReporteCalificacionesCSV'),
    path('PanelAuditor/Reportes/LogsCSV/', generar_reporte_logs_csv, name='ReporteLogsCSV'),
    
    # Formato de Archivo
    path('FormatoArchivo/', formato_archivo, name='FormatoArchivo'),
]
    
