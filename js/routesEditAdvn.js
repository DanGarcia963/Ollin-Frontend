import { dragNdrop } from "./dragNdrop.js";
import { editarAventura } from "./editarAventura.js";
//const server = "https://ollin-backend-production-d68e.up.railway.app"

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

export function PlaceIdToCoords(placeId) {
  // Crear una solicitud de geocodificación
  var request = {
    placeId: placeId,
  };

  return new Promise((resolve, reject) => {
    geocoder.geocode(request, function (results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        // Obtener las coordenadas del primer resultado
        var coordenadas = {
          lat: results[0].geometry.location.lat(),
          lng: results[0].geometry.location.lng(),
        };
        resolve(coordenadas);
      } else {
        console.error('Error al obtener coordenadas:', status);
      }
    });
  })
}

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

async function updateHTML(placeInfo, listId, idl, travelMode, distance, duration, estado) {
  console.log(placeInfo, listId, idl, travelMode, distance, duration, estado)
  //const list=document.getElementById("placesList");
    let placeItem = document.createElement("li");
    placeItem.id=listId;
    placeItem.className = "item";
    placeItem.dataset.ili=idl;
    placeItem.dataset.idUbicacion = placeInfo.placeID;
    if(estado==='V')
      placeItem.classList.add("visited")
    else if(estado==='O')
      placeItem.classList.add("visited")

    var content=``;

    content+=`<div class="route">
                <div class="distance-cont" id="distanceInfo">${distance}</div>
                <div class="dropdown">
                    <button class="btn-transport-selected">`;

    switch(travelMode){
          case 'DRIVING':
            content+=`<img src="./assets/icons/cocheIcon.png" class="transport-img" draggable="false">`;
              break;
          case 'WALKING':
            content+=`<img src="./assets/icons/caminandoIcon.png" class="transport-img" draggable="false">`;
            break;
          case 'BICYCLING':
            content+=`<img src="./assets/icons/bicicletaIcon.png" class="transport-img" draggable="false">`;
            break;
          case 'TRANSIT':
            content+=`<img src="./assets/icons/busIcon.png" class="transport-img" draggable="false">`;
            break;
          default: 
            content+=`<img src="./assets/icons/cocheIcon.png" class="transport-img" draggable="false">`;
            break;
    }
    
    content+=`<img src="./assets/icons/expandir2.png" class="arrow" draggable="false">
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
if(estado!== 'S')
  content+=`<div class="place-about" draggable="false">`;
else
  content+=`<div class="place-about" draggable="true">`;
content+=`<div class="img-referente" id="img-referente" style="align-items: center;">`;
                        
    //Para la foto  ////Revisar si es visitado o no (para agregar clase a item y palce about draggable false tambien)////
    if(placeInfo.photoUrls != null){  
        content+=`<img src="${placeInfo.photoUrls[0]}" width="64px" height="64px" style="margin:0px; border-radius: 10%;" draggable="false">`;
    }else{
        content+=`<img src="../assets/icons/sin_foto.png" width="64px" height="64px" style="margin:0px; border-radius: 10%;" draggable="false">`;
    }
    content+=`</div>

            <div class="place-info">
                <div class="info-add">
                    <div class="info-name" id="info-name">${placeInfo.name}</div>
                </div>
                <div class="info-calification">
                <!--Se debe agregar la funcionalidad para colorear las estrellas-->`;
    //Para obtener la calificacion
    if (placeInfo.rating === undefined || placeInfo.rating === null) {
        content+=`
            <div class="calification-puntaje" id="calification-puntaje">
                <span class="star" style="color:#000;">&#9733;</span>
                <span class="star" style="color:#000;">&#9733;</span>
                <span class="star" style="color:#000;">&#9733;</span>
                <span class="star" style="color:#000;">&#9733;</span>
                <span class="star" style="color:#000;">&#9733;</span>
            </div>
            <div class="calification-number" id="calification-number">0/5</div>
        </div>`;
      }else{
        //Colorear estrellas
        var score = placeInfo.rating;
        var roundedScore = Math.round(score);
        // Cambia el color de las estrellas hasta el puntaje redondeado
        content+=`<div class="calification-puntaje" id="calification-puntaje">`;
        for (var i = 0; i < 5; i++) {
            if (i < roundedScore) {
              content+=`<span class="star" style="color:#ffcc00 !important;">&#9733;</span>`; //amarillas
            } else {
              content+=`<span class="star" style="color:#000 !important;">&#9733;</span>`; //negro
            }
        }
        content+=`</div>
                <div class="calification-number" id="calification-number">${placeInfo.rating}/5</div>
                </div>`;
      }
    content+=`<div class="details-domicilio">
        <img src="assets/icons/ubicacionIcon.png" width="15px" height="15px" style="margin:0px;">
        <div class="domicilio-text" id="details-domicilio">${placeInfo.address}</div>
    </div>
    <div class="details-horario">
        <img src="assets/icons/reloj2.png" width="11px" height="11px" style="margin:0px 2px; ">`;

    //Para obtener si esta abierto o cerrado
    if(placeInfo.opening_hours == null){
        content+=`<div class="horario-status" id="horario-status" style="color: black;">Sin información</div>`;
      } else if(placeInfo.opening_hours.open_now == true){
        content+=`<div class="horario-status" id="horario-status" style="color: green;">Abierto</div>`;
      }else if(placeInfo.opening_hours.open_now == false){
        content+=`<div class="horario-status" id="horario-status" style="color: red;">Cerrado</div>`;
      } 
    
    //Para obtener la hora de apertura o cierre
if(placeInfo.opening_hours != null){
    const periods = placeInfo.opening_hours.periods;
    console.log(periods)
    const today = new Date();
    const day = today.getDay();
    let dayWeekday = "";
    let mañana = "";
  
    if (day === 0) {
      dayWeekday = 6;
    } else {
      dayWeekday = day - 1;
    }
  
    if(day === 6){
      mañana = 0;
    }else{
      mañana = day + 1;
    }
  
    let isOpen = {
      openingTime: "",
      closingTime: "",
      openingTimeMañana: "",
    };
    console.log(day)
    if(placeInfo.opening_hours.weekday_text[dayWeekday] == "lunes: Cerrado" || placeInfo.opening_hours.weekday_text[dayWeekday] == "martes: Cerrado" || placeInfo.opening_hours.weekday_text[dayWeekday] == "miércoles: Cerrado" || placeInfo.opening_hours.weekday_text[dayWeekday] == "jueves: Cerrado" || placeInfo.opening_hours.weekday_text[dayWeekday] == "viernes: Cerrado" || placeInfo.opening_hours.weekday_text[dayWeekday] == "sábado: Cerrado" || placeInfo.opening_hours.weekday_text[dayWeekday] == "domingo: Cerrado"){
      content+=`<div class="horario-day" id="horario-day" style="color:red;">Día de descanso</div>`;
    }
    else if(placeInfo.opening_hours.weekday_text[dayWeekday] == "lunes: Abierto 24 horas" || placeInfo.opening_hours.weekday_text[dayWeekday] == "martes: Abierto 24 horas" || placeInfo.opening_hours.weekday_text[dayWeekday] == "miércoles: Abierto 24 horas" || placeInfo.opening_hours.weekday_text[dayWeekday] == "jueves: Abierto 24 horas" || placeInfo.opening_hours.weekday_text[dayWeekday] == "viernes: Abierto 24 horas" || placeInfo.opening_hours.weekday_text[dayWeekday] == "sábado: Abierto 24 horas" || placeInfo.opening_hours.weekday_text[dayWeekday] == "domingo: Abierto 24 horas"){
        content+=`<div class="horario-day" id="horario-day" style="color:green;">Servicio ininterrumpido</div>`;
    }
    else if(placeInfo.opening_hours.periods[day] === null){
        content+=`<div class="horario-day" id="horario-day" style="color:black;">No disponible</div>`;
    }
    else{
      //Contar los numeros de digitos de los minutos
      ///CORREGIR
      const objectWithDay = periods.find(item => item.open.day === day);
      const digitos = objectWithDay.close.minutes.toString().length;
      const digitosAbierto = objectWithDay.open.minutes.toString().length;
      if(digitosAbierto == 2){
      isOpen.openingTime = objectWithDay.open.hours + ":" + objectWithDay.open.minutes;
      }else if(digitosAbierto == 1){
        isOpen.openingTime = objectWithDay.open.hours + ":" + objectWithDay.open.minutes +"0";
      }
  
      if(digitos == 2){
        isOpen.closingTime = objectWithDay.close.hours + ":" + objectWithDay.close.minutes;
      }else if(digitos == 1){
        isOpen.closingTime = objectWithDay.close.hours + ":" + objectWithDay.close.minutes + "0";
      }
  
      if (placeInfo.opening_hours.open_now === true) {
        content+=`<div class="horario-day" id="horario-day" style="color:green;">Cierra a las ${isOpen.closingTime} hrs</div>`;
      } else if (placeInfo.opening_hours.open_now === false) {
          if(placeInfo.opening_hours.weekday_text[day] == "lunes: Cerrado" || placeInfo.opening_hours.weekday_text[day] == "martes: Cerrado" || placeInfo.opening_hours.weekday_text[day] == "miércoles: Cerrado" || placeInfo.opening_hours.weekday_text[day] == "jueves: Cerrado" || placeInfo.opening_hours.weekday_text[day] == "viernes: Cerrado" || placeInfo.opening_hours.weekday_text[day] == "sábado: Cerrado" || placeInfo.opening_hours.weekday_text[day] == "domingo: Cerrado"){
            content+=`<div class="horario-day" id="horario-day" style="color:red;">Mañana sin servicio</div>`;
          }else if(placeInfo.opening_hours.periods[mañana] != null){
          const digitosAbiertomañana = periods[mañana].open.minutes.toString().length;
          if(digitosAbiertomañana == 2){
            isOpen.openingTimeMañana = periods[mañana].open.hours + ":" + periods[mañana].open.minutes;
          }else{
            isOpen.openingTimeMañana = periods[mañana].open.hours + ":" + periods[mañana].open.minutes +"0";
          }
          content+=`<div class="horario-day" id="horario-day" style="color:green;">Abre mañana, ${isOpen.openingTimeMañana} hrs</div>`;
          }
          else{
            content+=`<div class="horario-day" id="horario-day" style="color:red;">Hoy cerrado</div>`;
          }
      }
    }
  }else{
    content+=`<div class="horario-day" id="horario-day" style="color:black;">No  disponible</div>`;
  } 
  content+=`</div>
        </div>
            <div class="place-favorite">
                <button class="favorite-icon" style="align-items: center;" id="eliminarLugar">
                    <img src="assets/icons/eliminarIcon.png" id= "eliminar" width="32px" height="32px" style="margin:0px;" draggable="false">
                </button>
                <div class="favorite-icon" style="align-items: center;" id="dragCont">
                    <img src="assets/icons/dragIcon.png" id= "dragIcon" width="32px" height="32px" style="margin:0px;" draggable="false">
                </div>
            </div>
            </div>`;

    //insertando al html
    placeItem.innerHTML=content;
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
            placesPromises.push(getInfo(place['ID MUSEO']));
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
              previusplaceID = infoPlace.placeID;
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