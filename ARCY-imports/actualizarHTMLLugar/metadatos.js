import { obtenerCoordenadasPorPlaceId } from "../utilidadesMapa.js"

export const actualizarCoordenadas = (placeInfo) => {
  const place = document.getElementById("header-name")

  obtenerCoordenadasPorPlaceId(placeInfo.placeID).then((result) => {
    const { lat, lng } = result;
    place.dataset.latitud = lat;
    place.dataset.longitud = lng;
    place.dataset.idUbicacion = placeInfo.placeID;
  })
  .catch((e) => console.log(e));
}

export const actualizarNombreYUbicacion = (placeInfo) => {
  const places = document.getElementById("info-name");
  places.innerHTML = placeInfo.name
  places.dataset.idUbicacion = placeInfo.placeID;
  document.getElementById("info-name").innerHTML = placeInfo.name;
  document.getElementById("header-name").innerHTML = placeInfo.name;
}