export const actualizarResena = (placeInfo) => {
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
}