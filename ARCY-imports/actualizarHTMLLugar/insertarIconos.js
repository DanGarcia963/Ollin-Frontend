export const insertarIconos = () => {
  document.getElementById("card").style.display = "flex";
  document.getElementById('favorito').src = 'assets/icons/favoritosIcon.png';
  document.getElementById('favorito1').src = 'assets/icons/favoritosIcon.png';
  document.getElementById('flecha').src = 'assets/icons/flechaBackAzul.png';
  document.getElementById('itinerario').src = 'assets/icons/agregarItinIconV2.png';
  document.getElementById('check').src = 'assets/icons/checked.png';
  document.querySelector('.visitado').style.display = 'none';
  document.querySelector('.img-referente1').style.alignSelf = 'auto';
}