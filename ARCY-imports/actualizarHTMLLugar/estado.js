export const actualizarEstado = (placeInfo) => {
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
}