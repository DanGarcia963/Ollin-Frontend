//const server = "https://ollin-backend-production-d68e.up.railway.app"

const API_URL = `${server}/api/itinerario/obtenerItinerarios`;
const API_URL_CREAR_LUGAR_ITINERARIO = `${server}/api/lugarItinerario/crearLugarItinerario`;

async function fetchItineraryPlaces(id_Turista) {
    console.log("fetchItineraryPlaces llamada con idTurista:", id_Turista);
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_Turista })
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching favorite places:', error);
    }
}

async function displayIninerary() {
    setTimeout(async () => {
        const nombreUsuario = document.getElementById("nombreUsuario");
        const idTurista = nombreUsuario.getAttribute('data-id-turista');
        const itinerarios = await fetchItineraryPlaces(idTurista);
        const itinerariesContainer = document.getElementById('itinerariosDisponibles');

        // Filtrar los itinerarios que no tienen estado "F"
        const itinerariosFiltrados = itinerarios.filter(itinerario => itinerario.Estado !== 'F');

        if (itinerariosFiltrados && itinerariosFiltrados.length > 0) {
            itinerariesContainer.innerHTML = itinerariosFiltrados.map(createItineraryList).join('');
        } else {
            itinerariesContainer.innerHTML = '<div>No hay itinerarios disponibles.</div>';
        }
    }, 250);
}

function createItineraryList(itinerario, index) {
    return `
        <li>
            <button id="itinerarioID-${index}" class="dropdown-item" data-id-itinerario="${itinerario.ID}" data-nombre-itinerario="${itinerario.Nombre}">
                <img src="assets/icons/agregarIcon2.png" width="24px" height="24px">
                ${itinerario.Nombre}
            </button>
        </li>
    `;
}


async function addPlaceToItinerary(idItinerario, idLugar, nombreLugar) {
    console.log(idItinerario);
    console.log(idLugar);
    console.log(nombreLugar);
    try {
        const response = await fetch(API_URL_CREAR_LUGAR_ITINERARIO, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id_Lugar: idLugar,
                Nombre: nombreLugar,
                id_Itinerario: idItinerario,
                MetodoTransporte: "DRIVING"
            })
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const responseData = await response.json();
        console.log('Lugar añadido al itinerario:', responseData);

    } catch (error) {
        console.error('Error al añadir lugar al itinerario:', error);
    }
}
function showDone(nombreLugar, NombreItinerario) {
    Swal.fire({
        icon: "success",
        title: `¡Se ha agregado ${nombreLugar} a tu aventura ${NombreItinerario}!`, 
        showConfirmButton: false,
        timer: 1500,
    });
}

function esperarUsuario() {
    return new Promise(resolve => {
        const interval = setInterval(() => {
            if (window.usuarioLogueado) {
                clearInterval(interval);
                resolve(window.usuarioLogueado);
            }
        }, 50);
    });
}

document.addEventListener('DOMContentLoaded', async function () {
        await esperarUsuario(); // Esperar a que la variable global usuarioLogueado esté disponible
    
    console.log("DOMContentLoaded, inicializando pantalla de itinerarios");
    displayIninerary();
    document.getElementById('itinerariosDisponibles').addEventListener('click', async (event) => {
        if (event.target && event.target.matches("button.dropdown-item")) {
            // Extraer el índice del ID del botón
            const buttonId = event.target.id;
            const index = buttonId.split('-')[1];
            const itinerarioButton = document.getElementById(`itinerarioID-${index}`);

            if (itinerarioButton) {
                const idItinerario = itinerarioButton.getAttribute('data-id-itinerario');
                const nombreItinerario = itinerarioButton.getAttribute('data-nombre-itinerario');
                const nombreUsuario = document.getElementById("header-name");
                const idLugar = nombreUsuario.getAttribute('data-id-ubicacion');
                const nombreLugar = nombreUsuario.textContent;
                await addPlaceToItinerary(idItinerario, idLugar, nombreLugar);
                showDone(nombreLugar, nombreItinerario);
            }
        }
        

    });
});



