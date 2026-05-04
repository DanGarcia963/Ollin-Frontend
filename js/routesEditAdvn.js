import { dragNdrop } from "./dragNdrop.js";
import { editarAventura } from "./editarAventura.js";
let mapa;
let geocoder;
const lugaresDefault = ["museum", "restaurant", "casino", "park", "night_club", "stadium", "zoo", "cafe", "point_of_interest"];
let userMarkers = [];
let placesPromises=[];
let previusplaceID = "1";

// Obteniendo el ID del itinerario
let miDato = document.cookie.split('; ').find(row => row.startsWith('miDato='));
miDato = miDato ? miDato.split('=')[1] : null;

console.log(miDato);

function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        ({ coords: { latitude, longitude } }) => {
          let coords ={ lat: latitude, lng: longitude };
          resolve(coords);
        },
        () => {
          //alert("Ocurrio un error al obtener la ubicación");
        }
      );
    } else {
      alert("Tu navegador no dispone de geolocalización, por favor, actualizalo");
    }
  });
}

async function getDistTime(places, distances, durations){
  const directionsService = new google.maps.DirectionsService();
  const userCoords = await getUserLocation();
  for (const place of places) {
  
    let distance;
    let duration;
    let travelMode = place['Metodo de transporte'];
  
    if (previusplaceID == "1") {
      const request = {
        origin: { location: userCoords },
        destination: { placeId: place['ID MUSEO'] },
        travelMode: travelMode, 
      };
      console.log(userCoords)
      console.log('destino: '+place['ID MUSEO']+' en '+travelMode)

      try{
        const response = await calcDistTime(directionsService,request)
        const leg = response.routes[0].legs[0];
        distance = leg.distance.text;
        duration = leg.duration.text;
        console.log(`Distancia entre el punto ${userCoords} y ${place['ID MUSEO']}: ${distance}`);
        console.log(`Duración entre el punto ${userCoords} y ${place['ID MUSEO']}: ${duration}`);
      }catch(error){
        window.alert(`No se pudo trazar la ruta entre el punto ${previusplaceID} y ${place['ID MUSEO']} debido a ${error}`);
      }
    } else {
      const request = {
        origin: { placeId: previusplaceID },
        destination: { placeId: place['ID MUSEO'] },
        travelMode: travelMode, // Puedes ajustar esto según tus necesidades
      };
      console.log('origen: '+previusplaceID+' destino: '+place['ID MUSEO']+ ' en '+travelMode)
      try{
        const response = await calcDistTime(directionsService,request)
        const leg = response.routes[0].legs[0];
        distance = leg.distance.text;
        duration = leg.duration.text;
        console.log(`Distancia entre el punto ${previusplaceID} y ${place['ID MUSEO']}: ${distance}`);
        console.log(`Duración entre el punto ${previusplaceID} y ${place['ID MUSEO']}: ${duration}`);
      }catch(error){
        window.alert(`No se pudo trazar la ruta entre el punto ${previusplaceID} y ${place['ID MUSEO']} debido a ${error}`);
      }
    }
  
    distances.push(distance);
    durations.push(duration);
    previusplaceID = place['ID MUSEO'];
  }
}

export{getDistTime};

export function calcDistTime(directionsService, request){
  return new Promise((resolve,reject) => {
    directionsService.route(request, (response, status) => {
      if (status === 'OK') {
        resolve(response);
      } else {
        reject(status);
      }
    });
  })
}

function parseHora(hora) {
  const num = Number(hora);
  if (Number.isNaN(num)) return null;
  return num * 60;
}

function formatearHora(hora) {
  const num = Number(hora);
  if (Number.isNaN(num)) return String(hora);
  return `${String(num).padStart(2, "0")}:00`;
}

function obtenerHorarioDelDia(informacionJSON) {
  const horariosByDay = informacionJSON?.HorariosByDay ?? {};

  const dias = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado"
  ];

  const diaActual = dias[new Date().getDay()];
  const horariosDelDia = horariosByDay[diaActual];
  console.log("Dia Actual:", diaActual);
  console.log("Horarios del día:", horariosDelDia);

  if (!Array.isArray(horariosDelDia) || horariosDelDia.length === 0) {
    return { texto: "Día de descanso", color: "red" };
  }

  const ahora = new Date();
  const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();

  for (const horario of horariosDelDia) {
    const apertura = parseHora(horario.HorarioIn);
    const cierre = parseHora(horario.HorarioOut);

    if (apertura === null || cierre === null) continue;

    if (apertura === 0 && cierre === 24 * 60) {
      return { texto: "Servicio ininterrumpido", color: "green" };
    }

    if (minutosAhora >= apertura && minutosAhora < cierre) {
      return {
        texto: `Cierra a las ${formatearHora(horario.HorarioOut)} hrs`,
        color: "green"
      };
    }
  }

  const siguienteApertura = horariosDelDia
    .map(h => Number(h.HorarioIn))
    .filter(h => !Number.isNaN(h))
    .sort((a, b) => a - b)[0];

  if (siguienteApertura !== undefined && minutosAhora < siguienteApertura * 60) {
    return {
      texto: `Abre hoy a las ${formatearHora(siguienteApertura)} hrs`,
      color: "green"
    };
  }

  return { texto: "Cerrado hoy", color: "red" };
}

async function updateHTML(placeInfo, listId, idl, travelMode, distance, duration, estado) {
  console.log(placeInfo, listId, idl, travelMode, distance, duration, estado);

  let placeItem = document.createElement("li");
  placeItem.id = listId;
  placeItem.className = "item";
  placeItem.dataset.ili = idl;
  placeItem.dataset.idUbicacion = placeInfo.id_Museo;

  if (estado === 'V') {
    placeItem.classList.add("visited");
  } else if (estado === 'O') {
    placeItem.classList.add("visited");
  }

  const informacionJSON =
    typeof placeInfo.Informacion_JSON === "string"
      ? JSON.parse(placeInfo.Informacion_JSON)
      : (placeInfo.Informacion_JSON || {});

  const horario = obtenerHorarioDelDia(informacionJSON);

  let content = ``;

  content += `<div class="route">
                <div class="distance-cont" id="distanceInfo">${distance}</div>
                <div class="dropdown">
                    <button class="btn-transport-selected">`;

  switch (travelMode) {
    case 'DRIVING':
      content += `<img src="./assets/icons/cocheIcon.png" class="transport-img" draggable="false">`;
      break;
    case 'WALKING':
      content += `<img src="./assets/icons/caminandoIcon.png" class="transport-img" draggable="false">`;
      break;
    case 'BICYCLING':
      content += `<img src="./assets/icons/bicicletaIcon.png" class="transport-img" draggable="false">`;
      break;
    case 'TRANSIT':
      content += `<img src="./assets/icons/busIcon.png" class="transport-img" draggable="false">`;
      break;
    default:
      content += `<img src="./assets/icons/cocheIcon.png" class="transport-img" draggable="false">`;
      break;
  }

  content += `<img src="./assets/icons/expandir2.png" class="arrow" draggable="false">
    </button>
    <div class="content-dropdown">
        <button class="btn-transport">
            <img src="./assets/icons/cocheIcon.png" class="transport-img" draggable="false">
        </button>
        <button class="btn-transport">
            <img src="./assets/icons/caminandoIcon.png" class="transport-img" draggable="false">
        </button>
        <button class="btn-transport">
            <img src="./assets/icons/bicicletaIcon.png" class="transport-img" draggable="false">
        </button>
        <button class="btn-transport">
            <img src="./assets/icons/busIcon.png" class="transport-img" draggable="false">
        </button>
    </div>
</div>
<div class="time-cont" id="timeInfo">Aprox. ${duration}</div>
</div>`;

  if (estado !== 'S') {
    content += `<div class="place-about" draggable="false">`;
  } else {
    content += `<div class="place-about" draggable="true">`;
  }

  content += `<div class="img-referente" id="img-referente" style="align-items: center;">`;

  if (Array.isArray(informacionJSON.Imagenes) && informacionJSON.Imagenes.length > 0) {
    content += `<img src="${informacionJSON.Imagenes[0]}" width="64px" height="64px" style="margin:0px; border-radius: 10%;" draggable="false">`;
  } else {
    content += `<img src="../assets/icons/sin_foto.png" width="64px" height="64px" style="margin:0px; border-radius: 10%;" draggable="false">`;
  }

  content += `</div>

            <div class="place-info">
                <div class="info-add">
                    <div class="info-name" id="info-name">${placeInfo.Nombre}</div>
                </div>
                <div class="info-calification">`;

  if (informacionJSON.Rating === undefined || informacionJSON.Rating === null) {
    content += `
            <div class="calification-puntaje" id="calification-puntaje">
                <span class="star" style="color:#000;">&#9733;</span>
                <span class="star" style="color:#000;">&#9733;</span>
                <span class="star" style="color:#000;">&#9733;</span>
                <span class="star" style="color:#000;">&#9733;</span>
                <span class="star" style="color:#000;">&#9733;</span>
            </div>
            <div class="calification-number" id="calification-number">0/5</div>
        </div>`;
  } else {
    const score = informacionJSON.Rating;
    const roundedScore = Math.round(score);

    content += `<div class="calification-puntaje" id="calification-puntaje">`;
    for (let i = 0; i < 5; i++) {
      if (i < roundedScore) {
        content += `<span class="star" style="color:#ffcc00 !important;">&#9733;</span>`;
      } else {
        content += `<span class="star" style="color:#000 !important;">&#9733;</span>`;
      }
    }
    content += `</div>
                <div class="calification-number" id="calification-number">${informacionJSON.Rating}/5</div>
                </div>`;
  }

  content += `<div class="details-domicilio">
        <img src="assets/icons/ubicacionIcon.png" width="15px" height="15px" style="margin:0px;">
        <div class="domicilio-text" id="details-domicilio">${informacionJSON.Direccion ?? "Sin dirección"}</div>
    </div>
    <div class="details-horario">
        <img src="assets/icons/reloj2.png" width="11px" height="11px" style="margin:0px 2px; ">
        <div class="horario-day" id="horario-day" style="color:${horario.color};">${horario.texto}</div>
    </div>
        </div>
            <div class="place-favorite">
                <button class="favorite-icon" style="align-items: center;" id="eliminarLugar">
                    <img src="assets/icons/eliminarIcon.png" id="eliminar" width="32px" height="32px" style="margin:0px;" draggable="false">
                </button>
                <div class="favorite-icon" style="align-items: center;" id="dragCont">
                    <img src="assets/icons/dragIcon.png" id="dragIcon" width="32px" height="32px" style="margin:0px;" draggable="false">
                </div>
            </div>
            </div>`;

  placeItem.innerHTML = content;
  document.getElementById("placesList").appendChild(placeItem);
}
  
// Función para obtener los lugares en la aventura del usuario
async function fetchAdventurePlaces(idPlan) {
  //console.log("fetchAdventurePlaces llamada con id_Itinerario:", idPlan);

  try {
      const response = await fetch(`${server}/api/lugarItinerario/obtenerLugaresItinerario`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({idPlan})
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
  } catch (error) {
      console.error('Error fetching adventure places:', error);
  }
}

// Función para obtener los datos del itinerario
async function fetchAdventureData(idPlan) {
  try {
      const response = await fetch(`${server}/api/itinerario/${idPlan}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
  } catch (error) {
      console.error('Error fetching adventure places:', error);
  }
}

export function toMinutes(timeStr) {
  const parts = timeStr.split(' ');
  let totalMins = 0;

  for (let i = 0; i < parts.length; i += 2) {
      if (parts[i + 1] === 'h') {
          totalMins += parseInt(parts[i]) * 60;
      } else if (parts[i + 1] === 'min') {
          totalMins += parseInt(parts[i]);
      }
  }

  return totalMins;
}

export function toHours(arrayDeTiempos) {
  const totalMinutos = arrayDeTiempos.reduce((total, tiempo) => {
    const minutos = toMinutes(tiempo);
    return total + minutos;
  }, 0);
  const horas = Math.floor(totalMinutos / 60);
  const minutosRestantes = totalMinutos % 60;
  const cadenaDeTiempo = `${horas} h ${minutosRestantes} min`;
  return cadenaDeTiempo;
}

export function updateDuracionTotal(array){
  document.getElementById("duracionTotal").innerHTML = toHours(array);
}

async function fetchPlaces(placeId) {
    try {
        const response = await fetch(`${server}/api/lugar/${placeId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching places:', error);
    }
}

function initMap() {
  setTimeout(async function(){
    const idPlan=miDato;
    const adventureData = await fetchAdventureData(idPlan);
    console.log(adventureData)
    //Cambiar botones si el estado del itinerario es F (finalizado)
    if(adventureData['Estado']==="F"){
      let buttonsDiv = document.querySelector('.btn-form');
      buttonsDiv.innerHTML='';
      buttonsDiv.style.justifyContent='center';
      buttonsDiv.innerHTML=`<a href="/aventuras_proximas" class="btn-cancel" id="btnCancel">
                              <b data-i18n="button_cancel">Volver</b> 
                            </a>`;
    }
    const adventurePlaces = await fetchAdventurePlaces(idPlan);
    console.log("Adventures info: ",adventurePlaces)
    /**************************************************************************************/
    let lugarestmp = [...adventurePlaces];
    lugarestmp.reverse();
    let distances = [];
    let durations = [];
    
    await getDistTime(lugarestmp, distances, durations);

    console.log(distances);
    console.log(durations);
    updateDuracionTotal(durations);
    /**************************************************************************************/
    if(adventurePlaces.length>0){
      document.getElementById('adventureName').innerHTML=adventurePlaces[0]['Plan']
      let lugares=adventurePlaces.reverse();
          //si la ubicacion del usuario es el origen
        getUserLocation()
        .then((ubicacion) => {
          geocoder = new google.maps.Geocoder();
          /*
          coordenadasActuales = ubicacion;
          */
          //const ids = ["ChIJ11_XBkz50YURyQoZon1W4T8", "ChIJqQyd1l7z0YURdmHvC97W8jM","ChIJwUqiTCf-0YURelo2pZAozTo"];
          let ids=[];
          lugares.forEach(place => {
            //console.log(place['ID MUSEO'])
            placesPromises.push(fetchPlaces(place['ID MUSEO']));
            // Orden original de los placeId en el itinerario
            ids.push(place['ID MUSEO'])
          });
          // Utilizar Promise.all para manejar las promesas
          Promise.all(placesPromises)
          .then(infoPlaces => {
            // array con los resultados de todas las promesas
            //console.log(ids);
            let posicionItinerario=lugares[0]['Posición en itinerario'];
            //despliega cada lugar en el html, asignando su posicion como id de item
            //y su id_lugar_itinerario como idl en dataset
            let idl,travelMode,estado;
            infoPlaces.forEach(async (infoPlace,i)=>{
              idl=lugares[i]['ID'];
              travelMode=lugares[i]['Metodo de transporte'];
              estado=lugares[i]['Estado Museo']
              updateHTML(infoPlace,posicionItinerario,idl,travelMode,distances[i],durations[i],estado);
              previusplaceID = infoPlace.id_Museo;
              posicionItinerario++;
            });
            const dragNDropInstance = dragNdrop(lugares[0]['Posición en itinerario'],ids,ubicacion,durations);
            let updatedDurations=[]
            dragNDropInstance.onDragEnd((msg) =>{
              console.log("Desde routes: ", msg);
              
            });
            editarAventura(lugares,ubicacion,durations);
          })
          .catch(error => {
            // Manejar cualquier error que ocurra durante el proceso
            console.error(error);
          });
        })
        .catch((error) => {
          alert(error);  // Muestra el mensaje de error si la promesa es rechazada
        });

        //Si el origen es cualquier otro lugar
        //Recibe el arreglo o json
        /*
        let places={};
        places.forEach((place)=>{
          searchPlace(place.id);
        })
      */
    }else{
      document.querySelector('.general-info').remove();
      document.querySelector('.btn-form').remove();
      document.getElementById('adventureName').remove();
      document.getElementById('placesList').remove();
      let bigCont = document.querySelector('.kanban');
      let contMessage = document.createElement("div");
      contMessage.className="message";
      bigCont.appendChild(contMessage);
      contMessage.innerHTML = `
      <div class="no-favorites-message">
        <p>Aún no hay lugares en esta aventura.</p>
        <button onclick="location.href='/inicio'">Ir a agregar</button>
      </div>
    `;
    }
    
  },10)
}

window.initAutocomplete = initMap;