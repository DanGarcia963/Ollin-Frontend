import { calcDistTime } from "./routesEditAdvn.js"
import {toMinutes} from "./routesEditAdvn.js"
import {toHours} from "./routesEditAdvn.js"
import {updateDuracionTotal} from "./routesEditAdvn.js"
import {PlaceIdToCoords} from "./routesEditAdvn.js"
class DragNDropEmitter {
  constructor() {
    this.listeners = new Set();
  }

  onDragEnd(listener) {
    this.listeners.add(listener);
  }

  emitDragEnd(data) {
    this.listeners.forEach(listener => listener(data));
  }
}

//document.addEventListener('DOMContentLoaded', function () {
function dragNdrop(posicionItinerario,ids,userCoords,durations){
  const dragNDropEmitter = new DragNDropEmitter();
  const directionsService = new google.maps.DirectionsService();
  let listIds=[] //Se llena luego de cambiar de posición algun item
  let previusListIds=ids; // Primero en el orden original
  let draggItemIDstart; //id del que se esta moviendo (al inicio del drag)
  let draggItemIDend; //id del que se esta moviendo (al finalizar el drag)

    const columns = document.querySelectorAll(".column");
    const placeAbout = document.querySelectorAll('.place-about');
    console.log('posicionPrimero'+posicionItinerario)
    placeAbout.forEach((place)=>{
      // Agregar evento dragstart al contenedor
    place.addEventListener('dragstart', function (e) {
      // Agregar la clase "dragging" al elemento padre (el <li>)
      this.closest('.item').classList.add('dragging');
      draggItemIDstart = this.closest('.item').id
      console.log(draggItemIDstart)
    });

    // Agregar evento dragend al contenedor
    place.addEventListener('dragend',async function () {
      let listaElementos = document.querySelectorAll('.column li');
      listaElementos.forEach((elemento, index) => {
          elemento.id = `${index+posicionItinerario}`;
          listIds.push(elemento.getAttribute('data-id-ubicacion'))
      });
      // Quitar la clase "dragging" al elemento padre (el <li>)
      let dragged = this.closest('.item')
      draggItemIDend = dragged.id
      this.closest('.item').classList.remove('dragging');
      if(!sameOrder(previusListIds,listIds)){
        console.log(previusListIds)
        console.log(listIds)
        dragNDropEmitter.emitDragEnd(['hola1','hola']);

          
        if(parseInt(draggItemIDstart) > parseInt(draggItemIDend)){
          //Si se movio hacia arriba
          console.log('de '+draggItemIDstart+' a '+draggItemIDend)
          //Recorrer durations que no van a cambiar pero sus items fueron recorridos en el cambio de posicion (i=start-1 i>=end+1 i--)
          //durations[i+1]=durations[i]
          for(let i=parseInt(draggItemIDstart)-1; i>=parseInt(draggItemIDend)+1; i--){
            durations[i+1]=durations[i]
          }
          //Si el item con id=start+1 no existe, arrastrado era el ultimo
          //Es decir, si start+1===tamaño ids=tamaño lista
          let distanceEnd
          let durationEnd
          let distanceEndP1
          let durationEndP1
          let distanceAfterS
          let durationAfterS
          //Caso general
          //==El dragged o end==//
          let itemIDbefore=parseInt(draggItemIDend)-1
          let beforeDragged = document.getElementById(itemIDbefore.toString())
          console.log(beforeDragged)
          console.log(dragged)
          // Para el metodo de transporte
          const draggedBtnTransportSelected = dragged.querySelector('.btn-transport-selected');
          const draggedTransportImg = draggedBtnTransportSelected.querySelector('.transport-img');
          //console.log(draggedTransportImg.src) 
          if(beforeDragged===null){ //dragged se puso al inicio de la lista
            let dtEnd = await getIndividualDistTime(userCoords,dragged.getAttribute('data-id-ubicacion'),draggedTransportImg.src,directionsService)
            distanceEnd = dtEnd.distance
            durationEnd = dtEnd.duration
          }else{
            let dtEnd = await getIndividualDistTime(beforeDragged.getAttribute('data-id-ubicacion'),dragged.getAttribute('data-id-ubicacion'),draggedTransportImg.src,directionsService)
            distanceEnd = dtEnd.distance
            durationEnd = dtEnd.duration
          }
          //Primer duration afectado
          durations[parseInt(draggItemIDend)]=durationEnd
          updateItemDurationDistance(dragged,durationEnd,distanceEnd)

          //==El que sigue a dragged==
          let itemIDafter=parseInt(draggItemIDend)+1
          let afterDragged = document.getElementById(itemIDafter.toString())
          console.log(dragged)
          console.log(afterDragged)
          //Para el metodo de transporte
          const afterDraggedBtnTransportSelected = afterDragged.querySelector('.btn-transport-selected');
          const afterDraggedTransportImg = afterDraggedBtnTransportSelected.querySelector('.transport-img');
          
          let dtEndP1 = await getIndividualDistTime(dragged.getAttribute('data-id-ubicacion'),afterDragged.getAttribute('data-id-ubicacion'),afterDraggedTransportImg.src,directionsService)
          distanceEndP1 = dtEndP1.distance
          durationEndP1 = dtEndP1.duration
          //Segundo duration afectado
          durations[parseInt(draggItemIDend)+1]=durationEndP1
          updateItemDurationDistance(afterDragged,durationEndP1,distanceEndP1)

          //==Despues del hueco/start==
          let Start = document.getElementById(draggItemIDstart)
          let itemIDafterStart=parseInt(draggItemIDstart)+1
          let afterStart = document.getElementById(itemIDafterStart.toString())
          console.log(Start)
          console.log(afterStart)
          if(afterStart!==null){//no se tomó del final de la lista
            const afterStartBtnTransportSelected = afterStart.querySelector('.btn-transport-selected');
            const afterStartTransportImg = afterStartBtnTransportSelected.querySelector('.transport-img');
            let dtAS = await getIndividualDistTime(Start.getAttribute('data-id-ubicacion'),afterStart.getAttribute('data-id-ubicacion'),afterStartTransportImg.src,directionsService)
            distanceAfterS = dtAS.distance
            durationAfterS = dtAS.duration

            //Ultimo duration afectado
            durations[parseInt(draggItemIDstart)+1]=durationAfterS
            updateItemDurationDistance(afterStart,durationAfterS,distanceAfterS)
          }
          
          console.log('end: '+ draggItemIDend+' end+1: '+(parseInt(draggItemIDend)+1)+' start+1: '+(parseInt(draggItemIDstart)+1))
          //Sustituir durations afectados
          /*durations[parseInt(draggItemIDend)]=durationEnd
          durations[parseInt(draggItemIDend)+1]=durationEndP1
          durations[parseInt(draggItemIDstart)+1]=durationAdterS*/
          console.log('se movio hacia arriba')
          console.log(durations)
          updateDuracionTotal(durations)

        }else if(parseInt(draggItemIDstart) < parseInt(draggItemIDend)){
          //Si se movio hacia abajo
          console.log('de '+draggItemIDstart+' a '+draggItemIDend)
          //Recorrer durations que no cambiaron pero sus items fueron recorridos (i=start+2 i<=end i++)
          //durations[i-1]=durations[i]
          for(let i=parseInt(draggItemIDstart)+2; i<=parseInt(draggItemIDend); i++){
            durations[i-1]=durations[i]
          }
          let distanceEnd
          let durationEnd
          let distanceEndP1
          let durationEndP1
          let distanceStart
          let durationStart
          //==Para el hueco/start==
          let itemIDbeforeStart=parseInt(draggItemIDstart)-1
          let beforeStart = document.getElementById(itemIDbeforeStart.toString())
          let Start = document.getElementById(draggItemIDstart)
          console.log(beforeStart)
          console.log(Start)
          // Para el metodo de transporte
          const startBtnTransportSelected = Start.querySelector('.btn-transport-selected');
          const startTransportImg = startBtnTransportSelected.querySelector('.transport-img');
          if(beforeStart===null){//se tomo del inicio de la lista
            let dtStart = await getIndividualDistTime(userCoords,Start.getAttribute('data-id-ubicacion'),startTransportImg.src,directionsService)
            distanceStart = dtStart.distance
            durationStart = dtStart.duration
          }else{
            let dtStart = await getIndividualDistTime(beforeStart.getAttribute('data-id-ubicacion'),Start.getAttribute('data-id-ubicacion'),startTransportImg.src,directionsService)
            distanceStart = dtStart.distance
            durationStart = dtStart.duration
          }
          //Primer duration afectado
          durations[parseInt(draggItemIDstart)]=durationStart
          updateItemDurationDistance(Start,durationStart,distanceStart)

          //==Para el dragged/end==
          let itemIDbefore=parseInt(draggItemIDend)-1
          let beforeDragged = document.getElementById(itemIDbefore.toString())
          console.log(beforeDragged)
          console.log(dragged)
          // Para el metodo de transporte
          const draggedBtnTransportSelected = dragged.querySelector('.btn-transport-selected');
          const draggedTransportImg = draggedBtnTransportSelected.querySelector('.transport-img');
          //console.log(draggedTransportImg.src) 
          let dtEnd = await getIndividualDistTime(beforeDragged.getAttribute('data-id-ubicacion'),dragged.getAttribute('data-id-ubicacion'),draggedTransportImg.src,directionsService)
          distanceEnd = dtEnd.distance
          durationEnd = dtEnd.duration
          //Segundo duration afectado
          durations[parseInt(draggItemIDend)]=durationEnd
          updateItemDurationDistance(dragged,durationEnd,distanceEnd)

          //==Para el despues del dragged==
          let itemIDafter=parseInt(draggItemIDend)+1
          let afterDragged = document.getElementById(itemIDafter.toString())
          console.log(dragged)
          console.log(afterDragged)
          if(afterDragged!==null){//no se coloco al final de la lista
            //Para el metodo de transporte
            const afterDraggedBtnTransportSelected = afterDragged.querySelector('.btn-transport-selected');
            const afterDraggedTransportImg = afterDraggedBtnTransportSelected.querySelector('.transport-img');

            let dtEndP1 = await getIndividualDistTime(dragged.getAttribute('data-id-ubicacion'),afterDragged.getAttribute('data-id-ubicacion'),afterDraggedTransportImg.src,directionsService)
            distanceEndP1 = dtEndP1.distance
            durationEndP1 = dtEndP1.duration
            //Ultimo duration afectado
            durations[parseInt(draggItemIDend)+1]=durationEndP1
            updateItemDurationDistance(afterDragged,durationEndP1,distanceEndP1)
          }
          

          //Cambiar durations en los indices afectados
          console.log('start: '+ parseInt(draggItemIDstart)+' end: '+(parseInt(draggItemIDend))+' end+1: '+(parseInt(draggItemIDend)+1))
          console.log('se movio hacia abajo')
          console.log(durations)
          updateDuracionTotal(durations)
        }
        
        
          console.log(dragged)

        previusListIds=listIds
        console.log(previusListIds)
        
      }
      listIds=[] //Para un siguiente cambio de posicion
    });

  });


    columns.forEach((item) => {
      item.addEventListener("dragover", (e) => {
          const dragging = document.querySelector(".dragging");
          const applyAfter = getNewPosition(item, e.clientY);
          if (applyAfter) {
              applyAfter.insertAdjacentElement("afterend", dragging);
          }else{
            item.prepend(dragging)
          }
      });
    });
    return dragNDropEmitter;
}
    export{dragNdrop};
//})

function getNewPosition(column, posY) {
  const cards = column.querySelectorAll(".item:not(.dragging)");
    let result;
    let lastNonDraggable = null;
    for (let refer_card of cards) {
        const contInfo = refer_card.querySelector('.place-about')
        const isDraggable = contInfo.getAttribute('draggable') !== 'false';
        const box = refer_card.getBoundingClientRect();
        const boxCenterY = box.y + box.height / 2;
        if (!isDraggable) {
            // Si el elemento no es draggable, actualiza lastNonDraggable
            lastNonDraggable = refer_card;
        }
        if (posY >= boxCenterY && isDraggable) {
            // Si es draggable y la posición es adecuada, asigna a result
            result = refer_card;
          
        }
    }
    // Si no hay elementos draggable, el resultado es null
    if (!result && lastNonDraggable) {
        result = lastNonDraggable;
    }
    return result;
}

function sameOrder(ids, listIds) {
  if (ids.length !== listIds.length) {
    return false;
  }
  return ids.every((element, i) => {
    return element === listIds[i];
  });
}

function getTravelMode(src){
  let imgName = src.split('/').pop(); 
  switch(imgName){
    case 'cocheIcon.png': return 'DRIVING';
    case 'caminandoIcon.png': return 'WALKING';
    case 'bicicletaIcon.png': return 'BICYCLING';
    case 'busIcon.png': return 'TRANSIT';
    default: return null;
  }
}

export async function getIndividualDistTime(origin,dest,imgSrc,directionsService){
  const travelMode = getTravelMode(imgSrc)
  let request
  if(origin.hasOwnProperty('lat') && origin.hasOwnProperty('lng')){
    request = {
      origin: { location: origin },
      destination: { placeId: dest },
      travelMode: travelMode, 
    };
  }else{
    request = {
      origin: { placeId: origin },
      destination: { placeId: dest },
      travelMode: travelMode, 
    };
  }
  console.log(origin)
  console.log(travelMode)
  console.log('destino: '+dest)
  try{
      const response = await calcDistTime(directionsService,request)
      const leg = response.routes[0].legs[0];
      let distance = leg.distance.text;
      let duration = leg.duration.text;
      console.log(`Distancia entre el punto ${origin} y ${dest}: ${distance}`);
      console.log(`Duración entre el punto ${origin} y ${dest}: ${duration}`);
      return {distance: distance, duration: duration}
  }catch(error){
      window.alert(`No se pudo trazar la ruta entre el punto ${origin} y ${dest} debido a ${error}`);
      return {distance: 'error', duration: 'error'}
  }
}

export function updateItemDurationDistance(listItem,duration,distance){
  var divTimeInfo = listItem.querySelector('#timeInfo');
  divTimeInfo.textContent='Aprox. '+duration
  var divDistInfo = listItem.querySelector('#distanceInfo');
  divDistInfo.textContent=distance
}
