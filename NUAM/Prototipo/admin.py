from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import (UsuarioFinal, Rol, Notificacion, ArchivoCarga, Calificacion, Factor, Log)
# Register your models here.

# Modelos de Base 



# --- 1. CONFIGURACIÓN DEL USUARIO FINAL ---

class UsuarioFinalAdmin(BaseUserAdmin):
    """
    Configuración para el modelo UsuarioFinal (que extiende a AbstractBaseUser).
    """
    # Los campos que se muestran en la lista de usuarios
    list_display = ('email', 'nombre', 'rol', 'is_staff', 'is_active')
    
    # Campos por los que se puede buscar
    search_fields = ('email', 'nombre')
    
    # Campos para filtrar la lista
    list_filter = ('rol', 'is_staff', 'is_active')
    
    # Definición de los campos en el formulario de edición
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Permisos y Roles', {'fields': ('rol', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Información Personal', {'fields': ('nombre', 'fecha_reg')}),
        ('Fechas Importantes', {'fields': ('last_login',)}),
    )
    
    # Los campos que no se pueden editar al crear o modificar
    readonly_fields = ('fecha_reg', 'last_login')
    
    # Le decimos a Django que use 'email' como campo de login
    ordering = ('email',)


# ----------------------------------------------------------------------
# --- 2. REGISTRO DE ENTIDADES (Corrigiendo PKs y FKs) ---

# --- A. Rol ---
@admin.register(Rol)
class RolAdmin(admin.ModelAdmin):
    # 'id' es la clave primaria automática de Django
    list_display = ('id', 'nombre', 'descripcion') 
    list_display_links = ('id', 'nombre')
    search_fields = ('nombre',)
    

# --- B. Notificacion ---
@admin.register(Notificacion)
class NotificacionAdmin(admin.ModelAdmin):
    # 'id' (PK) y 'usuario' (FK)
    list_display = ('id', 'usuario', 'tipo', 'fecha_envio', 'leida') 
    list_filter = ('tipo', 'leida')
    search_fields = ('usuario__email', 'mensaje') # Permite buscar por email del usuario
    # Usa 'usuario', no 'id_usuario'
    raw_id_fields = ('usuario',) 


# --- C. ArchivoCarga ---
@admin.register(ArchivoCarga)
class ArchivoCargaAdmin(admin.ModelAdmin):
    # 'id' (PK) y 'cargado_por' (FK)
    list_display = ('id', 'nombre', 'cargado_por', 'fecha_carga', 'estado') 
    list_filter = ('estado', 'fecha_carga')
    search_fields = ('nombre', 'cargado_por__email')
    # Usa 'cargado_por', no 'id_usuario'
    raw_id_fields = ('cargado_por',) 


# --- D. Calificacion ---
@admin.register(Calificacion)
class CalificacionAdmin(admin.ModelAdmin):
    list_display = ('id', 'instrumento', 'mercado', 'años', 'estado', 'fecha_creacion', 'usuario_creador') 
    list_filter = ('estado', 'mercado', 'años', 'fecha_creacion', 'usuario_creador')
    search_fields = ('instrumento', 'mercado', 'usuario_creador__email') 
    raw_id_fields = ('usuario_creador',)


# --- E. Factor ---
@admin.register(Factor)
class FactorAdmin(admin.ModelAdmin):
    # 'id' (PK) y 'calificacion' (FK)
    list_display = ('id', 'nombre', 'valor', 'calificacion')
    list_filter = ('nombre',)
    search_fields = ('nombre', 'calificacion__emisor') # Búsqueda por el emisor de la calificación
    # Usa 'calificacion', no 'id_calificacion'
    raw_id_fields = ('calificacion',) 


# --- F. Log ---
@admin.register(Log)
class LogAdmin(admin.ModelAdmin):
    # 'id' (PK) y 'usuario' (FK)
    list_display = ('id', 'accion', 'usuario', 'fecha_hora')
    list_filter = ('accion', 'fecha_hora')
    search_fields = ('accion', 'usuario__email', 'detalle_cambio')
    # No necesita raw_id_fields si no lo usas, pero si lo hicieras sería ('usuario',)


# ----------------------------------------------------------------------
# --- 3. REGISTRO FINAL DE USUARIO (Reemplazando el default) ---

# Desregistramos el usuario predeterminado si estaba registrado
try:
    admin.site.unregister(UsuarioFinal)
except admin.sites.NotRegistered:
    pass # Ya estaba desregistrado o nunca se registró

# Registramos nuestra configuración personalizada
admin.site.register(UsuarioFinal, UsuarioFinalAdmin)