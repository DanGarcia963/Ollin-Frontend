const API_BASE_URL = typeof server !== "undefined" ? server : window.server || "https://ollin-backend-production-46550904.up.railway.app";

let currentFilters = {
  nombre: '',
  estado: ''
};

// Función para obtener los usuarios con filtros
async function fetchUsers(filters = {}) {
  try {
    const params = new URLSearchParams();

    if (filters.nombre) params.append('nombre', filters.nombre);
    if (filters.estado) params.append('estado', filters.estado);

    const url = params.toString()
      ? `${API_BASE_URL}/api/usuarioTurista?${params.toString()}`
      : `${API_BASE_URL}/api/usuarioTurista`;

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

function deleteUser(userID) {
  fetch(`${API_BASE_URL}/api/deleteUsuario/${userID}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })
    .then(response => response.json())
    .then(() => {
      Swal.fire({
        title: "Eliminado",
        text: "El usuario fue eliminado con éxito",
        icon: "success"
      }).then(() => {
        displayUsers(1000, currentFilters);
      });
    })
    .catch(error => {
      console.error('Error al eliminar al usuario:', error);
    });
}

async function validateUser(userID) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/usuarioTurista/validarCuenta`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id_Turista: userID }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'No se pudo validar el usuario');
    }

    Swal.fire({
      icon: 'success',
      title: 'Usuario validado',
      text: result.message || 'El usuario fue validado correctamente.'
    }).then(() => {
      displayUsers(1000, currentFilters);
    });

  } catch (error) {
    console.error('Error validando usuario:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error.message || 'No se pudo validar el usuario.'
    });
  }
}

// Helper genérico para actualizar campos del usuario
async function updateUserField(endpoint, entrada) {
  const response = await fetch(`${API_BASE_URL}/api/usuarioTurista/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(entrada),
  });

  const data = await response.json();

  if (!response.ok || data.status >= 400) {
    throw new Error(data.error || `Error actualizando ${endpoint}`);
  }

  return data;
}

// Abre modal de edición
async function openEditUserModal(userID) {
  const users = await fetchUsers(currentFilters);
  const user = users.find(u => String(u.id) === String(userID));

  if (!user) {
    Swal.fire({
      icon: 'error',
      title: 'Usuario no encontrado',
      text: 'No se pudo localizar la información del usuario.',
    });
    return;
  }

  const { isConfirmed, value } = await Swal.fire({
    title: 'Editar usuario',
    html: `
      <div class="text-left space-y-3">
        <div>
          <label class="block text-sm font-semibold mb-1">Nombre</label>
          <input id="editNombre" class="swal2-input !m-0 w-full" value="${user.Nombre ?? ''}" />
        </div>

        <div>
          <label class="block text-sm font-semibold mb-1">Apellido</label>
          <input id="editApellido" class="swal2-input !m-0 w-full" value="${user.Apellido ?? ''}" />
        </div>

        <div>
          <label class="block text-sm font-semibold mb-1">Correo</label>
          <input id="editCorreo" type="email" class="swal2-input !m-0 w-full" value="${user.Correo ?? ''}" />
        </div>

        <div>
          <label class="block text-sm font-semibold mb-1">Nueva contraseña</label>
          <input id="editContrasena" type="password" class="swal2-input !m-0 w-full" placeholder="Dejar vacío para no cambiarla" />
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'Guardar cambios',
    cancelButtonText: 'Cancelar',
    focusConfirm: false,
    preConfirm: () => {
      const Nombre = document.getElementById('editNombre').value.trim();
      const Apellido = document.getElementById('editApellido').value.trim();
      const Correo = document.getElementById('editCorreo').value.trim();
      const Contrasena = document.getElementById('editContrasena').value.trim();

      if (!Nombre || !Apellido || !Correo) {
        Swal.showValidationMessage('Nombre, apellido y correo son obligatorios.');
        return false;
      }

      return { Nombre, Apellido, Correo, Contrasena };
    }
  });

  if (!isConfirmed) return;

  try {
    const entradaBase = { id_Turista: user.id };
    const promises = [];

    if (value.Nombre !== (user.Nombre ?? '')) {
      promises.push(updateUserField('actualizarNom', { ...entradaBase, Nombre: value.Nombre }));
    }

    if (value.Apellido !== (user.Apellido ?? '')) {
      promises.push(updateUserField('actualizarApe', { ...entradaBase, Apellido: value.Apellido }));
    }

    if (value.Correo !== (user.Correo ?? '')) {
      promises.push(updateUserField('actualizarEmail', { ...entradaBase, Correo: value.Correo }));
    }

    if (value.Contrasena) {
      promises.push(updateUserField('cambiarContrasena', { ...entradaBase, Contrasena: value.Contrasena }));
    }

    if (promises.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'Sin cambios',
        text: 'No modificaste ningún campo.',
      });
      return;
    }

    await Promise.all(promises);

    Swal.fire({
      icon: 'success',
      title: 'Actualizado',
      text: 'El usuario se actualizó correctamente.',
    }).then(() => {
      displayUsers(1000, currentFilters);
    });

  } catch (error) {
    console.error('Error actualizando usuario:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudo actualizar el usuario.',
    });
  }
}

// Crea la tarjeta HTML para un usuario
async function createUserCard(userInfo) {
  const isVerified = userInfo.Estado_Cuenta === 'Y';

  const verifiedBadge = isVerified
    ? `<span class="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">Verificado</span>`
    : `<span class="px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-semibold">No verificado</span>`;

  const verifyButton = isVerified
    ? `<span class="text-xs px-3 py-2 rounded-lg bg-gray-100 text-gray-500 font-semibold">Ya validado</span>`
    : `<button class="text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-2 rounded-lg transition-colors cursor-pointer verifyBtn" title="Validar" data-userid="${userInfo.id}">
         Validar
       </button>`;

  return `
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden w-full transition-transform hover:shadow-md hover:-translate-y-1">
      <div class="p-4 md:p-5 flex items-center gap-4 md:gap-5">
        <div class="w-12 h-12 md:w-16 md:h-16 bg-gray-200 rounded-full flex items-center justify-center shrink-0 shadow-inner overflow-hidden border-2 border-gray-50">
          <img src="assets/icons/Perfil.PNG" alt="User" class="w-full h-full object-cover" onerror="this.style.display='none'">
        </div>

        <div class="flex flex-col min-w-0 flex-1">
          <h3 class="text-[#438B9E] font-bold text-base md:text-lg leading-tight mb-1 truncate" title="${userInfo.Nombre || 'Usuario Sin Nombre'}">
            ${userInfo.Nombre || 'Usuario Sin Nombre'}
          </h3>

          <div class="flex flex-wrap items-center gap-2">
            ${verifiedBadge}
          </div>
        </div>
      </div>

      <div class="border-t border-gray-100 bg-gray-50/50 p-2 md:p-3 flex flex-wrap justify-end gap-2 pr-4">
        ${verifyButton}

        <button class="text-[#438B9E] hover:bg-[#438B9E] hover:text-white p-2 rounded-lg transition-colors cursor-pointer editBtn" title="Editar" data-userid="${userInfo.id}">
          <svg class="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
          </svg>
        </button>

        <button class="text-gray-400 hover:bg-red-500 hover:text-white p-2 rounded-lg transition-colors cursor-pointer deleteBtn" title="Eliminar" data-userid="${userInfo.id}">
          <svg class="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
          </svg>
        </button>
      </div>
    </div>
  `;
}

async function displayUsers(maxUsers = Infinity, filters = currentFilters) {
  const users = await fetchUsers(filters);
  const usersContainer = document.getElementById('usersdes');
  const emptyMessage = document.getElementById('no-favorites-message');

  usersContainer.innerHTML = '';

  if (!users || users.length === 0) {
    emptyMessage.style.display = 'block';
    emptyMessage.querySelector('p').textContent = 'No hay usuarios que coincidan con los filtros.';
    return;
  } else {
    emptyMessage.style.display = 'none';
  }

  let count = 0;

  for (const user of users) {
    if (count >= maxUsers) break;

    const cardHTML = await createUserCard(user);
    usersContainer.insertAdjacentHTML('beforeend', cardHTML);

    count++;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('usersdes');

  const inputName = document.getElementById('filterName');
  const selectVerified = document.getElementById('filterVerified');
  const btnApplyFilters = document.getElementById('btnApplyFilters');
  const btnClearFilters = document.getElementById('btnClearFilters');

  function applyFilters() {
    currentFilters = {
      nombre: inputName.value.trim(),
      estado: selectVerified.value
    };
    displayUsers(Infinity, currentFilters);
  }

  btnApplyFilters.addEventListener('click', applyFilters);

  btnClearFilters.addEventListener('click', () => {
    inputName.value = '';
    selectVerified.value = '';
    currentFilters = { nombre: '', estado: '' };
    displayUsers(Infinity, currentFilters);
  });

  inputName.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') applyFilters();
  });

  selectVerified.addEventListener('change', applyFilters);

  container.addEventListener('click', async function (event) {
    const editBtn = event.target.closest('.editBtn');
    const deleteBtn = event.target.closest('.deleteBtn');
    const verifyBtn = event.target.closest('.verifyBtn');

    if (editBtn) {
      const userID = editBtn.getAttribute('data-userid');
      await openEditUserModal(userID);
      return;
    }

    if (verifyBtn) {
      const userID = verifyBtn.getAttribute('data-userid');

      Swal.fire({
        title: "¿Validar usuario?",
        text: "Esta acción marcará al usuario como verificado.",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#16a34a",
        cancelButtonColor: "#888888",
        confirmButtonText: "Sí, validar",
        cancelButtonText: "Cancelar"
      }).then((result) => {
        if (result.isConfirmed) {
          validateUser(userID);
        }
      });

      return;
    }

    if (deleteBtn) {
      const userID = deleteBtn.getAttribute('data-userid');

      Swal.fire({
        title: "¿Estás seguro?",
        text: "Esta acción eliminará a este usuario de forma permanente.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#D63D6C",
        cancelButtonColor: "#888888",
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar"
      }).then((result) => {
        if (result.isConfirmed) {
          deleteUser(userID);
        }
      });
    }
  });

  displayUsers(Infinity, currentFilters);
});