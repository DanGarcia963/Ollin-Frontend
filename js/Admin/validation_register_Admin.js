const server = "https://ollin-backend-production.up.railway.app"
document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('loginFormRegister');

    form.addEventListener('submit', async function (event) {
        event.preventDefault();
       if (validateForm()) {
            try {
                const nombre = document.getElementById('name').value;
                const apellido = document.getElementById('lastname').value;
                const correo = document.getElementById('email').value;
                const contrasena = document.getElementById('password').value;
                console.log(nombre, apellido, correo, contrasena);
                const res = await fetch(`${server}/api/authenticatorAdmin/registroA/usuarioAdmin`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        Nombre: nombre,
                        Apellido: apellido,
                        Correo: correo,
                        Contrasena: contrasena
                    })
                });

                const resultado = await res.json();

                if (resultado.redirect) {
                    handleSuccessfulAccountCreation(resultado.redirect);
                } else {
                    showAlert(resultado.message || 'Error al crear la cuenta', 'error');
                }
            } catch (error) {
                showAlert('Error de conexión con el servidor', 'error');
            }
        }
    });

    function validateForm() {
        const name = document.getElementById('name');
        const lastname = document.getElementById('lastname');
        const email = document.getElementById('email');
        const password = document.getElementById('password');
        const passwordRE = document.getElementById('passwordRE');
        console.log(name, lastname, email,password,passwordRE)
        // Nombre
        if (name.value.trim() === '') {
            showAlert('El nombre no ha sido llenado', 'error');
            highlightInvalidField(name);
            return false;
        } else {
            removeHighlight(name);
        }

        // Apellido
        if (lastname.value.trim() === '') {
            showAlert('El apellido no ha sido llenado', 'error');
            highlightInvalidField(lastname);
            return false;
        } else {
            removeHighlight(lastname);
        }

        // Email
        if (email.value.trim() === '') {
            showAlert('El correo electrónico no ha sido llenado', 'error');
            highlightInvalidField(email);
            return false;
        } else {
            removeHighlight(email);
        }

        if (!isValidEmail(email.value.trim())) {
            showAlert('Correo electrónico mal formado', 'error');
            highlightInvalidField(email);
            return false;
        } else {
            removeHighlight(email);
        }

        // Contraseña
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

    function isValidEmail(email) {
        return /\S+@\S+\.\S+/.test(email);
    }

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

    function showAlert(message, icon) {
        Swal.fire({
            icon: icon,
            title: icon.charAt(0).toUpperCase() + icon.slice(1),
            text: message
        });
    }

    function highlightInvalidField(field) {
        field.style.borderColor = 'red';
    }

    function removeHighlight(field) {
        field.style.borderColor = '';
    }

    function handleSuccessfulAccountCreation(redirectUrl) {
        Swal.fire({
            icon: 'success',
            title: '¡Felicidades, cuenta creada!',
            text: 'Se ha enviado un correo de verificación a tu dirección de email. Por favor, revisa tu bandeja de entrada.'
        }).then((result) => {
            if (result.isConfirmed) {
                window.location.href = redirectUrl;
            }
        });
    }
});
