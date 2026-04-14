console.log("Inicio.js cargado");
//const server = "https://ollin-backend-production-d68e.up.railway.app"

async function fetchRecommendedMuseums() {
    try {
        const response = await fetch(`${server}/api/lugarVisitado/recomendarMuseos`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching recommended museums:', error);
    }   
}

async function cargarRecomendaciones() {
    const nombreUsuario = document.getElementById('nombreUsuario');
    const idTurista = nombreUsuario.getAttribute('data-id-Turista');
    const cacheKey = `recomendaciones_${idTurista}`;
    const cacheTimeKey = `recomendaciones_time_${idTurista}`;
    const cacheDuration = 30 * 24 * 60 * 60 * 1000; // 30 días
    const now = Date.now();
    const cachedData = localStorage.getItem(cacheKey);
    const cachedTime = localStorage.getItem(cacheTimeKey);
    if(cachedData && cachedTime && (now - cachedTime < cacheDuration)) {
        renderRecomendations(JSON.parse(cachedData));
        console.log('Cargando recomendaciones desde caché');
        return JSON.parse(cachedData);
    }

    try{
        console.log('Consultando API para recomendaciones...');
        const recomendaciones = await fetchRecommendedMuseums();
        localStorage.setItem(cacheKey, JSON.stringify(recomendaciones));
        localStorage.setItem(cacheTimeKey, now);
        renderRecomendations(recomendaciones);
    }
    catch(error){
        console.error('Error al cargar recomendaciones:', error);
    }
}

async function renderRecomendations(recomendaciones) {
    const recommendedContainer = document.getElementById('recommendedMuseums');
    if (recomendaciones && recomendaciones.length > 0) {
        recommendedContainer.innerHTML = '';
        for (const museo of recomendaciones) {
            const placeInfo = await getPhotos(museo.id_Museo);
            const card = document.createElement('div');
            card.className = 'bg-[#d98f8f] min-w-40 rounded-xl p-3 hover:scale-105 transition cursor-pointer';

            card.innerHTML = `
                <img src="${placeInfo.photoUrls ? placeInfo.photoUrls[0] : 'assets/icons/museumIcon.png'}"
                    alt="${museo.Nombre}" 
                    class="w-36 lg:w-full h-36 object-cover rounded-lg">

                <div class="flex flex-col lg:flex-row items-center 
                            justify-center gap-2 mt-2">
                    <img src="assets/icons/museum_icon.png" 
                            alt="museum" 
                            class="w-4 h-4">

                    <h5 class="text-sm font-semibold">
                        ${museo.Nombre}
                    </h5>
                </div>
            `;
            recommendedContainer.appendChild(card);
        }
    }
}

async function getPhotos(placeId) {
        const { Place } = await google.maps.importLibrary('places');
    const place = new Place({ id: placeId, requestedLanguage: 'es' });
    await place.fetchFields({
      fields: [
        'photos',
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
      photoUrls,
    };
  }

let eventos = [];
let currentIndex = 0;
const API_URL_CREAR_LUGAR_ITINERARIO = `${server}/api/lugarItinerario/crearLugarItinerario`;

// 🔹 Variables globales para reutilizar en el banner
let eventoActual = null;
let museosActuales = [];

/* =========================
   FETCH EVENTOS
========================= */

async function cargarEventos() {
    try {
        const response = await fetch(`${server}/api/evento/obtenerDescripcionEvento`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching eventos:', error);
    }
}

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

async function cargarMuseosEvento(idEvento){
    try{
        const response = await fetch(`${server}/api/evento/obtenerMuseosPorEvento`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_Evento: idEvento }) 
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching museos:', error);
    }
}

/* =========================
   RENDER SLIDE PRINCIPAL
========================= */

async function renderSlide() {

  const container = document.getElementById("carouselContainer");

  const eventosData = await cargarEventos();

  if(!eventosData || eventosData.length === 0) {
    container.innerHTML = "<p data-i18n='noevents'>No hay eventos disponibles.</p>";
    return;
  }

  // Guardamos evento actual
  eventoActual = eventosData[0];

  const museosData = await cargarMuseosEvento(eventoActual.id_Evento);

  // Guardamos museos
  museosActuales = museosData || [];

  container.innerHTML = `
    <div class="grid lg:grid-cols-2 gap-10 h-full">

<!-- COLUMNA IZQUIERDA --> 
    <div class="flex flex-col justify-center">
        <h1 class="text-4xl lg:text-5xl font-extrabold mb-4 tracking-wide"> 
            Noche de Museos 
        </h1>

        <p class="text-sm md:text-lg text-gray-200 mb-4 leading-relaxed max-w-xl">
          ${eventoActual.Descripcion}
        </p>

        <p class="text-yellow-400 font-semibold">
          Del ${formatearFecha(eventoActual.Fecha_Inicio)} 
          al ${formatearFecha(eventoActual.Fecha_Limite)}
        </p>

      </div>

      <!-- COLUMNA DERECHA -->
      <div class="hidden lg:flex flex-col justify-center">

        <div class="bg-white/10 backdrop-blur-md rounded-xl p-5 
            border border-white/20 shadow-xl h-[320px]">

          <h2 class="text-xl font-semibold mb-4">
            Museos Participantes
          </h2>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-40 
            overflow-y-auto pr-2
            scroll-smooth scrollbar-thin scrollbar-thumb-red-700 
            scrollbar-track-red-900 scrollbar-hide hover:scrollbar-default"> 

            ${museosActuales.map(museo => `
            <div class="bg-white/20 flex lg:flex-col xl:flex-row items-center 
                justify-center hover:bg-white/30 transition duration-300 
                rounded-lg p-3 gap-2 mt-2 cursor-pointer">
            
                <img src="assets/icons/museum_icon.png" alt="museum" 
                    class="w-10 h-10">
                <h3 class="text-sm font-semibold">
                    ${museo.Nombre}
                </h3>
            </div>
            `).join('')}

        </div>

    </div>

      </div>

    </div>
  `;
}

/* =========================
   FORMATEAR FECHA
========================= */

function formatearFecha(fecha) {
  if (!fecha) return "";

  const limpia = fecha.replace("T", " ").replace("Z", "");
  const [datePart, timePart] = limpia.split(" ");

  const [anio, mes, dia] = datePart.split("-");
  const [hora, minuto] = timePart.split(":");

  const meses = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
  ];

  return `${Number(dia)} de ${meses[Number(mes) - 1]} de ${anio}, ${hora}:${minuto}`;
}

/* =========================
   BANNER DINÁMICO
========================= */

function renderBannerContent() {
  if (!eventoActual) return;

  document.getElementById("bannerDescripcion").textContent =
    eventoActual.Descripcion;

  document.getElementById("bannerFecha").textContent =
    `Del ${formatearFecha(eventoActual.Fecha_Inicio)} al ${formatearFecha(eventoActual.Fecha_Limite)}`;

  const museosContainer = document.getElementById("bannerMuseos");

  museosContainer.innerHTML = museosActuales.map(museo => `
    <div class="bg-white/20 hover:bg-white/30 transition rounded-lg p-3 flex items-center gap-2">
      <img src="assets/icons/museum_icon.png"
           class="w-8 h-8">
      <span class="font-semibold text-sm">
        ${museo.Nombre}
      </span>
    </div>
  `).join('');
}

function showDone() {
    Swal.fire({
        icon: "success",
        title: `¡Se ha guardado el evento a tus planes de visita!`, 
        showConfirmButton: false,
        timer: 1500,
    });
}

function generarNombreItinerario(evento) {
    if (!evento || !evento.Fecha_Inicio) return "NightMuseums";

    const limpia = evento.Fecha_Inicio.replace("T", " ").replace("Z", "");
    const [datePart] = limpia.split(" ");
    const [, mes, dia] = datePart.split("-");

    return `NightMuseums${dia}/${mes}`;
}

async function saveEventAndMuseums(nombreItinerario, idTurista, museos) {
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

        const { id_Plan: idPlan } = await res.json();

        console.log('Itinerario creado con ID:', idPlan);


        for (const museo of museos) {
            await addPlaceToItinerary(idPlan, museo.id_Museo, museo.Nombre);
        }

        showDone();

        setTimeout(() => {
            window.location.reload();
        }, 1000);

    } catch (error) {
        console.error('Error al crear itinerario:', error);

        Swal.fire({
            icon: "error",
            title: "Error al guardar el evento",
            text: "Intenta nuevamente"
        });
    }
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

/* =========================
   EVENT LISTENERS
========================= */

document.addEventListener('DOMContentLoaded', async function() {
    cargarRecomendaciones();
    renderSlide();
    await esperarUsuario();

    const idTurista = window.usuarioLogueado.id;
    console.log("ID del turista:", idTurista);

    const nightSection = document.getElementById("night-event");
    const eventBanner = document.getElementById("eventBanner");
    const saveBtn = document.getElementById("saveEventBtn");
    const closeEventBanner = document.getElementById("closeEventBanner");
    console.log("ID del turista:", idTurista);

    if (!nightSection || !eventBanner || !closeEventBanner) return;

    // Abrir banner
    nightSection.addEventListener("click", (e) => {
        if (e.target.closest("button")) return;

        renderBannerContent();
        eventBanner.classList.remove("hidden");
    });

  // Cerrar con botón
  closeEventBanner.addEventListener("click", () => {
    eventBanner.classList.add("hidden");
  });

  // Cerrar haciendo click fuera
  eventBanner.addEventListener("click", (e) => {
    if (e.target === eventBanner) {
      eventBanner.classList.add("hidden");
    }
  });

  // Guardar evento
saveBtn.addEventListener("click", async () => {
    console.log("Evento actual al guardar:", eventoActual);
    console.log("Museos actuales al guardar:", museosActuales);
    if (!eventoActual || museosActuales.length === 0) return;

    // Desactivar botón mientras guarda
    saveBtn.disabled = true;
    saveBtn.textContent = "Guardando...";

    const nombreItinerario = generarNombreItinerario(eventoActual);
    console.log("Nombre del itinerario generado:", nombreItinerario);
    await saveEventAndMuseums(
        nombreItinerario,
        idTurista,
        museosActuales
    );

});
        
    
});