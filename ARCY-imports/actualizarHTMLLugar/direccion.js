export const actualizarDireccion = (placeInfo) => {
  if(placeInfo.address != undefined){
    document.getElementById("more-direction").innerHTML = placeInfo.address;
    document.getElementById("details-domicilio").innerHTML = placeInfo.address;
  }
  else{
    document.getElementById("more-direction").innerHTML = "No disponible";
    document.getElementById("details-domicilio").innerHTML = "No disponible";
  }
}