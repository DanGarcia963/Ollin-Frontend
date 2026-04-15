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
      directionsRenderer.setMap(mapa);
      directionsRenderer.setDirections(response);
      directionsRenderer.setPanel(document.getElementById("panelIndicaciones"));

      const steps = response.routes[0].legs[0].steps;

      const instrucciones = steps.map((step, index) => ({
        paso: index + 1,
        instruccion: step.instructions,
        distancia: step.distance.text,
        duracion: step.duration.text
      }));

      console.log("Indicaciones:", instrucciones);
    })
    .catch((e) => window.alert("Directions request failed due to " + e));
};