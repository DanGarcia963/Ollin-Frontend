const server = "https://ollin-backend-production.up.railway.app"
document.addEventListener("DOMContentLoaded", function() {
  document.getElementById('formNuevaAventura').addEventListener('submit', async (e) => {
      e.preventDefault();

      // Obtener el valor del itinerario y el id del turista
      const nombreItinerario = document.getElementById('nombreItinerario').value;
      const nombreUsuario = document.getElementById("nombreUsuario");
      const idTurista = nombreUsuario.dataset.idTurista; // Obtener el id del turista
      console.log("nombreUsuario:", nombreUsuario);
      console.log("ID del turista:", idTurista);

      // Validar que los campos no estén vacíos
      if (!nombreItinerario.trim() || !idTurista.trim()) {
          console.log("Los campos no pueden estar vacíos");
          return; // Detener la ejecución si alguno de los campos está vacío
      }

      if (nombreItinerario.trim().length < 5 || nombreItinerario.trim().length > 15) {
        console.log("El nombre del itinerario debe tener entre 5 y 15 caracteres.");
        return;
      }
      // Realizar la petición fetch para enviar los datos
      try {
          const res = await fetch(`${server}/api/itinerario/crearItinerario`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                  Nombre: nombreItinerario,
                  id_Turista: idTurista
              })
          });

          if (!res.ok) {
              throw new Error(`HTTP error! status: ${res.status}`);
          }

          const resultado = await res.text();
          console.log(resultado);

          setTimeout(function() {
            window.location.reload();
        }, 2000);

      } catch (error) {
          console.error('Hubo un problema con la petición Fetch:', error);
      }
  });
});
