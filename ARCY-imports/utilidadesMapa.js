import { mostrarLugares } from "../ARCY-PRUEBAS/places2.js";
import { actualizarCalificacion } from "./actualizarHTMLLugar/calificacion.js";
import { actualizarDireccion } from "./actualizarHTMLLugar/direccion.js";
import { actualizarEstado } from "./actualizarHTMLLugar/estado.js";
import { actualizarFotos } from "./actualizarHTMLLugar/fotos.js";
import { actualizarHorario, cerrarHorario } from "./actualizarHTMLLugar/horario.js";
import { actualizarHorarioApertura } from "./actualizarHTMLLugar/horarioApertura.js";
import { insertarIconos } from "./actualizarHTMLLugar/insertarIconos.js";
import { actualizarCoordenadas, actualizarNombreYUbicacion } from "./actualizarHTMLLugar/metadatos.js";
import { actualizarResena } from "./actualizarHTMLLugar/reseñas.js";
import { actualizarSitioWeb } from "./actualizarHTMLLugar/sitioWeb.js";
import { actualizarTelefono } from "./actualizarHTMLLugar/telefono.js";
import { actualizarTipoLugar } from "./actualizarHTMLLugar/tipoLugar.js";
import { comprobarSiLugarEsFavorito } from "./lugarFavorito.js";
import { comprobarSiLugarEstaVisitado } from "./lugarVisitado.js";

export const crearMarcadorEnMapa = (coordenadas) => {
  let marcador = new google.maps.Marker({
    position: coordenadas,
    title: 'Ubicación del turista',
    icon: {
      url: "./assets/icons/locUserMarker.png",
      scaledSize: new google.maps.Size(32,32)
    }
  });

  return marcador;
}

export const crearMarcadorPuntosCercanos = (lugar, mapa) => {
  // Crear un marcador en el mapa
  const marcador = new google.maps.Marker({
    map: mapa,
    position: lugar.geometry.location,
    title: lugar.name,
    icon: {
      url: lugar.icon || null,
      scaledSize: new google.maps.Size(20, 20),
    }
  });

  marcador.addListener('click',async () => {
    // Obtener información detallada del lugar y mostrar en la consola
    
    try{
      const info=await getInfo(lugar.place_id);
      updateHTML(info);
      mostrarLugares(lugar.geometry.location,mapa,info.name);
      marcador.setTitle(info.name);
        }catch(e){}
      console.log('Error al obtener detalles del lugar: ', e);
  });

  return marcador;
}

export const limpiarMarcadoresMapa = (marcadores) => {
  marcadores.forEach((marker) => {
    marker.setMap(null);
  });

  return []
}

export const lugaresEncontradosEnBusqueda = (lugares, marcadores, mapa) => {
  const bounds = new google.maps.LatLngBounds();
  let primerLugar;

  lugares.forEach((lugar) => {
    if (!lugar.geometry || !lugar.geometry.location) {
      console.log("Returned lugar contains no geometry");
      return;
    }

    const marcador = new google.maps.Marker({
      map: mapa,
      position: lugar.geometry.location,
      title: lugar.name,
      icon: {
        url: null,
        size: new google.maps.Size(71, 71),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(17, 34),
        scaledSize: new google.maps.Size(25, 25),
      }
    });
    marcadores.push(marcador);
    
    if (lugar.geometry.viewport) {
      // Only geocodes have viewport.
      bounds.union(lugar.geometry.viewport);
      primerLugar = lugar;
    } else {
      bounds.extend(lugar.geometry.location);
    }
  });

  mapa.fitBounds(bounds);
  return primerLugar
}

export const obtenerCoordenadasPorPlaceId = (placeId) => {
  const geocoder = new google.maps.Geocoder();
  // Crear una solicitud de geocodificación
  return new Promise((resolve, reject) => {
    geocoder.geocode({placeId}, (results, status)=> {
      if (status === 'OK' && results[0]) {
        resolve({
          lat: results[0].geometry.location.lat(),
          lng: results[0].geometry.location.lng()
        });
      } else {
        console.error('Error al obtener coordenadas:', status);
      }
    });
  })
}

export const obtenerUnLugarConId = (placeId) => {
  const geocoder = new google.maps.Geocoder();
  return new Promise((resolve, reject) => {
    geocoder.geocode({ placeId }, (results, status) => {
      if (status === 'OK' && results[0]) resolve(results[0]);
      else reject(status);
    });
  });
};

export async function getInfo(placeId) {
  // 1) Importar la clase Place
  const { Place } = await google.maps.importLibrary('places');

  // 2) Instanciar y solicitar campos modernos
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
      'geometry'
    ]
  });

  // 3) Procesar URLs de fotos
  const imgWidth = 1000, imgHeight = 1000;
  const photoUrls = place.photos
    ? place.photos.map(photo => photo.getURI({ maxHeight: imgHeight, maxWidth: imgWidth }))
    : null;

  // 4) Devolver objeto uniforme
  return {
    name: place.displayName,
    type: place.types,
    placeID: place.id,
    address: place.formattedAddress,
    rating: place.rating,
    opening_hours: place.regularOpeningHours?.weekdayText || null,
    phone_number: place.internationalPhoneNumber || place.nationalPhoneNumber || null,
    website: null, // no disponible en esta API JS
    reviews: place.reviews?.length ? place.reviews : null,
    photoUrls,
    geometry: place.geometry
  };
}

export const updateHTML = (placeInfo) => {
  actualizarCoordenadas(placeInfo)
  actualizarNombreYUbicacion(placeInfo)

  insertarIconos()
  
  actualizarFotos(placeInfo)
  actualizarResena(placeInfo)
  actualizarCalificacion(placeInfo)
  actualizarDireccion(placeInfo)
  actualizarTelefono(placeInfo)  
  actualizarSitioWeb(placeInfo)
  actualizarEstado(placeInfo)
  actualizarHorario(placeInfo)
  actualizarTipoLugar(placeInfo)
  actualizarHorarioApertura(placeInfo)
  
  cerrarHorario()

  comprobarSiLugarEsFavorito(placeInfo.placeID)
  comprobarSiLugarEstaVisitado(placeInfo.placeID)
}
