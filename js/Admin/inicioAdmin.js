async function fetchLoadUsers() {
  try {
      const response = await fetch(`${server}/api/usuarioTurista`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
  } catch (error) {
      console.error('Error fetching users:', error);
  }
}

async function fetchLoadQuejasMuseos() {
  try {
      const response = await fetch(`${server}/api/queja`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
  } catch (error) {
      console.error('Error fetching complaints:', error);
  }
}

async function fetchRecommendedMuseums() {
    try {
        const response = await fetch(`${server}/api/lugarVisitado/recomendarMuseos`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching recommended museums:', error);
    }   
}

async function getPhotos(placeId) {
    const { Place } = await google.maps.importLibrary('places');
    const place = new Place({ id: placeId, requestedLanguage: 'es' });
    await place.fetchFields({
      fields: ['photos']
    });
    const imgWidth = 1000;
    const imgHeight = 1000;
    const photoUrls = place.photos
      ? place.photos.map(photo =>
          photo.getURI({ maxHeight: imgHeight, maxWidth: imgWidth })
        )
      : null;
    return {
      photoUrls,
    };
}

document.addEventListener('DOMContentLoaded', async function() {
  const allUsers = await fetchLoadUsers() || [];
  const quejasMuseos = await fetchLoadQuejasMuseos() || [];
  const recommendedMuseums = await fetchRecommendedMuseums() || [];

  const usersList = document.getElementById('users-list');
  const quejasList = document.getElementById('complaints-list');
  const museumsList = document.getElementById('museum-card-template');

  usersList.innerHTML = ''; 
  quejasList.innerHTML = ''; 
  museumsList.innerHTML = ''; 

recommendedMuseums.forEach(async museum => {
    const div = document.createElement('div');
    
    // Aquí está el cambio clave: quitamos md:w-full y dejamos un ancho fijo (w-48 o w-56) hasta llegar a pantallas grandes (lg:w-full)
    div.className = 'bg-white w-48 sm:w-56 lg:w-full shrink-0 lg:shrink rounded-xl p-3 hover:scale-105 transition cursor-pointer flex flex-col justify-between';
    
    div.innerHTML = `
        <img src="${museum.Imagenes?.[0] || 'assets/icons/museum_icon.png'}"
             alt="${museum.NombreMuseo}" 
             class="w-full h-32 lg:h-36 object-cover rounded-lg">
        <div class="flex flex-row items-start lg:items-center justify-start lg:justify-center gap-2 mt-3">
            <img src="assets/icons/museum_icon.png" alt="museum" class="w-4 h-4 mt-0.5 lg:mt-0 shrink-0">
            <h5 class="class="text-xs font-semibold lg:text-sm font-semibold leading-tight text-white drop-shadow-sm">
                ${museum.NombreMuseo}
            </h5>
        </div>
    `;
    museumsList.appendChild(div);
  });

  quejasMuseos.forEach(queja => {
    if (queja.tiene_quejas === true) {
      const div = document.createElement('div');
      // Mejoramos la responsividad interna de las tarjetas
      div.className = `
        flex flex-row items-center justify-between
        bg-white lg:bg-transparent border border-gray-100 lg:border-none 
        rounded-xl p-3 shadow-sm hover:bg-gray-50 transition w-full
      `;

      const tipo = queja.Tipo_Queja?.[0] || "Sin detalles";

      div.innerHTML = `
        <div class="flex flex-row items-center gap-3 w-full overflow-hidden">
          <img src="../assets/icons/museum_icon.PNG" class="w-10 h-10 lg:w-12 lg:h-12 rounded-lg object-cover shrink-0" alt="museum">
          <div class="flex flex-col min-w-0 flex-1">
            <p class="font-medium text-gray-800 text-xs sm:text-sm leading-tight truncate">
              ${queja.NombreMuseo}
            </p>
            <p class="text-gray-500 text-[10px] sm:text-xs truncate">
              ${tipo}
            </p>
          </div>
        </div>
        <div class="flex flex-col items-end shrink-0 ml-2">
          <span class="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap">
            ${queja.total_quejas_ultimo_mes}
          </span>
        </div>
      `;
      quejasList.appendChild(div);
    }
  });

  allUsers.forEach(user => {
    const li = document.createElement('li');
    li.className = "flex items-center space-x-3 bg-white lg:bg-transparent p-2 lg:p-0 rounded-lg shadow-sm lg:shadow-none";
    li.innerHTML = `
      <span class="shrink-0">
        <img src="../assets/icons/Perfil.PNG" class="h-8 w-8 object-cover rounded-full bg-gray-200" alt="Perfil">
      </span>
      <span class="text-sm font-medium text-gray-700 truncate">${user.Nombre} ${user.Apellido}</span>
    `;
    usersList.appendChild(li);
  });

// ==========================================
  // EVENTOS PARA EJECUTAR SCRIPTS DE PYTHON
  // ==========================================

// Variables globales para controlar los intervalos
  let intervaloMuseos;
  let intervaloEventos;

  // 1. Botón para actualizar museos
  document.getElementById("btn-actualizar").addEventListener("click", async () => {
    try {
      Swal.fire({
        icon: 'info', title: 'Iniciando...', text: 'Arrancando motor de scraping...', timer: 1500, showConfirmButton: false
      });

      const res = await fetch(`${server}/ejecutarScript`, { method: "POST" });
      
      if (res.ok) {
        // Limpiar intervalo anterior si existe
        if(intervaloMuseos) clearInterval(intervaloMuseos);
        
        // Empezar a preguntar por los logs cada 2 segundos
        intervaloMuseos = setInterval(async () => {
          try {
            const resLog = await fetch(`${server}/logs/museos`);
            const texto = await resLog.text();
            const cajaTexto = document.getElementById("museos-json");
            cajaTexto.innerText = texto;
            
            // Hacer scroll automático hacia abajo
            cajaTexto.scrollTop = cajaTexto.scrollHeight;

            // Si dice que finalizó, detenemos las peticiones
            if(texto.includes("✅ Proceso finalizado")) {
              clearInterval(intervaloMuseos);
            }
          } catch(e) { console.error("Error leyendo logs:", e); }
        }, 2000); // 2000 ms = 2 segundos
      }
    } catch (err) {
      Swal.fire('Error', 'No se pudo conectar con el servidor.', 'error');
    }
  });

  // 2. Botón para crear eventos
  document.getElementById("btn-crear").addEventListener("click", async () => {
    try {
      Swal.fire({
        icon: 'info', title: 'Iniciando...', text: 'Buscando cartelera...', timer: 1500, showConfirmButton: false
      });

      const res = await fetch(`${server}/ejecutarScriptNightMuseums`, { method: "POST" });
      
      if (res.ok) {
        if(intervaloEventos) clearInterval(intervaloEventos);
        
        intervaloEventos = setInterval(async () => {
          try {
            const resLog = await fetch(`${server}/logs/eventos`);
            const texto = await resLog.text();
            const cajaTexto = document.getElementById("eventos-log");
            cajaTexto.innerText = texto;
            
            cajaTexto.scrollTop = cajaTexto.scrollHeight;

            if(texto.includes("✅ Proceso finalizado")) {
              clearInterval(intervaloEventos);
            }
          } catch(e) { console.error("Error leyendo logs:", e); }
        }, 2000);
      }
    } catch (err) {
      Swal.fire('Error', 'No se pudo conectar con el servidor.', 'error');
    }
  });
});