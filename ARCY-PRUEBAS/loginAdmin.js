const server = "https://ollin-backend-production-46550904.up.railway.app";

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('login');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = document.getElementById('email')?.value.trim();
    const password = document.getElementById('password')?.value;
    const submit = form.querySelector('button[type="submit"]');

    if (!email || !password) {
      return showAdminLoginError('Completa tu correo y contraseña.');
    }

    if (submit) submit.disabled = true;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 18000);

    try {
      const response = await fetch(server + '/api/authenticatorAdmin/loginAdmin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Correo: email, Contrasena: password }),
        signal: controller.signal
      });
      const data = await response.json();
      if (!response.ok || data.error || data.status === 401 || data.status === 503) {
        throw new Error(data.error || data.message || 'No fue posible iniciar sesión.');
      }
      if (!data.token) throw new Error('El servidor no proporcionó una sesión válida.');

      localStorage.setItem('token', data.token);
      localStorage.setItem('isAdmin', 'true');
      if (typeof Swal !== 'undefined') {
        await Swal.fire({
          icon: 'success', title: '¡Bienvenido!',
          text: 'Tu sesión de administración está lista.',
          timer: 1200, showConfirmButton: false
        });
      }
      const redirect = new URL(data.redirect || '/inicioAdmin', location.origin);
      location.assign(redirect.origin === location.origin ? redirect.href : '/inicioAdmin');
    } catch (error) {
      console.error('Error en acceso de administración:', error.message);
      showAdminLoginError(error.name === 'AbortError'
        ? 'La conexión tardó demasiado. Intenta nuevamente.'
        : error.message || 'No se pudo conectar con Ollin.');
    } finally {
      clearTimeout(timer);
      if (submit) submit.disabled = false;
    }
  });
});

function showAdminLoginError(message) {
  if (typeof Swal !== 'undefined') {
    Swal.fire({ icon: 'error', title: 'Acceso no disponible', text: message });
  } else alert(message);
}
