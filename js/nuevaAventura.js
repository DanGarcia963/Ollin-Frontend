document.querySelector('.create-adventure-link').addEventListener('click', function() {
    var modal = new bootstrap.Modal(document.getElementById('nuevaAventuraModal'));
    modal.show();
});

//************************************************************************** *//


document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('formNuevaAventura');
    const createButton = form.querySelector('button[type="submit"]');

    createButton.addEventListener('click', function (event) {
        if (validateForm()) {
            showDone();
        }
    });

    function validateForm() {
        const nombreItinerario = document.getElementById('nombreItinerario');
      //  const fechaInicio = document.getElementById('fechaInicio');
      //  const today = new Date().toISOString().split('T')[0]; // Fecha de hoy en formato YYYY-MM-DD

        if (nombreItinerario.value.trim() === '') {
            showAlert('El nombre del itinerario no ha sido llenado');
            highlightInvalidField(nombreItinerario);
            return false;
        } else {
            removeHighlight(nombreItinerario);
        }

        if (nombreItinerario.value.trim().length < 5 || nombreItinerario.value.trim().length > 15) {
            showAlert('El nombre del itinerario debe tener entre 5 y 15 caracteres.');
            highlightInvalidField(nombreItinerario);
            return false;
        } else {
            removeHighlight(nombreItinerario);
        }
/*
        if (fechaInicio.value.trim() === '') {
            showAlert('La fecha de inicio no ha sido llenada');
            highlightInvalidField(fechaInicio);
            return false;
        } else {
            removeHighlight(fechaInicio);
        }

        if (fechaInicio.value < today) {
            showAlert('La fecha de inicio debe ser igual o posterior a la fecha actual.');
            highlightInvalidField(fechaInicio);
            return false;
        } else {
            removeHighlight(fechaInicio);
        }
*/
        return true;
    }

    function showAlert(message) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: message,
        });
    }

    function showDone(message) {
        Swal.fire({
            icon: "success",
            title: "¡Itinerario creado!",
            showConfirmButton: false,
            timer: 1500
        });
    }

    function highlightInvalidField(field) {
        field.style.borderColor = 'red';
    }

    function removeHighlight(field) {
        field.style.borderColor = ''; // Reset to default
    }
});




