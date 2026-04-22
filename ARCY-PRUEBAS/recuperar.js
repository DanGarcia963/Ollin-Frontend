const server = "https://ollin-backend-production-d68e.up.railway.app"
document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('passwordRecover');
    const password = document.getElementById('password');
    const passwordRE = document.getElementById('passwordRE');
    const params = new URLSearchParams(window.location.search);
    const valorToken = params.get("token") || obtenerValorCookie("rct");

if (!valorToken) {
    showErrorAlert("No se encontró el token");
    return;
}
  
    form.addEventListener('submit', async function (event) {
        event.preventDefault();
  
        if (validateForm()) {
            try {
                const response = await fetch(`${server}/api/authenticator/establecerNuevaContrasena`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        Contrasena: password.value,
                        Token: valorToken
                    })
                });

                const resultado = await response.json();

                if (!response.ok || resultado.status === 'error' || resultado.status === 400 || resultado.status === 401) {
                    throw new Error(resultado.message || 'Error al cambiar la contraseña');
                }

                showSuccessAlert('Se cambió correctamente la contraseña.');
            } catch (error) {
                showErrorAlert(error.message);
            }
        }
    });

       function isValidPassword(password) {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumber = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/]/.test(password);

        return (
            password.length >= minLength &&
            hasUpperCase &&
            hasLowerCase &&
            hasNumber &&
            hasSpecialChar
        );
    }
  
    function validateForm() {
                if (password.value === '') {
            showAlert('La contraseña no ha sido llenada', 'error');
            highlightInvalidField(password);
            return false;
        }

        if (!isValidPassword(password.value)) {
            showAlert(
                'La contraseña debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas, números y un carácter especial',
                'error'
            );
            highlightInvalidField(password);
            return false;
        } else {
            removeHighlight(password);
        }

        // Confirmar contraseña
        if (passwordRE.value === '') {
            showAlert('Confirma tu contraseña', 'error');
            highlightInvalidField(passwordRE);
            return false;
        } else {
            removeHighlight(passwordRE);
        }

        if (password.value !== passwordRE.value) {
            showAlert('Las contraseñas no coinciden', 'error');
            highlightInvalidField(password);
            highlightInvalidField(passwordRE);
            return false;
        }
  
        return true;
    }
  
    function obtenerValorCookie(name) {
        var nameEQ = name + "="; 
        var ca = document.cookie.split(';');
        for(var i=0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0)==' ') c = c.substring(1,c.length);
            if (c.indexOf(nameEQ) == 0) {
                return decodeURIComponent(c.substring(nameEQ.length,c.length));
            }
        }
        return null;
    }
  
    function showAlert(message) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: message,
        });
    }
  
    function showSuccessAlert(message) {
        Swal.fire({
            icon: 'success',
            title: 'Éxito',
            text: message,
            showCancelButton: false,
            confirmButtonText: 'Iniciar Sesión',
        }).then((result) => {
            if (result.isConfirmed) {
                window.location.href = '/';
            }
        });
    }
  
    function showErrorAlert(message) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: message,
        });
    }
  
    function highlightInvalidField(field) {
        field.style.borderColor = 'red';
    }
  
    function removeHighlight(field) {
        field.style.borderColor = ''; // Reset to default
    }
  });
  