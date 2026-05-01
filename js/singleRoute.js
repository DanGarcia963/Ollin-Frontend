import { getUserLocation } from "../ARCY-imports/getUserLocation.js"
import { rutaIti } from "../ARCY-imports/rutas.js"

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

const mostrarValores = async () => {
    const placeID = new URLSearchParams(window.location.search).get('placeId');
    const placeInfo =  await fetchPlaces(placeID);
    const userLocation = await getUserLocation();
    

    const NombreLugarOrigen = document.getElementById('nombreLugarOrigen');
    const NombreLugar = document.getElementById('nombreLugar');
    NombreLugarOrigen.textContent =" Tu ubicación actual ";
    NombreLugar.textContent = placeInfo.Nombre;
    NombreLugar.dataset.latitud = placeInfo.Latitud;
    NombreLugar.dataset.longitud = placeInfo.Longitud;
    const coordinates = {
        lat: placeInfo.Latitud,
        lng: placeInfo.Longitud
    };

    // Calcular y mostrar la ruta
    rutaIti(directionsService, directionsRenderer, userLocation, mapa, 'DRIVING');
    // Calcular y mostrar la duración
    const duration = await getTime(userLocation, coordinates, 'DRIVING');
    const lengthElement = document.getElementById('length');
    lengthElement.textContent = duration;
    await showDone(placeID, placeInfo.Nombre, document.getElementById("nombreUsuario").dataset.idTurista);
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
          
          resolve(duration);
        } else {
          console.error('Error', status);
        }
      });
    });
  } 

  function addVisit(idMuseo, NomLugar, idTurista) {
      
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
        
    })
    .catch(error => {
        console.error('Error al agregar lugar a visitados:', error);
    });
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

document.addEventListener('DOMContentLoaded', async function () {
    
    initMap();

    const { DirectionsService, DirectionsRenderer } = await google.maps.importLibrary("routes");
      directionsService = new DirectionsService();
    directionsRenderer = new DirectionsRenderer();
    directionsRenderer.setMap(mapa);

      const drawer = document.getElementById("indicacionesDrawer");
  const toggle = document.getElementById("toggleIndicaciones");
  const closeBtn = document.getElementById("closeIndicaciones");

  if (toggle && drawer) {
    toggle.addEventListener("click", () => {
      drawer.classList.toggle("is-open");
      toggle.innerHTML = drawer.classList.contains("is-open") ? "<span>◀</span>" : "<span>▶</span>";
    });
  }

  if (closeBtn && drawer && toggle) {
    closeBtn.addEventListener("click", () => {
      drawer.classList.remove("is-open");
      toggle.innerHTML = "<span>◀</span>";
    });
  }
    mostrarValores();
});