import { hideLoading, showLoading } from "../ARCY-imports/loading.js";

const API_BASE_URL = typeof server !== "undefined" ? server : window.server || "https://ollin-backend-production-46550904.up.railway.app";
const API_URL = `${API_BASE_URL}/api/itinerario/obtenerItinerarios`;
const API_URL1 = `${API_BASE_URL}/api/lugarItinerario/obtenerLugaresItinerario`;
const API_URL_STATEI = `${API_BASE_URL}/api/lugarItinerario/editarEstadoLugarItinerario`;

// Función para obtener los itinerarios del usuario
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
        console.error('Error obteniendo itinerarios:', error);
        throw error;
    }
}

async function fetchItineraryPlaces1(idPlan) {
    console.log("fetchItineraryPlaces llamada con idItinerario:", idPlan);
    try {
        const response = await fetch(API_URL1, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idPlan })
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching LugarItinerario places:', error);
    }
}

// Función para mostrar los lugares favoritos
// Función modificada para mostrar los lugares favoritos
async function displayFavorites() {
    const nameElement = document.getElementById('nombreUsuario');
    const idTurista = window.idTurista || nameElement?.dataset.idTurista;
    const container = document.getElementById('containerItinerarios');
    const emptyState = document.getElementById('no-favorites-message');

    if (!container || !idTurista) {
        throw new Error('No se pudo identificar la sesión del usuario.');
    }

    const itinerarios = await fetchItineraryPlaces(idTurista);
    if (!Array.isArray(itinerarios)) {
        throw new Error('Respuesta inesperada al obtener los itinerarios.');
    }

    // Las consultas se completan antes de pintar las tarjetas, en el orden correcto.
    const cards = await Promise.all(itinerarios.map(async (itinerario, index) => {
        const primerMuseo = await fetchFirstPlaceOfItinerary(itinerario.ID);
        if (!primerMuseo) return createEmptyItineraryCard(itinerario);
        if (itinerario.Estado === 'F') return '';
        return createItineraryCard(
            itinerario, index, primerMuseo.NombreMuseo, primerMuseo.Imagenes
        );
    }));

    const visibleCards = cards.filter(Boolean);
    container.innerHTML = visibleCards.join('');
    if (emptyState) emptyState.style.display = visibleCards.length ? 'none' : 'block';
}

// Función para crear una tarjeta de itinerario
// 1. FUNCIÓN PARA TARJETAS CON CONTENIDO
function createItineraryCard(itinerario, index, placeName, photoUrls) {
    let statusText = '';
    let statusClass = '';
    let mainActionBtn = ''; // Botón de Comenzar/Continuar
    let editBtn = `<a onclick="crearCookieYedit(${index})" data-i18n="editplan" class="cardButton edit-btn">Editar</a>`;
    let deleteButtonHTML = getDeleteButtonHTML(itinerario.ID);

    switch (itinerario.Estado) {
        case 'F':
            statusText = 'Finalizado';
            statusClass = 'status-finished';
            mainActionBtn = `<a onclick="crearCookieYedit(${index})" data-i18n="viewplan" class="cardButton continue">Ver Plan</a>`;
            editBtn = ''; // En finalizado no editamos
            break;
        case 'C':
            statusText = 'En Curso';
            statusClass = 'status-progress';
            mainActionBtn = `<a onclick="crearCookieYRedirigir(${index}, 'Continuar')" data-i18n="continue" class="cardButton continue">Continuar</a>`;
            break;
        case 'N':
            statusText = 'Nuevo';
            statusClass = 'status-new';
            mainActionBtn = `<a onclick="crearCookieYRedirigir(${index}, 'Comenzar')" data-i18n="beginplan" class="cardButton continue">Comenzar</a>`;
            break;
    }

    const fechaFormateada = new Date(itinerario.fecha_Creacion).toLocaleDateString();

    let imagesHTML = '';
    if (photoUrls && photoUrls.length > 0) {
        imagesHTML += `<img src="${photoUrls[0]}" class="cardImageLarge">`;
        imagesHTML += '<div class="cardImagesSmall">';
        for (let i = 1; i < photoUrls.length && i <= 2; i++) {
            imagesHTML += `<img src="${photoUrls[i]}" class="cardImageSmall">`;
        }
        imagesHTML += '</div>';
    } else {
        imagesHTML = `<img src="assets/icons/NightMuseums.jpg" class="cardImageLarge" style="width:100%; filter:grayscale(0.3)">`;
    }

    return `
    <div class="cardsAP">
        <div class="card-badges">
            <span class="status-badge ${statusClass}">${statusText}</span>
            ${deleteButtonHTML}
        </div>
        
        <div class="cardHeader">
            <h3 class="cardName" id="NombreItinerario-${index}" dataset-NomItim="${itinerario.ID}">
                ${itinerario.Nombre}
            </h3>
            <p class="cardDate">Creado: ${fechaFormateada}</p>
        </div>

        <div class="card-location-row">
            <img src="assets/icons/ubicacionIcon.png" class="cardLocationIcon">
            <span class="cardLocation">Inicia en: <b>${placeName || 'Sin asignar'}</b></span>
        </div>

        <div class="cardImages">
            ${imagesHTML}
        </div>

        <div class="cardButtons">
            ${mainActionBtn}
            ${editBtn}
            <button class="cardButton finish" onclick="finalizeItinerary(${index})" data-i18n="finaliplan">Finalizar</button>
        </div>
    </div>
    `;
}


function esperarUsuario(timeoutMs = 12000) {
    return new Promise((resolve, reject) => {
        if (window.usuarioLogueado) return resolve(window.usuarioLogueado);
        const startTime = Date.now();
        const interval = setInterval(() => {
            if (window.usuarioLogueado) {
                clearInterval(interval);
                resolve(window.usuarioLogueado);
            } else if (Date.now() - startTime >= timeoutMs) {
                clearInterval(interval);
                reject(new Error('No fue posible verificar la sesión a tiempo.'));
            }
        }, 100);
    });
}

// Evento al cargar el documento
document.addEventListener('DOMContentLoaded', async function () {
    await esperarUsuario();
    console.log("DOMContentLoaded, inicializando pantalla de itinerarios");
    showLoading("Cargando planes de visita...")
    try{
    await displayFavorites();
    }
    catch(error){
        console.error('Error al inicializar pantalla de planes de visita:', error);
        const container = document.getElementById('containerItinerarios');
        if (container) {
            container.innerHTML = '<div class="error-message" role="alert">No se pudieron cargar los planes de visita. <button type="button" onclick="location.reload()">Reintentar</button></div>';
        }
    }
    finally{
        hideLoading();
    }
});

// Función para crear una cookie y redirigir (Boton editar)

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

function goToMuseums(itineraryId, itineraryName) {
    // (Opcional) guardar el itinerario activo
    localStorage.setItem("activeItinerary", itineraryId);

    // Redirigir
    window.location.href =  `/museums?nombrePlan=${itineraryName}&idPlan=${itineraryId}`;
}

// Función para actualizar el estado del itinerario
async function updateItineraryState(idItinerario) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/itinerario/editarEstadoItinerario`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_Itinerario: idItinerario, Estado: 'C' })
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        console.log(data.message);
    } catch (error) {
        console.error('Error updating itinerary state:', error);
    }
}

async function finalizeItineraryState(idPlan) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/itinerario/editarEstadoItinerario`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_Plan: idPlan, Estado: 'F' })
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        console.log(data.message);
    } catch (error) {
        console.error('Error finalizing itinerary state:', error);
    }
}


async function finalizeItinerary(index) {
    const NomItim = document.getElementById(`NombreItinerario-${index}`);
    const ItID = NomItim.getAttribute("dataset-NomItim");
    await finalizeItineraryState(ItID);
        const lugares = await fetchItineraryPlaces1(ItID);
        console.log("Lugares del itinerario finalizado:", lugares);
    // 3. Marcar como Omitidos los que no estén visitados
    if (Array.isArray(lugares)) {
        for (const lugar of lugares) {
            if (lugar["Estado Museo"] !== 'V') {
                await fetchStateOItinerary(lugar.ID);
            }
        }
    }
    // Aquí puedes agregar cualquier lógica adicional después de finalizar el itinerario
    displayFavorites();
}


async function deleteItinerary(idItinerario) {
    Swal.fire({
        title: '¿Estás seguro?',
        text: "¡No podrás revertir esto!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'No, cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            // El usuario confirmó la eliminación
            performDeletion(idItinerario);
        }
    });
}

async function performDeletion(idItinerario) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/itinerario/eliminarItinerario`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_Itinerario: idItinerario })
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        console.log(data.message);

        // Mostrar mensaje de éxito
        Swal.fire(
            'Eliminado!',
            'El itinerario ha sido eliminado.',
            'success'
        );

        // Recargar los itinerarios después de la eliminación
        displayFavorites();
    } catch (error) {
        console.error('Error deleting itinerary:', error);
        Swal.fire(
            'Error',
            'Hubo un problema al eliminar el itinerario.',
            'error'
        );
    }
}


async function fetchFirstPlaceOfItinerary(idPlan) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/lugarItinerario/obtenerLugaresItinerario`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idPlan })
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const lugares = await response.json();
        return lugares.find(lugar => lugar['Posición en itinerario'] === 0);
    } catch (error) {
        console.error('Error obteniendo el primer museo del itinerario:', error);
        throw error;
    }
}

async function fetchStateOItinerary(idPlanMuseo){
    try{
        const response =await fetch(API_URL_STATEI,{
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({
                id_Plan_Museo: idPlanMuseo,
                Estado: 'O'})
        });
        if(!response.ok)throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    }catch(error){
        console.error('Error fetching LugarItinerario:', error);
    }
}

// 2. FUNCIÓN PARA TARJETAS VACÍAS
function createEmptyItineraryCard(itinerario) {
    let deleteButtonHTML = getDeleteButtonHTML(itinerario.ID);
    return `
    <div class="cardsAP empty-card">
        ${deleteButtonHTML}
        <div class="cardHeader">
            <h3 class="cardName">${itinerario.Nombre}</h3>
            <p class="cardDate">Creado: ${new Date(itinerario.fecha_Creacion).toLocaleDateString()}</p>
        </div>
        <div class="empty-state-body">
            <p data-i18n="planempty">Este plan de visita está vacío.</p>
            <button class="add-place-btn-modern" onclick="goToMuseums('${itinerario.ID}', '${itinerario.Nombre}')">
                <img src="assets/icons/agregarIcon2.png">
                <span data-i18n="add_museums">Agregar Museos</span>
            </button>
        </div>
    </div>
    `;
}

function getDeleteButtonHTML(idItinerario) {
    return `<img src="assets/icons/eliminarIcon.png" alt="Eliminar" class="deleteIcon" onclick="deleteItinerary('${idItinerario}')">`;
}

  window.crearCookieYRedirigir = crearCookieYRedirigir;
window.crearCookieYedit = crearCookieYedit;
window.finalizeItinerary = finalizeItinerary;
window.deleteItinerary = deleteItinerary;
window.goToMuseums = goToMuseums;