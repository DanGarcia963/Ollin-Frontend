const server = "https://ollin-backend-production-d68e.up.railway.app"
document.getElementById('loginFormRegister').addEventListener('submit', async function (event) {
    event.preventDefault()
  
    const email = document.getElementById('email').value
    const password = document.getElementById('password').value
    const confirmPassword = document.getElementById('passwordRE').value
  
    const formData = {
      email,
      password,
      confirmPassword
    }
  
    try {
      const response = await fetch(`${server}/registro/usuarioadmin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })
  
      if (!response.ok) {
        throw new Error('Hubo un error')
      }
  
      const data = await response.json()
  
      console.log('Éxito:', data)
    } catch (error) {
      console.error('Error:', error)
    }
  })
  