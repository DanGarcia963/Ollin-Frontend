const server = "https://ollin-backend-production-d68e.up.railway.app";

document.addEventListener('DOMContentLoaded', async function () {
  
  // 1. Sacamos la llave de la memoria
  const token = localStorage.getItem('token');

  // Si no trae llave, lo rebotamos inmediatamente
  if (!token) {
    console.log("No hay token guardado, regresando al login...");
    window.location.href = "/";
    return;
  }

  try {
    // 2. Mandamos la llave al backend en el cuerpo (body) de la petición
    const res = await fetch(`${server}/api/authenticator/usuarioLogueado`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token: token }) // ¡Vital mandar esto!
    });

    // Si el backend dice que el token es viejo o inválido
    if (!res.ok) {
      throw new Error("El backend rechazó el token (401)");
    }

    let usuario = await res.json();

    // 3. Parche para extraer el ID si viene en arreglo de Supabase
    if (Array.isArray(usuario) && usuario.length > 0) {
      usuario = usuario[0];
    }

    // Si el usuario viene vacío o es "false"
    if (!usuario || usuario === false) {
      throw new Error("Token válido pero usuario no existe");
    }

    // ==========================================
    // ¡ÉXITO! SI LLEGA AQUÍ, EL USUARIO ESTÁ DENTRO
    // ==========================================
    console.log("¡Sesión validada con éxito!", usuario);
    window.usuarioLogueado = usuario;
    window.idTurista = usuario.id; // Guardamos el ID del turista en una variable global para usarla en otros scripts
    const nombreUsuario = document.getElementById("nombreUsuario")
    nombreUsuario.innerHTML = usuario.Nombre  
    nombreUsuario.dataset.idTurista = usuario.id

    // Aquí ya puedes poner el código para pintar su nombre en el HTML
    // const nombreUsuario = document.getElementById("nombreUsuario");
    // if (nombreUsuario) nombreUsuario.innerHTML = usuario.Nombre;

  } catch (error) {
    // Si cualquier cosa falla arriba, borramos la llave sucia y lo rebotamos
    console.error("Error verificando sesión:", error.message);
    localStorage.removeItem('token');
    window.location.href = "/";
  }
});

document.addEventListener('DOMContentLoaded', function () {
  const logoutBtn = document.getElementById('cerrarSesion');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function () {
      localStorage.removeItem('token');
      window.location.href = "/";
    });
  }
});