document.addEventListener('DOMContentLoaded', async function () {

  const token = localStorage.getItem('token');
  if (!token) {
    console.log("No hay token guardado, regresando al login...");
        swal.fire({
      icon: 'error',
      title: 'Acceso denegado',
      text: 'No tienes permisos para acceder a esta página porque no tienes token válido.',
      showConfirmButton: true
    }).then((result) => {
      if(result.isConfirmed) {
    window.location.href = "/LogInAdmin";
      }
    });
    return;
  }

  const isAdmin = localStorage.getItem('isAdmin');
  if (!isAdmin || isAdmin !== 'true') {
    console.log("El token no corresponde a un admin, regresando al login...");
    swal.fire({
      icon: 'error',
      title: 'Acceso denegado',
      text: 'No tienes permisos para acceder a esta página porque no eres admin.',
      showConfirmButton: true
    }).then((result) => {
      if(result.isConfirmed) {
    window.location.href = "/LogInAdmin";
      }
    });
    return;
  }

  try{
  const res = await fetch(`${server}/api/authenticatorAdmin/usuarioadminLogueado`, {
  method: 'POST',
  headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ token: token })
  });

    if (!res.ok) {
      throw new Error("El backend rechazó el token (401)");
    }

    let usuario = await res.json();

    if (Array.isArray(usuario) && usuario.length > 0) {
      usuario = usuario[0];
    }

    if (!usuario || usuario === false) {
      throw new Error("Token válido pero usuario no existe");
    }

    console.log("¡Sesión de admin validada con éxito!", usuario);
    window.usuarioLogueado = usuario;
    const nombreUsuario = document.getElementById("nombreUsuario")
    nombreUsuario.innerHTML = usuario.Nombre  
    nombreUsuario.dataset.idAdmin = usuario.id_Administrador

  } catch (error) {
    console.error("Error verificando sesión de admin:", error.message);
    localStorage.removeItem('token');
    localStorage.removeItem('isAdmin');
    window.location.href = "/LoginAdmin";
  }
})

document.addEventListener('DOMContentLoaded', function () {
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function () {
      localStorage.removeItem('token');
      localStorage.removeItem('isAdmin');
      window.location.href = "/LoginAdmin";
  })
}
})