from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone
import datetime


# --- CLASES BASE DEL SISTEMA ---

class Rol(models.Model):
    # PK_ID_Rol: serial (se crea automáticamente en Django)
    nombre = models.CharField(max_length=100, unique=True, verbose_name="Nombre del Rol")
    descripcion = models.CharField(max_length=100)

    class Meta:
        verbose_name = "Rol de Usuario"
        verbose_name_plural = "Roles de Usuario"

    def __str__(self):
        return self.nombre

# --- GESTOR DE USUARIO PERSONALIZADO ---
# Necesario si utilizas AbstractBaseUser

class UsuarioFinalManager(BaseUserManager):
    def create_user(self, email, password=None, rol=None, **extra_fields):
        if not email:
            raise ValueError('El email debe ser establecido')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields) 
        
        # 1. Asignamos el objeto Rol (si fue pasado)
        if rol is not None:
            user.rol = rol 
        
        # 2. Configuramos la contraseña y guardamos
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password, **extra_fields):
        # 1. Aseguramos los campos por defecto para superusuario
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        from .models import Rol 
        # 2. Buscamos el objeto Rol 'Administrador'
        try:
            rol_admin = Rol.objects.get(nombre='Administrador')
        except Rol.DoesNotExist:
            raise ValueError("El Rol 'Administrador' no existe. Asegúrate de haber corrido las migraciones de datos.")
        extra_fields.pop('rol', None) 
        
        # 3. Llamamos a create_user, pasando el OBJETO Rol explícitamente
        return self.create_user(email, password, rol=rol_admin, **extra_fields)

# --- CLASE USUARIO FINAL (UsuarioFinal) ---
# Hereda de AbstractBaseUser y PermissionsMixin para un usuario personalizado

class UsuarioFinal(AbstractBaseUser, PermissionsMixin):
    rol = models.ForeignKey(Rol, on_delete=models.PROTECT, null=True, verbose_name="Rol Asignado") 
    
    nombre = models.CharField(max_length=100)
    email = models.EmailField(max_length=100, unique=True)
    password = models.CharField(max_length=128) 
    fecha_reg = models.DateField(default=timezone.now)
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    
    USERNAME_FIELD = 'email' 
    REQUIRED_FIELDS = ['nombre', 'rol']

    objects = UsuarioFinalManager()

    class Meta:
        verbose_name = "Usuario del Sistema"
        verbose_name_plural = "Usuarios del Sistema"

    def __str__(self):
        return self.email
    
    def consultarDatos(self):
        """Implementa la funcionalidad consultarDatos()"""
        return {
            'nombre': self.nombre, 
            'email': self.email, 
            'rol': self.rol.nombre if self.rol else 'Sin Rol'
        }


# --- CLASES DE ENTIDADES ---

class ArchivoCarga(models.Model):
    cargado_por = models.ForeignKey(UsuarioFinal, on_delete=models.SET_NULL, null=True) 

    nombre = models.CharField(max_length=100)
    fecha_carga = models.DateField(default=timezone.now)
    estado = models.CharField(max_length=20)

    def __str__(self):
        return f"Archivo: {self.nombre} ({self.estado})"


class Calificacion(models.Model):
    mercado = models.CharField(max_length=50, default="SIN MERCADO")
    instrumento = models.CharField(max_length=100, default="SIN INSTRUMENTO") 
    evento_capital = models.CharField(max_length=255, null=True, blank=True)
    descripcion = models.TextField(blank=True, null=True)
    valor_historico = models.DecimalField(max_digits=18, decimal_places=8, default=0.0) 
    secuencia_evento = models.IntegerField(default=0)
    años = models.IntegerField(default=1990)
    fecha_pago = models.DateField(default=datetime.date(2000, 1, 1)) 
    
    # --- CAMPOS ADMINISTRATIVOS ---
    estado = models.CharField(max_length=50, default='Pendiente')
    fecha_creacion = models.DateField(default=timezone.now) 
    origen = models.CharField(max_length=20, default='Manual') 
    
    usuario_creador = models.ForeignKey('UsuarioFinal', on_delete=models.CASCADE)
    archivo_carga = models.ForeignKey('ArchivoCarga', on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"Calificación {self.pk}: {self.instrumento} ({self.años})"



class Factor(models.Model):
    calificacion = models.ForeignKey(Calificacion, on_delete=models.CASCADE)
    nombre = models.CharField(max_length=100)
    valor = models.DecimalField(max_digits=8, decimal_places=4) # 8.4 en el MER

    def __str__(self):
        return f"Factor: {self.nombre} ({self.valor})"


class Notificacion(models.Model):
    usuario = models.ForeignKey(UsuarioFinal, on_delete=models.CASCADE)

    tipo = models.CharField(max_length=50)
    mensaje = models.CharField(max_length=4000)
    fecha_envio = models.DateField(default=timezone.now)
    leida = models.BooleanField(default=False)

    def __str__(self):
        return f"Notificación para {self.usuario.email} ({self.tipo})"


class Log(models.Model):
    usuario = models.ForeignKey(UsuarioFinal, on_delete=models.SET_NULL, null=True, verbose_name="Usuario que realizó la acción")
    accion = models.CharField(max_length=50, verbose_name="Tipo de Acción")
    fecha_hora = models.DateTimeField(default=timezone.now)
    detalle_cambio = models.TextField(verbose_name="Detalle del Cambio/Resultado")

    class Meta:
        verbose_name = "Registro de Actividad"
        verbose_name_plural = "Logs de Actividad"

    def __str__(self):
        return f"Log: {self.accion} por {self.usuario.email if self.usuario else 'N/A'}"
    
    def marcarComoLeido(self):
        """
        Implementa la funcionalidad marcarComoLeido() de la clase Registro.
        Nota: Esto se implementaría típicamente en la tabla Notificación, pero se incluye aquí para
        respetar el diagrama (aunque no tiene un campo 'leído' en la tabla Log).
        """
        # Aquí iría la lógica si se necesitara marcar logs como 'revisados' por el Auditor
        pass