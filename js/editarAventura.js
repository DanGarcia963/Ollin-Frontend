import { calcDistTime } from "./routesEditAdvn.js";
import { getIndividualDistTime } from "./dragNdrop.js";
import { updateItemDurationDistance } from "./dragNdrop.js";
//const server = "https://ollin-backend-production.up.railway.app"

let geocoder;
function editarAventura(lugares,userCoords,durations){
    let modeTravel;
    let idDeleted=[];
    const directionsService = new google.maps.DirectionsService();
    // Cuando se quiere eliminar un lugar
    document.addEventListener("click", function (event) {
        const dropdown = event.target.closest('.dropdown');
        if (dropdown) {
            //Para cada selector de transporte
                let dropdown=event.target.closest('.dropdown');
                let select = dropdown.querySelector('.btn-transport-selected');
                let imgSelected = select.querySelector('.transport-img');
                let arrow = dropdown.querySelector('.arrow');
                let menu = dropdown.querySelector('.content-dropdown')
                let options = dropdown.querySelectorAll('.content-dropdown button')
                
                if(select){
                    if (menu.style.display === 'none' || menu.style.display === '') {
                        select.style.borderBottomLeftRadius = "0px";
                        select.style.borderBottomRightRadius = "0px";
                        arrow.style.transform="rotate(180deg)";
                        menu.style.display = 'block';
                    } else {
                        select.style.borderBottomLeftRadius = "10px";
                        select.style.borderBottomRightRadius = "10px";
                        arrow.style.transform="rotate(360deg)";
                        menu.style.display = 'none';
                    }
                }
                options.forEach((option)=>{
                    option.addEventListener('click',async()=>{
                        let imgOption = option.querySelector('.transport-img');
                        const listItem = option.closest("li"); // Para recuperar el id del cual fue modificado el transporte
                        if(imgSelected.src !== imgOption.src){
                            // Cambia de icono
                            imgSelected.src = imgOption.src
                            
                            //Recalcular el tiempo de llegada
                            if(listItem.id == 0){ //Primer elemento actual en lista+
                                //Distancia y tiempo respecto a la ubicación del usuario
                                let dtFirst = await getIndividualDistTime(userCoords, listItem.getAttribute('data-id-ubicacion'), imgSelected.src, directionsService)
                                let duration = dtFirst.duration
                                //Para modificar la duracion total y la del item
                                durations[0]=duration
                                updateDuracionTotal(durations)
                                updateItemDuration(listItem,duration)
                                console.log(durations)
                            }else{
                                let previusItemId=parseInt(listItem.id)-1
                                let previusItem = document.getElementById(previusItemId.toString())
                                console.log(previusItem)
                                //Distancia y tiempo respecto al item anterior
                                let dtAnother = await getIndividualDistTime(previusItem.getAttribute('data-id-ubicacion'), listItem.getAttribute('data-id-ubicacion'), imgSelected.src, directionsService)
                                let duration = dtAnother.duration
                                //Para modificar la duracion total y la del item
                                durations[parseInt(listItem.id)]=duration
                                updateDuracionTotal(durations)
                                updateItemDuration(listItem,duration)
                                console.log(durations)
                            }
                        }
                    })
                })           
        }

        // Si fue en el boton de eliminar
        if (event.target.id === "eliminar") {
            // Para recuperar el id del lugar que se quiere borrar
            const listItem = event.target.closest("li");
            Swal.fire({
                title: "¿Estás seguro?",
                text: "Esta accion borrará este lugar del itinerario",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#65B2C6",
                cancelButtonColor: "#D63D6C",
                confirmButtonText: "Estoy seguro",
                cancelButtonText: "Regresar"
            }).then(async(result) => {
                if (result.isConfirmed) {
                    let auxlistItemID //Para los calculos del que ocupara su lugar
                    if (listItem) {
                        idDeleted.push(listItem.dataset.ili);
                        auxlistItemID=listItem.id
                    }
                    console.log(idDeleted)
                    //Borrando el item
                    listItem.remove();

                    let listaElementos = document.querySelectorAll('.column li');
                    //Reasignando los ids segun su posicion en lista
                    listaElementos.forEach((elemento, index) => {
                        elemento.id = `${index}`;
                    });

                    //Borrando de durations la duracion del item borrado
                    durations.splice(parseInt(auxlistItemID),1)
                    //Recalculando tiempo y distancia del que ocupa su lugar respecto al anterior
                    let replaceItem = document.getElementById(auxlistItemID)
                    if(replaceItem){ //Si la lista no se quedó vacía o se elimino algun item antes del de la ultima posicion
                        let select = replaceItem.querySelector('.btn-transport-selected');
                        let imgSelected = select.querySelector('.transport-img');
                        console.log(imgSelected)
                        if(auxlistItemID === '0'){
                            //Calcula distancia y tiempo desde la ubicacion del usuario
                            let dtFirst = await getIndividualDistTime(userCoords, replaceItem.getAttribute('data-id-ubicacion'), imgSelected.src, directionsService)
                            let distance = dtFirst.distance
                            let duration = dtFirst.duration
                            //Para modificar la duracion total y la del item
                            durations[0]=duration
                            updateDuracionTotal(durations)
                            updateItemDurationDistance(replaceItem,duration,distance)
                            console.log(durations)
                        }else{
                            let previusItemId=parseInt(auxlistItemID)-1
                            let previusItem = document.getElementById(previusItemId.toString())
                            console.log(previusItem)
                            //Distancia y tiempo respecto al item anterior
                            let dtAnother = await getIndividualDistTime(previusItem.getAttribute('data-id-ubicacion'), replaceItem.getAttribute('data-id-ubicacion'), imgSelected.src, directionsService)
                            let distance = dtAnother.distance
                            let duration = dtAnother.duration
                            //Para modificar la duracion total y la del item
                            durations[parseInt(auxlistItemID)]=duration
                            updateDuracionTotal(durations)
                            updateItemDurationDistance(replaceItem,duration,distance)
                            console.log(durations)
                        }
                    }else{
                        let previusItemId=parseInt(auxlistItemID)-1
                        let previusItem = document.getElementById(previusItemId.toString())
                        if(previusItem){    //Si se eliminó el item con la ultima posicion
                            updateDuracionTotal(durations)
                            console.log(durations)
                        }else{  //Se elimino el ultimo item en la lista
                            updateDuracionTotal(['0 min'])
                            console.log(durations)
                            document.getElementById('placesList').remove();
                            let bigCont = document.querySelector('.kanban');
                            let contMessage = document.createElement("div");
                            contMessage.className="message";
                            bigCont.appendChild(contMessage);
                            contMessage.innerHTML = `
                            <div class="no-favorites-message">
                                <p>Ya no hay lugares en la aventura. <b>Guarda los cambios</b> o <b>Cancelalos</b></p>
                            </div>
                            `;
                        }
                    }

                    Swal.fire({
                        title: "¡Eliminado!",
                        text: "Puedes deshacer este y otros cambios al presionar el botón Cancelar",
                        icon: "success",
                        confirmButtonColor: "#65B2C6"
                    });
                }/*else{
                    Swal.fire({
                        title: "Error",
                        text: "No se pudo borrar el lugar del itinerario",
                        icon: "error",
                        confirmButtonColor: "#65B2C6"
                    });
                }*/
            });
        }
        
    });

    const save = document.getElementById('btnSave');
    save.addEventListener('click', function() {
        const lugaresEditados=[]
        const items = document.querySelectorAll('.item')
        let modeTravel;
        items.forEach((item)=>{
            const transport=item.querySelector('.transport-img')
            const name=item.querySelector('.info-name')
            const ili=item.dataset.ili;
            switch(transport.src.split('/').pop()){
                case 'cocheIcon.png': modeTravel='DRIVING';
                    break;
                case 'caminandoIcon.png': modeTravel='WALKING';
                    break;
                case 'bicicletaIcon.png': modeTravel='BICYCLING';
                    break
                case 'busIcon.png': modeTravel='TRANSIT';
                    break
                default: break;
            }
            const infoItem={
                id_Plan_Museo: ili,
                MetodoTransporte:modeTravel,
                Posicion:item.id  
            }
            lugaresEditados.push(infoItem)
        })
        console.log("lugares Editados:", lugaresEditados)
        lugaresEditados.forEach(async (lugarEditado)=>{
            await fetchEditIti(lugarEditado);
        })
        let messageD;
        idDeleted.forEach(async (deleted)=>{
            messageD=await fetchDelete(deleted);
        })    
        Swal.fire({
            title: "¡Cambios guardados!",
            //text: messageD['message'],
            icon: "success",
            confirmButtonColor: "#65B2C6"
        }).then((result) => {
            // Si el usuario hizo clic en el botón de confirmación
            if (result.isConfirmed) {
                window.location.href = "/aventuras_proximas";
            }
        });
    });

};

export {editarAventura}

async function fetchDelete(id_lugar_iti_d){
    try {
        const response = await fetch(`${server}/api/lugarItinerario/eliminarLugarItinerario`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({id_Lugar_Itinerario: `${id_lugar_iti_d}`})
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching delete adventure places:', error);
    }
}

async function fetchEditIti(lugarEditado){
    try {
        const response = await fetch(`${server}/api/lugarItinerario/editarLugarItinerario`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(lugarEditado)
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching delete adventure places:', error);
    }
}
/*
function calcDistTime(directionsService, request){
    return new Promise((resolve,reject) => {
        directionsService.route(request, (response, status) => {
        if (status === 'OK') {
            resolve(response);
        } else {
            reject(status);
        }
        });
    })
}*/

function toMinutes(timeStr) {
    const parts = timeStr.split(' ');
    let totalMins = 0;

    for (let i = 0; i < parts.length; i += 2) {
        if (parts[i + 1] === 'h') {
            totalMins += parseInt(parts[i]) * 60;
        } else if (parts[i + 1] === 'min') {
            totalMins += parseInt(parts[i]);
        }
    }

    return totalMins;
}

function toHours(arrayDeTiempos) {
    const totalMinutos = arrayDeTiempos.reduce((total, tiempo) => {
        const minutos = toMinutes(tiempo);
        return total + minutos;
    }, 0);
    const horas = Math.floor(totalMinutos / 60);
    const minutosRestantes = totalMinutos % 60;
    const cadenaDeTiempo = `${horas} h ${minutosRestantes} min`;
    return cadenaDeTiempo;
}

function updateDuracionTotal(array){
    console.log(array)
    document.getElementById("duracionTotal").innerHTML = toHours(array);
}

function updateItemDuration(listItem,duration){
    var divTimeInfo = listItem.querySelector('#timeInfo');
    divTimeInfo.textContent='Aprox. '+duration
}

