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
    console.log(directionsRenderer)
    directionsRenderer.setMap(mapa);
    directionsRenderer.setDirections(response);
  }).catch((e) => window.alert("Directions request failed due to " + e));
} 


export const rutaIti = (directionsService, directionsRenderer, coordenadasActuales, mapa, travelMode) => {
  const placeHTML = document.getElementById("nombreLugar");

  const coordenadasDestino = {
    lat: parseFloat(placeHTML.dataset.latitud),
    lng: parseFloat(placeHTML.dataset.longitud)
  };

  directionsService
    .route({
      origin: coordenadasActuales,
      destination: coordenadasDestino,
      travelMode: google.maps.TravelMode[travelMode]
    })
    .then((response) => {
      console.log(directionsRenderer);
      directionsRenderer.setMap(mapa);
      directionsRenderer.setDirections(response);
    }).catch((e) => window.alert("Directions request failed due to " + e));
};
