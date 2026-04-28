// Función para obtener los usuarios
async function fetchUsers() {
  try {
      const response = await fetch(`${server}/api/usuarioTurista`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
  } catch (error) {
      console.error('Error fetching users:', error);
  }
}

function deleteUser(userID) {
    fetch(`${server}/api/deleteUsuario/${userID}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    })
    .then(response => response.json())
    .then(data => {
        Swal.fire({
            title: "Eliminado",
            text:"El usuario fue eliminado con éxito",
            icon: "success"
        }).then(()=>{
            window.location.reload();
        })
    })
    .catch(error => {
        console.error('Error al eliminar al usuario:', error);
    })
}

// Crea la tarjeta HTML para un usuario con TAILWIND (Responsive)
async function createUserCard(userInfo) {
    // Verificamos el estado para cambiar colores y textos
    const isVerified = userInfo.Estado_Cuenta === 'Y';
    
    // Ícono de verificado o no verificado
    const verifiedIcon = isVerified 
        ? `<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> <span class="truncate">Verificado</span>`
        : `<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> <span class="truncate">No Verificado</span>`;

    const verifiedColor = isVerified ? 'text-[#438B9E]' : 'text-gray-400';

    // Nueva tarjeta estilizada
    const card = `
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden w-full transition-transform hover:shadow-md hover:-translate-y-1">
        
        <div class="p-4 md:p-5 flex items-center gap-4 md:gap-5">
            
            <div class="w-12 h-12 md:w-16 md:h-16 bg-gray-200 rounded-full flex items-center justify-center shrink-0 shadow-inner overflow-hidden border-2 border-gray-50">
                <img src="assets/icons/Perfil.PNG" alt="User" class="w-full h-full object-cover" onerror="this.style.display='none'">
                <svg class="w-6 h-6 md:w-8 md:h-8 text-gray-400 absolute -z-10" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path>
                </svg>
            </div>
            
            <div class="flex flex-col min-w-0 flex-1">
                <h3 class="text-[#438B9E] font-bold text-base md:text-lg leading-tight mb-1 truncate" title="${userInfo.Nombre || 'Usuario Sin Nombre'}">
                    ${userInfo.Nombre || 'Usuario Sin Nombre'}
                </h3>
                <span class="${verifiedColor} font-medium text-xs md:text-sm flex items-center gap-1">
                    ${verifiedIcon}
                </span>
            </div>
            
        </div>
        
        <div class="border-t border-gray-100 bg-gray-50/50 p-2 md:p-3 flex justify-end gap-2 pr-4">
            
            <button class="text-[#438B9E] hover:bg-[#438B9E] hover:text-white p-2 rounded-lg transition-colors cursor-pointer editBtn" title="Editar" data-userid="${userInfo.id}">
                <svg class="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
            </button>
            
            <button class="text-gray-400 hover:bg-red-500 hover:text-white p-2 rounded-lg transition-colors cursor-pointer deleteBtn" title="Eliminar" data-userid="${userInfo.id}">
                <svg class="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>

        </div>
    </div>
    `;

    return card;
}

async function displayUsers(maxUsers = Infinity, filteredList = null) {
    const favoritePlaces = await fetchUsers();
    const museumContainer = document.getElementById('usersdes');
    const emptyMessage = document.getElementById('no-favorites-message');
    
    museumContainer.innerHTML = '';

    if (!favoritePlaces || favoritePlaces.length === 0) {
        emptyMessage.style.display = 'block';
        return;
    } else {
        emptyMessage.style.display = 'none';
    }

    let count = 0;

    for (const place of favoritePlaces) {
        if (count >= maxUsers) break;
        
        const cardHTML = await createUserCard(place);
        museumContainer.insertAdjacentHTML('beforeend', cardHTML);
        
        count++;
    }
}

function showDone(nombreLugar, NombreItinerario) {
    Swal.fire({
        icon: "success",
        title: `¡Se ha eliminado ${nombreLugar} a tu plan de visita ${NombreItinerario}!`, 
        showConfirmButton: false,
        timer: 1500,
    });
}

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('usersdes');

  container.addEventListener('click', async function(event) {
      const deleteBtn = event.target.closest('.deleteBtn');
      
      if(deleteBtn) {
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
                if(result.isConfirmed){
                    deleteUser(userID);
                }
            });
      }
  });
});

document.addEventListener('DOMContentLoaded', () => {
    displayUsers(1000);
});