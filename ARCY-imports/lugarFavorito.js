import { mostrarLugares } from "../ARCY-PRUEBAS/places2.js";
import { getInfo, obtenerCoordenadasPorPlaceId, obtenerUnLugarConId, updateHTML } from "./utilidadesMapa.js";
const server = "https://ollin-backend-production.up.railway.app"

export const comprobarSiLugarEsFavorito = async (placeId) => {
  try {
      const res = await fetch(`${server}/api/lugarFavorito/obtenerLugarFavoritoIdlugar`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({
              id_Lugar: placeId,
              id_Turista: nombreUsuario.dataset.idTurista
          })
      });

      const esFavorito = await res.json();


      if(!esFavorito.message){
        cambiarEstadoFavorito();
      }
  } catch (error) {
      console.error("Error en updateFavoriteButtonStatus:", error);
  }
}

export const cambiarEstadoFavorito = () => {
  const favoritoButton = document.getElementById('favorito');
  const favorito1Button = document.getElementById('favorito1');

  const newSrc ='assets/icons/favoritosBlanco.png'

  if (favoritoButton) favoritoButton.src = newSrc;
  if (favorito1Button) favorito1Button.src = newSrc;
}

export const handleFavoriteClick = async (e) => {
  e.preventDefault();

  const infoName = document.getElementById("info-name");
  const nombreUsuario = document.getElementById("nombreUsuario");


  const res = await fetch(`${server}/api/lugarFavorito/crearLugarFavorito`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      id_Lugar: infoName.dataset.idUbicacion,
      Nombre: infoName.textContent,
      id_Turista: nombreUsuario.dataset.idTurista
    })
  });
  
  const data = await res.json();

  cambiarIconoFavoritos(data)
};

export const cambiarIconoFavoritos = (peticion) => {
  const favoritoPrincipal = document.getElementById('favorito');
  const favoritoDesplegado = document.getElementById('favorito1');

  const srcNoFavorito = "assets/icons/favoritosIcon.png"
  const srcFavorito = "assets/icons/favoritosBlanco.png"

  if(peticion == "Lugar favorito creado con éxito"){
    favoritoPrincipal.src = srcFavorito;
    favoritoDesplegado.src = srcFavorito;
  }else{
    favoritoPrincipal.src = srcNoFavorito;
    favoritoDesplegado.src = srcNoFavorito;
  }
}

export const hayUnFavorito = (placeId, mapa) => {
  obtenerUnLugarConId(placeId).then((informacionlugar) => {
    obtenerCoordenadasPorPlaceId(placeId)
    .then(coordenadas => {
        mapa.setCenter(coordenadas);
        mapa.setZoom(15);

        const marker = new google.maps.Marker({
            position: coordenadas,
            map: mapa
        });

        getInfo(informacionlugar, mapa)
        .then(async (info) => {
          
          updateHTML(info)
          mostrarLugares(coordenadas, mapa, info.name);
          marker.setTitle(info.name);
        })
    })
    .catch(error => console.error('Error al obtener coordenadas por PlaceId:', error));
  })
}

document.getElementById('favorito').addEventListener('click', handleFavoriteClick);
document.getElementById('favorito1').addEventListener('click', handleFavoriteClick);