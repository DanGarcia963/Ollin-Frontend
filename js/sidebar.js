function openNav () {
  const modal = document.getElementById('modalSidebar')
  const buttons = document.getElementsByClassName('btn-sidebar')

  document.getElementById('sidebar').style.width = '220px'
  // Para cada boton del Sidebar
  setTimeout(function () {
    for (let i = 0; i < buttons.length; i++) {
      buttons[i].style.width = '100%' // Reemplaza 'nuevoValor' con el ancho que desees
    }
  }, 200)
  
  modal.style.opacity = '1'
  modal.style.visibility = 'visible'

  // document.getElementById("main").style.marginLeft = "0px";
}

function closeNav () {
  const modal = document.getElementById('modalSidebar')
  const buttons = document.getElementsByClassName('btn-sidebar')
  // Para cada boton del Sidebar
  for (let i = 0; i < buttons.length; i++) {
    buttons[i].style.width = '0%'
  }
  setTimeout(function () {
    document.getElementById('sidebar').style.width = '0'
  }, 200)
  modal.style.opacity = '0'
  modal.style.visibility = 'hidden'
  // document.getElementById("main").style.marginLeft= "0";
}

document.addEventListener('DOMContentLoaded', function () {
  const dropdownContent = document.getElementById('content-dropdown-lang')
  const toggleButton = document.getElementById('langSelector')

  // Agregar evento clic al botón del idioma
  toggleButton.addEventListener('click', function () {
    // Obtener el valor actual de opacity y convertirlo a un número
    const currentOpacity = parseFloat(window.getComputedStyle(dropdownContent).opacity)

    // Cambiar el valor de opacity según la condición
    dropdownContent.style.opacity = currentOpacity === 0 ? 1 : 0
  })
})


document.addEventListener('DOMContentLoaded', function() {
  var logoImage = document.getElementById('logoImage');

  logoImage.addEventListener('click', function() {
      window.location.href = '/inicio'; 
  });
});