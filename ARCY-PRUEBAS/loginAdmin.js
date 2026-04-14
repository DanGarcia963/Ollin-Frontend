const server = "https://ollin-backend-production.up.railway.app"
document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('login').addEventListener('submit', async (e) => {
    e.preventDefault()

    const password = document.getElementById('password').value
    const email = document.getElementById('email').value;
    console.log(e.target.children.email.value)
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
    console.log(resultado)
    const { error } = resultado

    if(error)
    showAlert(error)

  
    if (resultado.redirect) {
      window.location.href = resultado.redirect
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
