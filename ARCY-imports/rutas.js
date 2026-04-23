export const rutaInmediata = (directionsService, directionsRenderer, coordenadasActuales, mapa) => {
  const placeHTML = document.getElementById("header-name")

  const coordenadasDestino = {
    lat: parseFloat(placeHTML.dataset.latitud),
    lng: parseFloat(placeHTML.dataset.longitud)
  }

  directionsService
  .route({
    origin: coordenadasActuales,
    destination: coordenadasDestino,
    travelMode: google.maps.TravelMode["DRIVING"]
  })
  .then((response) => {
    
    directionsRenderer.setMap(mapa);
    directionsRenderer.setDirections(response);
  }).catch((e) => window.alert("Directions request failed due to " + e));
} 

import { showLoading, hideLoading } from "../ARCY-imports/loading.js"

const obtenerFlechaManejo = (maneuver = "") => {
  const m = maneuver.toLowerCase();

  if (m.includes("turn-left")) return "↰";
  if (m.includes("turn-right")) return "↱";
  if (m.includes("uturn-left")) return "⟲";
  if (m.includes("uturn-right")) return "⟳";
  if (m.includes("merge")) return "⇢";
  if (m.includes("roundabout")) return "⟲";
  if (m.includes("straight")) return "↑";
  if (m.includes("ramp-left")) return "↰";
  if (m.includes("ramp-right")) return "↱";

  return "➜";
};

const renderIndicaciones = (steps) => {
  const panel = document.getElementById("panelIndicaciones");

  panel.innerHTML = steps.map((step, index) => {
    const arrow = obtenerFlechaManejo(step.maneuver);

    return `
      <div class="step-card">
        <div class="step-number">${index + 1}</div>
        <div class="step-arrow">${arrow}</div>
        <div class="step-body">
          <div class="step-instruction">${step.instructions}</div>
          <div class="step-meta">
            <span>${step.distance?.text || ""}</span>
            <span>•</span>
            <span>${step.duration?.text || ""}</span>
          </div>
        </div>
      </div>
    `;
  }).join("");
};

export const rutaIti = async (
  directionsService,
  directionsRenderer,
  coordenadasActuales,
  mapa,
  travelMode
) => {
  showLoading("Calculando ruta...");

  try {
    const placeHTML = document.getElementById("nombreLugar");

    const coordenadasDestino = {
      lat: parseFloat(placeHTML.dataset.latitud),
      lng: parseFloat(placeHTML.dataset.longitud)
    };

    const response = await directionsService.route({
      origin: coordenadasActuales,
      destination: coordenadasDestino,
      travelMode: google.maps.TravelMode[travelMode]
    });

    directionsRenderer.setMap(mapa);
    directionsRenderer.setDirections(response);

    // Ya no usamos el panel nativo de Google
    directionsRenderer.setPanel(null);

    const leg = response.routes[0].legs[0];
    const steps = leg.steps;

    // Resumen arriba del panel
    const resumenRuta = document.getElementById("resumenRuta");
    if (resumenRuta) {
      resumenRuta.textContent = `${leg.distance.text} · ${leg.duration.text} · ${travelMode}`;
    }

    // Pintar indicaciones personalizadas
    renderIndicaciones(steps);

    // Abrir el panel automáticamente
    const drawer = document.getElementById("indicacionesDrawer");
    if (drawer) drawer.classList.add("is-open");

    

  } catch (e) {
    window.alert("Directions request failed due to " + e);
  } finally {
    hideLoading();
  }
};