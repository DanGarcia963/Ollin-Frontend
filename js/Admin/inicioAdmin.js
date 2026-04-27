//const server = "https://ollin-backend-production-d68e.up.railway.app"
async function fetchLoadUsers() {
  try {
      const response = await fetch(`${server}/api/usuarioTurista`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
  } catch (error) {
      console.error('Error fetching adventure places:', error);
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
      console.error('Error fetching adventure places:', error);
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
      fields: [
        'photos',
      ]
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
  const allUsers = await fetchLoadUsers();
  const quejasMuseos = await fetchLoadQuejasMuseos();
  const recommendedMuseums = await fetchRecommendedMuseums();
  
  console.log(quejasMuseos);
  console.log(allUsers);

  const usersList = document.getElementById('users-list');

  const quejasList = document.getElementById('complaints-list');

  const museumsList = document.getElementById('museum-card-template');

  usersList.innerHTML = ''; // limpiar por si acaso

  quejasList.innerHTML = ''; // limpiar por si acaso

  museumsList.innerHTML = ''; // limpiar por si acaso

  recommendedMuseums.forEach(async museum => {
    const div = document.createElement('div');
    const placeInfo = await getPhotos(museum.id_Museo);
    div.className = 'bg-[#d98f8f] min-w-40 rounded-xl p-3 hover:scale-105 transition cursor-pointer';
    div.innerHTML = `<img src="${placeInfo.photoUrls?.[0] || 'assets/icons/museum_icon.png'}"
                    alt="${museum.Nombre}" 
                    class="w-36 lg:w-full h-36 object-cover rounded-lg">

                <div class="flex flex-col lg:flex-row items-center 
                            justify-center gap-2 mt-2">
                    <img src="assets/icons/museum_icon.png" 
                            alt="museum" 
                            class="w-4 h-4">

                    <h5 class="text-sm font-semibold">
                        ${museum.Nombre}
                    </h5>
                </div>
    `;
    museumsList.appendChild(div);
  });


  quejasMuseos.forEach(queja => {
    if (queja.tiene_quejas === true) {

      const div = document.createElement('div');

  div.className = `
    flex flex-col xl:flex-row 
    items-center xl:items-center 
    justify-center xl:justify-between
    text-center xl:text-left
    bg-white rounded-xl p-3 shadow-lg
    hover:bg-gray-50 transition
  `;

      // ⚠️ Tipo_Queja es array → tomamos el primero
      const tipo = queja.Tipo_Queja?.[0] || "Sin detalles";

  div.innerHTML = `
    <div class="flex flex-col xl:flex-row items-center gap-2 xl:gap-3 w-full">

      <img 
        src="../assets/icons/museum_icon.PNG"
        class="w-12 h-12 xl:w-14 xl:h-14 rounded-lg object-cover"
        alt="museum"
      >

      <div class="text-sm min-w-0 max-w-[160px] xl:max-w-[200px]">
        <p class="font-medium text-gray-800 leading-tight truncate w-full">
          ${queja.NombreMuseo}
        </p>

        <p class="text-gray-500 text-xs truncate">
          ${tipo}
        </p>
      </div>

    </div>

    <div class="hidden 2xl:block text-xs text-gray-500 whitespace-nowrap mt-2 2xl:mt-0">
      ${queja.total_quejas_ultimo_mes} quejas
    </div>
  `;

      quejasList.appendChild(div);
    }
  });

  allUsers.forEach(user => {
    const li = document.createElement('li');

    li.className = "flex items-center space-x-2";

    li.innerHTML = `
      <span class="text-gray-700">
        <img src="../assets/icons/Perfil.PNG" class="img-nav h-10 w-10 object-scale-down" alt="Perfil" id="Perfil">
      </span>
      <span class="text-sm">${user.Nombre} ${user.Apellido}</span>
    `;

    usersList.appendChild(li);
  });

  document.getElementById("btn-crear").addEventListener("click", async () => {
  try {
    const res = await fetch(`${server}/ejecutarScript`, {
      method: "POST"
    });

    const data = await res.json();
    console.log(data);

  } catch (err) {
    console.error("Error:", err);
  }
});

});