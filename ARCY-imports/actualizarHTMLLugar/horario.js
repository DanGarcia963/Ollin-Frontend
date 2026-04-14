export const actualizarHorario = (placeInfo) => {
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
}

export const cerrarHorario = () => {
  document.getElementById("ToogleHorario").src = "assets/icons/expandir.png";
  let isToogle = true;
  document.querySelector('.horario-text').style.display = 'flex';
  document.querySelector('.weekend-text').style.display = 'none';
}