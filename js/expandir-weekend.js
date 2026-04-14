document.addEventListener('DOMContentLoaded', function () {
    const toggleHorario = document.getElementById('ToogleHorario');
    const horario_hoy = document.querySelector('.horario-text');
    const semanal = document.querySelector('.weekend-text');
    let isToogle = true;

    if (toggleHorario && semanal) {
        toggleHorario.addEventListener('click', function () {
            const style = semanal.getAttribute('style') === 'display: flex;' ? 'display: none;' : 'display: flex;';
            const style1 = horario_hoy.getAttribute('style') === 'display: none;' ? 'display: flex;' : 'display: none;';
            horario_hoy.setAttribute('style', style1);
            semanal.setAttribute('style', style);

            isToogle = !isToogle;
            toggleHorario.src = isToogle ? 'assets/icons/expandir.png' : 'assets/icons/contraer.png';
        });
    }
});
