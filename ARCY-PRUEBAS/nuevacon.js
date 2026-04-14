const server = "https://ollin-backend-production.up.railway.app"
document.addEventListener('DOMContentLoaded', async () => {
    const formulario = document.getElementById('recuperar');
  
    formulario.addEventListener('submit', async (evento) => {
        evento.preventDefault();

        const email = document.getElementById('email').value;
        const respuesta = await fetch(`${server}/api/authenticator/olvidarContrasena`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ Correo: email })
        });

        if (!respuesta.ok) {
            showAlert('Ocurrió un error al recuperar la contraseña', 'error');
        } else {
            const resultado = await respuesta.json();
            if (resultado.redirect) {
                showAlert('Correo enviado', 'success', resultado.redirect);
            } else {
                showAlert('No se pudo enviar el correo de recuperación. Por favor, verifica si el correo proporcionado es correcto.', 'error');
            }
        }
    });
});

function showAlert(message, icon, redirectUrl) {
    Swal.fire({
        icon: icon,
        title: icon === 'success' ? 'Correo Envidao' : 'Error',
        text: icon === 'success' ? 'Revise su bandeja de entrada y siga las instrucciones para recuperar la cuenta.' : 'Error al mandar el correo, vuelva a intentar.',
        confirmButtonText: icon === 'success' ? 'Aceptar' : 'OK'
    }).then((result) => {
        if (result.isConfirmed && redirectUrl) {
            window.location.href = redirectUrl;
        }
    });
}
