export const actualizarCalificacion = (placeInfo) => {
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
}