//Para expandir el div card
document.addEventListener('DOMContentLoaded', function () {

  var filtersEx = document.getElementById('filters-expanded');
  

  const toggleExpandir = document.getElementById('ToogleExpandir');
  const comentario = document.querySelector('.place-comentario');
  // const recomendacion = document.querySelector('.Msg-recomendar');
  const info_card = document.querySelector('.place-about');
  const info_cardExpandida = document.querySelector('.place-header-about');
  const info_cardExpandida2 = document.querySelector('.place-body-details');
  const info_cardExpandida3 = document.querySelector('.photos');
  const info_cardExpandida4 = document.querySelector('.comments');
  const linea = document.querySelector('.divisor');
  const linea1 = document.querySelector('.divisor1');
  const card = document.querySelector('.card');

  if (toggleExpandir && card) {
      toggleExpandir.addEventListener('click', function () {
          filtersEx.style.maxHeight = '0';
          filtersEx.style.display = 'none';
          
          const style = card.getAttribute('style') === 'height: 560px !important; bottom: 6% !important; display: flex; padding-bottom: 16px !important;' ? 'height: 130px !important; bottom: 6% !important; display: flex; padding-bottom: 0px !important;' : 'height: 560px !important; bottom: 6% !important; display: flex; padding-bottom: 16px !important;';
          const style1 = comentario.getAttribute('style') === 'display: none;' ? 'display: flex;' : 'display: none;';
          // const style2 = recomendacion.getAttribute('style') === 'display: none;' ? 'display: flex;' : 'display: none;';
          const style3 = info_card.getAttribute('style') === 'display: none;' ? 'display: flex;' : 'display: none;';
          const style4 = info_cardExpandida.getAttribute('style') === 'display: flex;' ? 'display: none;' : 'display: flex;';
          const style5 = info_cardExpandida2.getAttribute('style') === 'display: flex;' ? 'display: none;' : 'display: flex;';
          const style6 = info_cardExpandida3.getAttribute('style') === 'display: flex;' ? 'display: none;' : 'display: flex;';
          const style7 = info_cardExpandida4.getAttribute('style') === 'display: flex;' ? 'display: none;' : 'display: flex;';
          const style8 = linea.getAttribute('style') === 'display: flex;' ? 'display: none;' : 'display: flex;';
          const style9 = linea1.getAttribute('style') === 'display: flex;' ? 'display: none;' : 'display: flex;';
//          const style10 = card.attributes('style') === 'display: flex;';
//          card.setAttribute('style', style10);
          linea1.setAttribute('style', style9);
          linea.setAttribute('style', style8);
          info_cardExpandida4.setAttribute('style', style7);
          info_cardExpandida3.setAttribute('style', style6);
          info_cardExpandida2.setAttribute('style', style5);
          info_cardExpandida.setAttribute('style', style4);
          info_card.setAttribute('style', style3);
          // recomendacion.setAttribute('style', style2);
          comentario.setAttribute('style', style1);
          card.setAttribute('style', style);

          ToogleExpandir.src = style === 'height: 130px !important; bottom: 6% !important; display: flex; padding-bottom: 0px !important;' ? './assets/icons/Flecha pa arriba.PNG' : './assets/icons/Flecha pa abajo.PNG';


      });
  }
});
