export const actualizarFotos = (placeInfo) => {
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
}