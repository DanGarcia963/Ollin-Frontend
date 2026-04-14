//const server = "https://ollin-backend-production.up.railway.app"

const API_URL = `${server}/api/lugarItinerario/obtenerLugaresItinerario`;
let placesService; 

let miDato = document.cookie.split('; ').find(row => row.startsWith('miDato='));
miDato = miDato ? miDato.split('=')[1] : null;

console.log(miDato);

/* ============================================
   OBTENER TRANSPORTES SELECCIONADOS
============================================ */

function getSelectedTransportModes() {
  const checkboxes = document.querySelectorAll(
    '.transport-options input[type="checkbox"]:checked'
  );
  return Array.from(checkboxes).map(cb => cb.value);
}

/* ============================================
   UBICACIÓN USUARIO
============================================ */

const getUserLocation = () => {
  return new Promise((resolve, reject) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        ({ coords: { latitude, longitude } }) => {
          resolve({ lat: latitude, lng: longitude });
        },
        () => reject("No se pudo obtener la ubicación del usuario")
      );
    } else {
      reject("Geolocalización no soportada");
    }
  });
};

/* ============================================
   FETCH LUGARES
============================================ */

async function fetchItineraryPlaces(idPlan) {
  try {
    const response = await fetch(API_URL, {
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

/* ============================================
   DIRECTIONS API
============================================ */

function getTime(originCoords, destCoords, mode) {
  let directionsService = new google.maps.DirectionsService();

  const request = {
    origin: originCoords,
    destination: destCoords,
    travelMode: mode
  };

  return new Promise((resolve, reject) => {
    directionsService.route(request, function (response, status) {
      if (status === "OK") {
        const duration = response.routes[0].legs[0].duration.text;
        resolve(duration);
      } else {
        reject(status);
      }
    });
  });
}

function parseDurationToMinutes(text) {
  let total = 0;
  const hourMatch = text.match(/(\d+)\s*h/);
  const minMatch  = text.match(/(\d+)\s*min/);

  if (hourMatch) total += parseInt(hourMatch[1], 10) * 60;
  if (minMatch)  total += parseInt(minMatch[1], 10);

  return total;
}

/* ============================================
   MEJOR MÉTODO SEGÚN SELECCIÓN
============================================ */

async function getBestTransport(originCoords, destCoords, placeId, id_Plan_Museo, modes) {

  const durations = [];

  for (let mode of modes) {
    try {
      const durationText = await getTime(originCoords, destCoords, mode);
      const durationInMin = parseDurationToMinutes(durationText);

      durations.push({
        id_Plan_Museo,
        placeId,
        mode,
        duration: durationInMin
      });

    } catch (e) {
      console.warn("Modo no disponible:", mode, e);
    }
  }

  if (durations.length === 0) return null;

  durations.sort((a, b) => a.duration - b.duration);
  return durations[0];
}

/* ============================================
   INFO PLACE
============================================ */

async function getInfo(placeId) {

  const { Place } = await google.maps.importLibrary('places');

  const place = new Place({ id: placeId, requestedLanguage: 'es' });

  await place.fetchFields({
    fields: ['displayName', 'location']
  });

  const lat = place.location.lat();
  const lng = place.location.lng();

  return {
    name: place.displayName,
    placeId,
    coordinates: { lat, lng }
  };
}

/* ============================================
   CALCULAR MEJOR MUSEO
============================================ */

async function calcularMetodosYSeleccionarMejor(lugares, originCoords, selectedModes) {

  const MuseumMetodo = [];

  for (let lugar of lugares) {

    const IDPlanMuseo = lugar['ID'];
    const placeId = lugar['ID MUSEO'];

    const lugarInfo = await getInfo(placeId);
    const destinoCoords = lugarInfo.coordinates;

    const mejorMetodo = await getBestTransport(
      originCoords,
      destinoCoords,
      placeId,
      IDPlanMuseo,
      selectedModes
    );

    if (mejorMetodo) {
      MuseumMetodo.push(mejorMetodo);
    }
  }

  if (MuseumMetodo.length === 0) return null;

  MuseumMetodo.sort((a, b) => a.duration - b.duration);
  return MuseumMetodo[0];
}

/* ============================================
   ORDENAR ITINERARIO
============================================ */

const OrdenarValores = async (selectedModes) => {

  let betterMuseums = [];
  const lugares = await fetchItineraryPlaces(miDato);
  const coordenadasActualesOrigen = await getUserLocation();

  let i = 0;

  while (lugares.length > 0) {

    let originCoords;

    if (i === 0) {
      originCoords = coordenadasActualesOrigen;
    } else {
      const previousPlaceId = betterMuseums[i - 1].placeId;
      const lugarInfo = await getInfo(previousPlaceId);
      originCoords = lugarInfo.coordinates;
    }

    const mejorOpcion = await calcularMetodosYSeleccionarMejor(
      lugares,
      originCoords,
      selectedModes
    );

    if (!mejorOpcion) break;

    betterMuseums.push({
      id_Plan_Museo: mejorOpcion.id_Plan_Museo,
      MetodoTransporte: mejorOpcion.mode,
      Posicion: i,
      placeId: mejorOpcion.placeId
    });

    const indexToRemove = lugares.findIndex(
      m => m['ID MUSEO'] === mejorOpcion.placeId
    );

    if (indexToRemove !== -1) {
      lugares.splice(indexToRemove, 1);
    }

    i++;
  }

  return betterMuseums;
};

/* ============================================
   EDITAR ITINERARIO
============================================ */

async function fetchEditIti(museo) {
  try {
    const response = await fetch(
      `${server}/api/lugarItinerario/editarLugarItinerario`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(museo)
      }
    );

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();

  } catch (error) {
    console.error('Error updating itinerary:', error);
  }
}

/* ============================================
   BOTÓN ORGANIZAR
============================================ */

const organizar = document.getElementById('btnOrg');

organizar.addEventListener('click', async function () {

  /* ===============================
     1️⃣ MODAL SELECCIÓN TRANSPORTE
  =============================== */

  const { value: selectedModes } = await Swal.fire({
    title: 'Selecciona métodos de transporte para organizar tu plan de visita ',
    html: `
      <div style="text-align:left">

        <label>
          <input type="checkbox" id="allModes">
          🌍 Todos los métodos de transporte
        </label>
        <hr>

        <label><input type="checkbox" class="mode" value="DRIVING" > 🚗 Auto</label><br>
        <label><input type="checkbox" class="mode" value="WALKING" > 🚶 Caminando</label><br>
        <label><input type="checkbox" class="mode" value="BICYCLING" > 🚴 Bicicleta</label><br>
        <label><input type="checkbox" class="mode" value="TRANSIT" > 🚌 Transporte público</label>

      </div>
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: 'Continuar',
    cancelButtonText: 'Cancelar',

    didOpen: () => {
      const allCheckbox = Swal.getPopup().querySelector('#allModes');
      const modeCheckboxes = Swal.getPopup().querySelectorAll('.mode');

      // Si marca/desmarca "Todos"
      allCheckbox.addEventListener('change', () => {
        modeCheckboxes.forEach(cb => cb.checked = allCheckbox.checked);
      });

      // Si cambia alguno individual
      modeCheckboxes.forEach(cb => {
        cb.addEventListener('change', () => {
          const allChecked = Array.from(modeCheckboxes).every(c => c.checked);
          allCheckbox.checked = allChecked;
        });
      });
    },

    preConfirm: () => {
      const allChecked = Swal.getPopup().querySelector('#allModes').checked;

      const values = Array.from(
        Swal.getPopup().querySelectorAll('.mode:checked')
      ).map(cb => cb.value);

      if (!allChecked && values.length === 0) {
        Swal.showValidationMessage('Selecciona al menos un método de transporte');
        return false;
      }

      if (allChecked) {
        return ['DRIVING', 'WALKING', 'BICYCLING', 'TRANSIT'];
      }

      return values;
    }
  });

  if (!selectedModes) return; // Canceló

  /* ===============================
     2️⃣ CONFIRMACIÓN FINAL
  =============================== */

  const confirmacion = await Swal.fire({
    title: "¿Estás seguro?",
    text: "Esta acción editará el orden de los Museos en el Plan",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#65B2C6",
    cancelButtonColor: "#D63D6C",
    confirmButtonText: "Estoy seguro",
    cancelButtonText: "Regresar"
  });

  if (!confirmacion.isConfirmed) return;

  /* ===============================
     3️⃣ OVERLAY DE CARGA
  =============================== */

  let overlay = document.getElementById('loadingOverlay');

  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'loadingOverlay';
    overlay.innerHTML = `
      <div class="spinner"></div>
      <p>Optimizando itinerario…</p>
    `;
    document.body.appendChild(overlay);
  }

  overlay.classList.add('active');

  /* ===============================
     4️⃣ OPTIMIZACIÓN
  =============================== */

  try {

    const betterMuseums = await OrdenarValores(selectedModes);

    for (let museo of betterMuseums) {
      await fetchEditIti(museo);
    }

    location.reload();

  } catch (error) {
    console.error("Error al optimizar:", error);
    overlay.classList.remove('active');

    Swal.fire("Error", "Ocurrió un problema al optimizar el itinerario", "error");
  }
});