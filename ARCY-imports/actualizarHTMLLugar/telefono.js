export const actualizarTelefono = (placeInfo) => {
  if(placeInfo.phone_number != undefined){
    document.getElementById("phone-text").innerHTML = placeInfo.phone_number;
  }else{
    document.getElementById("phone-text").innerHTML = "Sin teléfono	";
  }
}