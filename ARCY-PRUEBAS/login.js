const server = "https://ollin-backend-production-46550904.up.railway.app";

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('login');
  if (!form) return;

  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const submit = document.getElementById('next');
  const message = document.getElementById('loginMessage');

  const showError = (text) => {
    if (message) {
      message.textContent = text;
      message.hidden = false;
    } else if (typeof Swal !== 'undefined') {
      Swal.fire({ icon: 'error', title: 'No pudimos iniciar sesión', text });
    } else alert(text);
  };

  [emailInput, passwordInput].forEach((input) => {
    input?.addEventListener('input', () => {
      if (message) message.textContent = '';
    });
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (submit.disabled) return;

    const email = emailInput.value.trim();
    const password = passwordInput.value;
    if (!email || !password || !emailInput.checkValidity()) {
      showError('Ingresa un correo válido y tu contraseña para continuar.');
      return;
    }

    submit.disabled = true;
    const previousLabel = submit.textContent;
    submit.textContent = 'Verificando tu cuenta…';
    if (message) message.textContent = '';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 18000);

    try {
      const response = await fetch(server + '/api/authenticator/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Correo: email, Contrasena: password }),
        signal: controller.signal
      });
      let result;
      try {
        result = await response.json();
      } catch (_) {
        throw new Error('El servidor respondió de forma inesperada. Intenta nuevamente.');
      }

      if (response.status === 503 || response.status === 502) {
        throw new Error('Ollin está teniendo dificultades para conectarse con la base de datos. Intenta nuevamente en un momento.');
      }
      if (!response.ok || result.error || result.status === 401 || result.status === 503) {
        throw new Error(result.error || result.message || 'No fue posible verificar tus datos.');
      }
      if (!result.token) {
        throw new Error('No recibimos una sesión válida del servidor. Intenta nuevamente.');
      }

      localStorage.setItem('token', result.token);
      // No permitir que un redirect inesperado salga del dominio de Ollin.
      const destination = new URL(result.redirect || '/inicio', location.origin);
      location.assign(destination.origin === location.origin ? destination.href : '/inicio');
    } catch (error) {
      console.error('Fallo de inicio de sesión:', error.message);
      showError(error.name === 'AbortError'
        ? 'La conexión está tardando demasiado. Comprueba tu red e inténtalo de nuevo.'
        : error.message || 'No se pudo conectar con Ollin.');
    } finally {
      clearTimeout(timeout);
      submit.disabled = false;
      submit.textContent = previousLabel;
    }
  });
});
