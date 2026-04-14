const server = "https://ollin-backend-production-d68e.up.railway.app"

async function fetchNumVisitPlaces(idTurista) {
    console.log("fetchNumVisitPlaces llamada con idTurista:", idTurista);
    try {
        const response = await fetch(`${server}/api/lugarVisitado/obtenerNumMuseoVisitadoMes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idTurista })
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching favorite places:', error);
    }
}

async function displayNumVisit() {

    setTimeout(async () => {
  
      const nombreUsuario = document.getElementById("nombreUsuario");
      const idTurista = nombreUsuario.getAttribute('data-id-turista');
      
      const favoritePlaces = await fetchNumVisitPlaces(idTurista);
      const favoritesContainer = document.getElementById('favodes');
//CAMBIAR
if (favoritePlaces && favoritePlaces.length > 0) {
favoritesContainer.innerHTML = ''; // Limpiar el contenedor antes de añadir nuevas tarjetas
for (const place of favoritePlaces) {
    const placeInfo = await getInfo(place["ID LUGAR"]);
    const favoriteCardHtml = createFavoriteCard(placeInfo);
    favoritesContainer.innerHTML += favoriteCardHtml;
  }
} else {
favoritesContainer.innerHTML = `
  <div class="no-favorites-message">
    <p>No hay lugares favoritos agregados aún.</p>
    <button onclick="location.href='/inicio'">Ir a agregar</button>
  </div>
`;
}
      
    }, 250); 
  
}

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded, inicializando pantalla de favoritos");
    displayNumVisit();
  });