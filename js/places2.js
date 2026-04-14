import { getUserLocation } from "../ARCY-imports/getUserLocation.js"
import { imprimirMapa } from "../ARCY-imports/imiprimirMapa.js"
const server = "https://ollin-backend-production.up.railway.app"

let mapa;
let geocoder;
let coordenadasActuales;
let searchMarkers = [];
let lugares = [];
const lugaresDefault = ["museum", "restaurant", "casino", "park", "night_club", "stadium", "zoo", "cafe", "point_of_interest"];
let userMarkers = [];
// let placeDetails;

const initMap = async () => {
    const htmlMapa = document.getElementById('map');
    mapa = htmlMapa
    let {coordenadas: ubicacion, mapa: mapita} = await imprimirMapa(htmlMapa, mapa)
    mapa = mapita
    console.log("places 2: ", ubicacion)

    geocoder = new google.maps.Geocoder();
    var aplicar = document.getElementById("filterSend");
    var borrar = document.getElementById("filterErase");
    var filtros = document.getElementById("filterBtn");
    var filtersEx = document.getElementById('filters-expanded');
    var cardExInfo = document.getElementById('card-expandida');
    const card = document.querySelector('.card');

    coordenadasActuales = ubicacion;
    createUserMarker(ubicacion);
    initAutocomplete(ubicacion);
    mostrarLugares(ubicacion, null);
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

function obtenerCoordenadasPorPlaceId(placeId) {
  // Crear una solicitud de geocodificación
  var request = {
    placeId: placeId,
  };

  return new Promise((resolve, reject) => {
    geocoder.geocode(request, function (results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        // Obtener las coordenadas del primer resultado
        var coordenadas = {
          lat: results[0].geometry.location.lat(),
          lng: results[0].geometry.location.lng(),
        };
        resolve(coordenadas);
      } else {
        console.error('Error al obtener coordenadas:', status);
      }
    });
  })
}

function createUserMarker(coords){
  let locUserMarker = new google.maps.Marker({
    position: coords,
    title: 'Ubicación del turista',
    icon: {
      url: "./assets/icons/locUserMarker.png",
      scaledSize: new google.maps.Size(32,32)
    }
  });
  locUserMarker.setMap(mapa);
}

function initAutocomplete(coords){
  const infowindow = new google.maps.InfoWindow();

  const input = document.getElementById("SearchBox");

  var bounds = new google.maps.Circle({
    center: coords,
    radius: 20000 //Radio de 10km al rededor del usuario
  });

  const searchBox = new google.maps.places.SearchBox(input, {
    bounds: bounds
  });

  mapa.addListener("bounds_changed", () => {
    searchBox.setBounds(mapa.getBounds());
  });

  let markers = [];

  //Bandera para borrar o no busqueda
  //Si se presiona el btnClear en la Barra de busqueda sin haber dado clic en la SearchBox, los resultados desplegados en el mapa (busqy eda) se borrarán, junto con el texto en la SearchBox. Por el contrario, si se presiona el btnClear habiendo dado clic o escrito en la SearchBox, solo se borrará el texto de la SearchBox
  var inputClicked=false; 

  searchBox.addListener("places_changed", () => {
    /* Ocultando modal con la SearchBox */
    var modal = document.getElementById("cModalSearchBox");
    modal.style.opacity = '0';
    modal.style.visibility = 'hidden';
      /** */
    /*var btnClose=document.getElementById("btnClose");
    btnClose.addEventListener("click",function(){*/
      //Oculta el div de results
    $('#containerResultsPlaces').css("display","none");
    //})
    inputClicked=false; //desactiva bandera cuando de hace busqueda

    const places = searchBox.getPlaces();
  
    // Clear out the old markers.
    markers.forEach((marker) => {
      marker.setMap(null);
    });
    markers = [];

    const bounds = new google.maps.LatLngBounds();
    
    var Place;
    places.forEach((place) => {
      if (!place.geometry || !place.geometry.location) {
        console.log("Returned place contains no geometry");
        return;
      }
  
      const icon = {
        url: null, //Para poner el marcador con forma alusiva al tipo de lugar
        size: new google.maps.Size(71, 71),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(17, 34),
        scaledSize: new google.maps.Size(25, 25),
      };
      // Create a marker for each place.
      markers.push(
        new google.maps.Marker({
          map: mapa,
          icon,
          title: place.name,
          position: place.geometry.location,
        }),
      );
      
      if (place.geometry.viewport) {
        // Only geocodes have viewport.
        bounds.union(place.geometry.viewport);
        Place = place;
      } else {
        bounds.extend(place.geometry.location);
      }
    });
    mapa.fitBounds(bounds);
    getInfo(Place)
    .then(async (result) => {
      let coordenadas = await obtenerCoordenadasPorPlaceId(Place.place_id);
      mostrarLugares(coordenadas, Place.name);
      //Crear una función para manejar los datos de la API
      imprimeDatos(result);
    })
    .catch((error) => {
      console.error(error);
      // Manejar el error aquí
    });
  });

    /* Insertando el dropdown de resultados en el div results */
    setTimeout(function(){ 
        $(".pac-container").prependTo("#results");
    }, 300)

    //Borrar el texto escrito en la Barra de Busqueda o Borrar la busqueda
    var inputSB=document.getElementById("SearchBox");
    var btnClear=document.getElementById("btnClear");
    inputSB.addEventListener("click",function(){
        inputClicked=true;
    })
    btnClear.addEventListener("click",function(){
        inputSB.value='';
        if(!inputClicked){  
            //Borrar busqueda
            // Clear out the old markers.
            markers.forEach((marker) => {
            marker.setMap(null);
            });
            markers = [];

            searchMarkers.forEach((marker) => {
              marker.setMap(null);
            });
            searchMarkers = [];
            mapa.setCenter(coords);
            mapa.setZoom(15);
            mostrarLugares(coords, null);
            //console.log("busqueda borrada");
            /*REVISAR SI ES NECESARIO REGRESAR A COORDENADAS DE UBICACION*/
        }
        inputClicked=false;
        //Oculta el div de results
        $('#containerResultsPlaces').css("display","none"); 
        //Oculta el div de patrocinados
        $('#containerSponsored').css("display","none"); 
    })
    inputSB.addEventListener("input",function(){
        //Muestra el div de results
        $('#containerResultsPlaces').css("display","block");
    })
    var btnClose=document.getElementById("btnClose");
    btnClose.addEventListener("click",function(){
      //Oculta el div de results
      $('#containerResultsPlaces').css("display","none");
    })
}

let geocoder2;

function getInfo(place) {
  return new Promise((resolve, reject) => {
    const request = {
      placeId: place.place_id,
      fields: ["place_id", "name", "formatted_address", "rating", "opening_hours", "formatted_phone_number", "website", "reviews", "photos", "type", "geometry"],
    };

    const service = new google.maps.places.PlacesService(mapa);
    service.getDetails(request, async (place, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        const imgWidth = 1000;
        const imgHeight = 1000;

        const placeInfo = {
          name: place.name,
          type: place.types,
          placeID: place.place_id,
          address: place.formatted_address,
          rating: place.rating,
          opening_hours: place.opening_hours,
          phone_number: place.formatted_phone_number,
          website: place.website,
          geometry: place.geometry
        };

        

        if (place.reviews) {
          placeInfo.reviews = place.reviews.length > 0 ? place.reviews : null;
        } else {
          placeInfo.reviews = null;
        }

        if (place.photos && place.photos.length > 0) {
          const photoUrls = place.photos.map((photo) => {
            return photo.getUrl({ maxWidth: imgWidth, maxHeight: imgHeight });
          });
          placeInfo.photoUrls = photoUrls;
        } else {
          placeInfo.photoUrls = null;
        }

        updateHTML(placeInfo);


        try {
          await updateFavoriteButtonStatus(place.place_id);
        } catch (error) {
          console.error('Error al actualizar el estado del botón de favoritos:', error);
        }

        resolve(JSON.stringify(placeInfo, null, 2));
      } else {
        reject("Error al obtener detalles del lugar");
      }
    });
  });
}



function mostrarLugares(ubicacion, name) {
  // Crear una solicitud de lugares cercanos
  var request = {
    location: ubicacion,
    radius: 2000, // Radio en metros para buscar lugares cercanos
    type: null, // Tipo de lugar (puedes cambiarlo a 'restaurant', 'museum', etc.)
  };

  if(lugares.length == 0)
    lugares = lugaresDefault;

  // Inicializar el servicio de Places
  var placesService = new google.maps.places.PlacesService(mapa);

  searchMarkers.forEach((marker) => {
    marker.setMap(null);
  });
  searchMarkers = [];

  for(var lugar of lugares){
    request.type = lugar;
    buscarLugares(placesService, request, name);
  }
}

function buscarLugares(placesService, request, name){
  placesService.nearbySearch(request, function(results, status) {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      for (var i = 0; i < results.length; i++) {
        if(name != null && results[i].name != name)
          crearMarcador(results[i]);
        else if(name == null)
          crearMarcador(results[i]);
      }
    } else {
      console.error('Error al obtener lugares:', status);
    }
  });
}

function crearMarcador(place) {
  // Crear un marcador en el mapa
  var marcador = new google.maps.Marker({
    map: mapa,
    position: place.geometry.location,
    title: place.name,
    icon: {
      url: place.icon || null,
      scaledSize: new google.maps.Size(20, 20),
    }
  });

  searchMarkers.push(marcador);

  google.maps.event.addListener(marcador, 'click',function() {
    // Obtener información detallada del lugar y mostrar en la consola
    getInfo(place)
      .then((info) => {
        //Crear una función para manejar los datos
        imprimeDatos(info);
      })
      .catch((error) => {
        console.error(error);
      });
  });
}

function imprimeDatos(info){
 // console.log(info);
}

function filtrarLugares(types){
  //Se le debe pasar un arreglo con los tipos de lugares que serán filtrados.
  //Los tipos de lugares deben ser de los tipos que maneja la API de Places.
  searchMarkers.forEach((marker) => {
    marker.setMap(null);
  });
  searchMarkers = [];
  lugares = types;
  mapa.setCenter(coordenadasActuales);
  mapa.setZoom(15);
  mostrarLugares(coordenadasActuales, null);
}

function borrarLugares(){
  searchMarkers.forEach((marker) => {
    marker.setMap(null);
  });
  searchMarkers = [];
  lugares = [];
  mapa.setCenter(coordenadasActuales);
  mapa.setZoom(15);
  mostrarLugares(coordenadasActuales, null);
}

function aplicarFiltros(){
  var checkboxes = document.querySelectorAll('input[type="checkbox"]');
  var lugaresFiltros = [];
  checkboxes.forEach(function(checkbox){
    if(checkbox.checked)
      lugaresFiltros = checkbox.value.split(',');
  });
  lugaresFiltros = lugaresFiltros.map(function(cadena){
    lugaresFiltros.trim();
  });
  
  filtrarLugares(lugaresFiltros);
}

function updateHTML(placeInfo) {
  const place = document.getElementById("header-name")

  // Arcy modificó esto para obtener latitud y longitud
  geocoder2 = new google.maps.Geocoder();
  geocoder2
  .geocode({ address: placeInfo.address })
  .then((result) => {
    const { results } = result;
    place.dataset.latitud = results[0].geometry.location.lat();
    place.dataset.longitud = results[0].geometry.location.lng();
    place.dataset.idUbicacion = placeInfo.placeID;
  })
  .catch((e) => {
    alert("Geocode was not successful for the following reason: " + e);
  });

  document.getElementById("card").style.display = "flex";
  document.getElementById('favorito').src = 'assets/icons/favoritosIcon.png';
  document.getElementById('favorito1').src = 'assets/icons/favoritosIcon.png';
  document.getElementById('flecha').src = 'assets/icons/flechaBackAzul.png';
  document.getElementById('itinerario').src = 'assets/icons/agregarItinIconV2.png';
  document.getElementById('check').src = 'assets/icons/checked.png';
  document.querySelector('.visitado').style.display = 'none';
  document.querySelector('.img-referente1').style.alignSelf = 'auto';

  //Cerrar los horarios
  document.getElementById("ToogleHorario").src = "assets/icons/expandir.png";
  let isToogle = true;
  document.querySelector('.horario-text').style.display = 'flex';
  document.querySelector('.weekend-text').style.display = 'none';

  document.getElementById("info-name").innerHTML = placeInfo.name;
  document.getElementById("header-name").innerHTML = placeInfo.name;

  const placea = document.getElementById("info-name");
  placea.innerHTML = placeInfo.name
  placea.dataset.idUbicacion = placeInfo.placeID;

  

  //Para las fotos
  if(placeInfo.photoUrls != null){
    document.getElementById("noPhotos").innerText = ""
    document.getElementById("img-referente").innerHTML = "<img src=' " + placeInfo.photoUrls[0] + " ' width='64px' height='64px' style='margin:0px 4px; border-radius: 10%;'>";
    document.getElementById("img-referente1").innerHTML = "<img src=' " + placeInfo.photoUrls[0] + " ' width='72px' height='72px' style='margin:0px 4px; border-radius: 10%;'>";
    document.getElementById("photo-big").innerHTML = "<img src=' " + placeInfo.photoUrls[0] + " ' width='128px' height='128px' style='padding:2px 2px 2px 2px; border-radius:5%;'>";
    document.getElementById("photo-big").style.display = "flex";
    if(placeInfo.photoUrls[1] != null){
      document.getElementById("photo2").innerHTML = "<img src=' " + placeInfo.photoUrls[1] + " ' width='62px' height='62px' style='padding:0px 1px 3px 1px; border-radius:5%;'>";
      document.getElementById("photo2").style.display = "flex";
      if(placeInfo.photoUrls[2] != null){
        document.getElementById("photo3").innerHTML = "<img src=' " + placeInfo.photoUrls[2] + " ' width='62px' height='62px' style='padding:3px 1px 0px 1px; border-radius:5%;'>";
        document.getElementById("photo3").style.display = "flex";
        if(placeInfo.photoUrls[3] != null){
          document.getElementById("photo4").innerHTML = "<img src=' " + placeInfo.photoUrls[3] + " ' width='62px' height='62px' style='padding:0px 1px 3px 1px; border-radius:5%;'>";
          document.getElementById("photo4").style.display = "flex";
          if(placeInfo.photoUrls[4] != null){
            document.getElementById("photo5").innerHTML = "<img src=' " + placeInfo.photoUrls[4] + " ' width='62px' height='62px' style='padding:3px 1px 0px 1px; border-radius:5%;'>";
            document.getElementById("photo5").style.display = "flex";
            if(placeInfo.photoUrls[5] != null){
              document.getElementById("photo6").innerHTML = "<img src=' " + placeInfo.photoUrls[5] + " ' width='62px' height='62px' style='padding:0px 1px 3px 1px; border-radius:5%;'>";
              document.getElementById("photo6").style.display = "flex";
              if(placeInfo.photoUrls[6] != null){
                document.getElementById("photo7").innerHTML = "<img src=' " + placeInfo.photoUrls[6] + " ' width='62px' height='62px' style='padding:3px 1px 0px 1px; border-radius:5%;'>";
                document.getElementById("photo7").style.display = "flex";
                if(placeInfo.photoUrls[7] != null){
                  document.getElementById("photo8").innerHTML = "<img src=' " + placeInfo.photoUrls[7] + " ' width='62px' height='62px' style='padding:0px 1px 3px 1px; border-radius:5%;'>";
                  document.getElementById("photo8").style.display = "flex";
                  if(placeInfo.photoUrls[8] != null){
                    document.getElementById("photo9").innerHTML = "<img src=' " + placeInfo.photoUrls[8] + " ' width='62px' height='62px' style='padding:3px 1px 0px 1px; border-radius:5%;'>";
                    document.getElementById("photo9").style.display = "flex";
                    if(placeInfo.photoUrls[9] != null){
                      document.getElementById("photo10").innerHTML = "<img src=' " + placeInfo.photoUrls[9] + " ' width='62px' height='62px' style='padding:0px 1px 3px 1px; border-radius:5%;'>";
                      document.getElementById("photo10").style.display = "flex";
                      if(placeInfo.photoUrls[10] != null){
                        document.getElementById("photo11").innerHTML = "<img src=' " + placeInfo.photoUrls[10] + " ' width='62px' height='62px' style='padding:3px 1px 0px 1px; border-radius:5%;'>";
                        document.getElementById("photo11").style.display = "flex";
                      }
                        else{
                          document.getElementById("photo11").innerHTML = "<img src='#' width='62px' height='62px' style='padding:0px 1px 3px 1px; border-radius:5%;'>";
                          document.getElementById("photo11").style.display = "none";
                        }
                      }
                      else{
                        document.getElementById("photo10").innerHTML = "<img src='#' width='62px' height='62px' style='padding:0px 1px 3px 1px; border-radius:5%;'>";
                        document.getElementById("photo10").style.display = "none";
                        document.getElementById("photo11").style.display = "none";
                      }
                    }
                    else{
                      document.getElementById("photo9").innerHTML = "<img src='#' width='62px' height='62px' style='padding:0px 1px 3px 1px; border-radius:5%;'>";
                      document.getElementById("photo9").style.display = "none";
                      document.getElementById("photo10").style.display = "none";
                      document.getElementById("photo11").style.display = "none";
                    }
                  }
                  else{
                    document.getElementById("photo8").innerHTML = "<img src='#' width='62px' height='62px' style='padding:0px 1px 3px 1px; border-radius:5%;'>";
                    document.getElementById("photo8").style.display = "none";
                    document.getElementById("photo9").style.display = "none";
                    document.getElementById("photo10").style.display = "none";
                    document.getElementById("photo11").style.display = "none";
                  }
                }
                else{
                  document.getElementById("photo7").innerHTML = "<img src='#' width='62px' height='62px' style='padding:0px 1px 3px 1px; border-radius:5%;'>";
                  document.getElementById("photo7").style.display = "none";
                  document.getElementById("photo8").style.display = "none";
                  document.getElementById("photo9").style.display = "none";
                  document.getElementById("photo10").style.display = "none";
                  document.getElementById("photo11").style.display = "none";
                }
              }
              else{
                document.getElementById("photo6").innerHTML = "<img src='#' width='62px' height='62px' style='padding:0px 1px 3px 1px; border-radius:5%;'>";
                document.getElementById("photo6").style.display = "none";
                document.getElementById("photo7").style.display = "none";
                document.getElementById("photo8").style.display = "none";
                document.getElementById("photo9").style.display = "none";
                document.getElementById("photo10").style.display = "none";
                document.getElementById("photo11").style.display = "none";
              }
            }
            else{
              document.getElementById("photo5").innerHTML = "<img src='#' width='62px' height='62px' style='padding:0px 1px 3px 1px; border-radius:5%;'>";
              document.getElementById("photo5").style.display = "none";
              document.getElementById("photo6").style.display = "none";
              document.getElementById("photo7").style.display = "none";
              document.getElementById("photo8").style.display = "none";
              document.getElementById("photo9").style.display = "none";
              document.getElementById("photo10").style.display = "none";
              document.getElementById("photo11").style.display = "none";
            }
          }
          else{
            document.getElementById("photo4").innerHTML = "<img src='#' width='62px' height='62px' style='padding:0px 1px 3px 1px; border-radius:5%;'>";
            document.getElementById("photo4").style.display = "none";
            document.getElementById("photo5").style.display = "none";
            document.getElementById("photo6").style.display = "none";
            document.getElementById("photo7").style.display = "none";
            document.getElementById("photo8").style.display = "none";
            document.getElementById("photo9").style.display = "none";
            document.getElementById("photo10").style.display = "none";
            document.getElementById("photo11").style.display = "none";
          }
        }
      else{
        document.getElementById("photo3").innerHTML = "<img src='#' width='62px' height='62px' style='padding:0px 1px 3px 1px; border-radius:5%;'>";
        document.getElementById("photo3").style.display = "none";
        document.getElementById("photo4").style.display = "none";
        document.getElementById("photo5").style.display = "none";
        document.getElementById("photo6").style.display = "none";
        document.getElementById("photo7").style.display = "none";
        document.getElementById("photo8").style.display = "none";
        document.getElementById("photo9").style.display = "none";
        document.getElementById("photo10").style.display = "none";
        document.getElementById("photo11").style.display = "none";
      }
    }
    else{
      document.getElementById("photo2").innerHTML = "<img src='#' width='62px' height='62px' style='padding:0px 1px 3px 1px; border-radius:5%;'>";
      document.getElementById("photo2").style.display = "none";
      document.getElementById("photo3").style.display = "none";
      document.getElementById("photo4").style.display = "none";
      document.getElementById("photo5").style.display = "none";
      document.getElementById("photo6").style.display = "none";
      document.getElementById("photo7").style.display = "none";
      document.getElementById("photo8").style.display = "none";
      document.getElementById("photo9").style.display = "none";
      document.getElementById("photo10").style.display = "none";
      document.getElementById("photo11").style.display = "none";
    }
  }
  else{
    document.getElementById("img-referente").innerHTML = "<img src='assets/icons/sin_foto.png' width='64px' height='64px' style='margin:0px 4px; border-radius: 10%;'>";
    document.getElementById("img-referente1").innerHTML = "<img src='assets/icons/sin_foto.png' width='72px' height='72px' style='margin:0px 4px; border-radius: 10%;'>";
    document.getElementById("photo-big").innerHTML = "<img src='#' width='128px' height='128px' style='padding:2px 2px 2px 2px; border-radius:5%;'>";
    document.getElementById("photo-big").style.display = "none";
    document.getElementById("photo2").style.display = "none";
    document.getElementById("photo3").style.display = "none";
    document.getElementById("photo4").style.display = "none";
    document.getElementById("photo5").style.display = "none";
    document.getElementById("photo6").style.display = "none";
    document.getElementById("photo7").style.display = "none";
    document.getElementById("photo8").style.display = "none";
    document.getElementById("photo9").style.display = "none";
    document.getElementById("photo10").style.display = "none";
    document.getElementById("photo11").style.display = "none";
    document.getElementById("noPhotos").innerText = "No hay fotos disponibles."
  }
    //Para obtener las reseñas
    if(placeInfo.reviews != null){
    document.getElementById("noReviews").innerText = ""
    document.getElementById("comentario-user").innerHTML = "<img src=' " + placeInfo.reviews[0].profile_photo_url + "' width='32px' height='32px' style='margin:0px 4px; border-radius: 50%;'> ";
    document.getElementById("comentario-user").style.display = "flex";
    document.getElementById("comentario-texto").innerHTML = placeInfo.reviews[0].text;

    document.getElementById("comentario-perfil").innerHTML = "<img src=' " + placeInfo.reviews[0].profile_photo_url + "' width='32px' height='32px' style='margin:0px 4px; border-radius: 50%;'> ";
    document.getElementById("comentario-name").innerHTML = placeInfo.reviews[0].author_name;
    document.getElementById("comentario-completo").innerHTML = placeInfo.reviews[0].text;
    document.getElementById("comentario").style.display = "flex";
    document.getElementById("comentario").style.marginBottom = "10px";

    var scoreComentario1 = placeInfo.reviews[0].rating;
    var roundedSC1 = Math.round(scoreComentario1);
    var calificacion1 = document.getElementById('comentario-cal');

    for (var i = 0; i < 5; i++) {
      if (i < roundedSC1) {
        calificacion1.children[i].style.color = '#ffcc00'; // Color amarillo para estrellas coloreadas
      } else {
        calificacion1.children[i].style.color = '#000'; // Color negro para estrellas adicionales
      }
    }

    document.getElementById("card-expandida").style.overflowY = "auto";
    document.getElementById("card-expandida").style.display = "block";
      if(placeInfo.reviews[1] != null){
        document.getElementById("comentario-perfil1").innerHTML = "<img src=' " + placeInfo.reviews[1].profile_photo_url + "' width='32px' height='32px' style='margin:0px 4px; border-radius: 50%;'> ";
        document.getElementById("comentario-name1").innerHTML = placeInfo.reviews[1].author_name;
        document.getElementById("comentario-completo1").innerHTML = placeInfo.reviews[1].text;
        document.getElementById("comentario1").style.display = "flex";
        document.getElementById("comentario1").style.marginBottom = "10px";

        var scoreComentario2 = placeInfo.reviews[1].rating;
        var roundedSC2 = Math.round(scoreComentario1);
        var calificacion2 = document.getElementById('comentario-cal1');

        for (var i = 0; i < 5; i++) {
          if (i < roundedSC2) {
            calificacion2.children[i].style.color = '#ffcc00'; // Color amarillo para estrellas coloreadas
          } else {
            calificacion2.children[i].style.color = '#000'; // Color negro para estrellas adicionales
          }
        }

        document.getElementById("card-expandida").style.overflowY = "auto";
        document.getElementById("card-expandida").style.display = "block";
        if(placeInfo.reviews[2] != null){
          document.getElementById("comentario-perfil2").innerHTML = "<img src=' " + placeInfo.reviews[2].profile_photo_url + "' width='32px' height='32px' style='margin:0px 4px; border-radius: 50%;'> ";
          document.getElementById("comentario-name2").innerHTML = placeInfo.reviews[2].author_name;
          document.getElementById("comentario-completo2").innerHTML = placeInfo.reviews[2].text;
          document.getElementById("comentario2").style.display = "flex";
          document.getElementById("comentario2").style.marginBottom = "10px";

          var scoreComentario3 = placeInfo.reviews[2].rating;
          var roundedSC3 = Math.round(scoreComentario3);
          var calificacion3 = document.getElementById('comentario-cal2');

          for (var i = 0; i < 5; i++) {
            if (i < roundedSC3) {
              calificacion3.children[i].style.color = '#ffcc00'; // Color amarillo para estrellas coloreadas
            } else {
              calificacion3.children[i].style.color = '#000'; // Color negro para estrellas adicionales
            }
          }

          document.getElementById("card-expandida").style.overflowY = "auto";
          document.getElementById("card-expandida").style.display = "block";
          if(placeInfo.reviews[3] != null){
            document.getElementById("comentario-perfil3").innerHTML = "<img src=' " + placeInfo.reviews[3].profile_photo_url + "' width='32px' height='32px' style='margin:0px 4px; border-radius: 50%;'> ";
            document.getElementById("comentario-name3").innerHTML = placeInfo.reviews[3].author_name;
            document.getElementById("comentario-completo3").innerHTML = placeInfo.reviews[3].text;
            document.getElementById("comentario3").style.display = "flex";
            document.getElementById("comentario3").style.marginBottom = "10px";

            var scoreComentario4 = placeInfo.reviews[3].rating;
            var roundedSC4 = Math.round(scoreComentario4);
            var calificacion4 = document.getElementById('comentario-cal3');
            
            for (var i = 0; i < 5; i++) {
              if (i < roundedSC4) {
                calificacion4.children[i].style.color = '#ffcc00'; // Color amarillo para estrellas coloreadas
              } else {
                calificacion4.children[i].style.color = '#000'; // Color negro para estrellas adicionales
              }
            }

            document.getElementById("card-expandida").style.overflowY = "scroll";
            document.getElementById("card-expandida").style.display = "block";
            if(placeInfo.reviews[4] != null){
              document.getElementById("comentario-perfil4").innerHTML = "<img src=' " + placeInfo.reviews[4].profile_photo_url + "' width='32px' height='32px' style='margin:0px 4px; border-radius: 50%;'> ";
              document.getElementById("comentario-name4").innerHTML = placeInfo.reviews[4].author_name;
              document.getElementById("comentario-completo4").innerHTML = placeInfo.reviews[4].text;
              document.getElementById("comentario4").style.display = "flex";
              document.getElementById("comentario4").style.marginBottom = "10px";

              var scoreComentario5 = placeInfo.reviews[4].rating;
              var roundedSC5 = Math.round(scoreComentario5);
              var calificacion5 = document.getElementById('comentario-cal4');

              for (var i = 0; i < 5; i++) {        
                if (i < roundedSC5) {
                  calificacion5.children[i].style.color = '#ffcc00'; // Color amarillo para estrellas coloreadas
                } else {
                  calificacion5.children[i].style.color = '#000'; // Color negro para estrellas adicionales
                }
              }

              document.getElementById("card-expandida").style.overflowY = "scroll";
              document.getElementById("card-expandida").style.display = "block";
            }
            else{
              document.getElementById("comentario4").style.display = "none";
              document.getElementById("comentario4").style.marginBottom = "0px";
            }
          }
          else{      
            document.getElementById("comentario3").style.display = "none";
            document.getElementById("comentario3").style.marginBottom = "0px";

            document.getElementById("comentario4").style.display = "none";
            document.getElementById("comentario4").style.marginBottom = "0px";
          }    
        }
        else{
          document.getElementById("comentario2").style.display = "none";
          document.getElementById("comentario2").style.marginBottom = "0px";
    
          document.getElementById("comentario3").style.display = "none";
          document.getElementById("comentario3").style.marginBottom = "0px";
    
          document.getElementById("comentario4").style.display = "none";
          document.getElementById("comentario4").style.marginBottom = "0px";
        }
      }
      else{
        document.getElementById("comentario1").style.display = "none";
        document.getElementById("comentario1").style.marginBottom = "0px";
   
        document.getElementById("comentario2").style.display = "none";
        document.getElementById("comentario2").style.marginBottom = "0px";
  
        document.getElementById("comentario3").style.display = "none";
        document.getElementById("comentario3").style.marginBottom = "0px";
  
        document.getElementById("comentario4").style.display = "none";
        document.getElementById("comentario4").style.marginBottom = "0px";
      }
    } else{
      document.getElementById("comentario-user").style.display = "none";
      document.getElementById("comentario-texto").innerHTML = "No hay reseñas disponibles";

      document.getElementById("comentario").style.display = "none";
      document.getElementById("comentario").style.marginBottom = "0px";

      document.getElementById("comentario1").style.display = "none";
      document.getElementById("comentario1").style.marginBottom = "0px";

      document.getElementById("comentario2").style.display = "none";
      document.getElementById("comentario2").style.marginBottom = "0px";

      document.getElementById("comentario3").style.display = "none";
      document.getElementById("comentario3").style.marginBottom = "0px";

      document.getElementById("comentario4").style.display = "none";
      document.getElementById("comentario4").style.marginBottom = "0px";

      document.getElementById("card-expandida").style.overflow = "auto";
      document.getElementById("card-expandida").style.display = "block";

      document.getElementById("noReviews").innerText = "No hay reseñas disponibles."
      
    }

    //Para obtener la calificacion
    if (placeInfo.rating === undefined || placeInfo.rating === null) {
      document.getElementById("calification-number").innerHTML = "0/5";
      document.getElementById("score-number").innerHTML = "0/5";

      var starsContainer = document.getElementById('stars-container');
      var calificacion = document.getElementById('calification-puntaje');

      starsContainer.children[0].style.color = '#000';
      starsContainer.children[1].style.color = '#000';
      starsContainer.children[2].style.color = '#000';
      starsContainer.children[3].style.color = '#000';
      starsContainer.children[4].style.color = '#000';
      calificacion.children[0].style.color = '#000';
      calificacion.children[1].style.color = '#000';
      calificacion.children[2].style.color = '#000';
      calificacion.children[3].style.color = '#000';
      calificacion.children[4].style.color = '#000';
    }else{
      document.getElementById("calification-number").innerHTML = placeInfo.rating + "/5";
      document.getElementById("score-number").innerHTML = placeInfo.rating;

      //Colorear estrellas
      var score = placeInfo.rating;
      var roundedScore = Math.round(score);

      var starsContainer = document.getElementById('stars-container');
      var calificacion = document.getElementById('calification-puntaje');
    
      // Cambia el color de las estrellas hasta el puntaje redondeado
      for (var i = 0; i < 5; i++) {
        if (i < roundedScore) {
          starsContainer.children[i].style.color = '#ffcc00'; // Color amarillo para estrellas coloreadas
          calificacion.children[i].style.color = '#ffcc00';
        } else {
          starsContainer.children[i].style.color = '#000'; // Color negro para estrellas adicionales
          calificacion.children[i].style.color = '#000';
        }
      }
    }
    //Para obtener la direccion
  if(placeInfo.address != undefined){
    document.getElementById("more-direction").innerHTML = placeInfo.address;
    document.getElementById("details-domicilio").innerHTML = placeInfo.address;
  }
  else{
    document.getElementById("more-direction").innerHTML = "No disponible";
    document.getElementById("details-domicilio").innerHTML = "No disponible";
  }
  //Para obtener el numero de telefono
  if(placeInfo.phone_number != undefined){
    document.getElementById("phone-text").innerHTML = placeInfo.phone_number;
  }else{
    document.getElementById("phone-text").innerHTML = "Sin teléfono	";
  }
  //Para obtener el sitio web
  if(placeInfo.website != undefined){
    document.getElementById("site-text").innerHTML = '<a href="' + placeInfo.website + '" >' + placeInfo.website + '</a>';
  }else{
    document.getElementById("site-text").innerHTML = "Sin sitio web";
  }

    //Para obtener si esta abierto o cerrado
    if(placeInfo.opening_hours == null){
      document.getElementById("horario-status").innerHTML = "Sin información";
      document.getElementById("horario-status").style.color = "black";
    } else if(placeInfo.opening_hours.isOpen() == true){
      document.getElementById("horario-status").innerHTML = "Abierto";
      document.getElementById("horario-status").style.color = "green";
    }else if(placeInfo.opening_hours.isOpen() == false){
      document.getElementById("horario-status").innerHTML = "Cerrado";
      document.getElementById("horario-status").style.color = "red";
    } 

    //Para obtener los horarios por dia
    if(placeInfo.opening_hours != null){
      document.getElementById("lunes").innerHTML = placeInfo.opening_hours.weekday_text[0];
      document.getElementById("martes").innerHTML = placeInfo.opening_hours.weekday_text[1];
      document.getElementById("miercoles").innerHTML = placeInfo.opening_hours.weekday_text[2];
      document.getElementById("jueves").innerHTML = placeInfo.opening_hours.weekday_text[3];
      document.getElementById("viernes").innerHTML = placeInfo.opening_hours.weekday_text[4];
      document.getElementById("sabado").innerHTML = placeInfo.opening_hours.weekday_text[5];
      document.getElementById("domingo").innerHTML = placeInfo.opening_hours.weekday_text[6];
    }else{
      document.getElementById("lunes").innerHTML = "Lunes: Sin información";
      document.getElementById("martes").innerHTML = "Martes: Sin información";
      document.getElementById("miercoles").innerHTML = "Miércoles: Sin información";
      document.getElementById("jueves").innerHTML = "Jueves: Sin información";
      document.getElementById("viernes").innerHTML = "Viernes: Sin información";
      document.getElementById("sabado").innerHTML = "Sábado: Sin información";
      document.getElementById("domingo").innerHTML = "Domingo: Sin información";
    }

    //Para obtener el tipo de lugar
    if(placeInfo.type[0] == "accounting"){
      document.getElementById("more-type").innerHTML = "Contable";
    }
    else if(placeInfo.type[0] == "airport"){
      document.getElementById("more-type").innerHTML = "Aeropuerto";
    }
    else if(placeInfo.type[0] == "amusement_park"){
      document.getElementById("more-type").innerHTML = "Parque de diversiones";
    }
    else if(placeInfo.type[0] == "aquarium"){
      document.getElementById("more-type").innerHTML = "Acuario";
    }
    else if(placeInfo.type[0] == "art_gallery"){
      document.getElementById("more-type").innerHTML = "Galería de arte";
    }
    else if(placeInfo.type[0] == "atm"){
      document.getElementById("more-type").innerHTML = "Cajero automático";
    }
    else if(placeInfo.type[0] == "bakery"){
      document.getElementById("more-type").innerHTML = "Panadería";
    }
    else if(placeInfo.type[0] == "bank"){
      document.getElementById("more-type").innerHTML = "Banco";
    }
    else if(placeInfo.type[0] == "bar"){
      document.getElementById("more-type").innerHTML = "Bar";
    }
    else if(placeInfo.type[0] == "beauty_salon"){
      document.getElementById("more-type").innerHTML = "Salón de belleza";
    }
    else if(placeInfo.type[0] == "bicycle_store"){
      document.getElementById("more-type").innerHTML = "Tienda de bicicletas";
    }
    else if(placeInfo.type[0] == "book_store"){
      document.getElementById("more-type").innerHTML = "Librería";
    }
    else if(placeInfo.type[0] == "bowling_alley"){
      document.getElementById("more-type").innerHTML = "Bolera";
    }
    else if(placeInfo.type[0] == "bus_station"){
      document.getElementById("more-type").innerHTML = "Estación de autobuses";
    }
    else if(placeInfo.type[0] == "cafe"){
      document.getElementById("more-type").innerHTML = "Café";
    }
    else if(placeInfo.type[0] == "campground"){
      document.getElementById("more-type").innerHTML = "Campamento";
    }
    else if(placeInfo.type[0] == "car_dealer"){
      document.getElementById("more-type").innerHTML = "Concesionario";
    }
    else if(placeInfo.type[0] == "car_rental"){
      document.getElementById("more-type").innerHTML = "Renta de autos";
    }
    else if(placeInfo.type[0] == "car_repair"){
      document.getElementById("more-type").innerHTML = "Reparación de autos";
    }
    else if(placeInfo.type[0] == "car_wash"){
      document.getElementById("more-type").innerHTML = "Lavado de autos";
    }
    else if(placeInfo.type[0] == "casino"){
      document.getElementById("more-type").innerHTML = "Casino";
    }
    else if(placeInfo.type[0] == "cemetery"){
      document.getElementById("more-type").innerHTML = "Cementerio";
    }
    else if(placeInfo.type[0] == "church"){
      document.getElementById("more-type").innerHTML = "Iglesia";
    }
    else if(placeInfo.type[0] == "city_hall"){
      document.getElementById("more-type").innerHTML = "Ayuntamiento";
    }
    else if(placeInfo.type[0] == "clothing_store"){
      document.getElementById("more-type").innerHTML = "Tienda de ropa";
    }
    else if(placeInfo.type[0] == "convenience_store"){
      document.getElementById("more-type").innerHTML = "Tienda de conveniencia";
    }
    else if(placeInfo.type[0] == "courthouse"){
      document.getElementById("more-type").innerHTML = "Palacio de justicia";
    }
    else if(placeInfo.type[0] == "dentist"){
      document.getElementById("more-type").innerHTML = "Dentista";
    }
    else if(placeInfo.type[0] == "department_store"){
      document.getElementById("more-type").innerHTML = "Tienda departamental";
    }
    else if(placeInfo.type[0] == "doctor"){
      document.getElementById("more-type").innerHTML = "Doctor";
    }
    else if(placeInfo.type[0] == "drugstore"){
      document.getElementById("more-type").innerHTML = "Farmacia";
    }
    else if(placeInfo.type[0] == "electrician"){
      document.getElementById("more-type").innerHTML = "Electricista";
    }
    else if(placeInfo.type[0] == "electronics_store"){
      document.getElementById("more-type").innerHTML = "Tienda de electrónica";
    }
    else if(placeInfo.type[0] == "embassy"){
      document.getElementById("more-type").innerHTML = "Embajada";
    }
    else if(placeInfo.type[0] == "fire_station"){
      document.getElementById("more-type").innerHTML = "Estación de bomberos";
    }
    else if(placeInfo.type[0] == "florist"){
      document.getElementById("more-type").innerHTML = "Florería";
    }
    else if(placeInfo.type[0] == "funeral_home"){
      document.getElementById("more-type").innerHTML = "Funeraria";
    }
    else if(placeInfo.type[0] == "furniture_store"){
      document.getElementById("more-type").innerHTML = "Tienda de muebles";
    }
    else if(placeInfo.type[0] == "gas_station"){
      document.getElementById("more-type").innerHTML = "Gasolinera";
    }
    else if(placeInfo.type[0] == "gym"){
      document.getElementById("more-type").innerHTML = "Gimnasio";
    }
    else if(placeInfo.type[0] == "hair_care"){
      document.getElementById("more-type").innerHTML = "Estética";
    }
    else if(placeInfo.type[0] == "hardware_store"){
      document.getElementById("more-type").innerHTML = "Ferretería";
    }
    else if(placeInfo.type[0] == "hindu_temple"){
      document.getElementById("more-type").innerHTML = "Templo hindú";
    }
    else if(placeInfo.type[0] == "home_goods_store"){
      document.getElementById("more-type").innerHTML = "Tienda de artículos para el hogar";
    }
    else if(placeInfo.type[0] == "hospital"){
      document.getElementById("more-type").innerHTML = "Hospital";
    }
    else if(placeInfo.type[0] == "insurance_agency"){
      document.getElementById("more-type").innerHTML = "Agencia de seguros";
    }
    else if(placeInfo.type[0] == "jewelry_store"){
      document.getElementById("more-type").innerHTML = "Joyería";
    }
    else if(placeInfo.type[0] == "laundry"){
      document.getElementById("more-type").innerHTML = "Lavandería";
    }
    else if(placeInfo.type[0] == "lawyer"){
      document.getElementById("more-type").innerHTML = "Abogado";
    }
    else if(placeInfo.type[0] == "library"){
      document.getElementById("more-type").innerHTML = "Biblioteca";
    }
    else if(placeInfo.type[0] == "light_rail_station"){
      document.getElementById("more-type").innerHTML = "Estación de tren ligero";
    }
    else if(placeInfo.type[0] == "liquor_store"){
      document.getElementById("more-type").innerHTML = "Licorería";
    }
    else if(placeInfo.type[0] == "local_government_office"){
      document.getElementById("more-type").innerHTML = "Oficina de gobierno local";
    }
    else if(placeInfo.type[0] == "locksmith"){
      document.getElementById("more-type").innerHTML = "Cerrajería";
    }
    else if(placeInfo.type[0] == "lodging"){
      document.getElementById("more-type").innerHTML = "Hospedaje";
    }
    else if(placeInfo.type[0] == "meal_delivery"){
      document.getElementById("more-type").innerHTML = "Entrega de comida";
    }
    else if(placeInfo.type[0] == "meal_takeaway"){
      document.getElementById("more-type").innerHTML = "Comida para llevar";
    }
    else if(placeInfo.type[0] == "mosque"){
      document.getElementById("more-type").innerHTML = "Mezquita";
    }
    else if(placeInfo.type[0] == "movie_rental"){
      document.getElementById("more-type").innerHTML = "Renta de películas";
    }
    else if(placeInfo.type[0] == "movie_theater"){
      document.getElementById("more-type").innerHTML = "Cine";
    }
    else if(placeInfo.type[0] == "moving_company"){
      document.getElementById("more-type").innerHTML = "Empresa de mudanzas";
    }
    else if(placeInfo.type[0] == "museum"){
      document.getElementById("more-type").innerHTML = "Museo";
    }
    else if(placeInfo.type[0] == "night_club"){
      document.getElementById("more-type").innerHTML = "Antro";
    }
    else if(placeInfo.type[0] == "painter"){
      document.getElementById("more-type").innerHTML = "Pintor";
    }
    else if(placeInfo.type[0] == "park"){
      document.getElementById("more-type").innerHTML = "Parque";
    }
    else if(placeInfo.type[0] == "parking"){
      document.getElementById("more-type").innerHTML = "Estacionamiento";
    }
    else if(placeInfo.type[0] == "pet_store"){
      document.getElementById("more-type").innerHTML = "Tienda de mascotas";
    }
    else if(placeInfo.type[0] == "pharmacy"){
      document.getElementById("more-type").innerHTML = "Farmacia";
    }
    else if(placeInfo.type[0] == "physiotherapist"){
      document.getElementById("more-type").innerHTML = "Fisioterapeuta";
    }
    else if(placeInfo.type[0] == "plumber"){
      document.getElementById("more-type").innerHTML = "Plomero";
    }
    else if(placeInfo.type[0] == "police"){
      document.getElementById("more-type").innerHTML = "Policía";
    }
    else if(placeInfo.type[0] == "post_office"){
      document.getElementById("more-type").innerHTML = "Oficina de correos";
    }
    else if(placeInfo.type[0] == "primary_school"){
      document.getElementById("more-type").innerHTML = "Escuela primaria";
    }
    else if(placeInfo.type[0] == "real_estate_agency"){
      document.getElementById("more-type").innerHTML = "Agencia de bienes raíces";
    }
    else if(placeInfo.type[0] == "restaurant"){
      document.getElementById("more-type").innerHTML = "Restaurante";
    }
    else if(placeInfo.type[0] == "roofing_contractor"){
      document.getElementById("more-type").innerHTML = "Contratista de techos";
    }
    else if(placeInfo.type[0] == "rv_park"){
      document.getElementById("more-type").innerHTML = "Parque de casas rodantes";
    }
    else if(placeInfo.type[0] == "school"){
      document.getElementById("more-type").innerHTML = "Escuela";
    }
    else if(placeInfo.type[0] == "secondary_school"){
      document.getElementById("more-type").innerHTML = "Escuela secundaria";
    }
    else if(placeInfo.type[0] == "shoe_store"){
      document.getElementById("more-type").innerHTML = "Zapatería";
    }
    else if(placeInfo.type[0] == "shopping_mall"){
      document.getElementById("more-type").innerHTML = "Centro comercial";
    }
    else if(placeInfo.type[0] == "spa"){
      document.getElementById("more-type").innerHTML = "Spa";
    }
    else if(placeInfo.type[0] == "stadium"){
      document.getElementById("more-type").innerHTML = "Estadio";
    }
    else if(placeInfo.type[0] == "storage"){
      document.getElementById("more-type").innerHTML = "Almacenamiento";
    }
    else if(placeInfo.type[0] == "store"){
      document.getElementById("more-type").innerHTML = "Tienda";
    }
    else if(placeInfo.type[0] == "subway_station"){
      document.getElementById("more-type").innerHTML = "Estación de metro";
    }
    else if(placeInfo.type[0] == "supermarket"){
      document.getElementById("more-type").innerHTML = "Supermercado";
    }
    else if(placeInfo.type[0] == "synagogue"){
      document.getElementById("more-type").innerHTML = "Sinagoga";
    }
    else if(placeInfo.type[0] == "taxi_stand"){
      document.getElementById("more-type").innerHTML = "Sitio de taxis";
    }
    else if(placeInfo.type[0] == "tourist_attraction"){
      document.getElementById("more-type").innerHTML = "Atracción turística";
    }
    else if(placeInfo.type[0] == "train_station"){
      document.getElementById("more-type").innerHTML = "Estación de tren";
    }
    else if(placeInfo.type[0] == "travel_agency"){
      document.getElementById("more-type").innerHTML = "Agencia de viajes";
    }
    else if(placeInfo.type[0] == "university"){
      document.getElementById("more-type").innerHTML = "Universidad";
    }
    else if(placeInfo.type[0] == "veterinary_care"){
      document.getElementById("more-type").innerHTML = "Veterinaria";
    }
    else if(placeInfo.type[0] == "zoo"){
      document.getElementById("more-type").innerHTML = "Zoológico";
    }
    else{
      document.getElementById("more-type").innerHTML = "Sitio de interés";
    }

     
//Para obtener la hora de apertura o cierre
if(placeInfo.opening_hours != null){
  const periods = placeInfo.opening_hours.periods;
  const today = new Date();
  const day = today.getDay();
  let dayWeekday = "";
  let mañana = "";

  if (day === 0) {
     dayWeekday = 6;
  } else {
    dayWeekday = day - 1;
  }

  if(day === 6){
    mañana = 0;
  }else{
    mañana = day + 1;
  }

  let isOpen = {
    openingTime: "",
    closingTime: "",
    openingTimeMañana: "",
  };

  if(placeInfo.opening_hours.weekday_text[dayWeekday] == "lunes: Cerrado" || placeInfo.opening_hours.weekday_text[dayWeekday] == "martes: Cerrado" || placeInfo.opening_hours.weekday_text[dayWeekday] == "miércoles: Cerrado" || placeInfo.opening_hours.weekday_text[dayWeekday] == "jueves: Cerrado" || placeInfo.opening_hours.weekday_text[dayWeekday] == "viernes: Cerrado" || placeInfo.opening_hours.weekday_text[dayWeekday] == "sábado: Cerrado" || placeInfo.opening_hours.weekday_text[dayWeekday] == "domingo: Cerrado"){
    document.getElementById("horario-text").innerHTML = '<a style= "color: red">"Día de descanso"</a>';
    document.getElementById("horario-day").style.color = "red";
    document.getElementById("horario-day").innerHTML = '<a style= "color: red">"Día de descanso"</a>';
    document.getElementById("horario-text").style.color = "red";
  }
  else if(placeInfo.opening_hours.weekday_text[dayWeekday] == "lunes: Abierto 24 horas" || placeInfo.opening_hours.weekday_text[dayWeekday] == "martes: Abierto 24 horas" || placeInfo.opening_hours.weekday_text[dayWeekday] == "miércoles: Abierto 24 horas" || placeInfo.opening_hours.weekday_text[dayWeekday] == "jueves: Abierto 24 horas" || placeInfo.opening_hours.weekday_text[dayWeekday] == "viernes: Abierto 24 horas" || placeInfo.opening_hours.weekday_text[dayWeekday] == "sábado: Abierto 24 horas" || placeInfo.opening_hours.weekday_text[dayWeekday] == "domingo: Abierto 24 horas"){
    document.getElementById("horario-text").innerHTML = '<a style= "color: green">Servicio ininterrumpido</a>';
    document.getElementById("horario-day").style.color = "green";
    document.getElementById("horario-day").innerHTML = '<a style= "color: green">Servicio ininterrumpido</a>';
    document.getElementById("horario-text").style.color = "green";
  }
  else if(placeInfo.opening_hours.weekday_text[dayWeekday] == "lunes: Abierto las 24 horas" || placeInfo.opening_hours.weekday_text[dayWeekday] == "martes: Abierto las 24 horas" || placeInfo.opening_hours.weekday_text[dayWeekday] == "miércoles: Abierto las 24 horas" || placeInfo.opening_hours.weekday_text[dayWeekday] == "jueves: Abierto las 24 horas" || placeInfo.opening_hours.weekday_text[dayWeekday] == "viernes: Abierto las 24 horas" || placeInfo.opening_hours.weekday_text[dayWeekday] == "sábado: Abierto las 24 horas" || placeInfo.opening_hours.weekday_text[dayWeekday] == "domingo: Abierto las 24 horas"){
    document.getElementById("horario-text").innerHTML = '<a style= "color: green">Servicio ininterrumpido</a>';
    document.getElementById("horario-day").style.color = "green";
    document.getElementById("horario-day").innerHTML = '<a style= "color: green">Servicio ininterrumpido</a>';
    document.getElementById("horario-text").style.color = "green";
  }
  else if(placeInfo.opening_hours.periods[day] === null){
    document.getElementById("horario-text").innerHTML = "Sin información del horario";
    document.getElementById("horario-day").style.color = "black";
    document.getElementById("horario-day").innerHTML = "No disponible";
    document.getElementById("horario-text").style.color = "black";
  }
  else{
    //Contar los numeros de digitos de los minutos
    const digitos = periods[day].close.minutes.toString().length;
    const digitosAbierto = periods[day].open.minutes.toString().length;
    if(digitosAbierto == 2){
    isOpen.openingTime = periods[day].open.hours + ":" + periods[day].open.minutes;
    }else if(digitosAbierto == 1){
      isOpen.openingTime = periods[day].open.hours + ":" + periods[day].open.minutes +"0";
    }

    if(digitos == 2){
      isOpen.closingTime = periods[day].close.hours + ":" + periods[day].close.minutes;
    }else if(digitos == 1){
      isOpen.closingTime = periods[day].close.hours + ":" + periods[day].close.minutes + "0";
    }

    if (placeInfo.opening_hours.isOpen() === true) {
      document.getElementById("horario-text").innerHTML = '<a style= "color: green"> Cierra a las ' + isOpen.closingTime + ' hrs</a>';
      document.getElementById("horario-day").innerHTML =  '<a style= "color: green"> Cierra a las ' + isOpen.closingTime + ' hrs</a>';
      document.getElementById("horario-text").style.color = "green";
      document.getElementById("horario-day").style.color = "green";
    } else if (placeInfo.opening_hours.isOpen() === false) {
        if(placeInfo.opening_hours.weekday_text[day] == "lunes: Cerrado" || placeInfo.opening_hours.weekday_text[day] == "martes: Cerrado" || placeInfo.opening_hours.weekday_text[day] == "miércoles: Cerrado" || placeInfo.opening_hours.weekday_text[day] == "jueves: Cerrado" || placeInfo.opening_hours.weekday_text[day] == "viernes: Cerrado" || placeInfo.opening_hours.weekday_text[day] == "sábado: Cerrado" || placeInfo.opening_hours.weekday_text[day] == "domingo: Cerrado"){
          document.getElementById("horario-text").innerHTML = '<a style= "color: red">Mañana sin servicio</a>';
          document.getElementById("horario-day").style.color = "red";
          document.getElementById("horario-day").innerHTML = '<a style= "color: red">Mañana sin servicio</a>';
          document.getElementById("horario-text").style.color = "red";
        }else if(placeInfo.opening_hours.periods[mañana] != null){
        const digitosAbiertomañana = periods[mañana].open.minutes.toString().length;
        if(digitosAbiertomañana == 2){
          isOpen.openingTimeMañana = periods[mañana].open.hours + ":" + periods[mañana].open.minutes;
        }else{
          isOpen.openingTimeMañana = periods[mañana].open.hours + ":" + periods[mañana].open.minutes +"0";
        }
        document.getElementById("horario-text").innerHTML = '<a style= "color: green">Abre mañana, ' + isOpen.openingTimeMañana + ' hrs</a>';
        document.getElementById("horario-day").innerHTML = '<a style= "color: green">Abre mañana, ' + isOpen.openingTimeMañana + ' hrs</a>';
        document.getElementById("horario-text").style.color = "green";
        document.getElementById("horario-day").style.color = "green";
        }
        else{
          document.getElementById("horario-text").innerHTML = '<a style= "color: red">Hoy cerrado</a>';
          document.getElementById("horario-day").style.color = "red";
          document.getElementById("horario-day").innerHTML = '<a style= "color: red">Hoy cerrado</a>';
          document.getElementById("horario-text").style.color = "red";
        }
    }
  }
}else{
  document.getElementById("horario-text").innerHTML = "Sin información del horario";
  document.getElementById("horario-day").style.color = "black";
  document.getElementById("horario-day").innerHTML = "No disponible";
  document.getElementById("horario-text").style.color = "black";
}
}


function geocode(request) {

}


  
window.initAutocomplete = initMap;

/****************************************************************************************************************************
*/

let isFavorito;

async function updateFavoriteButtonStatus(placeId) {
    console.log("updateFavoriteButtonStatus iniciado para el lugar:", placeId);
    const nombreUsuario = document.getElementById("nombreUsuario");
    console.log("ID del turista:", nombreUsuario.dataset.idTurista);

    try {
        const res = await fetch(`${server}/api/lugarFavorito/obtenerLugaresFavoritos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                idTurista: nombreUsuario.dataset.idTurista
            })
        });

        const favoritosData = await res.json();
        console.log("Datos de favoritos recibidos:", favoritosData);

        // Verifica si los tipos de datos son consistentes
        console.log("Tipo de placeId:", typeof placeId, "Tipo de ID LUGAR:", typeof favoritosData[0]["ID LUGAR"]);
        
        isFavorito = favoritosData.some(lugar => lugar["ID LUGAR"] === placeId);
        console.log("¿Es favorito?:", isFavorito);
        updateFavoriteButtons();
    } catch (error) {
        console.error("Error en updateFavoriteButtonStatus:", error);
    }
}

function updateFavoriteButtons() {
    const favoritoButton = document.getElementById('favorito');
    const favorito1Button = document.getElementById('favorito1');
    const newSrc = isFavorito ? 'assets/icons/favoritosBlanco.png' : 'assets/icons/favoritosIcon.png';
    console.log("Actualizando botones a", newSrc);

    if (favoritoButton) favoritoButton.src = newSrc;
    if (favorito1Button) favorito1Button.src = newSrc;
}

function toggleFavoritoState() {
    isFavorito = !isFavorito;
    console.log("Cambiando estado de isFavorito a", isFavorito);
    setTimeout(updateFavoriteButtons, 0);
}

const toggleFavorito = document.getElementById('favorito');
const toggleFavorito1 = document.getElementById('favorito1');

toggleFavorito.addEventListener('click', toggleFavoritoState);
toggleFavorito1.addEventListener('click', toggleFavoritoState);


function debeIniciar() {
  const placeId = obtenerParametrosDeURL();
  if (placeId) {
      iniciar(placeId);
  } else {
      console.log("No hay placeId en la URL, no se iniciará.");
      forzarRecalculacionLayout();
  }
}

function iniciar(placeId) {

  console.log("Iniciando con placeId:", placeId);

  obtenerCoordenadasPorPlaceId(placeId)
    .then(coordenadas => {

        console.log("Coordenadas obtenidas:", coordenadas);

        mapa.setCenter(coordenadas);
        mapa.setZoom(15);

        const marker = new google.maps.Marker({
            position: coordenadas,
            map: mapa
        });

        getInfo({place_id: placeId})
            .then(info => {

                console.log("Información obtenida:", info);

                imprimeDatos(JSON.parse(info));

                marker.setTitle(info.name);

                forzarRecalculacionLayout();

            })
            .catch(error => console.error('Error al obtener información del lugar:', error));

    })
    .catch(error => console.error('Error al obtener coordenadas por PlaceId:', error));

}

window.onload=debeIniciar;

function obtenerParametrosDeURL() {
  const parametros = new URLSearchParams(window.location.search);
  console.log(parametros)
  return parametros.get('placeId');
}

function forzarRecalculacionLayout() {
  window.dispatchEvent(new Event('resize'));
}



document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('flecha').addEventListener('click', async (e) => {
    e.preventDefault()

    const placeHTML = document.getElementById("header-name")
    
      const directionsService = new google.maps.DirectionsService();
      const directionsRenderer = new google.maps.DirectionsRenderer();

      const coordenadasDestino = {
        lat: parseFloat(placeHTML.dataset.latitud),
        lng: parseFloat(placeHTML.dataset.longitud)
      }

      console.log(coordenadasDestino)
      console.log(coordenadasActuales)

      directionsRenderer.setMap(mapa);
      directionsService
        .route({
          origin: coordenadasActuales,
          destination: coordenadasDestino,
          // Note that Javascript allows us to access the constant
          // using square brackets and a string value as its
          // "property."
          travelMode: google.maps.TravelMode["DRIVING"]
        })
        .then((response) => {
          directionsRenderer.setDirections(response);
        })
        .catch((e) => window.alert("Directions request failed due to " + e));
    
  })
})