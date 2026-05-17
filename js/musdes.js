import { showLoading, hideLoading } from "../ARCY-imports/loading.js";

const API_BASE_URL = typeof server !== "undefined" ? server : window.server || "http://localhost:1234";

const API_URL = `${API_BASE_URL}/api/lugar/`;
const API_URL_ITINERARIOS = `${API_BASE_URL}/api/itinerario/obtenerItinerarios`;
const API_URL_CREAR_LUGAR_ITINERARIO = `${API_BASE_URL}/api/lugarItinerario/crearLugarItinerario`;

/* Endpoint unificado para favorito/visitado */
const API_URL_ESTADO_MUSEOS = `${API_BASE_URL}/api/lugar/estadoUsuarioPorMuseos`;

/* Endpoints viejos como fallback */
const API_URL_FAVORITO_GET = `${API_BASE_URL}/api/lugarFavorito/obtenerLugarFavoritoIdlugar`;
const API_URL_VISITADO_GET = `${API_BASE_URL}/api/lugarVisitado/obtenerLugarVisitadoIdlugar`;
const API_URL_FAVORITO_CREATE = `${API_BASE_URL}/api/lugarFavorito/crearLugarFavorito`;
const API_URL_VISITADO_CREATE = `${API_BASE_URL}/api/lugarVisitado/crearLugarVisitado`;
const API_URL_FAVORITO_DELETE = `${API_BASE_URL}/api/lugarFavorito/eliminarLugarFavorito`;
const API_URL_VISITADO_DELETE = `${API_BASE_URL}/api/lugarVisitado/eliminarLugarVisitado`;

const DEFAULT_RENDER_LIMIT = Infinity;
const FALLBACK_IMAGE = "assets/icons/Lugarejemplo.PNG";
const CACHE_TTL_MS = 5 * 60 * 1000;
const ITINERARY_CACHE_TTL_MS = 5 * 60 * 1000;
const USER_STATE_CACHE_TTL_MS = 5 * 60 * 1000;

let ALL_MUSEOS = [];
let CURRENT_RENDER_TOKEN = 0;
let CURRENT_NAME_FILTER = "";
let CURRENT_ALCALDIAS = new Set();
let FILTER_ABRE_HOY = false;
let FILTER_ABIERTO_AHORA = false;
let FILTER_ALWAYS_FREE = false;
let FILTER_HAS_DISCOUNT = false;
let FILTER_HAS_SERVICES = false;
let FILTER_PRECIO_MAX = null;
let USER_LOCATION = null;
let FILTER_MAX_DISTANCE_KM = null;
let ITINERARIOS_CACHE = [];
let selectedMuseum = null;

/* =========================================================
   UTILIDADES GENERALES
========================================================= */

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"'`=\/]/g, (s) => {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
      "`": "&#96;",
      "=": "&#61;",
      "/": "&#47;"
    };
    return map[s] || s;
  });
}

function apiUrl(path) {
  return API_BASE_URL ? `${API_BASE_URL}${path}` : path;
}

async function fetchJSON(url) {
  const response = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" }
  });
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
}

async function postJSON(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
}

function getCache(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;

    if (Date.now() > parsed.expiresAt) {
      localStorage.removeItem(key);
      return null;
    }

    return parsed.value ?? null;
  } catch {
    return null;
  }
}

function setCache(key, value, ttlMs = CACHE_TTL_MS) {
  try {
    localStorage.setItem(
      key,
      JSON.stringify({
        expiresAt: Date.now() + ttlMs,
        value
      })
    );
  } catch {}
}

function removeCache(key) {
  try {
    localStorage.removeItem(key);
  } catch {}
}

async function fetchPlaces() {
  const cacheKey = "ollin_places_cache";
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    const data = await fetchJSON(API_URL);
    setCache(cacheKey, data, 10 * 60 * 1000);
    return data;
  } catch (error) {
    console.error("Error fetching places:", error);
    return [];
  }
}

function getCurrentUserId() {
  const el = document.getElementById("nombreUsuario");
  return (
    el?.getAttribute("data-id-turista") ||
    el?.getAttribute("data-id-Turista") ||
    el?.dataset?.idTurista ||
    null
  );
}

function debounce(fn, delay = 250) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/* =========================================================
   IMÁGENES
========================================================= */

function getMuseumImages(place) {
  if (!place || typeof place !== "object") return [];

  const raw =
    place.Imagenes ??
    place.imagenes ??
    place?.Informacion_JSON?.Imagenes ??
    [];

  if (Array.isArray(raw)) {
    return raw.filter(Boolean);
  }

  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : (parsed ? [parsed] : []);
    } catch {
      return raw.trim() ? [raw.trim()] : [];
    }
  }

  return [];
}

function getPrimaryMuseumImage(place, fallback = FALLBACK_IMAGE) {
  const images = getMuseumImages(place);
  return images.length > 0 ? images[0] : fallback;
}

function getSecondaryMuseumImage(place, fallback = FALLBACK_IMAGE) {
  const images = getMuseumImages(place);
  return images.length > 1 ? images[1] : fallback;
}

/* =========================================================
   GEOLOCALIZACIÓN
========================================================= */

const getUserLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject("Geolocalización no soportada");
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

async function initUserLocation() {
  try {
    USER_LOCATION = await getUserLocation();
  } catch (error) {
    console.error("Error obteniendo USER_LOCATION:", error);
  }
}

function getDistanceInKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/* =========================================================
   FAVORITOS / VISITADOS: CACHE POR USUARIO
========================================================= */

function getUserStateCacheKey(idTurista) {
  return `museum_states_${idTurista}`;
}

function getUserStateMap(idTurista) {
  return getCache(getUserStateCacheKey(idTurista)) || {};
}

function saveUserStateMap(idTurista, stateMap) {
  setCache(getUserStateCacheKey(idTurista), stateMap, USER_STATE_CACHE_TTL_MS);
}

function updateUserStateCache(idTurista, idMuseo, patch) {
  if (!idTurista || !idMuseo) return;

  const key = String(idMuseo);
  const current = getUserStateMap(idTurista);
  const previous = current[key] || { favorite: false, visited: false };

  current[key] = {
    ...previous,
    ...patch
  };

  saveUserStateMap(idTurista, current);
}

function normalizeMuseumStateItem(item) {
  if (!item || typeof item !== "object") return null;

  const idMuseo =
    item.id_Museo ??
    item.ID_Museo ??
    item.idMuseo ??
    item["ID MUSEO"] ??
    item.placeId ??
    item.id ??
    item.museoId;

  if (idMuseo === undefined || idMuseo === null) return null;

  const favorite = Boolean(
    item.favorite ??
    item.isFavorite ??
    item.Favorito ??
    item.favorito ??
    item.esFavorito ??
    item.EsFavorito ??
    item.tieneFavorito
  );

  const visited = Boolean(
    item.visited ??
    item.isVisited ??
    item.Visitado ??
    item.visitado ??
    item.esVisitado ??
    item.EsVisitado ??
    item.tieneVisitado
  );

  return { idMuseo: String(idMuseo), favorite, visited };
}

function normalizeMuseumStatesResponse(data) {
  const map = {};

  if (!data) return map;

  if (Array.isArray(data)) {
    for (const item of data) {
      const normalized = normalizeMuseumStateItem(item);
      if (!normalized) continue;

      if (!map[normalized.idMuseo]) {
        map[normalized.idMuseo] = { favorite: false, visited: false };
      }

      map[normalized.idMuseo].favorite = map[normalized.idMuseo].favorite || normalized.favorite;
      map[normalized.idMuseo].visited = map[normalized.idMuseo].visited || normalized.visited;
    }
    return map;
  }

  if (typeof data === "object") {
    if (data.id_Museo || data.ID_Museo || data.idMuseo) {
      const normalized = normalizeMuseumStateItem(data);
      if (normalized) {
        map[normalized.idMuseo] = { favorite: normalized.favorite, visited: normalized.visited };
      }
      return map;
    }

    for (const [id, value] of Object.entries(data)) {
      const normalized = normalizeMuseumStateItem({ ...value, id_Museo: id });
      if (!normalized) continue;
      map[normalized.idMuseo] = { favorite: normalized.favorite, visited: normalized.visited };
    }
  }

  return map;
}

async function fetchMuseumStatesForUser(idTurista, museumIds = []) {
  const ids = [...new Set(
    (museumIds || [])
      .map(id => String(id))
      .filter(Boolean)
  )];

  if (!idTurista || ids.length === 0) return {};

  const cacheKey = getUserStateCacheKey(idTurista);
  const cachedMap = getUserStateMap(idTurista);
  const missingIds = ids.filter(id => !cachedMap[id]);

  if (missingIds.length === 0) {
    return cachedMap;
  }

  try {
    const responseData = await postJSON(API_URL_ESTADO_MUSEOS, {
      id_Turista: idTurista,
      ids_Museos: missingIds
    });

    const normalized = normalizeMuseumStatesResponse(responseData);
    const merged = { ...cachedMap, ...normalized };

    saveUserStateMap(idTurista, merged);
    return merged;
  } catch (error) {
    console.warn("Endpoint unificado no disponible o falló. Usando fallback:", error);

    const fallbackResults = await Promise.allSettled(
      missingIds.map(async (idMuseo) => {
        const [fav, vis] = await Promise.all([
          getFavorite(idMuseo, idTurista),
          getVisit(idMuseo, idTurista)
        ]);

        return [
          String(idMuseo),
          {
            favorite: fav !== null,
            visited: vis !== null
          }
        ];
      })
    );

    const merged = { ...cachedMap };

    for (const result of fallbackResults) {
      if (result.status !== "fulfilled") continue;
      const [idMuseo, state] = result.value;
      merged[idMuseo] = state;
    }

    saveUserStateMap(idTurista, merged);
    return merged;
  }
}

/* =========================================================
   ITINERARIOS
========================================================= */

function getItineraryCacheKey(idTurista) {
  return `itinerarios_${idTurista}`;
}

function clearItineraryCache(idTurista) {
  if (!idTurista) return;
  removeCache(getItineraryCacheKey(idTurista));
  ITINERARIOS_CACHE = [];
}

async function fetchItineraryPlaces(id_Turista) {
  try {
    const cacheKey = getItineraryCacheKey(id_Turista);
    const cached = getCache(cacheKey);
    if (cached) return cached;

    const data = await postJSON(API_URL_ITINERARIOS, { id_Turista });
    setCache(cacheKey, data, ITINERARY_CACHE_TTL_MS);
    return data;
  } catch (error) {
    console.error("Error fetching favorite places:", error);
    return [];
  }
}

async function addPlaceToItinerary(idPlan, idMuseo, NomLugar) {
  try {
    await postJSON(API_URL_CREAR_LUGAR_ITINERARIO, {
      id_Museo: idMuseo,
      Nombre: NomLugar,
      id_Plan: idPlan,
      MetodoTransporte: "DRIVING"
    });
  } catch (error) {
    console.error("Error al añadir lugar al itinerario:", error);
  }
}

/* =========================================================
   FAVORITOS / VISITADOS: GET
========================================================= */

async function getFavorite(idMuseo, idTurista) {
  try {
    const data = await postJSON(API_URL_FAVORITO_GET, {
      id_Museo: idMuseo,
      id_Turista: idTurista
    });

    if (data?.message) return null;
    return data;
  } catch (error) {
    console.error("Error al obtener lugar favorito:", error);
    return null;
  }
}

async function getVisit(idMuseo, idTurista) {
  try {
    const data = await postJSON(API_URL_VISITADO_GET, {
      id_Museo: idMuseo,
      id_Turista: idTurista
    });

    if (data?.message) return null;
    return data;
  } catch (error) {
    console.error("Error al obtener lugar visitado:", error);
    return null;
  }
}

/* =========================================================
   FAVORITOS / VISITADOS: MUTACIONES
========================================================= */

function addFavorite(idMuseo, NomLugar, idTurista, iconElement, actionBtn) {
  postJSON(API_URL_FAVORITO_CREATE, {
    id_Museo: idMuseo,
    Nombre: NomLugar,
    id_Turista: idTurista
  })
    .then(() => {
      if (iconElement) iconElement.src = "assets/icons/favoritosBlancoRosa.png";
      if (actionBtn) actionBtn.setAttribute("data-favorite", "true");

      updateUserStateCache(idTurista, idMuseo, { favorite: true });

      Swal.fire({
        title: "¡Agregado!",
        text: "El lugar ha sido agregado a Favoritos",
        icon: "success",
        timer: 1500,
        showConfirmButton: false
      });
    })
    .catch(error => {
      console.error("Error al agregar lugar a favoritos:", error);
    });
}

function addVisit(idMuseo, NomLugar, idTurista, iconElement, actionBtn) {
  postJSON(API_URL_VISITADO_CREATE, {
    id_Museo: idMuseo,
    Nombre: NomLugar,
    id_Turista: idTurista
  })
    .then(() => {
      if (iconElement) iconElement.src = "assets/icons/checkedRosa.png";
      if (actionBtn) actionBtn.setAttribute("data-visited", "true");

      updateUserStateCache(idTurista, idMuseo, { visited: true });

      Swal.fire({
        title: "¡Agregado!",
        text: "El lugar ha sido agregado a Visitados",
        icon: "success",
        timer: 1500,
        showConfirmButton: false
      });
    })
    .catch(error => {
      console.error("Error al agregar lugar a visitados:", error);
    });
}

function removeFavorite(idLugar, idTurista, iconElement, actionBtn) {
  postJSON(API_URL_FAVORITO_DELETE, {
    id_Museo: idLugar,
    id_Turista: idTurista
  })
    .then(() => {
      if (iconElement) iconElement.src = "assets/icons/favoritosCoral.png";
      if (actionBtn) actionBtn.setAttribute("data-favorite", "false");

      updateUserStateCache(idTurista, idLugar, { favorite: false });

      Swal.fire({
        title: "¡Eliminado!",
        text: "El lugar ha sido borrado de Favoritos",
        icon: "success",
        timer: 1500,
        showConfirmButton: false
      });
    })
    .catch(error => {
      console.error("Error al eliminar lugar de favoritos:", error);
    });
}

function removeVisit(idLugar, idTurista, iconElement, actionBtn) {
  postJSON(API_URL_VISITADO_DELETE, {
    id_Museo: idLugar,
    id_Turista: idTurista
  })
    .then(() => {
      if (iconElement) iconElement.src = "assets/icons/checkedPalido.png";
      if (actionBtn) actionBtn.setAttribute("data-visited", "false");

      updateUserStateCache(idTurista, idLugar, { visited: false });

      Swal.fire({
        title: "¡Eliminado!",
        text: "El lugar ha sido borrado de Visitados",
        icon: "success",
        timer: 1500,
        showConfirmButton: false
      });
    })
    .catch(error => {
      console.error("Error al eliminar lugar de visitados:", error);
    });
}

/* =========================================================
   HORARIOS / FILTROS
========================================================= */

function normalizeTime(value) {
  if (value === null || value === undefined) return null;

  value = String(value).trim();
  if (!value || value.toLowerCase() === "null") return null;

  if (/^\d{1,2}$/.test(value)) {
    const h = value.padStart(2, "0");
    return `${h}:00`;
  }

  if (/^\d{1,2}:\d{1,2}$/.test(value)) {
    let [h, m] = value.split(":");
    h = h.padStart(2, "0");
    m = m.padStart(2, "0");
    return `${h}:${m}`;
  }

  if (/^\d{2}:\d{2}$/.test(value)) {
    return value;
  }

  return null;
}

function getHorarioEstado(scheduleInfo) {
  const DAYS_MAP = {
    0: "Domingo",
    1: "Lunes",
    2: "Martes",
    3: "Miercoles",
    4: "Jueves",
    5: "Viernes",
    6: "Sabado"
  };

  const now = new Date();
  const today = DAYS_MAP[now.getDay()];
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const horarioIn = normalizeTime(scheduleInfo?.[`HorarioIn_${today}`]);
  const horarioOut = normalizeTime(scheduleInfo?.[`HorarioOut_${today}`]);

  if (!horarioIn || !horarioOut) {
    return { text: "Está cerrado por hoy", status: "closed" };
  }

  const [inH, inM] = horarioIn.split(":").map(Number);
  const [outH, outM] = horarioOut.split(":").map(Number);

  const open = inH * 60 + inM;
  const close = outH * 60 + outM;

  if (currentMinutes < open) {
    return { text: `Abre a las ${horarioIn} hrs`, status: "before" };
  }

  if (currentMinutes >= close) {
    return { text: `Cerrado · Abrió de ${horarioIn} a ${horarioOut}`, status: "after" };
  }

  return { text: `Abierto · Cierra a las ${horarioOut} hrs`, status: "open" };
}

function getMuseumPriority(scheduleInfo) {
  const estado = getHorarioEstado(scheduleInfo);

  switch (estado.status) {
    case "open":
      return 0;
    case "before":
      return 1;
    default:
      return 2;
  }
}

function generateStars(rating) {
  let starsHtml = "";
  for (let i = 0; i < 5; i++) {
    starsHtml += `<span class="star" style="color: gold;">${i < rating ? "&#9733;" : "&#9734;"}</span>`;
  }
  return starsHtml;
}

function normalizeText(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function getAllPriceText(museo) {
  return [
    ...(museo.AdmisionGeneral || []),
    ...(museo.EntradaGratuita || []),
    ...(museo.EntradaLibre || []),
    ...(museo.AccesoGratuito || []),
    ...(museo.EntradaesGratuita || [])
  ].join(" ").toLowerCase();
}

function isAlwaysFree(museo) {
  const hasGeneral = museo.AdmisionGeneral && museo.AdmisionGeneral.length > 0;
  const text = getAllPriceText(museo);
  const hasFreeKeywords =
    text.includes("gratuit") ||
    text.includes("libre") ||
    text.includes("gratis") ||
    text.includes("acceso gratuito");

  return !hasGeneral && (hasFreeKeywords || text.length === 0);
}

function hasDiscount(museo) {
  const hasGeneral = museo.AdmisionGeneral && museo.AdmisionGeneral.length > 0;
  if (!hasGeneral) return false;

  const text = getAllPriceText(museo);

  return [
    "gratuit",
    "libre",
    "gratis",
    "domingo",
    "domingos",
    "estudiante",
    "maestro",
    "docente",
    "adulto mayor",
    "tercera edad",
    "menor",
    "niño",
    "descuento"
  ].some(k => text.includes(k));
}

function getPrecioEstimado(m) {
  const textos = [m.EntradaGeneral, m.AdmisionGeneral, m.OtrosCostos].join(" ").toLowerCase();
  const match = textos.match(/\$?\s*(\d+)/);
  return match ? parseInt(match[1]) : null;
}

function hasServices(museo) {
  return museo.Servicios && museo.Servicios.length > 0;
}

function abreHoy(museo) {
  const dayMap = {
    0: "Domingo",
    1: "Lunes",
    2: "Martes",
    3: "Miercoles",
    4: "Jueves",
    5: "Viernes",
    6: "Sabado"
  };

  const today = dayMap[new Date().getDay()];
  return museo[`HorarioIn_${today}`] && museo[`HorarioOut_${today}`];
}

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
    } else {
      result = [];
    }
  }

  if (CURRENT_ALCALDIAS.size > 0) {
    result = result.filter(m =>
      m.Municipio &&
      CURRENT_ALCALDIAS.has(normalizeText(m.Municipio))
    );
  }

  if (FILTER_ABRE_HOY) result = result.filter(abreHoy);
  if (FILTER_ABIERTO_AHORA) result = result.filter(m => getHorarioEstado(m).status === "open");
  if (FILTER_ALWAYS_FREE) result = result.filter(m => isAlwaysFree(m));
  if (FILTER_HAS_DISCOUNT) result = result.filter(m => hasDiscount(m));
  if (FILTER_HAS_SERVICES) result = result.filter(m => hasServices(m));

  if (FILTER_PRECIO_MAX != null) {
    result = result.filter(m => {
      const p = getPrecioEstimado(m);
      return p === null || p <= FILTER_PRECIO_MAX;
    });
  }

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

  displayFavorites(DEFAULT_RENDER_LIMIT, result)
    .catch(e => console.error("Error aplicando filtros:", e));
}

/* =========================================================
   TARJETAS
========================================================= */



function createMuseumCard(storedPlace, userState = {}) {

    const rating = typeof storedPlace.Rating === "number"
        ? Math.round(storedPlace.Rating * 2) / 2
        : 0;

    const starsHtml = generateStars(rating);

    const placeId = storedPlace["ID MUSEO"];

    const isFavorite = Boolean(userState.favorite);
    const isVisited = Boolean(userState.visited);

    const favoriteIcon = isFavorite
        ? "assets/icons/favoritosBlancoRosa.png"
        : "assets/icons/favoritosCoral.png";

    const visitedIcon = isVisited
        ? "assets/icons/checkedRosa.png"
        : "assets/icons/checkedPalido.png";

    const horarioEstado = getHorarioEstado(storedPlace);

    const imageSrc = getPrimaryMuseumImage(
        storedPlace,
        FALLBACK_IMAGE
    );

    const badgeColor =
        horarioEstado.status === "open"
            ? "bg-green-100 text-green-700"
            : "bg-gray-100 text-gray-600";

    return `
    <div class="favorite-card bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col min-h-[380px] h-auto border border-gray-100 group relative">
        
            <div class="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold ${badgeColor} shadow-sm z-10 backdrop-blur-sm bg-opacity-90">
            ${horarioEstado.status === 'open' ? 'Abierto' : 'Cerrado'}
        </div>

        <div class="relative h-48 w-full shrink-0 overflow-hidden bg-gray-100">
            <img 
                src="${storedPlace.Imagenes ? storedPlace.Imagenes[0] : 'assets/icons/Lugarejemplo.PNG'}" 
                alt="Museo"
                class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>

        <!-- Contenido -->
        <div class="p-5 flex flex-col flex-1 justify-between bg-white z-20">

            <div class="mb-2">
                <h3 class="info-name text-lg font-bold text-gray-800 leading-tight line-clamp-2" data-placeid="${storedPlace['ID MUSEO']}">
                    ${storedPlace.NombreMuseo || 'Nombre no especificado'}
                </h3>
            </div>

            <div class="flex-1 flex flex-col justify-end space-y-3">
                
                <p class="text-xs text-gray-500 line-clamp-2 flex items-start">
                    <svg class="w-4 h-4 text-[#438B9E] mr-1 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    ${storedPlace.Direccion || 'Dirección no especificada'}
                </p>

                <!-- Horario -->
                <p class="text-xs text-gray-500 line-clamp-2 flex items-start">
                    <img
                        src="assets/icons/reloj2.png"
                        class="w-4 h-4 opacity-70"
                        loading="lazy"
                        decoding="async"
                    />
                        <strong>Horario:</strong>
                        ${escapeHTML(horarioEstado.text)}
                </p>
                <div class="card-actions flex items-center justify-between gap-2 flex-wrap">
                <!-- Rating -->
                    <div class="flex items-center gap-2">
                        <span class="text-xs font-semibold text-gray-400">★ ${storedPlace.Rating || 'S/N'}</span>
                    </div>
                    <!-- Ver más -->
                    <div class="flex items-center gap-3">
                        <button
                            type="button"
                            data-action="view-more"
                            data-id-museo="${escapeHTML(placeId)}"
                            aria-label="Ver más"
                            class="bg-[#F4EFE6] hover:scale-110 transition-all duration-300 rounded-full p-2 shadow-sm"
                        >
                            <img
                                src="/assets/icons/Boton ojoA.svg"
                                alt="Ver más"
                                class="w-5 h-5"
                                loading="lazy"
                                decoding="async"
                            />
                        </button>

                        <!-- Visitados -->
                        <button
                            type="button"
                            data-action="visitados"
                            data-visited="${isVisited}"
                            aria-label="Visitados"
                            class="bg-[#F4EFE6] hover:scale-110 transition-all duration-300 rounded-full p-2 shadow-sm"
                        >
                            <img
                                src="${escapeHTML(visitedIcon)}"
                                alt="Visitados"
                                class="w-5 h-5"
                                loading="lazy"
                                decoding="async"
                            />
                        </button>

                        <!-- Favoritos -->
                        <button
                            type="button"
                            data-action="favoritos"
                            data-favorite="${isFavorite}"
                            aria-label="Favoritos"
                            class="bg-[#F4EFE6] hover:scale-110 transition-all duration-300 rounded-full p-2 shadow-sm"
                        >
                            <img
                                src="${escapeHTML(favoriteIcon)}"
                                alt="Favoritos"
                                class="w-5 h-5"
                                loading="lazy"
                                decoding="async"
                            />
                        </button>

                        <!-- Origen -->
                        <button
                            type="button"
                            data-action="origen"
                            aria-label="Origen"
                            class="bg-[#F4EFE6] hover:scale-110 transition-all duration-300 rounded-full p-2 shadow-sm"
                        >
                            <img
                                src="assets/icons/origenIcon.png"
                                alt="Origen"
                                class="w-5 h-5"
                                loading="lazy"
                                decoding="async"
                            />
                        </button>

                        <!-- Itinerario -->
                        <button
                            type="button"
                            data-action="agregar-itinerario"
                            aria-label="Agregar al itinerario"
                            class="bg-[#F4EFE6] hover:scale-110 transition-all duration-300 rounded-full p-2 shadow-sm"
                        >
                            <img
                                src="assets/icons/agregarAItinerario.png"
                                alt="Agregar"
                                class="w-5 h-5"
                                loading="lazy"
                                decoding="async"
                            />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;
}

async function displayFavorites(maxMuseos = DEFAULT_RENDER_LIMIT, filteredList = null) {
  const renderToken = ++CURRENT_RENDER_TOKEN;
  const museumContainer = document.getElementById("museodes");
  if (!museumContainer) return;

  let favoritePlaces = filteredList || ALL_MUSEOS;

  if (!filteredList) {
    favoritePlaces = await fetchPlaces();
    if (renderToken !== CURRENT_RENDER_TOKEN) return;
    ALL_MUSEOS = Array.isArray(favoritePlaces) ? favoritePlaces : [];
  }

  // --- NUEVA VALIDACIÓN AQUÍ ---
  // Si filteredList se pasó como argumento y está vacío, mostramos el mensaje y salimos.
  if (filteredList && filteredList.length === 0) {
        museumContainer.innerHTML = `<div class="col-span-full flex flex-col items-center justify-center p-10 bg-white rounded-2xl shadow-sm text-gray-500 mt-4 h-64"><svg class="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path></svg><p class="text-lg">No se encontraron museos con los filtros aplicados.</p></div>`;
        return;
  }
  // -----------------------------

  favoritePlaces = [...(favoritePlaces || [])].sort((a, b) => getMuseumPriority(a) - getMuseumPriority(b));

  const renderedIds = new Set();
  const limited = [];

  for (const place of favoritePlaces) {
    const id = String(place["ID MUSEO"]);
    if (renderedIds.has(id)) continue;
    renderedIds.add(id);
    limited.push(place);
    if (limited.length >= maxMuseos) break;
  }

  const userId = getCurrentUserId();
  let statesMap = {};

  // Al haber retornado antes si no había resultados, nos ahorramos esta llamada a la BD
  if (userId) {
    statesMap = await fetchMuseumStatesForUser(userId, limited.map(p => p["ID MUSEO"]));
    if (renderToken !== CURRENT_RENDER_TOKEN) return;
  }

  const cards = limited.map(place => {
    const id = String(place["ID MUSEO"]);
    return createMuseumCard(place, statesMap[id] || {});
  });

  if (renderToken !== CURRENT_RENDER_TOKEN) return;
  museumContainer.innerHTML = cards.join("");
}

/* =========================================================
   BÚSQUEDA
========================================================= */

function buscarMuseosPorNombre(texto) {
  CURRENT_NAME_FILTER = texto;
  applyAllFilters();
}

/* =========================================================
   ITINERARIOS UI
========================================================= */

function showDone(nombreLugar, NombreItinerario) {
  Swal.fire({
    icon: "success",
    title: `¡Se ha agregado ${nombreLugar} a tu plan de visita ${NombreItinerario}!`,
    showConfirmButton: false,
    timer: 1500,
  });
}

async function displayIninerary() {
  try {
    const nombreUsuario = document.getElementById("nombreUsuario");
    const idTurista = getCurrentUserId();
    if (!idTurista) return;

    const cacheKey = getItineraryCacheKey(idTurista);
    const cached = getCache(cacheKey);
    const itinerariesContainer = document.getElementById("itinerariosDisponibles");
    if (!itinerariesContainer) return;

    if (cached) {
      ITINERARIOS_CACHE = cached.filter(itinerario => itinerario.Estado !== "F");
      itinerariesContainer.innerHTML = ITINERARIOS_CACHE.length > 0
        ? ITINERARIOS_CACHE.map(createItineraryList).join("")
        : "<div>No hay itinerarios disponibles.</div>";
      return;
    }

    const itinerarios = await fetchItineraryPlaces(idTurista);
    ITINERARIOS_CACHE = Array.isArray(itinerarios)
      ? itinerarios.filter(itinerario => itinerario.Estado !== "F")
      : [];

    itinerariesContainer.innerHTML = ITINERARIOS_CACHE.length > 0
      ? ITINERARIOS_CACHE.map(createItineraryList).join("")
      : "<div>No hay itinerarios disponibles.</div>";
  } catch (error) {
    console.error("Error al mostrar itinerarios:", error);
  }
}

function createItineraryList(itinerario, index) {
  return `
    <li>
      <button type="button" id="itinerarioID-${index}" class="dropdown-item" data-id-itinerario="${escapeHTML(itinerario.ID)}" data-nombre-itinerario="${escapeHTML(itinerario.Nombre)}">
        <img src="assets/icons/agregarIcon2.png"    loading="lazy"
   decoding="async" width="24px" height="24px" loading="lazy" decoding="async">
        ${escapeHTML(itinerario.Nombre)}
      </button>
    </li>
  `;
}



/* =========================================================
   VIEW MORE
========================================================= */

function formatoHorario(inicio, fin) {
  if (!inicio || !fin) return null;
  return `${inicio} hrs – ${fin} hrs`;
}

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

function abrirViewMore(museoData) {
  const language = localStorage.getItem("lang") || "es";
  const direccion = museoData ? museoData.Direccion : "Dirección no disponible";

  document.getElementById("vm-nombre").textContent = museoData.NombreMuseo || "";
  document.getElementById("vm-image").src = getPrimaryMuseumImage(museoData, FALLBACK_IMAGE);
  document.getElementById("vm-image2").src = getSecondaryMuseumImage(museoData, FALLBACK_IMAGE);

  const body = document.getElementById("vm-body");
  body.innerHTML = "";

  if (language === "es") {
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
      "Teléfono": museoData.Telefono || "No disponible",
    });
  } else if (language === "en") {
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
      "Phone": museoData.Telefono || "Not available",
    });
  } else if (language === "fr") {
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
      "Téléphone": museoData.Telefono || "Non disponible",
    });
  } else if (language === "it") {
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
      "Ingresso generale 2": museoData.EntradaGeneral,
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
      "Telefono": museoData.Telefono || "Non disponibile",
    });
  }

  document.getElementById("viewMoreCard").classList.remove("hidden");
}

/* =========================================================
   CARGA DE ITINERARIOS NUEVOS
========================================================= */

function showLoadingStateForMuseos(container) {
  if (!container) return;
  container.innerHTML = '<div class="loading-state">Cargando museos...</div>';
}

/* =========================================================
   DOM
========================================================= */

function initEventHandlers() {
  const container = document.getElementById("museodes");
  const itinerariosDisponibles = document.getElementById("itinerariosDisponibles");
  const formNuevaAventura = document.getElementById("formNuevaAventura");
  const createAdventureLink = document.querySelector(".create-adventure-link");
  const filterIcon = document.getElementById("filter-icon");
  const filtersBox = document.getElementById("filters-expanded");
  const searchInput = document.getElementById("searchMuseoInput");

  document.getElementById("vm-cerrar")?.addEventListener("click", () => {
    document.getElementById("viewMoreCard")?.classList.add("hidden");
  });

  document.addEventListener("click", (e) => {
    const modal = document.getElementById("viewMoreCard");
    if (modal && e.target === modal) modal.classList.add("hidden");
  });

  if (filterIcon && filtersBox) {
    filterIcon.addEventListener("click", () => {
      filtersBox.style.display = filtersBox.style.display === "none" ? "block" : "none";
    });

    filtersBox.addEventListener("click", e => e.stopPropagation());

    document.addEventListener("click", (e) => {
      if (!filtersBox.contains(e.target) && e.target !== filterIcon) {
        filtersBox.style.display = "none";
      }
    });
  }

  document.getElementById("filterSend")?.addEventListener("click", () => {
    CURRENT_ALCALDIAS.clear();

    document.querySelectorAll(".alcaldia-checkbox:checked").forEach(cb => {
      CURRENT_ALCALDIAS.add(normalizeText(cb.dataset.alcaldia));
    });

    FILTER_ALWAYS_FREE = document.getElementById("filterAlwaysFree")?.checked || false;
    FILTER_HAS_DISCOUNT = document.getElementById("filterHasDiscounts")?.checked || false;
    FILTER_HAS_SERVICES = document.getElementById("filterHasServices")?.checked || false;
    FILTER_ABIERTO_AHORA = document.getElementById("filter-abierto-ahora")?.checked || false;
    FILTER_ABRE_HOY = document.getElementById("filter-abre-hoy")?.checked || false;

    const precioVal = document.getElementById("filter-precio-max")?.value;
    FILTER_PRECIO_MAX = precioVal ? parseInt(precioVal, 10) : null;

    const distVal = document.getElementById("filterDistanceKm")?.value;
    FILTER_MAX_DISTANCE_KM = distVal ? parseInt(distVal, 10) : null;

    applyAllFilters();
    if (filtersBox) filtersBox.style.display = "none";
  });

  document.getElementById("filterErase")?.addEventListener("click", () => {
    CURRENT_ALCALDIAS.clear();
    CURRENT_NAME_FILTER = "";

    FILTER_ALWAYS_FREE = false;
    FILTER_HAS_DISCOUNT = false;
    FILTER_HAS_SERVICES = false;
    FILTER_ABIERTO_AHORA = false;
    FILTER_ABRE_HOY = false;
    FILTER_PRECIO_MAX = null;
    FILTER_MAX_DISTANCE_KM = null;

    document.querySelectorAll(".alcaldia-checkbox").forEach(cb => cb.checked = false);

    ["filterAlwaysFree", "filterHasDiscounts", "filterHasServices", "filter-abierto-ahora", "filter-abre-hoy"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.checked = false;
    });

    const precioInput = document.getElementById("filter-precio-max");
    if (precioInput) precioInput.value = "";

    const searchInput = document.getElementById("searchMuseoInput");
    if (searchInput) searchInput.value = "";

    const distSelect = document.getElementById("filterDistanceKm");
    if (distSelect) distSelect.value = "";

    applyAllFilters();
    if (filtersBox) filtersBox.style.display = "none";
  });

  if (searchInput) {
    searchInput.addEventListener("input", debounce((event) => {
      buscarMuseosPorNombre(event.target.value);
    }, 200));
  }

  container?.addEventListener("click", async (event) => {
    const actionBtn = event.target.closest("[data-action]");
    if (!actionBtn) return;

    const card = actionBtn.closest(".favorite-card");
    if (!card) return;

    const idLugar = card.querySelector(".info-name")?.getAttribute("data-placeid");
    const nombreMuseo = card.querySelector(".info-name")?.textContent.trim();
    const idTurista = getCurrentUserId();
    const action = actionBtn.dataset.action;

    if (action === "view-more") {
      const museum = ALL_MUSEOS.find(p => String(p["ID MUSEO"]) === String(idLugar));
      if (museum) abrirViewMore(museum);
      return;
    }

    if (action === "origen") {
      window.location.href = `/singleRoute?placeId=${encodeURIComponent(idLugar)}`;
      return;
    }

    if (action === "agregar-itinerario") {
      selectedMuseum = { idMuseo: idLugar, nombreMuseo };
      const modal = new bootstrap.Modal(document.getElementById("nuevaAventuraModal"));
      modal.show();
      displayIninerary();
      return;
    }

    if (action === "favoritos") {
      const iconElement = actionBtn.querySelector("img");
      const isFavorite = actionBtn.getAttribute("data-favorite") === "true";

      Swal.fire({
        title: "¿Estás seguro?",
        text: isFavorite
          ? "Esta acción eliminará este Museo de Favoritos"
          : "Esta acción agregará este Museo a Favoritos",
        icon: isFavorite ? "warning" : "question",
        showCancelButton: true,
        confirmButtonColor: "#65B2C6",
        cancelButtonColor: "#D63D6C",
        confirmButtonText: "Estoy seguro",
        cancelButtonText: "Regresar"
      }).then((result) => {
        if (!result.isConfirmed) return;

        if (isFavorite) {
          removeFavorite(idLugar, idTurista, iconElement, actionBtn);
        } else {
          addFavorite(idLugar, nombreMuseo, idTurista, iconElement, actionBtn);
        }
      });

      return;
    }

    if (action === "visitados") {
      const iconElement = actionBtn.querySelector("img");
      const isVisited = actionBtn.getAttribute("data-visited") === "true";

      Swal.fire({
        title: "¿Estás seguro?",
        text: isVisited
          ? "Esta acción eliminará este Museo de Visitados"
          : "Esta acción agregará este Museo a Visitados",
        icon: isVisited ? "warning" : "question",
        showCancelButton: true,
        confirmButtonColor: "#65B2C6",
        cancelButtonColor: "#D63D6C",
        confirmButtonText: "Estoy seguro",
        cancelButtonText: "Regresar"
      }).then((result) => {
        if (!result.isConfirmed) return;

        if (isVisited) {
          removeVisit(idLugar, idTurista, iconElement, actionBtn);
        } else {
          addVisit(idLugar, nombreMuseo, idTurista, iconElement, actionBtn);
        }
      });
    }
  });

  itinerariosDisponibles?.addEventListener("click", async (event) => {
    const button = event.target.closest("button.dropdown-item");
    if (!button || !selectedMuseum) return;

    const idPlan = button.dataset.idItinerario;
    const nombreItinerario = button.dataset.nombreItinerario;

    await addPlaceToItinerary(idPlan, selectedMuseum.idMuseo, selectedMuseum.nombreMuseo);
    showDone(selectedMuseum.nombreMuseo, nombreItinerario);

    bootstrap.Modal.getInstance(document.getElementById("nuevaAventuraModal"))?.hide();
    selectedMuseum = null;
  });

  createAdventureLink?.addEventListener("click", () => {
    const modal = new bootstrap.Modal(document.getElementById("newPlanModal"));
    modal.show();
  });

  formNuevaAventura?.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!selectedMuseum) return;

    const nombreItinerario = document.getElementById("nombreItinerario").value;
    const idTurista = getCurrentUserId();

    if (!nombreItinerario.trim() || nombreItinerario.length < 5 || nombreItinerario.length > 15) {
      return;
    }

    try {
      const res = await postJSON(`${API_BASE_URL}/api/itinerario/crearItinerario`, {
        Nombre: nombreItinerario,
        id_Turista: idTurista
      });

      const { id_Plan } = res;

      clearItineraryCache(idTurista);
      await addPlaceToItinerary(id_Plan, selectedMuseum.idMuseo, selectedMuseum.nombreMuseo);
      await displayIninerary();

      showDone(selectedMuseum.nombreMuseo, nombreItinerario);

      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error("Error creando itinerario:", error);
    }
  });
}

/* =========================================================
   ARRANQUE
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
  showLoading("Cargando museos...");

  try {
    initEventHandlers();
    await esperarUsuario();
    await Promise.all([
      displayFavorites(DEFAULT_RENDER_LIMIT),
      initUserLocation()
    ]);
  } catch (e) {
    console.error("Error al cargar museos:", e);
    const container = document.getElementById("museodes");
    if (container) {
      container.innerHTML = '<div class="error-message">Error al cargar los museos. Por favor, intenta recargar la página.</div>';
    }
  } finally {
    hideLoading();
  }
});

function esperarUsuario(timeoutMs = 10000) {
  return new Promise((resolve) => {
    if (window.usuarioLogueado) {
      resolve(window.usuarioLogueado);
      return;
    }

    const start = Date.now();
    const interval = setInterval(() => {
      if (window.usuarioLogueado) {
        clearInterval(interval);
        resolve(window.usuarioLogueado);
        return;
      }

      if (Date.now() - start > timeoutMs) {
        clearInterval(interval);
        resolve(null);
      }
    }, 50);
  });
}