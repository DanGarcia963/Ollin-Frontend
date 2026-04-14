export const actualizarSitioWeb = (placeInfo) => {
  if(placeInfo.website != undefined){
    document.getElementById("site-text").innerHTML = '<a href="' + placeInfo.website + '" >' + placeInfo.website + '</a>';
  }else{
    document.getElementById("site-text").innerHTML = "Sin sitio web";
  }
}