import { showLoading, hideLoading } from "../ARCY-imports/loading.js";

let CURRENT_RENDER_TOKEN = 0;
let ALL_FAVORITES = [];
let CURRENT_LIMIT = Infinity; // Mostrar todos los lugares favoritos sin límite 

console.log("iniciandodespliegue");
const API_BASE_URL = typeof server !== "undefined" ? server : window.server || "http://localhost:1234";

// Define la URL de la API para obtener lugares favoritos
const API_URL = `${API_BASE_URL}/api/lugarFavorito/obtenerLugaresFavoritos`;

// ==============================
// UTILIDADES
// ==============================
function safeArray(value) {
    if (Array.isArray(value)) return value;

    if (typeof value === "string") {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : (parsed ? [parsed] : []);
        } catch {
            return value.trim() ? [value.trim()] : [];
        }
    }

    return [];
}

function normalizeTime(value) {
    if (value === null || value === undefined) return null;

    value = String(value).trim();
    if (!value || value.toLowerCase() === "null") return null;

    if (/^\d{1,2}$/.test(value)) {
        return `${value.padStart(2, '0')}:00`;
    }

    if (/^\d{1,2}:\d{1,2}$/.test(value)) {
        let [h, m] = value.split(':');
        return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
    }

    if (/^\d{2}:\d{2}$/.test(value)) return value;

    return null;
}

function getMuseumId(place) {
    return (
        place?.["ID MUSEO"] ??
        place?.id_Museo ??
        place?.idMuseo ??
        place?.Informacion_JSON?.id_Museo ??
        null
    );
}

function getMuseumName(place) {
    return (
        place?.NombreMuseo ??
        place?.Nombre ??
        place?.Informacion_JSON?.Nombre ??
        'Nombre no especificado'
    );
}

function getMuseumAddress(place) {
    return (
        place?.Direccion ??
        place?.address ??
        place?.Informacion_JSON?.Direccion ??
        'Dirección no disponible'
    );
}

function getMuseumRating(place) {
    const rating = place?.Rating ?? place?.Informacion_JSON?.Rating;
    return typeof rating === "number" ? rating : null;
}

function getMuseumPhone(place) {
    return (
        place?.Telefono ??
        place?.phone_number ??
        place?.Informacion_JSON?.Telefono ??
        null
    );
}

function getMuseumImages(place) {
    const raw =
        place?.Imagenes ??
        place?.imagenes ??
        place?.Informacion_JSON?.Imagenes ??
        [];

    return safeArray(raw).filter(Boolean);
}

function getHorariosByDay(place) {
    return (
        place?.HorariosByDay ??
        place?.Informacion_JSON?.HorariosByDay ??
        {}
    );
}

function getHorarioEstado(scheduleInfo) {
    const DAYS_MAP = {
        0: 'Domingo',
        1: 'Lunes',
        2: 'Martes',
        3: 'Miércoles',
        4: 'Jueves',
        5: 'Viernes',
        6: 'Sábado'
    };

    const now = new Date();
    const today = DAYS_MAP[now.getDay()];
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const horariosByDay = getHorariosByDay(scheduleInfo);
    const daySchedule = horariosByDay?.[today]?.[0];

    const horarioIn = normalizeTime(daySchedule?.HorarioIn);
    const horarioOut = normalizeTime(daySchedule?.HorarioOut);

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

function renderHorariosDetalles(place) {
    const horariosByDay = getHorariosByDay(place);
    const daysOrder = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

    const entries = daysOrder
        .map(day => {
            const item = horariosByDay?.[day]?.[0];
            if (!item?.HorarioIn || !item?.HorarioOut) return null;
            return `<div class="${day.toLowerCase()}">${day}: ${item.HorarioIn} - ${item.HorarioOut}</div>`;
        })
        .filter(Boolean);

    return entries.length > 0
        ? entries.join('')
        : '<div>Horario no especificado</div>';
}

function normalizeFavoritePlace(place) {
    const info = place?.Informacion_JSON || {};

    const normalized = {
        raw: place,
        id_Museo_Favorito: place?.id_Museo_Favorito ?? null,
        idMuseo: getMuseumId(place),
        name: getMuseumName(place),
        address: getMuseumAddress(place),
        rating: getMuseumRating(place),
        phone_number: getMuseumPhone(place),
        images: getMuseumImages(place),
        horariosByDay: getHorariosByDay(place),
        Municipio: place?.Municipio ?? info?.Municipio ?? null
    };

    return normalized;
}

function generateStars(rating) {
    let starsHtml = '';
    for (let i = 0; i < 5; i++) {
        starsHtml += `<span class="star" style="color: gold;">${i < rating ? '&#9733;' : '&#9734;'}</span>`;
    }
    return starsHtml;
}

// ==============================
// FETCH FAVORITOS
// ==============================
async function fetchFavoritePlaces(idTurista) {
    console.log("fetchFavoritePlaces llamada con idTurista:", idTurista);
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idTurista })
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();

        if (!Array.isArray(data)) return [];
        return data.map(normalizeFavoritePlace);
    } catch (error) {
        console.error('Error fetching favorite places:', error);
        return [];
    }
}

// ==============================
// CARD
// ==============================
function createFavoriteCard(placeInfo) {
    if (typeof placeInfo === 'string') {
        try {
            placeInfo = JSON.parse(placeInfo);
        } catch (error) {
            console.error('Error parsing placeInfo:', error);
            return '';
        }
    }

    if (!placeInfo || typeof placeInfo !== 'object') {
        console.error('placeInfo is not a valid object:', placeInfo);
        return '';
    }

    const rating = typeof placeInfo.rating === 'number'
        ? Math.round(placeInfo.rating * 2) / 2
        : 0;

    const starsHtml = generateStars(rating);
    const imageSrc = placeInfo.images?.length > 0
        ? placeInfo.images[0]
        : 'assets/icons/Lugarejemplo.PNG';

    const horarioEstado = getHorarioEstado(placeInfo);
    const horariosDetallesHtml = renderHorariosDetalles(placeInfo);

    const horarioHtml = `
        <div class="horario-detalles">
            <div class="horario-text" id="horario-text">
                ${horarioEstado.text}
            </div>
            <div class="weekend-text" style="display: none;">
                ${horariosDetallesHtml}
            </div>
        </div>
    `;

    const card = `
	<div class="favorite-card">
        <div class="card-left">
            <img src="${imageSrc}" alt="Museo"/>
        </div>

        <div class="card-info-grid">
            <div class="title-rating">
                <span class="info-name" id="info-name" data-placeid="${placeInfo.idMuseo}">
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
                ${placeInfo.address || 'Dirección no disponible'}
            </div>

            <div class="schedule">
                <img src="assets/icons/reloj2.png" width="15px" height="15px" style="margin:0px 4px;">
                <strong>Horarios:</strong>${horarioHtml}
            </div>

            <div class="card-actions">
                <img src="assets/icons/favoritosBlancoRosa.png" id="tuBotonEliminar">
                <img src="assets/icons/origenIcon.png" id="agreIti">
            </div>
        </div>
	</div>
    `;

    return card;
}

// ==============================
// RENDER
// ==============================
async function displayFavorites(maxMuseos = CURRENT_LIMIT) {
    const renderToken = ++CURRENT_RENDER_TOKEN;

    const nombreUsuario = document.getElementById("nombreUsuario");
    const idTurista = nombreUsuario.getAttribute('data-id-turista');

    ALL_FAVORITES = await fetchFavoritePlaces(idTurista);

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
        if (renderToken !== CURRENT_RENDER_TOKEN) return;
        if (count >= maxMuseos) break;

        const storedId = place.idMuseo;

        if (renderedIds.has(storedId)) continue;
        renderedIds.add(storedId);

        const favoriteCardHtml = createFavoriteCard(place);

        if (renderToken !== CURRENT_RENDER_TOKEN) return;

        favoritesContainer.insertAdjacentHTML("beforeend", favoriteCardHtml);
        count++;
    }
}

// ==============================
// ACCIONES
// ==============================
function removeFavorite(idLugar, idTurista) {
    fetch(`${API_BASE_URL}/api/lugarFavorito/eliminarLugarFavorito`, {
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

// ==============================
// EVENTOS
// ==============================
document.addEventListener('DOMContentLoaded', async () => {
    await esperarUsuario();

    console.log("Inicializando pantalla de favoritos");

    showLoading("Cargando favoritos...");

    try {
        await displayFavorites(CURRENT_LIMIT);
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

    const container = document.getElementById('favodes');

    container.addEventListener('click', function (event) {
        if (event.target.id === 'tuBotonEliminar') {
            const idTurista = document.getElementById("nombreUsuario").getAttribute('data-id-turista');
            const idLugar = event.target.closest('.favorite-card')
                .querySelector('.info-name')
                .getAttribute('data-placeid');

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
            const idLugar = event.target.closest('.favorite-card')
                .querySelector('.info-name')
                .getAttribute('data-placeid');

            window.location.href = `/inicio?placeId=${idLugar}`;
        }
    });
});