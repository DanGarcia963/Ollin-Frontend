import { getUserLocation } from "../ARCY-imports/getUserLocation.js"
import { rutaIti } from "../ARCY-imports/rutas.js"
import { showLoading, hideLoading } from "../ARCY-imports/loading.js"

const API_URL = `${server}/api/lugarItinerario/obtenerLugaresItinerario`;
const API_URL_STATEI = `${server}/api/lugarItinerario/editarEstadoLugarItinerario`;

let mapa;
let directionsService
let directionsRenderer

async function initMap() {
        const userLocation = await getUserLocation();
    const { Map } = await google.maps.importLibrary("maps");
    mapa = new Map(document.getElementById("map"),{
        center:userLocation,
        zoom: 16,
        styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }],
        },
      ],
    });
}


function getTime(originCoords, destCords, mode){
    let directionsService = new google.maps.DirectionsService();
    const request = {
      origin: originCoords,
      destination: destCords,
      travelMode: mode
    }
  
    return new Promise((resolve, reject) => {
      directionsService.route(request, function (response, status) {
        if (status === "OK") {
          const duration = response.routes[0].legs[0].duration.text;
          
          resolve(duration);
        } else {
          console.error('Error', status);
        }
      });
    });
  } 

async function createQueja(TipoQueja, idMuseo) {
    try {
        const response = await fetch(`${server}/api/queja/crearQueja`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ entrada: { 
                Tipo_Queja: TipoQueja, 
                id_Museo: idMuseo } })
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        
    } catch (error) {
        console.error('Error creating queja:', error);
    }
}

// Función para obtener los lugares Itinerario del usuario
async function fetchItineraryPlaces(idPlan) {
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idPlan })
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching LugarItinerario places:', error);
    }
}

async function fetchStateItinerary(idPlanMuseo){
    try{
        const response =await fetch(API_URL_STATEI,{
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({
                id_Plan_Museo: idPlanMuseo,
                Estado: 'V'})
        });
        if(!response.ok)throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    }catch(error){
        console.error('Error fetching LugarItinerario:', error);
    }
}

async function updateItineraryState(idPlan) {
    try {
        const response = await fetch(`${server}/api/itinerario/editarEstadoItinerario`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_Plan: idPlan, Estado: 'F' })
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        
    } catch (error) {
        console.error('Error updating itinerary state:', error);
    }
}

async function fetchStateOItinerary(idPlanMuseo){
    try{
        const response =await fetch(API_URL_STATEI,{
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({
                id_Plan_Museo: idPlanMuseo,
                Estado: 'O'})
        });
        if(!response.ok)throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    }catch(error){
        console.error('Error fetching LugarItinerario:', error);
    }
}

let miDato = document.cookie.split('; ').find(row => row.startsWith('miDato='));
miDato = miDato ? miDato.split('=')[1] : null;


function normalizarHora(value) {
  if (value === null || value === undefined) return null;

  // Convertir a string
  value = String(value).trim();

  // Casos inválidos
  if (!value || value.toLowerCase() === 'null') return null;

  // Caso: "9", "10", "5"
  if (/^\d{1,2}$/.test(value)) {
    const h = value.padStart(2, '0');
    return `${h}:00`;
  }

  // Caso: "9:5", "9:05"
  if (/^\d{1,2}:\d{1,2}$/.test(value)) {
    let [h, m] = value.split(':');
    h = h.padStart(2, '0');
    m = m.padStart(2, '0');
    return `${h}:${m}`;
  }

  // Caso válido: "09:00", "10:30"
  if (/^\d{2}:\d{2}$/.test(value)) {
    return value;
  }

  return null;
}

function obtenerHorarioDelDia(lugar, fechaBase = new Date()) {

  const dias = [
    'Domingo',
    'Lunes',
    'Martes',
    'Miércoles',
    'Jueves',
    'Viernes',
    'Sábado'
  ];

  const diaNombre = dias[fechaBase.getDay()];

  const aperturaRaw = lugar[`HoraApertura_${diaNombre}`];
  const cierreRaw   = lugar[`HoraCierre_${diaNombre}`];

  return {
    dia: diaNombre,
    apertura: normalizarHora(aperturaRaw),
    cierre: normalizarHora(cierreRaw)
  };
}


function sePuedeLlegar(minutosEstimados, horaApertura, horaCierre) {
  const ahora = new Date();

  // Validaciones básicas
  if (!horaApertura || !horaCierre) {
    return {
      puedeLlegar: false,
      suficienteTiempo: false,
      estado: 'SIN_HORARIO',
      mensaje: 'El museo no tiene horario disponible para este día.'
    };
  }
  // Calcular la hora estimada de llegada
  const llegadaEstimada = new Date(ahora.getTime() + minutosEstimados * 60000);

  const [hA, mA] = horaApertura.split(':').map(Number);
  const apertura = new Date();
  apertura.setHours(hA, mA, 0, 0);

  // Crear objeto Date para la hora de cierre (hoy mismo)
  const [horasCierre, minutosCierre] = horaCierre.split(':').map(Number);
  const cierre = new Date();
  cierre.setHours(horasCierre, minutosCierre, 0, 0);

  // Comparar llegada vs cierre
  if (llegadaEstimada >= cierre) {
    return {
      puedeLlegar: false,
      suficienteTiempo: false,
      estado: 'NO_LLEGA',
      mensaje: 'No se puede llegar antes del cierre del museo.'
    };
  }

  // ⏳ Llegas antes de que abra
  if (llegadaEstimada < apertura) {
    const tiempoEsperaMin = (apertura - llegadaEstimada) / 60000;
    const tiempoDisponibleMin = (cierre - apertura) / 60000;

    if (tiempoDisponibleMin < 60) {
      return {
        puedeLlegar: true,
        suficienteTiempo: false,
        estado: 'ESPERA_SIN_TIEMPO',
        mensaje: `Llegarás antes de que abra el museo y, aunque esperes ${Math.floor(tiempoEsperaMin)} minutos, no habrá al menos 1 hora disponible para la visita.`
      };
    }

    return {
      puedeLlegar: true,
      suficienteTiempo: true,
      estado: 'ESPERA',
      mensaje: `Llegarás antes de que abra el museo. Deberás esperar ${Math.floor(tiempoEsperaMin)} minutos para iniciar tu visita.`
    };
  }

  // Verificar si hay al menos 1 hora para recorrer
  const tiempoDisponibleMin = (cierre - llegadaEstimada) / 60000;

  if (tiempoDisponibleMin < 60) {
    return {
      puedeLlegar: true,
      suficienteTiempo: false,
      estado: 'POCO_TIEMPO',
      mensaje: `Se puede llegar antes del cierre, pero solo quedarían ${Math.floor(tiempoDisponibleMin)} minutos para recorrer el museo.`
    };
  }

  return {
    puedeLlegar: true,
    suficienteTiempo: true,
    estado: 'OK',
    mensaje: 'Se puede llegar a tiempo y hay al menos 1 hora disponible para la visita.'
  };
}

function parseDurationToMinutes(durationText) {
    let hours = 0, mins = 0;
    const hMatch = durationText.match(/(\d+)\s*h/);
    const mMatch = durationText.match(/(\d+)\s*min/);
    if (hMatch) hours = parseInt(hMatch[1], 10);
    if (mMatch) mins = parseInt(mMatch[1], 10);
    return hours * 60 + mins;
}

const MostrarValores = async () => {
    try {
        const lugares= await fetchItineraryPlaces(miDato);
        
        if (lugares.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Itinerario Vacío',
                text: '¡Hora de planificar tu próxima aventura!',
                showCancelButton: false,
                confirmButtonText: 'Ir a agregar museos',
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.href = '/Museums';
                }
            });
            return; 
        }
        
        var i=0;
        while(i<=lugares.length){
            const lugaresItinerario = await fetchItineraryPlaces(miDato);
            let lugarInfoS;
        const lugarInicial = lugaresItinerario.find(lugar => lugar['Posición en itinerario'] === i);
        
 
        if (lugarInicial && lugarInicial['Estado Museo']==='S') {
            
            document.getElementById('nombreAventura').textContent = lugarInicial.Plan;           

            const placeId = lugarInicial['ID MUSEO'];
            const lugarInfo = await getInfo(placeId);


            if(i<lugaresItinerario.length-1){
            const lugarSiguiente = lugaresItinerario.find(lugar => lugar['Posición en itinerario'] === i+1);
            const placeIdS = lugarSiguiente['ID MUSEO'];
            
            document.getElementById("btnLlegar").textContent = 'He Llegado';
            lugarInfoS = await getInfo(placeIdS);
            }
            else{
                document.getElementById("btnLlegar").textContent = 'Terminar';
            }
  
            const nombreLugarElement = document.getElementById('nombreLugar');
            nombreLugarElement.textContent = lugarInfo.name;
            nombreLugarElement.dataset.latitud = lugarInfo.coordinates.lat;
            nombreLugarElement.dataset.longitud = lugarInfo.coordinates.lng;
            
            const destinoCoords = {
                lat: lugarInfo.coordinates.lat,
                lng: lugarInfo.coordinates.lng
            };
            const travelMode = lugarInicial['Metodo de transporte'];
            if(i==0)
            {
                
                const NombreLugarOrigen = document.getElementById('nombreLugarOrigen');
                NombreLugarOrigen.textContent = "Tu Ubicacion"
                const coordenadasActualesOrigen = await getUserLocation();
                const duration = await getTime(coordenadasActualesOrigen, destinoCoords, travelMode);
                document.getElementById("length").textContent = duration;
                showLoading("Calculando ruta...");
                try{
                    rutaIti(directionsService, directionsRenderer, coordenadasActualesOrigen, mapa, travelMode);
                }
                catch(e){
                    console.error("Error al calcular ruta:", e);
                    Swal.fire({
                        icon: 'error',
                        title: 'Error al calcular la ruta',
                        text: 'No se pudo calcular la ruta. Por favor, intenta nuevamente.',
                        confirmButtonText: 'Reintentar'
                    }).then(() => {
                        location.reload();
                    });
                }
                finally{
                    hideLoading();
                }
                
                const minutosEstimados = parseDurationToMinutes(duration);
                
                    // Evaluar si se puede llegar
                      const DAYS_MAP = {
                        0: 'Domingo',
                        1: 'Lunes',
                        2: 'Martes',
                        3: 'Miercoles',
                        4: 'Jueves',
                        5: 'Viernes',
                        6: 'Sabado'
                    };
                    const fechaPlan = new Date();
                    const today = DAYS_MAP[fechaPlan.getDay()];
                    const currentMinutes = fechaPlan.getHours() * 60 + fechaPlan.getMinutes();
                    
                    const { dia, apertura, cierre } = obtenerHorarioDelDia(lugarInicial, fechaPlan);
                    
                    const { puedeLlegar, suficienteTiempo, mensaje } = sePuedeLlegar(minutosEstimados, apertura, cierre);


                    // Mostrar alerta si no cabe o si cabe pero poco tiempo
                    if (!puedeLlegar || !suficienteTiempo) {
                    const resp = await Swal.fire({
                        icon: puedeLlegar ? 'warning' : 'error',
                        title: mensaje,
                        text: puedeLlegar
                        ? '¿Deseas continuar de todas maneras o omitir este museo?'
                        : '¿Deseas omitir este museo y continuar?',
                        showDenyButton: true,
                        confirmButtonText: 'Continuar',
                        denyButtonText: 'Omitir museo'
                    });

                    if (resp.isDenied) {
                        await fetchStateOItinerary(lugarInicial['ID']);
                        i++;
                        continue;
                    }
                    // Si confirma, continua normalmente
                    }
                
            }
            
            else{
                
                const lugarAnterior = lugaresItinerario.find(lugar => lugar['Posición en itinerario'] === i-1);
                const placeIdA = lugarAnterior['ID MUSEO'];
                const lugarInfoA = await getInfo(placeIdA);
                const nombreLugarElementA = document.getElementById('nombreLugarOrigen');

                nombreLugarElementA.dataset.latitud = lugarInfoA.coordinates.lat;
                nombreLugarElementA.dataset.longitud = lugarInfoA.coordinates.lng;
                
                if(lugarAnterior['Estado Museo'] === 'O')
                {
                    
                    nombreLugarElementA.textContent= "Tu ubicación";
                    const coordenadasActualesO = await getUserLocation();
                    const duration = await getTime(coordenadasActualesO, destinoCoords, travelMode);
                    document.getElementById("length").textContent = duration;
                    showLoading("Calculando ruta...");
                    try{
                        rutaIti(directionsService, directionsRenderer, coordenadasActualesO, mapa, travelMode);
                    }
                    catch(e){
                        console.error("Error al calcular ruta:", e);
                        Swal.fire({
                            icon: 'error',
                            title: 'Error al calcular la ruta',
                            text: 'No se pudo calcular la ruta. Por favor, intenta nuevamente.',
                            confirmButtonText: 'Reintentar'
                        }).then(() => {
                            location.reload();
                        });
                    }
                    finally{
                        hideLoading();
                    }
                    const minutosEstimados = parseDurationToMinutes(duration);
                    const DAYS_MAP = {
                        0: 'Domingo',
                        1: 'Lunes',
                        2: 'Martes',
                        3: 'Miercoles',
                        4: 'Jueves',
                        5: 'Viernes',
                        6: 'Sabado'
                    };
                        // Evaluar si se puede llegar
                        const fechaPlan = new Date();
                    const today = DAYS_MAP[fechaPlan.getDay()];
                    const currentMinutes = fechaPlan.getHours() * 60 + fechaPlan.getMinutes();
                    
                    const { dia, apertura, cierre } = obtenerHorarioDelDia(lugarInicial, fechaPlan);
                    
                    const { puedeLlegar, suficienteTiempo, mensaje } = sePuedeLlegar(minutosEstimados, apertura, cierre);


                        // Mostrar alerta si no cabe o si cabe pero poco tiempo
                        if (!puedeLlegar || !suficienteTiempo) {
                        const resp = await Swal.fire({
                            icon: puedeLlegar ? 'warning' : 'error',
                            title: mensaje,
                            text: puedeLlegar
                            ? '¿Deseas continuar de todas maneras o omitir este museo?'
                            : '¿Deseas omitir este museo y continuar?',
                            showDenyButton: true,
                            confirmButtonText: 'Continuar',
                            denyButtonText: 'Omitir museo'
                        });

                        if (resp.isDenied) {
                            await fetchStateOItinerary(lugarInicial['ID']);
                            i++;
                            continue;
                        }
                        // Si confirma, continua normalmente
                        }
                    
                }
                else{

                    nombreLugarElementA.textContent=lugarInfoA.name;
                    const coordenadasActuales = {
                        lat: lugarInfoA.coordinates.lat,
                        lng: lugarInfoA.coordinates.lng		
                        }; 
                        const duration = await getTime(coordenadasActuales, destinoCoords, travelMode);
                        document.getElementById("length").textContent = duration;
                        try{
                            rutaIti(directionsService, directionsRenderer, coordenadasActuales, mapa, travelMode);
                        }
                        catch(e){
                            console.error("Error al calcular ruta:", e);
                            Swal.fire({
                                icon: 'error',
                                title: 'Error al calcular la ruta',
                                text: 'No se pudo calcular la ruta. Por favor, intenta nuevamente.',
                                confirmButtonText: 'Reintentar'
                            }).then(() => {
                                location.reload();
                            });
                        }
                        finally{
                            hideLoading();
                        }
                        const minutosEstimados = parseDurationToMinutes(duration);
                        
                        const DAYS_MAP = {
                        0: 'Domingo',
                        1: 'Lunes',
                        2: 'Martes',
                        3: 'Miercoles',
                        4: 'Jueves',
                        5: 'Viernes',
                        6: 'Sabado'
                    };
                            // Evaluar si se puede llegar
                            const fechaPlan = new Date();
                    const today = DAYS_MAP[fechaPlan.getDay()];
                    const currentMinutes = fechaPlan.getHours() * 60 + fechaPlan.getMinutes();
                    
                    const { dia, apertura, cierre } = obtenerHorarioDelDia(lugarInicial, fechaPlan);
                    
                    const { puedeLlegar, suficienteTiempo, mensaje } = sePuedeLlegar(minutosEstimados, apertura, cierre);

                            

                            // Mostrar alerta si no cabe o si cabe pero poco tiempo
                            if (!puedeLlegar || !suficienteTiempo) {
                            const resp = await Swal.fire({
                                icon: puedeLlegar ? 'warning' : 'error',
                                title: mensaje,
                                text: puedeLlegar
                                ? '¿Deseas continuar de todas maneras o omitir este museo?'
                                : '¿Deseas omitir este museo y continuar?',
                                showDenyButton: true,
                                confirmButtonText: 'Continuar',
                                denyButtonText: 'Omitir museo'
                            });

                            if (resp.isDenied) {
                                await fetchStateOItinerary(lugarInicial['ID']);
                                i++;
                                continue;
                            }
                            // Si confirma, continua normalmente
                            }
                        
                        }

            }
            
            
            await ShowDone(lugarInfo.name, lugarInicial['ID'], lugarInfoS && lugarInfoS.name, lugares, lugarInicial['ID MUSEO']);
            i++;
        } else {
            i++;
        }
    }
    } catch (error) {
        console.error('Error en MostrarValores:', error);
    }

}

document.addEventListener('DOMContentLoaded', async function () {
    
    initMap();

    const { DirectionsService, DirectionsRenderer } = await google.maps.importLibrary("routes");
      directionsService = new DirectionsService();
    directionsRenderer = new DirectionsRenderer();
    directionsRenderer.setMap(mapa);

      const drawer = document.getElementById("indicacionesDrawer");
  const toggle = document.getElementById("toggleIndicaciones");
  const closeBtn = document.getElementById("closeIndicaciones");

  if (toggle && drawer) {
    toggle.addEventListener("click", () => {
      drawer.classList.toggle("is-open");
      toggle.innerHTML = drawer.classList.contains("is-open") ? "<span>▶</span>" : "<span>◀</span>";
    });
  }

  if (closeBtn && drawer && toggle) {
    closeBtn.addEventListener("click", () => {
      drawer.classList.remove("is-open");
      toggle.innerHTML = "<span>◀</span>";
    });
  }
    MostrarValores();
});

function distanceInMeters(coord1, coord2) {
  const toRad = deg => deg * Math.PI / 180;
  const R = 6371000; // radio Tierra en metros
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLng = toRad(coord2.lng - coord1.lng);
  const a = Math.sin(dLat/2)**2 +
            Math.cos(toRad(coord1.lat)) * Math.cos(toRad(coord2.lat)) *
            Math.sin(dLng/2)**2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function ShowDone(nombreLugar, IdLugarItinerario, nombreLugarSig, lugares, IDMUSEO){  
    return new Promise(async(resolve)=>{
    let Omitir=document.getElementById("btnOmitir");
    let Llegar=document.getElementById("btnLlegar");
    let Queja=document.getElementById("btnQueja");

    Queja.addEventListener('click', function onQueja() {
        Queja.removeEventListener('click', onQueja);
        Swal.fire({
            title: '¿Qué anomalía encontraste?',
            input: 'select',
            inputOptions: {
                HORARIO_CERRADO_INESPERADO: 'Cerrado cuando debía estar abierto',
                HORARIO_CIERRE_ANTICIPADO: 'Cerró antes de lo indicado',
                EVENTO_ESPECIAL: 'Evento especial / acceso restringido',
                INFORMACION_DESACTUALIZADA: 'Información incorrecta'
            },
                inputPlaceholder: 'Selecciona una opción',
                showCancelButton: true,
                confirmButtonText: 'Reportar',
                confirmButtonColor: "#65B2C6",
                cancelButtonColor: "#D63D6C"
            }).then(async (result) => {
            if (result.isConfirmed) {
                const reporte = result.value;
                // Aquí puedes enviar el reporte al servidor o manejarlo como necesites
                
                await createQueja(result.value, IDMUSEO);
                Swal.fire('¡Gracias por tu reporte!', 'Lo revisaremos lo antes posible.', 'success');
            }
        });
    }, { once: true });



    Omitir.addEventListener('click',function onOmitir(){
        Omitir.removeEventListener('click', onOmitir);
        window.location.href="/aventuras_proximas";
        resolve();
    }, { once: true });

Llegar.addEventListener('click',function onLlegar(){
    
    if(nombreLugar && nombreLugarSig){
    Swal.fire({
    title: `¿Haz llegado a ${nombreLugar} ?`,
    text: `¿Deseas continuar con el siguiente lugar: ${nombreLugarSig}?`,
    icon:"success",
    showCancelButton: true,
    confirmButtonColor: "#65B2C6",
    cancelButtonColor: "#D63D6C",
    confirmButtonText: "LLegar",
    cancelButtonText: "Omitir",
}).then(async(result) => {
    if (result.isConfirmed) {
        console.time('visit-museum');
        const LugarModifiedV = await fetchStateItinerary(IdLugarItinerario);
        console.timeEnd('visit-museum');
        
        resolve();
    }
    else {
        Swal.fire({
            icon: "info",
            title: `¿Deseas omitir ${nombreLugar} de tu aventura?`, 
            text: `Esta accion omitira este lugar de la aventura y se continuara con ${nombreLugarSig}`,
            showCancelButton: true,
            confirmButtonColor: "#65B2C6",
            cancelButtonColor: "#D63D6C",
            confirmButtonText: "Omitir",
            cancelButtonText: "Cancelar"
        }).then(async(result1)=>{
            if(result1.isConfirmed){
                console.time('omit-museum');
                const LugarModified = await fetchStateOItinerary(IdLugarItinerario);
                console.timeEnd('omit-museum');
                
                resolve();
            }
        });
    }
});
}
else{
    Swal.fire({
        title: `¿Haz llegado a ${nombreLugar} ?`,
        text: `Este es el ultimo lugar de la aventura`,
        icon:"success",
        showCancelButton: true,
        confirmButtonColor: "#65B2C6",
        cancelButtonColor: "#D63D6C",
        confirmButtonText: "LLegar",
        cancelButtonText: "Omitir"
    }).then(async(result) => {
        if (result.isConfirmed) {
            const LugarModifiedV = await fetchStateItinerary(IdLugarItinerario);
            
            resolve();
            //console.log("Adventures info: ",lugares)
            var i=0;
    
            
            
            const lugarDes = lugares.find(lugar => lugar['Posición en itinerario'] === 0);
            const lugarActualizados = await fetchItineraryPlaces(lugarDes['ID Plan']);


            while(i<=lugares.length-1)
            {

                const lugarAct=lugarActualizados.find(lugar => lugar['Posición en itinerario'] === i);

                if(lugarAct['Estado Museo']!=='S')
                {
                    if(i===lugarActualizados.length-1)
                    {
                        
                        const StateItinerary = await updateItineraryState(lugarAct['ID Plan']);
                                             
                        break;
                    }
                }
                else{
                    
                    break;
                }
                i++;
            }
            Swal.fire({
                icon: "success",
                title: `Tu Aventura "${lugarDes['Plan']}" ha llegado a su fin `, 
                showConfirmButton: true,
                confirmButtonColor: "#65B2C6",
            }).then((result)=>{
                window.location.href="/aventuras_proximas";
            });

            
        }
        else{
            Swal.fire({
                icon: "info",
                title: `¿Deseas omitir ${nombreLugar} de tu aventura?`, 
                text: `Este es el ultimo lugar de la aventura`,
                showCancelButton: true,
                confirmButtonColor: "#65B2C6",
                cancelButtonColor: "#D63D6C",
                confirmButtonText: "Omitir",
                cancelButtonText: "Cancelar"
            }).then(async(result)=>{
                if(result.isConfirmed){
                    const LugarModified = await fetchStateOItinerary(IdLugarItinerario);
                    
                    resolve();

                    var i=0;
    
                    
                    
                    const lugarDes = lugares.find(lugar => lugar['Posición en itinerario'] === 0);
                    const lugarActualizados = await fetchItineraryPlaces(lugarDes['ID Plan']);
                    while(i<=lugares.length-1)
                    {
        
                        const lugarAct=lugarActualizados.find(lugar => lugar['Posición en itinerario'] === i);
 
                        if(lugarAct['Estado Museo']!=='S')
                        {
                            if(i===lugarActualizados.length-1)
                            {
                                
                                const StateItinerary = await updateItineraryState(lugarAct['ID Plan']);
                                                      
                                
                                break;
                            }
                        }
                        i++;
                    }
                    Swal.fire({
                        icon: "success",
                        title: `Tu Plan de Visita "${lugarDes['Plan']}" ha llegado a su fin `, 
                        showConfirmButton: true,
                        confirmButtonColor: "#65B2C6",
                    }).then((result)=>{
                        window.location.href="/aventuras_proximas";
                    });
                }
            });
        }
    });
}
}, { once: true });
});
}

function eliminarCookie(cookieName) {
    document.cookie = cookieName + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
}

async function getInfo(placeId) {
    

    const { Place } = await google.maps.importLibrary('places');
    const place = new Place({ id: placeId, requestedLanguage: 'es' });

    await place.fetchFields({
        fields: [
            'displayName',
            'formattedAddress',
            'rating',
            'regularOpeningHours',
            'internationalPhoneNumber',
            'reviews',
            'photos',
            'types',
            'location' 
        ]
    });

    const imgWidth = 1000;
    const imgHeight = 1000;
    const photoUrls = place.photos
        ? place.photos.map(photo =>
            photo.getURI({ maxHeight: imgHeight, maxWidth: imgWidth })
        )
        : null;


    const lat = place.location?.lat();
    const lng = place.location?.lng();

    if (lat === undefined || lng === undefined) {
        console.warn('No se pudo obtener coordenadas para el lugar:', place);
    }

    return {
        name: place.displayName,
        type: place.types,
        placeID: place.id,
        address: place.formattedAddress,
        rating: place.rating,
        opening_hours: place.regularOpeningHours?.weekdayText || null,
        phone_number: place.internationalPhoneNumber || place.nationalPhoneNumber,
        reviews: place.reviews?.length ? place.reviews : null,
        photoUrls,
        coordinates: {
            lat,
            lng
        }
    };
}

