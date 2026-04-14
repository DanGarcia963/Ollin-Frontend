async function fetchNumMesVisitPlaces(idTurista) {
    console.log("fetchNumVisitPlaces llamada con idTurista:", idTurista);
    try {
        const response = await fetch('http://localhost:1234/api/lugarVisitado/obtenerNumMuseoVisitadoMes', {
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

async function fetchNumAnioVisitPlaces(idTurista) {
    console.log("fetchNumVisitPlaces llamada con idTurista:", idTurista);
    try {
        const response = await fetch('http://localhost:1234/api/lugarVisitado/obtenerNumMuseoVisitadoAno', {
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

async function displayVisit() {

    setTimeout(async () => {
  
      const nombreUsuario = document.getElementById("nombreUsuario");
      const idTurista = nombreUsuario.getAttribute('data-id-turista');
      const visitnumMesPlaces = await fetchNumMesVisitPlaces(idTurista);
      const visitnumAnioPlaces = await fetchNumAnioVisitPlaces(idTurista);
      const visitContainer = document.getElementById('visides');
      console.log('Numero de Museos visitados este mes:', visitnumMesPlaces.cantidad);  
      console.log('Numero de Museos visitados este anio:', visitnumAnioPlaces.cantidad);  
    }, 250); 
  
}
    function mostrarMesActual(elementId) {
      const meses = [
        "Enero", "Febrero", "Marzo", "Abril",
        "Mayo", "Junio", "Julio", "Agosto",
        "Septiembre", "Octubre", "Noviembre", "Diciembre"
      ];
      const fecha = new Date();
      const mesTexto = meses[fecha.getMonth()];  // getMonth(): 0 = enero, …, 11 = diciembre
      const el = document.getElementById(elementId);
      if (el) el.textContent = mesTexto;
    }

    // Cuando el DOM esté listo, insertamos el mes
    document.addEventListener("DOMContentLoaded", () => {
        displayVisit();
      mostrarMesActual("nombre-mes");
    });