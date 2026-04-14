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

// Ajustar el tamaño del main según el tamaño de la pantalla
function ajustarTamanioMain () {
  const alturaHeader = document.querySelector('header').offsetHeight
  const alturaPantalla = window.innerHeight

  // Calcula el nuevo tamaño del main
  const nuevoTamanioMain = alturaPantalla - alturaHeader

  // Establece el nuevo tamaño
  document.querySelector('main').style.height = nuevoTamanioMain + 'px'
}

// Llamar a la función cuando la página se carga y también cuando la ventana cambia de tamaño
window.onload = window.onresize = ajustarTamanioMain



document.addEventListener('DOMContentLoaded', function() {
  var logoImage = document.getElementById('logoImage');

  logoImage.addEventListener('click', function() {
      window.location.href = '/inicio'; 
  });
});
