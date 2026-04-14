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
    autocompletarCampoDeBusqueda(ubicacion, mapa);
    mostrarLugares(ubicacion, mapa, null);
    coordenadasActuales = ubicacion;
    filtrosTemporal(mapa);

    const parametros = new URLSearchParams(window.location.search).get("placeId");

    if(parametros){
      hayUnFavorito(parametros, mapa)
    }

  }).catch((error) => console.log(error));
}

const autocompletarCampoDeBusqueda = (coordenadas, mapa) => {
  const input = document.getElementById("SearchBox");

  // Establece el radio de búsqueda en la caja de texto
  const bounds = new google.maps.Circle({
    center: coordenadas,
    radius: 20000 //Radio de 10km al rededor del usuario
  });

  // Le pasa de donde tomará el texto y que parámetros de búsqueda utilizar
  const searchBox = new google.maps.places.SearchBox(input, {
    bounds: bounds
  });

  // Funciona al desplazar el mapa manualmente
  mapa.addListener("bounds_changed", () => {
    searchBox.setBounds(mapa.getBounds());
  });


  let markers = [];
  let inputClicked = false
  // Se activá al dar entenr el campo de búsqueda
  searchBox.addListener("places_changed", async () => {
    // Ocultando modal…
    const modal = document.getElementById("cModalSearchBox");
    modal.style.opacity = '0';
    modal.style.visibility = 'hidden';
    $('#containerResultsPlaces').hide();  // jQuery
  
    inputClicked = false;            // asegúrate de que inputClicked esté declarado arriba
    markers = limpiarMarcadoresMapa(markers);  // y markers también
  
    // Toma el primer lugar seleccionado
    const selectedPlaces = searchBox.getPlaces();
    if (!selectedPlaces || !selectedPlaces.length) return;
    const placeResult = lugaresEncontradosEnBusqueda(selectedPlaces, markers, mapa);
    if (!placeResult || !placeResult.place_id) {
      console.warn("No se obtuvo place_id de la búsqueda");
      return;
    }
  
    try {
      // 1) Detalles del lugar
      const info = await getInfo(placeResult.place_id);
  
      // 2) Geocodifica para centrar y buscar alrededores
      const coords = await obtenerCoordenadasPorPlaceId(placeResult.place_id);
  
      // 3) Muestra marcadores cercanos y actualiza UI
      await mostrarLugares(coords, mapa, placeResult.name);
      updateHTML(info);
    } catch (e) {
      console.error("Error al obtener info por place_id:", e);
    }
  });

    /* Insertando el dropdown de resultados en el div results */
  setTimeout(function(){ 
      $(".pac-container").prependTo("#results");
  }, 300)

  var inputSearchBox = document.getElementById("SearchBox");
  var btnClear = document.getElementById("btnClear");

  inputSearchBox.addEventListener("click", () => inputClicked = true)
  inputSearchBox.addEventListener("input", () => $('#containerResultsPlaces').css("display","block")) // Muestra el div de resultados

  btnClear.addEventListener("click", () => { 
    inputSearchBox.value = '';

    if(!inputClicked){
      markers = limpiarMarcadoresMapa(markers)
      searchMarkers = limpiarMarcadoresMapa(searchMarkers)
      mapa.setCenter(coordenadas);
      mapa.setZoom(15);
    }

    inputClicked = false; 
    $('#containerResultsPlaces').css("display","none"); 
    $('#containerSponsored').css("display","none"); 
  })

  document.getElementById("btnClose").addEventListener("click", () => $('#containerResultsPlaces').css("display","none") ) // Esconde el div de resultados
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

/* Funciones agregadas temporalmente para los filtros */
function filtrosTemporal(mapa){
  var aplicar = document.getElementById("filterSend");
  var borrar = document.getElementById("filterErase");
  var filtros = document.getElementById("filterBtn");
  var filtersEx = document.getElementById('filters-expanded');
  var cardExInfo = document.getElementById('card-expandida');
  const card = document.querySelector('.card');

  filtros.addEventListener("click", function () {
    if (filtersEx.style.maxHeight === '0px') {
      filtersEx.style.display = 'flex';
      cardExInfo.style.display = 'none;'
      filtersEx.style.maxHeight = filtersEx.scrollHeight + 'px';
      card.style.display = 'none';
      card.style.overflow = 'hidden';
    } 
    else {
      filtersEx.style.maxHeight = '0';
      setTimeout(function () {filtersEx.style.display = 'none'}, 490);
    }
  });
  aplicar.addEventListener("click", function(){
    filtersEx.style.maxHeight = '0';
    filtersEx.style.display = 'none';
    var checkboxes = document.querySelectorAll('input[type="checkbox"]');
    var lugaresFiltros = [];
    checkboxes.forEach(function(checkbox){
      if(checkbox.checked){
        var lugaresTmp = checkbox.value.split(',');
        lugaresTmp.forEach(function(tipo){
          lugaresFiltros.push(tipo);
        });
      }
    });
    lugaresFiltros = lugaresFiltros.map(function(cadena){
      return cadena.trim();
    });
    filtrarLugares(lugaresFiltros, mapa);
  });
  borrar.addEventListener("click", function() {
    filtersEx.style.maxHeight = '0';
    filtersEx.style.display = 'none';
    borrarLugares(mapa);
    var checkboxes = document.querySelectorAll('input[type="checkbox"]');
      // Iterar sobre los checkboxes y deseleccionarlos
      checkboxes.forEach(function(checkbox) {
          checkbox.checked = false;
      });
  });
}
function filtrarLugares(types, mapa){
  //Se le debe pasar un arreglo con los tipos de lugares que serán filtrados.
  //Los tipos de lugares deben ser de los tipos que maneja la API de Places.
  searchMarkers.forEach((marker) => {
    marker.setMap(null);
  });
  searchMarkers = [];
  lugares = types;
  mapa.setCenter(coordenadasActuales);
  mapa.setZoom(15);
  mostrarLugares(coordenadasActuales, mapa, null);
}

function borrarLugares(mapa){
  searchMarkers.forEach((marker) => {
    marker.setMap(null);
  });
  searchMarkers = [];
  lugares = [];
  mapa.setCenter(coordenadasActuales);
  mapa.setZoom(15);
  mostrarLugares(coordenadasActuales, mapa, null);
}
/******************************************************/

const cosasPorArreglar = () => {
  geocoder = new google.maps.Geocoder();
  var aplicar = document.getElementById("filterSend");
  var borrar = document.getElementById("filterErase");
  var filtros = document.getElementById("filterBtn");
  var filtersEx = document.getElementById('filters-expanded');
  var cardExInfo = document.getElementById('card-expandida');
  const card = document.querySelector('.card');

  
  filtros.addEventListener("click", function () {
    console.log("Hello");
    if (filtersEx.style.maxHeight === '0px') {
      filtersEx.style.display = 'flex';
      cardExInfo.style.display = 'none;'
      filtersEx.style.maxHeight = filtersEx.scrollHeight + 'px';
      card.style.display = 'none';
      card.style.overflow = 'hidden';
    } 
    else {
      filtersEx.style.maxHeight = '0';
      setTimeout(function () {filtersEx.style.display = 'none'}, 490);
    }
  });
  aplicar.addEventListener("click", function(){
    filtersEx.style.maxHeight = '0';
    filtersEx.style.display = 'none';
    var checkboxes = document.querySelectorAll('input[type="checkbox"]');
    var lugaresFiltros = [];
    checkboxes.forEach(function(checkbox){
      if(checkbox.checked){
        var lugaresTmp = checkbox.value.split(',');
        lugaresTmp.forEach(function(tipo){
          lugaresFiltros.push(tipo);
        });
      }
    });
    lugaresFiltros = lugaresFiltros.map(function(cadena){
      return cadena.trim();
    });
    filtrarLugares(lugaresFiltros);
  });
  borrar.addEventListener("click", function() {
    filtersEx.style.maxHeight = '0';
    filtersEx.style.display = 'none';
    borrarLugares();
    var checkboxes = document.querySelectorAll('input[type="checkbox"]');
      // Iterar sobre los checkboxes y deseleccionarlos
      checkboxes.forEach(function(checkbox) {
          checkbox.checked = false;
      });
  });
}

document.addEventListener('DOMContentLoaded', function () {
  initMap()
  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer();
  document.getElementById('flecha').addEventListener('click', () => rutaInmediata(directionsService, directionsRenderer, coordenadasActuales, mapa))
})
