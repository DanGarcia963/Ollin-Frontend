const server = "https://ollin-backend-production-d68e.up.railway.app"

document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('login').addEventListener('submit', async (e) => {
    e.preventDefault()

    const password = document.getElementById('password').value
    const email = document.getElementById('email').value;

    try{
    const res = await fetch(`${server}/api/authenticatorAdmin/loginAdmin`, {
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
    
    if(resultado.error || resultado.status === 401) {
      return showAlert(resultado.error || resultado.message)
    }


    if(resultado.token) {
      localStorage.setItem('token', resultado.token);
      localStorage.setItem('isAdmin', 'true'); // Guardamos un indicador de que es admin
    }


    if(resultado.redirect) {
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
