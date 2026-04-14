export function validateForm () {
  const email = document.getElementById('email')
  const password = document.getElementById('password')

  if (email.value.trim() == '') {
    showAlert('El correo electrónico no ha sido llenado')
    highlightInvalidField(email)
    return false
  } else {
    removeHighlight(email)
  }

  if (!isValidEmail(email.value.trim())) {
    showAlert('Correo electrónico mal formado')
    highlightInvalidField(email)
    return false
  } else {
    removeHighlight(email)
  }

  if (password.value === '') {
    showAlert('La contraseña no ha sido llenada')
    highlightInvalidField(password)
    return false
  } else {
    removeHighlight(password)
  }
  return true
}

  function isValidEmail (email) {
    return /\S+@\S+\.\S+/.test(email)
  }

  function showAlert (message) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: message
    })
  }

  function highlightInvalidField (field) {
    field.style.borderColor = 'red'
  }

  function removeHighlight (field) {
    field.style.borderColor = ''
  }