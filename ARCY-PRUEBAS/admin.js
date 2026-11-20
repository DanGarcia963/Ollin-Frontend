const server = "https://ollin-backend-production-46550904.up.railway.app";

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(location.search);
  const tokenDesdeURL = params.get('token');

  if (tokenDesdeURL) {
    localStorage.setItem('token', tokenDesdeURL);
    params.delete('token');
    const rest = params.toString();
    history.replaceState({}, document.title, location.pathname + (rest ? '?' + rest : '') + location.hash);
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        icon: 'success',
        title: '¡Cuenta verificada!',
        text: 'Tu cuenta se ha verificado y puedes continuar explorando.',
        timer: 3000,
        showConfirmButton: false
      });
    }
  }

  const token = localStorage.getItem('token');
  if (!token) {
    location.replace('/');
    return;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(server + '/api/authenticator/usuarioLogueado', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
      signal: controller.signal
    });

    if (response.status === 401 || response.status === 403) {
      const invalid = new Error('Tu sesión ha expirado.');
      invalid.invalidSession = true;
      throw invalid;
    }
    if (!response.ok) {
      throw new Error('El servidor de Ollin no está disponible en este momento.');
    }

    const result = await response.json();
    const usuario = Array.isArray(result) ? result[0] : result;
    if (!usuario || typeof usuario !== 'object' || !usuario.id) {
      const invalid = new Error('Tu sesión ya no es válida.');
      invalid.invalidSession = true;
      throw invalid;
    }

    window.usuarioLogueado = usuario;
    window.idTurista = usuario.id;
    const nombreUsuario = document.getElementById('nombreUsuario');
    if (nombreUsuario) {
      nombreUsuario.textContent = usuario.Nombre || 'Visitante';
      nombreUsuario.dataset.idTurista = usuario.id;
    }
    window.dispatchEvent(new CustomEvent('ollin:session-ready', { detail: { id: usuario.id } }));
  } catch (error) {
    console.error('Error verificando sesión:', error.message);
    if (error.invalidSession) {
      localStorage.removeItem('token');
      location.replace('/');
      return;
    }

    // Las caídas temporales de Supabase no deben borrar una sesión válida.
    const message = document.createElement('div');
    message.className = 'ollin-network-alert';
    message.setAttribute('role', 'alert');
    message.textContent = 'No pudimos validar tu sesión. Revisa la conexión e inténtalo de nuevo. ';
    const retry = document.createElement('button');
    retry.type = 'button';
    retry.textContent = 'Reintentar';
    retry.style.cssText = 'margin-left:8px;text-decoration:underline;font-weight:700;';
    retry.addEventListener('click', () => location.reload());
    message.append(retry);
    document.body.append(message);
  } finally {
    clearTimeout(timer);
  }
});

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('cerrarSesion')?.addEventListener('click', (event) => {
    event.preventDefault();
    localStorage.removeItem('token');
    location.replace('/');
  });
});
