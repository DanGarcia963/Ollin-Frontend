const server = "https://ollin-backend-production.up.railway.app"

document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('login').addEventListener('submit', async (e) => {
    e.preventDefault()

    const password = document.getElementById('password').value
    const email = document.getElementById('email').value;

    try {
      const res = await fetch(`${server}/api/authenticator/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          Correo: email,
          Contrasena: password
        })
      })

      const resultado = await res.json()
      
      // Si hay error, detenemos todo y mostramos la alerta
      if(resultado.error || resultado.status === 401) {
        return showAlert(resultado.error || resultado.message)
      }
    
      // ¡EL CAMBIO VITAL! Guardamos el token de forma segura en la memoria del navegador
      if (resultado.token) {
        localStorage.setItem('token', resultado.token);
      }
    
      // Hacemos el salto de página
      if (resultado.redirect) {
        window.location.href = resultado.redirect
      }

    } catch (error) {
      console.error(error);
      showAlert('Error de conexión con el servidor');
    }
  })
})

function showAlert (message) {
  Swal.fire({
    icon: 'error',
    title: 'Error',
    text: message
  })
}