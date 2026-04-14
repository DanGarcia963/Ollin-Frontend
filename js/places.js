// This example adds a search box to a map, using the Google Place Autocomplete
// feature. People can enter geographical searches. The search box will return a
// pick list containing a mix of places and predicted search terms.
// This example requires the Places library. Include the libraries=places
// parameter when you first load the API. For example:
// <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places">

// Nota: se considera como Barra de busqueda al conjunto de la SearchBox, btnClose y btnClear
/*
//Obteniendo ubicacion del usuario
if(navigator.geolocation){
  navigator.geolocation.getCurrentPosition(
    ({ coords : { latitude, longitude }}) => {
      const coords = {
        lat: latitude,
        lng: longitude,
      };
      console.log(coords);
    },
    () => {
      alert("Ocurrio un error");
    }
  );
}else{
  alert("Tu navegador no dispone de geolocalización, por favor, actualizalo");
} */

  function initAutocomplete () {
    // Obteniendo ubicacion del usuario
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        ({ coords: { latitude, longitude } }) => {
          const coords = {
            lat: latitude,
            lng: longitude
          }
          // console.log(coords);
          const map = new google.maps.Map(document.getElementById('map'), {
            center: coords,
            zoom: 15,
            mapTypeId: 'roadmap'
          })
  
          const locUserMarker = new google.maps.Marker({
            position: coords,
            title: 'Ubicación del turista',
            icon: {
              url: './assets/icons/locUserMarker.png',
              scaledSize: new google.maps.Size(32, 32)
            }
          })
          locUserMarker.setMap(map)
          // Create the search box and link it to the UI element.
          const input = document.getElementById('SearchBox')
          const searchBox = new google.maps.places.SearchBox(input)
  
          // Bias the SearchBox results towards current map's viewport.
          map.addListener('bounds_changed', () => {
            searchBox.setBounds(map.getBounds())
          })
  
          let markers = []
  
          // Bandera para borrar o no busqueda
          // Si se presiona el btnClear en la Barra de busqueda sin haber dado clic en la SearchBox, los resultados desplegados en el mapa (busqy eda) se borrarán, junto con el texto en la SearchBox. Por el contrario, si se presiona el btnClear habiendo dado clic o escrito en la SearchBox, solo se borrará el texto de la SearchBox
          let inputClicked = false
  
          // Listen for the event fired when the user selects a prediction and retrieve
          // more details for that place.
          searchBox.addListener('places_changed', () => {
            /* Ocultando modal con la SearchBox */
            const modal = document.getElementById('cModalSearchBox')
            modal.style.opacity = '0'
            modal.style.visibility = 'hidden'
            /** */
            /* var btnClose=document.getElementById("btnClose");
            btnClose.addEventListener("click",function(){ */
            // Oculta el div de results
            $('#containerResultsPlaces').css('display', 'none')
            // })
            inputClicked = false // desactiva bandera cuando de hace busqueda
  
            const places = searchBox.getPlaces()
  
            if (places.length == 0) {
              return
            }
  
            // Clear out the old markers.
            markers.forEach((marker) => {
              marker.setMap(null)
            })
            markers = []
  
            // For each place, get the icon, name and location.
            const bounds = new google.maps.LatLngBounds()
  
            places.forEach((place) => {
              if (!place.geometry || !place.geometry.location) {
                console.log('Returned place contains no geometry')
                return
              }
  
              const icon = {
                url: place.icon,
                size: new google.maps.Size(71, 71),
                origin: new google.maps.Point(0, 0),
                anchor: new google.maps.Point(17, 34),
                scaledSize: new google.maps.Size(25, 25)
              }
  
              // Create a marker for each place.
              markers.push(
                new google.maps.Marker({
                  map,
                  icon,
                  title: place.name,
                  position: place.geometry.location
                })
              )
              if (place.geometry.viewport) {
                // Only geocodes have viewport.
                bounds.union(place.geometry.viewport)
              } else {
                bounds.extend(place.geometry.location)
              }
            })
            map.fitBounds(bounds)
          })
  
          /* Insertando el dropdown de resultados en el div results */
          setTimeout(function () {
            $('.pac-container').prependTo('#results')
          }, 300)
          /** */
  
          // Borrar el texto escrito en la Barra de Busqueda o Borrar la busqueda
          const inputSB = document.getElementById('SearchBox')
          const btnClear = document.getElementById('btnClear')
          inputSB.addEventListener('click', function () {
            inputClicked = true
          })
          btnClear.addEventListener('click', function () {
            inputSB.value = ''
            if (!inputClicked) {
              // Borrar busqueda
              // Clear out the old markers.
              markers.forEach((marker) => {
                marker.setMap(null)
              })
              markers = []
              console.log('busqueda borrada')
              /* REVISAR SI ES NECESARIO REGRESAR A COORDENADAS DE UBICACION */
            }
            inputClicked = false
            // Oculta el div de results
            $('#containerResultsPlaces').css('display', 'none')
            // Oculta el div de patrocinados
            $('#containerSponsored').css('display', 'none')
          })
          inputSB.addEventListener('input', function () {
            // Muestra el div de results
            $('#containerResultsPlaces').css('display', 'block')
          })
          const btnClose = document.getElementById('btnClose')
          btnClose.addEventListener('click', function () {
            // Oculta el div de results
            $('#containerResultsPlaces').css('display', 'none')
          })
          /** */
        },
        () => {
          alert('Ocurrio un error')
        }
      )
    } else {
      alert('Tu navegador no dispone de geolocalización, por favor, actualizalo')
    }
  }
  
  window.initAutocomplete = initAutocomplete
  