import { showLoading, hideLoading } from "../ARCY-imports/loading.js";
console.log("iniciandodespli");

let CURRENT_RENDER_TOKEN = 0;
let ALL_FAVORITES =[]


// Define la URL de la API para obtener lugares favoritos
const API_URL = `${server}/api/lugarVisitado/obtenerLugaresVisitados`;
const API_URL1 = `${server}/api/itinerario/obtenerItinerariosFinalizados`;

// Función para obtener los lugares favoritos del usuario
async function fetchVisitPlaces(idTurista) {
    console.log("fetchVisitPlaces llamada con idTurista:", idTurista);
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

async function fetchItineraryPlaces(id_Turista) {
    console.log("fetchItineraryPlaces llamada con idTurista:", id_Turista);
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

async function fetchFirstPlaceOfItinerary(idPlan) {
    try {
        const response = await fetch(`${server}/api/lugarItinerario/obtenerLugaresItinerario`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idPlan })
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const lugares = await response.json();
        return lugares.find(lugar => lugar['Posición en itinerario'] === 0);
    } catch (error) {
        console.error('Error fetching first place of itinerary:', error);
    }
}

// Función para obtener la información de un lugar sin utilizar el mapa
async function getInfo(placeId) {
    console.log("getInfo llamada con place:", placeId);

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
        'types'
      ]
    });
    const imgWidth = 1000;
    const imgHeight = 1000;
    const photoUrls = place.photos
      ? place.photos.map(photo =>
          photo.getURI({ maxHeight: imgHeight, maxWidth: imgWidth })
        )
      : null;
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
      type: place.types
    };
  }
  

  function createVisitCard(placeInfo) {
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
	<div class="visit-card scroll-smooth scrollbar-thin scrollbar-thumb-red-700 scrollbar-track-red-900 scrollbar-hide hover:scrollbar-default">
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
                <img src="assets/icons/checkedRosa.png" id="tuBotonEliminar">
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


async function displayVisit(maxMuseos = CURRENT_LIMIT) {
          const renderToken = ++CURRENT_RENDER_TOKEN;
          const nombreUsuario = document.getElementById("nombreUsuario");
          const idTurista = nombreUsuario.getAttribute('data-id-turista');        
          ALL_FAVORITES = await fetchVisitPlaces(idTurista);
          console.log(ALL_FAVORITES)

          const visitContainer = document.getElementById('visides'); 
          visitContainer.innerHTML='';

          if(!ALL_FAVORITES || ALL_FAVORITES.length === 0){
            visitContainer.innerHTML=`
            <div class="no-favorites-message">
                <p data-i18n="no_visited_museums">No hay museos visitados agregados aún.</p>
                <button data-i18n="add" onclick="location.href='/museums'">Ir a agregar</button>
            </div>
            `;
            return;
          }
          let count = 0;
          const renderedIds = new Set();

          for (const place of ALL_FAVORITES){
            if(renderToken !== CURRENT_RENDER_TOKEN){
                return;
            }
            if(count >= maxMuseos) break;

            const storedId = place["ID MUSEO"]

            if(renderedIds.has(storedId)){
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

            const visitCardHtml = createVisitCard(placeInfo);

            if (renderToken !== CURRENT_RENDER_TOKEN) return;

            visitContainer.insertAdjacentHTML("beforeend", visitCardHtml)

            count ++;

          }
      
}

async function displayVisitPlans() {
    
        const nombreUsuario = document.getElementById("nombreUsuario");

        console.log("Prueba de arcy 1: " + nombreUsuario)
        console.log("Prueba de arcy 2: " + nombreUsuario.dataset.idTurista)
        const itinerarios = await fetchItineraryPlaces(nombreUsuario.dataset.idTurista);
        const itinerariesContainer = document.getElementById('containerItinerarios');
        console.log("Itinerarios obtenidos:", itinerarios);
        if (itinerarios && itinerarios.length > 0) {
            itinerariesContainer.innerHTML = ''; // Limpiar el contenedor

            // Usar forEach para obtener tanto el itinerario como su índice
            itinerarios.forEach(async (itinerario, index) => {
                console.log("Itinerario actual:", itinerario);
                const zeroItinerario = await fetchFirstPlaceOfItinerary(itinerario.ID);

                // Verifica si el itinerario está vacío
                if (!zeroItinerario || Object.keys(zeroItinerario).length === 0) {
                    console.log(`Itinerario vacío encontrado con ID: ${itinerario.ID}`);
                    const emptyItineraryCard = createEmptyItineraryCard(itinerario);
                    itinerariesContainer.innerHTML += emptyItineraryCard;
                    return;
                }

                var idPlace = zeroItinerario['ID MUSEO'];
                var stateMuseum = zeroItinerario['Estado Museo'];
                console.log()
                console.log(idPlace);

                // Obtener información del lugar utilizando el ID del lugar
                if(itinerario.Estado ==='F'){
                try {
                    const placeInfo = await getInfo(idPlace);
                    const itineraryCard = createItineraryCard(itinerario, index, placeInfo.name, placeInfo.photoUrls); // Pasar el nombre del lugar
                    itinerariesContainer.innerHTML += itineraryCard; // Agregar la tarjeta al contenedor
                } catch (error) {
                    console.error('Error obteniendo información del lugar:', error);
                }
            }
            });
        } else {
            itinerariesContainer.innerHTML = `
            <div class="no-favorites-message">
              <p data-i18n="no_plan_museums">No hay planes de visita finalizados aún.</p>
            </div>
          `;
        }
}

async function crearCookieYRedirigir(index, buttonText) {
    const NomItim = document.getElementById(`NombreItinerario-${index}`);
    const ItID = NomItim.getAttribute("dataset-NomItim");

    if (buttonText === 'Comenzar') {
        await updateItineraryState(ItID);
    }

    // Continuar con la redirección
    document.cookie = "miDato=" + ItID + ";path=/";
    console.log("El Id itinerario es:", ItID);
    window.location.href = 'EnCurso';
}

// Función para crear una cookie y editar
function crearCookieYedit(index) {
    const NomItim = document.getElementById(`NombreItinerario-${index}`);
    const ItID = NomItim.getAttribute("dataset-NomItim");
    document.cookie = "miDato=" + ItID + ";path=/";
    console.log("El Id itinerario es:", ItID);
    window.location.href = 'editar_aventura';
}

function createItineraryCard(itinerario, index, placeName, photoUrls) {
    let backgroundColor;
    let dynamicButtonHTML = '';
    let editButtonHTML = `<a onclick="crearCookieYedit(${index})" class="cardButton continue">Editar</a>`;
    let finishButtonHTML = `<a href="#" onclick="finalizeItinerary(${index})" class="cardButton finish">Finalizar</a>`;
    let deleteButtonHTML = getDeleteButtonHTML(itinerario.ID);

    switch (itinerario.Estado) {
        case 'F':
            backgroundColor = '#FFB49C'; // Rojo para finalizados
            editButtonHTML = `<a onclick="crearCookieYedit(${index})" class="cardButton continue flex-center" data-i18n="viewplan">Ver</a>`; // Cambiar texto a "Ver"
            finishButtonHTML = ''; // No mostrar botón de finalizar
            break;
        case 'C':
            backgroundColor = '#C4DCAB'; // Verde para en curso
            dynamicButtonHTML = `<a onclick="crearCookieYRedirigir(${index}, 'Continuar')" id="dynamicButton-${index}" class="DinamicButton">Continuar</a>`;
            break;
        case 'N':
            backgroundColor = '#FFDF8F'; // Amarillo para nuevos
            dynamicButtonHTML = `<a onclick="crearCookieYRedirigir(${index}, 'Comenzar')" id="dynamicButton-${index}" class="DinamicButton">Comenzar</a>`;
            break;
        default:
            backgroundColor = '#FFFFFF'; // Color por defecto
    }

    const fechaFormateada = new Date(itinerario.fecha_Creacion).toLocaleDateString();

    // Construir elementos de imagen HTML para cada URL de foto
    let imagesHTML = '';
    const imageStyle = 'object-fit: cover; object-position: center;';
    if (photoUrls && photoUrls.length > 0) {
        // Usar la primera imagen como la imagen grande
        imagesHTML += `<img src="${photoUrls[0]}" alt="Imagen del lugar" class="cardImageLarge" style="${imageStyle}">`;

        // Usar las imágenes restantes como imágenes pequeñas
        imagesHTML += '<div class="cardImagesSmall">';
        for (let i = 1; i < photoUrls.length && i <= 2; i++) { // Limitar a 2 imágenes pequeñas
            imagesHTML += `<img src="${photoUrls[i]}" alt="Imagen del lugar ${i}" class="cardImageSmall" style="${imageStyle}">`;
        }
        imagesHTML += '</div>';
        // Usar las imágenes restantes como imágenes pequeñas 2
        imagesHTML += '<div class="cardImagesSmall2">';
        for (let i = 1; i < photoUrls.length && i <= 2; i++) { // Limitar a 2 imágenes pequeñas
            imagesHTML += `<img src="${photoUrls[i]}" alt="Imagen del lugar ${i}" class="cardImageSmall" style="${imageStyle}">`;
        }
        imagesHTML += '</div>';
    } else {
        // Si no hay URLs de fotos, usa una imagen predeterminada
        imagesHTML = `
            <img src="assets/icons/sin_foto.png" alt="Imagen grande" class="cardImageLarge">
            <div class="cardImagesSmall">
                <img src="assets/icons/sin_foto.png" alt="Imagen pequeña 1" class="cardImageSmall">
                <img src="assets/icons/sin_foto.png" alt="Imagen pequeña 2" class="cardImageSmall">
            </div>
            <div class="cardImagesSmall2">
                <img src="assets/icons/sin_foto.png" alt="Imagen pequeña 3" class="cardImageSmall">
                <img src="assets/icons/sin_foto.png" alt="Imagen pequeña 4" class="cardImageSmall">
            </div>
        `;
    }



    // Construcción del HTML de la tarjeta
    return `
    <div class="cardsAP scroll-smooth scrollbar-thin scrollbar-thumb-red-700 scrollbar-track-red-900 scrollbar-hide hover:scrollbar-default" style="background-color: ${backgroundColor};">
        <div class="HeaderComplete">
            ${deleteButtonHTML}
            <div class="cardHeader">
                <span id="NombreItinerario-${index}" class="cardName" dataset-NomItim="${itinerario.ID}"><span class="boldTextUbication">${itinerario.Nombre}</span></span>

                <span class="cardDate">Creación: <span class="boldTextUbication">${fechaFormateada}</span></span>
                <div style="display: flex; align-items: center;">
                    <img src="assets/icons/ubicacionIcon.png" alt="Ubicación" class="cardLocationIcon">
                    <span class="cardLocation">Inicio: <span class="boldTextUbication">${placeName || 'Ubicación'}</span></span>
                </div>
            </div>
            <div class="contDinamic">
                ${dynamicButtonHTML}
            </div>
        </div>
        <div class="cardMain">
            <div class="cardImages">
                ${imagesHTML}
            </div>
            <div class="cardButtons">
                ${editButtonHTML}
                ${finishButtonHTML}
            </div>
        </div>
    </div>
    `;
}


function createEmptyItineraryCard(itinerario) {
    console.log(itinerario.fecha_Creacion,itinerario.ID)
    let deleteButtonHTML = getDeleteButtonHTML(itinerario.ID);
    // Aquí puedes personalizar el aspecto de la tarjeta para un itinerario vacío
    return `
    <div class="cardsAP" style="background-color: #C0CBCD;">
        <div class="itinerary-content" style="flex:1;">    
            <div class="cardHeader">
                ${deleteButtonHTML}
                <span class="cardName">${itinerario.Nombre}</span>
                <span class="cardDate">Creación: ${new Date(itinerario.fecha_Creacion).toLocaleDateString()}</span>
            </div>
            <div class="cardMain">
                <div class="boldTextUbication ">Este plan de visita está vacío.</div>
            </div>
        </div>
        <div class="add-place-btn" style="width:30px; height:30px; border-radius:50%; background-color:#FFDF8F; display:flex; justify-content:center; align-items:center; cursor:pointer;" onclick="goToMuseums('${itinerario.ID}')">
            <img src="assets/icons/agregarIcon2.png" style="width:30px; height:30px;" alt="Agregar">
        </div>
        
    </div>
    `;
}

function getDeleteButtonHTML(idItinerario) {
    return `<img src="assets/icons/eliminarIcon.png" alt="Eliminar" class="deleteIcon" onclick="deleteItinerary('${idItinerario}')">`;
}

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('visides'); // Asegúrate de usar el ID real de tu contenedor

  container.addEventListener('click', function(event) {
      if (event.target.id === 'tuBotonEliminar') {
          const idTurista = document.getElementById("nombreUsuario").getAttribute('data-id-turista');
          const idLugar = event.target.closest('.visit-card').querySelector('.info-name').getAttribute('data-placeid');
            console.log("Eliminar lugar visitado:", idLugar, "para turista:", idTurista);
          
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
                 
                removeVisit(idLugar, idTurista);
              }
          });
      }

      if (event.target.id === 'agreIti') {
          const idLugar = event.target.closest('.visit-card').querySelector('.info-name').getAttribute('data-placeid');
          window.location.href = `/inicio?placeId=${idLugar}`;
      }
  });
});




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
      console.log('Museo eliminado de visitados:', data);

      Swal.fire({
          title: "¡Eliminado!",
          text: "El museo ha sido borrado de Visitados",
          icon: "success"
      }).then(() => {
          window.location.reload();
      });
  })
  .catch(error => {
      console.error('Error al eliminar museo de visitados:', error);
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
    await esperarUsuario()
    console.log("DOMContentLoaded, inicializando pantalla de favoritos");
    let CURRENT_LIMIT = 3;
    const STEP = 10;
    showLoading("Cargando historial de visitas...")
    try{
    await displayVisit(CURRENT_LIMIT);
    await displayVisitPlans();
    } catch (error) {
      console.error('Error al inicializar pantalla de historial de visitas:', error);
    } finally {
      hideLoading(); // Ocultar el indicador de carga
    }

const showMoreBtn = document.getElementById("showMoreBtn");
    const showLessBtn = document.getElementById("showLessBtn");

    showMoreBtn.style.display = "inline-block";
    showLessBtn.style.display = "none";

    showMoreBtn.addEventListener("click", async () => {
        CURRENT_LIMIT += STEP;

        showLoading("Cargando más favoritos...");

        try {
            await displayVisit(CURRENT_LIMIT);
            await displayVisitPlans();
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
            await displayVisit(CURRENT_LIMIT);
            await displayVisitPlans();
        } catch (e) {
            console.error("Error al mostrar menos favoritos:", e);
        } finally {
            hideLoading();
        }

        showMoreBtn.style.display = "inline-block";
        showLessBtn.style.display = "none";
    });

  });

  window.crearCookieYRedirigir = crearCookieYRedirigir;
window.crearCookieYedit = crearCookieYedit;
