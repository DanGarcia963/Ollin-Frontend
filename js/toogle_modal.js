// Muestra/oculta el modal y el blur de fondo
document.addEventListener('DOMContentLoaded', function () {
  // Oculta el contenedor modal al principio
  const modal = document.getElementById('cModalSearchBox')
  // modal.style.display = "none";

  // Muestra el contenedor modal al hacer clic en el botón trigger
  document.getElementById('btnTriggerSB').addEventListener('click', function () {
    modal.style.opacity = '1'
    modal.style.visibility = 'visible'
  })

  // Oculta el contenedor modal al hacer clic en el botón de cerrar/regresar
  document.getElementById('btnClose').addEventListener('click', function () {
    modal.style.opacity = '0'
    modal.style.visibility = 'hidden'
  })
})
