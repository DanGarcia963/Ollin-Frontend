import { limpiarMarcadoresMapa, mostrarLugares } from "./utilidadesMapa.js"


export const accionesEnBarraDeBusqueda = () => {
  var inputBusquedaLugar = document.getElementById("SearchBox");
  inputBusquedaLugar.addEventListener("click",function(){
    inputClicked=true;
  })

  inputBusquedaLugar.addEventListener("input",function(){
    $('#containerResultsPlaces').css("display","block");
  })
}

export const clickEnGomaParaBorrar = (inputClicked, markers, mapa, coordenadas) => {
  var btnClear=document.getElementById("btnClear");
  var inputBusquedaLugar = document.getElementById("SearchBox");
  
  btnClear.addEventListener("click",function(){
    console.log("Estoy funcionando")
    inputBusquedaLugar.value='';

      if(!inputClicked){  
          console.log("Estoy loco")
          markers = limpiarMarcadoresMapa(markers);

          // searchMarkers.forEach((marker) => {
          //   marker.setMap(null);
          // });
          // searchMarkers = [];
          mapa.setCenter(coordenadas);
          mapa.setZoom(15);
          //mostrarLugares(coordenadas, null);
      }

      inputClicked=false;
      
      //Oculta el div de results
      $('#containerResultsPlaces').css("display","none"); 
      //Oculta el div de patrocinados
      $('#containerSponsored').css("display","none"); 

      return markers
    })
    return markers
}