import { getUserLocation } from "../ARCY-imports/getUserLocation.js"
import { hayUnFavorito } from "../ARCY-imports/lugarFavorito.js";
import { rutaInmediata } from "../ARCY-imports/rutas.js";
import { crearMarcadorEnMapa, crearMarcadorPuntosCercanos, getInfo, limpiarMarcadoresMapa, lugaresEncontradosEnBusqueda, obtenerCoordenadasPorPlaceId, obtenerUnLugarConId, updateHTML } from "../ARCY-imports/utilidadesMapa.js"

let mapa;
let coordenadasActuales;
let searchMarkers = [];
let lugares = [];
let userMarkers = [];
let directionsService
let directionsRenderer

const initMap = async () => {
  const htmlMapa = document.getElementById('map')

  await getUserLocation().then((ubicacion) => {
    var opcionesMapa = {
      zoom: 16, // Nivel de zoom
      center: ubicacion, // Centro del mapa
      disableDefaultUI: true,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }],
        },
      ],
    };

    mapa = new google.maps.Map(htmlMapa, opcionesMapa);
    let marcador = crearMarcadorEnMapa(ubicacion)
    marcador.setMap(mapa)
    
    mostrarLugares(ubicacion, mapa, null);
    coordenadasActuales = ubicacion;
    

    const parametros = new URLSearchParams(window.location.search).get("placeId");

    if(parametros){
      hayUnFavorito(parametros, mapa)
    }

  }).catch((error) => console.log(error));
}



export const mostrarLugares = async (ubicacion, mapa, name) => {
  // Importamos dinámicamente las librerías necesarias
  const { Place } = await google.maps.importLibrary("places");

  // Limpiamos marcadores anteriores
  searchMarkers = limpiarMarcadoresMapa(searchMarkers);

  // Para cada tipo de lugar en tu array `lugares`:
  for (const tipo of lugares) {
    // Hacemos la búsqueda Promise-based
    const results = await Place.searchNearby({
      location: ubicacion,
      radius:   2000,
      type:     tipo,
      fields:   ["place_id", "displayName", "geometry", "icon"]
    });

    // Y creamos marcadores
    results.forEach(place => {
      const marker = crearMarcadorPuntosCercanos(
        {
          geometry: { location: place.geometry.location },
          name:     place.displayName,
          icon:     place.icon,
          place_id: place.id
        },
        mapa
      );
      searchMarkers.push(marker);
    });
  }
};

async function buscarLugares(request, mapa) {
  // 1) Importamos la clase Place
  const { Place } = await google.maps.importLibrary("places");

  // 2) Usamos searchNearby y pedimos explícitamente qué campos queremos
  const results = await Place.searchNearby({
    location:   request.location,
    radius:     request.radius,
    type:       request.type,
    fields:     ["place_id", "displayName", "geometry", "icon"]
  });

  // 3) Creamos marcadores a partir del array devuelto
  results.forEach(place => {
    const marker = crearMarcadorPuntosCercanos(
      {
        geometry: { location: place.geometry.location },
        name:     place.displayName,
        icon:     place.icon,
        place_id: place.id
      },
      mapa
    );
    searchMarkers.push(marker);
  });
}

document.addEventListener('DOMContentLoaded', function () {
  initMap()
  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer();
  document.getElementById('flecha').addEventListener('click', () => rutaInmediata(directionsService, directionsRenderer, coordenadasActuales, mapa))
})
