import { getUserLocation } from "../ARCY-imports/getUserLocation.js"

export const imprimirMapa = async (htmlMapa, mapa) => {
  let coordenadas = ""
    await getUserLocation()
  .then((ubicacion) => {
    var opcionesMapa = {
      zoom: 15, // Nivel de zoom
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

    console.log(ubicacion)
    mapa = new google.maps.Map(htmlMapa, opcionesMapa);
    coordenadas = ubicacion;
  })
  .catch((error) => {
    alert(error);  // Muestra el mensaje de error si la promesa es rechazada
  });

  console.log("coordenadas ", coordenadas)
  return {coordenadas, mapa}
}