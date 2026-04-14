import { getUserLocation } from "../ARCY-imports/getUserLocation.js"
import { rutaIti } from "../ARCY-imports/rutas.js"
//const server = "https://ollin-backend-production.up.railway.app"

let mapa;
let directionsService
let directionsRenderer


async function initMap() {
        const userLocation = await getUserLocation();
    const { Map } = await google.maps.importLibrary("maps");
    mapa = new Map(document.getElementById("map"),{
        center:userLocation,
        zoom: 16,
        styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }],
        },
      ],
    });
}

const mostrarValores = async () => {
    const placeID = new URLSearchParams(window.location.search).get('placeId');
    const placeInfo =  await getInfo(placeID);
    const userLocation = await getUserLocation();
    console.log("Place Info:", placeInfo);

    const NombreLugarOrigen = document.getElementById('nombreLugarOrigen');
    const NombreLugar = document.getElementById('nombreLugar');
    NombreLugarOrigen.textContent =" Tu ubicación actual ";
    NombreLugar.textContent = placeInfo.name;
    NombreLugar.dataset.latitud = placeInfo.coordinates.lat;
    NombreLugar.dataset.longitud = placeInfo.coordinates.lng;
    console.log("Coordenadas del lugar:", placeInfo.coordinates);
    console.log("Coordenadas del usuario:", userLocation);

    // Calcular y mostrar la ruta
    rutaIti(directionsService, directionsRenderer, userLocation, mapa, 'DRIVING');
    // Calcular y mostrar la duración
    const duration = await getTime(userLocation, placeInfo.coordinates, 'DRIVING');
    const lengthElement = document.getElementById('length');
    lengthElement.textContent = duration;
    await showDone(placeID, placeInfo.name, document.getElementById("nombreUsuario").dataset.idTurista);
};


function getTime(originCoords, destCords, mode){
    let directionsService = new google.maps.DirectionsService();
    const request = {
      origin: originCoords,
      destination: destCords,
      travelMode: mode
    }
  
    return new Promise((resolve, reject) => {
      directionsService.route(request, function (response, status) {
        if (status === "OK") {
          const duration = response.routes[0].legs[0].duration.text;
          console.log("La duracion de" + "["+ originCoords.lat + ", " + originCoords.lng + "]" + " a ["+ destCords.lat + ", " + destCords.lng + "]" + " es " + duration);
          resolve(duration);
        } else {
          console.error('Error', status);
        }
      });
    });
  } 

  function addVisit(idMuseo, NomLugar, idTurista) {
      console.log(idMuseo, NomLugar, idTurista)
    fetch(`${server}/api/lugarVisitado/crearLugarVisitado`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            id_Museo: idMuseo,
            Nombre: NomLugar,
            id_Turista: idTurista
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Lugar agregado a visitados:', data);
    })
    .catch(error => {
        console.error('Error al agregar lugar a visitados:', error);
    });
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

async function showDone(placeId, nombreLugar, idTurista) {
      let Omitir=document.getElementById("btnOmitir");
    let Llegar=document.getElementById("btnLlegar");
    Omitir.addEventListener('click',function onOmitir(){
        window.location.href="/museums";

    });
  Llegar.addEventListener('click', function onLlegar() {
    Swal.fire({
      title: '¡Has llegado a tu destino!',
      text: '¿Deseas marcar este lugar como visitado?',
      icon: 'success',
      showCancelButton: true,
      confirmButtonText: 'Marcar como visitado',
      cancelButtonText: 'No, cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        addVisit(placeId, nombreLugar, idTurista);
        Swal.fire(
          {
            title: '¡Lugar marcado como visitado!',
            text: '¡Disfruta tu visita!',
            icon: 'success',
            showCancelButton: false,
            confirmButtonText: 'Cerrar'
          }).then(() => {
            window.location.href = "/museums";
          });
      }
    });
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

document.addEventListener('DOMContentLoaded', async function () {
      await esperarUsuario(); // Esperar a que la variable global usuarioLogueado esté disponible
    console.log("DOMContentLoaded, inicializando pantalla de ruta única...");
    initMap();

    const { DirectionsService, DirectionsRenderer } = await google.maps.importLibrary("routes");
      directionsService = new DirectionsService();
    directionsRenderer = new DirectionsRenderer();
    directionsRenderer.setMap(mapa);
    mostrarValores();
});