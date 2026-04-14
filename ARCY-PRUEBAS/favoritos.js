const server = "https://ollin-backend-production.up.railway.app"
document.addEventListener('DOMContentLoaded', function () {
  // Función para manejar el clic en ambos botones 
  const handleFavoriteClick = async (e) => {
    e.preventDefault();

    const infoName = document.getElementById("info-name");
    const nombreUsuario = document.getElementById("nombreUsuario");

    const res = await fetch(`${server}/api/lugarFavorito/crearLugarFavorito`, {
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
  };

  document.getElementById('favorito').addEventListener('click', handleFavoriteClick);
  document.getElementById('favorito1').addEventListener('click', handleFavoriteClick);
});
