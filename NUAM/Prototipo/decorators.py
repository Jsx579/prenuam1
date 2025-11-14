from django.http import HttpResponseForbidden
from django.shortcuts import redirect
from functools import wraps
from django.conf import settings

def role_required(allowed_roles=None):
    if allowed_roles is None:
        allowed_roles = []

    def decorator(view_func):
        @wraps(view_func)
        def wrapper_func(request, *args, **kwargs):
            # 1. Verificar si el usuario está autenticado
            if not request.user.is_authenticated:
                # Si no está logueado, redirigir a la página de login
                return redirect(settings.LOGIN_URL + f"?next={request.path}") 

            # 2. Verificar el Rol (Usando request.user, que ahora funciona gracias al fix de login)
            try:
                # Usamos el campo 'rol' (corregido)
                user_role_name = request.user.rol.nombre
            except AttributeError:
                # El usuario no tiene rol asignado (solo debería pasar si el rol es null o no existe)
                return HttpResponseForbidden("Acceso denegado. Su cuenta no tiene un rol válido.")

            # 3. Comparar el Rol
            if user_role_name in allowed_roles:
                return view_func(request, *args, **kwargs)
            else:
                # Acceso denegado con mensaje informativo
                return HttpResponseForbidden(f"Acceso denegado. Rol {user_role_name} no autorizado.")
            
        return wrapper_func
    return decorator