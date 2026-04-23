let modal
let idTurista
//const server = "https://ollin-backend-production-d68e.up.railway.app"
function esperarUsuario() {
    return new Promise(resolve => {
        const interval = setInterval(() => {
            if (window.usuarioLogueado) {
                clearInterval(interval);
                resolve(window.usuarioLogueado);
            }
        }, 50);
    });
}

document.addEventListener("DOMContentLoaded", async function () {
        await esperarUsuario();

    const idTurista = window.usuarioLogueado.id;
    console.log("ID del turista:", idTurista);
    let turista
    $("#togglePassword").css({"display":"none"}); 
    setTimeout(async()=>{
        //idTurista = document.getElementById('nombreUsuario').dataset.idTurista;
        //Para cambiar el nombre en "header" de container-data
        console.log(idTurista)
        turista = await fetchGetUser(idTurista)
        let nombresTurista = `${turista.Nombre} ${turista.Apellido}`
        let nombreTurista = `${turista.Nombre}`
        let apellidoTurista= `${turista.Apellido}`
        let correo = `${turista.Correo}`
        let nameH = document.getElementById('name')
        let nameU = document.getElementById('nombre')
        let apelliu = document.getElementById('lastname')
        let correou = document.getElementById('email')
        console.log(nombresTurista)
        nameH.innerHTML=`<b>${nombresTurista}</b>`;
        nameU.value=nombreTurista
        apelliu.value=apellidoTurista
        correou.value = correo

    },250)

    $("#password").val("........"); 
    $('.form-profile').submit(function(event) {
        // Evitar la recarga de la página al enviar el formulario
        event.preventDefault();
    });

    $('#editPassword').click(function(){
        var valorInput = $("#password").val(); //valor original
        $("#togglePassword").css({"display":"flex"});
        $("#editPassword").prop('disabled', true);
        $("#labelPassword").text("Nueva contraseña")
        $("#password").val("")
        $("#password").prop('disabled', false);
        $("#password").prop('required', true);
        $("#password").focus();
        //$("#togglePassword").css({"display":"flex"});
        var htmlPassRE = `<label for="passwordRE" class="label-profile" id="labelPasswordRE">Confirmar Contraseña</label><br id="brPRE">
                            <div class="container-input" id="contInputPasswordRE" style="margin-bottom:0.1rem">
                                <div class="password-container" style="margin-right: 32px;">
                                    <input type="password" id="passwordRE" name="passwordRE" placeholder="Nueva contraseña" class="input-profile" required>
                                    <img src="/assets/icons/Boton ojoA.svg" alt="Mostrar contraseña" id="togglePasswordRE" onclick="TTogglePasswordRE()">
                                </div>
                                
                            </div>                           

                            <div class="btn-form-profile" id="buttomsPasswordRE" style="margin-bottom:24px">
                                <button type="button" class="btn-cancel" id="cancelUpdatePassword">
                                    Cancelar
                                </button>
                                <button type="submit" class="btn-save" id="doUpdatePassword">
                                    Aceptar
                                </button>
                            </div>
                            `;

        $("#contInputPassword").css({"margin-bottom":"0.5em"});
        htmlPassRE = htmlPassRE.trim();
        $("#updatePassword").append(htmlPassRE);  
        
        // Si se cancela
        $('#cancelUpdatePassword').click(function(){
            $("#togglePassword").css({"display":"none"});
            $("#labelPassword").text("Contraseña")
            $("#password").val(valorInput); //Regresa al valor original
            $('#contInputPassword').css({"margin-bottom":"1.2em"});
            $("#editPassword").prop('disabled', false);
            $("#password").attr("type", "password");
            $("#password").prop('disabled', true);
            $("#labelPasswordRE").remove();
            $("#brPRE").remove();
            $("#contInputPasswordRE").remove();
            $("#buttomsPasswordRE").remove();
        });
        
        // Si se confirma
        $('#doUpdatePassword').click(async function(){
            $("#togglePassword").css({"display":"none"});
            if(validatePassword()){
                //hacer fetch
                await alertsChangePw(idTurista,$('#password').val())
                $("#labelPassword").text("Contraseña")
                $("#password").val(valorInput); //Regresa al valor original
                $('#contInputPassword').css({"margin-bottom":"1.2em"});
                $("#editPassword").prop('disabled', false);
                $("#password").attr("type", "password");
                $("#password").prop('disabled', true);
                $("#labelPasswordRE").remove();
                $("#brPRE").remove();
                $("#contInputPasswordRE").remove();
                $("#buttomsPasswordRE").remove();
            }
        });    
    });

    $('#editEmail').click(function(){
        var valorInput = $("#email").val();
        $("#editEmail").prop('disabled', true);
        $('#contInputEmail').css({"margin-bottom":"0.1em"});
        
        $("#email").prop('disabled', false);
        $("#email").focus();
        
        var htmlPassRE =`<div class="btn-form-profile" id="buttomsEmail">
                            <button type="button" class="btn-cancel" id="cancelUpdateEmail">
                                Cancelar
                            </button>
                            <button type="submit" class="btn-save" id="doUpdateEmail">
                                Aceptar
                            </button>
                        </div>`;

        $("#contInputEmail").css({"margin-bottom":"0.5em"});
        htmlPassRE = htmlPassRE.trim();
        $("#updateEmail").append(htmlPassRE);


        $('#cancelUpdateEmail').click(function(){
            $("#email").val(valorInput); //Regresa al valor original
            $('#contInputEmail').css({"margin-bottom":"1.2em"});
            $('#buttomsEmail').remove();
            $("#editEmail").prop('disabled', false);
            $("#email").prop('disabled', true);
        });

        $('#doUpdateEmail').click(async function(){
            if(validateEmail()){
                await alertsChangeEmail(idTurista,$('#email').val())
                $('#contInputEmail').css({"margin-bottom":"1.2em"});
                $("#editEmail").prop('disabled', false);
                $("#email").prop('disabled', true);
                $("#buttomsEmail").remove();
            }
        });
    });
        // Para editar el nombre
        $('#editName').click(function() {
            var valorInput = $("#nombre").val();
            $("#editName").prop('disabled', true);
            $('#contInputName').css({ "margin-bottom": "0.1em" });

            $("#nombre").prop('disabled', false);
            $("#nombre").focus();

            var htmlButtons = `<div class="btn-form-profile" id="buttomsName">
                                    <button type="button" class="btn-cancel" id="cancelUpdateName">
                                        Cancelar
                                    </button>
                                    <button type="submit" class="btn-save" id="doUpdateName">
                                        Aceptar
                                    </button>
                                </div>`;

            $("#contInputName").css({ "margin-bottom": "0.5em" });
            htmlButtons = htmlButtons.trim();
            $("#updateName").append(htmlButtons);

            $('#cancelUpdateName').click(function() {
                $("#nombre").val(valorInput); // Regresa al valor original
                $('#contInputName').css({ "margin-bottom": "1.2em" });
                $('#buttomsName').remove();
                $("#editName").prop('disabled', false);
                $("#nombre").prop('disabled', true);
            });

            $('#doUpdateName').click(async function() {
                // Validación y lógica de actualización
                if(validatename()){
                await alertsChangeName(idTurista,$('#nombre').val())
                $('#contInputName').css({ "margin-bottom": "1.2em" });
                $("#editName").prop('disabled', false);
                $("#nombre").prop('disabled', true);
                $("#buttomsName").remove();
            }
            });
        });

        // Para editar el lastname
        $('#editlastname').click(function() {
            var valorInput = $("#lastname").val();
            $("#editlastname").prop('disabled', true);
            $('#contInputlastname').css({ "margin-bottom": "0.1em" });

            $("#lastname").prop('disabled', false);
            $("#lastname").focus();

            var htmlButtons = `<div class="btn-form-profile" id="buttomslastname">
                                    <button type="button" class="btn-cancel" id="cancelUpdatelastname">
                                        Cancelar
                                    </button>
                                    <button type="submit" class="btn-save" id="doUpdatelastname">
                                        Aceptar
                                    </button>
                                </div>`;

            $("#contInputlastname").css({ "margin-bottom": "0.5em" });
            htmlButtons = htmlButtons.trim();
            $("#updatelastname").append(htmlButtons);

            $('#cancelUpdatelastname').click(function() {
                $("#lastname").val(valorInput); // Regresa al valor original
                $('#contInputlastname').css({ "margin-bottom": "1.2em" });
                $('#buttomslastname').remove();
                $("#editlastname").prop('disabled', false);
                $("#lastname").prop('disabled', true);
            });

            $('#doUpdatelastname').click(async function() {
                // Validación y lógica de actualización
                if(validatelastname()){
                await alertsChangeLastName(idTurista,$('#lastname').val())
                $('#contInputlastname').css({ "margin-bottom": "1.2em" });
                $("#editlastname").prop('disabled', false);
                $("#lastname").prop('disabled', true);
                $("#buttomslastname").remove();
                }
            });
        });

        // Para editar la fecha de nacimiento
        $('#editBirthdate').click(function() {
            var valorInput = $("#birthdate").val();
            $("#editBirthdate").prop('disabled', true);
            $('#contInputBirthdate').css({ "margin-bottom": "0.1em" });

            $("#birthdate").prop('disabled', false);
            $("#birthdate").focus();

            var htmlButtons = `<div class="btn-form-profile" id="buttomsBirthdate">
                                    <button type="button" class="btn-cancel" id="cancelUpdateBirthdate">
                                        Cancelar
                                    </button>
                                    <button type="submit" class="btn-save" id="doUpdateBirthdate">
                                        Aceptar
                                    </button>
                                </div> `;

            $("#contInputBirthdate").css({ "margin-bottom": "0.5em" });
            htmlButtons = htmlButtons.trim();
            $("#updateBirthdate").append(htmlButtons);

            $('#cancelUpdateBirthdate').click(function() {
                $("#birthdate").val(valorInput); // Regresa al valor original
                $('#contInputBirthdate').css({ "margin-bottom": "1.2em" });
                $('#buttomsBirthdate').remove();
                $("#editBirthdate").prop('disabled', false);
                $("#birthdate").prop('disabled', true);
            });

            $('#doUpdateBirthdate').click(function() {
                // Validación y lógica de actualización
                $('#contInputBirthdate').css({ "margin-bottom": "1.2em" });
                $("#editBirthdate").prop('disabled', false);
                $("#birthdate").prop('disabled', true);
                $("#buttomsBirthdate").remove();
            });
        });


    /**MODAL */
    // Oculta el contenedor modal al principio
    modal = document.getElementById("cModalAlertDelete");
    modal.style.display = "none";

    // Muestra el contenedor modal al hacer clic en el botón trigger
    document.getElementById("btnDeleteAccount").addEventListener("click", async function () {
        //Cambia contenido del modal
        Swal.fire({
            title: '¿Estás seguro de que deseas eliminar tu cuenta?',
            text: "Esta acción no se puede deshacer",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: "#65B2C6",
            cancelButtonColor: "#D63D6C",
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'No, cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                // Si el usuario confirma, llama a la función para eliminar la cuenta
                deleteAcc(idTurista);
            }
        });
    });
});

//funciones para validar nombre de usuario
function validatename(){
    const username = document.getElementById('nombre');
    if(username.value.trim() == '' ){
        showAlert('El nombre de usuario no ha sido llenado')
        highlightInvalidField(username);
        return false;
    } else {
        removeHighlight(username);
    }
    return true;
}
function validatelastname(){
    const userlastname = document.getElementById('lastname');
    if(userlastname.value.trim() == '' ){
        showAlert('El apellido de usuario no ha sido llenado')
        highlightInvalidField(userlastname);
        return false;
    } else {
        removeHighlight(userlastname);
    }
    return true;
}

function validatePassword(){
    const password = document.getElementById('password');
    const passwordRE = document.getElementById('passwordRE');
    if(password.value.trim() == '' ){
        showAlert('La nueva contraseña no ha sido llenada')
        highlightInvalidField(password);
        return false;
    } else {
        removeHighlight(password);
    }
    if (passwordRE.value.trim() === '') {
        showAlert('Confirma tu contraseña');
        highlightInvalidField(passwordRE);
        return false;
    } else {
        removeHighlight(passwordRE);
    }
    if (password.value.trim() !== passwordRE.value.trim()) {
        showAlert('Los campos con la nueva contraseña no coinciden.');
        return false;
    }

    return true;
}

function validateEmail(){
    const email = document.getElementById('email');
    if(email.value.trim() == '' ){
        showAlert('El correo electrónico no ha sido llenado')
        highlightInvalidField(email);
        return false;
    } else {
        removeHighlight(email);
    }

    if(!isValidEmail(email.value.trim())){
        showAlert('Correo electrónico mal formado');
        highlightInvalidField(email);
        return false;
    } else {
        removeHighlight(email);
    }
    return true;
}

//Funcion para validar fecha de nacimiento, tomando en cuenta que debe de ser mayor de edad (18 años)
function validateDate(){
    const date = document.getElementById('date');
    if(date.value.trim() == '' ){
        showAlert('La fecha de nacimiento no ha sido llenada')
        highlightInvalidField(date);
        return false;
    } else {
        removeHighlight(date);
    }
    return true;
}

function isValidEmail(email) {
    return /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(email);
}

function showAlert(message) {
    Swal.fire({
        icon: 'error',
        title: 'Error',
        text: message,
        confirmButtonColor: "#65B2C6"
    });
}

function highlightInvalidField(field) {
    field.style.borderColor = 'red';
}

function removeHighlight(field) {
    field.style.borderColor = ''; // Reset to default
}

async function fetchGetUser(idTurista){
    try {
        const response = await fetch(`${server}/api/usuarioTurista/identificador/${idTurista}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching delete adventure places:', error);
    }
}

async function fetchChangeName(idTurista,newName){
    try {
        const response = await fetch(`${server}/api/usuarioTurista/actualizarNom`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_Turista: idTurista, Nombre: newName })
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching delete adventure places:', error);
    }
}

async function alertsChangeName(idTurista,newName){
    const res = await fetchChangeName(idTurista,newName)
    if(res['status']===201){
        Swal.fire({
            icon: 'success',
            title: '¡Éxito!',
            text: 'Se cambio el nombre con exito correctamente',
            confirmButtonColor: "#65B2C6"
        });
    }else{
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Se perdio comunicacion con la base de datos.',
            confirmButtonColor: "#65B2C6"
        });
    }
}

async function fetchChangeLastName(idTurista,newLastName){
    try {
        const response = await fetch(`${server}/api/usuarioTurista/actualizarApe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_Turista: idTurista, Apellido: newLastName })
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching delete adventure places:', error);
    }
}

async function alertsChangeLastName(idTurista,newLastName){
    const res = await fetchChangeLastName(idTurista,newLastName)
    if(res['status']===201){
        Swal.fire({
            icon: 'success',
            title: '¡Éxito!',
            text: 'Se cambio el apellido con exito correctamente',
            confirmButtonColor: "#65B2C6"
        });
    }else{
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Se perdio comunicacion con la base de datos.',
            confirmButtonColor: "#65B2C6"
        });
    }
}

async function fetchChangeEmail(idTurista,newEmail){
    try {
        const response = await fetch(`${server}/api/usuarioTurista/actualizarEmail`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_Turista: idTurista, Correo: newEmail })
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching delete adventure places:', error);
    }
}

async function alertsChangeEmail(idTurista,newEmail){
    const res = await fetchChangeEmail(idTurista,newEmail)
    if(res['status']===201){
        Swal.fire({
            icon: 'success',
            title: '¡Éxito!',
            text: 'Se cambio el apellido con exito correctamente',
            confirmButtonColor: "#65B2C6"
        });
    }else{
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Se perdio comunicacion con la base de datos.',
            confirmButtonColor: "#65B2C6"
        });
    }
}

async function fetchChangePW(idTurista,newPassword){
    try {
        const response = await fetch(`${server}/api/usuarioTurista/cambiarContrasena`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_Turista: idTurista, Contrasena: newPassword })
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching delete adventure places:', error);
    }
}

async function alertsChangePw(idTurista,newPassword){
    const res = await fetchChangePW(idTurista,newPassword)
    if(res['status']===201){
        Swal.fire({
            icon: 'success',
            title: '¡Éxito!',
            text: 'Se cambio la contraseña correctamente',
            confirmButtonColor: "#65B2C6"
        });
    }else{
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Se perdio comunicación con la base de datos.',
            confirmButtonColor: "#65B2C6"
        });
    }
}


// Oculta el contenedor modal al hacer clic en el botón de cerrar/regresar
function closeModal(){
    let modal = document.getElementById("cModalAlertDelete");
    modal.style.display = "none";
    modal.classList.toggle('active');
}

// Mostrar/ocultar contraseña confirmada
function TTogglePasswordRE(){
    const passwordREInput = document.getElementById('passwordRE');
    const togglePasswordRE = document.getElementById('togglePasswordRE');

    if (passwordREInput && togglePasswordRE) {
        const type = passwordREInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordREInput.setAttribute('type', type);

        // Cambia la imagen del botón
        togglePasswordRE.src = type === 'password' ? 'assets/icons/Boton ojoA.svg' : 'assets/icons/Boton ojoC.svg';
    }
}

// Para borrar la cuenta
function deleteAcc(idTurista){
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('userId');
    console.log('ID del usuario a eliminar:', idTurista);

fetch(`${server}/api/deleteUsuario/${idTurista}`, {
    method: 'DELETE'
})
.then(async res => {
    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || 'Error al eliminar');
    }

    return data;
})
.then(data => {
    Swal.fire({
        title: "Eliminado",
        text: "La cuenta fue eliminada con éxito",
        icon: "success"
    }).then(() => {
        window.location.href = "/despedida";
    });
})
.catch(error => {
    console.error(error);
    Swal.fire({
        title: "Error",
        text: error.message,
        icon: "error"
    });
});

}
