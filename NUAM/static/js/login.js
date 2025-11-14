// login.js - Sistema completo de login con validación

document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('exampleInputEmail1');
    const passwordInput = document.getElementById('exampleInputPassword1');
    const rememberCheck = document.getElementById('exampleCheck1');
    const togglePasswordBtn = document.getElementById('togglePassword');
    const passwordIcon = document.getElementById('passwordIcon');
    const messageContainer = document.getElementById('messageContainer');

    // Cargar email guardado si existe
    loadRememberedEmail();

    // Event Listeners
    loginForm.addEventListener('submit', handleSubmit);
    togglePasswordBtn.addEventListener('click', togglePasswordVisibility);
    emailInput.addEventListener('input', clearFieldError);
    passwordInput.addEventListener('input', clearFieldError);

    // Función principal para manejar el envío del formulario
    function handleSubmit(e) {
        e.preventDefault();
        
        // Limpiar mensajes previos
        clearMessages();
        
        // Validar formulario
        if (!validateForm()) {
            return;
        }

        // Obtener datos del formulario
        const formData = {
            email: emailInput.value.trim(),
            password: passwordInput.value,
            remember: rememberCheck.checked
        };

        // Manejar "recordar usuario"
        handleRememberMe(formData.email, formData.remember);

        // Enviar datos con AJAX (simulado para prototipo)
        sendLoginRequest(formData);
    }

    // Validación del formulario
    function validateForm() {
        let isValid = true;

        // Validar email
        if (!emailInput.value.trim()) {
            showFieldError(emailInput, 'El correo electrónico es obligatorio');
            isValid = false;
        } else if (!isValidEmail(emailInput.value.trim())) {
            showFieldError(emailInput, 'Por favor ingresa un correo electrónico válido');
            isValid = false;
        }

        // Validar contraseña
        if (!passwordInput.value) {
            showFieldError(passwordInput, 'La contraseña es obligatoria');
            isValid = false;
        } else if (passwordInput.value.length < 6) {
            showFieldError(passwordInput, 'La contraseña debe tener al menos 6 caracteres');
            isValid = false;
        }

        return isValid;
    }

    // Validar formato de email
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Mostrar error en campo específico
    function showFieldError(input, message) {
        input.classList.add('is-invalid');
        
        // Crear o actualizar mensaje de error
        let errorDiv = input.parentElement.querySelector('.invalid-feedback');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'invalid-feedback';
            input.parentElement.appendChild(errorDiv);
        }
        errorDiv.textContent = message;
    }

    // Limpiar error de un campo
    function clearFieldError(e) {
        const input = e.target;
        input.classList.remove('is-invalid');
        const errorDiv = input.parentElement.querySelector('.invalid-feedback');
        if (errorDiv) {
            errorDiv.remove();
        }
    }

    // Enviar solicitud AJAX (simulada para prototipo)
    function sendLoginRequest(formData) {
        // Mostrar estado de carga
        showLoadingState();

        // Simular petición AJAX con setTimeout
        setTimeout(() => {
            // Simular respuesta del servidor
            // En producción, aquí irá la petición real a Django
            
            // Credenciales de prueba
            const testEmail = 'usuario@ejemplo.com';
            const testPassword = '123456';

            if (formData.email === testEmail && formData.password === testPassword) {
                // Login exitoso
                showMessage('¡Inicio de sesión exitoso! Redirigiendo...', 'success');
                
                // Simular redirección después de 2 segundos
                setTimeout(() => {
                    // window.location.href = '/dashboard/';
                    console.log('Redirección al dashboard (simulada)');
                }, 2000);
            } else {
                // Login fallido
                showMessage('Correo o contraseña incorrectos. Intenta nuevamente.', 'error');
                hideLoadingState();
            }
        }, 1500); // Simular delay de red
    }

    // Mostrar/ocultar contraseña
    function togglePasswordVisibility() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        
        // Cambiar icono
        if (type === 'text') {
            passwordIcon.textContent = ':v';
            togglePasswordBtn.setAttribute('aria-label', 'Ocultar contraseña');
        } else {
            passwordIcon.textContent = ';v';
            togglePasswordBtn.setAttribute('aria-label', 'Mostrar contraseña');
        }
    }

    // Manejar "recordar usuario"
    function handleRememberMe(email, remember) {
        if (remember) {
            localStorage.setItem('rememberedEmail', email);
        } else {
            localStorage.removeItem('rememberedEmail');
        }
    }

    // Cargar email guardado
    function loadRememberedEmail() {
        const rememberedEmail = localStorage.getItem('rememberedEmail');
        if (rememberedEmail) {
            emailInput.value = rememberedEmail;
            rememberCheck.checked = true;
        }
    }

    // Mostrar mensajes de éxito/error
    function showMessage(message, type) {
        messageContainer.innerHTML = `
            <div class="alert alert-${type === 'success' ? 'success' : 'danger'} alert-dismissible fade show" role="alert">
                ${type === 'success' ? 'Bueno' : 'Malo'} ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
        messageContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Limpiar mensajes
    function clearMessages() {
        messageContainer.innerHTML = '';
    }

    // Mostrar estado de carga
    function showLoadingState() {
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Iniciando sesión...';
    }

    // Ocultar estado de carga
    function hideLoadingState() {
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Iniciar sesión';
    }
});

// Credenciales de prueba para el prototipo:
// Email: usuario@ejemplo.com
// Contraseña: 123456