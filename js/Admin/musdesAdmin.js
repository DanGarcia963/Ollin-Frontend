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
//const server = "https://ollin-backend-production-d68e.up.railway.app"

// Función para obtener los museos
async function fetchPlaces() {
  try {
      const response = await fetch(`${server}/api/queja/`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
  } catch (error) {
      console.error('Error fetching adventure places:', error);
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
  const DAYS_MAP = { 0: 'Domingo', 1: 'Lunes', 2: 'Martes', 3: 'Miercoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sabado' };
  const now = new Date();
  const today = DAYS_MAP[now.getDay()];
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const horarioIn = normalizeTime(scheduleInfo[`HorarioIn_${today}`]);
  const horarioOut = normalizeTime(scheduleInfo[`HorarioOut_${today}`]);

  if (!horarioIn || !horarioOut) {
    return { text: 'Está cerrado por hoy', status: 'closed' };
  }

  const [inH, inM] = horarioIn.split(':').map(Number);
  const [outH, outM] = horarioOut.split(':').map(Number);
  const open = inH * 60 + inM;
  const close = outH * 60 + outM;

  if (currentMinutes < open) {
    return { text: `Abre a las ${horarioIn} hrs`, status: 'before' };
  }
  if (currentMinutes >= close) {
    return { text: `Cerrado · Abrió de ${horarioIn} a ${horarioOut}`, status: 'after' };
  }
  return { text: `Abierto · Cierra a las ${horarioOut} hrs`, status: 'open' };
}

// Asigna prioridad para ordenar museos (abiertos primero, luego por abrir, luego cerrados)
function getMuseumPriority(scheduleInfo) {
  const estado = getHorarioEstado(scheduleInfo);
  switch (estado.status) {
    case 'open': return 0;
    case 'before': return 1;
    default: return 2;
  }
}

// Crea la tarjeta HTML para un museo
async function createMuseumCard(placeInfo, storedPlace) {
    if (typeof placeInfo === 'string') {
        try { placeInfo = JSON.parse(placeInfo); } 
        catch (error) { return ''; }
    }
    if (!placeInfo || typeof placeInfo !== 'object') return '';

    const tieneQuejas = storedPlace?.total_quejas_ultimo_mes > 0;

    // Alerta estilizada si hay quejas
    const alertaIcon = tieneQuejas
        ? `<div title="Tiene quejas recientes" class="bg-red-100 text-red-600 p-2 rounded-full shadow-sm" style="cursor: help;">
             <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
           </div>`
        : '';

    // Determinamos si está abierto o cerrado para ponerle color a la etiqueta
    const estado = getHorarioEstado(storedPlace);
    const badgeColor = estado.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600';

    // Construcción de la tarjeta con Tailwind (Flexbox, Object Cover, Altura Fija)
    const card = `
    <div class="favorite-card bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-[380px] border border-gray-100 group relative">
        
        <div class="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold ${badgeColor} shadow-sm z-10 backdrop-blur-sm bg-opacity-90">
            ${estado.status === 'open' ? 'Abierto' : 'Cerrado'}
        </div>

        <div class="relative h-48 w-full shrink-0 overflow-hidden bg-gray-100">
            <img 
                src="${placeInfo.photoUrls ? placeInfo.photoUrls[0] : 'assets/icons/Lugarejemplo.PNG'}" 
                alt="Museo"
                class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>

        <div class="p-5 flex flex-col flex-1 justify-between bg-white z-20">
            
            <div class="mb-2">
                <h3 class="info-name text-lg font-bold text-gray-800 leading-tight line-clamp-2" data-placeid="${placeInfo.placeID}">
                    ${placeInfo.name || 'Nombre no especificado'}
                </h3>
            </div>

            <div class="flex-1 flex flex-col justify-end space-y-3">
                
                <p class="text-xs text-gray-500 line-clamp-2 flex items-start">
                    <svg class="w-4 h-4 text-[#438B9E] mr-1 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    ${placeInfo.address}
                </p>

                <div class="card-actions flex items-center justify-between pt-3 border-t border-gray-100">
                    <div class="flex items-center gap-2">
                        <span class="text-xs font-semibold text-gray-400">★ ${placeInfo.rating || 'S/N'}</span>
                    </div>

                    <div class="flex items-center gap-3">
                        ${alertaIcon}
                        <button class="bg-[#F4EFE6] text-[#438B9E] hover:bg-[#438B9E] hover:text-white transition-colors duration-300 p-2 rounded-full shadow-sm flex items-center justify-center cursor-pointer">
                            <svg class="w-5 h-5 pointer-events-none" id="ViewMoreBtn" data-id-museo="${placeInfo.placeID}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                        </button>
                    </div>
                </div>
            </div>

        </div>
    </div>
    `;

    return card;
}


// Normaliza texto para comparaciones
function normalizeText(text) {
    return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, '').trim();
}

// Aplica todos los filtros seleccionados
function applyAllFilters() {
    let result = [...ALL_MUSEOS];
    const search = CURRENT_NAME_FILTER.toLowerCase().trim();
    if (search) {
        const nameFiltered = result.filter(m =>
            m.NombreMuseo && m.NombreMuseo.toLowerCase().includes(search)
        );
        if (nameFiltered.length > 0) {
            result = nameFiltered;
        } else {
            result = []; // Si no encuentra, no muestra nada
        }
    }
    displayFavorites(Infinity, result);
}

// Función para mostrar los museos en la página
async function displayFavorites(maxMuseos = Infinity, filteredList = null) {
    const renderToken = ++CURRENT_RENDER_TOKEN;
    const favoritePlaces = filteredList || await fetchPlaces();

    if(!favoritePlaces) return;

    favoritePlaces.sort((a, b) => getMuseumPriority(a) - getMuseumPriority(b));
    
    const museumContainer = document.getElementById('museodes');
    museumContainer.innerHTML = '';

    // Si no hay resultados de búsqueda
    if(filteredList && filteredList.length === 0) {
        museumContainer.innerHTML = `<div class="col-span-full flex flex-col items-center justify-center p-10 bg-white rounded-2xl shadow-sm text-gray-500 mt-4 h-64"><svg class="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path></svg><p class="text-lg">No se encontraron museos con ese nombre.</p></div>`;
        return;
    }

    let count = 0;
    const renderedIds = new Set(); 

    for (const place of favoritePlaces) {
        if (renderToken !== CURRENT_RENDER_TOKEN) return;
        if (count >= maxMuseos) break;

        const storedId = place["ID MUSEO"];
        if (renderedIds.has(storedId)) continue;
        renderedIds.add(storedId);

        let placeInfo = null;
        const storedName = place["NombreMuseo"];

        try {
            placeInfo = await getInfo(storedId);
        } catch (e) {
            if (e.message.includes('NOT_FOUND')) {
                try { placeInfo = await getInfoByName(storedName); } 
                catch (e2) { continue; }
            } else { continue; }
        }

        if (renderToken !== CURRENT_RENDER_TOKEN) return;
        const cardHTML = await createMuseumCard(placeInfo, place);
        if (renderToken !== CURRENT_RENDER_TOKEN) return;

        museumContainer.insertAdjacentHTML('beforeend', cardHTML);    
         count++;
    }

    if(!filteredList){
        ALL_MUSEOS = favoritePlaces;
    }
}

// Búsqueda en tiempo real
function buscarMuseosPorNombre(texto) {
    CURRENT_NAME_FILTER = texto;
    applyAllFilters();
}

// Evento Input Búsqueda
document.getElementById('searchMuseoInput').addEventListener('input', (event) => {
    buscarMuseosPorNombre(event.target.value);
});

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
    const direccion = infoLugar ? infoLugar.address : "Dirección no disponible";
    const photo = infoLugar && infoLugar.photoUrls && infoLugar.photoUrls.length > 0
        ? infoLugar.photoUrls[0] : "assets/icons/Lugarejemplo.PNG";
    const photo2 = infoLugar && infoLugar.photoUrls && infoLugar.photoUrls.length > 1
        ? infoLugar.photoUrls[1] : photo; // Si no hay segunda foto, repite la primera o usa placeholder

    document.getElementById("vm-nombre").textContent = museoData.NombreMuseo;
    document.getElementById("vm-image").src = photo;
    document.getElementById("vm-image2").src = photo2;

    const body = document.getElementById("vm-body");
    body.innerHTML = "";

    agregarSeccion(body, "Ubicación", { "Municipio": museoData.Municipio, "Dirección": direccion });
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
    agregarSeccion(body, "Información de contacto", { "Teléfono": infoLugar.phone_number || "No disponible" });

    document.getElementById("viewMoreCard").classList.remove("hidden");
}

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('museodes'); 
  container.addEventListener('click', async function(event) {
      // Usamos closest para atrapar el click en el botón SVG y buscar su atributo data-id-museo
      const btn = event.target.closest('button');
      if(btn && btn.querySelector('svg[id="ViewMoreBtn"]')) {
            const idLugar = btn.querySelector('svg').getAttribute('data-id-museo');
            const infoLugar = await getInfo(idLugar);
            const museum = await fetchPlaces().then(places => places.find(p => p["ID MUSEO"] === idLugar));
            abrirViewMore(museum, infoLugar);
      }
  });
});

document.addEventListener('DOMContentLoaded', () => {
    // Al cargar la página, mostramos TODOS los museos
    displayFavorites(3);
    initUserLocation();
});