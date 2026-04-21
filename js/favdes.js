import { showLoading, hideLoading } from "../ARCY-imports/loading.js";

let CURRENT_RENDER_TOKEN = 0;
let ALL_FAVORITES =[]
console.log("iniciandodespliegue");


// Define la URL de la API para obtener lugares favoritos
const API_URL = `${server}/api/lugarFavorito/obtenerLugaresFavoritos`;

// Función para obtener los lugares favoritos del usuario
async function fetchFavoritePlaces(idTurista) {
    console.log("fetchFavoritePlaces llamada con idTurista:", idTurista);
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idTurista })
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching favorite places:', error);
    }
}

// Función para obtener la información de un lugar sin utilizar el mapa
async function getInfo(placeId) {

    const { Place } = await google.maps.importLibrary('places');
    const place = new Place({ id: placeId, requestedLanguage: 'es' });

    await place.fetchFields({
        fields: [
            'displayName',
            'formattedAddress',
            'rating',
            'regularOpeningHours',
            'internationalPhoneNumber',
            'reviews',
            'photos',
            'types',
            'location' 
        ]
    });

    const imgWidth = 1000;
    const imgHeight = 1000;
    const photoUrls = place.photos
        ? place.photos.map(photo =>
            photo.getURI({ maxHeight: imgHeight, maxWidth: imgWidth })
        )
        : null;


    const lat = place.location?.lat();
    const lng = place.location?.lng();

    if (lat === undefined || lng === undefined) {
        console.warn('No se pudo obtener coordenadas para el lugar:', place);
    }

    return {
        name: place.displayName,
        type: place.types,
        placeID: place.id,
        address: place.formattedAddress,
        rating: place.rating,
        opening_hours: place.regularOpeningHours?.weekdayText || null,
        phone_number: place.internationalPhoneNumber || place.nationalPhoneNumber,
        reviews: place.reviews?.length ? place.reviews : null,
        photoUrls,
        coordinates: {
            lat,
            lng
        }
    };
}

  // Busca información de un museo por su nombre
  async function getInfoByName(name) {
    const { Place } = await google.maps.importLibrary('places');
    // Solo pedimos el place_id para no sobrecargar la llamada
    const results = await Place.searchByText({
      textQuery: name,
      fields: ['place_id']
    });
    if (!results.length) throw new Error('NoPlaceFound');
    // Reusa getInfo para cargar el resto de campos
    return getInfo(results[0].place_id);
  }
  
  function createFavoriteCard(placeInfo) {
    // Parse JSON if necessary
    if (typeof placeInfo === 'string') {
        try {
            placeInfo = JSON.parse(placeInfo);
        } catch (error) {
            console.error('Error parsing placeInfo:', error);
            return '';
        }
    }

    // Check for valid object
    if (!placeInfo || typeof placeInfo !== 'object') {
        console.error('placeInfo is not a valid object:', placeInfo);
        return '';
    }

    // Check and round rating
    const rating = typeof placeInfo.rating === 'number' ? Math.round(placeInfo.rating * 2) / 2 : 0;
    const starsHtml = generateStars(rating);

    // Generar el HTML para los detalles del horario de manera dinámica.
    let horariosDetallesHtml = placeInfo.opening_hours ? placeInfo.opening_hours.map((dayHours, index) => {
      // Asume que dayHours sigue el formato "Día de la semana: Horario", p.ej. "Lunes: 9:00 AM - 5:00 PM"
      let dayName = dayHours.split(':')[0].toLowerCase(); // Esto tomará "Lunes" y lo convertirá en "lunes"
      return `<div class="${dayName}" id="${dayName}">${dayHours}</div>`;
  }).join('') : '<div>Horario no especificado</div>';

  // El HTML para la sección de detalles de horario.
  const horarioHtml = `
      <div class="horario-detalles">
          <div class="horario-text" id="horario-text">${placeInfo.opening_hours ? 'Abierto hasta las 10:00 p.m.' : 'Horario no disponible'}</div>
          <!-- Arreglo que muestra detalles del horario de apertura del lugar -->
          <div class="weekend-text" style="display: none;">
              ${horariosDetallesHtml}
          </div>
      </div>
  `;
  
    // HTML generation adjusted to your div structure
    const card = `
	<div class="favorite-card">
    		<div class="card-left">
		    <img src="${placeInfo.photoUrls ? placeInfo.photoUrls[0] : 'assets/icons/Lugarejemplo.PNG'}" alt="Museo"/> 
		</div>
            	<div class="card-info-grid">
            		<div class="title-rating">
		        	<span class="info-name" id="info-name" data-placeid="${placeInfo.placeID}">
					${placeInfo.name || 'Nombre no especificado'}
				</span>
            			<div class="rating">
                			<div class="stars" id="stars">
                    				${starsHtml}
                			</div>
                			<span class="score" id="score">
						${rating}/5
					</span>
            			</div>
            		</div>


            		<div class="address">
                		<img src="assets/icons/ubicacionIcon.png" width="15px" height="15px" style="margin:0px 4px;">
				        ${placeInfo.address}
            		</div>
            		<div class="schedule">
                		<img src="assets/icons/reloj2.png" width="15px" height="15px" style="margin:0px 4px;">
                		<strong>Horarios:</strong>${horarioHtml}
            		</div>
        		<div class="card-actions">
            	    <img src="assets/icons/favoritosBlancoRosa.png" id="tuBotonEliminar">	
                    <img src="assets/icons/origenIcon.png" id= "agreIti">
          		</div>
           
            	</div>
	</div>
    `;

    return card;
}

function generateStars(rating) {
    let starsHtml = '';
    for (let i = 0; i < 5; i++) {
        starsHtml += `<span class="star" style="color: gold;">${i < rating ? '&#9733;' : '&#9734;'}</span>`;
    }
    return starsHtml;
}


async function displayFavorites(maxMuseos = CURRENT_LIMIT) {
    const renderToken = ++CURRENT_RENDER_TOKEN;

    const nombreUsuario = document.getElementById("nombreUsuario");
    const idTurista = nombreUsuario.getAttribute('data-id-turista');

    ALL_FAVORITES = await fetchFavoritePlaces(idTurista);

    console.log(ALL_FAVORITES)

    const favoritesContainer = document.getElementById('favodes');
    favoritesContainer.innerHTML = '';

    if (!ALL_FAVORITES || ALL_FAVORITES.length === 0) {
        favoritesContainer.innerHTML = `
            <div class="no-favorites-message">
                <p data-i18n="no_favorite_museums">No hay lugares favoritos agregados aún.</p>
                <button onclick="location.href='/museums'">Ir a agregar</button>
            </div>
        `;
        return;
    }

    let count = 0;
    const renderedIds = new Set();

    for (const place of ALL_FAVORITES) {

        if (renderToken !== CURRENT_RENDER_TOKEN) {
            return;
        }
        if (count >= maxMuseos) break;

        const storedId = place["ID MUSEO"];


        if (renderedIds.has(storedId)) {
            continue;
        }
        renderedIds.add(storedId);

        let placeInfo = null;
                const storedName = place["NombreMuseo"];

        try {
            placeInfo = await getInfo(storedId);
        } catch (e) {
            if (e.message.includes('NOT_FOUND')) {
                try {
                    placeInfo = await getInfoByName(storedName);
                } catch (e2) {
                    console.warn(`No se encontró info para "${storedName}"`);
                    continue;
                }
            } else {
                console.error(`Error en getInfo(${storedId}):`, e);
                continue;
            }
        }

        if (renderToken !== CURRENT_RENDER_TOKEN) return;

        const favoriteCardHtml = createFavoriteCard(placeInfo, place);

        if (renderToken !== CURRENT_RENDER_TOKEN) return;

        // Mejor que innerHTML +=
        favoritesContainer.insertAdjacentHTML("beforeend", favoriteCardHtml);

        count++;
    }
}

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('favodes'); // Asegúrate de usar el ID real de tu contenedor

  container.addEventListener('click', function(event) {
      if (event.target.id === 'tuBotonEliminar') {
          const idTurista = document.getElementById("nombreUsuario").getAttribute('data-id-turista');
          const idLugar = event.target.closest('.favorite-card').querySelector('.info-name').getAttribute('data-placeid');

          
          Swal.fire({
              title: "¿Estás seguro?",
              text: "Esta acción borrará este lugar de Favoritos",
              icon: "warning",
              showCancelButton: true,
              confirmButtonColor: "#65B2C6",
              cancelButtonColor: "#D63D6C",
              confirmButtonText: "Estoy seguro",
              cancelButtonText: "Regresar"
          }).then((result) => {
              if (result.isConfirmed) {
                 
                  removeFavorite(idLugar, idTurista);
              }
          });
      }

      if (event.target.id === 'agreIti') {
          const idLugar = event.target.closest('.favorite-card').querySelector('.info-name').getAttribute('data-placeid');
          window.location.href = `/inicio?placeId=${idLugar}`;
      }
  });
});




function removeFavorite(idLugar, idTurista) {
  fetch(`${server}/api/lugarFavorito/eliminarLugarFavorito`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
          id_Museo: idLugar,
          id_Turista: idTurista
      })
  })
  .then(response => response.json())
  .then(data => {
      console.log('Lugar eliminado de favoritos:', data);

      Swal.fire({
          title: "¡Eliminado!",
          text: "El lugar ha sido borrado de Favoritos",
          icon: "success"
      }).then(() => {
          window.location.reload();
      });
  })
  .catch(error => {
      console.error('Error al eliminar lugar de favoritos:', error);
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



// Inicializar la pantalla de favoritos cuando el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', async () => {
    await esperarUsuario();
    
    console.log("Inicializando pantalla de favoritos");

    let CURRENT_LIMIT = 3;
    const STEP = 10;

    showLoading("Cargando favoritos...");

    try {

        await displayFavorites(CURRENT_LIMIT); // usa internamente fetch o puedes adaptarla
    } catch (error) {
        console.error('Error al cargar favoritos:', error);

        const container = document.getElementById('favodes');
        container.innerHTML = `
            <div class="error-message">
                Error al cargar los favoritos. Intenta recargar la página.
            </div>
        `;
    } finally {
        hideLoading();
    }

    // 🔥 BOTONES
    const showMoreBtn = document.getElementById("showMoreBtn");
    const showLessBtn = document.getElementById("showLessBtn");

    showMoreBtn.style.display = "inline-block";
    showLessBtn.style.display = "none";

    showMoreBtn.addEventListener("click", async () => {
        CURRENT_LIMIT += STEP;

        showLoading("Cargando más favoritos...");

        try {
            await displayFavorites(CURRENT_LIMIT);
        } catch (e) {
            console.error("Error al mostrar más favoritos:", e);
        } finally {
            hideLoading();
        }

        showLessBtn.style.display = "inline-block";

        if (CURRENT_LIMIT >= ALL_FAVORITES.length) {
            showMoreBtn.style.display = "none";
        }
    });

    showLessBtn.addEventListener("click", async () => {
        CURRENT_LIMIT = 3;

        showLoading("Mostrando menos favoritos...");

        try {
            await displayFavorites(CURRENT_LIMIT);
        } catch (e) {
            console.error("Error al mostrar menos favoritos:", e);
        } finally {
            hideLoading();
        }

        showMoreBtn.style.display = "inline-block";
        showLessBtn.style.display = "none";
    });
});