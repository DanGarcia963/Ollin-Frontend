let modal
let idAdmin

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
    const idAdmin = 10; // ID de prueba, reemplazar con el ID real del admin
    console.log("ID del admin después de asignar:", idAdmin);
    let admin
    $("#togglePassword").css({"display":"none"}); 
    setTimeout(async()=>{
        console.log(idAdmin)
        admin = await fetchGetUser(idAdmin)
        let nombresAdmin = `${admin.Nombre} ${admin.Apellido}`
        let nombreAdmin = `${admin.Nombre}`
        let apellidoAdmin= `${admin.Apellido}`
        let correo = `${admin.Correo}`
        
        let nameH = document.getElementById('name')
        let nameU = document.getElementById('nombre')
        let apelliu = document.getElementById('lastname')
        // let correou = document.getElementById('email') // Descomentar si usas email en el HTML
        
        nameH.innerHTML=`<b>${nombresAdmin}</b>`;
        nameU.value=nombreAdmin
        apelliu.value=apellidoAdmin
        // correou.value = correo
    },250)

    $("#password").val("........"); 
    $('.form-profile').submit(function(event) {
        event.preventDefault();
    });

    $('#editPassword').click(function(){
        var valorInput = $("#password").val(); 
        $("#togglePassword").css({"display":"flex"});
        $("#editPassword").prop('disabled', true);
        $("#labelPassword").text("Nueva contraseña")
        $("#password").val("")
        $("#password").prop('disabled', false);
        $("#password").prop('required', true);
        $("#password").focus();
        
        // PLANTILLA ACTUALIZADA CON TAILWIND (Input y botones responsivos)
        var htmlPassRE = `
            <label for="passwordRE" class="block text-sm font-bold text-gray-800 mb-2 mt-4" id="labelPasswordRE">Confirmar Contraseña</label>
            <div class="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden focus-within:border-[#438B9E] transition-colors mb-4" id="contInputPasswordRE">
                <input type="password" id="passwordRE" name="passwordRE" placeholder="Nueva contraseña" class="w-full px-4 py-3 text-gray-600 outline-none bg-transparent tracking-[0.2em]" required>
                <button type="button" class="px-4 text-gray-400 hover:text-gray-600 transition-colors" onclick="TTogglePasswordRE()">
                    <img src="/assets/icons/Boton ojoA.svg" alt="Mostrar" id="togglePasswordRE" class="w-5 h-5">
                </button>
            </div>
            <div class="flex flex-col sm:flex-row justify-end gap-3 mb-2" id="buttomsPasswordRE">
                <button type="button" class="w-full sm:w-auto text-gray-600 bg-gray-100 hover:bg-gray-200 px-6 py-2.5 rounded-xl font-bold transition-colors" id="cancelUpdatePassword">Cancelar</button>
                <button type="submit" class="w-full sm:w-auto bg-[#438B9E] text-white hover:bg-[#367282] px-6 py-2.5 rounded-xl font-bold transition-colors shadow-sm" id="doUpdatePassword">Aceptar</button>
            </div>
        `;

        $("#contInputPassword").css({"margin-bottom":"0.5em"});
        htmlPassRE = htmlPassRE.trim();
        $("#updatePassword").append(htmlPassRE);  
        
        $('#cancelUpdatePassword').click(function(){
            $("#togglePassword").css({"display":"none"});
            $("#labelPassword").text("Contraseña")
            $("#password").val(valorInput); 
            $('#contInputPassword').css({"margin-bottom":"1.2em"});
            $("#editPassword").prop('disabled', false);
            $("#password").attr("type", "password");
            $("#password").prop('disabled', true);
            $("#labelPasswordRE").remove();
            $("#contInputPasswordRE").remove();
            $("#buttomsPasswordRE").remove();
        });
        
        $('#doUpdatePassword').click(async function(){
            $("#togglePassword").css({"display":"none"});
            if(validatePassword()){
                await alertsChangePw(idAdmin,$('#password').val())
                $("#labelPassword").text("Contraseña")
                $("#password").val(valorInput); 
                $('#contInputPassword').css({"margin-bottom":"1.2em"});
                $("#editPassword").prop('disabled', false);
                $("#password").attr("type", "password");
                $("#password").prop('disabled', true);
                $("#labelPasswordRE").remove();
                $("#contInputPasswordRE").remove();
                $("#buttomsPasswordRE").remove();
            }
        });    
    });

    // Se mantiene la lógica de Email intacta, aunque no está en el HTML actual, con Tailwind aplicado por si lo agregas
    $('#editEmail').click(function(){
        var valorInput = $("#email").val();
        $("#editEmail").prop('disabled', true);
        $('#contInputEmail').css({"margin-bottom":"0.1em"});
        
        $("#email").prop('disabled', false);
        $("#email").focus();
        
        var htmlPassRE =`
            <div class="flex flex-col sm:flex-row justify-end gap-3 mt-3" id="buttomsEmail">
                <button type="button" class="w-full sm:w-auto text-gray-600 bg-gray-100 hover:bg-gray-200 px-6 py-2.5 rounded-xl font-bold transition-colors" id="cancelUpdateEmail">Cancelar</button>
                <button type="submit" class="w-full sm:w-auto bg-[#438B9E] text-white hover:bg-[#367282] px-6 py-2.5 rounded-xl font-bold transition-colors shadow-sm" id="doUpdateEmail">Aceptar</button>
            </div>
        `;

        $("#contInputEmail").css({"margin-bottom":"0.5em"});
        htmlPassRE = htmlPassRE.trim();
        $("#updateEmail").append(htmlPassRE);

        $('#cancelUpdateEmail').click(function(){
            $("#email").val(valorInput); 
            $('#contInputEmail').css({"margin-bottom":"1.2em"});
            $('#buttomsEmail').remove();
            $("#editEmail").prop('disabled', false);
            $("#email").prop('disabled', true);
        });

        $('#doUpdateEmail').click(async function(){
            if(validateEmail()){
                await alertsChangeEmail(idAdmin,$('#email').val())
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

        var htmlButtons = `
            <div class="flex flex-col sm:flex-row justify-end gap-3 mt-3" id="buttomsName">
                <button type="button" class="w-full sm:w-auto text-gray-600 bg-gray-100 hover:bg-gray-200 px-6 py-2.5 rounded-xl font-bold transition-colors" id="cancelUpdateName">Cancelar</button>
                <button type="submit" class="w-full sm:w-auto bg-[#438B9E] text-white hover:bg-[#367282] px-6 py-2.5 rounded-xl font-bold transition-colors shadow-sm" id="doUpdateName">Aceptar</button>
            </div>
        `;

        $("#contInputName").css({ "margin-bottom": "0.5em" });
        htmlButtons = htmlButtons.trim();
        $("#updateName").append(htmlButtons);

        $('#cancelUpdateName').click(function() {
            $("#nombre").val(valorInput); 
            $('#contInputName').css({ "margin-bottom": "1.2em" });
            $('#buttomsName').remove();
            $("#editName").prop('disabled', false);
            $("#nombre").prop('disabled', true);
        });

        $('#doUpdateName').click(async function() {
            if(validatename()){
                await alertsChangeName(idAdmin,$('#nombre').val())
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

        var htmlButtons = `
            <div class="flex flex-col sm:flex-row justify-end gap-3 mt-3" id="buttomslastname">
                <button type="button" class="w-full sm:w-auto text-gray-600 bg-gray-100 hover:bg-gray-200 px-6 py-2.5 rounded-xl font-bold transition-colors" id="cancelUpdatelastname">Cancelar</button>
                <button type="submit" class="w-full sm:w-auto bg-[#438B9E] text-white hover:bg-[#367282] px-6 py-2.5 rounded-xl font-bold transition-colors shadow-sm" id="doUpdatelastname">Aceptar</button>
            </div>
        `;

        $("#contInputlastname").css({ "margin-bottom": "0.5em" });
        htmlButtons = htmlButtons.trim();
        $("#updatelastname").append(htmlButtons);

        $('#cancelUpdatelastname').click(function() {
            $("#lastname").val(valorInput); 
            $('#contInputlastname').css({ "margin-bottom": "1.2em" });
            $('#buttomslastname').remove();
            $("#editlastname").prop('disabled', false);
            $("#lastname").prop('disabled', true);
        });

        $('#doUpdatelastname').click(async function() {
            if(validatelastname()){
                await alertsChangeLastName(idAdmin,$('#lastname').val())
                $('#contInputlastname').css({ "margin-bottom": "1.2em" });
                $("#editlastname").prop('disabled', false);
                $("#lastname").prop('disabled', true);
                $("#buttomslastname").remove();
            }
        });
    });

    /**MODAL */
    modal = document.getElementById("cModalAlertDelete");
    modal.style.display = "none";

    document.getElementById("btnDeleteAccount").addEventListener("click", async function () {
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
                deleteAcc(idAdmin);
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
    field.parentElement.style.borderColor = 'red'; // Cambiado para apuntar al contenedor de Tailwind
}

function removeHighlight(field) {
    field.parentElement.style.borderColor = ''; 
}

async function fetchGetUser(idAdmin){
    try {
        const response = await fetch(`${server}/api/usuarioAdmin/identificador/${idAdmin}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

async function fetchChangeName(idAdmin,newName){
    try {
        const response = await fetch(`${server}/api/usuarioAdmin/actualizarNom`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_Admin: idAdmin, Nombre: newName })
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Error updating name:', error);
    }
}

async function alertsChangeName(idAdmin,newName){
    const res = await fetchChangeName(idAdmin,newName)
    if(res['status']===201){
        Swal.fire({
            icon: 'success',
            title: '¡Éxito!',
            text: 'Se cambio el nombre con éxito correctamente',
            confirmButtonColor: "#65B2C6"
        });
    }else{
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Se perdió comunicación con la base de datos.',
            confirmButtonColor: "#65B2C6"
        });
    }
}

async function fetchChangeLastName(idAdmin,newLastName){
    try {
        const response = await fetch(`${server}/api/usuarioAdmin/actualizarApe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_Admin: idAdmin, Apellido: newLastName })
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Error updating last name:', error);
    }
}

async function alertsChangeLastName(idAdmin,newLastName){
    const res = await fetchChangeLastName(idAdmin,newLastName)
    if(res['status']===201){
        Swal.fire({
            icon: 'success',
            title: '¡Éxito!',
            text: 'Se cambio el apellido con éxito correctamente',
            confirmButtonColor: "#65B2C6"
        });
    }else{
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Se perdió comunicación con la base de datos.',
            confirmButtonColor: "#65B2C6"
        });
    }
}

async function fetchChangeEmail(idAdmin,newEmail){
    try {
        const response = await fetch(`${server}/api/usuarioAdmin/actualizarEmail`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_Admin: idAdmin, Correo: newEmail })
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Error updating email:', error);
    }
}

async function alertsChangeEmail(idAdmin,newEmail){
    const res = await fetchChangeEmail(idAdmin,newEmail)
    if(res['status']===201){
        Swal.fire({
            icon: 'success',
            title: '¡Éxito!',
            text: 'Se cambio el correo con éxito correctamente',
            confirmButtonColor: "#65B2C6"
        });
    }else{
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Se perdió comunicación con la base de datos.',
            confirmButtonColor: "#65B2C6"
        });
    }
}

async function fetchChangePW(idAdmin,newPassword){
    try {
        const response = await fetch(`${server}/api/usuarioAdmin/cambiarContrasena`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_Admin: idAdmin, Contrasena: newPassword })
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Error updating password:', error);
    }
}

async function alertsChangePw(idAdmin,newPassword){
    const res = await fetchChangePW(idAdmin,newPassword)
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
            text: 'Se perdió comunicación con la base de datos.',
            confirmButtonColor: "#65B2C6"
        });
    }
}

function closeModal(){
    let modal = document.getElementById("cModalAlertDelete");
    modal.style.display = "none";
    modal.classList.toggle('active');
}

function TTogglePasswordRE(){
    const passwordREInput = document.getElementById('passwordRE');
    const togglePasswordRE = document.getElementById('togglePasswordRE');

    if (passwordREInput && togglePasswordRE) {
        const type = passwordREInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordREInput.setAttribute('type', type);
        togglePasswordRE.src = type === 'password' ? 'assets/icons/Boton ojoA.svg' : 'assets/icons/Boton ojoC.svg';
    }
}

function deleteAcc(idAdmin){
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('userId');
    console.log('ID del usuario a eliminar:', userId);

    fetch(`${server}/api/deleteUsuario/${idAdmin}`,{
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    })
    .then(res => res.json())
    .then(data => {
        Swal.fire({
            title: "Eliminado",
            text:"La cuenta fue eliminada con éxito",
            icon: "success"
        }).then(()=>{
            window.location.href="/despedida";
        })
    })
    .catch(error => {
        console.error('Error al eliminar la cuenta:', error);
        window.location.href="/despedida";
    });
}