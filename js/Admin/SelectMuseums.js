const server = "https://ollin-backend-production-d68e.up.railway.app"

// Define la URL de la API para obtener lugares favoritos
const API_URL = `${server}/api/lugar/`;

// Función para obtener los lugares favoritos del usuario
async function fetchPlaces() {
    console.log("fetchPlaces:");
    try {
        const response = await fetch(API_URL, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
            
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching favorite places:', error);
    }
}

function getInfo(place) {
    console.log("getInfo llamada con place:", place);
    return new Promise((resolve, reject) => {
      const request = {
        placeId: place,
        fields: ["place_id", "name"],
      };
  
      // Crear un elemento div que no está adjunto al DOM para el servicio Places
      const service = new google.maps.places.PlacesService(document.createElement('div'));
      service.getDetails(request, async (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
          const placeInfo = {
            name: place.name,
            placeID: place.place_id,
          };
          resolve(JSON.stringify(placeInfo, null, 2));
        } else {
          reject("Error al obtener detalles del lugar");
        }
      });
    });
  }
  
  async function selectMuseos() {
    const MuseosContainer = document.getElementById('Museos');
    MuseosContainer.innerHTML = '<option selected disabled>Cargando museos...</option>';

    try {
        const places = await fetchPlaces();

        if (places && places.length > 0) {
            MuseosContainer.innerHTML = '<option selected>Seleccione un museo</option>';

            for (const place of places) {
                const option = document.createElement('option');
                option.value = place.id_Museo || place.id || place._id; // Ajusta según el campo real
                option.textContent = place.Nombre || 'Museo sin nombre';
                MuseosContainer.appendChild(option);
            }
            console.log(MuseosContainer.value)
        } else {
            MuseosContainer.innerHTML = `<option value="">No hay museos disponibles</option>`;
        }
    } catch (error) {
        console.error("Error cargando los museos:", error);
        MuseosContainer.innerHTML = `<option value="">Error al cargar museos</option>`;
    }
}
function agregarListenerSelect() {
    const MuseosContainer = document.getElementById('Museos');
    MuseosContainer.addEventListener('change', (event) => {
        const selectedOption = event.target.options[event.target.selectedIndex];
        console.log("Seleccionaste:");
        console.log("ID:", selectedOption.value);
        console.log("Nombre:", selectedOption.textContent);
    });
}
/*async function selectMuseos() {
    setTimeout(async () => {
        const Places = await fetchPlaces();
        const MuseosContainer = document.getElementById('Museos');

        if (Places && Places.length > 0) {
            MuseosContainer.innerHTML = '<option selected disabled>Seleccione un lugar favorito</option>'; // Limpiar las opciones previas

            for (const place of favoritePlaces) {
                const placeInfo = await getInfo(place["ID LUGAR"]);

                const option = document.createElement('option');
                option.value = placeInfo.id || placeInfo._id || placeInfo["ID LUGAR"];
                option.textContent = placeInfo.nombre || placeInfo.titulo || 'Lugar sin nombre';
                MuseosContainer.appendChild(option);
            }
        } else {
            // Si no hay datos, muestra opciones por defecto o mensaje
            MuseosContainer.innerHTML = `
                <option value="">No hay lugares disponibles</option>
            `;
        }

    }, 250);
}*/

document.addEventListener('DOMContentLoaded', () => {
    console.log("Página cargada, inicializando museos...");
    selectMuseos().then(() => {
        agregarListenerSelect();
    });
});