const server = "https://ollin-backend-production.up.railway.app"

document.addEventListener('DOMContentLoaded', async function () {
  // Función para manejar el clic en ambos botones 


  // const handleFavoriteClick = async (e) => {
  //   e.preventDefault();

  //   const infoName = document.getElementById("header-name");
  const nombreUsuario = document.getElementById("nombreUsuario");
  console.log(nombreUsuario.dataset.idTurista)

  const res = await fetch(`${server}/api/itinerario/obtenerItinerarios`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      id_Turista: nombreUsuario.dataset.idTurista
    })
  });

  console.log(await res.json())

  //   const data = await res.json();
  // };

  // document.getElementById('favorito').addEventListener('click', handleFavoriteClick);
  // document.getElementById('favorito1').addEventListener('click', handleFavoriteClick);
});
