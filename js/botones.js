document.addEventListener('DOMContentLoaded', function () {
    const toggleFlecha = document.getElementById('flecha');
    const toggleitinerario = document.getElementById('itinerario');
    const togglecheck = document.getElementById('check');
    //Para poner visitado encima de la foto  
        const visitado = document.querySelector('.visitado');
        const ajusteFoto = document.querySelector('.img-referente1');

    let isFlecha = true;
    let isItinerario = true;
    let isCheck = true;

        toggleFlecha.addEventListener('click', function () {
            isFlecha = !isFlecha;
            toggleFlecha.src = isFlecha ? './assets/icons/flechaBackAzul.png' : './assets/icons/flechaBlanco.png';
        });
        
        toggleitinerario.addEventListener('click', function () {
            isItinerario = !isItinerario;
            toggleitinerario.src = isItinerario ? './assets/icons/agregarItinIconV2.png' : './assets/icons/ubiEnItinerarioIcon.png';
        });
        
        togglecheck.addEventListener('click', function () {
            isCheck = !isCheck;
            togglecheck.src = isCheck ? './assets/icons/checked.png' : './assets/icons/checkedAzul.png';

            visitado.setAttribute('style', isCheck ? 'display: none;' : 'display: flex;');
            ajusteFoto.setAttribute('style', isCheck ? 'align-self: auto;' : 'align-self: self-end;');
        });
});
