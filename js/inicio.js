console.log("Inicio.js cargado");

/* =========================================================
   CONFIG BASE
========================================================= */

const API_BASE_URL =
    (typeof server !== "undefined" && server) ||
    (typeof window !== "undefined" && window.server) ||
    ("localhost:1234" ? `http://${"localhost:1234"}` : null) ||
    "";

if (!API_BASE_URL) {
    console.warn("No se encontró la variable server. Se usarán rutas relativas.");
}

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 min
const CACHE_EVENTOS_MS = 30 * 60 * 1000; // 30 min
const CACHE_MUSEOS_EVENTO_MS = 30 * 60 * 1000; // 30 min
const FALLBACK_IMAGE = "assets/icons/museum_icon.png";

const API_URL_CREAR_LUGAR_ITINERARIO = `${API_BASE_URL}/api/lugarItinerario/crearLugarItinerario`;

/* =========================================================
   ESTADO GLOBAL
========================================================= */

let eventoActual = null;
let museosActuales = [];

/* =========================================================
   HELPERS GENERALES
========================================================= */

function apiUrl(path) {
    return API_BASE_URL ? `${API_BASE_URL}${path}` : path;
}

async function postJSON(path, body) {
    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        }
    };

    if (body !== undefined) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(apiUrl(path), options);

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
        return response.json();
    }

    return response.text();
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
    } catch (error) {
        console.warn("Error leyendo caché:", error);
        return null;
    }
}

function setCache(key, value, ttlMs) {
    try {
        localStorage.setItem(
            key,
            JSON.stringify({
                expiresAt: Date.now() + ttlMs,
                value
            })
        );
    } catch (error) {
        console.warn("Error guardando caché:", error);
    }
}

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

function getMuseumImage(museo) {
    return museo?.Imagenes?.length > 0 ? museo.Imagenes[0] : FALLBACK_IMAGE;
}

/* =========================================================
   FECHAS
========================================================= */

function formatearFecha(fecha) {
    if (!fecha) return "";

    const date = new Date(fecha);
    if (Number.isNaN(date.getTime())) return "";

    return new Intl.DateTimeFormat("es-MX", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
    }).format(date);
}

function generarNombreItinerario(evento) {
    if (!evento || !evento.Fecha_Inicio) return "NightMuseums";

    const date = new Date(evento.Fecha_Inicio);
    if (Number.isNaN(date.getTime())) return "NightMuseums";

    const dia = String(date.getDate()).padStart(2, "0");
    const mes = String(date.getMonth() + 1).padStart(2, "0");

    return `NightMuseums${dia}/${mes}`;
}

/* =========================================================
   API: RECOMENDACIONES
========================================================= */

async function fetchRecommendedMuseums(idTurista = null) {
    const cacheKey = `recomendaciones_${idTurista || "global"}`;
    const cached = getCache(cacheKey);

    if (cached) {
        console.log("Cargando recomendaciones desde caché");
        return cached;
    }

    try {
        const recomendaciones = await postJSON(
            "/api/lugarVisitado/recomendarMuseos"
        );

        setCache(cacheKey, recomendaciones, CACHE_TTL_MS);
        return recomendaciones;
    } catch (error) {
        console.error("Error fetching recommended museums:", error);
        return [];
    }
}

async function cargarRecomendaciones() {
    const nombreUsuario = document.getElementById("nombreUsuario");
    const idTurista =
        nombreUsuario?.getAttribute("data-id-Turista") ||
        nombreUsuario?.dataset?.idTurista ||
        null;

    console.log("Consultando API para recomendaciones...");
    return fetchRecommendedMuseums(idTurista);
}

function renderRecomendations(recomendaciones) {
    const recommendedContainer = document.getElementById("recommendedMuseums");
    if (!recommendedContainer) return;

    recommendedContainer.replaceChildren();

    if (!Array.isArray(recomendaciones) || recomendaciones.length === 0) {
        recommendedContainer.innerHTML = `
            <p class="text-sm text-gray-300">No hay recomendaciones disponibles.</p>
        `;
        return;
    }

    const fragment = document.createDocumentFragment();

    for (const museo of recomendaciones) {
        const card = document.createElement("div");
        card.className =
            "bg-white min-w-40 rounded-xl p-3 hover:scale-105 transition cursor-pointer";

        const imagenPrincipal = getMuseumImage(museo);
        const nombreMuseo = escapeHTML(museo?.NombreMuseo || "Museo");

        card.innerHTML = `
            <img src="${escapeHTML(imagenPrincipal)}"
                alt="${nombreMuseo}"
                class="w-36 lg:w-full h-36 object-cover rounded-lg"
                loading="lazy"
                decoding="async">

            <div class="flex flex-col lg:flex-row items-center justify-center gap-2 mt-2">
                <img src="assets/icons/museum_icon.png"
                    alt="museum"
                    class="w-4 h-4"
                    loading="lazy"
                    decoding="async">

                <h5 class="text-sm font-semibold">${nombreMuseo}</h5>
            </div>
        `;

        fragment.appendChild(card);
    }

    recommendedContainer.appendChild(fragment);
}

/* =========================================================
   API: EVENTOS
========================================================= */

async function cargarEventos() {
    const cacheKey = "eventos_home";
    const cached = getCache(cacheKey);

    if (cached) {
        console.log("Cargando eventos desde caché");
        return cached;
    }

    try {
        const eventosData = await postJSON("/api/evento/obtenerDescripcionEvento");
        setCache(cacheKey, eventosData, CACHE_EVENTOS_MS);
        return eventosData;
    } catch (error) {
        console.error("Error fetching eventos:", error);
        return [];
    }
}

async function cargarMuseosEvento(idEvento) {
    const cacheKey = `museos_evento_${idEvento}`;
    const cached = getCache(cacheKey);

    if (cached) {
        console.log("Cargando museos del evento desde caché");
        return cached;
    }

    try {
        const museos = await postJSON("/api/evento/obtenerMuseosPorEvento", {
            id_Evento: idEvento
        });

        setCache(cacheKey, museos, CACHE_MUSEOS_EVENTO_MS);
        return museos;
    } catch (error) {
        console.error("Error fetching museos:", error);
        return [];
    }
}

/* =========================================================
   ITINERARIO
========================================================= */

async function addPlaceToItinerary(idPlan, idMuseo, NomLugar) {
    return postJSON(API_URL_CREAR_LUGAR_ITINERARIO, {
        id_Museo: idMuseo,
        Nombre: NomLugar,
        id_Plan: idPlan,
        MetodoTransporte: "DRIVING"
    });
}

function showDone() {
    Swal.fire({
        icon: "success",
        title: "¡Se ha guardado el evento a tus planes de visita!",
        showConfirmButton: false,
        timer: 1500
    });
}

async function saveEventAndMuseums(nombreItinerario, idTurista, museos) {
    try {
        const res = await postJSON("/api/itinerario/crearItinerario", {
            Nombre: nombreItinerario,
            id_Turista: idTurista
        });

        const idPlan = res?.id_Plan;
        if (!idPlan) {
            throw new Error("No se recibió id_Plan al crear el itinerario.");
        }

        console.log("Itinerario creado con ID:", idPlan);

        const results = await Promise.allSettled(
            museos.map((museo) =>
                addPlaceToItinerary(idPlan, museo.id_Museo, museo.Nombre)
            )
        );

        const fallidos = results.filter((r) => r.status === "rejected");
        if (fallidos.length > 0) {
            console.warn(`${fallidos.length} museos no se pudieron guardar.`);
        }

        showDone();

        setTimeout(() => {
            window.location.reload();
        }, 1000);
    } catch (error) {
        console.error("Error al crear itinerario:", error);

        Swal.fire({
            icon: "error",
            title: "Error al guardar el evento",
            text: "Intenta nuevamente"
        });
    }
}

/* =========================================================
   RENDER PRINCIPAL
========================================================= */

async function renderSlide(eventosData) {
    const container = document.getElementById("carouselContainer");
    if (!container) return;

    const eventosArray = Array.isArray(eventosData) ? eventosData : [];

    if (eventosArray.length === 0) {
        container.innerHTML = "<p data-i18n='noevents'>No hay eventos disponibles.</p>";
        return;
    }

    eventoActual = eventosArray[0];

    container.innerHTML = `
        <div class="grid lg:grid-cols-2 gap-10 h-full">
            <div class="flex flex-col justify-center">
                <h1 class="text-sm md:text-3xl font-extrabold mb-4 tracking-wide">
                    <span data-i18n="night_of_museums">Noche de Museos</span>
                </h1>

                <p class="text-xs md:text-sm lg:text-md text-gray-200 mb-4 leading-relaxed max-w-xl">
                    ${escapeHTML(eventoActual.Descripcion || "")}
                </p>

                <p class="text-xs md:text-sm text-yellow-400 font-semibold">
                    Del ${formatearFecha(eventoActual.Fecha_Inicio)}
                    al ${formatearFecha(eventoActual.Fecha_Limite)}
                </p>
            </div>

            <div class="hidden lg:flex flex-col justify-center">
                <div class="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/20 shadow-xl h-[320px]">
                    <h2 class="text-xl font-semibold mb-4" data-i18n="participating_museums">
                        Museos Participantes
                    </h2>

                    <div id="carouselMuseos"
                        class="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-40 overflow-y-auto pr-2 scroll-smooth scrollbar-thin scrollbar-thumb-red-700 scrollbar-track-red-900 scrollbar-hide hover:scrollbar-default">
                        <p class="text-white/70 text-sm">Cargando museos...</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    const museosData = await cargarMuseosEvento(eventoActual.id_Evento);
    museosActuales = Array.isArray(museosData) ? museosData : [];

    const museosContainer = document.getElementById("carouselMuseos");
    if (!museosContainer) return;

    if (museosActuales.length === 0) {
        museosContainer.innerHTML = `<p class="text-white/70 text-sm">No hay museos para este evento.</p>`;
        return;
    }

    museosContainer.innerHTML = museosActuales
        .map((museo) => {
            const imagenPrincipal = getMuseumImage(museo);
            const nombreMuseo = escapeHTML(museo?.Nombre || "Museo");

            return `
                <div class="bg-white/20 flex lg:flex-col xl:flex-row items-center justify-center hover:bg-white/30 transition duration-300 rounded-lg p-3 gap-2 mt-2 cursor-pointer">
                    <img src="${escapeHTML(imagenPrincipal)}"
                        alt="${nombreMuseo}"
                        class="w-10 h-10 object-cover rounded-full"
                        loading="lazy"
                        decoding="async">
                    <h3 class="text-sm font-semibold">${nombreMuseo}</h3>
                </div>
            `;
        })
        .join("");
}

/* =========================================================
   BANNER DINÁMICO
========================================================= */

function renderBannerContent() {
    if (!eventoActual) return;

    const bannerDescripcion = document.getElementById("bannerDescripcion");
    const bannerFecha = document.getElementById("bannerFecha");
    const museosContainer = document.getElementById("bannerMuseos");

    if (bannerDescripcion) {
        bannerDescripcion.textContent = eventoActual.Descripcion || "";
    }

    if (bannerFecha) {
        bannerFecha.textContent =
            `Del ${formatearFecha(eventoActual.Fecha_Inicio)} al ${formatearFecha(eventoActual.Fecha_Limite)}`;
    }

    if (museosContainer) {
        if (!Array.isArray(museosActuales) || museosActuales.length === 0) {
            museosContainer.innerHTML = `
                <p class="text-sm text-gray-300">No hay museos disponibles.</p>
            `;
            return;
        }

        museosContainer.innerHTML = museosActuales
            .map((museo) => {
                const imagenPrincipal = getMuseumImage(museo);
                const nombreMuseo = escapeHTML(museo?.Nombre || "Museo");

                return `
                    <div class="bg-white/20 hover:bg-white/30 transition rounded-lg p-3 flex items-center gap-2">
                        <img src="${escapeHTML(imagenPrincipal)}"
                            class="w-8 h-8 object-cover rounded-full"
                            alt="${nombreMuseo}"
                            loading="lazy"
                            decoding="async">
                        <span class="font-semibold text-sm">${nombreMuseo}</span>
                    </div>
                `;
            })
            .join("");
    }
}

/* =========================================================
   USER WAIT
========================================================= */

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

/* =========================================================
   CARGA INICIAL
========================================================= */

async function cargarContenidoInicial() {
    try {
        const [recomendaciones, eventosData] = await Promise.all([
            cargarRecomendaciones(),
            cargarEventos()
        ]);

        renderRecomendations(recomendaciones);
        await renderSlide(eventosData);
    } catch (error) {
        console.error("Error al cargar contenido inicial:", error);
    }
}

/* =========================================================
   EVENT LISTENERS
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    const nightSection = document.getElementById("night-event");
    const eventBanner = document.getElementById("eventBanner");
    const saveBtn = document.getElementById("saveEventBtn");
    const closeEventBanner = document.getElementById("closeEventBanner");

    if (nightSection && eventBanner && closeEventBanner) {
        nightSection.addEventListener("click", (e) => {
            if (e.target.closest("button")) return;

            renderBannerContent();
            eventBanner.classList.remove("hidden");
        });

        closeEventBanner.addEventListener("click", () => {
            eventBanner.classList.add("hidden");
        });

        eventBanner.addEventListener("click", (e) => {
            if (e.target === eventBanner) {
                eventBanner.classList.add("hidden");
            }
        });
    }

    if (saveBtn) {
        saveBtn.addEventListener("click", async () => {
            console.log("Evento actual al guardar:", eventoActual);
            console.log("Museos actuales al guardar:", museosActuales);

            if (!eventoActual || !Array.isArray(museosActuales) || museosActuales.length === 0) {
                return;
            }

            saveBtn.disabled = true;
            const originalText = saveBtn.textContent;
            saveBtn.textContent = "Guardando...";

            try {
                const usuario = await esperarUsuario();

                if (!usuario || !usuario.id) {
                    Swal.fire({
                        icon: "error",
                        title: "No se pudo identificar al usuario",
                        text: "Intenta volver a iniciar sesión."
                    });
                    return;
                }

                const nombreItinerario = generarNombreItinerario(eventoActual);
                console.log("Nombre del itinerario generado:", nombreItinerario);

                await saveEventAndMuseums(nombreItinerario, usuario.id, museosActuales);
            } finally {
                saveBtn.disabled = false;
                saveBtn.textContent = originalText || "Guardar evento";
            }
        });
    }

    cargarContenidoInicial();
});