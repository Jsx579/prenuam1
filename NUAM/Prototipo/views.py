from django.shortcuts import render, redirect, get_object_or_404
from django.http import HttpResponse
from django.contrib.auth.decorators import login_required
from django.contrib.auth import authenticate, login, logout
from .forms import LoginForm , AdministradorUsuarioForm , CalificacionForm, get_calificacion_creation_formset, FactorFormSet, FactorForm, modelformset_factory
from .models import Rol, Log, Calificacion, Factor
from django.db.models import Q
from .decorators import role_required 
from Prototipo.models import UsuarioFinal 
from django.contrib.auth.hashers import check_password ,make_password
from django.db import transaction
from decimal import Decimal, InvalidOperation
from django.contrib import messages
import csv




# Create your views here.

def bienvenida(request):
    return render(request, 'bienvenida.html')

def home(request):
    return render(request, 'Prototipo/index.html')

def inicioSesion(request):
    return render(request, 'inicioSesion.html')


def cargaArchivo(request):
    return render(request, 'Prototipo/cargaArchivo.html')

def clasificacionesTributarias(request):
    return render(request, 'Prototipo/ClasificacionesTrbibutarias.html')

def ingresoTribuatariaria(request):
    return render(request, 'Prototipo/IngresoTributaria.html')

def inicioSesionAuditor(request):
    return render(request, 'inicioSesionAuditor.html')

def registroUsuario(request):
    return render(request, 'registroUsuario.html')

def registroAuditor(request):
    return render(request, 'registroAuditor.html')

def visualizarTributaria(request):
    return render(request, 'Prototipo/visualizaciónTributaria.html')

def modificarClasificaciones(request):
    return render(request, 'Prototipo/modificarClasificaciones.html')

def reportes(request):
    return render(request, 'Prototipo/reportes.html')



def inicioSesion(request):
    # Si el usuario ya está autenticado, redirigir al dashboard
    if request.user.is_authenticated:
        return redirect('Bienvenida') 
        
    if request.method == 'POST':
        form = LoginForm(request.POST)
        if form.is_valid():
            email = form.cleaned_data.get('email')
            password = form.cleaned_data.get('password')

            try:
                # 1. Buscar el usuario por email
                usuario = UsuarioFinal.objects.select_related('rol').get(email=email) 
            except UsuarioFinal.DoesNotExist:
                return render(request, 'inicioSesion.html', {
                    'form': form, 
                    'error_message': 'Usuario o contraseña incorrectos.'
                })
            
            # 2. Verificar la contraseña
            if check_password(password, usuario.password):
                # Esto establece la sesión y hace que request.user sea el objeto UsuarioFinal
                usuario.backend = 'django.contrib.auth.backends.ModelBackend' 
                login(request, usuario)
                
                # *** GENERAR LOG ***
                rol_nombre = usuario.rol.nombre if usuario.rol else 'Sin Rol'
                Log.objects.create(
                    usuario=usuario,
                    accion='Inicio de Sesión Exitoso',
                    detalle_cambio=f'Usuario {usuario.nombre} ({rol_nombre}) ha iniciado sesión.'
                )

                # 3. Redirección basada en el Rol
                if rol_nombre == 'Administrador':
                    return redirect('PanelAdministrador')
                elif rol_nombre == 'Auditor':
                    return redirect('PanelAuditor') 
                elif rol_nombre == 'Corredor':
                    return redirect('PanelCorredor') 
                else:
                    return redirect('Clasificacion') 
            else:
                # Contraseña incorrecta
                return render(request, 'inicioSesion.html', {
                    'form': form, 
                    'error_message': 'Usuario o contraseña incorrectos.'
                })

        return render(request, 'inicioSesion.html', {'form': form})
    
    else:
        form = LoginForm()
        return render(request, 'inicioSesion.html', {'form': form})

# ----------------- Funcionalidad de Logout -----------------

@login_required 
def cerrarSesion(request):
    Log.objects.create(
        usuario=request.user, 
        accion='Cierre de Sesión Exitoso',
        detalle_cambio=f'El usuario {request.user.nombre} ha cerrado sesión.'
    )
    
    logout(request)
    return redirect('Bienvenida')


@role_required(allowed_roles=['Administrador'])
def panel_administrador(request):
    # Ahora request.user está disponible y es el objeto UsuarioFinal
    usuarios = UsuarioFinal.objects.all().order_by('rol__nombre', 'nombre')
    context = {'usuarios': usuarios}
    return render(request, 'Prototipo/panel_administrador.html', context)

@role_required(allowed_roles=['Auditor'])
def panel_auditor(request):
    # 1. Obtener todas las calificaciones
    calificaciones = Calificacion.objects.select_related('usuario_creador').order_by('-fecha_creacion')
    
    # 2. Obtener el historial de logs (ejemplo: los últimos 100)
    logs = Log.objects.all().select_related('usuario').order_by('-fecha_hora')[:100]

    # 3. Lógica de Filtros (Opcional pero recomendable)
    busqueda_texto = request.GET.get('q')
    if busqueda_texto:
        calificaciones = calificaciones.filter(
            Q(emisor__icontains=busqueda_texto) | Q(estado__icontains=busqueda_texto) | Q(usuario_creador__nombre__icontains=busqueda_texto)
        )
        # Opcional: Filtrar logs también
        logs = logs.filter(
            Q(accion__icontains=busqueda_texto) | Q(usuario__nombre__icontains=busqueda_texto) | Q(detalle_cambio__icontains=busqueda_texto)
        )

    
    context = {
        'calificaciones': calificaciones,
        'logs': logs,
        'busqueda_texto_activo': busqueda_texto or '',
        'titulo': 'Panel de Auditoría y Revisión'
    }
    return render(request, 'Prototipo/panel_auditor.html', context)

@role_required(allowed_roles=['Corredor'])
def panel_corredor(request):
    calificaciones = Calificacion.objects.filter(usuario_creador=request.user).order_by('-fecha')

    # Lógica de filtros (similar a panel_administrador, si se desean)
    busqueda_texto = request.GET.get('q')
    if busqueda_texto:
        calificaciones = calificaciones.filter(
            Q(emisor__icontains=busqueda_texto) | Q(estado__icontains=busqueda_texto)
        )
    
    context = {
        'calificaciones': calificaciones,
        'busqueda_texto_activo': busqueda_texto or '',
        'titulo': 'Gestión de Calificaciones Propias'
    }
    return render(request, 'Prototipo/panel_corredor.html', context)


#----------------- Funcionalidad de Administrador: Gestión de Usuarios -----------------
@role_required(allowed_roles=['Administrador'])
def usuario_crear(request):
    if request.method == 'POST':
        form = AdministradorUsuarioForm(request.POST)
        if form.is_valid():
            nuevo_usuario = form.save()
            
            # Log de Creación
            Log.objects.create(
                usuario=request.user, # Usamos request.user (el Admin logueado)
                accion='Creación de Usuario',
                detalle_cambio=f'Admin creó al usuario: {nuevo_usuario.nombre} ({nuevo_usuario.email}).'
            )
            return redirect('PanelAdministrador')
    else:
        form = AdministradorUsuarioForm()
        
    context = {'form': form, 'titulo': 'Crear Nuevo Usuario'}
    return render(request, 'Prototipo/usuario_form.html', context)

# Listar todos los usuarios
@role_required(allowed_roles=['Administrador'])
def panel_administrador(request):
    # 1. Base del QuerySet
    usuarios = UsuarioFinal.objects.all()
    # 2. Lógica de Filtros
    # --- Filtro por Rol ---
    filtro_rol = request.GET.get('rol')
    if filtro_rol and filtro_rol != 'Todos':
        usuarios = usuarios.filter(rol__nombre=filtro_rol) 

    # --- Filtro por Nombre/Email (Búsqueda de Texto) ---
    busqueda_texto = request.GET.get('q') 
    if busqueda_texto:
        usuarios = usuarios.filter(
            Q(nombre__icontains=busqueda_texto) | Q(email__icontains=busqueda_texto)
        )
    # 3. Ordenamiento (Se aplica al final)
    usuarios = usuarios.order_by('rol__nombre', 'nombre') 
    # 4. Contexto
    context = {
        'usuarios': usuarios,
        'roles_disponibles': ['Administrador', 'Corredor', 'Auditor'],
        'filtro_rol_activo': filtro_rol,
        'busqueda_texto_activo': busqueda_texto or '', 
    }
    return render(request, 'Prototipo/panel_administrador.html', context)

# Editar un usuario existente
@role_required(allowed_roles=['Administrador'])
def usuario_editar(request, id_usuario):
    # El campo PK en Django es 'id' por defecto, pero si usaste id_usuario, lo mantenemos por ahora
    usuario = get_object_or_404(UsuarioFinal, pk=id_usuario) 
    
    if request.method == 'POST':
        form = AdministradorUsuarioForm(request.POST, instance=usuario)
        if form.is_valid():
            form.save()
            
            Log.objects.create(
                usuario=request.user, # Usamos request.user
                accion='Edición de Usuario',
                detalle_cambio=f'Admin editó al usuario: {usuario.nombre} ({id_usuario}).'
            )
            return redirect('PanelAdministrador')
    else:
        form = AdministradorUsuarioForm(instance=usuario)
        
    context = {'form': form, 'titulo': f'Editar Usuario: {usuario.nombre}'}
    return render(request, 'Prototipo/usuario_form.html', context)

# Eliminar un usuario
@role_required(allowed_roles=['Administrador'])
def usuario_eliminar(request, id_usuario):
    if request.method == 'POST':
        usuario = get_object_or_404(UsuarioFinal, pk=id_usuario)
        
        # Validación: No permitir que el Admin se elimine a sí mismo
        if usuario.pk == request.user.pk:
            return redirect('PanelAdministrador') 

        usuario_nombre = usuario.nombre 
        usuario.delete()
        
        # Log de Eliminación
        Log.objects.create(
            usuario=request.user, # Usamos request.user
            accion='Eliminación de Usuario',
            detalle_cambio=f'Admin eliminó al usuario: {usuario_nombre} ({id_usuario}).'
        )
        return redirect('PanelAdministrador')
    return redirect('PanelAdministrador')



#----------------- Funcionalidad de Corredor: Gestión de calificacion -----------------
@role_required(allowed_roles=['Corredor']) # Asumiendo que solo los corredores pueden crear
def calificacion_crear(request):
    """Maneja la creación de una nueva Calificación y sus 29 Factores asociados."""

    # La función get_calificacion_creation_formset crea el FormSet con 29 factores iniciales
    FactorFormSetLocal = get_calificacion_creation_formset(data=request.POST or None)
    CalificacionFormLocal = CalificacionForm(request.POST or None)

    if request.method == 'POST':
        # Validar ambos formularios (Calificacion y Factores)
        if CalificacionFormLocal.is_valid() and FactorFormSetLocal.is_valid():
            try:
                # Usamos una transacción para asegurar que ambos (Calificacion y Factores) se guarden
                with transaction.atomic():
                    # 1. Guardar la Calificación Principal
                    calificacion = CalificacionFormLocal.save(commit=False)
                    
                    # Asignar campos que no están en el formulario (usuario, estado, origen, etc.)
                    calificacion.usuario_creador = request.user
                    calificacion.estado = 'Pendiente' # O el estado inicial que corresponda
                    calificacion.origen = 'Manual' # Origen manual
                    
                    # Guardamos la instancia de Calificación en la BD
                    calificacion.save()

                    # 2. Asignar la Calificación (FK) a todos los Factores del formset
                    factores = FactorFormSetLocal.save(commit=False)
                    for factor in factores:
                        factor.calificacion = calificacion
                        factor.save()
                    
                    # 3. Registrar en el Log
                    Log.objects.create(
                        usuario=request.user,
                        accion='Creación de Calificación',
                        detalle_cambio=f'Corredor creó la calificación: {calificacion.emisor} ({calificacion.pk}).'
                    )

                    messages.success(request, "¡Calificación tributaria ingresada exitosamente!")
                    return redirect('ClasificacionesTributarias') # Redirige al mantenedor o donde corresponda

            except Exception as e:
                # Si ocurre un error de BD o lógico
                messages.error(request, f"Error al guardar la calificación: {e}")
                # El formulario se renderizará de nuevo con los datos POST
        else:
            # Si el formulario o el formset no es válido
            messages.error(request, "Por favor, revise los errores en el formulario.")
            
    # Para solicitudes GET o POST con errores
    context = {
        'form': CalificacionFormLocal, 
        'formset': FactorFormSetLocal, 
        'titulo': "Ingreso de Calificaciones Tributarias"
    }
    return render(request, 'Prototipo/ingresoTributaria.html', context)

@role_required(allowed_roles=['Corredor'])
def calificacion_factores_editar(request, pk):
    # 1. Asegurar que la Calificación existe y pertenece al usuario
    calificacion = get_object_or_404(Calificacion, pk=pk, usuario_creador=request.user)
    
    # 2. Obtener los 29 Factores relacionados
    factores_qs = Factor.objects.filter(calificacion=calificacion).order_by('nombre')
    
    # 3. Crear el Formset con la lista de Factores
    formset = FactorFormSet(request.POST or None, queryset=factores_qs)

    if request.method == 'POST':
        if formset.is_valid():
            formset.save()
            
            # Log de Edición
            Log.objects.create(
                usuario=request.user,
                accion='Edición de Factores',
                detalle_cambio=f'Corredor editó los factores de la calificación: {calificacion.emisor} ({calificacion.pk}).'
            )
            
            return redirect('PanelCorredor')
    
    context = {
        'calificacion': calificacion, 
        'formset': formset,
        'titulo': f'Editar Factores: {calificacion.emisor}'
    }
    return render(request, 'Prototipo/calificacion_factores_form.html', context)



    #----------------- Funcionalidad de Auditor: Revisión de calificacion -----------------

# views.py

# ... (código después de calificacion_factores_editar)

@role_required(allowed_roles=['Auditor'])
def calificacion_revisar(request, pk):
    """
    Permite al Auditor revisar la Calificación y sus Factores.
    No permite la edición de factores, solo la visualización y un posible cambio de estado (Aprobar/Rechazar).
    """
    # Usamos get_object_or_404 para la Calificacion
    calificacion = get_object_or_404(Calificacion.objects.select_related('usuario_creador'), pk=pk)
    
    # Obtener los 29 Factores relacionados
    factores_qs = Factor.objects.filter(calificacion=calificacion).order_by('nombre')
    
    # 1. Preparar el Formulario de Estado/Aprobación (si lo necesitaras en el futuro)
    # Por ahora, solo usamos el modelo de calificación.
    
    # 2. Crear un Formset DE SOLO LECTURA para los factores
    # Reutilizaremos el FormSet, pero haremos que los campos no sean editables
    FactorReadOnlyFormSet = modelformset_factory(
        Factor,
        form=FactorForm, 
        extra=0, 
        can_delete=False
    )
    
    # Instanciamos con los datos del QS.
    formset = FactorReadOnlyFormSet(queryset=factores_qs)

    # Marcamos el formset como solo lectura
    for form in formset:
        for field in form.fields.values():
            field.widget.attrs['readonly'] = True
            field.widget.attrs['disabled'] = True # Deshabilita el campo para que no se envíe en el POST

    # Lógica de Aprobación/Rechazo (POST)
    if request.method == 'POST':
        estado_nuevo = request.POST.get('nuevo_estado')
        
        if estado_nuevo in ['Aprobada', 'Rechazada']:
            calificacion.estado = estado_nuevo
            calificacion.save()
            
            Log.objects.create(
                usuario=request.user,
                accion=f'Revisión de Calificación ({estado_nuevo})',
                detalle_cambio=f'Auditor {request.user.nombre} cambió el estado de {calificacion.instrumento} ({calificacion.pk}) a {estado_nuevo}.'
            )
            messages.success(request, f"Calificación marcada como '{estado_nuevo}'.")
            return redirect('PanelAuditor')
        else:
            messages.error(request, "Estado de revisión no válido.")


    
    context = {
        'calificacion': calificacion, 
        'formset': formset,
        'titulo': f'Revisión de Calificación: {calificacion.instrumento}',
        'readonly': True # Indicador para el template
    }
    return render(request, 'Prototipo/calificacion_revisar.html', context)


@role_required(allowed_roles=['Auditor'])
def panel_reportes(request):
    """
    Panel donde el Auditor puede seleccionar el tipo de reporte a generar.
    """
    context = {
        'titulo': 'Generación de Reportes de Auditoría',
    }
    return render(request, 'Prototipo/panel_reportes.html', context)


@role_required(allowed_roles=['Auditor'])
def generar_reporte_calificaciones_csv(request):
    """
    Genera un reporte de todas las Calificaciones en formato CSV.
    """
    # 1. Configurar la respuesta HTTP para CSV
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="reporte_calificaciones.csv"'

    # 2. Crear el escritor CSV
    writer = csv.writer(response)

    # 3. Encabezados del CSV
    writer.writerow([
        'ID Calificacion', 
        'Instrumento', 
        'Mercado', 
        'Valor Historico', 
        'Años', 
        'Estado', 
        'Fecha Creacion', 
        'Usuario Creador', 
        'Email Creador'
    ])

    # 4. Obtener los datos y escribirlos
    calificaciones = Calificacion.objects.select_related('usuario_creador').all().order_by('-fecha_creacion')
    
    for calificacion in calificaciones:
        writer.writerow([
            calificacion.pk,
            calificacion.instrumento,
            calificacion.mercado,
            calificacion.valor_historico,
            calificacion.años,
            calificacion.estado,
            calificacion.fecha_creacion.strftime('%Y-%m-%d %H:%M:%S'),
            calificacion.usuario_creador.nombre,
            calificacion.usuario_creador.email,
        ])

    # Opcional: Agregar el Log de la acción
    Log.objects.create(
        usuario=request.user,
        accion='Generación de Reporte',
        detalle_cambio=f'Auditor generó el Reporte CSV de Calificaciones.'
    )
    
    return response


@role_required(allowed_roles=['Auditor'])
def generar_reporte_logs_csv(request):
    """
    Genera un reporte de todos los Logs de actividad en formato CSV.
    """
    # 1. Configurar la respuesta HTTP para CSV
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="reporte_logs_actividad.csv"'

    # 2. Crear el escritor CSV
    writer = csv.writer(response)

    # 3. Encabezados del CSV
    writer.writerow([
        'ID Log', 
        'Fecha y Hora', 
        'Accion', 
        'Usuario ID', 
        'Usuario Email', 
        'Detalle del Cambio'
    ])

    # 4. Obtener los datos y escribirlos
    # Usamos select_related para obtener el usuario que realizó la acción
    logs = Log.objects.select_related('usuario').all().order_by('-fecha_hora')
    
    for log in logs:
        # Manejar el caso donde el usuario es NULL (por models.SET_NULL)
        usuario_id = log.usuario.pk if log.usuario else 'N/A'
        usuario_email = log.usuario.email if log.usuario else 'Sistema'
        
        writer.writerow([
            log.pk,
            log.fecha_hora.strftime('%Y-%m-%d %H:%M:%S'),
            log.accion,
            usuario_id,
            usuario_email,
            # Limpiar saltos de línea en el detalle para evitar problemas en el CSV
            log.detalle_cambio.replace('\n', ' ').replace('\r', ' ') 
        ])

    # 5. Registrar la acción en el log del sistema
    Log.objects.create(
        usuario=request.user,
        accion='Generación de Reporte',
        detalle_cambio=f'Auditor generó el Reporte CSV de Logs de Actividad.'
    )
    
    return response






def formato_archivo(request):
    """Vista para mostrar el formato del archivo de carga"""
    return render(request, 'Prototipo/formato_archivo.html')
