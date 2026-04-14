import { mostrarLugares } from "../ARCY-PRUEBAS/places2.js";
import { getInfo, obtenerCoordenadasPorPlaceId, obtenerUnLugarConId, updateHTML } from "./utilidadesMapa.js";
const server = "https://ollin-backend-production.up.railway.app"

export const comprobarSiLugarEstaVisitado = async (placeId) => {
    try {
        const res = await fetch(`${server}/api/lugarVisitado/obtenerLugarVisitadoIdlugar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id_Lugar: placeId,
                id_Turista: nombreUsuario.dataset.idTurista
            })
        });

        const esVisitado = await res.json();

        if(!esVisitado.message){
            cambiarEstado();
        }
    } catch (error) {
        console.error("Error en updateVisitedButtonStatus:", error);
    }
}

export const cambiarEstado = () => {
    const visitadoButton = document.getElementById('check');
    //Temporal: Visitado sobre la imagen
    const visitado = document.querySelector('.visitado');
    const ajusteFoto = document.querySelector('.img-referente1');

    const newSrc ='assets/icons/checkedAzul.png'

    if (visitadoButton) {
        visitadoButton.src = newSrc;
        visitado.setAttribute('style', 'display:flex');
        ajusteFoto.setAttribute('style', 'align-self: self-end;');
    }
}

export const handleVisitedClick = async (e) => {
    e.preventDefault();

    const infoName = document.getElementById("info-name");
    const nombreUsuario = document.getElementById("nombreUsuario");

    const res = await fetch(`${server}/api/lugarVisitado/crearLugarVisitado`, {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            id_Lugar: infoName.dataset.idUbicacion,
            Nombre: infoName.textContent,
            id_Turista: nombreUsuario.dataset.idTurista
        })
    });
    
    const data = await res.json();

    cambiarIcono(data);
};

export const cambiarIcono = (peticion) => {
    const visitado = document.getElementById('check');
    //Temporal: Visitado sobre la imagen
    const visitadoImg = document.querySelector('.visitado');
    const ajusteFoto = document.querySelector('.img-referente1');

    const srcNoVisitado = "assets/icons/checked.png"
    const srcVisitado = "assets/icons/checkedAzul.png"

    if(peticion == "Lugar visitado marcado con éxito"){
        visitado.src = srcVisitado;
    }
    else{
        visitado.src = srcNoVisitado;
        visitadoImg.setAttribute('style', 'display:none');
        ajusteFoto.setAttribute('style', 'align-self: auto;');
    }
}

document.getElementById('check').addEventListener('click', handleVisitedClick);
