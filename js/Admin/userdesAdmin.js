const server = "https://ollin-backend-production-d68e.up.railway.app"
// Función para obtener los museos
async function fetchUsers() {
  try {
      const response = await fetch(`${server}/api/usuarioTurista`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
  } catch (error) {
      console.error('Error fetching adventure places:', error);
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
            text:"El usuario fue eliminado con exito",
            icon: "success"
        }).then(()=>{
            window.location.reload();
        })
    })
    .catch(error => {
        console.error('Error al eliminar al usuario:', error);
    })
}

// Crea la tarjeta HTML para un museo
async function createUserCard(userInfo) {

    const verified = userInfo.Estado_Cuenta === 'Y'
    const textVerified = verified 
    ? ` <span class="info-name" id="info-name">
            Verificado
        </span>`
    : ` <span class="info-name" id="info-name">
            No Verificado
        </span>`;

    const imgVerified = verified
    ? `<img 
             src="/assets/icons/checkedAzul.PNG" 
             title="Verified"
             class="icon-alerta"
           >`
    : '';

    // Card HTML
    const card = `
    <div class="favorite-card">
        <div class="card-left">
            <img src="assets/icons/Perfil.PNG" alt="User"/>
        </div>

        <div class="card-info-grid">
            <div class="title-rating">
                <span class="info-name" id="info-name" data-userid="${userInfo.id}">
                    ${userInfo.Nombre}
                </span>
            </div>

            <div class="address">
                ${textVerified}
            </div>  

            <div class="card-actions flex items-center gap-2">
               
                ${imgVerified}

                <img 
                    src="/assets/icons/editarIcono.PNG" 
                    id="ViewMoreBtn" 
                    data-id-museo="${userInfo.id}"
                >


                <img 
                    src="/assets/icons/basureroIcon.PNG" 
                    id="deleteBtn" 
                    data-id-museo="${userInfo.id}"
                >

            </div>
        </div>
    </div>
    `;

    return card;
}

// Función para mostrar los museos en la página
async function displayUsers(maxMuseos = Infinity, filteredList = null) {

    const favoritePlaces = await fetchUsers();

    const museumContainer = document.getElementById('usersdes');
    museumContainer.innerHTML = '';

    let count = 0;

    for (const place of favoritePlaces) {

        const cardHTML = await createUserCard(place);

        museumContainer.innerHTML += cardHTML;
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
  const container = document.getElementById('usersdes'); // Asegúrate de usar el ID real de tu contenedor

  container.addEventListener('click', async function(event) {
      if(event.target.id === 'deleteBtn') {
            const userID = event.target.closest('.favorite-card').querySelector('.info-name').getAttribute('data-userid');
            Swal.fire({
                title: "¿Estás seguro?",
                text: "Esta acción eliminara a este usuario",
                icon: "question",
                showCancelButton: true,
                confirmButtonColor: "#65B2C6",
                cancelButtonColor: "#D63D6C",
                confirmButtonText: "Estoy seguro",
                cancelButtonText: "Regresar"
            }).then((result) => {
                if(result.isConfirmed){
                    deleteUser(userID);
                }
            });
            
      }
  });
});

// Inicializar la pantalla de museos cuando el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {
    displayUsers(1000);
  });