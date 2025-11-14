from django import forms
from .models import Rol, Log, Calificacion, Factor
from Prototipo.models import UsuarioFinal , Calificacion, Factor
from django.forms import modelformset_factory
from .utils import NOMBRES_FACTORES





class RegistroUsuarioForm(forms.Form):
    # Campos existentes
    nombre = forms.CharField(max_length=100, widget=forms.TextInput(attrs={'class': 'form-control'}))
    email = forms.EmailField(max_length=100, widget=forms.EmailInput(attrs={'class': 'form-control'}))
    password = forms.CharField(max_length=100, widget=forms.PasswordInput(attrs={'class': 'form-control'}))
    password_confirm = forms.CharField(max_length=100, widget=forms.PasswordInput(attrs={'class': 'form-control'}),label='Confirmar Contraseña')

    # Campo CORREGIDO para seleccionar el Rol
    rol = forms.ModelChoiceField( # <--- CORRECCIÓN
        queryset=Rol.objects.all(),
        empty_label="Seleccione un Rol",
        label="Rol a Asignar",
        widget=forms.Select(attrs={'class': 'form-control'})
    )

    # Lógica de validación (igual que antes)
    def clean_password_confirm(self):
        password = self.cleaned_data.get('password')
        password_confirm = self.cleaned_data.get('password_confirm')
        
        if password and password_confirm and password != password_confirm:
            raise forms.ValidationError("Las contraseñas no coinciden.")
            
        return password_confirm


class LoginForm(forms.Form):
    email = forms.EmailField(
        max_length=100,
        widget=forms.EmailInput(attrs={'class': 'form-control', 'placeholder': 'Correo Electrónico'})
    )
    password = forms.CharField(
        max_length=100,
        widget=forms.PasswordInput(attrs={'class': 'form-control', 'placeholder': 'Contraseña'}))
    


class AdministradorUsuarioForm(forms.ModelForm):
    password = forms.CharField(
        required=False, 
        widget=forms.PasswordInput(attrs={'class': 'form-control', 'placeholder': 'Dejar vacío para no cambiar'}),
        label='Contraseña'
    )
    
    nombre = forms.CharField(max_length=100, widget=forms.TextInput(attrs={'class': 'form-control'}))
    email = forms.EmailField(max_length=100, widget=forms.EmailInput(attrs={'class': 'form-control'}))

    class Meta:
        model = UsuarioFinal
        fields = ['rol', 'nombre', 'email', 'password'] 
        widgets = {
            'rol': forms.Select(attrs={'class': 'form-control'}),
            }
        
    # ... resto del código (__init__, clean_password, save) se mantiene igual
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if not self.instance.pk:
            self.fields['password'].required = True
            # Cambiamos el placeholder para reflejar que es obligatorio
            self.fields['password'].widget.attrs['placeholder'] = 'Contraseña Obligatoria' 

    def clean_password(self):
        password = self.cleaned_data.get('password')
        
        if not self.instance.pk and not password:
            raise forms.ValidationError("La contraseña es obligatoria para un nuevo usuario.")
        
        return password
        
    def save(self, commit=True):
        usuario = super().save(commit=False)
        
        nueva_password = self.cleaned_data.get('password')
        
        # Caso 1: Creación de usuario (nueva_password siempre estará aquí debido a clean_password)
        # Caso 2: Edición de usuario y se ingresó una nueva contraseña.
        if nueva_password:
            from django.contrib.auth.hashers import make_password
            usuario.password = make_password(nueva_password)
        
        # Caso 3: Edición de usuario y NO se ingresó contraseña.
        # En este caso, el password existente del objeto 'usuario' (que se cargó con super().save(commit=False)) se mantiene.
            
        if commit:
            usuario.save()
        return usuario
    

class CalificacionForm(forms.ModelForm):
    class Meta:
        model = Calificacion
        fields = [
            'mercado', 'instrumento', 'valor_historico', 'fecha_pago',
            'evento_capital', 'descripcion', 'secuencia_evento', 
            'años', 
            'estado', 'origen'
        ]
        widgets = {
            'mercado': forms.Select(attrs={'class': 'form-control', 'id': 'mercado'}),
            'instrumento': forms.TextInput(attrs={'class': 'form-control', 'id': 'instrumento'}),
            'valor_historico': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.00000001', 'id': 'valorHistorico'}),
            'fecha_pago': forms.DateInput(attrs={'class': 'form-control', 'type': 'date', 'id': 'fechaPago'}),
            'evento_capital': forms.TextInput(attrs={'class': 'form-control', 'id': 'eventoCapital'}),
            'descripcion': forms.Textarea(attrs={'class': 'form-control', 'rows': 3, 'id': 'descripcion'}),
            'secuencia_evento': forms.NumberInput(attrs={'class': 'form-control', 'id': 'secuenciaEvento'}),
            'años': forms.NumberInput(attrs={'class': 'form-control', 'id': 'ano'}), # Se mantiene 'id': 'ano' para el JS y HTML existente
            'estado': forms.HiddenInput(),
            'origen': forms.HiddenInput(),
        }

class FactorForm(forms.ModelForm):
    class Meta:
        model = Factor
        fields = ['nombre', 'valor'] 
        widgets = {
            'nombre': forms.TextInput(attrs={'class': 'form-control-plaintext', 'readonly': 'readonly'}),
            'valor': forms.NumberInput(attrs={'class': 'form-control factor-input', 'step': '0.00000001'}),
        }

# --- Formset para manejar los 29 Factores ---
# Establecemos extra=0 porque no queremos añadir nuevos factores, sino editar los 29 existentes.
FactorFormSet = modelformset_factory(
    Factor,
    form=FactorForm,
    fields=['nombre', 'valor'],
    extra=0, # No se pueden añadir nuevos en este formulario
    can_delete=False
)

def get_calificacion_creation_formset(data=None):
    """
    Genera un FormSet con 29 factores listos para ser llenados, 
    usado para la pantalla de creación inicial.
    """
    
    # 1. Preparar los datos iniciales (nombre y valor inicial=0)
    initial_data = [{'nombre': name, 'valor': 0.00000000} for name in NOMBRES_FACTORES]

    # 2. Crear el formset
    CreationFactorFormSet = modelformset_factory(
        Factor,
        form=FactorForm, # Reutiliza el FactorForm que solo muestra nombre y valor.
        extra=0, # No queremos campos extra, solo los 29 iniciales
        can_delete=False
    )
    
    # 3. Instanciar el FormSet
    # Nota: Usamos queryset=Factor.objects.none() para que sepa que son objetos nuevos,
    # y 'initial' para precargar los nombres de los factores.
    return CreationFactorFormSet(data=data, queryset=Factor.objects.none(), initial=initial_data)
    