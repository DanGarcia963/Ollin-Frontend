// submitQueja.js
//const server = "https://ollin-backend-production-d68e.up.railway.app"

async function enviarQueja() {
    var idTurista = "1"; // Este valor podría ser dinámico según la sesión del usuario
    var categoria = document.getElementById("seleccion").value;
    var comentario = document.getElementById("comentario").value;

    if (categoria === 'Error') {
        showAlert('Especifica el tipo de error');
        return;
    }

    try {
        const response = await fetch(`${server}/api/queja/crearQueja`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id_Turista: idTurista,
                categoria: categoria,
                comentario: comentario
            })
        });

        if (!response.ok) {
            throw new Error('Error en el envío de la queja');
        }

        const responseData = await response.json();
        console.log(responseData);
        showDone('Queja enviada con éxito, en espera de ser atendida');
    } catch (error) {
        console.error('Error al enviar la queja:', error);
        showAlert('Error al enviar la queja');
    }
}

document.getElementById("btnGuardar").addEventListener("click", enviarQueja);
