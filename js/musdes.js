//const server = "https://ollin-backend-production-d68e.up.railway.app"




const API_URL = `${server}/api/lugar/`;
const API_URL1 = `${server}/api/itinerario/obtenerItinerarios`;
const API_URL_CREAR_LUGAR_ITINERARIO = `${server}/api/lugarItinerario/crearLugarItinerario`;
const museosData = {};
let ALL_MUSEOS = [];
let CURRENT_RENDER_TOKEN = 0;
let CURRENT_NAME_FILTER = '';
let CURRENT_ALCALDIAS = new Set();
let FILTER_ABRE_HOY = false;
let FILTER_ABIERTO_AHORA = false;
let FILTER_ALWAYS_FREE = false;
let FILTER_HAS_DISCOUNT = false;
let FILTER_HAS_SERVICES = false;
let FILTER_PRECIO_MAX = null;
let USER_LOCATION = null;
let FILTER_MAX_DISTANCE_KM = null;

// Función para obtener los museos
async function fetchPlaces() {
    try {
        const response = await fetch(API_URL, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching places:', error);
    }
}

async function initUserLocation() {
    try{
        USER_LOCATION = await getUserLocation()
    }
    catch(error){
        console.error("Error obteniendo USER_LOCATION:", error);
    }
}

function getDistanceInKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Función para agregar un museo a un plan de visita
async function addPlaceToItinerary(idPlan, idMuseo, NomLugar) {
    try {
        const response = await fetch(API_URL_CREAR_LUGAR_ITINERARIO, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id_Museo: idMuseo,
                Nombre: NomLugar,
                id_Plan: idPlan,
                MetodoTransporte: "DRIVING"
            })
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const responseData = await response.json();

    } catch (error) {
        console.error('Error al añadir lugar al itinerario:', error);
    }
}

const getUserLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject('Geolocalización no soportada');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude, longitude } }) => {
        resolve({ lat: latitude, lng: longitude });
      },
      err => reject(err),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
};


// Función para obtener los planes de visita del usuario
async function fetchItineraryPlaces(id_Turista) {
    try {
        const response = await fetch(API_URL1, {
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

// Agrega un museo a la lista de favoritos
function addFavorite(idMuseo, NomLugar, idTurista) {
    fetch(`${server}/api/lugarFavorito/crearLugarFavorito`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            id_Museo: idMuseo,
            Nombre: NomLugar,
            id_Turista: idTurista
        })
    })
    .then(response => response.json())
    .then(data => {
        Swal.fire({
            title: "Agregado!",
            text: "El lugar ha sido agregado a Favoritos",
            icon: "success"
        }).then(() => {
            window.location.reload();
        });
    })
    .catch(error => {
        console.error('Error al agregar lugar a favoritos:', error);
    });
  }

  // Agrega un museo a la lista de visitados
  function addVisit(idMuseo, NomLugar, idTurista) {
    fetch(`${server}/api/lugarVisitado/crearLugarVisitado`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            id_Museo: idMuseo,
            Nombre: NomLugar,
            id_Turista: idTurista
        })
    })
    .then(response => response.json())
    .then(data => {
  
        Swal.fire({
            title: "Agregado!",
            text: "El lugar ha sido agregado a Visitados",
            icon: "success"
        }).then(() => {
            window.location.reload();
        });
    })
    .catch(error => {
        console.error('Error al agregar lugar a visitados:', error);
    });
  }

  // Elimina un museo de la lista de favoritos
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

// Elimina un museo de la lista de visitados
function removeVisit(idLugar, idTurista) {
    fetch(`${server}/api/lugarVisitado/eliminarLugarVisitado`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            id_Museo: idLugar,
            id_Turista: idTurista
        })
    })
    .then(response => response.json())
    .then(data => {

        Swal.fire({
            title: "¡Eliminado!",
            text: "El lugar ha sido borrado de Visitados",
            icon: "success"
        }).then(() => {
            window.location.reload();
        });
    })
    .catch(error => {
        console.error('Error al eliminar lugar de visitados:', error);
    });
    }

    // Obtiene información detallada de un museo por su placeId
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

  // Verifica si un museo es favorito del usuario
async function getFavorite(idMuseo, idTurista) {
    try {
        const response = await fetch(
            `${server}/api/lugarFavorito/obtenerLugarFavoritoIdlugar`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id_Museo: idMuseo,
                    id_Turista: idTurista
                })
            }
        );

        const data = await response.json();

        // Si el backend manda mensaje cuando NO existe
        if (data.message) return null;

        return data; // EXISTE favorito
    } catch (error) {
        console.error('Error al obtener lugar favorito:', error);
        return null;
    }
}

// Verifica si un museo ha sido visitado por el usuario
async function getVisit(idMuseo, idTurista) {
    try {
        const response = await fetch(
            `${server}/api/lugarVisitado/obtenerLugarVisitadoIdlugar`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id_Museo: idMuseo,
                    id_Turista: idTurista
                })
            }
        );

        const data = await response.json();

        if (data.message) return null;

        return data; // EXISTE visitado
    } catch (error) {
        console.error('Error al obtener lugar visitado:', error);
        return null;
    }
}

// Normaliza valores de hora a formato "HH:MM"
function normalizeTime(value) {
  if (value === null || value === undefined) return null;

  
  value = String(value).trim();

  
  if (!value || value.toLowerCase() === 'null') return null;

  
  if (/^\d{1,2}$/.test(value)) {
    const h = value.padStart(2, '0');
    return `${h}:00`;
  }

  if (/^\d{1,2}:\d{1,2}$/.test(value)) {
    let [h, m] = value.split(':');
    h = h.padStart(2, '0');
    m = m.padStart(2, '0');
    return `${h}:${m}`;
  }

  if (/^\d{2}:\d{2}$/.test(value)) {
    return value;
  }

  return null;
}

// Obtiene el estado actual del horario (abierto, cerrado, antes de abrir)
function getHorarioEstado(scheduleInfo) {
  const DAYS_MAP = {
    0: 'Domingo',
    1: 'Lunes',
    2: 'Martes',
    3: 'Miercoles',
    4: 'Jueves',
    5: 'Viernes',
    6: 'Sabado'
  };

  const now = new Date();
  const today = DAYS_MAP[now.getDay()];
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const horarioIn = normalizeTime(scheduleInfo[`HorarioIn_${today}`]);
  const horarioOut = normalizeTime(scheduleInfo[`HorarioOut_${today}`]);

  if (!horarioIn || !horarioOut) {
    return {
      text: 'Está cerrado por hoy',
      status: 'closed'
    };
  }

  const [inH, inM] = horarioIn.split(':').map(Number);
  const [outH, outM] = horarioOut.split(':').map(Number);

  const open = inH * 60 + inM;
  const close = outH * 60 + outM;

  if (currentMinutes < open) {
    return {
      text: `Abre a las ${horarioIn} hrs`,
      status: 'before'
    };
  }

  if (currentMinutes >= close) {
    return {
      text: `Cerrado · Abrió de ${horarioIn} a ${horarioOut}`,
      status: 'after'
    };
  }

  return {
    text: `Abierto · Cierra a las ${horarioOut} hrs`,
    status: 'open'
  };
}

// Asigna prioridad para ordenar museos (abiertos primero, luego por abrir, luego cerrados)
function getMuseumPriority(scheduleInfo) {
  const estado = getHorarioEstado(scheduleInfo);

  switch (estado.status) {
    case 'open':
      return 0;
    case 'before':
      return 1;
    default:
      return 2;
  }
}

// Crea la tarjeta HTML para un museo
async function createMuseumCard(placeInfo, storedPlace) {

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

    // Rating
    const rating = typeof placeInfo.rating === 'number'
        ? Math.round(placeInfo.rating * 2) / 2
        : 0;

    const starsHtml = generateStars(rating);

    const userId = document
        .getElementById("nombreUsuario")
        .getAttribute('data-id-turista');
const isFavorite = await getFavorite(placeInfo.placeID, userId);
const isVisited  = await getVisit(placeInfo.placeID, userId);
    // Iconos dinámicos
    const favoriteIcon = isFavorite !== null
        ? "assets/icons/favoritosBlancoRosa.png"
        : "assets/icons/favoritosCoral.png";

    const visitedIcon = isVisited !== null
        ? "assets/icons/checkedRosa.png"
        : "assets/icons/checkedPalido.png";

const horarioEstado = getHorarioEstado(storedPlace);

    // Card HTML
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
        			<div class="stars">
						${starsHtml}
					</div>
        			<span class="score">
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
        		<strong>Horarios : </strong>${horarioEstado.text}
    		</div>    
            <div class="card-actions">
                <img src="/assets/icons/Boton ojoA.svg" id="ViewMoreBtn" data-id-museo="${placeInfo.placeID}">
                <img src="${visitedIcon}" id="tuBotonVisitados" data-visited="${isVisited !== null}">
                <img src="${favoriteIcon}" id="tuBotonFavoritos" data-favorite="${isFavorite !== null}">
                <img src="assets/icons/origenIcon.png" id= "agreIti">
                <img src="assets/icons/agregarAItinerario.png" id="tuBotonAgregar">
            </div>
        </div>
    </div>

    `;

    return card;
}

// Genera el HTML de las estrellas basado en la calificación
function generateStars(rating) {
    let starsHtml = '';
    for (let i = 0; i < 5; i++) {
        starsHtml += `<span class="star" style="color: gold;">${i < rating ? '&#9733;' : '&#9734;'}</span>`;
    }
    return starsHtml;
}

/* dentro de esta funcion se imprimen todos los museos
async function displayFavorites() {
    const favoritePlaces = await fetchPlaces();
    const museumContainer = document.getElementById('museodes');
    museumContainer.innerHTML = '';
  
    for (const place of favoritePlaces) {
      let placeInfo = null;
      const storedId   = place["ID MUSEO"];
      const storedName = place["NombreMuseo"];
  
      // 1) Intento con el placeId de la BD
      try {
        placeInfo = await getInfo(storedId);
      } catch (e) {
        // 2) Si no existe el ID, caigo a buscar por nombre
        if (e.message.includes('NOT_FOUND')) {
          try {
            placeInfo = await getInfoByName(storedName);
          } catch (e2) {
            // 3) Si tampoco hay resultados por nombre, lo ignoramos
            console.warn(`No se encontró info para "${storedName}", lo ignoramos.`);
            continue;
          }
        } else {
          // Otros errores (red, quota, etc.) también los ignoramos para no romper el bucle
          console.error(`Error inesperado en getInfo(${storedId}):`, e);
          continue;
        }
      }
      museumContainer.innerHTML += createMuseumCard(placeInfo);
    }
}*/

// Normaliza texto para comparaciones
function normalizeText(text) {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
}

// Aplica todos los filtros seleccionados
function applyAllFilters() {
    let result = [...ALL_MUSEOS];

    const search = CURRENT_NAME_FILTER.toLowerCase().trim();
    if (search) {
        const nameFiltered = result.filter(m =>
            m.NombreMuseo &&
            m.NombreMuseo.toLowerCase().includes(search)
        );

        
        if (nameFiltered.length > 0) {
            result = nameFiltered;
        }
    }

    
    if (CURRENT_ALCALDIAS.size > 0) {
        result = result.filter(m =>
            m.Municipio &&
            CURRENT_ALCALDIAS.has(normalizeText(m.Municipio))
        );
    }

      // Abre hoy
  if (FILTER_ABRE_HOY) {
    result = result.filter(abreHoy);
  }

  // Abierto ahora
  if (FILTER_ABIERTO_AHORA) {
    result = result.filter(m => getHorarioEstado(m).status === 'open');
  }

  // Gratis
  if (FILTER_ALWAYS_FREE) {
    result = result.filter(m => isAlwaysFree(m));
  }

  if (FILTER_HAS_DISCOUNT) {
    result = result.filter(m => hasDiscount(m));
  }

  if (FILTER_HAS_SERVICES) {
    result = result.filter(m => hasServices(m));
  }

  // Precio máximo
  if (FILTER_PRECIO_MAX != null) {
    result = result.filter(m => {
      const p = getPrecioEstimado(m);
      return p === null || p <= FILTER_PRECIO_MAX;
    });
  }

  // Distancia máxima
    if (FILTER_MAX_DISTANCE_KM != null && USER_LOCATION != null) {
        result = result.filter(m => {
            if (!m.Latitud || !m.Longitud) return false;
            const dist = getDistanceInKm(
                USER_LOCATION.lat,
                USER_LOCATION.lng,
                parseFloat(m.Latitud),

                parseFloat(m.Longitud)  
            );
            return dist <= FILTER_MAX_DISTANCE_KM;
        });
    }


    // Render final
    displayFavorites(3, result);
}

// Evento boton aplicar filtros
document.getElementById('filterSend').addEventListener('click', () => {
  CURRENT_ALCALDIAS.clear();

  // Alcaldías
  document.querySelectorAll('.alcaldia-checkbox:checked')
    .forEach(cb => {
      CURRENT_ALCALDIAS.add(normalizeText(cb.dataset.alcaldia));
    });

  // Filtros avanzados (¡CORREGIDO: ID filterHasDiscounts con 's'!)
  FILTER_ALWAYS_FREE = document.getElementById('filterAlwaysFree')?.checked || false;
  FILTER_HAS_DISCOUNT = document.getElementById('filterHasDiscounts')?.checked || false;
  FILTER_HAS_SERVICES = document.getElementById('filterHasServices')?.checked || false;
  FILTER_ABIERTO_AHORA = document.getElementById('filter-abierto-ahora')?.checked || false;
  FILTER_ABRE_HOY = document.getElementById('filter-abre-hoy')?.checked || false;

  const precioVal = document.getElementById('filter-precio-max')?.value;
  FILTER_PRECIO_MAX = precioVal ? parseInt(precioVal) : null;

  const distVal = document.getElementById('filterDistanceKm')?.value;
  FILTER_MAX_DISTANCE_KM = distVal ? parseInt(distVal) : null;

  applyAllFilters();
});

// Evento boton borrar filtros
document.getElementById('filterErase').addEventListener('click', () => {
  CURRENT_ALCALDIAS.clear();
  CURRENT_NAME_FILTER = '';

  FILTER_ALWAYS_FREE = false;
  FILTER_HAS_DISCOUNT = false;
  FILTER_HAS_SERVICES = false;
  FILTER_ABIERTO_AHORA = false;
  FILTER_ABRE_HOY = false;
  FILTER_PRECIO_MAX = null;
  FILTER_MAX_DISTANCE_KM = null;

  // Limpiar checkboxes de Alcaldías
  document.querySelectorAll('.alcaldia-checkbox')
    .forEach(cb => cb.checked = false);

  // Limpiar checkboxes Avanzados de manera segura (con validación if)
  if (document.getElementById('filterAlwaysFree')) document.getElementById('filterAlwaysFree').checked = false;
  if (document.getElementById('filterHasDiscounts')) document.getElementById('filterHasDiscounts').checked = false; // ¡CORREGIDO!
  if (document.getElementById('filterHasServices')) document.getElementById('filterHasServices').checked = false;
  if (document.getElementById('filter-abierto-ahora')) document.getElementById('filter-abierto-ahora').checked = false;
  if (document.getElementById('filter-abre-hoy')) document.getElementById('filter-abre-hoy').checked = false;

  // Limpiar inputs de texto y selects
  const precioInput = document.getElementById('filter-precio-max');
  if (precioInput) precioInput.value = '';

  const searchInput = document.getElementById('searchMuseoInput');
  if (searchInput) searchInput.value = '';

  const distSelect = document.getElementById('filterDistanceKm');
  if (distSelect) distSelect.value = '';

  // Volver a aplicar los filtros vacíos para mostrar todo
  applyAllFilters();
});



// Función para mostrar los museos en la página
async function displayFavorites(maxMuseos = Infinity, filteredList = null) {
    const renderToken = ++CURRENT_RENDER_TOKEN;

    const favoritePlaces = filteredList || await fetchPlaces();

    // Ordenar por prioridad (abierto, antes, cerrado)
    favoritePlaces.sort((a, b) => {
        return getMuseumPriority(a) - getMuseumPriority(b);
    });
    const museumContainer = document.getElementById('museodes');
    museumContainer.innerHTML = '';

    let count = 0;
    const renderedIds = new Set(); 

    for (const place of favoritePlaces) {

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
                    console.warn(`No se encontró info para "${storedName}", lo ignoramos.`);
                    continue;
                }
            } else {
                console.error(`Error inesperado en getInfo(${storedId}):`, e);
                continue;
            }
        }


        if (renderToken !== CURRENT_RENDER_TOKEN) {
            return;
        }

        const cardHTML = await createMuseumCard(placeInfo, place);

        if (renderToken !== CURRENT_RENDER_TOKEN) {
            return;
        }

        museumContainer.innerHTML += cardHTML;
        count++;
    }

    if(!filteredList){
        ALL_MUSEOS = favoritePlaces;
    }

}

//Filtros Avanzados 
// Verifica si el museo abre hoy
function abreHoy(museo) {
  const dayMap = {
    0: 'Domingo',
    1: 'Lunes',
    2: 'Martes',
    3: 'Miercoles',
    4: 'Jueves',
    5: 'Viernes',
    6: 'Sabado'
  };

  const today = dayMap[new Date().getDay()];
  return museo[`HorarioIn_${today}`] && museo[`HorarioOut_${today}`];
}

// Verifica si el museo es gratuito
function isAlwaysFree(museo) {
  const hasGeneral =
    museo.AdmisionGeneral && museo.AdmisionGeneral.length > 0;

  const text = getAllPriceText(museo);

  const hasFreeKeywords =
    text.includes('gratuit') ||
    text.includes('libre') ||
    text.includes('gratis') ||
    text.includes('acceso gratuito');

  // Regla:
  // NO tiene admisión general
  // y puede o no tener texto de gratis
  return !hasGeneral && (hasFreeKeywords || text.length === 0);
}

// Verifica si el museo tiene descuentos, entradas gratuitas o excepciones
function hasDiscount(museo) {
  const hasGeneral =
    museo.AdmisionGeneral && museo.AdmisionGeneral.length > 0;

  if (!hasGeneral) return false; // SIN general NO es descuento

  const text = getAllPriceText(museo);

  const hasFreeOrExceptions =
    text.includes('gratuit') ||
    text.includes('libre') ||
    text.includes('gratis') ||
    text.includes('domingo') ||
    text.includes('domingos') ||
    text.includes('estudiante') ||
    text.includes('maestro') ||
    text.includes('docente') ||
    text.includes('adulto mayor') ||
    text.includes('tercera edad') ||
    text.includes('menor') ||
    text.includes('niño') ||
    text.includes('descuento');

  return hasFreeOrExceptions;
}

// Extrae todo el texto relacionado con precios del museo
function getAllPriceText(museo) {
  return [
    ...(museo.AdmisionGeneral || []),
    ...(museo.EntradaGratuita || []),
    ...(museo.EntradaLibre || []),
    ...(museo.AccesoGratuito || []),
    ...(museo.EntradaesGratuita || [])
  ].join(' ').toLowerCase();
}

// Extrae un precio estimado del museo
function getPrecioEstimado(m) {
  const textos = [
    m.EntradaGeneral,
    m.AdmisionGeneral,
    m.OtrosCostos
  ].join(' ').toLowerCase();

  const match = textos.match(/\$?\s*(\d+)/);
  return match ? parseInt(match[1]) : null;
}

// Verifica si el museo abre en un día específico
function abreElDia(m, dia) {
  return m[`HorarioIn_${dia}`] && m[`HorarioOut_${dia}`];
}

// Verifica si el museo tiene servicios listados
function hasServices(museo) {
  return museo.Servicios && museo.Servicios.length > 0;
}

//funcion de busqueda de museos por nombre
function buscarMuseosPorNombre(texto) {
    CURRENT_NAME_FILTER = texto;
    applyAllFilters();
}

//evento input busqueda de museos por nombre
document.getElementById('searchMuseoInput').addEventListener('input', (event) => {
    buscarMuseosPorNombre(event.target.value);
});

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

//Mostrar mensaje de exito al agregar museo al plan de visita
function showDone(nombreLugar, NombreItinerario) {
    Swal.fire({
        icon: "success",
        title: `¡Se ha agregado ${nombreLugar} a tu plan de visita ${NombreItinerario}!`, 
        showConfirmButton: false,
        timer: 1500,
    });
}

//Agregar seccion al modal de ver mas informacion sobre el museo
function agregarSeccion(container, titulo, datos) {

    const entries = Object.entries(datos)
        .filter(([_, valor]) => valor && valor !== "null");

    if (!entries.length) return;

    const section = document.createElement("section");
    section.innerHTML = `<h3>${titulo}</h3>`;

    entries.forEach(([label, value]) => {
        const p = document.createElement("p");
        p.innerHTML = `<b>${label}:</b> ${value}`;
        section.appendChild(p);
    });

    container.appendChild(section);
}

function formatoHorario(inicio, fin) {
    if (!inicio || !fin) return null;
    return `${inicio} hrs – ${fin} hrs`;
}

document.getElementById("vm-cerrar").addEventListener("click", () => {
    document.getElementById("viewMoreCard").classList.add("hidden");
});

document.addEventListener("click", (e) => {
    const modal = document.getElementById("viewMoreCard");
    if (e.target === modal) {
        modal.classList.add("hidden");
    }
});

//Abre el modal para ver mas informacion sobre el museo
function abrirViewMore(museoData, infoLugar) {
    const language = localStorage.getItem('lang') || 'es';
    console.log('Idioma para View More:', language);
    const direccion = infoLugar ? infoLugar.address : "Dirección no disponible";
    const photo = infoLugar && infoLugar.photoUrls && infoLugar.photoUrls.length > 0
        ? infoLugar.photoUrls[0]
        : "assets/icons/Lugarejemplo.PNG";

            const photo2 = infoLugar && infoLugar.photoUrls && infoLugar.photoUrls.length > 0
        ? infoLugar.photoUrls[1]
        : "assets/icons/Lugarejemplo.PNG";

    document.getElementById("vm-nombre").textContent = museoData.NombreMuseo;

    const img = document.getElementById("vm-image");
img.src = photo;
const img2 = document.getElementById("vm-image2");
img2.src = photo2;

    const body = document.getElementById("vm-body");
    body.innerHTML = "";

    if(language === 'es') {

    agregarSeccion(body, "Ubicación", {
        "Municipio": museoData.Municipio,
        "Dirección": direccion
    });

    agregarSeccion(body, "Horarios", {
        "Lunes": formatoHorario(museoData.HorarioIn_Lunes, museoData.HorarioOut_Lunes),
        "Martes": formatoHorario(museoData.HorarioIn_Martes, museoData.HorarioOut_Martes),
        "Miércoles": formatoHorario(museoData.HorarioIn_Miercoles, museoData.HorarioOut_Miercoles),
        "Jueves": formatoHorario(museoData.HorarioIn_Jueves, museoData.HorarioOut_Jueves),
        "Viernes": formatoHorario(museoData.HorarioIn_Viernes, museoData.HorarioOut_Viernes),
        "Sábado": formatoHorario(museoData.HorarioIn_Sabado, museoData.HorarioOut_Sabado),
        "Domingo": formatoHorario(museoData.HorarioIn_Domingo, museoData.HorarioOut_Domingo),
        "Otros": museoData.OtrosHorarios
    });

    agregarSeccion(body, "Costos", {
        "Admisión general": museoData.AdmisionGeneral,
        "Entrada general": museoData.EntradaGeneral,
        "Entrada libre": museoData.EntradaLibre || museoData.Libre,
        "Entrada gratuita": museoData.EntradaGratuita || museoData.Gratuita || museoData.AccesoGratuito,
        "Otros costos": museoData.OtrosCostos
    });

    agregarSeccion(body, "Información adicional", {
        "Datos generales": museoData.DatosGenerales,
        "Salas de exhibición": museoData.SalasExhibicion,
        "Salas temporales": museoData.SalasExhibicionTemporales,
        "Servicios": museoData.Servicios,
        "Fecha de fundación": museoData.FechaFundacion,
    });

    agregarSeccion(body, "Información de contacto", {
        "Teléfono": infoLugar.phone_number || "No disponible",
    });
    } else if (language === 'en') {

    agregarSeccion(body, "Location", {
        "Municipality": museoData.Municipio,
        "Address": direccion
    });

    agregarSeccion(body, "Schedule", {
        "Monday": formatoHorario(museoData.HorarioIn_Lunes, museoData.HorarioOut_Lunes),
        "Tuesday": formatoHorario(museoData.HorarioIn_Martes, museoData.HorarioOut_Martes),
        "Wednesday": formatoHorario(museoData.HorarioIn_Miercoles, museoData.HorarioOut_Miercoles),
        "Thursday": formatoHorario(museoData.HorarioIn_Jueves, museoData.HorarioOut_Jueves),
        "Friday": formatoHorario(museoData.HorarioIn_Viernes, museoData.HorarioOut_Viernes),
        "Saturday": formatoHorario(museoData.HorarioIn_Sabado, museoData.HorarioOut_Sabado),
        "Sunday": formatoHorario(museoData.HorarioIn_Domingo, museoData.HorarioOut_Domingo),
        "Other": museoData.OtrosHorarios
    });

    agregarSeccion(body, "Costs", {
        "General admission": museoData.AdmisionGeneral,
        "General entry": museoData.EntradaGeneral,
        "Free entry": museoData.EntradaLibre || museoData.Libre,
        "Free admission": museoData.EntradaGratuita || museoData.Gratuita || museoData.AccesoGratuito,
        "Other costs": museoData.OtrosCostos
    });

        agregarSeccion(body, "Additional Information", {
            "General information": museoData.DatosGenerales_en,
            "Exhibition rooms": museoData.SalasExhibicion_en,
            "Temporary exhibition rooms": museoData.SalasExhibicionTemporales_en,
            "Services": museoData.Servicios_en,
            "Foundation date": museoData.FechaFundacion_en,
        });
        agregarSeccion(body, "Contact Information", {
        "Phone": infoLugar.phone_number || "Not available",
    });
    } else if (language === 'fr') {

        agregarSeccion(body, "Emplacement", {
            "Municipalité": museoData.Municipio,
            "Adresse": direccion
        });

        agregarSeccion(body, "Horaires", {
        "Lundi": formatoHorario(museoData.HorarioIn_Lunes, museoData.HorarioOut_Lunes),
        "Mardi": formatoHorario(museoData.HorarioIn_Martes, museoData.HorarioOut_Martes),
        "Mercredi": formatoHorario(museoData.HorarioIn_Miercoles, museoData.HorarioOut_Miercoles),
        "Jeudi": formatoHorario(museoData.HorarioIn_Jueves, museoData.HorarioOut_Jueves),
        "Vendredi": formatoHorario(museoData.HorarioIn_Viernes, museoData.HorarioOut_Viernes),
        "Samedi": formatoHorario(museoData.HorarioIn_Sabado, museoData.HorarioOut_Sabado),
        "Dimanche": formatoHorario(museoData.HorarioIn_Domingo, museoData.HorarioOut_Domingo),
        "Autres": museoData.OtrosHorarios
    });

        agregarSeccion(body, "Coûts", {
            "Admission générale": museoData.AdmisionGeneral,
            "Entrée générale": museoData.EntradaGeneral,
            "Entrée libre": museoData.EntradaLibre || museoData.Libre,
            "Entrée gratuite": museoData.EntradaGratuita || museoData.Gratuita || museoData.AccesoGratuito,
            "Autres coûts": museoData.OtrosCostos
        });

        agregarSeccion(body, "Informations supplémentaires", {
            "Informations générales": museoData.DatosGenerales_fr,
            "Salles d'exposition": museoData.SalasExhibicion_fr,
            "Salles d'exposition temporaires": museoData.SalasExhibicionTemporales_fr,
            "Services": museoData.Servicios_fr,
            "Date de fondation": museoData.FechaFundacion_fr,
        });

        agregarSeccion(body, "Informations de contact", {
            "Téléphone": infoLugar.phone_number || "Non disponible",
        });
    } else if(language === 'it') {

        agregarSeccion(body, "Posizione", { 
            "Municipio": museoData.Municipio,
            "Indirizzo": direccion
        });
        agregarSeccion(body, "Orari", {
            "Lunedì": formatoHorario(museoData.HorarioIn_Lunes, museoData.HorarioOut_Lunes),
            "Martedì": formatoHorario(museoData.HorarioIn_Martes, museoData.HorarioOut_Martes),
            "Mercoledì": formatoHorario(museoData.HorarioIn_Miercoles, museoData.HorarioOut_Miercoles),
            "Giovedì": formatoHorario(museoData.HorarioIn_Jueves, museoData.HorarioOut_Jueves),
            "Venerdì": formatoHorario(museoData.HorarioIn_Viernes, museoData.HorarioOut_Viernes),
            "Sabato": formatoHorario(museoData.HorarioIn_Sabado, museoData.HorarioOut_Sabado),
            "Domenica": formatoHorario(museoData.HorarioIn_Domingo, museoData.HorarioOut_Domingo),
            "Altri": museoData.OtrosHorarios
        });

            agregarSeccion(body, "Costi", {
            "Ingresso generale": museoData.AdmisionGeneral,
            "Ingresso generale": museoData.EntradaGeneral,
            "Ingresso libero": museoData.EntradaLibre || museoData.Libre,
            "Ingresso gratuito": museoData.EntradaGratuita || museoData.Gratuita || museoData.AccesoGratuito,
            "Altri costi": museoData.OtrosCostos
        });

            agregarSeccion(body, "Informazioni aggiuntive", {
            "Informazioni generali": museoData.DatosGenerales_it,
            "Sale espositive": museoData.SalasExhibicion_it,
            "Sale espositive temporanee": museoData.SalasExhibicionTemporales_it,
            "Servizi": museoData.Servicios_it,
            "Data di fondazione": museoData.FechaFundacion_it,
        });

        agregarSeccion(body, "Informazioni di contatto", {
            "Telefono": infoLugar.phone_number || "Non disponibile",
        });
    }
    document.getElementById("viewMoreCard").classList.remove("hidden");
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

document.addEventListener('DOMContentLoaded', async () => {
        await esperarUsuario();
    const select = document.getElementById('lang-select');
    const saved = localStorage.getItem('lang') || 'es';
    select.value = saved;
    console.log('Idioma seleccionado:', saved);
  const container = document.getElementById('museodes'); // Asegúrate de usar el ID real de tu contenedor

  container.addEventListener('click', async function(event) {
      if (event.target.id === 'tuBotonAgregar') {
          //const idTurista = document.getElementById("nombreUsuario").getAttribute('data-id-turista');
          const idMuseo = event.target.closest('.favorite-card').querySelector('.info-name').getAttribute('data-placeid');
          const nombreMuseo=event.target.closest('.favorite-card').querySelector('.info-name').textContent.trim();
            var modal = new bootstrap.Modal(document.getElementById('nuevaAventuraModal'));
            modal.show();
        displayIninerary();
            document.getElementById('itinerariosDisponibles').addEventListener('click', async (event) => {
        if (event.target && event.target.matches("button.dropdown-item")) {
            // Extraer el índice del ID del botón
            const buttonId = event.target.id;
            const index = buttonId.split('-')[1];
            const itinerarioButton = document.getElementById(`itinerarioID-${index}`);

            if (itinerarioButton) {
                const idPlan = itinerarioButton.getAttribute('data-id-itinerario');
                const nombreItinerario = itinerarioButton.getAttribute('data-nombre-itinerario');
                
                await addPlaceToItinerary(idPlan, idMuseo, nombreMuseo);
                showDone(nombreMuseo, nombreItinerario);
                modal.hide();
            }
        }
        

    });
    document.querySelector('.create-adventure-link').addEventListener('click', function() {
        var modal = new bootstrap.Modal(document.getElementById('newPlanModal'));
        modal.show();
        document.getElementById('formNuevaAventura').addEventListener('submit', async (e) => {
        e.preventDefault();

        // Obtener el valor del itinerario y el id del turista
        const nombreItinerario = document.getElementById('nombreItinerario').value;
        const nombreUsuario = document.getElementById("nombreUsuario");
        const idTurista = nombreUsuario.dataset.idTurista; // Obtener el id del turista

        // Validar que los campos no estén vacíos
        if (!nombreItinerario.trim() || !idTurista.trim()) {
            return; // Detener la ejecución si alguno de los campos está vacío
        }

        if (nombreItinerario.trim().length < 5 || nombreItinerario.trim().length > 15) {
            return;
        }
        // Realizar la petición fetch para enviar los datos
        try {
            const res = await fetch(`${server}/api/itinerario/crearItinerario`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    Nombre: nombreItinerario,
                    id_Turista: idTurista
                })
            });

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }

        const { id_Plan: idPlan, mensaje } = await res.json();

        // Llamamos a tu función pasando el idPlan recién creado
        await addPlaceToItinerary(idPlan, idMuseo, nombreMuseo);
        showDone(nombreMuseo, nombreItinerario);

            setTimeout(function() {
                window.location.reload();
            }, 1000);

        } catch (error) {
            console.error('Hubo un problema con la petición Fetch:', error);
        }
        });
    });

      }
      if(event.target.id === 'ViewMoreBtn') {
            const idLugar = event.target.closest('.favorite-card').querySelector('.info-name').getAttribute('data-placeid');
            const infoLugar = await getInfo(idLugar);
            const museum = await fetchPlaces().then(places => places.find(p => p["ID MUSEO"] === idLugar));
            abrirViewMore(museum, infoLugar, );
      }

      if (event.target.id === 'agreIti') {
          const idLugar = event.target.closest('.favorite-card').querySelector('.info-name').getAttribute('data-placeid');
          window.location.href = `/singleRoute?placeId=${idLugar}`;
      }

      if(event.target.id ==='tuBotonFavoritos')
      {
        if(event.target.getAttribute('data-favorite') !== 'true') {
        const idTurista = document.getElementById("nombreUsuario").getAttribute('data-id-turista');
        const idLugar = event.target.closest('.favorite-card').querySelector('.info-name').getAttribute('data-placeid');
        const nombreMuseo=event.target.closest('.favorite-card').querySelector('.info-name').textContent.trim();
        Swal.fire({
            title: "¿Estás seguro?",
            text: "Esta acción agregara este Museo a Favoritos",
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#65B2C6",
            cancelButtonColor: "#D63D6C",
            confirmButtonText: "Estoy seguro",
            cancelButtonText: "Regresar"
        }).then((result) => {
            if (result.isConfirmed) {
               
                addFavorite(idLugar, nombreMuseo, idTurista);
            }
        });
        }
        else {
        const idTurista = document.getElementById("nombreUsuario").getAttribute('data-id-turista');
        const idLugar = event.target.closest('.favorite-card').querySelector('.info-name').getAttribute('data-placeid');
        Swal.fire({
            title: "¿Estás seguro?",
            text: "Esta acción eliminará este Museo de Favoritos",
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
      }

      if(event.target.id ==='tuBotonVisitados')
      {
        if(event.target.getAttribute('data-visited') !== 'true') {
        const idTurista = document.getElementById("nombreUsuario").getAttribute('data-id-turista');
        const idLugar = event.target.closest('.favorite-card').querySelector('.info-name').getAttribute('data-placeid');
        const nombreMuseo=event.target.closest('.favorite-card').querySelector('.info-name').textContent.trim();
        Swal.fire({
            title: "¿Estás seguro?",
            text: "Esta acción agregara este Museo a Visitados",
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#65B2C6",
            cancelButtonColor: "#D63D6C",
            confirmButtonText: "Estoy seguro",
            cancelButtonText: "Regresar"
        }).then((result) => {
            if (result.isConfirmed) {
               
                addVisit(idLugar, nombreMuseo, idTurista);
            }
        });
        }
        else {
            const idTurista = document.getElementById("nombreUsuario").getAttribute('data-id-turista');
            const idLugar = event.target.closest('.favorite-card').querySelector('.info-name').getAttribute('data-placeid');
            Swal.fire({
                title: "¿Estás seguro?",
                text: "Esta acción eliminará este Museo de Visitados",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#65B2C6",
                cancelButtonColor: "#D63D6C",
                confirmButtonText: "Estoy seguro",
                cancelButtonText: "Regresar"
            }).then((result) => {
                if (result.isConfirmed) {
                    removeVisit(idLugar, idTurista);
                }
            });
        }        
      }

  });
});

// Inicializar la pantalla de museos cuando el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {
      const filterIcon = document.getElementById("filter-icon");
    const filtersBox = document.getElementById("filters-expanded");

    filterIcon.addEventListener("click", () => {
        
    filtersBox.style.display =
        filtersBox.style.display === "none" ? "block" : "none";
});
// Click dentro del contenedor → no cerrar
filtersBox.addEventListener("click", (e) => {
    e.stopPropagation();
});

// Click fuera → cerrar
document.addEventListener("click", (e) => {
    if (!filtersBox.contains(e.target) && e.target !== filterIcon) {
        filtersBox.style.display = "none";
    }
});
    displayFavorites(3);
     initUserLocation();
  });